"use client";

import { useApp } from "../context";
import { EventRow, SuggestionCard } from "../common";
import { FeelShape, SheetHead } from "../ui";
import { useStore } from "@/lib/client/store";
import { DISCLAIMER, SAFETY_HIGH_PAIN, moodLabel } from "@/lib/domain/constants";
import { nice } from "@/lib/domain/dates";
import { summary } from "@/lib/domain/derive";

export function SummarySheet({ date }: { date: string }) {
  const { snapshot: s } = useStore();
  const { today, close } = useApp();
  const sm = summary(s, date);
  return (
    <>
      <SheetHead title={date === today ? "Daily summary" : nice(date)} onClose={close} />
      <div className="sheet-body">
        <div className="feelstage" style={{ color: "var(--muted)" }}>
          <FeelShape mood={sm.mood} size={130} />
          <div className="lab" style={{ color: "var(--ink)" }}>{sm.mood == null ? "No check-in" : moodLabel(sm.mood)}</div>
          <div className="small muted">{nice(date)}</div>
        </div>
        <div className="kpis" style={{ marginTop: 16 }}>
          <div className="kpi"><span className="num">{sm.minutes}</span><span className="l">active minutes</span></div>
          <div className="kpi"><span className="num">{sm.rehab.done}/{sm.rehab.target}</span><span className="l">rehab sets</span></div>
          <div className="kpi"><span className="num">{sm.pain}</span><span className="l">highest pain out of 10</span></div>
        </div>
        {sm.pain >= 7 && <div className="hint care" style={{ marginTop: 12 }} role="alert">{SAFETY_HIGH_PAIN}</div>}
        <h2 className="h2">Suggestions</h2>
        {sm.suggestions.slice(0, 4).map((x) => <SuggestionCard key={x.title} x={x} />)}
        {sm.events.length > 0 && (
          <>
            <h2 className="h2">What you logged</h2>
            <div className="list">{sm.events.map((e) => <EventRow key={e.id} e={e} s={s} />)}</div>
          </>
        )}
        <p className="small muted" style={{ marginTop: 16, lineHeight: 1.45 }}>{DISCLAIMER}</p>
      </div>
    </>
  );
}
