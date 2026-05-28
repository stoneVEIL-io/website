# Decision: GBP data path = Places API (official)

_Decided 2026-05-27. Owner: founder. Re-evaluate at: > 500 audits/month or > $20/mo API spend._

## Choice

Google Places API via `@googlemaps/google-maps-services-js`. Paid, ToS-clean, reliable.

## Why this over scraping

- **ToS compliance.** Scraping Maps/Search violates Google's terms. One C&D letter or a UI change kills the audit overnight.
- **Cost is negligible at our volume.** Find Place ~$0.017 + Place Details ~$0.017 + photos ~$0.007 each ≈ **$0.04 per contractor audit** at last published rates (2024; verify in spike). 100 audits/mo ≈ $4/mo. The retainer pays for 75x our audit cost.
- **Real reviews via API.** Up to 5 most-recent reviews come back via Place Details (`reviews` field) without scraping.

## Operational notes

- **Input UX choice (finalized during spike):** ask the contractor for **business name + city/state**, not a Maps URL. URLs are shortlinks (`maps.app.goo.gl`) that need redirect-following and CID extraction. Name+city goes straight into Find Place. Simpler for the contractor and the code.
- **Quota:** default Places API quota is 1000 requests/sec, more than enough.
- **Billing:** API key requires a GCP billing account. Set a $20/mo budget alert in GCP to catch misuse.
- **Fallback if API call fails or business isn't found:** show a graceful "we couldn't find your business automatically — paste your GBP URL here" textarea. Logged for follow-up but does not block form submission.

## When to revisit

- Audit volume exceeds 500/mo (cost crosses $20/mo — still negligible, but worth checking pricing changes)
- Google releases a meaningfully better Places API (New) with different cost model
- We need fields not in legacy Place Details (e.g., service-area boundaries, booking-link metadata)
