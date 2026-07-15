# stoneVEIL Operations — website

Lead-generation site for stoneVEIL Operations LLC: a landing page for 2–3 person
construction contractors, a free "missed-call audit" capture form, and a
server-side audit engine that scores each lead, stores it in Postgres (Neon),
and emails a tailored summary.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4 (`src/`, `index.html`)
- **Backend:** Node + Express (`server.ts`)
- **Database:** Neon Postgres via Drizzle ORM (`lib/db.ts`, `lib/schema.ts`, `drizzle/`)
- **AI audit:** provider abstraction in `lib/ai.ts` (audit logic in `lib/audit.ts`)
- **Email:** Resend (`lib/email.ts`)
- **Business data:** Google Places API for GBP lookups (`lib/gbp.ts`)

## Run locally

Prerequisites: Node.js 20+.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in your keys (see below).
3. Start the dev server: `npm run dev` → http://localhost:3000

## Scripts

- `npm run dev` — Express + Vite middleware in dev mode
- `npm run build` — build the client and bundle the server to `dist/`
- `npm run start` — run the production build
- `npm run lint` — type-check with `tsc --noEmit`

## Environment

All secrets are server-side only and read from `.env` (git-ignored). See
`.env.example` for the full list. The key ones:

- `DATABASE_URL` — Neon Postgres connection string
- `AI_API_KEY` — key for the AI audit provider
- `GOOGLE_PLACES_API_KEY` — Google Places lookups for GBP data
- `RESEND_API_KEY` + `EMAIL_FROM` — outbound audit email
- `CALENDLY_URL` — discovery-call booking link
- `ADMIN_PASSWORD` — gates `/admin/*` (dashboard + demo generator)

See `ARCHITECTURE.md` for how the pieces fit together.
