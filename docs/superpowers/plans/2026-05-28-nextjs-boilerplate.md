# Next.js Boilerplate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Next.js 15 boilerplate with Tailwind v4, shadcn/ui, Auth.js v5 (Google OAuth), and Prisma + Neon PostgreSQL, deployable to Vercel.

**Architecture:** `create-next-app` scaffolds the base; Prisma handles the DB schema and migrations; Auth.js v5 manages sessions via a Prisma adapter; middleware protects the dashboard route group. Two pages: `/login` (Google sign-in) and `/dashboard` (user greeting + sign-out).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Auth.js v5 (`next-auth@beta`), `@auth/prisma-adapter`, Prisma 5, Neon PostgreSQL, Vercel

---

## File Map

| File | Purpose |
|---|---|
| `package.json` | Dependencies + `postbuild` migration script |
| `prisma/schema.prisma` | Auth.js four-model schema (User, Account, Session, VerificationToken) |
| `.env.example` | Committed template for required env vars |
| `.env.local` | Local secrets (gitignored, never committed) |
| `src/app/globals.css` | Tailwind v4 import + shadcn CSS variables |
| `src/app/layout.tsx` | Root layout |
| `src/lib/utils.ts` | `cn()` helper (created by shadcn init) |
| `src/lib/db.ts` | Prisma client singleton (prevents connection exhaustion on Vercel) |
| `src/lib/auth.ts` | Auth.js config: Google provider + Prisma adapter |
| `src/types/next-auth.d.ts` | Extends Session type to include `user.id` |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js GET/POST route handlers |
| `src/middleware.ts` | Redirects unauthenticated users from /dashboard to /login |
| `src/app/(auth)/login/page.tsx` | Login page: Google sign-in button |
| `src/app/(auth)/error/page.tsx` | Auth error page |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard: greeting + sign-out |
| `src/components/ui/button.tsx` | shadcn Button (generated) |
| `src/components/ui/card.tsx` | shadcn Card (generated) |

---

### Task 1: Scaffold Next.js 15 project

**Files:**
- Creates: all base project files via `create-next-app`

- [ ] **Step 1: Scaffold the project**

Run from inside `nextjs-boilerplate/` (the current working directory). The `--yes` flag accepts defaults where not overridden.

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

Expected output ends with:
```
Success! Created your app at ...
```

> If prompted "The directory is not empty. Proceed anyway?", answer **Yes** — the existing `docs/` folder is safe.

- [ ] **Step 2: Verify the dev server starts**

```bash
npm run dev
```

Open http://localhost:3000. Expected: Next.js default welcome page renders. Stop with `Ctrl+C`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project"
```

---

### Task 2: Configure shadcn/ui

**Files:**
- Creates: `components.json`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`
- Modifies: `src/app/globals.css`, `src/lib/utils.ts`

- [ ] **Step 1: Initialize shadcn**

```bash
npx shadcn@latest init --defaults
```

If interactive, accept all defaults (Style: Default, Base color: Neutral, CSS variables: Yes).

Expected: `components.json` created in project root, `src/app/globals.css` updated with `@layer base` CSS variables.

- [ ] **Step 2: Add button and card components**

```bash
npx shadcn@latest add button card
```

Expected:
```
✔ Done.
```

Files created: `src/components/ui/button.tsx`, `src/components/ui/card.tsx`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui with button and card components"
```

---

### Task 3: Set up Prisma + Neon

**Files:**
- Creates: `prisma/schema.prisma`, `src/lib/db.ts`, `.env.example`
- Modifies: `package.json`

- [ ] **Step 1: Install Prisma packages**

```bash
npm install @prisma/client
npm install -D prisma
```

- [ ] **Step 2: Create `prisma/schema.prisma`**

Create the file at the project root (alongside `src/`, not inside it):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
}
```

- [ ] **Step 3: Create `.env.example`**

```
# .env.example
AUTH_SECRET=replace-with-openssl-rand-base64-32
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
DATABASE_URL=postgresql://user:pass@pooler.neon.tech/dbname?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@direct.neon.tech/dbname?sslmode=require
```

- [ ] **Step 4: Create `.env.local` with real values**

Copy `.env.example` to `.env.local` and fill in:

- **`AUTH_SECRET`**: Run `openssl rand -base64 32` (or any 32+ char random string locally)
- **`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`**: From [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application). Add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs.
- **`DATABASE_URL`**: From Neon dashboard → Connection Details → select "Pooled connection"
- **`DATABASE_URL_UNPOOLED`**: From Neon dashboard → Connection Details → select "Direct connection"

> `.env.local` is already in `.gitignore` — never commit it.

- [ ] **Step 5: Validate the schema**

```bash
npx prisma validate
```

Expected:
```
✔  The schema at "prisma/schema.prisma" is valid 🚀
```

- [ ] **Step 6: Run the initial migration**

```bash
npx prisma migrate dev --name init
```

Expected:
```
✔ Generated Prisma Client (v5.x.x)
The following migration(s) have been applied:
  migrations/..._init/migration.sql
```

- [ ] **Step 7: Create `src/lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] **Step 8: Add `postbuild` script to `package.json`**

In `package.json`, update the `"scripts"` section:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "postbuild": "prisma migrate deploy",
  "start": "next start",
  "lint": "next lint"
}
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 10: Commit**

```bash
git add prisma/ src/lib/db.ts .env.example package.json
git commit -m "chore: add Prisma schema and Neon database setup"
```

> Do NOT `git add .env.local`.

---

### Task 4: Configure Auth.js v5

**Files:**
- Creates: `src/lib/auth.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Install Auth.js packages**

```bash
npm install next-auth@beta @auth/prisma-adapter
```

- [ ] **Step 2: Create `src/lib/auth.ts`**

```ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
```

- [ ] **Step 3: Create `src/types/next-auth.d.ts`**

This extends the built-in `Session` type to include `user.id`:

```ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
```

- [ ] **Step 4: Create `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/types/ src/app/api/
git commit -m "feat: add Auth.js v5 with Google OAuth provider"
```

---

### Task 5: Add route protection middleware

**Files:**
- Creates: `src/middleware.ts`

- [ ] **Step 1: Create `src/middleware.ts`**

```ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isOnLogin = req.nextUrl.pathname.startsWith("/login")

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: protect /dashboard route, redirect unauthenticated to /login"
```

---

### Task 6: Build login and error pages

**Files:**
- Creates: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/error/page.tsx`

- [ ] **Step 1: Create `src/app/(auth)/login/page.tsx`**

```tsx
import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">My App</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/(auth)/error/page.tsx`**

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>Something went wrong during sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Try again</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/"
git commit -m "feat: add login and auth error pages"
```

---

### Task 7: Build dashboard page

**Files:**
- Creates: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/dashboard/page.tsx`**

```tsx
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-xl font-medium">
        안녕하세요, {session.user?.name ?? session.user?.email}님
      </p>
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/login" })
        }}
      >
        <Button type="submit" variant="outline">
          로그아웃
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Run a full production build**

```bash
npm run build
```

Expected: build completes without errors. The `postbuild` step (`prisma migrate deploy`) also runs — this is safe with real Neon credentials in `.env.local`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/"
git commit -m "feat: add dashboard page with user greeting and sign-out"
```

---

### Task 8: Smoke test and Vercel deployment

**Files:**
- No new files

- [ ] **Step 1: Verify `.env.local` is gitignored**

```bash
git status
```

`.env.local` must NOT appear in the output. If it does:

```bash
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "chore: ensure .env.local is gitignored"
```

- [ ] **Step 2: Smoke-test the full auth flow locally**

```bash
npm run dev
```

Test these steps in order:

1. Open http://localhost:3000 — expect redirect to http://localhost:3000/login
2. Click "Sign in with Google" — expect Google OAuth consent screen
3. Complete sign-in — expect redirect to http://localhost:3000/dashboard
4. Verify page shows: `안녕하세요, [Your Google Name]님`
5. Click "로그아웃" — expect redirect back to `/login`
6. Verify DB via Prisma Studio: run `npx prisma studio` and confirm `User`, `Account`, `Session` tables have entries.

Stop the server with `Ctrl+C`.

- [ ] **Step 3: Deploy to Vercel**

1. Push the repository to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new → import the GitHub repo
3. In Vercel project Settings → Environment Variables, add all five variables:
   - `AUTH_SECRET`
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
   - `DATABASE_URL` (Neon pooled)
   - `DATABASE_URL_UNPOOLED` (Neon direct)
4. In Google Cloud Console → OAuth credentials → edit the client → add `https://YOUR-APP.vercel.app/api/auth/callback/google` to Authorized redirect URIs
5. Trigger a Vercel deploy (push a commit or click "Redeploy")
6. Verify the deployed app at `https://YOUR-APP.vercel.app`:
   - `/` → redirects to `/login`
   - Google sign-in works end-to-end
   - Dashboard shows user name
   - Sign-out works
