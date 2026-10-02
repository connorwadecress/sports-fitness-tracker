"use client";

import { useApp } from "./context";
import { FeelShape, Illustration, SetDots, Tile } from "./ui";
import { eventSubtitle, eventTitle, daysDoneInWeek, setsOn, type Suggestion } from "@/lib/domain/derive";
import type { Exercise, PitchEvent, Snapshot } from "@/lib/domain/types";

export function EventRow({ e, s, sub }: { e: PitchEvent; s: Snapshot; sub?: string }) {
  const { open } = useApp();
  return (
    <button type="button" className="row" onClick={() => open({ kind: "event", id: e.id })}>
      <Tile type={e.type} hollow={e.status === "planned"} checkIn={e.isCheckIn} />
      <span className="txt">
        <span className="t">{eventTitle(e, s)}</span>
        <span className="s">{sub ?? eventSubtitle(e)}</span>
      </span>
      {e.feel?.mood != null && <FeelShape mood={e.feel.mood} size={32} />}
    </button>
  );
}

export function ExerciseCard({ ex, s, today }: { ex: Exercise; s: Snapshot; today: string }) {
  const { open } = useApp();
  const n = setsOn(s, ex.id, today);
  return (
    <button type="button" className="rx" onClick={() => open({ kind: "exercise", id: ex.id })}>
      <Illustration ex={ex} />
      <div className="nm">{ex.name}</div>
      <div className="pr">{ex.sets} × {ex.repsOrTime}</div>
      <div className="sets" aria-label={`${n} of ${ex.sets} sets done today`}>
        <SetDots done={n} sets={ex.sets} />
        {ex.daysPerWeek !== 7 && <span className="muted small" style={{ marginLeft: 4 }}>{daysDoneInWeek(s, ex, today)}/{ex.daysPerWeek} this week</span>}
      </div>
    </button>
  );
}

const KIND_COLOR: Record<Suggestion["kind"], string> = { care: "var(--care)", rest: "var(--practice)", rehab: "var(--physio)", move: "var(--exercise)", good: "var(--good)" };

export function SuggestionCard({ x }: { x: Suggestion }) {
  return (
    <div className="sugg">
      <span className="k" style={{ background: KIND_COLOR[x.kind] }} />
      <div><b>{x.title}</b><p>{x.body}</p></div>
    </div>
  );
}
