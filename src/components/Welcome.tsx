"use client";

import { useApp } from "./context";
import { FeelShape } from "./ui";
import { chooseDeviceOnly } from "@/lib/client/store";

export function Welcome() {
  const { open, serverConfigured } = useApp();
  return (
    <main className="welcome">
      <div style={{ marginBottom: "auto", paddingTop: 24 }}><FeelShape mood={85} size={120} /></div>
      <h1>Pitchside</h1>
      <p>Log your matches, practices and physio sessions, follow your rehab, and get a daily summary that tells you when to rest and when to do more.</p>
      {serverConfigured && (
        <>
          <button className="pillbtn pill-on-turf" type="button" onClick={() => open({ kind: "auth", mode: "signup" })}>Create account</button>
          <button className="pillbtn pill-soft" type="button" onClick={() => open({ kind: "auth", mode: "signin" })}>Sign in</button>
        </>
      )}
      <button className="pillbtn" type="button" style={{ background: "none", color: "inherit", textDecoration: "underline" }} onClick={chooseDeviceOnly}>
        Use it on this device only
      </button>
      <p className="small" style={{ fontSize: 12.5, opacity: .8, margin: "8px 0 0" }}>
        General guidance only, never a diagnosis. Your data stays private. <a href="/privacy" style={{ color: "inherit" }}>Privacy and safety</a>
      </p>
    </main>
  );
}
