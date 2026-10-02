"use client";

import type { ReactNode } from "react";
import { TYPES } from "@/lib/domain/constants";
import type { EventType, Exercise } from "@/lib/domain/types";

/* ---------------- icons ---------------- */

const TYPE_PATHS: Record<EventType, ReactNode> = {
  match: <><path d="M8 3l5 12.5c.6 1.6 1.6 2.5 3.4 2.5H20" /><circle cx="6" cy="18" r="2" /></>,
  practice: <><path d="M12 3L7 19h10z" /><path d="M4 19h16M9.6 11h4.8" /></>,
  exercise: <path d="M12 4a2 2 0 1 0 0 .1M9 21l2-6-3-3 3-4 3 3h3M11 15l3 2v4" />,
  physio: <path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 9a1.5 1.5 0 0 1 3 0v4a7 7 0 0 1-7 7h-.5A6 6 0 0 1 6 16.5L4.3 13a1.5 1.5 0 0 1 2.6-1.5L8 13" />,
  bio: <><path d="M9 8a3 3 0 0 1 6 0" /><path d="M8 10h8l1.2 8.2A2 2 0 0 1 15.2 21H8.8a2 2 0 0 1-2-2.8z" /></>,
};

const UI_PATHS = {
  today: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  rehab: <path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" />,
  insights: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  bell: <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  cloud: <path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z" />,
};
export type IconName = keyof typeof UI_PATHS;

export function Icon({ name, strokeWidth = 2 }: { name: IconName; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {UI_PATHS[name]}
    </svg>
  );
}

export function TypeIcon({ type }: { type: EventType }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {TYPE_PATHS[type]}
    </svg>
  );
}

/** Coloured square for an event type. Hollow and dashed when planned. */
export function Tile({ type, hollow, checkIn }: { type: EventType | null; hollow?: boolean; checkIn?: boolean }) {
  if (checkIn || !type) {
    return <span className="tile" style={{ background: "var(--turf)", color: "var(--on-turf)" }}><Icon name="heart" /></span>;
  }
  const c = TYPES[type].color;
  return (
    <span className={`tile${hollow ? " hollow" : ""}`} style={{ background: c, color: hollow ? c : undefined }}>
      <TypeIcon type={type} />
    </span>
  );
}

/* ---------------- mood shape ---------------- */
// An original design: a layered blob that is spiky and grey-blue when low,
// smooth and warm amber when high.

function hexToRgb(h: string) { return [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16)); }
function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
export function feelColor(m: number) {
  const t = m / 100;
  return t < 0.5 ? mix("#7C88A8", "#1FA79E", t * 2) : mix("#1FA79E", "#F29F33", (t - 0.5) * 2);
}
function blob(m: number, R: number, phase: number) {
  const t = m / 100, a = 0.03 + 0.17 * (1 - t), j = 0.09 * (1 - t) * (1 - t), r0 = R / (1 + a + j);
  let p = "";
  for (let i = 0; i <= 120; i++) {
    const th = (i / 120) * Math.PI * 2;
    const r = r0 * (1 + a * Math.cos(7 * (th + phase)) + j * Math.cos(13 * th + 1.3));
    p += (i ? "L" : "M") + (50 + r * Math.sin(th)).toFixed(2) + " " + (50 - r * Math.cos(th)).toFixed(2);
  }
  return p + "Z";
}

export function FeelShape({ mood, size = 40 }: { mood: number | null; size?: number }) {
  if (mood == null) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="5" strokeDasharray="10 9" />
      </svg>
    );
  }
  const c = feelColor(mood);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d={blob(mood, 48, 0)} fill={c} fillOpacity=".28" />
      <path d={blob(mood, 36, 0.12)} fill={c} fillOpacity=".55" />
      <path d={blob(mood, 23, 0.24)} fill={c} />
      <circle cx="50" cy="50" r="3.2" fill="#fff" fillOpacity=".95" />
    </svg>
  );
}

/* ---------------- exercise illustrations ---------------- */
// Drawn in-house, never copied from other apps (BRD dependency).

const FIG: Record<string, ReactNode> = {
  calf: <><line className="floor" x1="12" y1="82" x2="108" y2="82" /><circle cx="56" cy="15" r="7" /><path d="M56 22l1 26M56.5 28l1.5 18M57 48l1 16v11M58 75l7 6" /><path className="acc" d="M86 72V46M80 52l6-6 6 6" /><path className="acc" strokeDasharray="3 4" d="M58 81h-6" /></>,
  balance: <><line className="floor" x1="12" y1="82" x2="108" y2="82" /><circle cx="60" cy="14" r="7" /><path d="M60 21v27M60 28l-20 6M60 28l20 6M60 48l-2 16v16M58 80h-6M60 48l11 12-5 12" /><path className="acc" d="M88 22a10 10 0 1 1-1 0M88 26v6l4 2" /></>,
  band: <><line className="floor" x1="8" y1="82" x2="112" y2="82" /><circle cx="28" cy="43" r="7" /><path d="M30 50l4 28M31 56l20 13M34 78h58M92 78l3-9" /><path className="acc" d="M51 69Q74 58 95 70" /><path className="acc" d="M96 74l12-4" /></>,
  bridge: <><line className="floor" x1="8" y1="82" x2="112" y2="82" /><circle cx="18" cy="74" r="6" /><path d="M27 78l31-20 20-6 4 28h8M27 79h22" /><path className="acc" d="M58 48V32M52 38l6-6 6 6" /></>,
  wallsit: <><line className="floor" x1="12" y1="82" x2="108" y2="82" /><path d="M36 10v72" strokeWidth="5" stroke="var(--line)" /><circle cx="46" cy="22" r="7" /><path d="M45 29v27h27v25h8M45 35l17 8" /><path className="acc" d="M94 32a10 10 0 1 1-1 0M94 36v6l4 2" /></>,
  plank: <><line className="floor" x1="8" y1="82" x2="112" y2="82" /><circle cx="21" cy="59" r="6" /><path d="M30 64v17M22 81h16M30 64l74 16" /><path className="acc" d="M31 62l3-24" /></>,
  custom: <><line className="floor" x1="12" y1="82" x2="108" y2="82" /><circle cx="60" cy="18" r="7" /><path d="M60 25v25M60 31l-14 12M60 31l14 12M60 50l-8 30M60 50l8 30" /></>,
};

export function Illustration({ ex, className = "illo" }: { ex: Pick<Exercise, "name" | "imageUrl" | "illustrationKey"> | null; className?: string }) {
  if (ex?.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- local data URL, nothing to optimise
    return <img className={className} src={ex.imageUrl} alt={`Photo of ${ex.name}`} />;
  }
  const k = ex?.illustrationKey && FIG[ex.illustrationKey] ? ex.illustrationKey : "custom";
  return (
    <svg className={className} viewBox="0 0 120 90" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={`${ex?.name ?? "Exercise"} illustration`}>
      {FIG[k]}
    </svg>
  );
}

/* ---------------- controls ---------------- */

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="chip" aria-pressed={on} onClick={onClick}>{children}</button>;
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" className="switch" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([k, l]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

export function SheetHead({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return (
    <div className="sheet-head">
      {onBack ? <button className="iconbtn" type="button" onClick={onBack} aria-label="Back"><Icon name="back" strokeWidth={2.2} /></button> : <span style={{ width: 44 }} />}
      <h3 id="sheetTitle">{title}</h3>
      <button className="iconbtn" type="button" onClick={onClose} aria-label="Close"><Icon name="close" strokeWidth={2.2} /></button>
    </div>
  );
}

export function SetDots({ done, sets }: { done: number; sets: number }) {
  return <>{Array.from({ length: sets }, (_, i) => <i key={i} className={i < done ? "on" : ""} />)}</>;
}
