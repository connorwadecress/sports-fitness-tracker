// Everything calculated rather than stored: results, active minutes, streaks,
// rehab adherence and the rule-based suggestions (spec Epic 6).

import { addDays, daysBetween, stamp } from "./dates";
import { TRAINING_TYPES, TYPES } from "./constants";
import type { Exercise, Injury, PitchEvent, Snapshot } from "./types";

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

export const byTime = (a: PitchEvent, b: PitchEvent) => stamp(a.date, a.time).localeCompare(stamp(b.date, b.time));

export function eventsOn(s: Snapshot, date: string, includePlanned = true): PitchEvent[] {
  return s.events.filter((e) => e.date === date && (includePlanned || e.status === "logged")).sort(byTime);
}

export const isTraining = (e: PitchEvent) => !e.isCheckIn && e.status === "logged" && !!e.type && TRAINING_TYPES.includes(e.type);

/** Active minutes: durations of sessions plus minutes played in matches. Check-ins never count. */
export function activeMinutes(e: PitchEvent): number {
  if (e.isCheckIn || e.status !== "logged" || !e.type) return 0;
  if (e.type === "match") return e.details.minutesPlayed ?? 0;
  return e.details.durationMin ?? 0;
}

export type Result = "win" | "loss" | "draw";
export function matchResult(e: PitchEvent): Result {
  const us = e.details.ourScore ?? 0, them = e.details.theirScore ?? 0;
  return us > them ? "win" : us < them ? "loss" : "draw";
}

export function eventTitle(e: PitchEvent, s?: Snapshot): string {
  if (e.isCheckIn) return "Check-in";
  const d = e.details;
  switch (e.type) {
    case "match": {
      if (e.status === "planned") return `Match against ${d.opponent || "TBC"}`;
      const r = matchResult(e);
      return `${r === "win" ? "Won" : r === "loss" ? "Lost" : "Drew"} ${d.ourScore ?? 0}–${d.theirScore ?? 0} against ${d.opponent || "opponent"}`;
    }
    case "practice": return "Hockey practice";
    case "exercise": return d.activity ? `${d.activity} session` : "Own training";
    case "physio": {
      const inj = s && d.injuryId ? s.injuries.find((i) => i.id === d.injuryId) : null;
      return inj ? `Physio: ${inj.name}` : "Physio session";
    }
    case "bio": return "Biokineticist session";
    default: return "Event";
  }
}

export function eventSubtitle(e: PitchEvent): string {
  const p = [e.time];
  if (e.status === "planned") return [...p, "Planned"].join(", ");
  const mins = activeMinutes(e);
  if (mins) p.push(`${mins} min`);
  if (e.details.effort) p.push(`effort ${e.details.effort}/10`);
  if (e.type === "match" && e.details.venue) p.push(e.details.venue);
  if (e.feel?.inPain && e.feel.pain) p.push(`pain ${e.feel.pain}/10`);
  return p.join(", ");
}

export function dayMood(s: Snapshot, date: string): number | null {
  const m = eventsOn(s, date, false).filter((e) => e.feel).map((e) => e.feel!.mood);
  const a = avg(m);
  return a == null ? null : Math.round(a);
}

/* ---------------- rehab ---------------- */

export const setsOn = (s: Snapshot, exerciseId: string, date: string) => s.setLogs[`${exerciseId}:${date}`]?.count ?? 0;

export const activeExercises = (s: Snapshot) => s.exercises.filter((x) => x.active).sort((a, b) => a.addedDate.localeCompare(b.addedDate) || a.name.localeCompare(b.name));

export function rehabToday(s: Snapshot, date: string) {
  const daily = activeExercises(s).filter((p) => p.daysPerWeek === 7);
  const target = daily.reduce((a, p) => a + p.sets, 0);
  const done = daily.reduce((a, p) => a + Math.min(setsOn(s, p.id, date), p.sets), 0);
  return { target, done, left: Math.max(0, target - done) };
}

/** Days in the 7 days ending `date` with at least one set logged. */
export function daysDoneInWeek(s: Snapshot, ex: Exercise, date: string): number {
  let n = 0;
  for (let i = 0; i < 7; i++) if (setsOn(s, ex.id, addDays(date, -i)) > 0) n++;
  return n;
}

/** Share of prescribed sets done over the 7 days ending `date`, 0–100. */
export function weeklyAdherence(s: Snapshot, date: string): number {
  let done = 0, possible = 0;
  for (const ex of activeExercises(s)) {
    const daysAvailable = Math.min(7, Math.max(1, daysBetween(ex.addedDate, date) + 1));
    const expected = Math.min(ex.daysPerWeek, daysAvailable);
    let credit = 0;
    for (let i = 0; i < 7; i++) credit += Math.min(setsOn(s, ex.id, addDays(date, -i)), ex.sets) / ex.sets;
    done += Math.min(credit, expected);
    possible += expected;
  }
  return possible ? Math.round((done / possible) * 100) : 0;
}

/* ---------------- injuries ---------------- */

export const activeInjuries = (s: Snapshot) => s.injuries.filter((i) => i.status === "active").sort((a, b) => a.startDate.localeCompare(b.startDate));
export const pastInjuries = (s: Snapshot) => s.injuries.filter((i) => i.status === "recovered").sort((a, b) => (b.recoveredDate ?? "").localeCompare(a.recoveredDate ?? ""));

export function painSeries(s: Snapshot, inj: Injury): { date: string; pain: number }[] {
  return s.events
    .filter((e) => e.status === "logged" && e.feel?.inPain && e.feel.bodyPart === inj.bodyPart && e.date >= inj.startDate && (!inj.recoveredDate || e.date <= inj.recoveredDate))
    .sort(byTime)
    .map((e) => ({ date: e.date, pain: e.feel!.pain }));
}

export function treatmentSessions(s: Snapshot, inj: Injury): number {
  return s.events.filter(
    (e) => e.status === "logged" && (e.type === "physio" || e.type === "bio") && e.date >= inj.startDate && (!inj.recoveredDate || e.date <= inj.recoveredDate) &&
      (e.type === "bio" || !e.details.injuryId || e.details.injuryId === inj.id),
  ).length;
}

/* ---------------- summary + suggestions ---------------- */

export type SuggestionKind = "care" | "rest" | "rehab" | "move" | "good";
export interface Suggestion { kind: SuggestionKind; priority: number; title: string; body: string }

export interface DaySummary {
  date: string;
  minutes: number;
  mood: number | null;
  pain: number;
  rehab: { target: number; done: number; left: number };
  streak: number;
  suggestions: Suggestion[];
  events: PitchEvent[];
}

function trainedOn(s: Snapshot, date: string) {
  return eventsOn(s, date, false).some(isTraining);
}

export function summary(s: Snapshot, date: string): DaySummary {
  const evs = eventsOn(s, date, false);
  const minutes = evs.reduce((a, e) => a + activeMinutes(e), 0);
  const feels = evs.filter((e) => e.feel).map((e) => e.feel!);
  const moodAvg = avg(feels.map((f) => f.mood));
  const mood = moodAvg == null ? null : Math.round(moodAvg);
  const pain = feels.length ? Math.max(...feels.map((f) => (f.inPain ? f.pain : 0))) : 0;
  const rehab = rehabToday(s, date);

  let streak = 0;
  while (streak < 30 && trainedOn(s, addDays(date, -streak))) streak++;

  const quiet = [0, 1, 2].every((i) => eventsOn(s, addDays(date, -i), false).length === 0);
  const nextMatch = s.events.filter((e) => e.type === "match" && e.status === "planned" && e.date > date).sort(byTime)[0];
  const daysToMatch = nextMatch ? daysBetween(date, nextMatch.date) : null;
  const hadMatch = evs.some((e) => e.type === "match");

  const out: Suggestion[] = [];
  if (pain >= 6) out.push({ kind: "care", priority: 1, title: `Pain at ${pain}/10, ease right off`, body: "Skip hard training tomorrow and tell your physio about it before your next session. Rest tonight." });
  if (hadMatch) out.push({ kind: "rest", priority: 2, title: "Recovery day tomorrow", body: "After a match your legs need 24 to 48 hours. Go for a light walk, stretch, or take the day off." });
  if (streak >= 5) out.push({ kind: "rest", priority: 2, title: "Take a rest day", body: `You've trained ${streak} days in a row. One full rest day keeps you sharp and lowers your injury risk.` });
  else if (minutes >= 150) out.push({ kind: "rest", priority: 3, title: "Big day, keep tomorrow light", body: `${minutes} active minutes today. Sleep well and keep tomorrow easy.` });
  if (daysToMatch != null && daysToMatch <= 2) {
    const opp = nextMatch!.details.opponent;
    out.push({ kind: "rest", priority: 3, title: daysToMatch === 1 ? "Match tomorrow" : "Match in 2 days", body: `You play ${opp || "your next match"} ${daysToMatch === 1 ? "tomorrow" : "soon"}. Keep training short and sharp, eat well and get to bed early.` });
  }
  if (mood != null && mood < 35) out.push({ kind: "care", priority: 3, title: "A low day", body: "Sleep and an easy evening will help more than extra training. If low days keep coming, talk to someone you trust." });
  if (quiet && pain < 6) out.push({ kind: "move", priority: 3, title: "It's been quiet for a few days", body: "Nothing logged in 3 days. A 20-minute jog or stick-work session is enough to get going again." });
  else if (!minutes && !evs.some(isTraining) && pain < 6 && streak === 0 && daysToMatch !== 1 && !hadMatch)
    out.push({ kind: "move", priority: 5, title: "Get moving today", body: "No training logged yet. A short session or a walk counts, and your rehab sets are a good start." });
  if (rehab.target && rehab.left > 0) out.push({ kind: "rehab", priority: 4, title: `${rehab.left} rehab set${rehab.left === 1 ? "" : "s"} still to do`, body: `Your physio exercises work best done every day. They take about ${Math.max(5, rehab.left * 2)} minutes.` });
  else if (rehab.target) out.push({ kind: "good", priority: 6, title: "Rehab done for today", body: "All your physio sets are ticked off. That consistency is what gets you back on the pitch." });
  if (!out.length) out.push({ kind: "good", priority: 9, title: "Balanced day", body: "Good mix of work and recovery. Keep it going." });

  out.sort((a, b) => a.priority - b.priority);
  return { date, minutes, mood, pain, rehab, streak, suggestions: out, events: evs };
}

/* ---------------- insights ---------------- */

export function insights(s: Snapshot, today: string) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const minutesByDay = days.map((d) => {
    const o: Partial<Record<keyof typeof TYPES, number>> = {};
    for (const e of eventsOn(s, d, false)) if (e.type && activeMinutes(e)) o[e.type] = (o[e.type] ?? 0) + activeMinutes(e);
    return { date: d, byType: o, total: Object.values(o).reduce((a, b) => a + (b ?? 0), 0) };
  });
  const since30 = addDays(today, -30);
  const matches = s.events.filter((e) => e.type === "match" && e.status === "logged" && e.date > since30 && e.date <= today);
  const record = { win: 0, draw: 0, loss: 0 };
  for (const m of matches) record[matchResult(m)]++;
  const since7 = addDays(today, -7);
  const sessions = s.events.filter((e) => e.status === "logged" && !e.isCheckIn && (e.type === "practice" || e.type === "exercise") && e.date > since7 && e.date <= today).length;
  return { days, minutesByDay, record, sessions, adherence: weeklyAdherence(s, today), moods: days.map((d) => ({ date: d, mood: dayMood(s, d) })) };
}
