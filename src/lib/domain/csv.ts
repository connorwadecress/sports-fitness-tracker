// "Export all data (CSV)" from the BRD's data and compliance requirements.
// One file, one row per record, grouped by section, so it opens cleanly in a
// spreadsheet.

import { ENERGY, SORENESS, TYPES } from "./constants";
import { activeMinutes, eventTitle, matchResult } from "./derive";
import type { Snapshot } from "./types";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const line = (a: unknown[]) => a.map(cell).join(",");

export function toCsv(s: Snapshot): string {
  const out: string[] = [];
  const inj = (id?: string) => s.injuries.find((i) => i.id === id)?.name ?? "";
  const exName = (id: string) => s.exercises.find((x) => x.id === id)?.name ?? id;

  out.push("Events");
  out.push(line(["date", "time", "type", "status", "title", "active minutes", "opponent", "our score", "their score", "result", "venue", "effort", "focus or activity", "injury", "notes", "exercises given", "mood", "energy", "soreness", "pain", "body part", "feeling note"]));
  for (const e of [...s.events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))) {
    const d = e.details, f = e.feel;
    out.push(line([
      e.date, e.time, e.isCheckIn ? "Check-in" : e.type ? TYPES[e.type].label : "", e.status, eventTitle(e, s), activeMinutes(e),
      d.opponent, d.ourScore, d.theirScore, e.type === "match" && e.status === "logged" ? matchResult(e) : "", d.venue, d.effort,
      d.focus?.join("; ") ?? d.activity, inj(d.injuryId), d.notes, (d.exerciseIds ?? []).map(exName).join("; "),
      f?.mood, f ? ENERGY[f.energy - 1] : "", f ? SORENESS[f.soreness - 1] : "", f?.inPain ? f.pain : "", f?.inPain ? f.bodyPart : "", f?.note,
    ]));
  }

  out.push("", "Injuries");
  out.push(line(["name", "body part", "start date", "status", "recovered date"]));
  for (const i of s.injuries) out.push(line([i.name, i.bodyPart, i.startDate, i.status, i.recoveredDate]));

  out.push("", "Exercises");
  out.push(line(["name", "sets", "reps or time", "days per week", "source", "in programme", "added"]));
  for (const x of s.exercises) out.push(line([x.name, x.sets, x.repsOrTime, x.daysPerWeek, x.source === "physio" ? "Physio" : "Biokineticist", x.active ? "yes" : "no", x.addedDate]));

  out.push("", "Sets done");
  out.push(line(["date", "exercise", "sets"]));
  for (const l of Object.values(s.setLogs).sort((a, b) => a.date.localeCompare(b.date))) if (l.count) out.push(line([l.date, exName(l.exerciseId), l.count]));

  return out.join("\r\n");
}
