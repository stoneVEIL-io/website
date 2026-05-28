# Decision: Calendly (free) + Resend (email)

_Decided 2026-05-27. Owner: founder._

## Calendly

- **Tier:** free. The free plan supports a public scheduling URL with prefilled query params (`?name=&email=`), which is all we need for hot-tier prospects.
- **Account:** founder creates one event type, "Stoneveil Discovery Call — 15 min," and shares the URL.
- **Env var:** `CALENDLY_URL` — the full URL of that event type (e.g., `https://calendly.com/stoneveil/discovery-15`).
- **Webhook deferred** until > 10 leads/mo. At MVP volume the founder can manually mark "booked" in Calendly's dashboard and reconcile against the `leads` table.

## Email transport: Resend

- **Why over SendGrid/Postmark/Mailgun:** cleanest DX for solo founders, $0 up to 3,000 emails/mo, simple API, modern docs.
- **Domain setup (founder action):** verify a sending domain in Resend's dashboard. Add SPF, DKIM, DMARC records to DNS. Use a real mailbox (e.g., `origin@stoneveil.io` or `audits@stoneveil.io` forwarded to `origin@`) — never send from `noreply@` for a 1-person business; replies are valuable signal and should land in the founder's inbox.
- **Env vars:**
  - `RESEND_API_KEY` — created in Resend dashboard
  - `EMAIL_FROM` — verified sender, e.g., `"Stoneveil <origin@stoneveil.io>"`. This is the From: header the contractor sees + the default reply destination.
- **Failure mode:** email send is non-blocking. If Resend errors, the lead is still persisted, the audit is still shown to the user, and the failure is logged.

## What this unblocks

- Task 2.3 (Conditional Calendly + nurture email) can proceed once `CALENDLY_URL`, `RESEND_API_KEY`, and `EMAIL_FROM` are populated.
