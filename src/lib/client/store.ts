"use client";

// Local-first store. Every write lands in IndexedDB straight away, so logging
// works with no signal. When the player has an account, changed records are
// queued and pushed to /api/sync, and changes from other devices are pulled
// back. Conflicts resolve last-write-wins per record.

import { useSyncExternalStore } from "react";
import { createStore, get, set, del } from "idb-keyval";
import { DEFAULT_REMINDERS } from "@/lib/domain/constants";
import { deviceTimeZone } from "@/lib/domain/dates";
import type { Put } from "@/lib/domain/ops";
import { COLLECTIONS, type CollectionName, type Collections, type Settings, type Snapshot } from "@/lib/domain/types";

export interface Account { email: string; name?: string | null }
export type Mode = "local" | "account" | null;
export type SyncStatus = "idle" | "syncing" | "offline" | "error" | "signedOut";

interface Meta {
  mode: Mode;
  account: Account | null;
  cursor: number;
  dirty: string[];
  lastSyncedAt: number | null;
}

export interface StoreState {
  ready: boolean;
  data: Collections;
  meta: Meta;
  snapshot: Snapshot;
  syncStatus: SyncStatus;
}

const emptyData = (): Collections => ({ events: {}, injuries: {}, exercises: {}, setLogs: {}, settings: {} });
const emptyMeta = (): Meta => ({ mode: null, account: null, cursor: 0, dirty: [], lastSyncedAt: null });

function defaultSettings(): Settings {
  return { id: "settings", reminders: { ...DEFAULT_REMINDERS }, timeZone: deviceTimeZone(), updatedAt: 0 };
}

function buildSnapshot(data: Collections): Snapshot {
  const live = <T extends { deleted?: boolean }>(r: Record<string, T>) => Object.values(r).filter((x) => !x.deleted);
  const setLogs: Snapshot["setLogs"] = {};
  for (const l of live(data.setLogs)) setLogs[l.id] = l;
  const settings = data.settings.settings;
  return {
    events: live(data.events),
    injuries: live(data.injuries),
    exercises: live(data.exercises),
    setLogs,
    settings: settings ? { ...defaultSettings(), ...settings, reminders: { ...DEFAULT_REMINDERS, ...settings.reminders } } : defaultSettings(),
  };
}

const initialData = emptyData();
let state: StoreState = { ready: false, data: initialData, meta: emptyMeta(), snapshot: buildSnapshot(initialData), syncStatus: "idle" };
const serverState = state;
const listeners = new Set<() => void>();

function emit(next: Partial<StoreState>) {
  state = { ...state, ...next };
  if (next.data) state.snapshot = buildSnapshot(state.data);
  listeners.forEach((l) => l());
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getState = () => state;

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getState, () => serverState);
}

/* ---------------- persistence ---------------- */

const kv = typeof indexedDB !== "undefined" ? createStore("pitchside", "kv") : undefined;
let memoryOnly = false;

async function persist() {
  if (!kv || memoryOnly) return;
  try {
    await set("data", state.data, kv);
    await set("meta", state.meta, kv);
  } catch {
    memoryOnly = true;
  }
}

let loading: Promise<void> | null = null;
export function load(): Promise<void> {
  if (loading) return loading;
  loading = (async () => {
    let data = emptyData(), meta = emptyMeta();
    if (kv) {
      try {
        const [d, m] = await Promise.all([get<Collections>("data", kv), get<Meta>("meta", kv)]);
        if (d) data = { ...emptyData(), ...d };
        if (m) meta = { ...emptyMeta(), ...m };
      } catch {
        memoryOnly = true;
      }
    }
    emit({ ready: true, data, meta });
  })();
  return loading;
}

/* ---------------- writes ---------------- */

const keyOf = (c: CollectionName, id: string) => `${c}|${id}`;

export function apply(puts: Put[]) {
  if (!puts.length) return;
  const data = { ...state.data };
  const dirty = new Set(state.meta.dirty);
  for (const p of puts) {
    data[p.c] = { ...data[p.c], [p.record.id]: p.record } as never;
    dirty.add(keyOf(p.c, p.record.id));
  }
  emit({ data, meta: { ...state.meta, dirty: [...dirty] } });
  void persist();
  scheduleSync();
}

export function remove(c: CollectionName, id: string) {
  const rec = state.data[c][id];
  if (!rec) return;
  apply([{ c, record: { ...rec, deleted: true, updatedAt: Date.now(), ...(c === "exercises" ? { imageUrl: undefined } : {}) } } as Put]);
}

export function updateSettings(patch: Partial<Settings>) {
  const cur = state.snapshot.settings;
  apply([{ c: "settings", record: { ...cur, ...patch, reminders: { ...cur.reminders, ...patch.reminders }, id: "settings", updatedAt: Date.now() } }]);
}

/* ---------------- account mode ---------------- */

export function chooseDeviceOnly() {
  emit({ meta: { ...state.meta, mode: "local", account: null } });
  void persist();
}

/** After sign-in or sign-up: queue everything on this device so it merges into the account. */
export function signedIn(account: Account) {
  const dirty = new Set(state.meta.dirty);
  for (const c of COLLECTIONS) for (const id of Object.keys(state.data[c])) dirty.add(keyOf(c, id));
  emit({ meta: { ...state.meta, mode: "account", account, cursor: 0, dirty: [...dirty] }, syncStatus: "idle" });
  void persist();
  void sync();
}

/** Wipe this device. Used on sign-out and account deletion. */
export async function clearDevice() {
  emit({ data: emptyData(), meta: emptyMeta(), syncStatus: "idle" });
  if (kv) {
    try { await Promise.all([del("data", kv), del("meta", kv)]); } catch { /* ignore */ }
  }
}

/* ---------------- sync ---------------- */

interface RemoteChange { c: CollectionName; id: string; data: Record<string, unknown> & { updatedAt: number }; }

let syncing = false;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(delay = 1200) {
  if (state.meta.mode !== "account") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void sync(), delay);
}

export async function sync(): Promise<void> {
  if (state.meta.mode !== "account" || state.syncStatus === "signedOut") return;
  if (syncing) { again = true; return; }
  if (typeof navigator !== "undefined" && navigator.onLine === false) { emit({ syncStatus: "offline" }); return; }
  syncing = true;
  emit({ syncStatus: "syncing" });
  try {
    let more = true;
    while (more) {
      const keys = state.meta.dirty.slice(0, 200);
      const changes = keys.map((k) => {
        const i = k.indexOf("|");
        const c = k.slice(0, i) as CollectionName, id = k.slice(i + 1);
        const rec = state.data[c][id];
        return { c, id, data: rec, updatedAt: rec?.updatedAt ?? 0, deleted: !!rec?.deleted };
      }).filter((x) => x.data);
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cursor: state.meta.cursor, changes }),
      });
      if (res.status === 401) { emit({ syncStatus: "signedOut" }); return; }
      if (!res.ok) throw new Error(`sync ${res.status}`);
      const body = (await res.json()) as { cursor: number; changes: RemoteChange[]; more: boolean };

      const data = { ...state.data } as Record<CollectionName, Record<string, unknown>>;
      const touched = new Set<CollectionName>();
      for (const r of body.changes) {
        if (!COLLECTIONS.includes(r.c)) continue;
        const local = data[r.c][r.id] as { updatedAt: number } | undefined;
        if (!local || r.data.updatedAt >= local.updatedAt) {
          if (!touched.has(r.c)) { data[r.c] = { ...data[r.c] }; touched.add(r.c); }
          data[r.c][r.id] = r.data;
        }
      }
      // Only clear what we pushed and that hasn't changed again since.
      const pushed = new Map(changes.map((x) => [keyOf(x.c, x.id), x.updatedAt]));
      const dirty = state.meta.dirty.filter((k) => {
        if (!pushed.has(k)) return true;
        const i = k.indexOf("|");
        const rec = state.data[k.slice(0, i) as CollectionName][k.slice(i + 1)];
        return rec && rec.updatedAt !== pushed.get(k);
      });
      emit({ data: data as unknown as Collections, meta: { ...state.meta, cursor: body.cursor, dirty, lastSyncedAt: Date.now() } });
      await persist();
      more = body.more || state.meta.dirty.length > 0 && keys.length === 200;
    }
    emit({ syncStatus: "idle" });
  } catch {
    emit({ syncStatus: typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error" });
  } finally {
    syncing = false;
    if (again) { again = false; scheduleSync(300); }
  }
}

let started = false;
/** Wire up background sync triggers once. */
export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => void sync());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void sync(); });
  setInterval(() => { if (document.visibilityState === "visible") void sync(); }, 60_000);
  void sync();
}

export function markSignedInAgain(account: Account) {
  emit({ meta: { ...state.meta, account, mode: "account" }, syncStatus: "idle" });
  void persist();
  void sync();
}
