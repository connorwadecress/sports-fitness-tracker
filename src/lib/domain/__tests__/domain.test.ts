import { describe, expect, it } from "vitest";
import { addDays, daysBetween, nowIn, shift, weekday } from "../dates";
import { DEFAULT_REMINDERS } from "../constants";
import { activeMinutes, eventTitle, firstDataDate, rehabToday, summary, treatmentSessions, weeklyAdherence, painSeries, insights } from "../derive";
import { blankFeel, saveLog, setLogPut, type LogDraft, type Put } from "../ops";
import { dueReminders, inQuietHours } from "../reminders";
import { sampleData } from "../seed";
import { toCsvTables } from "../csv";
import { crc32, zipFiles } from "../zip";
import type { Collections, PitchEvent, Snapshot } from "../types";

const TODAY = "2026-10-02"; // a Friday

function empty(): Snapshot {
  return { events: [], injuries: [], exercises: [], setLogs: {}, settings: { id: "settings", reminders: { ...DEFAULT_REMINDERS }, timeZone: "Africa/Johannesburg", updatedAt: 0 } };
}

function applyPuts(s: Snapshot, puts: Put[]): Snapshot {
  const c: Collections = { events: {}, injuries: {}, exercises: {}, setLogs: { ...s.setLogs }, settings: {} };
  for (const e of s.events) c.events[e.id] = e;
  for (const i of s.injuries) c.injuries[i.id] = i;
  for (const x of s.exercises) c.exercises[x.id] = x;
  for (const p of puts) (c[p.c] as Record<string, unknown>)[p.record.id] = p.record;
  return { ...s, events: Object.values(c.events), injuries: Object.values(c.injuries), exercises: Object.values(c.exercises), setLogs: c.setLogs as Snapshot["setLogs"] };
}

function draft(s: Snapshot, patch: Partial<LogDraft>): LogDraft {
  return { type: "match", date: TODAY, time: "10:00", planned: false, checkIn: false, details: {}, custom: [], feel: blankFeel(s), reminder: "1h", repeatWeekly: false, ...patch };
}

const ev = (p: Partial<PitchEvent>): PitchEvent => ({ id: Math.random().toString(36).slice(2), type: "practice", date: TODAY, time: "16:00", status: "logged", details: {}, feel: null, reminder: "none", updatedAt: 1, ...p });

describe("dates", () => {
  it("does calendar maths without time-zone drift", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-09-28", TODAY)).toBe(4);
    expect(weekday(TODAY)).toBe(5);
    expect(shift("2026-10-02", "00:30", -60)).toEqual({ date: "2026-10-01", time: "23:30" });
    expect(shift("2026-10-02", "23:50", 30)).toEqual({ date: "2026-10-03", time: "00:20" });
  });
  it("reads local time in a time zone", () => {
    expect(nowIn("Africa/Johannesburg", new Date("2026-10-02T22:30:00Z"))).toEqual({ date: "2026-10-03", time: "00:30" });
  });
});

describe("logging", () => {
  it("titles a match and computes the result", () => {
    const s = empty();
    const r = saveLog(s, draft(s, { details: { opponent: "Northview", ourScore: 3, theirScore: 1, venue: "home", minutesPlayed: 60 } }), TODAY);
    const e = r.puts.find((p) => p.c === "events")!.record as PitchEvent;
    expect(eventTitle(e)).toBe("Won 3–1 against Northview");
    expect(activeMinutes(e)).toBe(60);
  });

  it("starts tracking an injury when pain is reported in a new body part", () => {
    const s = empty();
    const feel = { ...blankFeel(s), inPain: true, bodyPart: "Hamstring", pain: 4 };
    const r = saveLog(s, draft(s, { type: "practice", details: { durationMin: 90, effort: 6, focus: [] }, feel }), TODAY);
    expect(r.newInjury?.name).toBe("Hamstring injury");
    const s2 = applyPuts(s, r.puts);
    const again = saveLog(s2, draft(s2, { type: "practice", details: { durationMin: 60, effort: 5, focus: [] }, feel }), TODAY);
    expect(again.newInjury).toBeNull();
  });

  it("adds physio exercises to the programme and creates a named new injury", () => {
    const s = empty();
    const r = saveLog(s, draft(s, { type: "physio", details: { injuryId: "new", newInjuryName: "Right knee strain", newInjuryPart: "Right knee", durationMin: 45, notes: "", exerciseIds: ["calf"] }, custom: [{ id: "cx", name: "Step-ups", sets: 2, repsOrTime: "10 reps" }] }), TODAY);
    const s2 = applyPuts(s, r.puts);
    expect(s2.injuries.map((i) => i.name)).toEqual(["Right knee strain"]);
    expect(s2.exercises.map((x) => [x.id, x.source, x.daysPerWeek])).toEqual([["calf", "physio", 7], ["cx", "physio", 7]]);
    const e = s2.events[0];
    expect(e.details.exerciseIds).toEqual(["calf", "cx"]);
    expect(e.details.injuryId).toBe(s2.injuries[0].id);
  });

  it("creates 6 events for a weekly repeat and planned events carry no feelings", () => {
    const s = empty();
    const r = saveLog(s, draft(s, { type: "practice", date: "2026-10-05", planned: true, repeatWeekly: true }), TODAY);
    const events = r.puts.filter((p) => p.c === "events").map((p) => p.record as PitchEvent);
    expect(events).toHaveLength(6);
    expect(events.map((e) => e.date)).toEqual(["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"]);
    expect(new Set(events.map((e) => e.repeatGroupId)).size).toBe(1);
    expect(events.every((e) => e.status === "planned" && e.feel === null)).toBe(true);
  });

  it("completing a planned event replaces it", () => {
    const s = empty();
    const planned = ev({ id: "p1", type: "match", status: "planned", details: { opponent: "Ridgeway" } });
    s.events.push(planned);
    const r = saveLog(s, draft(s, { id: "p1", details: { opponent: "Ridgeway", ourScore: 2, theirScore: 2, venue: "away", minutesPlayed: 70 } }), TODAY);
    const s2 = applyPuts(s, r.puts);
    expect(s2.events).toHaveLength(1);
    expect(s2.events[0].status).toBe("logged");
    expect(eventTitle(s2.events[0])).toBe("Drew 2–2 against Ridgeway");
  });

  it("check-ins never count as training", () => {
    const s = empty();
    const r = saveLog(s, draft(s, { checkIn: true, type: null, feel: { ...blankFeel(s), mood: 60 } }), TODAY);
    const s2 = applyPuts(s, r.puts);
    const sm = summary(s2, TODAY);
    expect(sm.minutes).toBe(0);
    expect(sm.streak).toBe(0);
    expect(sm.mood).toBe(60);
  });

  it("doesn't store feelings the player never set", () => {
    const s = empty();
    const r = saveLog(s, draft(s, { type: "practice", details: { durationMin: 60, effort: 5, focus: [] } }), TODAY);
    const e = r.puts.find((p) => p.c === "events")!.record as PitchEvent;
    expect(e.feel).toBeNull();
    const s2 = applyPuts(s, r.puts);
    expect(summary(s2, TODAY).mood).toBeNull();
  });

  it("updating a check-in keeps the same event", () => {
    const s = empty();
    const first = saveLog(s, draft(s, { checkIn: true, type: null, feel: { ...blankFeel(s), mood: 40 } }), TODAY);
    const s2 = applyPuts(s, first.puts);
    const again = saveLog(s2, draft(s2, { id: first.firstEventId, checkIn: true, type: null, feel: { ...blankFeel(s2), mood: 80 } }), TODAY);
    const s3 = applyPuts(s2, again.puts);
    expect(s3.events).toHaveLength(1);
    expect(s3.events[0].feel?.mood).toBe(80);
  });

  it("only counts sessions linked to the injury", () => {
    let s = empty();
    s = applyPuts(s, saveLog(s, draft(s, { type: "physio", details: { injuryId: "new", newInjuryName: "Knee", durationMin: 45, notes: "", exerciseIds: [] } }), TODAY).puts);
    s = applyPuts(s, saveLog(s, draft(s, { type: "bio", details: { durationMin: 60, notes: "", exerciseIds: [] } }), TODAY).puts);
    expect(treatmentSessions(s, s.injuries[0])).toBe(1);
    s = applyPuts(s, saveLog(s, draft(s, { type: "bio", details: { injuryId: s.injuries[0].id, durationMin: 60, notes: "", exerciseIds: [] } }), TODAY).puts);
    expect(treatmentSessions(s, s.injuries[0])).toBe(2);
  });
});

describe("rehab", () => {
  it("counts sets, never below zero", () => {
    let s = empty();
    s = applyPuts(s, saveLog(s, draft(s, { type: "physio", details: { injuryId: "new", newInjuryName: "Ankle", durationMin: 45, notes: "", exerciseIds: ["calf", "band"] } }), TODAY).puts);
    expect(rehabToday(s, TODAY)).toEqual({ target: 5, done: 0, left: 5 });
    const down = setLogPut(s, "calf", TODAY, -1);
    expect(down.count).toBe(0);
    for (let i = 0; i < 4; i++) s = applyPuts(s, [setLogPut(s, "calf", TODAY, 1).put]);
    // 4 logged, but only 3 prescribed count towards the target
    expect(rehabToday(s, TODAY)).toEqual({ target: 5, done: 3, left: 2 });
    expect(weeklyAdherence(s, TODAY)).toBe(50); // calf done, band not: half of today's exercises
  });
});

describe("suggestions", () => {
  it("puts high pain first and match recovery second", () => {
    const s = empty();
    s.events.push(ev({ type: "match", details: { ourScore: 1, theirScore: 0, minutesPlayed: 70 }, feel: { ...blankFeel(s), inPain: true, bodyPart: "Left knee", pain: 7 } }));
    const sm = summary(s, TODAY);
    expect(sm.suggestions[0].title).toBe("Pain at 7/10, ease right off");
    expect(sm.suggestions[1].title).toBe("Recovery day tomorrow");
  });

  it("suggests a rest day after 5 days in a row", () => {
    const s = empty();
    for (let i = 0; i < 5; i++) s.events.push(ev({ date: addDays(TODAY, -i), details: { durationMin: 60, effort: 5 } }));
    expect(summary(s, TODAY).suggestions.map((x) => x.title)).toContain("Take a rest day");
  });

  it("flags a big day, a low mood and an upcoming match", () => {
    const s = empty();
    s.events.push(ev({ details: { durationMin: 120 }, feel: { ...blankFeel(s), mood: 20 } }));
    s.events.push(ev({ type: "exercise", time: "07:00", details: { durationMin: 45 } }));
    s.events.push(ev({ type: "match", status: "planned", date: addDays(TODAY, 1), details: { opponent: "Eagles" } }));
    const titles = summary(s, TODAY).suggestions.map((x) => x.title);
    expect(titles).toEqual(expect.arrayContaining(["Big day, keep tomorrow light", "Match tomorrow", "A low day"]));
  });

  it("advises rest, not 'get moving', after pain, soreness or a drained day", () => {
    const s = empty();
    s.events.push(ev({ date: addDays(TODAY, -5), details: { durationMin: 60 } }));
    s.events.push(ev({ isCheckIn: true, type: null, feel: { ...blankFeel(s), mood: 50, energy: 1, soreness: 5, inPain: true, bodyPart: "Right ankle", pain: 3 } }));
    const titles = summary(s, TODAY).suggestions.map((x) => x.title);
    expect(titles[0]).toBe("Pain at 3/10, take it easy today");
    expect(titles).not.toContain("Get moving today");
    expect(titles).not.toContain("It's been quiet for a few days");
    // Still leads when a match was also played today.
    s.events.push(ev({ type: "match", details: { ourScore: 1, theirScore: 0, minutesPlayed: 60 } }));
    expect(summary(s, TODAY).suggestions[0].title).toBe("Pain at 3/10, take it easy today");
  });

  it("training load excludes treatment time", () => {
    const s = empty();
    s.events.push(ev({ type: "physio", details: { durationMin: 90 } }));
    s.events.push(ev({ type: "bio", details: { durationMin: 90 } }));
    const sm = summary(s, TODAY);
    expect(sm.minutes).toBe(180);
    expect(sm.suggestions.map((x) => x.title)).not.toContain("Big day, keep tomorrow light");
  });

  it("welcomes a brand-new profile instead of calling it quiet", () => {
    const s = empty();
    expect(summary(s, TODAY).suggestions[0].title).toBe("Welcome to Pitchside");
    expect(firstDataDate(s)).toBeNull();
    s.events.push(ev({ date: addDays(TODAY, -1), details: { durationMin: 30 } }));
    // Only 2 days of history, so it can't have been quiet for 3.
    expect(summary(s, addDays(TODAY, 1)).suggestions.map((x) => x.title)).not.toContain("It's been quiet for a few days");
  });

  it("nudges after 3 quiet days and says balanced when nothing applies", () => {
    const q = empty();
    q.events.push(ev({ date: addDays(TODAY, -6), details: { durationMin: 30 } }));
    expect(summary(q, TODAY).suggestions[0].title).toBe("It's been quiet for a few days");
    const s = empty();
    s.events.push(ev({ details: { durationMin: 60 } }));
    expect(summary(s, TODAY).suggestions[0].title).toBe("Balanced day");
  });
});

describe("reminders", () => {
  it("knows quiet hours", () => {
    expect(inQuietHours("21:30")).toBe(true);
    expect(inQuietHours("03:00")).toBe(true);
    expect(inQuietHours("06:30")).toBe(false);
    expect(inQuietHours("20:30")).toBe(false);
  });

  it("fires an hour before, and asks to log 30 minutes after", () => {
    const s = empty();
    s.events.push(ev({ id: "m1", type: "match", status: "planned", time: "10:30", reminder: "1h", details: { opponent: "Ridgeway" } }));
    const before = dueReminders(s, { date: TODAY, time: "09:35" }, 10);
    expect(before.map((r) => r.kind)).toEqual(["upcoming"]);
    expect(before[0].title).toBe("Match against Ridgeway today at 10:30");
    const after = dueReminders(s, { date: TODAY, time: "11:05" }, 10);
    expect(after.map((r) => [r.kind, r.url])).toEqual([["afterEvent", "#log=m1"]]);
  });

  it("evening-before reminders fire the day before at 19:00", () => {
    const s = empty();
    s.events.push(ev({ type: "practice", status: "planned", date: addDays(TODAY, 1), reminder: "evening" }));
    expect(dueReminders(s, { date: TODAY, time: "19:05" }, 10)[0].title).toBe("Hockey practice tomorrow at 16:00");
  });

  it("only reminds about rehab when sets are left, and respects switches", () => {
    let s = empty();
    s = applyPuts(s, saveLog(s, draft(s, { type: "bio", details: { durationMin: 60, notes: "", exerciseIds: [] } }), TODAY).puts);
    expect(dueReminders(s, { date: TODAY, time: "17:05" }, 10).map((r) => r.kind)).toEqual([]);
    s = applyPuts(s, saveLog(s, draft(s, { type: "physio", details: { injuryId: "new", newInjuryName: "A", durationMin: 45, notes: "", exerciseIds: ["band"] } }), TODAY).puts);
    expect(dueReminders(s, { date: TODAY, time: "17:05" }, 10)[0].title).toBe("2 rehab sets left today");
    s.settings = { ...s.settings, reminders: { ...s.settings.reminders, rehab: false } };
    expect(dueReminders(s, { date: TODAY, time: "17:05" }, 10)).toEqual([]);
  });

  it("nudges when it goes quiet, but not for a brand-new user", () => {
    const s = empty();
    expect(dueReminders(s, { date: TODAY, time: "18:05" }, 10)).toEqual([]);
    s.events.push(ev({ date: addDays(TODAY, -3) }));
    expect(dueReminders(s, { date: TODAY, time: "18:05" }, 10)[0].kind).toBe("quiet");
  });
});

describe("sample data, injuries and export", () => {
  it("builds a believable history", () => {
    const s = applyPuts(empty(), sampleData(TODAY));
    const inj = s.injuries[0];
    expect(painSeries(s, inj).map((p) => p.pain)).toEqual([7, 5, 3, 2, 2, 3]);
    const ins = insights(s, TODAY);
    expect(ins.record).toEqual({ win: 1, draw: 0, loss: 1 });
    expect(ins.minutesByDay).toHaveLength(7);
    const csv = toCsvTables(s);
    expect(Object.keys(csv)).toEqual(["events.csv", "injuries.csv", "exercises.csv", "sets-done.csv"]);
    expect(csv["events.csv"]).toContain("Won 3–1 against Northview");
    expect(csv["injuries.csv"].split("\r\n")[0]).toBe("name,body part,start date,status,recovered date");
  });

  it("writes a valid zip", () => {
    expect(crc32(new TextEncoder().encode("hello"))).toBe(0x3610a686);
    const z = zipFiles({ "a.csv": "x,y\r\n", "b.csv": "z\r\n" });
    const v = new DataView(z.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(z.length - 22, true)).toBe(0x06054b50);
    expect(v.getUint16(z.length - 12, true)).toBe(2);
  });
});
