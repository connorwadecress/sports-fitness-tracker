import "server-only";
import { DEFAULT_REMINDERS } from "@/lib/domain/constants";
import type { Exercise, Injury, PitchEvent, SetLog, Settings, Snapshot } from "@/lib/domain/types";

export interface RecordRow { collection: string; data: unknown }

export function snapshotFromRows(rows: RecordRow[]): Snapshot {
  const s: Snapshot = {
    events: [], injuries: [], exercises: [], setLogs: {},
    settings: { id: "settings", reminders: { ...DEFAULT_REMINDERS }, timeZone: "Africa/Johannesburg", updatedAt: 0 },
  };
  for (const r of rows) {
    switch (r.collection) {
      case "events": s.events.push(r.data as PitchEvent); break;
      case "injuries": s.injuries.push(r.data as Injury); break;
      case "exercises": s.exercises.push(r.data as Exercise); break;
      case "setLogs": { const l = r.data as SetLog; s.setLogs[l.id] = l; break; }
      case "settings": {
        const st = r.data as Settings;
        s.settings = { ...s.settings, ...st, reminders: { ...DEFAULT_REMINDERS, ...st.reminders } };
        break;
      }
    }
  }
  return s;
}
