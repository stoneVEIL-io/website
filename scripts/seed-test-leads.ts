/**
 * Helper: drop a few realistic test contractor leads into Neon so the founder
 * can verify the Phase 2.1 schema + see rows in the Neon dashboard.
 *
 * Trade/lead-source values match the whitelists in lib/validation.ts.
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
    trade: "HVAC",
    serviceArea: "Austin, TX",
    currentLeadSource: "Google search (organic / Map Pack)",
    estMonthlySearches: 180,
    estCloseRate: 18,
    estTicket: 650,
  },
  {
    name: "Maria Alvarez",
    email: "maria+test@example.com",
    company: "Alvarez Electric LLC",
    trade: "Electrician",
    serviceArea: "Round Rock, TX",
    currentLeadSource: "Word of mouth / referrals",
    estMonthlySearches: 90,
    estCloseRate: 22,
    estTicket: 480,
  },
  {
    name: "Sam Whitfield",
    email: "sam+test@example.com",
    company: "Whitfield Lawn & Landscape",
    trade: "Landscaping / lawn care",
    serviceArea: "Denver, CO",
    currentLeadSource: "I don't really track it",
    estMonthlySearches: 220,
    estCloseRate: 10,
    estTicket: 320,
  },
];

const inserted = await db.insert(leads).values(testLeads).returning({
  id: leads.id,
  name: leads.name,
  company: leads.company,
  trade: leads.trade,
  serviceArea: leads.serviceArea,
  createdAt: leads.createdAt,
});

console.log(`Inserted ${inserted.length} test leads:`);
for (const row of inserted) {
  console.log(`  id=${row.id}  ${row.name} (${row.company})  ${row.trade} in ${row.serviceArea}  at ${row.createdAt.toISOString()}`);
}
