"use client";

import { useApp } from "../context";
import { EventRow } from "../common";
import { FeelShape, Icon } from "../ui";
import { useStore } from "@/lib/client/store";
import { TYPES, TYPE_KEYS } from "@/lib/domain/constants";
import { MONTHS, iso, nice, rel, weekday } from "@/lib/domain/dates";
import { dayMood, eventsOn } from "@/lib/domain/derive";
import type { EventType, PitchEvent } from "@/lib/domain/types";

/** One dot per event type (all 5 fit), filled if any of that type was logged. */
function dayDots(evs: PitchEvent[]) {
  const out: { type: EventType; planned: boolean }[] = [];
  for (const k of TYPE_KEYS) {
    const of = evs.filter((e) => e.type === k);
    if (of.length) out.push({ type: k, planned: of.every((e) => e.status === "planned") });
  }
  return out;
}

export function CalendarScreen() {
  const { snapshot: s } = useStore();
  const { today, open, calendar, setCalendar } = useApp();
  const { y, m, sel } = calendar;
  const first = iso(y, m, 1);
  const offset = (weekday(first) + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const move = (n: number) => {
    const d = new Date(Date.UTC(y, m + n, 1));
    setCalendar({ y: d.getUTCFullYear(), m: d.getUTCMonth(), sel });
  };
  const selEvents = eventsOn(s, sel).filter((e) => !e.isCheckIn || e.feel);

  return (
    <>
      <div className="topbar">
        <h1 className="display">Calendar</h1>
        <button className="pillbtn pill-turf" type="button" onClick={() => open({ kind: "log", mode: "plan" })}>Plan event</button>
      </div>
      <div className="cols cal-cols">
      <div className="col">
      <div className="calhead">
        <button className="iconbtn" type="button" onClick={() => move(-1)} aria-label="Previous month"><Icon name="back" strokeWidth={2.2} /></button>
        <b style={{ fontSize: 18, fontStretch: "110%" }} aria-live="polite">{MONTHS[m]} {y}</b>
        <button className="iconbtn" type="button" onClick={() => move(1)} aria-label="Next month"><Icon name="next" strokeWidth={2.2} /></button>
      </div>
      <div className="calgrid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="dow" aria-hidden="true">{d}</div>)}
        {Array.from({ length: offset }, (_, i) => <div key={`o${i}`} className="day out" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const ds = iso(y, m, i + 1);
          const evs = eventsOn(s, ds).filter((e) => !e.isCheckIn && e.type);
          const mood = dayMood(s, ds);
          return (
            <button key={ds} type="button" className={`day${ds === today ? " today" : ""}${ds === sel ? " sel" : ""}`}
              aria-pressed={ds === sel} aria-label={`${nice(ds)}, ${evs.length} event${evs.length === 1 ? "" : "s"}`}
              onClick={() => setCalendar({ y, m, sel: ds })}>
              <span className="d">{i + 1}</span>
              <span className="fs">{mood != null && <FeelShape mood={mood} size={22} />}</span>
              <span className="dots">
                {dayDots(evs).map((x) => <i key={x.type} className={x.planned ? "plan" : ""} style={{ background: TYPES[x.type].color, color: TYPES[x.type].color }} />)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="legend">
        {TYPE_KEYS.map((k) => <span key={k}><i style={{ background: TYPES[k].color }} />{TYPES[k].label}</span>)}
        <span><i style={{ border: "1.5px solid var(--muted)" }} />Planned</span>
      </div>

      </div>
      <div className="col">
      <h2 className="h2">{rel(sel, today)} {sel >= today && <small><button className="logit" type="button" onClick={() => open({ kind: "log", mode: "plan", date: sel })}>Add</button></small>}</h2>
      {selEvents.length
        ? <div className="list">{selEvents.map((e) => <EventRow key={e.id} e={e} s={s} />)}</div>
        : <div className="empty">{sel > today ? "Nothing planned for this day." : "Nothing logged on this day."}</div>}
      {sel <= today && (
        <div style={{ marginTop: 12 }}>
          <button className="pillbtn pill-ghost" style={{ width: "100%" }} type="button" onClick={() => open({ kind: "summary", date: sel })}>View daily summary</button>
        </div>
      )}
      </div>
      </div>
    </>
  );
}
