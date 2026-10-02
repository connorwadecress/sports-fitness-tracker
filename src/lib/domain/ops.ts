// Pure write operations. Each returns the records to put into the store, so
// the UI never has to know which collections a save touches.

import { addDays } from "./dates";
import { LIBRARY, daysPerWeekFor } from "./constants";
import { activeInjuries } from "./derive";
import type { CollectionName, Collections, EventDetails, EventType, Exercise, Feel, Injury, PitchEvent, ReminderChoice, Snapshot, Source } from "./types";

export type Put = { [K in CollectionName]: { c: K; record: Collections[K][string] } }[CollectionName];

export const uid = () => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "").slice(0, 16);
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
};

export interface CustomExerciseDraft {
  id: string;
  name: string;
  sets: number;
  repsOrTime: string;
  imageUrl?: string;
}

export interface LogDraft {
  /** Set when completing a planned event. */
  id?: string;
  type: EventType | null;
  date: string;
  time: string;
  planned: boolean;
  checkIn: boolean;
  details: EventDetails & { newInjuryName?: string; newInjuryPart?: string };
  custom: CustomExerciseDraft[];
  feel: Feel;
  reminder: ReminderChoice;
  repeatWeekly: boolean;
}

export function blankFeel(s: Snapshot): Feel {
  const inj = activeInjuries(s)[0];
  return { mood: 60, energy: 3, soreness: 2, inPain: false, bodyPart: inj?.bodyPart ?? "Left ankle", pain: 0, note: "" };
}

export function defaultDetails(type: EventType, s: Snapshot): EventDetails {
  switch (type) {
    case "match": return { opponent: "", ourScore: 0, theirScore: 0, venue: "home", minutesPlayed: 60 };
    case "practice": return { durationMin: 90, effort: 6, focus: [] };
    case "exercise": return { activity: "Run", durationMin: 30, effort: 5 };
    case "physio": return { injuryId: activeInjuries(s)[0]?.id ?? "new", durationMin: 45, notes: "", exerciseIds: [] };
    case "bio": return { durationMin: 60, notes: "", exerciseIds: [] };
  }
}

/** Turn picked library keys and custom drafts into programme records. */
export function programmeAdds(s: Snapshot, source: Source, libraryKeys: string[], custom: CustomExerciseDraft[], today: string, now: number, injuryId?: string): Exercise[] {
  const out: Exercise[] = [];
  for (const key of libraryKeys) {
    const existing = s.exercises.find((x) => x.id === key);
    if (existing) {
      if (!existing.active) out.push({ ...existing, active: true, addedDate: today, updatedAt: now });
      continue;
    }
    const lib = LIBRARY.find((l) => l.key === key);
    if (!lib) continue;
    out.push({
      id: lib.key, name: lib.name, illustrationKey: lib.key, sets: lib.sets, repsOrTime: lib.repsOrTime, daysPerWeek: daysPerWeekFor(source),
      steps: lib.steps, source, active: true, injuryId, addedDate: today, updatedAt: now,
    });
  }
  for (const c of custom) {
    out.push({
      id: c.id, name: c.name, imageUrl: c.imageUrl, sets: c.sets, repsOrTime: c.repsOrTime, daysPerWeek: daysPerWeekFor(source),
      steps: [], source, active: true, injuryId, addedDate: today, updatedAt: now,
    });
  }
  return out;
}

/** Pain in a body part with no active injury starts tracking one. */
export function injuryFromFeel(s: Snapshot, feel: Feel | null, date: string, now: number, extra: Injury[] = []): Injury | null {
  if (!feel?.inPain || !feel.bodyPart) return null;
  if ([...activeInjuries(s), ...extra].some((i) => i.bodyPart === feel.bodyPart)) return null;
  return { id: uid(), name: `${feel.bodyPart} injury`, bodyPart: feel.bodyPart, startDate: date, status: "active", updatedAt: now };
}

export interface SaveResult {
  puts: Put[];
  newInjury: Injury | null;
  firstEventId: string;
}

export function saveLog(s: Snapshot, d: LogDraft, today: string, now = Date.now()): SaveResult {
  const puts: Put[] = [];
  const feel = d.planned ? null : { ...d.feel, pain: d.feel.inPain ? d.feel.pain : 0 };
  const created: Injury[] = [];

  if (d.checkIn) {
    const ev: PitchEvent = { id: uid(), type: null, date: d.date, time: d.time, status: "logged", details: {}, feel, reminder: "none", isCheckIn: true, updatedAt: now };
    puts.push({ c: "events", record: ev });
    const inj = injuryFromFeel(s, feel, d.date, now);
    if (inj) puts.push({ c: "injuries", record: inj });
    return { puts, newInjury: inj, firstEventId: ev.id };
  }

  const type = d.type!;
  const { newInjuryName, newInjuryPart, ...details } = d.details;
  const clean: EventDetails = { ...details };

  if ((type === "physio" || type === "bio") && !d.planned) {
    if (type === "physio" && clean.injuryId === "new") {
      const part = newInjuryPart || (feel?.inPain ? feel.bodyPart : "Other");
      const name = newInjuryName?.trim() || `${part} injury`;
      const inj: Injury = { id: uid(), name, bodyPart: part, startDate: d.date, status: "active", updatedAt: now };
      created.push(inj);
      puts.push({ c: "injuries", record: inj });
      clean.injuryId = inj.id;
    }
    const keys = clean.exerciseIds ?? [];
    const adds = programmeAdds(s, type, keys, d.custom, today, now, type === "physio" ? clean.injuryId : undefined);
    for (const x of adds) puts.push({ c: "exercises", record: x });
    clean.exerciseIds = [...keys, ...d.custom.map((c) => c.id)];
  } else if (type === "physio" && clean.injuryId === "new") {
    delete clean.injuryId;
  }

  const base: PitchEvent = {
    id: d.id ?? uid(), type, date: d.date, time: d.time, status: d.planned ? "planned" : "logged",
    details: clean, feel, reminder: d.planned ? d.reminder : "none", updatedAt: now,
  };
  if (d.id) {
    const prev = s.events.find((e) => e.id === d.id);
    if (prev?.repeatGroupId) base.repeatGroupId = prev.repeatGroupId;
  }
  puts.push({ c: "events", record: base });

  if (d.planned && d.repeatWeekly && !d.id) {
    base.repeatGroupId = uid();
    for (let w = 1; w <= 5; w++) {
      puts.push({ c: "events", record: { ...base, id: uid(), date: addDays(d.date, 7 * w), details: { ...base.details } } });
    }
  }

  let newInjury: Injury | null = created[0] ?? null;
  if (!d.planned) {
    const auto = injuryFromFeel(s, feel, d.date, now, created);
    if (auto) {
      puts.push({ c: "injuries", record: auto });
      newInjury = newInjury ?? auto;
    }
  }
  return { puts, newInjury, firstEventId: base.id };
}

export function setLogPut(s: Snapshot, exerciseId: string, date: string, delta: number, now = Date.now()): { put: Put; count: number } {
  const id = `${exerciseId}:${date}`;
  const count = Math.max(0, (s.setLogs[id]?.count ?? 0) + delta);
  return { put: { c: "setLogs", record: { id, exerciseId, date, count, updatedAt: now } }, count };
}
