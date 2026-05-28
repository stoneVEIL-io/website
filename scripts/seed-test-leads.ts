/**
 * Phase 0 helper: drop a few realistic test leads into Neon so the founder
 * can verify the connection + see rows in the Neon dashboard.
 *
 * Uses the existing schema (lib/schema.ts) — strain values match the
 * current site's whitelist (lib/validation.ts ALLOWED_STRAINS).
 *
 * After Phase 2.1 migration, this script should be updated to include
 * the new qualifying fields (gbpUrl, trade, qualificationScore, etc.).
 *
 * Usage:
 *   npx tsx scripts/seed-test-leads.ts
 */

import "dotenv/config";
import { db } from "../lib/db";
import { leads } from "../lib/schema";

const testLeads = [
  {
    name: "Daniel Cruz",
    email: "daniel+test@example.com",
    company: "Cruz HVAC Services",
    phone: "(512) 555-0142",
    strain: "Invoicing & payments",
    process: "I send quotes from a spreadsheet, then re-key them into QuickBooks. Customers wait days for invoices. We miss follow-ups on overdue ones.",
    roiHours: 12,
    roiSavings: 31200,
  },
  {
    name: "Maria Alvarez",
    email: "maria+test@example.com",
    company: "Alvarez Electric LLC",
    phone: "(737) 555-0188",
    strain: "Lead generation & intake",
    process: "Phone rings while I'm on a job, calls go to voicemail, I lose half of them. Want texts/automated replies that book calls.",
    roiHours: 8,
    roiSavings: 21600,
  },
  {
    name: "Sam Whitfield",
    email: "sam+test@example.com",
    company: "Whitfield Lawn & Landscape",
    phone: null,
    strain: "Scheduling & calendar",
    process: "Two crews, shared paper calendar. Customers double-book us. I want a real system but every quote I get is $50K+.",
    roiHours: 6,
    roiSavings: 14400,
  },
];

const inserted = await db.insert(leads).values(testLeads).returning({
  id: leads.id,
  name: leads.name,
  company: leads.company,
  strain: leads.strain,
  createdAt: leads.createdAt,
});

console.log(`Inserted ${inserted.length} test leads:`);
for (const row of inserted) {
  console.log(`  id=${row.id}  ${row.name} (${row.company})  strain="${row.strain}"  at ${row.createdAt.toISOString()}`);
}
