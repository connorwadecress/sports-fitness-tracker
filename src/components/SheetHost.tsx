"use client";

import { useEffect, useRef, useState } from "react";
import { useApp, type SheetSpec } from "./context";
import { LogSheet } from "./sheets/LogSheet";
import { EventSheet } from "./sheets/EventSheet";
import { ExerciseSheet } from "./sheets/ExerciseSheet";
import { AddExerciseSheet } from "./sheets/AddExerciseSheet";
import { SummarySheet } from "./sheets/SummarySheet";
import { RemindersSheet } from "./sheets/RemindersSheet";
import { AccountSheet } from "./sheets/AccountSheet";
import { AuthSheet } from "./sheets/AuthSheet";

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex]:not([tabindex="-1"])';

/** Bottom sheet with focus trap, Escape to close and focus restore. */
export function SheetHost({ spec }: { spec: SheetSpec | null }) {
  const { close } = useApp();
  const ref = useRef<HTMLElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  // Keep rendering the last sheet while it slides away; a new spec gets a fresh key.
  const [last, setLast] = useState<{ spec: SheetSpec; n: number } | null>(spec ? { spec, n: 1 } : null);
  if (spec && spec !== last?.spec) setLast({ spec, n: (last?.n ?? 0) + 1 });
  const shown = spec ?? last?.spec ?? null;
  const n = last?.n ?? 0;
  const open = spec !== null;

  useEffect(() => {
    if (!open) {
      lastFocus.current?.focus?.({ preventScroll: true });
      return;
    }
    if (!ref.current?.contains(document.activeElement)) lastFocus.current = document.activeElement as HTMLElement;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>(".sheet-body " + FOCUSABLE) ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [open, n]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab" || !ref.current) return;
      const els = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <div className={`backdrop${open ? " open" : ""}`} onClick={close} aria-hidden="true" />
      <section ref={ref} className={`sheet${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="sheetTitle" aria-hidden={!open}>
        {shown && <SheetBody key={n} spec={shown} />}
      </section>
    </>
  );
}

function SheetBody({ spec }: { spec: SheetSpec }) {
  switch (spec.kind) {
    case "log": return <LogSheet spec={spec} />;
    case "event": return <EventSheet id={spec.id} />;
    case "exercise": return <ExerciseSheet id={spec.id} />;
    case "addExercise": return <AddExerciseSheet />;
    case "summary": return <SummarySheet date={spec.date} />;
    case "reminders": return <RemindersSheet />;
    case "account": return <AccountSheet />;
    case "auth": return <AuthSheet mode={spec.mode} />;
  }
}
