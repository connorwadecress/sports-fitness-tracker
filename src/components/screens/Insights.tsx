"use client";

import { useApp } from "../context";
import { FeelShape } from "../ui";
import { useStore } from "@/lib/client/store";
import { TYPES, TYPE_KEYS } from "@/lib/domain/constants";
import { addDays, dayLetter, nice, rel } from "@/lib/domain/dates";
import { insights, summary } from "@/lib/domain/derive";

export function InsightsScreen() {
  const { snapshot: s } = useStore();
  const { today, open } = useApp();
  const ins = insights(s, today);
  const W = 330, H = 150, bw = 26, gap = (W - 7 * bw) / 7;
  const max = Math.max(120, ...ins.minutesByDay.map((d) => d.total));
  const history = Array.from({ length: 5 }, (_, i) => addDays(today, -i - 1));
  const { win, draw, loss } = ins.record;
  const chartLabel = ins.minutesByDay.map((d) => `${nice(d.date)}: ${d.total} minutes`).join("; ");

  return (
    <>
      <div className="topbar"><h1 className="display">Insights</h1></div>
      <div className="kpis">
        <div className="kpi"><span className="num">{win}–{draw}–{loss}</span><span className="l">won, drew, lost in 30 days</span></div>
        <div className="kpi"><span className="num">{ins.sessions}</span><span className="l">training sessions this week</span></div>
        <div className="kpi"><span className="num">{ins.adherence}%</span><span className="l">rehab done this week</span></div>
      </div>

      <h2 className="h2">Active minutes <small>last 7 days</small></h2>
      <div className="panel">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Active minutes per day. ${chartLabel}`}>
          {ins.minutesByDay.map((d, i) => {
            const x = gap / 2 + i * (bw + gap);
            let y = H - 22;
            return (
              <g key={d.date}>
                {TYPE_KEYS.map((k) => {
                  const v = d.byType[k];
                  if (!v) return null;
                  const h = (v / max) * (H - 34);
                  y -= h;
                  return <rect key={k} x={x} y={y} width={bw} height={Math.max(h - 2, 1)} rx="5" fill={TYPES[k].color}><title>{`${TYPES[k].label}: ${v} min`}</title></rect>;
                })}
                {d.total > 0 && <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize="10" fill="var(--muted)">{d.total}</text>}
                <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--muted)">{dayLetter(d.date)}</text>
              </g>
            );
          })}
        </svg>
        <div className="legend" style={{ marginTop: 6 }}>
          {TYPE_KEYS.map((k) => <span key={k}><i style={{ background: TYPES[k].color }} />{TYPES[k].label}</span>)}
        </div>
      </div>

      <h2 className="h2">How you&apos;ve felt</h2>
      <div className="panel" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", gap: 4, color: "var(--muted)" }}>
        {ins.moods.map((d) => (
          <div key={d.date} aria-label={`${nice(d.date)}: ${d.mood == null ? "no check-in" : `mood ${d.mood} out of 100`}`}>
            <div style={{ height: 40, display: "grid", placeItems: "center" }}><FeelShape mood={d.mood} size={36} /></div>
            <div className="small" aria-hidden="true">{dayLetter(d.date)}</div>
          </div>
        ))}
      </div>

      <h2 className="h2">Past summaries</h2>
      <div className="list">
        {history.map((d) => {
          const sm = summary(s, d);
          return (
            <button key={d} type="button" className="row" onClick={() => open({ kind: "summary", date: d })}>
              <span style={{ color: "var(--muted)" }}><FeelShape mood={sm.mood} size={34} /></span>
              <span className="txt"><span className="t">{rel(d, today)}</span><span className="s">{sm.suggestions[0].title}</span></span>
            </button>
          );
        })}
      </div>
    </>
  );
}
