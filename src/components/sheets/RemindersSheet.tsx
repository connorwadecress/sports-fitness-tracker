"use client";

import { useEffect, useState } from "react";
import { useApp } from "../context";
import { SheetHead, Switch } from "../ui";
import { updateSettings, useStore } from "@/lib/client/store";
import { disablePush, enablePush, pushState, type PushState } from "@/lib/client/push";
import { QUIET_HOURS } from "@/lib/domain/constants";
import type { ReminderSettings } from "@/lib/domain/types";

export function RemindersSheet() {
  const { snapshot: s, meta } = useStore();
  const { close, toast, open } = useApp();
  const r = s.settings.reminders;
  const [push, setPush] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const setR = (patch: Partial<ReminderSettings>) => updateSettings({ reminders: { ...r, ...patch } });

  // Re-check while open: the permission prompt may be answered after the sheet opens.
  useEffect(() => {
    const check = () => void pushState().then(setPush);
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const st = await enablePush(true);
      setPush(st);
      toast(st === "on" ? "Notifications on" : st === "denied" ? "Notifications are blocked in your browser settings" : "Couldn't turn on notifications");
    } catch { toast("Couldn't turn on notifications"); }
    setBusy(false);
  };
  const turnOff = async () => { setBusy(true); await disablePush(); setPush(await pushState()); setBusy(false); };

  const row = (k: keyof ReminderSettings, title: string, sub: string, children?: React.ReactNode) => (
    <div key={k} className="toggle" style={{ marginBottom: 10, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 0 }}><b>{title}</b><small>{sub}</small></div>
      <Switch on={!!r[k]} label={title} onChange={(v) => setR({ [k]: v })} />
      {children}
    </div>
  );

  return (
    <>
      <SheetHead title="Reminders" onClose={close} />
      <div className="sheet-body">
        <PushCard state={push} signedIn={meta.mode === "account"} busy={busy} onOn={turnOn} onOff={turnOff} onSignIn={() => open({ kind: "auth", mode: "signup" })} />
        {row("upcoming", "Upcoming events", "Matches, practices and appointments, at the time you choose when planning")}
        {row("rehab", "Rehab exercises", `Every day at ${r.rehabTime} if sets are still left`, r.rehab && <TimeField label="Rehab reminder time" value={r.rehabTime} onChange={(v) => setR({ rehabTime: v })} />)}
        {row("afterEvent", "Log after a match or session", "30 minutes after a planned event starts")}
        {row("summary", "Daily summary", `Every evening at ${r.summaryTime}`, r.summary && <TimeField label="Daily summary time" value={r.summaryTime} onChange={(v) => setR({ summaryTime: v })} />)}
        {row("quiet", "Nudge when it goes quiet", `If nothing is logged for ${r.quietDays} days`)}
        <p className="small muted" style={{ lineHeight: 1.45 }}>
          You&apos;ll get at most 3 notifications a day, and none between {QUIET_HOURS.start} and {QUIET_HOURS.end}. If notifications are off, reminders show here in the app when you open it.
        </p>
      </div>
    </>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ flexBasis: "100%", marginTop: 10 }}>
      <input className="inp" type="time" aria-label={label} value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />
    </div>
  );
}

function PushCard({ state, signedIn, busy, onOn, onOff, onSignIn }: { state: PushState | null; signedIn: boolean; busy: boolean; onOn: () => void; onOff: () => void; onSignIn: () => void }) {
  if (state == null) return null;
  let text: string, action: React.ReactNode = null;
  if (!signedIn) {
    text = "Push notifications need an account so reminders can reach your phone when the app is closed.";
    action = <button className="pillbtn pill-turf" type="button" onClick={onSignIn}>Create an account</button>;
  } else if (state === "needs-install") {
    text = "On iPhone, add Pitchside to your home screen first: tap Share, then Add to Home Screen. Then open it from there and turn notifications on.";
  } else if (state === "unsupported") {
    text = "This browser can't show push notifications. Reminders will show in the app instead.";
  } else if (state === "denied") {
    text = "Notifications are blocked for Pitchside. Allow them in your browser or phone settings, then come back here.";
  } else if (state === "on") {
    text = "Push notifications are on for this device.";
    action = <button className="pillbtn pill-ghost" type="button" onClick={onOff} disabled={busy}>Turn off</button>;
  } else {
    text = "Get reminders on this phone, even when the app is closed.";
    action = <button className="pillbtn pill-turf" type="button" onClick={onOn} disabled={busy}>Turn on notifications</button>;
  }
  return (
    <div className="hint" style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <span>{text}</span>
      {action}
    </div>
  );
}
