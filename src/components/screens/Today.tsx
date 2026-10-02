"use client";

import { useApp } from "../context";
import { EventRow, ExerciseCard } from "../common";
import { FeelShape, Icon, Tile } from "../ui";
import { useStore } from "@/lib/client/store";
import { moodLabel } from "@/lib/domain/constants";
import { addDays, nice, rel, toMinutes } from "@/lib/domain/dates";
import { activeExercises, byTime, eventTitle, eventsOn, summary } from "@/lib/domain/derive";

export function TodayScreen() {
  const { snapshot: s, meta, syncStatus } = useStore();
  const { today, now, open, go } = useApp();
  const sm = summary(s, today);
  const h = Math.floor(toMinutes(now.time) / 60);
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const name = s.settings.name || meta.account?.name;
  const planned = eventsOn(s, today).filter((e) => e.status === "planned");
  const overdue = s.events.filter((e) => e.status === "planned" && e.date < today && e.date >= addDays(today, -14)).sort(byTime);
  const logged = eventsOn(s, today, false);
  const upcoming = s.events.filter((e) => e.status === "planned" && e.date > today).sort(byTime).slice(0, 3);
  const exercises = activeExercises(s);
  const top = sm.suggestions[0];
  const toLog = [...overdue, ...planned];

  return (
    <>
      <div className="topbar">
        <div>
          <p className="sub">{greet}{name ? `, ${name}` : ""}</p>
          <h1 className="display">{nice(today)}</h1>
        </div>
        <div className="mobile-only" style={{ display: "flex", gap: 8 }}>
          <button className="iconbtn" type="button" onClick={() => open({ kind: "reminders" })} aria-label="Reminders"><Icon name="bell" /></button>
          <button className="iconbtn" type="button" onClick={() => open({ kind: "account" })} aria-label={syncStatus === "signedOut" ? "Account, signed out" : "Account and data"}>
            <Icon name="user" />{syncStatus === "signedOut" && <span className="badge" />}
          </button>
        </div>
      </div>

      <div className="cols">
      <div className="col">
      <section className="daycard" aria-label="Today so far">
        <div className="shape"><FeelShape mood={sm.mood} size={84} /></div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{sm.mood == null ? "How are you feeling?" : `Feeling ${moodLabel(sm.mood).toLowerCase()}`}</div>
          <div className="stats">
            <div className="stat"><span className="num">{sm.minutes}</span><span>active min</span></div>
            <div className="stat"><span className="num">{sm.rehab.done}/{sm.rehab.target}</span><span>rehab sets</span></div>
          </div>
        </div>
        <div className="tip"><p><b>{top.title}</b>{top.body}</p></div>
        <div style={{ gridColumn: "1/-1", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="pillbtn pill-on-turf" type="button" onClick={() => open({ kind: "summary", date: today })}>Daily summary</button>
          <button className="pillbtn pill-soft" type="button" onClick={() => open({ kind: "log", mode: "checkin" })}>{logged.some((e) => e.isCheckIn) ? "Update how I feel" : "Log how I feel"}</button>
        </div>
      </section>

      {toLog.length > 0 && (
        <>
          <h2 className="h2">{overdue.length ? "Still to log" : "Planned today"}</h2>
          <div className="list">
            {toLog.map((e) => (
              <div key={e.id} className="row">
                <Tile type={e.type} hollow />
                <span className="txt"><span className="t">{eventTitle(e, s)}</span><span className="s">{e.date === today ? e.time : `${rel(e.date, today)}, ${e.time}`}</span></span>
                <button className="logit" type="button" onClick={() => open({ kind: "log", completeId: e.id })}>Log it</button>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="h2">Logged today <small>{logged.length ? `${logged.length} event${logged.length > 1 ? "s" : ""}` : ""}</small></h2>
      {logged.length
        ? <div className="list">{logged.map((e) => <EventRow key={e.id} e={e} s={s} />)}</div>
        : <div className="empty">Nothing logged yet today.<br />Log a match, practice or session after it happens.</div>}

      </div>
      <div className="col">
      {exercises.length > 0 && (

        <>
          <h2 className="h2">Rehab today <small><button className="logit" type="button" onClick={() => go("rehab")}>See all</button></small></h2>
          <div className="rehabstrip">{exercises.map((x) => <ExerciseCard key={x.id} ex={x} s={s} today={today} />)}</div>
        </>
      )}

      <h2 className="h2">Coming up</h2>
      {upcoming.length
        ? <div className="list">{upcoming.map((e) => <EventRow key={e.id} e={e} s={s} sub={`${rel(e.date, today)}, ${e.time}`} />)}</div>
        : <div className="empty">Nothing planned. Add practices and matches in the calendar to get reminders.</div>}
      </div>
      </div>
    </>
  );
}

