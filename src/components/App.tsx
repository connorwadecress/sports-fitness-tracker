"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppContext, type AppApi, type SheetSpec, type Tab } from "./context";
import { Icon } from "./ui";
import { Banner, useInAppReminders } from "./Banner";
import { SheetHost } from "./SheetHost";
import { Welcome } from "./Welcome";
import { TodayScreen } from "./screens/Today";
import { CalendarScreen } from "./screens/Calendar";
import { RehabScreen } from "./screens/Rehab";
import { InsightsScreen } from "./screens/Insights";
import { load, markSignedInAgain, startSync, useStore, getState } from "@/lib/client/store";
import { registerServiceWorker } from "@/lib/client/push";
import { deviceNow, parts } from "@/lib/domain/dates";

const TABS: Tab[] = ["today", "calendar", "rehab", "insights"];

function useNow() {
  const [now, setNow] = useState(() => deviceNow());
  useEffect(() => {
    const tick = () => setNow((prev) => {
      const n = deviceNow();
      return n.date === prev.date && n.time === prev.time ? prev : n;
    });
    const id = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, []);
  return now;
}

export default function App() {
  const store = useStore();
  const now = useNow();
  const today = now.date;
  const [tab, setTab] = useState<Tab>("today");
  const [sheet, setSheet] = useState<SheetSpec | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; n: number } | null>(null);
  const [serverConfigured, setServerConfigured] = useState(false);
  const [calendar, setCalendar] = useState(() => { const p = parts(today); return { y: p.y, m: p.m, sel: today }; });
  const screenRef = useRef<HTMLElement>(null);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => { void load(); registerServiceWorker(); }, []);

  // Confirm the session with the server when online; recover from expired sessions.
  useEffect(() => {
    if (!store.ready) return;
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then((b: { configured: boolean; user: { email: string; name: string | null } | null }) => {
      if (cancelled) return;
      setServerConfigured(b.configured);
      // A valid session also clears a stale "signedOut". Without one, the next sync's 401 reports it.
      if (getState().meta.mode === "account" && b.user) markSignedInAgain(b.user);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [store.ready]);

  useEffect(() => { if (store.ready && store.meta.mode === "account") startSync(); }, [store.ready, store.meta.mode]);

  const toast = useCallback((text: string, delayMs = 0) => {
    const t = setTimeout(() => setToastMsg({ text, n: Date.now() }), delayMs);
    toastTimers.current.push(t);
  }, []);
  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const go = useCallback((t: Tab) => {
    setTab(t);
    setSheet(null);
    if (location.hash !== `#${t}`) history.replaceState(null, "", t === "today" ? location.pathname : `#${t}`);
    screenRef.current?.scrollTo({ top: 0 });
  }, []);

  const api: AppApi = useMemo(() => ({
    today, now, tab, go, toast, calendar, setCalendar, serverConfigured,
    open: (s) => setSheet(s),
    close: () => setSheet(null),
  }), [today, now, tab, go, toast, calendar, serverConfigured]);

  // Hash routes: tabs, plus deep links from notifications (#log=<id>, #summary, #checkin).
  const handleHash = useCallback((hash: string) => {
    const h = hash.replace(/^#/, "");
    if (!h) return;
    if (TABS.includes(h as Tab)) { setTab(h as Tab); return; }
    const st = getState();
    if (h.startsWith("log=")) {
      const id = h.slice(4);
      const ev = st.snapshot.events.find((e) => e.id === id);
      setTab("today");
      if (ev && ev.status === "planned") setSheet({ kind: "log", completeId: id });
      else if (ev) setSheet({ kind: "event", id });
      else setSheet({ kind: "log", type: "match" });
    } else if (h === "summary") { setTab("today"); setSheet({ kind: "summary", date: deviceNow().date }); }
    else if (h === "checkin") { setTab("today"); setSheet({ kind: "log", mode: "checkin" }); }
    history.replaceState(null, "", location.pathname + (TABS.includes(h as Tab) ? `#${h}` : ""));
  }, []);

  useEffect(() => {
    if (!store.ready) return;
    const first = setTimeout(() => handleHash(location.hash), 0);
    const onHash = () => handleHash(location.hash);
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "navigate") handleHash(e.data.hash); };
    window.addEventListener("hashchange", onHash);
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => { clearTimeout(first); window.removeEventListener("hashchange", onHash); navigator.serviceWorker?.removeEventListener("message", onMsg); };
  }, [store.ready, handleHash]);

  const banner = useInAppReminders(store.ready && store.meta.mode !== null ? store.snapshot : null, now);

  if (!store.ready) {
    return <div className="stage"><div className="device"><div className="splash" aria-busy="true"><span className="sr-only">Loading Pitchside</span></div></div></div>;
  }

  if (store.meta.mode === null) {
    return (
      <AppContext.Provider value={api}>
        <div className="stage"><div className="device">
          <Welcome />
          <SheetHost spec={sheet} />
          <Toast msg={toastMsg} />
        </div></div>
      </AppContext.Provider>
    );
  }

  const modal = sheet !== null;
  return (
    <AppContext.Provider value={api}>
      <div className="stage">
        <div className="device">
          <Banner item={banner} />
          <main className="screen" ref={screenRef} inert={modal} aria-label={tab}>
            {tab === "today" && <TodayScreen />}
            {tab === "calendar" && <CalendarScreen />}
            {tab === "rehab" && <RehabScreen />}
            {tab === "insights" && <InsightsScreen />}
          </main>
          <nav className="tabbar" aria-label="Main" inert={modal}>
            <TabButton t="today" label="Today" icon="today" current={tab} go={go} />
            <TabButton t="calendar" label="Calendar" icon="calendar" current={tab} go={go} />
            <button className="fab" type="button" onClick={() => setSheet({ kind: "log" })} aria-label="Log an event"><Icon name="plus" strokeWidth={2.6} /></button>
            <TabButton t="rehab" label="Rehab" icon="rehab" current={tab} go={go} />
            <TabButton t="insights" label="Insights" icon="insights" current={tab} go={go} />
          </nav>
          <SheetHost spec={sheet} />
          <Toast msg={toastMsg} />
        </div>
      </div>
    </AppContext.Provider>
  );
}

function TabButton({ t, label, icon, current, go }: { t: Tab; label: string; icon: "today" | "calendar" | "rehab" | "insights"; current: Tab; go: (t: Tab) => void }) {
  return (
    <button className="tab" type="button" aria-current={current === t ? "page" : undefined} onClick={() => go(t)}>
      <Icon name={icon} />{label}
    </button>
  );
}

function Toast({ msg }: { msg: { text: string; n: number } | null }) {
  const [last, setLast] = useState("");
  if (msg && msg.text !== last) setLast(msg.text);
  return <div className={`toast${msg ? " show" : ""}`} role="status" aria-live="polite">{msg?.text ?? last}</div>;
}
