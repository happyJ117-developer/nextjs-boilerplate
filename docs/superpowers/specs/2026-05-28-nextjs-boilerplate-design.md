# Next.js Boilerplate Design

**Date:** 2026-05-28

## Overview

A minimal, production-ready Next.js boilerplate with authentication, database, and a component library. Intended as a personal starting point for new projects — not a feature-rich template, but a clean foundation that works out of the box.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Auth | Auth.js v5 + Google OAuth |
| ORM | Prisma 5 |
| Database | PostgreSQL via Neon (serverless) |
| Deployment | Vercel |

## Project Structure

```
prisma/
└── schema.prisma
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # Login page (Google sign-in)
│   │   └── error/page.tsx        # Auth error page
│   ├── (dashboard)/
│   │   └── dashboard/page.tsx    # Post-login landing page
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   └── layout.tsx                # Root layout
├── components/
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── auth.ts                   # Auth.js config
│   ├── db.ts                     # Prisma client singleton
│   └── utils.ts                  # cn() helper
└── middleware.ts                 # Route protection
```

Route groups `(auth)` and `(dashboard)` separate layout concerns without affecting URL paths.

## Authentication

### Flow

```
User → /login → "Sign in with Google"
→ Google OAuth → /api/auth/callback/google
→ Auth.js saves user/account to DB via Prisma Adapter
→ Session cookie issued → redirect to /dashboard
```

### Key Files

- **`lib/auth.ts`** — `NextAuth({ providers: [Google], adapter: PrismaAdapter(db) })`. Exports `{ auth, signIn, signOut, handlers }`.
- **`middleware.ts`** — Uses `auth()` to protect `/dashboard/**`. Unauthenticated requests redirect to `/login`.
- **`app/api/auth/[...nextauth]/route.ts`** — Re-exports `{ GET, POST }` from `lib/auth.ts`.

### Prisma Auth Schema

Auth.js Prisma Adapter requires four models: `User`, `Account`, `Session`, `VerificationToken`. These are added verbatim from the Auth.js documentation.

### Environment Variables

```
AUTH_SECRET=               # Random secret (openssl rand -base64 32)
AUTH_GOOGLE_ID=            # Google OAuth client ID
AUTH_GOOGLE_SECRET=        # Google OAuth client secret
DATABASE_URL=              # Neon pooled connection string
DATABASE_URL_UNPOOLED=     # Neon direct connection string (for Prisma migrate)
```

## Database

### Prisma + Neon Configuration

`schema.prisma` uses both `url` (pooled) and `directUrl` (unpooled) to support Vercel's serverless environment:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

generator client {
  provider = "prisma-client-js"
}
```

### Prisma Client Singleton

To prevent connection pool exhaustion in serverless:

```ts
// lib/db.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

### Migration Scripts

- `prisma migrate dev` — local development
- `prisma migrate deploy` — run on Vercel via `postbuild` in `package.json`

## UI

### Tailwind v4

Uses the new CSS-first config approach. `globals.css` uses `@import "tailwindcss"` and defines CSS custom properties (`--background`, `--foreground`, etc.) compatible with shadcn/ui.

### shadcn/ui Initial Components

Minimal install: `button`, `card` — sufficient for the login page.

## Pages

### `/login`

- Centered card layout
- App name/logo
- "Sign in with Google" button — calls `signIn("google")` server action
- Redirects to `/dashboard` if already authenticated

### `/dashboard`

- Displays `"안녕하세요, {user.name}님"` and a sign-out button
- Sign-out calls `signOut()` server action
- Middleware redirects unauthenticated users to `/login`

## Vercel Deployment

- Connect GitHub repo to Vercel
- Set all environment variables in Vercel dashboard
- `postbuild` script runs `prisma migrate deploy` automatically on each deploy
- No additional serverless function config needed — Neon's serverless driver handles connection management
