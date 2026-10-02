# Pitchside

A mobile-first hockey and recovery tracker. Log matches, practices, own training, physio and biokineticist sessions in under a minute, track injuries and rehab sets, and get a daily summary with suggestions on when to rest and when to do more.

**Live:** https://sports-fitness-tracker.vercel.app

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript) on [Vercel](https://vercel.com), functions in `fra1`
- [Neon](https://neon.tech) Postgres (Vercel Marketplace, free plan)
- Local-first: IndexedDB on the device, synced through `/api/sync`
- Web push (VAPID), sent by a GitHub Actions schedule
- Installable PWA with a service worker for offline use

## Getting started

```bash
npm install
vercel env pull .env.local   # DATABASE_URL, VAPID keys, CRON_SECRET
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL` the app still runs in "this device only" mode. The service worker is off in development; add `?sw=1` to the URL to test it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Make a production build |
| `npm test` | Run the unit tests (suggestion rules, reminders, logging) |
| `npm run typecheck` | Type-check |
| `npm run lint` | Run ESLint |

## Environment variables

| Name | Used for |
| --- | --- |
| `DATABASE_URL` | Neon Postgres (added by the Neon integration) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push |
| `CRON_SECRET` | Protects `/api/cron/reminders` (also a GitHub Actions secret, with `APP_URL`) |

## Docs

| File | Purpose |
| --- | --- |
| [docs/PROJECT_NOTES.md](docs/PROJECT_NOTES.md) | Overview, architecture and known limits |
| [docs/BRD.md](docs/BRD.md) | Business requirements document |
| [docs/USER_STORIES.md](docs/USER_STORIES.md) | User story specification |
| [docs/TRACEABILITY.md](docs/TRACEABILITY.md) | Where each requirement is built |
| [docs/prototype/](docs/prototype/pitchside-prototype.html) | Clickable HTML prototype (the design reference) |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decisions |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | How GitHub, Vercel, Neon and the reminder schedule fit together |
| [docs/MOBILE_FIRST.md](docs/MOBILE_FIRST.md) | Mobile-first build rules |
