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
- database: Postgres via Prisma
- deployment target: Render

## Production deployment target

Quote Chaser is being prepared to deploy on Render.

High-level production shape:
- Render web service hosts the Next.js server
- Render PostgreSQL provides the production database
- Render runs the app in database-only mode
- deploy-time schema changes should use `prisma migrate deploy`

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
- `APP_BASE_URL` — base URL used to build password reset links
- `PASSWORD_RESET_TOKEN_TTL_MINUTES` — password reset link lifetime in minutes

### Password reset

The app now includes a basic password reset flow:
- users can request a reset link from `/forgot-password`
- the reset form lives at `/reset-password?token=...`
- reset tokens are single-use and expire automatically

Current implementation note:
- reset link delivery is scaffolded in-app and currently returns a ready-to-use reset link in the server action response
- the next production step is wiring this to a real email provider

## Deployment

Document deployment steps in `docs/deploy-notes.md`.

## Database mode

Quote Chaser now runs in **database-only** mode.

Current behavior:
- `DATABASE_URL` is required
- the app reads/writes through the Prisma-backed repository
- `npm run prisma:generate` generates the client
- `npm run prisma:migrate` applies local migrations during development
- production deploys should use `npx prisma migrate deploy`

Migration status:
- the repo includes an initial SQL migration at `prisma/migrations/20260401090500_init/migration.sql`
- applying it requires a real Postgres `DATABASE_URL`
- once a database is available, the next steps are:
  1. set `DATABASE_URL`
  2. run `npx prisma migrate deploy`
  3. verify app flows against the database
