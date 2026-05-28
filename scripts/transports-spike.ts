/**
 * Phase 0 / Task 0.2 spike: validate Resend send + Calendly prefill URL.
 *
 * Usage:
 *   npx tsx scripts/transports-spike.ts your-test-email@example.com
 *
 * Requires RESEND_API_KEY, EMAIL_FROM, CALENDLY_URL in .env.
 *
 * Sends one test audit email containing a prefilled Calendly link, and
 * prints the prefilled link to stdout so you can click-test it manually.
 */

import "dotenv/config";
import { Resend } from "resend";

const { RESEND_API_KEY, EMAIL_FROM, CALENDLY_URL } = process.env;

if (!RESEND_API_KEY || !EMAIL_FROM || !CALENDLY_URL) {
  console.error("Missing one of: RESEND_API_KEY, EMAIL_FROM, CALENDLY_URL");
  process.exit(1);
}

const [, , to] = process.argv;
if (!to) {
  console.error("Usage: npx tsx scripts/transports-spike.ts your-test-email@example.com");
  process.exit(1);
}

const prefilled = new URL(CALENDLY_URL);
prefilled.searchParams.set("name", "Test Contractor");
prefilled.searchParams.set("email", to);

console.log("Prefilled Calendly URL:");
console.log(prefilled.toString());
console.log();

const resend = new Resend(RESEND_API_KEY);

const result = await resend.emails.send({
  from: EMAIL_FROM,
  to,
  subject: "Your Stoneveil audit — spike test",
  html: `
    <p>Hi Test Contractor,</p>
    <p>This is a transports-spike test. If you got this, Resend works.</p>
    <p><a href="${prefilled.toString()}">Book your 15-min call</a></p>
    <p>— Stoneveil</p>
  `,
});

console.log("Resend response:", JSON.stringify(result, null, 2));
