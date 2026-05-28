# Decision: GBP data path = Places API (official)

_Decided 2026-05-27. Owner: founder. Re-evaluate at: > 500 audits/month or > $20/mo API spend._

## Choice

**Google Places API (New)** via direct `fetch` to `places.googleapis.com/v1`. Paid, ToS-clean, reliable.

**Note on the New vs. legacy choice:** Google has stopped allowing new GCP projects to enable the legacy Places API as of 2025 ("REQUEST_DENIED — You're calling a legacy API"). Our spike on 2026-05-27 confirmed this on a freshly-created project. We use Places API (New) endpoints (`places.googleapis.com`) with `X-Goog-Api-Key` + `X-Goog-FieldMask` headers. The `@googlemaps/google-maps-services-js` SDK targets the legacy endpoints, so we use direct `fetch` instead — fewer deps, smaller bundle.

## Why this over scraping

- **ToS compliance.** Scraping Maps/Search violates Google's terms. One C&D letter or a UI change kills the audit overnight.
- **Cost is negligible at our volume.** Places API (New): Text Search ~$0.032 + Place Details (Pro SKU, includes reviews) ~$0.020 ≈ **$0.05 per contractor audit** at 2025 published rates. 100 audits/mo ≈ $5/mo. The retainer pays for 60x our audit cost. Set the GCP budget alert at $20/mo.
- **Real reviews via API.** Up to 5 most-recent reviews come back via Place Details `reviews` field. New API exposes them as `reviews[].text.text` + `reviews[].authorAttribution.displayName`.

## Operational notes

- **Input UX choice (finalized during spike):** ask the contractor for **business name + city/state**, not a Maps URL. URLs are shortlinks (`maps.app.goo.gl`) that need redirect-following and CID extraction. Name+city goes straight into Find Place. Simpler for the contractor and the code.
- **Quota:** default Places API quota is 1000 requests/sec, more than enough.
- **Billing:** API key requires a GCP billing account. Set a $20/mo budget alert in GCP to catch misuse.
- **Fallback if API call fails or business isn't found:** show a graceful "we couldn't find your business automatically — paste your GBP URL here" textarea. Logged for follow-up but does not block form submission.

## When to revisit

- Audit volume exceeds 500/mo (cost crosses $20/mo — still negligible, but worth checking pricing changes)
- Google releases a meaningfully better Places API (New) with different cost model
- We need fields not in legacy Place Details (e.g., service-area boundaries, booking-link metadata)
