# Project Notes

_Last updated: 2026-10-02_

## What this is

**Pitchside**: a mobile-first hockey and recovery tracker for a Grade 11 field hockey player managing an injury. Log matches, practices, own training, physio and biokineticist sessions. Track injuries and rehab sets, and get a daily summary that says when to rest and when to do more.

## Current status

All four releases in the plan are built and live:

| Release | Scope | Status |
| --- | --- | --- |
| 1, core logging | Five event types, feelings, injuries, Today, calendar view | Live |
| 2, rehab | Picture library, custom exercises with photos, set counting, adherence | Live |
| 3, planning and reminders | Plan events, weekly repeat, web push, in-app fallback | Live |
| 4, coaching | Rule-based daily summary, Insights | Live |

## How it fits together

```
Phone (PWA)                                  Vercel (fra1)                  Neon Postgres (fra1)
┌─────────────────────────────┐   /api/sync  ┌───────────────────────┐      ┌──────────────────┐
│ React app (one route "/")   │ ───────────▶ │ Route handlers        │ ───▶ │ users, sessions, │
│ IndexedDB store + sync queue│ ◀─────────── │ auth, sync, push,     │      │ records (JSONB), │
│ Service worker: offline,    │   web push   │ account, cron         │      │ push_subscriptions│
│ push notifications          │ ◀─────────── │                       │      │ notifications_sent│
└─────────────────────────────┘              └───────────▲───────────┘      └──────────────────┘
                                                         │ every 10 min
                                              GitHub Actions (reminders.yml)
```

- `src/lib/domain/`: pure, shared logic (types, dates, suggestion rules, reminder rules, save operations, CSV, sample data). Unit tested.
- `src/lib/client/`: the IndexedDB store and sync engine, push helpers, image resizing.
- `src/lib/server/`: Neon client and schema, auth, web push.
- `src/components/`: screens and bottom sheets, ported from the clickable prototype.

## Known limits and next steps

- **No password reset.** Needs an email provider (for example Resend's free tier). Until then, reset a password by deleting the user row in Neon and signing up again.
- **iPhone push** only works after adding the app to the home screen (an iOS rule).
- **Ideas from the spec:** a read-only physio share link, fixture import, AI-written summaries.
