# Sports Fitness Tracker

A public, mobile-first web app for tracking sports and fitness training. Most people will use it from their phones, so every screen is designed for a small touchscreen first.

> **Status:** Scaffold only. Product scope is waiting on the BRD. See [docs/](docs/).

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com) v4
- Hosted on [Vercel](https://vercel.com). Pushes to `main` deploy to production, and pull requests get preview URLs.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. To test on your phone, use the network URL that `next dev` prints (your phone needs to be on the same Wi-Fi). You can also open a PR and use the Vercel preview link.

## Scripts

| Command         | What it does                 |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the dev server         |
| `npm run build` | Make a production build      |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

## Docs

| File | Purpose |
| --- | --- |
| [docs/PROJECT_NOTES.md](docs/PROJECT_NOTES.md) | Project overview, status, and open questions |
| [docs/MOBILE_FIRST.md](docs/MOBILE_FIRST.md) | Mobile-first design and build rules |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | How GitHub and Vercel are wired together |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Log of architecture decisions |
| [docs/BRD.md](docs/BRD.md) | Business Requirements Document (placeholder for now) |
