"use client";

import { useApp } from "../context";
import { ExerciseCard } from "../common";
import { apply, useStore } from "@/lib/client/store";
import { daysBetween, short } from "@/lib/domain/dates";
import { activeExercises, activeInjuries, painSeries, pastInjuries, rehabToday, treatmentSessions, weeklyAdherence } from "@/lib/domain/derive";
import type { Injury, Snapshot } from "@/lib/domain/types";

export function RehabScreen() {
  const { snapshot: s } = useStore();
  const { today, open } = useApp();
  const act = activeInjuries(s), past = pastInjuries(s);
  const ex = activeExercises(s);
  const physio = ex.filter((x) => x.source === "physio"), bio = ex.filter((x) => x.source === "bio");
  const reh = rehabToday(s, today);
  const pct = weeklyAdherence(s, today);

  return (
    <>
      <div className="topbar">
        <h1 className="display">Rehab</h1>
        <button className="pillbtn pill-ghost" type="button" onClick={() => open({ kind: "addExercise" })}>Add exercise</button>
      </div>
      <div className="cols">
      <div className="col">
      {act.length
        ? act.map((i) => <InjuryCard key={i.id} inj={i} s={s} today={today} />)
        : <div className="empty">No active injuries. Nice.<br />If you pick up a knock, switch it on when you log how you feel.</div>}

      <h2 className="h2">Last 7 days <small>{pct}% of sets done</small></h2>
      <div className="panel">
        <div className="bar" style={{ margin: 0 }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Rehab done this week"><i style={{ width: `${pct}%` }} /></div>
        <p className="small muted" style={{ margin: "10px 0 0" }}>Today: {reh.done} of {reh.target} daily sets. Strength exercises from your biokineticist count 3 days a week.</p>
      </div>

      {past.length > 0 && <PastInjuries past={past} />}
      </div>
      <div className="col col-wide">
      {physio.length > 0 && (
        <>
          <h2 className="h2"><span className="src"><i style={{ background: "var(--physio)" }} />From your physio</span><small>every day</small></h2>
          <div className="rxgrid">{physio.map((x) => <ExerciseCard key={x.id} ex={x} s={s} today={today} />)}</div>
        </>
      )}
      {bio.length > 0 && (
        <>
          <h2 className="h2"><span className="src"><i style={{ background: "var(--bio)" }} />From your biokineticist</span><small>3 days a week</small></h2>
          <div className="rxgrid">{bio.map((x) => <ExerciseCard key={x.id} ex={x} s={s} today={today} />)}</div>
        </>
      )}
      {!ex.length && (
        <>
          <h2 className="h2">Your programme</h2>
          <div className="empty">No exercises yet. Log a physio or biokineticist session, or tap Add exercise.</div>
        </>
      )}

      </div>
      </div>
    </>
  );
}

function PastInjuries({ past }: { past: Injury[] }) {
  return (
    <>
      <h2 className="h2">Past injuries</h2>
      <div className="list">
        {past.map((i) => (
          <div key={i.id} className="row">
            <span className="txt"><span className="t">{i.name}</span><span className="s">{short(i.startDate)} to {i.recoveredDate ? short(i.recoveredDate) : "?"}</span></span>
          </div>
        ))}
      </div>
    </>
  );
}

function InjuryCard({ inj, s, today }: { inj: Injury; s: Snapshot; today: string }) {
  const { undoToast } = useApp();
  const days = daysBetween(inj.startDate, today);
  const pts = painSeries(s, inj).map((p) => p.pain);
  const sessions = treatmentSessions(s, inj);
  const recover = () => {
    apply([{ c: "injuries", record: { ...inj, status: "recovered", recoveredDate: today, updatedAt: Date.now() } }]);
    undoToast(`Great news. ${inj.name} marked as recovered`, () => apply([{ c: "injuries", record: { ...inj, updatedAt: Date.now() } }]));
  };

  let spark = null;
  if (pts.length > 1) {
    const w = 280, h = 56;
    const xs = pts.map((_, k) => 8 + (k * (w - 16)) / (pts.length - 1));
    const ys = pts.map((p) => 8 + (1 - p / 10) * (h - 16));
    spark = (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`Pain went from ${pts[0]} to ${pts[pts.length - 1]} out of 10`}>
        <path d={xs.map((x, k) => `${k ? "L" : "M"}${x} ${ys[k]}`).join("")} fill="none" stroke="var(--care)" strokeWidth="2.5" strokeLinejoin="round" />
        {xs.map((x, k) => <circle key={k} cx={x} cy={ys[k]} r="3.5" fill="var(--surface)" stroke="var(--care)" strokeWidth="2" />)}
      </svg>
    );
  }

  return (
    <div className="injury">
      <h4 className="wrap-any">{inj.name}</h4>
      <div className="meta">Day {days} since {short(inj.startDate)}. {sessions} treatment session{sessions === 1 ? "" : "s"}.</div>
      {spark && (
        <div style={{ marginTop: 12 }}>
          <div className="small muted" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Pain you logged</span><span>{pts[0]}/10 {pts[pts.length - 1] <= pts[0] ? "down" : "up"} to {pts[pts.length - 1]}/10</span>
          </div>
          {spark}
        </div>
      )}
      {pts.length === 1 && <p className="small muted" style={{ margin: "10px 0 0" }}>Pain logged: {pts[0]}/10. Log how you feel after sessions to see the trend.</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="pillbtn pill-ghost" type="button" onClick={recover}>Mark as recovered</button>
      </div>
    </div>
  );
}
