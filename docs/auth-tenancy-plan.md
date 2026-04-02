# Quote Chaser Auth + Tenancy Plan

## Purpose

This document defines the implementation plan for adding authentication and tenant isolation to Quote Chaser so multiple small businesses can use the product without seeing one another’s data.

## Product Goal

Quote Chaser should support:
- multiple small businesses
- authenticated access only
- strict organization-level data isolation
- a simple MVP path that can expand later to team invites and role-based access

---

## MVP Scope

### In scope
- email/password login
- signup flow that creates a company account
- session-based authentication
- one active organization per user in practice
- owner/member roles in the schema
- organization scoping for all quote and activity reads/writes
- route protection for app pages and server actions

### Out of scope for MVP
- email verification
- magic links
- Google OAuth
- teammate invite flow
- multiple active org switching in UI
- advanced RBAC beyond owner/member

---

## Architecture Summary

Quote Chaser should be implemented as a multi-tenant application.

Core rule:

> Every business record must belong to an organization, and every server-side query must be scoped to the current user’s organization.

Authentication answers:
- who is the user?

Tenancy answers:
- which organization is the user allowed to access?

Both are required.

---

## Recommended Auth Direction

Primary recommendation:
- Auth.js-compatible architecture
- credentials-based login
- Prisma-backed persistence

Fallback if Auth.js credentials flow adds too much friction:
- custom email/password auth
- custom session cookie
- Prisma-backed session table

The rest of the app should depend on auth/session utility functions, not on framework-specific details.

---

## Prisma Schema Plan

### Enums

```prisma
enum QuoteStatus {
  sent
  follow_up_due
  waiting
  at_risk
  won
  lost
}

enum ActivityType {
  call
  text
  email
  note
  status_change
}

enum MembershipRole {
  owner
  member
}
```

### New Models

#### Organization

```prisma
model Organization {
  id          String       @id
  name        String
  slug        String       @unique
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  memberships Membership[]
  quotes      Quote[]
  activities  Activity[]
}
```

#### User

```prisma
model User {
  id           String       @id
  email        String       @unique
  name         String?
  passwordHash String
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  memberships  Membership[]
  sessions     Session[]
}
```

#### Membership

```prisma
model Membership {
  id             String          @id
  userId         String
  organizationId String
  role           MembershipRole
  createdAt      DateTime        @default(now())

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId])
}
```

#### Session

```prisma
model Session {
  id           String    @id
  userId       String
  tokenHash    String    @unique
  expiresAt    DateTime
  createdAt    DateTime  @default(now())

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}
```

### Existing Models to Change

#### Quote

```prisma
model Quote {
  id             String       @id
  organizationId String
  customerName   String
  contactName    String?
  phone          String?
  email          String?
  jobAddress     String
  estimateAmount Int
  dateSent       DateTime
  status         QuoteStatus
  nextFollowUpAt DateTime?
  lastContactAt  DateTime?
  notes          String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  activities     Activity[]

  @@index([organizationId, status])
  @@index([organizationId, nextFollowUpAt])
  @@index([organizationId, dateSent])
}
```

#### Activity

```prisma
model Activity {
  id             String       @id
  organizationId String
  quoteId        String
  type           ActivityType
  summary        String
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  quote          Quote        @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  @@index([organizationId, createdAt])
  @@index([quoteId, createdAt])
}
```

---

## Why This Schema

### Why use Membership if MVP is one-org-per-user?
Because it gives us a clean future path for:
- teammate invites
- multi-org memberships later
- role modeling
- less refactor debt

### Why add organizationId to Activity?
Because it improves:
- query safety
- analytics/reporting flexibility
- easier scoping and debugging

### Why include slug on Organization?
Because it gives us flexibility later for:
- cleaner organization references
- URLs or account identifiers
- potential org switching UX

---

## Session Strategy

### Cookie
Use an HTTP-only cookie:
- name: `quote_chaser_session`

Recommended cookie options:
- `httpOnly: true`
- `secure: true` in production
- `sameSite: 'lax'`
- `path: '/'`

### Session creation
On signup/login:
1. generate secure random token
2. hash token with SHA-256
3. store hash in `Session.tokenHash`
4. set raw token in cookie

### Session validation
On request:
1. read cookie
2. hash token
3. look up session by `tokenHash`
4. confirm `expiresAt > now`
5. load user
6. load membership and organization context

### Session expiration
MVP default:
- 30 days

---

## Auth Utility Layer

### `lib/password.ts`
Responsibilities:
- hash password
- verify password

Functions:
- `hashPassword(password: string): Promise<string>`
- `verifyPassword(password: string, hash: string): Promise<boolean>`

Suggested package:
- `bcryptjs`

### `lib/session.ts`
Responsibilities:
- create session
- read session from cookie
- delete session
- require session

Functions:
- `createSession(userId: string): Promise<string>`
- `getSessionFromCookie(): Promise<SessionContext | null>`
- `requireSession(): Promise<SessionContext>`
- `clearSession(): Promise<void>`

Suggested `SessionContext` shape:
- `userId`
- `organizationId`
- `membershipRole`

### `lib/auth.ts`
Responsibilities:
- signup
- login
- logout
- current auth context lookup

Functions:
- `signup(input)`
- `login(input)`
- `logout()`
- `getCurrentUser()`
- `getCurrentOrganization()`
- `requireAuthContext()`

---

## Signup Flow

### Input
- name
- email
- password
- organization name

### Server flow
1. validate input
2. validate email uniqueness
3. hash password
4. generate organization slug
5. create user
6. create organization
7. create membership with role `owner`
8. create session
9. set cookie
10. redirect to dashboard

### Result
The first user becomes the owner of the new organization.

---

## Login Flow

### Input
- email
- password

### Server flow
1. find user by email
2. verify password hash
3. load one membership
4. create session
5. set cookie
6. redirect to dashboard

### MVP assumption
A user effectively belongs to one organization in the UI flow, even though the schema supports more later.

---

## Logout Flow

1. delete current session record
2. clear cookie
3. redirect to `/login`

---

## Route Protection Plan

### Public routes
- `/login`
- `/signup`

### Protected routes
- `/`
- `/quotes/new`
- `/quotes/[id]`
- `/quotes/[id]/edit`
- all quote-related server actions

### Middleware behavior
- unauthenticated access to protected route → redirect `/login`
- authenticated access to `/login` or `/signup` → redirect `/`

### Important note
Middleware is not sufficient on its own.
Server actions and repository/domain entry points must still enforce auth and org scoping.

---

## Multi-Tenant Query Rules

### Rule
Every quote/activity read or write must include the current `organizationId`.

### Good examples

```ts
prisma.quote.findMany({
  where: { organizationId }
})
```

```ts
prisma.quote.findFirst({
  where: { id: quoteId, organizationId }
})
```

### Bad example

```ts
prisma.quote.findUnique({
  where: { id: quoteId }
})
```

That pattern is unsafe for multi-tenant access.

---

## Repository Refactor Plan

### New auth/org/session repository helpers
- `createUserWithOrganization(...)`
- `getUserByEmail(email)`
- `getUserById(userId)`
- `getMembershipForUser(userId)`
- `createSessionRecord(userId, tokenHash, expiresAt)`
- `getSessionByTokenHash(tokenHash)`
- `deleteSessionByTokenHash(tokenHash)`

### Quote repository helpers
- `listQuotesForOrganization(organizationId)`
- `getQuoteForOrganization(organizationId, quoteId)`
- `createQuoteForOrganization(organizationId, quote)`
- `updateQuoteFieldsForOrganization(organizationId, quoteId, patch)`
- `appendQuoteActivityForOrganization(organizationId, quoteId, activity)`
- `updateQuoteStatusForOrganization(organizationId, quoteId, statusUpdate)`

---

## Domain Refactor Plan

The current quote domain API is global.
It should become current-user or org-aware.

### New domain function shape
- `getQuotesForCurrentUser()`
- `getQuoteByIdForCurrentUser(id)`
- `createQuoteForCurrentUser(input)`
- `updateQuoteForCurrentUser(id, input)`
- `addQuoteActivityForCurrentUser(id, input)`
- `updateQuoteStatusForCurrentUser(id, input)`

### Internal flow
Each function should:
1. resolve auth context
2. get current `organizationId`
3. call organization-scoped repository methods

---

## Server Action Refactor Plan

Current actions in `app/quotes/actions.ts` should be updated to call org-aware/current-user domain functions.

### Actions affected
- `createQuoteAction`
- `updateQuoteAction`
- `addActivityAction`
- `updateStatusAction`

### New rule
Every action must require session context before mutating data.

---

## UI Plan

### New pages
- `app/login/page.tsx`
- `app/signup/page.tsx`

### Login page fields
- email
- password

### Signup page fields
- full name
- email
- password
- company name

### App shell updates
After auth is added, the app shell should eventually show:
- organization/company name
- current user
- logout action

This can be minimal for MVP.

---

## Migration and Backfill Plan

Quote Chaser already has quote data, so we should plan for a safe migration.

### Option A: safer production path
1. add new tables
2. add nullable `organizationId` fields temporarily
3. run backfill script
4. make `organizationId` required

### Option B: fast path if data can be reset
1. add all required fields as non-nullable
2. reseed data cleanly

### Recommended path
Use Option A now that Heroku deployment is active.

### Backfill behavior
- create a default organization such as `Migrated Demo Organization`
- assign all existing quotes to that org
- assign all existing activities to that org

Users can be created later through signup.

---

## Packages to Add

### Recommended
- `bcryptjs`
- `zod`

### Optional depending on final auth implementation
- Auth.js packages if we choose the full Auth.js path during implementation

---

## File-Level Implementation Plan

### Prisma
- `prisma/schema.prisma`
- new migration files in `prisma/migrations/...`

### New auth/session files
- `lib/password.ts`
- `lib/session.ts`
- `lib/auth.ts`

### Repository
- expand `lib/repository.ts`

### Domain
- refactor `lib/quotes.ts`

### New pages/actions
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/auth/...` or dedicated login/signup actions

### Middleware
- `middleware.ts`

### Layout
- `app/layout.tsx` for auth-aware shell behavior later

---

## Implementation Sequence

### Milestone 1 — schema foundation
1. add organization, user, membership, session models
2. add organizationId to quote and activity
3. create migration
4. backfill existing data

### Milestone 2 — auth primitives
5. add password hashing utilities
6. add session utilities
7. add signup/login/logout core functions

### Milestone 3 — route protection
8. add middleware
9. protect app routes

### Milestone 4 — data scoping
10. refactor repository methods to org-aware versions
11. refactor domain methods to current-user/org-aware versions
12. update server actions
13. update dashboard/detail pages

### Milestone 5 — UX polish
14. add login/signup UI
15. add logout action
16. show current org/user in app shell

---

## Security Rules

These rules should be treated as hard constraints:

1. No quote query without organization scoping
2. No activity query without organization scoping
3. No mutating server action without authenticated session
4. No trust in client-provided organizationId
5. Current organization must come from server-side session context

---

## Recommended MVP Decisions

- multi-tenant: yes
- single-org-per-user UI: yes
- membership table: yes
- session table: yes
- email/password: yes
- owner/member roles: yes
- invites: later
- password reset: later
- org switching UI: later

---

## Immediate Next Step

Implement Milestone 1:
- update Prisma schema
- generate migration plan
- design backfill strategy for current quote/activity data
