// Reminder rules (spec Epic 5). The same function feeds web push from the cron
// and the in-app banner fallback, so both always agree.

import { addDays, rel, shift, stamp, toMinutes } from "./dates";
import { QUIET_HOURS, TYPES } from "./constants";
import { eventTitle, rehabToday, summary } from "./derive";
import type { Snapshot } from "./types";

export type ReminderKind = "upcoming" | "afterEvent" | "rehab" | "summary" | "quiet";

export interface Reminder {
  /** Stable key used to make sure each reminder is only sent once. */
  key: string;
  kind: ReminderKind;
  title: string;
  body: string;
  /** In-app destination, as a hash route. */
  url: string;
  /** Local "YYYY-MM-DD HH:MM" when it becomes due. */
  due: string;
}

/** Lower number wins when the daily cap is reached. */
export const REMINDER_PRIORITY: Record<ReminderKind, number> = { upcoming: 1, afterEvent: 2, rehab: 3, summary: 4, quiet: 5 };

export function inQuietHours(time: string): boolean {
  const t = toMinutes(time);
  return t >= toMinutes(QUIET_HOURS.start) || t < toMinutes(QUIET_HOURS.end);
}

/** All reminders whose due time falls in (now - lookbackMin, now]. */
export function dueReminders(s: Snapshot, now: { date: string; time: string }, lookbackMin = 24 * 60): Reminder[] {
  const r = s.settings.reminders;
  const nowStamp = stamp(now.date, now.time);
  const from = shift(now.date, now.time, -lookbackMin);
  const fromStamp = stamp(from.date, from.time);
  const inWindow = (due: string) => due > fromStamp && due <= nowStamp;
  const out: Reminder[] = [];

  for (const e of s.events) {
    if (e.status !== "planned" || !e.type) continue;
    if (r.upcoming && e.reminder !== "none") {
      const at = e.reminder === "evening" ? { date: addDays(e.date, -1), time: "19:00" } : shift(e.date, e.time, -60);
      const due = stamp(at.date, at.time);
      if (inWindow(due)) {
        const tip = e.type === "match" ? "Pack your shin guards and mouth guard." : e.type === "physio" || e.type === "bio" ? "Take your exercise sheet or questions." : "Leave 15 minutes early so you're not rushing.";
        out.push({
          key: `upcoming:${e.id}:${e.date}:${e.time}`, kind: "upcoming", due, url: "#calendar",
          title: `${eventTitle(e, s)} ${rel(e.date, at.date).toLowerCase()} at ${e.time}`, body: tip,
        });
      }
    }
    if (r.afterEvent) {
      const at = shift(e.date, e.time, 30);
      const due = stamp(at.date, at.time);
      if (inWindow(due)) {
        out.push({
          key: `after:${e.id}:${e.date}`, kind: "afterEvent", due, url: `#log=${e.id}`,
          title: `How did the ${TYPES[e.type].noun} go?`,
          body: e.type === "match" ? "Log the score while it's fresh." : "Log it while it's fresh.",
        });
      }
    }
  }

  // Daily reminders for today (and yesterday when the window crosses midnight).
  for (const date of from.date === now.date ? [now.date] : [from.date, now.date]) {
    if (r.rehab) {
      const due = stamp(date, r.rehabTime);
      const left = rehabToday(s, date).left;
      if (inWindow(due) && left > 0) {
        out.push({ key: `rehab:${date}`, kind: "rehab", due, url: "#rehab", title: `${left} rehab set${left === 1 ? "" : "s"} left today`, body: `About ${Math.max(5, left * 2)} minutes.` });
      }
    }
    if (r.summary) {
      const due = stamp(date, r.summaryTime);
      if (inWindow(due)) {
        const top = summary(s, date).suggestions[0];
        out.push({ key: `summary:${date}`, kind: "summary", due, url: "#summary", title: "Your daily summary is ready", body: `${top.title}.` });
      }
    }
    if (r.quiet) {
      const due = stamp(date, "18:00");
      const days = Math.max(1, r.quietDays);
      const silent = Array.from({ length: days }, (_, i) => addDays(date, -i)).every((d) => !s.events.some((e) => e.date === d && e.status === "logged"));
      // Only nudge if they've used the app before; a brand-new account isn't "quiet".
      if (inWindow(due) && silent && s.events.some((e) => e.status === "logged")) {
        out.push({ key: `quiet:${date}`, kind: "quiet", due, url: "#checkin", title: `You haven't logged anything in ${days} day${days === 1 ? "" : "s"}`, body: "Even a short session or a check-in keeps your history useful." });
      }
    }
  }

  return out.sort((a, b) => REMINDER_PRIORITY[a.kind] - REMINDER_PRIORITY[b.kind] || a.due.localeCompare(b.due));
}
