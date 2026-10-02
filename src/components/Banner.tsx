"use client";

import { useEffect, useMemo, useState } from "react";
import { dueReminders, type Reminder } from "@/lib/domain/reminders";
import { toMinutes } from "@/lib/domain/dates";
import type { Snapshot } from "@/lib/domain/types";
import { pushState } from "@/lib/client/push";

// When push isn't on, reminders show as in-app banners on next open (US-5.1).

const KEY = "pitchside-banners-shown";
function shownKeys(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function markShown(k: string) {
  try { localStorage.setItem(KEY, JSON.stringify([k, ...shownKeys()].slice(0, 200))); } catch { /* ignore */ }
}

export function useInAppReminders(snap: Snapshot | null, now: { date: string; time: string }): Reminder | null {
  const [pushOn, setPushOn] = useState<boolean | null>(null);
  const [current, setCurrent] = useState<Reminder | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () => pushState().then((s) => { if (alive) setPushOn(s === "on"); });
    check();
    document.addEventListener("visibilitychange", check);
    return () => { alive = false; document.removeEventListener("visibilitychange", check); };
  }, []);

  // Everything that has fallen due so far today.
  const due = useMemo(() => (snap ? dueReminders(snap, now, toMinutes(now.time) + 1) : []), [snap, now]);

  useEffect(() => {
    if (pushOn !== false || current) return;
    const seen = new Set(shownKeys());
    const next = due.find((r) => !seen.has(r.key));
    if (!next) return;
    const t = setTimeout(() => { markShown(next.key); setCurrent(next); }, 1200);
    return () => clearTimeout(t);
  }, [due, pushOn, current]);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), 6000);
    return () => clearTimeout(t);
  }, [current]);

  return current;
}

export function Banner({ item }: { item: Reminder | null }) {
  const [last, setLast] = useState<Reminder | null>(null);
  if (item && item !== last) setLast(item);
  const shown = item ?? last;
  return (
    <button
      type="button"
      className={`banner${item ? " show" : ""}`}
      aria-hidden={!item}
      tabIndex={item ? 0 : -1}
      onClick={() => { if (shown) location.hash = shown.url; setLast(null); }}
    >
      <span className="app" aria-hidden="true">P</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "flex", gap: 8 }}><b>{shown?.title}</b><span className="when">now</span></span>
        <p>{shown?.body}</p>
      </span>
    </button>
  );
}
