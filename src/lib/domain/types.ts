// Data model shared by the browser store, the sync API and the reminder cron.
// Dates are local calendar dates ("YYYY-MM-DD") and times are local wall-clock
// times ("HH:MM") in the player's time zone, matching how people think about
// fixtures and physio appointments.

export type EventType = "match" | "practice" | "exercise" | "physio" | "bio";
export type EventStatus = "planned" | "logged";
export type ReminderChoice = "1h" | "evening" | "none";
export type Source = "physio" | "bio";

/** Every synced record carries these fields. */
export interface Syncable {
  id: string;
  /** Client clock, ms. Last write wins. */
  updatedAt: number;
  deleted?: boolean;
}

export interface MatchDetails {
  opponent: string;
  ourScore: number;
  theirScore: number;
  venue: "home" | "away";
  minutesPlayed: number;
}

export interface PracticeDetails {
  durationMin: number;
  effort: number;
  focus: string[];
}

export interface OwnTrainingDetails {
  activity: string;
  durationMin: number;
  effort: number;
}

export interface SessionDetails {
  injuryId?: string;
  durationMin: number;
  notes: string;
  exerciseIds: string[];
}

export type EventDetails = Partial<MatchDetails & PracticeDetails & OwnTrainingDetails & SessionDetails>;

/** Anything the player didn't set stays empty: mood null, energy and soreness 0. */
export interface Feel {
  mood: number | null; // 0–100
  energy: number; // 1–5, 0 = not set
  soreness: number; // 1–5, 0 = not set
  inPain: boolean;
  bodyPart: string;
  pain: number; // 0–10
  note: string;
}

export interface PitchEvent extends Syncable {
  /** Check-ins have no event type. */
  type: EventType | null;
  date: string;
  time: string;
  status: EventStatus;
  details: EventDetails;
  feel: Feel | null;
  reminder: ReminderChoice;
  repeatGroupId?: string;
  isCheckIn?: boolean;
}

export interface Injury extends Syncable {
  name: string;
  bodyPart: string;
  startDate: string;
  status: "active" | "recovered";
  recoveredDate?: string;
}

export interface Exercise extends Syncable {
  name: string;
  illustrationKey?: string;
  imageUrl?: string;
  sets: number;
  repsOrTime: string;
  daysPerWeek: 7 | 3;
  steps: string[];
  source: Source;
  active: boolean;
  injuryId?: string;
  /** Date it joined the programme, so adherence doesn't count days before it. */
  addedDate: string;
}

export interface SetLog extends Syncable {
  /** id is `${exerciseId}:${date}` */
  exerciseId: string;
  date: string;
  count: number;
}

export interface ReminderSettings {
  upcoming: boolean;
  rehab: boolean;
  rehabTime: string;
  afterEvent: boolean;
  summary: boolean;
  summaryTime: string;
  quiet: boolean;
  quietDays: number;
}

export interface Settings extends Syncable {
  /** Always "settings". */
  reminders: ReminderSettings;
  timeZone: string;
  name?: string;
}

export interface Collections {
  events: Record<string, PitchEvent>;
  injuries: Record<string, Injury>;
  exercises: Record<string, Exercise>;
  setLogs: Record<string, SetLog>;
  settings: Record<string, Settings>;
}

export type CollectionName = keyof Collections;
export const COLLECTIONS: CollectionName[] = ["events", "injuries", "exercises", "setLogs", "settings"];

/** A read-only, tombstone-free view used by every calculation. */
export interface Snapshot {
  events: PitchEvent[];
  injuries: Injury[];
  exercises: Exercise[];
  setLogs: Record<string, SetLog>;
  settings: Settings;
}
