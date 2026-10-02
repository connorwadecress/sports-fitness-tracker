# Decision Log

A lightweight record of architecture decisions. Add newer entries at the top.

---

## 2026-10-02: Next.js on Vercel, mobile-first web app (not a native app)

**Context:** We need a public app that people use mainly from their phones. Requirements (BRD) are still to come.

**Decision:** A responsive web app built with Next.js (App Router, TypeScript, Tailwind v4) and hosted on Vercel. It ships a web app manifest so people can install it to their home screen.

**Why:**
- One codebase reaches iOS and Android with no app store review.
- It's easy to share by link, which suits a public site.
- Vercel gives us preview deploys per PR, so we can test on a real phone before merging.
- We can add PWA/offline support, or wrap it in a native shell, later if the BRD needs it.

**Consequences:** Native-only features (background GPS, deep HealthKit access) are limited. Revisit this if the BRD needs them.

---

## Pending (waiting on the BRD)

- Database / storage
- Authentication
- Offline support
- Third-party integrations (Strava, Garmin, Apple Health, Google Fit)
