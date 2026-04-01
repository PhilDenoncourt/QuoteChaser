# Deploy Notes

## Target Platform

Heroku

## Deployment Model

- GitHub Actions deploys the app to Heroku on pushes to `main`
- Heroku Postgres provides `DATABASE_URL`
- Heroku release phase runs `npx prisma migrate deploy`
- web process runs `npm run start`

## Required GitHub Secrets

- `HEROKU_API_KEY`
- `HEROKU_APP_NAME`
- `HEROKU_EMAIL`

## Required Heroku Config Vars

- `DATABASE_URL` (usually provided automatically by Heroku Postgres)
- `NEXT_PUBLIC_APP_NAME`
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL` (optional)
- `OPENAI_DRAFT_CONTEXT_LIMIT` (optional)
- `OPENAI_DRAFT_STYLE_HINT` (optional)
- `NODE_ENV=production`

## Build Command

npm run build

## Start Command

npm run start

## Release Command

npx prisma migrate deploy

## First-Time Setup

1. Create the Heroku app
2. Attach Heroku Postgres
3. Set required config vars
4. Add GitHub repo secrets for the deploy workflow
5. Push to `main` or trigger the workflow manually
6. Optionally run `npm run prisma:seed` once if you want starter data copied from `data/quotes.json`

## Post-Deploy Checks

- [ ] app loads
- [ ] dashboard renders
- [ ] follow-up queue renders
- [ ] database-backed read/write works
- [ ] release phase migration succeeds
- [ ] errors/logs checked
