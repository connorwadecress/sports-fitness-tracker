import type { EventType, ReminderSettings, Source } from "./types";

export const TYPES: Record<EventType, { label: string; blurb: string; color: string; noun: string }> = {
  match: { label: "Match", blurb: "Score, result and how you played", color: "var(--match)", noun: "match" },
  practice: { label: "Practice", blurb: "Team training with the squad", color: "var(--practice)", noun: "practice" },
  exercise: { label: "Own training", blurb: "Runs, gym, stick work on your own", color: "var(--exercise)", noun: "session" },
  physio: { label: "Physio", blurb: "Treatment and exercises for an injury", color: "var(--physio)", noun: "physio session" },
  bio: { label: "Biokineticist", blurb: "Recovery and strength sessions", color: "var(--bio)", noun: "biokineticist session" },
};
export const TYPE_KEYS = Object.keys(TYPES) as EventType[];
export const TRAINING_TYPES: EventType[] = ["match", "practice", "exercise"];

export const ENERGY = ["Drained", "Low", "Okay", "Good", "Buzzing"];
export const SORENESS = ["None", "Light", "Some", "Sore", "Very sore"];
export const BODY_PARTS = ["Left ankle", "Right ankle", "Left knee", "Right knee", "Hamstring", "Groin", "Lower back", "Shoulder", "Wrist or hand", "Head", "Other"];
export const PRACTICE_FOCUS = ["Skills", "Fitness", "Set pieces", "Game play", "Goalkeeping"];
export const ACTIVITIES = ["Run", "Gym", "Stick work", "Mobility", "Cycling", "Other"];
export const DURATIONS = [30, 45, 60, 75, 90, 120];

export const moodLabel = (m: number) => (m < 20 ? "Rough" : m < 40 ? "Low" : m < 60 ? "Okay" : m < 80 ? "Good" : "Great");

export const SAFETY_HIGH_PAIN = "That's a lot of pain. Stop training, and tell a coach, parent or your physio today.";
export const DISCLAIMER = "Suggestions are general guidance based on what you've logged. Your physio, biokineticist and coach know your body best.";

export interface LibraryExercise {
  key: string;
  name: string;
  sets: number;
  repsOrTime: string;
  source: Source;
  steps: string[];
}

export const LIBRARY: LibraryExercise[] = [
  { key: "calf", name: "Calf raises", sets: 3, repsOrTime: "12 reps", source: "physio", steps: ["Stand tall, hold a wall for balance.", "Rise slowly onto your toes.", "Pause for a second at the top.", "Lower your heels slowly over 3 seconds."] },
  { key: "balance", name: "Single-leg balance", sets: 3, repsOrTime: "30 sec each leg", source: "physio", steps: ["Stand on the injured leg, knee soft.", "Lift the other foot off the floor.", "Keep your hips level and hold.", "Make it harder: close your eyes or stand on a pillow."] },
  { key: "band", name: "Band ankle turns", sets: 2, repsOrTime: "15 reps", source: "physio", steps: ["Sit with your leg straight, band around your foot.", "Turn your foot outwards against the band.", "Return slowly. Keep your knee still."] },
  { key: "bridge", name: "Glute bridge", sets: 3, repsOrTime: "10 reps", source: "bio", steps: ["Lie on your back, knees bent, feet flat.", "Squeeze your glutes and lift your hips.", "Hold for 2 seconds, then lower slowly."] },
  { key: "wallsit", name: "Wall sit", sets: 3, repsOrTime: "30 sec hold", source: "bio", steps: ["Back flat against a wall.", "Slide down until your knees are at 90 degrees.", "Knees over ankles. Breathe and hold."] },
  { key: "plank", name: "Side plank", sets: 2, repsOrTime: "20 sec each side", source: "bio", steps: ["Lie on your side, elbow under your shoulder.", "Lift your hips into a straight line.", "Hold, then swap sides."] },
];

export const daysPerWeekFor = (source: Source): 7 | 3 => (source === "physio" ? 7 : 3);

export const DEFAULT_REMINDERS: ReminderSettings = {
  upcoming: true,
  rehab: true,
  rehabTime: "17:00",
  afterEvent: true,
  summary: true,
  summaryTime: "20:30",
  quiet: true,
  quietDays: 2,
};

export const QUIET_HOURS = { start: "21:30", end: "06:30" };
export const MAX_PUSH_PER_DAY = 3;
