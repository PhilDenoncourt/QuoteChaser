# Deploy Notes

## Target Platform

Render

## Deployment Model

- Render hosts the app as a Node web service
- Render PostgreSQL provides `DATABASE_URL`
- deploy-time schema changes use `npx prisma migrate deploy`
- web process runs `npm run start`

## Required Environment Variables

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_NAME`
- `APP_BASE_URL`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES`
- `NODE_ENV=production`
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL` (optional)
- `OPENAI_DRAFT_CONTEXT_LIMIT` (optional)
- `OPENAI_DRAFT_STYLE_HINT` (optional)
- `NEXT_PUBLIC_APP_URL` (optional)

## Build Command

npm install && npm run build

## Start Command

npm run start

## Migration Command

npx prisma migrate deploy

## First-Time Setup

1. Create the Render web service
2. Create or attach Render Postgres
3. Set required environment variables
4. Configure deploy-time migrations
5. Deploy from `main`

## Post-Deploy Checks

- [ ] app loads
- [ ] signup works
- [ ] login works
- [ ] dashboard renders
- [ ] follow-up queue renders
- [ ] database-backed read/write works
- [ ] migration step succeeds
- [ ] password reset links use the correct base URL
- [ ] errors/logs checked
