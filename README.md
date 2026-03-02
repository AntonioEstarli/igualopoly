# Igualopoly

Interactive educational board game about systemic inequality, built with Next.js + Supabase realtime.

## Requirements

- Node.js 20+
- npm 10+
- A Supabase project (URL + anon key)

## Environment setup

1. Copy the example file:

```bash
cp .env.example .env.local
```

2. Fill these required values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_ADMIN_PASSWORD=choose-a-password
```

If required env vars are missing, the app now throws a clear startup/build error listing the missing keys.

## Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`)

## Core paths

- `src/app/` - routes (`/lobby`, `/character-creation`, `/game`, `/admin`, etc.)
- `src/components/` - UI components (board, dice, metrics, voting, podium)
- `src/lib/supabaseClient.ts` - Supabase client bootstrap and env validation
- `src/lib/gameLogic.ts` - gameplay/business rules
