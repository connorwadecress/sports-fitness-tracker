# Project Notes

_Last updated: 2026-10-02_

## What this is

A **public website for tracking sports and fitness**. People will mainly use it **on their phones**, so the mobile experience comes first and desktop is secondary.

## Current status

| Area | Status |
| --- | --- |
| Repo | Public on GitHub |
| Hosting | Vercel. `main` deploys to production and PRs get previews |
| App | Next.js scaffold with a placeholder landing page |
| Requirements | **Waiting on the BRD** |
| Data / auth / storage | Not chosen yet. Depends on the BRD |

## Guiding principles

1. **Mobile first.** Design for about 375px wide first, then scale up. See [MOBILE_FIRST.md](MOBILE_FIRST.md).
2. **Fast on mobile networks.** Keep JS bundles small and use server components by default.
3. **Public and accessible.** Anyone can use it, so build to WCAG 2.2 AA from day one.
4. **Installable.** Ship a web app manifest so people can add it to their home screen. Offline support can come later if the BRD needs it.
5. **Privacy-aware.** Fitness and health data is sensitive. Collect only what we need. If we have South African users, POPIA applies, and GDPR applies if we have EU users.

## Open questions (for the BRD)

- **Users:** Who are they? Individual athletes, coaches, teams, clubs?
- **Sports:** Which sports or activity types are in scope at launch?
- **Accounts:** Is sign-up required, or can people use it anonymously with an optional account?
- **Data:** What do we track (workouts, sets/reps, distance, time, heart rate, GPS)? Is it manual entry, or do we import from wearables or apps like Strava, Garmin, Apple Health, or Google Fit?
- **Social:** Will there be sharing, leaderboards, friends, or teams?
- **Offline:** Do people need to log workouts without signal (for example at the gym or on a trail)?
- **Monetisation:** Free, freemium, ads, or subscriptions?
- **Units and locale:** Metric only, or metric and imperial? Which languages?
- **Launch:** Is there a target date, and what is the MVP scope?

## Likely technical decisions after the BRD

These choices are deliberately on hold:

- **Database:** Postgres through the Vercel Marketplace (such as Neon or Supabase) is the likely default.
- **Auth:** Something like Clerk, Auth.js, or Supabase Auth.
- **Offline / PWA:** A service worker and local storage if offline logging is needed.
- **Charts:** For progress and trend views.
- **Analytics:** Vercel Analytics and Speed Insights to track real-user Core Web Vitals on mobile.

Record each choice in [DECISIONS.md](DECISIONS.md) when it's made.
