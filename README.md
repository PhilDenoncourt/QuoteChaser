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
- With `OPENAI_API_KEY`, the app uses server-side OpenAI generation and falls back automatically if the provider is unavailable.
- Drafts are copy-ready and preserve the same UI whether they come from AI or fallback templates.

Configurable environment variables:
- `OPENAI_API_KEY` — enables provider-backed generation
- `OPENAI_MODEL` — override the model used for draft generation
- `OPENAI_DRAFT_CONTEXT_LIMIT` — how many recent activities to include in prompt context
- `OPENAI_DRAFT_STYLE_HINT` — high-level style guidance for the generated drafts

## Deployment

Document deployment steps in `docs/deploy-notes.md`.
