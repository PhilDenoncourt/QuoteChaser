# Render Migration Guide — Quote Chaser

Quote Chaser is now configured for **database-only** operation.
There is no file-backed production mode anymore.

## Recommended architecture

- **Web service:** Render Node web service
- **Database:** Render PostgreSQL
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Migration command:** `npx prisma migrate deploy`

## Required environment variables

### Required
- `DATABASE_URL`
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_NAME=Quote Chaser`
- `APP_BASE_URL=<your Render or custom domain URL>`
- `PASSWORD_RESET_TOKEN_TTL_MINUTES=60`

### Optional
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_DRAFT_CONTEXT_LIMIT`
- `OPENAI_DRAFT_STYLE_HINT`
- `NEXT_PUBLIC_APP_URL=<same as APP_BASE_URL if desired>`

## Important deployment note

Quote Chaser should use **migration-based deploys** on Render:

```bash
npx prisma migrate deploy
```

That is preferred over `prisma db push` for this app.

## Render setup steps

1. Create a Render PostgreSQL database named `quote-chaser-db`
2. Create a Render web service from the GitHub repo
3. Use these settings:
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables:
   - `DATABASE_URL=<Render database connection string>`
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_APP_NAME=Quote Chaser`
   - `APP_BASE_URL=<your app URL>`
   - `PASSWORD_RESET_TOKEN_TTL_MINUTES=60`
5. Configure Render to run migrations during deploy using:
   - `npx prisma migrate deploy`
6. Deploy and test:
   - app loads
   - signup works
   - login works
   - quote creation works
   - follow-up queue works
   - password reset flow builds valid links

## Notes

- Quote Chaser now assumes a database is always present
- Prisma generation happens during build
- If Render installs dependencies narrowly during build, this repo has already been adjusted to keep Prisma/TypeScript build requirements available
