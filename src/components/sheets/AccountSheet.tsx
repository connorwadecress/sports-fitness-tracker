"use client";

import { useState } from "react";
import { useApp } from "../context";
import { SheetHead } from "../ui";
import { apply, clearDevice, sync, updateSettings, useStore } from "@/lib/client/store";
import { currentEndpoint, disablePush } from "@/lib/client/push";
import { toCsv } from "@/lib/domain/csv";
import { sampleData } from "@/lib/domain/seed";

type Theme = "system" | "light" | "dark";
const THEME_KEY = "pitchside-theme";

function readTheme(): Theme {
  try { return (localStorage.getItem(THEME_KEY) as Theme) || "system"; } catch { return "system"; }
}
function applyTheme(t: Theme) {
  try { if (t === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
  if (t === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
}

export function AccountSheet() {
  const { snapshot: s, meta, syncStatus } = useStore();
  const { close, open, toast, today, serverConfigured } = useApp();
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [name, setName] = useState(s.settings.name ?? meta.account?.name ?? "");
  const empty = !s.events.length && !s.exercises.length && !s.injuries.length;

  const exportCsv = () => {
    const blob = new Blob([toCsv(s)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pitchside-${today}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const signOut = async () => {
    if (meta.dirty.length && !confirm("Some changes haven't synced yet and will be lost from this device. Sign out anyway?")) return;
    const endpoint = await currentEndpoint();
    await fetch("/api/auth/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint }) }).catch(() => {});
    await disablePush().catch(() => {});
    await clearDevice();
    close();
  };

  const deleteAll = async () => {
    const msg = meta.mode === "account"
      ? "Delete your account and all your data? This can't be undone."
      : "Delete all Pitchside data on this device? This can't be undone.";
    if (!confirm(msg)) return;
    if (meta.mode === "account") {
      const res = await fetch("/api/account", { method: "DELETE" }).catch(() => null);
      if (!res?.ok) { toast("Couldn't delete your account. Check your connection."); return; }
      await disablePush().catch(() => {});
    }
    await clearDevice();
    close();
  };

  const statusText = meta.mode !== "account" ? "Saved on this device only."
    : syncStatus === "signedOut" ? "Signed out. Sign in again to keep syncing."
    : syncStatus === "offline" ? `Offline. ${meta.dirty.length} change${meta.dirty.length === 1 ? "" : "s"} will sync when you're back online.`
    : syncStatus === "error" ? "Couldn't reach the server. Will try again."
    : syncStatus === "syncing" ? "Syncing…"
    : meta.lastSyncedAt ? `Synced ${new Date(meta.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.` : "Synced.";

  return (
    <>
      <SheetHead title="You" onClose={close} />
      <div className="sheet-body">
        <div className="panel">
          {meta.account ? <><b style={{ display: "block" }}>{meta.account.email}</b><span className="small muted">{statusText}</span></> : <span className="small muted">{statusText}</span>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {meta.mode === "account" ? (
              <>
                {syncStatus === "signedOut"
                  ? <button className="pillbtn pill-turf" type="button" onClick={() => open({ kind: "auth", mode: "signin" })}>Sign in again</button>
                  : <button className="pillbtn pill-ghost" type="button" onClick={() => void sync()}>Sync now</button>}
                <button className="pillbtn pill-ghost" type="button" onClick={signOut}>Sign out</button>
              </>
            ) : serverConfigured ? (
              <>
                <button className="pillbtn pill-turf" type="button" onClick={() => open({ kind: "auth", mode: "signup" })}>Create account</button>
                <button className="pillbtn pill-ghost" type="button" onClick={() => open({ kind: "auth", mode: "signin" })}>Sign in</button>
              </>
            ) : null}
          </div>
          {meta.mode !== "account" && serverConfigured && <p className="small muted" style={{ margin: "10px 0 0" }}>An account backs up your data and syncs it between devices. What you&apos;ve logged here comes with you.</p>}
        </div>

        <div className="field">
          <label htmlFor="pname">Your first name</label>
          <input id="pname" className="inp" value={name} maxLength={40} placeholder="Optional, for the greeting" onChange={(e) => setName(e.target.value)} onBlur={() => name !== (s.settings.name ?? "") && updateSettings({ name: name.trim() })} />
        </div>

        <div className="field">
          <span className="lbl">Theme</span>
          <div className="seg" role="group" aria-label="Theme">
            {(["system", "light", "dark"] as Theme[]).map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => { setTheme(t); applyTheme(t); }}>{t === "system" ? "Auto" : t === "light" ? "Light" : "Dark"}</button>
            ))}
          </div>
        </div>

        <h2 className="h2">Your data</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="pillbtn pill-ghost" type="button" onClick={exportCsv}>Export all data (CSV)</button>
          {empty && <button className="pillbtn pill-ghost" type="button" onClick={() => { apply(sampleData(today)); close(); toast("Sample data loaded"); }}>Try it with sample data</button>}
          <a className="pillbtn pill-ghost" href="/privacy" style={{ textAlign: "center", textDecoration: "none", lineHeight: "22px" }}>Privacy and safety</a>
          <button className="pillbtn pill-danger" type="button" onClick={deleteAll}>{meta.mode === "account" ? "Delete account and all data" : "Delete all data on this device"}</button>
        </div>
        <p className="small muted" style={{ lineHeight: 1.45, marginTop: 16 }}>
          Pitchside gives general guidance only. It never diagnoses injuries or changes what your physio or biokineticist prescribed. Your health data is private: no ads, no sharing, no third-party analytics.
        </p>
      </div>
    </>
  );
}
