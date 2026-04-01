# Quote Chaser

## Summary

Quote Chaser is a lightweight estimate follow-up tool for roofing contractors. It helps small roofing businesses recover more jobs from estimates they have already sent by making quote aging, follow-up timing, and next actions visible.

## Problem

Roofing contractors often lose jobs after sending an estimate because follow-up is manual, inconsistent, or invisible.

## MVP Scope

- quote tracking
- aging/stale quote visibility
- follow-up queue
- templated and AI-assisted follow-up drafts
- simple activity log

## Stack

- frontend: Next.js App Router
- backend: Next.js route handlers/server actions
- database: Postgres
- deployment: Vercel

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

See `.env.example`.

### AI drafts

Milestone 5 adds quote-contextual draft suggestions on the quote detail page.

- Without `OPENAI_API_KEY`, the app uses structured fallback templates.
- With `OPENAI_API_KEY`, the draft layer is ready to be upgraded to provider-backed generation without changing the UX contract.

## Deployment

Document deployment steps in `docs/deploy-notes.md`.
