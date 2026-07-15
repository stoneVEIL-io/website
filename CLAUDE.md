# stoneVEIL Operations — website · project status

Living status + roadmap for this repo. Architecture and conventions are in
[AGENTS.md](./AGENTS.md) — read that first if you're an agent picking this up,
then update the dated sections below when you finish a chunk of work.

**Maintained by:** the team + a scheduled "stoneVEIL status updater" agent (weekly).

_Last updated: 2026-07-15 — session: repo cleanup, Neon setup, prospect seeding._

## Recently done
- Migrated the Higgsfield "lift the veil" imagery into the site (optimized WebP).
- De-Googled the AI layer: `lib/gemini.ts` → `lib/audit.ts`; provider isolated in
  `lib/ai.ts` (`AI_API_KEY`, legacy `GEMINI_API_KEY` fallback, `AI_MODEL`). Removed
  AI-Studio/Google branding from README, ARCHITECTURE, config.
- Removed clutter: `scratch/`, `.antigravity/`, GitNexus stubs, `metadata.json`, the
  dev-only HTML-export sandbox. Simplified `lib/db.ts` (Neon). Fixed package identity.
- Build verified (lint + client + server bundle). Pushed to `main`.
- Added `scripts/seed-prospects.ts` — pulls real contractor prospects from Google
  Places, scores them via the audit, inserts into Neon (no emails). Curated Denver
  set + live-search mode.
- Created the `leads` table in Neon (it was missing — form submits weren't persisting).

## In progress / blockers
- **Local ↔ main sync:** run `git fetch origin` then `git reset --hard origin/main`
  to pull the cleaned tree (adds `lib/ai.ts` + `lib/audit.ts`, removes old files).
- **Seed run:** after sync + `leads` table, run `npx tsx scripts/seed-prospects.ts curated`.
- **Cloud sandbox can't reach Neon/Places** (network egress allowlist) — DB writes and
  Places calls must run on the user's machine (or an on-computer Cowork session).

## Next steps (prioritized)
1. Sync local → `npx drizzle-kit push` → seed prospects → confirm `/admin/dashboard`
   (needs `ADMIN_PASSWORD` in `.env`).
2. **Rotate exposed keys** (Neon, AI, Places, Resend) — visible in `.env`; never
   committed, but rotate to be safe.
3. **Email deliverability:** verify the Resend sending domain (SPF/DKIM/DMARC), else
   audit emails land in spam.
4. **Down-funnel nurture (highest impact):** the funnel sends only ONE email today.
   Add a 3-touch sequence for non-bookers, a booking reminder for hot leads that don't
   schedule, and an SMS (Twilio) first-touch for hot leads.
5. **CRM / pipeline:** HubSpot (free) or Airtable for stage tracking + sequences.
6. **Billing:** Stripe for deposits + the $/mo retainer.
7. **Deploy:** Cloud Run + Secret Manager (no `.env` in image), custom domain, HTTPS.
8. **Analytics:** Plausible funnel goals (`form_view` → `form_submit` → `calendly_clicked`).

## How this file is maintained
A scheduled task ("stoneVEIL status updater") runs weekly: it reviews recent repo
activity and refreshes "Recently done" / "In progress" / "Next steps", then reports the
update. Humans and agents should also edit these sections directly when they finish work.
