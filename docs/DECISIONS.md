# Decision Log

A lightweight record of architecture decisions. Add newer entries at the top.

---

## 2026-10-02: Fixes from the exploratory test report (PS-01 to PS-18)

All 18 findings were addressed. Judgement calls where the report and the user story spec pull in different directions:

- **Active minutes (PS-16):** the spec defines active minutes as including physio and biokineticist sessions, so the Today card and chart still count them. The training-load rules ("Big day, keep tomorrow light") now use matches, practice and own training only, so treatment time no longer skews advice.
- **Quiet thresholds (PS-03):** the spec sets the summary rule at 3 quiet days and the reminder at 2 (adjustable), so both stay. Neither fires for a brand-new profile, and the summary rule needs 3 days of history first.
- **Feelings (PS-04):** nothing is pre-selected. Unset mood is stored as `null`, and unset energy or soreness as `0`. Events saved with Skip, or with nothing set, store no feeling at all.
- **Rest advice (PS-01):** a new rule, ranked just below high pain, says "take it easy today" when pain is 1 to 5, soreness is Sore or Very sore, or energy is Drained. It suppresses "Get moving" and the quiet nudge.
- **Check-ins (PS-06):** one per day. "Log how I feel" reopens today's check-in pre-filled.
- **Deletes (PS-15):** events, removed exercises and recovered injuries get an in-app Undo toast instead of `confirm()`. Account deletion keeps a confirmation, because it can't be undone.
- **Export (PS-18):** a .zip with one CSV per table plus a full JSON backup, built by a small dependency-free zip writer (`src/lib/domain/zip.ts`).

---

## 2026-10-02: Reminders sent by a GitHub Actions schedule

**Context:** Reminders need minute-level timing (1 hour before an event, 17:00 rehab, 20:30 summary). Vercel Hobby cron jobs only run once a day.

**Decision:** `.github/workflows/reminders.yml` calls `GET /api/cron/reminders` every 10 minutes with `Authorization: Bearer $CRON_SECRET`. The endpoint works out what's due in each player's own time zone (looking back 90 minutes to absorb GitHub's schedule delays), claims each reminder key in `notifications_sent` before sending, caps sends at 3 a day and skips quiet hours (21:30 to 06:30).

**Why:** Free for a public repo, no extra provider. The same `dueReminders()` function drives the in-app banner fallback, so push and in-app always agree.

**Consequences:** GitHub can delay scheduled runs by several minutes at busy times. Fine for reminders; revisit (Upstash QStash schedules are a free option) if timing needs to be tighter.

---

## 2026-10-02: Local-first data with a sync API

**Context:** The spec needs offline logging and set counting, cloud storage per user, and a sub-60-second log flow.

**Decision:** The browser holds the whole dataset in IndexedDB (`src/lib/client/store.ts`). Every write lands locally first and is queued. `POST /api/sync` pushes queued records and pulls anything newer than the client's cursor. Conflicts resolve last-write-wins per record (`updatedAt`), and deletes are tombstones. The server stores records as JSONB in one `records` table keyed by user, collection and id, with a global sequence for cursors.

**Why:** Logging is instant and works with no signal. One generic table keeps the server tiny, and the data model can evolve without migrations. Data volume for one player is small (well under the free tier).

**Consequences:** Two devices editing the same record offline: the later edit wins. Acceptable for one user.

---

## 2026-10-02: Neon Postgres, own email-and-password auth

**Decision:** Neon Postgres (Vercel Marketplace, free plan, `fra1` region, closest to South Africa), with functions pinned to `fra1` in `vercel.json`. Auth is email and password: scrypt hashes, random session tokens stored hashed, an httpOnly cookie, same-origin checks on writes, and a 10-attempts-per-15-minutes login limit.

**Why:** Free, no email provider needed, nothing third-party touching a minor's health data. The schema is created on first request (`src/lib/server/db.ts`), so there is no migration step.

**Consequences:** No self-service password reset yet (it would need an email provider such as Resend). Neon's free tier pauses after inactivity, so the first request after a pause is a little slower.

---

## 2026-10-02: Single static app shell

**Decision:** The app is one client-rendered route (`/`), with tabs as hash routes (`#calendar`, `#rehab`, …) and sheets as client state. A hand-written service worker (`public/sw.js`) caches the shell and static assets and handles push.

**Why:** A single static page is the simplest thing a service worker can serve fully offline. It also means notification deep links (`#log=<id>`, `#summary`, `#checkin`) just work.

---

## 2026-10-02: Next.js on Vercel, mobile-first web app (not a native app)

**Context:** We need a public app that people use mainly from their phones.

**Decision:** A responsive web app built with Next.js (App Router, TypeScript, Tailwind v4) and hosted on Vercel, installable as a PWA.

**Why:** One codebase for iOS and Android, no app store review, and preview deploys per PR.

**Consequences:** Web push on iPhone only works once the app is added to the home screen. The Reminders sheet explains this.
