"use client";

import { useState } from "react";
import { useApp } from "../context";
import { SheetHead } from "../ui";
import { signedIn, updateSettings } from "@/lib/client/store";

export function AuthSheet({ mode: initial }: { mode: "signin" | "signup" }) {
  const { close, toast } = useApp();
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (signup && !consent) { setError("Please confirm consent to continue."); return; }
    if (signup && password.length < 8) { setError("Use at least 8 characters for your password."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${signup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(signup ? { email, password, name: name.trim() || undefined, consent } : { email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || "Something went wrong. Try again."); setBusy(false); return; }
      signedIn(body.user);
      if (signup && name.trim()) updateSettings({ name: name.trim() });
      close();
      toast(signup ? "Account created" : "Signed in");
    } catch {
      setError("You're offline. Connect to sign in.");
      setBusy(false);
    }
  };

  return (
    <>
      <SheetHead title={signup ? "Create your account" : "Sign in"} onClose={close} />
      <form className="sheet-body" onSubmit={submit} noValidate>
        {signup && (
          <div className="field">
            <label htmlFor="aname">First name <span className="muted" style={{ fontWeight: 500 }}>(optional)</span></label>
            <input id="aname" className="inp" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="aemail">Email</label>
          <input id="aemail" className="inp" type="email" inputMode="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="apw">Password</label>
          <input id="apw" className="inp" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby={signup ? "apw-hint" : undefined} />
          {signup && <p className="small muted" id="apw-hint" style={{ margin: "6px 2px 0" }}>At least 8 characters.</p>}
        </div>
        {signup && (
          <label className="check field">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I&apos;m 18 or older, or my parent or guardian has agreed to me using Pitchside and storing my training and health information. <a href="/privacy" target="_blank" style={{ color: "var(--turf)" }}>Privacy and safety</a></span>
          </label>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="pillbtn pill-turf" type="submit" disabled={busy} style={{ width: "100%", marginTop: 12 }}>{busy ? "One moment…" : signup ? "Create account" : "Sign in"}</button>
        <button className="pillbtn" type="button" style={{ width: "100%", marginTop: 8, background: "none", color: "var(--turf)" }} onClick={() => { setMode(signup ? "signin" : "signup"); setError(""); }}>
          {signup ? "I already have an account" : "Create a new account"}
        </button>
        <p className="small muted" style={{ lineHeight: 1.45 }}>Anything you&apos;ve already logged on this device is added to your account.</p>
      </form>
    </>
  );
}
