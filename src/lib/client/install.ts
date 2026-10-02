"use client";

// "Add to home screen": Chrome and Edge fire beforeinstallprompt, which we keep
// so a button can trigger it. iPhone has no prompt, so we show instructions.

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
let listening = false;

export function listenForInstall() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => { deferred = null; listeners.forEach((l) => l()); });
}

export const canPromptInstall = () => deferred !== null;
export function onInstallChange(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach((l) => l());
  return outcome === "accepted";
}
