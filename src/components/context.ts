"use client";

import { createContext, useContext } from "react";

export type Tab = "today" | "calendar" | "rehab" | "insights";

export type SheetSpec =
  | { kind: "log"; mode?: "plan" | "checkin"; date?: string; completeId?: string; type?: import("@/lib/domain/types").EventType }
  | { kind: "event"; id: string }
  | { kind: "exercise"; id: string }
  | { kind: "addExercise" }
  | { kind: "summary"; date: string }
  | { kind: "reminders" }
  | { kind: "account" }
  | { kind: "auth"; mode: "signin" | "signup" };

export interface AppApi {
  today: string;
  now: { date: string; time: string };
  tab: Tab;
  go: (t: Tab) => void;
  open: (s: SheetSpec) => void;
  close: () => void;
  toast: (msg: string, delayMs?: number) => void;
  /** Calendar month view state, so planning can jump to a date. */
  calendar: { y: number; m: number; sel: string };
  setCalendar: (c: { y: number; m: number; sel: string }) => void;
  serverConfigured: boolean;
}

export const AppContext = createContext<AppApi | null>(null);

export function useApp(): AppApi {
  const v = useContext(AppContext);
  if (!v) throw new Error("useApp outside AppContext");
  return v;
}
