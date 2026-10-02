// Calendar maths on naive local dates. Everything goes through UTC so the
// machine's own time zone (a server in Frankfurt, a phone in Joburg) never
// shifts a date.

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const z = (n: number) => String(n).padStart(2, "0");

export function iso(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m, d));
  return `${dt.getUTCFullYear()}-${z(dt.getUTCMonth() + 1)}-${z(dt.getUTCDate())}`;
}

export function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function addDays(date: string, n: number): string {
  const { y, m, d } = parts(date);
  return iso(y, m, d + n);
}

export function weekday(date: string): number {
  const { y, m, d } = parts(date);
  return new Date(Date.UTC(y, m, d)).getUTCDay();
}

export function daysBetween(from: string, to: string): number {
  const a = parts(from), b = parts(to);
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 864e5);
}

export const nice = (date: string) => {
  const { m, d } = parts(date);
  return `${DAYS[weekday(date)]} ${d} ${MONTHS[m]}`;
};

export const short = (date: string) => {
  const { m, d } = parts(date);
  return `${DAYS[weekday(date)].slice(0, 3)} ${d} ${MONTHS[m].slice(0, 3)}`;
};

export const dayLetter = (date: string) => DAYS[weekday(date)].slice(0, 3);

export function rel(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  if (date === addDays(today, -1)) return "Yesterday";
  return short(date);
}

/** Minutes since midnight for "HH:MM". */
export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Shift a local date and time by some minutes, crossing midnight if needed. */
export function shift(date: string, time: string, minutes: number): { date: string; time: string } {
  const total = toMinutes(time) + minutes;
  const dayShift = Math.floor(total / 1440);
  const mins = ((total % 1440) + 1440) % 1440;
  return { date: addDays(date, dayShift), time: `${z(Math.floor(mins / 60))}:${z(mins % 60)}` };
}

/** Sortable "YYYY-MM-DD HH:MM" key. */
export const stamp = (date: string, time: string) => `${date} ${time}`;

/** The local date and time right now in a given IANA time zone. */
export function nowIn(timeZone: string, at: Date = new Date()): { date: string; time: string } {
  let tz = timeZone;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
  } catch {
    tz = "Africa/Johannesburg";
  }
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function deviceNow(at: Date = new Date()): { date: string; time: string } {
  return {
    date: iso(at.getFullYear(), at.getMonth(), at.getDate()),
    time: `${z(at.getHours())}:${z(at.getMinutes())}`,
  };
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Johannesburg";
  } catch {
    return "Africa/Johannesburg";
  }
}
