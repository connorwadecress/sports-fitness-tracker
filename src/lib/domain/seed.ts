// Sample data matching the prototype, for trying the app out.

import { addDays } from "./dates";
import { LIBRARY, daysPerWeekFor } from "./constants";
import { uid, type Put } from "./ops";
import type { EventDetails, EventType, Exercise, Feel, PitchEvent } from "./types";

export function sampleData(today: string, now = Date.now()): Put[] {
  const d = (n: number) => addDays(today, n);
  const puts: Put[] = [];
  const injuryId = uid();
  puts.push({ c: "injuries", record: { id: injuryId, name: "Left ankle sprain", bodyPart: "Left ankle", startDate: d(-13), status: "active", updatedAt: now } });

  const physioKeys = ["calf", "balance", "band"];
  for (const lib of LIBRARY) {
    const source = physioKeys.includes(lib.key) ? "physio" : "bio";
    const ex: Exercise = {
      id: lib.key, name: lib.name, illustrationKey: lib.key, sets: lib.sets, repsOrTime: lib.repsOrTime, daysPerWeek: daysPerWeekFor(source),
      steps: lib.steps, source, active: true, injuryId: source === "physio" ? injuryId : undefined, addedDate: source === "physio" ? d(-12) : d(-5), updatedAt: now,
    };
    puts.push({ c: "exercises", record: ex });
  }
  for (let i = -12; i <= -1; i++) {
    physioKeys.forEach((id, k) => {
      if (i % 5 === 0) return;
      const sets = LIBRARY.find((l) => l.key === id)!.sets;
      puts.push({ c: "setLogs", record: { id: `${id}:${d(i)}`, exerciseId: id, date: d(i), count: (i + k) % 4 === 0 ? 1 : sets, updatedAt: now } });
    });
  }
  for (const i of [-5, -3, -1]) for (const id of ["bridge", "wallsit", "plank"]) {
    puts.push({ c: "setLogs", record: { id: `${id}:${d(i)}`, exerciseId: id, date: d(i), count: LIBRARY.find((l) => l.key === id)!.sets, updatedAt: now } });
  }

  const f = (mood: number, energy: number, soreness: number, pain = 0): Feel => ({ mood, energy, soreness, pain, inPain: pain > 0, bodyPart: pain > 0 ? "Left ankle" : "", note: "" });
  const ev = (type: EventType, n: number, time: string, details: EventDetails, feel: Feel | null, planned = false): void => {
    const e: PitchEvent = { id: uid(), type, date: d(n), time, status: planned ? "planned" : "logged", details, feel, reminder: planned ? "1h" : "none", updatedAt: now };
    puts.push({ c: "events", record: e });
  };
  ev("match", -13, "10:00", { opponent: "Eagles HC", ourScore: 1, theirScore: 2, venue: "away", minutesPlayed: 50 }, f(30, 2, 4, 7));
  ev("physio", -12, "15:30", { injuryId, durationMin: 45, notes: "Grade 1 sprain. No running for 10 days. Do the three exercises every day.", exerciseIds: physioKeys }, f(45, 3, 3, 5));
  ev("physio", -7, "15:30", { injuryId, durationMin: 40, notes: "Swelling down. Light jogging allowed.", exerciseIds: [] }, f(62, 3, 2, 3));
  ev("practice", -6, "16:00", { durationMin: 90, effort: 6, focus: ["Skills"] }, f(70, 4, 2, 2));
  ev("bio", -5, "14:00", { durationMin: 60, notes: "Strength block for hips and core to protect the ankle.", exerciseIds: ["bridge", "wallsit", "plank"] }, f(66, 3, 3));
  ev("exercise", -4, "07:00", { activity: "Gym", durationMin: 40, effort: 5 }, f(74, 4, 2));
  ev("practice", -3, "16:00", { durationMin: 75, effort: 7, focus: ["Set pieces", "Game play"] }, f(78, 4, 3, 2));
  ev("match", -2, "09:30", { opponent: "Northview", ourScore: 3, theirScore: 1, venue: "home", minutesPlayed: 60 }, f(90, 3, 3, 3));
  ev("physio", 0, "15:30", { injuryId }, null, true);
  ev("practice", 1, "16:00", {}, null, true);
  ev("practice", 3, "16:00", {}, null, true);
  ev("match", 5, "10:30", { opponent: "Ridgeway" }, null, true);
  ev("bio", 6, "14:00", {}, null, true);
  return puts;
}
