# AGENTS.md — stoneVEIL Operations website

Guidance for AI agents and developers working in this repo. Keep it lean.

## What this is

A lead-generation site for stoneVEIL Operations LLC (AI automation for
construction contractors). A visitor fills the "free missed-call audit" form →
the server validates it, pulls Google Business Profile data, runs an AI audit
that scores the lead (hot/warm/cold), stores it in Neon Postgres, and emails a
tailored summary. Hot leads get a prefilled Calendly link.

## Layout

```
index.html            Vite entry (fonts, meta, Plausible)
src/App.tsx           The single-page React site (hero, sections, form, results)
src/index.css         Tailwind v4 theme + "lift the veil" design tokens
server.ts             Express server: /api/lead, /admin/* (dashboard + demo gen)
lib/ai.ts             AI provider config (model + key resolution) — swap vendor here
lib/audit.ts          Audit + fit-scoring logic (JSON in, AuditResult out)
lib/demo.ts           Demo-page generator (admin tool)
lib/gbp.ts            Google Places / GBP lookups
lib/email.ts          Resend audit email
lib/validation.ts     Input sanitization + lead validation
lib/db.ts, schema.ts  Neon Postgres via Drizzle ORM
drizzle/              SQL migrations
public/assets/        Site imagery (webp)
docs/                 Planning + decision records (historical)
```

## Conventions

- **Secrets** live in `.env` (git-ignored). Never hardcode keys or commit `.env`.
  See `.env.example` for the full list.
- **AI provider** is isolated in `lib/ai.ts`. To change model/vendor, edit only
  that file — the rest of the app depends on `AuditResult`, not a vendor SDK.
- **Untrusted input** (form fields + GBP data) is wrapped in delimiter blocks
  before it reaches the model; the tier is always derived server-side from the
  score, never taken from model output. Preserve this when editing prompts.
- **Database** is Neon Postgres. Schema changes go through Drizzle:
  edit `lib/schema.ts`, then `npx drizzle-kit generate`.

## Common commands

- `npm run dev` — local dev at http://localhost:3000
- `npm run lint` — type-check (`tsc --noEmit`)
- `npm run build` — client build + server bundle to `dist/`
