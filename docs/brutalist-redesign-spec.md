# Whole-site brutalist migration — spec v0.1

**Status:** Draft. Phase 1 in progress. Not signed off.
**Branch:** `brutalist-redesign` (cut from `main` at commit `87efb5d`)
**Started:** 2026-07-23
**Owner:** origin@stoneveil.io (solo)

---

## 0. Motivation

Full brand pivot. stoneVEIL's visual identity is moving from the current Cabinet-Grotesk / cobalt / hairline-paper system (deployed 2026-07-23 as `stoneveil-web-00029-b52`) to Swiss Industrial Print brutalism. Every user-facing surface migrates. The Cabinet Grotesk system is retired.

Driver: brand commitment, not aesthetic exploration or A/B test. Once shipped, this replaces the current aesthetic entirely.

---

## 1. Scope

**In scope (rebuild):**
- Homepage — `src/App.tsx` (1044 lines: sticky header, hero with grade-shift plate, 4-stat band, 5-row automations zigzag, 3-step how-it-works, founder-note aside, hairline pricing ledger, lead-capture form + ROI calculator + AI audit result render, FAQ, dark CTA strip, footer, mobile sticky bottom bar)
- Landing pages — `public/ai-receptionist-for-contractors.html`, `public/automate-estimate-follow-up-construction.html`, `public/automate-scheduling-and-invoicing-for-contractors.html` (throwing away today's redesign)
- Privacy policy — `public/privacy-policy.html`
- Shared CSS — `src/index.css`, `public/assets/landing.css` (replace with brutalist tokens)

**Out of scope (do not touch):**
- Admin dashboard (`/admin/dashboard`), demo generator (`/admin/demo`) — internal, no user impact
- `server.ts` — express server logic, no visual concerns
- `/api/lead` payload shape, field names, response shape
- Database schema, drizzle models
- Cloud Run infra, CSP config

---

## 2. Design system lock

### Palette (Swiss Industrial Print)

```
--paper       #F4F4F0   unbleached documentation paper (primary bg)
--paper-alt   #EAE8E3   secondary bg for compartment differentiation
--ink         #050505   carbon ink (primary fg)
--ink-2       #111111   secondary ink
--red         #E61919   aviation / hazard red (single accent, rationed)
--divider     #050505   1-2px structural lines
```

**Gradients, drop shadows, translucency, backdrop-filter: banned.**
**Border-radius: 0 everywhere. Every corner is 90°.**

### Typography

**Macro (structural headers):** Archivo Black (Google Fonts, weight 900, free)
- Scale: `clamp(3rem, 8vw, 12rem)` for hero, `clamp(2rem, 5vw, 5rem)` for section H2
- Tracking: `-0.04em` (tight, forms architectural blocks)
- Leading: `0.9`
- Case: **uppercase only**

**Micro (metadata, nav, telemetry):** JetBrains Mono (Google Fonts, weights 400/700, free)
- Scale: `10-14px` fixed (`0.7rem`-`0.875rem`)
- Tracking: `0.08em` (mechanical typewriter spacing)
- Leading: `1.3`
- Case: **uppercase only**

**Body copy:** JetBrains Mono at `14-15px`, tracking `0`, leading `1.5`, sentence case. Yes, body-copy monospace. That's the brutalist commitment.

**Serif: not used** in this iteration. If added later, must be halftone-treated for textural juxtaposition.

### Geometry

- Zero `border-radius`
- Visible 1-2px solid dividers between compartments
- Full-width `<hr>` at operational breaks
- CSS Grid with `gap: 1px` + contrasting bg technique for razor-thin dividers
- Everything anchored to grid tracks; no floating elements

### Effects

- **Halftone on imagery:** SVG dot-pattern overlay + `mix-blend-mode: multiply` + `filter: grayscale(1) contrast(1.2)`
- **Global grain/noise:** SVG turbulence filter on `body::before` at 5-8% opacity, `pointer-events: none`, `position: fixed`
- **Perf gates:** noise filter only under `@media (hover: hover) and (prefers-reduced-motion: no-preference)`. Halftone always on (perceived, not animated).
- **CRT scanlines:** NO. That's tactical/dark mode. We're on Swiss Print light.

### Symbology (per brutalist skill Section 6)

- ASCII framing: `[ SECTION LABEL ]`, `< REV 2.6 >`, `>>>` for CTAs, `///` for section breaks
- Industrial marks: `®` `©` `™` as structural elements, not legal footers
- Crosshairs (`+`) at grid intersections where they make sense
- Rev codes and unit IDs (`UNIT / D-01`, `REV 2.6`) to simulate active mechanical processes

---

## 3. Preservation contract — MUST NOT BREAK

Functional:
- [ ] `POST /api/lead` payload shape unchanged (name, email, phone, company, trade, serviceArea, gbpUrl, currentLeadSource, estMonthlySearches, estCloseRate, estTicket)
- [ ] Analytics events preserved: `form_view`, `form_submit`, `calendly_clicked`
- [ ] ROI calculator math unchanged (monthlySearches × closeRate × ticket, +10-point uplift model)
- [ ] AI audit result render structure unchanged (tier badge, summary, 3 recommendations, missing-GBP list, Calendly gate if hot)
- [ ] Mobile sticky bottom bar behavior unchanged (visible after 30% scroll on `< 768px`)
- [ ] Grade-shift hero mechanic: **KILLED intentionally**. Grade-shift is a "modern" interaction; brutalism is static. Replace with hard split: massive Archivo Black h1 on one side, halftoned worksite plate on the other.

SEO:
- [ ] All schema.org JSON-LD blocks preserved verbatim (Organization, Service, FAQPage, BreadcrumbList, WebPage)
- [ ] Canonical URLs unchanged
- [ ] OG cards, Twitter cards, `theme-color` unchanged (except `theme-color` swaps to `#F4F4F0`)
- [ ] URL slugs unchanged
- [ ] H1 wording preserved (text only; visual becomes uppercase Archivo Black)

CSP:
- [ ] No inline `<style>` blocks (prod CSP has strict `style-src`, no `'unsafe-inline'`)
- [ ] No inline `style="..."` attributes (same reason)
- [ ] New font: JetBrains Mono on Google Fonts. Archivo Black on Google Fonts. Both under existing whitelist (`fonts.googleapis.com`, `fonts.gstatic.com`). No CSP change needed.
- [ ] SVG filter for grain is inline `<svg>` in DOM — that's inline SVG data, not inline CSS. Verify no CSP violation.

---

## 4. Phased delivery

### Phase 1 — Design system (2-3 hrs)

Deliverables:
- `public/assets/brutalist.css` — shared tokens + primitives (buttons, hairlines, ascii-framers, halftone utility)
- `src/index.css` — updated with brutalist tokens for the React SPA
- Font imports: Archivo Black + JetBrains Mono (parallel-load with Cabinet Grotesk during transition, so old pages don't break mid-migration)
- 1 landing page migrated as smoke test (`ai-receptionist` recommended — most complex compare block, best test)
- Preview-deploy to Cloud Run with `--no-traffic --tag=brutalist`
- Screenshot review + sign-off gate

**Blocker gate:** Phase 2 does not start until Phase 1 tokens are signed off on a live preview URL.

### Phase 2 — Landing pages (2-3 hrs)

Migrate remaining 2 landing pages to match Phase 1 smoke test. Add ASCII framing, halftone plate treatment, rev codes. All 3 pages consistent.

**Blocker gate:** Sign-off before Phase 3.

### Phase 3 — Homepage (6-8 hrs)

Rewrite `src/App.tsx` section-by-section, top-down. Special care:
- **Lead form:** brutalist inputs = hard-bordered rectangles, uppercase mono labels, mono placeholder, no rounded focus rings — swap for inverted-color focus (bg → red)
- **ROI sliders:** custom brutalist range input — hard-edged 2px track, 12×12px hard-edged red thumb, mono value readout in the corner. Uses `::-webkit-slider-thumb` / `::-moz-range-thumb`. Cross-browser tested.
- **AI audit result cards:** `[ STRATEGY 01 ]` uppercase mono header, red 2px divider strip, mono body, `>>>` CTA arrow
- **Grade-shift plate:** KILLED. Replace with hard 2-column split (massive h1 / halftoned worksite plate).
- **Mobile sticky bar:** 2px black top border, aviation-red block CTA, `[ FREE / 48 HR ]` mono label.

**Blocker gate:** Full functional smoke test — form submits, ROI calc updates, audit result renders, mobile sticky bar appears at correct scroll depth, analytics events fire. Preview-deploy sign-off before Phase 4.

### Phase 4 — Privacy policy (30-60 min)

Rewrite `public/privacy-policy.html`. Small file, low risk. Preserve all legal text verbatim (compliance).

### Phase 5 — Ship (2-3 hrs)

- Cross-browser check: Chrome (mac + Win), Firefox, Safari (mac + iOS mobile)
- Lighthouse audit — halftone SVG + noise filter cost. Target LCP < 2.5s, CLS < 0.1.
- Analytics event smoke test in prod-like env
- Merge `brutalist-redesign` → `main`, prod deploy
- Live verify all URLs
- Update site-wide meta `theme-color` from `#14161A` to `#050505` (or keep for mobile browser chrome — the paper is `#F4F4F0` so `#050505` is a stronger chrome contrast)

**Total honest work: 12-18 hrs over multiple sessions.**

---

## 5. Preview-deploy strategy

Cloud Run supports `--no-traffic` + tag-based routing to deploy a revision at a separate URL without touching production traffic. Command for each phase:

```bash
gcloud run deploy stoneveil-web \
  --source . \
  --project savvy-reach-496302-r2 \
  --region us-west1 \
  --no-traffic \
  --tag brutalist
```

Preview URL will be `https://brutalist---stoneveil-web-<hash>.us-west1.run.app`. Prod traffic continues on the current revision until Phase 5 promotes brutalist to 100%.

Promotion command:
```bash
gcloud run services update-traffic stoneveil-web \
  --project savvy-reach-496302-r2 \
  --region us-west1 \
  --to-tags brutalist=100
```

Rollback command (if brutalist ships and needs to be reverted):
```bash
gcloud run services update-traffic stoneveil-web \
  --project savvy-reach-496302-r2 \
  --region us-west1 \
  --to-revisions stoneveil-web-00029-b52=100
```

---

## 6. Open questions to resolve during Phase 1

1. **New imagery generation.** User committed to new brutalist-native imagery (not repurposing existing plates via halftone overlay). Options: Higgs MCP image gen (memory notes Gemini prepay depleted; Higgs balance status unknown, needs check), or hand-crafted SVG blueprints/diagrams. **Decision needed before Phase 2.**
2. **Founder-note aside (homepage):** the current "Who's building this" side-rail with the 8yrs/4yrs stats is warm brand copy. Brutalist rewrite could preserve content but shift visual entirely (mono block with red divider). Or the section could be cut. **Decision needed before Phase 3.**
3. **FAQ interaction:** current homepage uses `+/−` toggle to expand answers. Brutalist alt: `[+]`/`[-]` uppercase mono glyphs. Same behavior. Or: static-open, no toggle (matches landing page pattern). **Decision needed before Phase 3.**
4. **Body copy in JetBrains Mono:** committing to monospace body copy is a strong brutalist statement. It affects readability at scale. **Confirm during Phase 1 preview.** If it fails the readability check on real content, fall back to a neo-grotesque body (Inter Regular) with Mono reserved for metadata only.

---

## 7. Preservation of retiring aesthetic (Cabinet Grotesk system)

The current Cabinet Grotesk + cobalt + hairline aesthetic is being retired, not archived. Once Phase 5 ships, the retiring aesthetic is gone from prod. Reference material remains in git history — commit `87efb5d` is the last commit of the retiring aesthetic. Anyone who wants to see it can check out that commit.

No side-by-side archive page. No preservation site. Clean break.

---

## 8. Next steps

- **Now (Phase 1, this session or next):** brutalist.css tokens + font loads + 1 landing page smoke test + preview deploy + screenshot review
- **Session 2:** Phase 2 (remaining 2 landing pages)
- **Session 3-5:** Phase 3 (homepage sections)
- **Session 6:** Phases 4 + 5 (privacy + ship)

Session boundary discipline: no phase ships until its blocker gate is passed and signed off. No going straight from "we deployed" to "we're throwing it all away" in the same session (which is exactly the pattern that led to this spec).
