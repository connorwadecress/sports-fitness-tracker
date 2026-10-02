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

None yet. When we add some (database URL, auth secrets, and so on):

- Add them in Vercel → Project → Settings → Environment Variables, or run `vercel env add`.
- Pull them locally with `vercel env pull .env.local`.
- Never commit `.env*` files. They're already in `.gitignore`.

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
