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

/** One CSV per table, so each opens cleanly in a spreadsheet. */
export function toCsvTables(s: Snapshot): Record<string, string> {
  const inj = (id?: string) => s.injuries.find((i) => i.id === id)?.name ?? "";
  const exName = (id: string) => s.exercises.find((x) => x.id === id)?.name ?? id;
  const table = (head: unknown[], rows: unknown[][]) => [line(head), ...rows.map(line)].join("\r\n") + "\r\n";

  const events = [...s.events].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((e) => {
    const d = e.details, f = e.feel;
    return [
      e.date, e.time, e.isCheckIn ? "Check-in" : e.type ? TYPES[e.type].label : "", e.status, eventTitle(e, s), activeMinutes(e),
      d.opponent, d.ourScore, d.theirScore, e.type === "match" && e.status === "logged" ? matchResult(e) : "", d.venue, d.effort,
      d.focus?.join("; ") ?? d.activity, inj(d.injuryId), d.notes, (d.exerciseIds ?? []).map(exName).join("; "),
      f?.mood ?? "", f ? ENERGY[f.energy - 1] ?? "" : "", f ? SORENESS[f.soreness - 1] ?? "" : "", f?.inPain ? f.pain : "", f?.inPain ? f.bodyPart : "", f?.note,
    ];
  });

  return {
    "events.csv": table(["date", "time", "type", "status", "title", "active minutes", "opponent", "our score", "their score", "result", "venue", "effort", "focus or activity", "injury", "notes", "exercises given", "mood", "energy", "soreness", "pain", "body part", "feeling note"], events),
    "injuries.csv": table(["name", "body part", "start date", "status", "recovered date"], s.injuries.map((i) => [i.name, i.bodyPart, i.startDate, i.status, i.recoveredDate])),
    "exercises.csv": table(["name", "sets", "reps or time", "days per week", "source", "in programme", "added"], s.exercises.map((x) => [x.name, x.sets, x.repsOrTime, x.daysPerWeek, x.source === "physio" ? "Physio" : "Biokineticist", x.active ? "yes" : "no", x.addedDate])),
    "sets-done.csv": table(["date", "exercise", "sets"], Object.values(s.setLogs).filter((l) => l.count).sort((a, b) => a.date.localeCompare(b.date)).map((l) => [l.date, exName(l.exerciseId), l.count])),
  };
}
