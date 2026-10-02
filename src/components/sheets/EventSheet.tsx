"use client";

import { useApp } from "../context";
import { FeelShape, Illustration, SheetHead, Tile } from "../ui";
import { remove, useStore } from "@/lib/client/store";
import { ENERGY, SORENESS, TYPES, moodLabel } from "@/lib/domain/constants";
import { nice } from "@/lib/domain/dates";
import { activeMinutes, eventTitle } from "@/lib/domain/derive";

export function EventSheet({ id }: { id: string }) {
  const { snapshot: s } = useStore();
  const { today, open, close, toast } = useApp();
  const e = s.events.find((x) => x.id === id);
  if (!e) {
    return <><SheetHead title="Event" onClose={close} /><div className="sheet-body"><div className="empty">This event was deleted.</div></div></>;
  }
  const d = e.details;
  const injury = d.injuryId ? s.injuries.find((i) => i.id === d.injuryId) : null;
  const rx = (d.exerciseIds ?? []).map((x) => s.exercises.find((p) => p.id === x)).filter((x) => !!x);
  const f = e.feel;
  const mins = activeMinutes(e);
  const label = e.isCheckIn ? "Check-in" : e.type ? TYPES[e.type].label : "Event";
  const series = e.repeatGroupId ? s.events.filter((x) => x.repeatGroupId === e.repeatGroupId && x.status === "planned" && x.date >= e.date) : [];

  const del = (all = false) => {
    const targets = all ? series : [e];
    if (!confirm(all ? `Delete this and the next ${targets.length - 1} weekly events?` : "Delete this event?")) return;
    for (const t of targets) remove("events", t.id);
    close();
    toast("Deleted");
  };

  return (
    <>
      <SheetHead title={label} onClose={close} />
      <div className="sheet-body">
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <Tile type={e.type} hollow={e.status === "planned"} checkIn={e.isCheckIn} />
          <h2 style={{ margin: 0, fontSize: 22, fontStretch: "110%", fontWeight: 750 }}>{eventTitle(e, s)}</h2>
        </div>
        <dl className="kv">
          <dt>When</dt><dd>{nice(e.date)}, {e.time}</dd>
          {e.status === "planned" && <><dt>Status</dt><dd>Planned</dd></>}
          {mins > 0 && <><dt>{e.type === "match" ? "Played" : "Duration"}</dt><dd>{mins} min</dd></>}
          {d.effort ? <><dt>Effort</dt><dd>{d.effort}/10</dd></> : null}
          {d.focus?.length ? <><dt>Focus</dt><dd>{d.focus.join(", ")}</dd></> : null}
          {e.type === "match" && e.status === "logged" && d.venue && <><dt>Venue</dt><dd style={{ textTransform: "capitalize" }}>{d.venue}</dd></>}
          {injury && <><dt>Injury</dt><dd>{injury.name}</dd></>}
          {d.notes && <><dt>Notes</dt><dd style={{ fontWeight: 500 }}>{d.notes}</dd></>}
        </dl>
        {f && (
          <>
            <h2 className="h2">How you felt</h2>
            <div className="panel" style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <FeelShape mood={f.mood} size={78} />
              <div>
                <b style={{ fontSize: 18 }}>{moodLabel(f.mood)}</b>
                <div className="small muted" style={{ marginTop: 4, lineHeight: 1.5 }}>
                  Energy: {ENERGY[f.energy - 1]}<br />Soreness: {SORENESS[f.soreness - 1]}
                  {f.inPain && <><br />Pain: {f.pain}/10, {f.bodyPart}</>}
                </div>
                {f.note && <p className="small" style={{ margin: "6px 0 0" }}>{f.note}</p>}
              </div>
            </div>
          </>
        )}
        {rx.length > 0 && (
          <>
            <h2 className="h2">Exercises given</h2>
            <div className="rxgrid">
              {rx.map((p) => (
                <button key={p!.id} type="button" className="rx" onClick={() => open({ kind: "exercise", id: p!.id })}>
                  <Illustration ex={p!} /><div className="nm">{p!.name}</div><div className="pr">{p!.sets} × {p!.repsOrTime}</div>
                </button>
              ))}
            </div>
          </>
        )}
        {e.status === "planned" && (
          <div className="hint" style={{ marginTop: 16 }}>Reminder: {e.reminder === "evening" ? "the evening before" : e.reminder === "none" ? "off" : "1 hour before"}.{e.repeatGroupId ? " Repeats every week." : ""}</div>
        )}
        {series.length > 1 && (
          <button type="button" className="pillbtn pill-danger" style={{ marginTop: 14 }} onClick={() => del(true)}>Delete this and later weeks</button>
        )}
      </div>
      <div className="sheet-foot">
        {e.status === "planned" && e.date <= today && <button className="pillbtn pill-turf" type="button" onClick={() => open({ kind: "log", completeId: e.id })}>Log it</button>}
        <button className="pillbtn pill-danger" type="button" onClick={() => del()}>Delete</button>
      </div>
    </>
  );
}
