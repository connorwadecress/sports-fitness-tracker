"use client";

import { useApp } from "../context";
import { Illustration, SheetHead } from "../ui";
import { apply, useStore } from "@/lib/client/store";
import { addDays, dayLetter, nice } from "@/lib/domain/dates";
import { daysDoneInWeek, setsOn } from "@/lib/domain/derive";
import { setLogPut } from "@/lib/domain/ops";

export function ExerciseSheet({ id }: { id: string }) {
  const { snapshot: s } = useStore();
  const { today, close, toast, undoToast } = useApp();
  const ex = s.exercises.find((x) => x.id === id);
  if (!ex) return <><SheetHead title="Exercise" onClose={close} /><div className="sheet-body"><div className="empty">This exercise was removed.</div></div></>;

  const n = setsOn(s, id, today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const who = ex.source === "physio" ? "physio" : "biokineticist";

  const log = (k: number) => {
    const { put, count } = setLogPut(s, id, today, k);
    apply([put]);
    if (k > 0) toast(count === ex.sets ? `${ex.name} done for today` : `Set ${count} logged`);
  };
  const removeEx = () => {
    apply([{ c: "exercises", record: { ...ex, active: false, updatedAt: Date.now() } }]);
    close();
    undoToast(`Removed ${ex.name}`, () => apply([{ c: "exercises", record: { ...ex, active: true, updatedAt: Date.now() } }]));
  };

  return (
    <>
      <SheetHead title={ex.name} onClose={close} />
      <div className="sheet-body">
        <Illustration ex={ex} className="illo big-illo" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 2px 0", gap: 12 }}>
          <div>
            <div className="num" style={{ fontSize: 40, lineHeight: 1 }} aria-live="polite">{n}<span className="muted" style={{ fontSize: 24 }}>/{ex.sets}</span></div>
            <div className="small muted">sets today, {ex.sets} × {ex.repsOrTime}</div>
          </div>
          <span className="src"><i style={{ background: ex.source === "physio" ? "var(--physio)" : "var(--bio)" }} />From your {who}</span>
        </div>
        {ex.steps.length > 0 && (
          <>
            <h2 className="h2">How to do it</h2>
            <ol className="steps">{ex.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
          </>
        )}
        <h2 className="h2">Last 7 days <small>{ex.daysPerWeek === 7 ? "every day" : `${daysDoneInWeek(s, ex, today)}/${ex.daysPerWeek} this week`}</small></h2>
        <div className="week">
          {days.map((d) => {
            const c = setsOn(s, id, d);
            return (
              <div key={d} aria-label={`${nice(d)}: ${c} of ${ex.sets} sets`}>
                <div className={`c ${c >= ex.sets ? "full" : c ? "part" : ""}`} aria-hidden="true">{c || ""}</div>
                <span aria-hidden="true">{dayLetter(d).slice(0, 1)}</span>
              </div>
            );
          })}
        </div>
        <div className="hint" style={{ marginTop: 16 }}>Stop and check with your {who} if this exercise causes sharp pain.</div>
        <button type="button" className="pillbtn pill-danger" style={{ marginTop: 14 }} onClick={removeEx}>Remove from my programme</button>
      </div>
      <div className="sheet-foot">
        <button className="pillbtn pill-ghost" type="button" onClick={() => log(-1)} disabled={!n}>Undo</button>
        <button className="pillbtn pill-turf" type="button" onClick={() => log(1)}>{n >= ex.sets ? "Log an extra set" : "Log a set"}</button>
      </div>
    </>
  );
}
