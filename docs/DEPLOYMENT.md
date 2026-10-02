# Deployment

## Setup

- **Repo:** https://github.com/connorwadecress/sports-fitness-tracker (public)
- **Production URL:** https://sports-fitness-tracker.vercel.app
- **Host:** Vercel project `connorwadecress-projects/sports-fitness-tracker`, connected to the GitHub repo through the Vercel GitHub integration.

## How deploys happen

| Trigger | Result |
| --- | --- |
| Push / merge to `main` | **Production** deploy |
| Open or update a pull request | **Preview** deploy with a unique URL, posted as a comment on the PR |

No GitHub Actions are needed for deploys. Vercel builds straight from the repo.

## Recommended workflow

1. Branch off `main`.
2. Open a PR. Vercel posts a preview URL.
3. **Test the preview on a real phone.**
4. Merge to `main`, and it goes to production.

## Environment variables

Set in Vercel for Production, Preview and Development. Pull them locally with `vercel env pull .env.local`, and never commit `.env*` files.

| Name | Source |
| --- | --- |
| `DATABASE_URL` and the other `PG*` / `POSTGRES_*` vars | Added by the Neon integration (`pitchside-db`, free plan, `fra1`) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Generated once with the `web-push` package's `generateVAPIDKeys()`. Changing them breaks existing push subscriptions. |
| `CRON_SECRET` | Random string. Must match the GitHub secret of the same name. |

The database schema is created automatically on the first request.

## Reminder schedule

`.github/workflows/reminders.yml` runs every 10 minutes and calls `/api/cron/reminders`. It needs two GitHub Actions secrets: `APP_URL` (the production URL) and `CRON_SECRET`. Run it by hand from the Actions tab with **Run workflow**.

## Local Vercel CLI

```bash
npm i -g vercel      # if not installed
vercel login
vercel link          # link this folder to the Vercel project (creates .vercel/, which is git-ignored)
```

## Rollback

In the Vercel dashboard → Deployments, choose an earlier production deployment and select **Promote to Production** (or **Instant Rollback**).

## Custom domain

Not set up yet. Add one under Vercel → Project → Settings → Domains.
