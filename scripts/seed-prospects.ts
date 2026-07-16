/**
 * Seed the `leads` table with REAL contractor prospects for testing the funnel
 * and admin dashboard end to end (Google Places -> AI audit -> Neon).
 *
 * Run locally (your machine can reach Places + Neon; the cloud sandbox cannot):
 *
 *   # Enrich + score a built-in list of real Denver-metro contractors:
 *   npx tsx scripts/seed-prospects.ts curated
 *
 *   # Live-search Google Places for a trade in an area, top N results:
 *   npx tsx scripts/seed-prospects.ts search "Denver, CO" plumber 5
 *
 * Requires in .env: DATABASE_URL, GOOGLE_PLACES_API_KEY, AI_API_KEY (optional —
 * falls back to a deterministic audit if absent).
 *
 * SAFETY: inserts a placeholder contact email (prospect+<slug>@stoneveil.io) and
 * NEVER sends an email. Replace with a verified contact address before any real
 * outreach.
 */
import "dotenv/config";
import { db } from "../lib/db";
import { leads } from "../lib/schema";
import { fetchGbpData } from "../lib/gbp";
import { runAudit, buildFallbackAudit } from "../lib/audit";
import { getAiClient } from "../lib/ai";

type Target = { company: string; trade: string; website?: string };

// Real Denver-metro contractors gathered for testing. NOTE: a few are larger
// than the 2–3 person ICP — good for exercising the scoring spread, but filter
// to small shops for real outreach.
const CURATED: Target[] = [
  { company: "Christopher's Plumbing", trade: "Plumber", website: "https://christophersplumbing.com" },
  { company: "Brothers Plumbing, Heating & Electric", trade: "Plumber", website: "https://www.brothersplumbing.com" },
  { company: "Mighty Plumbing, Heating, Air & Electric", trade: "Plumber", website: "https://www.mightyph.com" },
  { company: "BHC Air", trade: "HVAC", website: "https://bhcair.com" },
  { company: "UniColorado Heating & Air", trade: "HVAC", website: "https://unicolorado.com" },
  { company: "Major Heating & Air Conditioning", trade: "HVAC", website: "https://majorheating.com" },
  { company: "Cenco Roofing", trade: "Roofer", website: "https://www.cencoroofing.com" },
  { company: "RTP Roofing Company", trade: "Roofer", website: "https://www.rtproofingco.com" },
  { company: "Family Roofing", trade: "Roofer", website: "https://familyroofing.com" },
  { company: "Elite Roofing & Solar", trade: "Roofer", website: "https://elite-roofs.com" },
];

const DEFAULT_AREA = "Denver, CO";

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

// Live Places text search -> top N business display names.
async function searchPlaceNames(query: string, n: number): Promise<string[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not set");
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.displayName",
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: Math.min(20, n) }),
  });
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  const data = (await res.json()) as { places?: Array<{ displayName?: { text?: string } }> };
  return (data.places ?? []).map((p) => p.displayName?.text ?? "").filter(Boolean).slice(0, n);
}

async function seedOne(target: Target, area: string): Promise<string> {
  const gbpData = await fetchGbpData(target.company, area);
  const ai = getAiClient();
  const params = {
    name: "Owner",
    email: `prospect+${slug(target.company)}@stoneveil.io`,
    company: gbpData?.name ?? target.company,
    trade: target.trade,
    serviceArea: area,
    currentLeadSource: "Google search (organic / Map Pack)",
    gbpData,
  };
  const audit = ai ? await runAudit(params, ai) : buildFallbackAudit(params);

  await db.insert(leads).values({
    name: params.name,
    email: params.email,
    company: params.company,
    phone: gbpData?.phone ?? null,
    trade: params.trade,
    serviceArea: area,
    currentLeadSource: params.currentLeadSource,
    gbpUrl: gbpData?.website ?? target.website ?? null,
    qualificationScore: audit.score,
    qualificationTier: audit.tier,
  });
  return `  ${params.company.padEnd(42)} ${audit.tier.toUpperCase().padEnd(5)} ${audit.score}`;
}

async function main() {
  const [mode = "curated", areaArg, tradeArg, nArg] = process.argv.slice(2);
  let targets: Target[] = [];
  let area = DEFAULT_AREA;

  if (mode === "search") {
    area = areaArg || DEFAULT_AREA;
    const trade = tradeArg || "plumber";
    const n = parseInt(nArg || "5", 10);
    const names = await searchPlaceNames(`${trade} in ${area}`, n);
    targets = names.map((company) => ({ company, trade: trade[0].toUpperCase() + trade.slice(1) }));
    console.log(`Found ${targets.length} "${trade}" prospects in ${area}.`);
  } else {
    targets = CURATED;
    console.log(`Seeding ${targets.length} curated prospects in ${area}.`);
  }

  console.log("  COMPANY                                     TIER  SCORE");
  for (const t of targets) {
    try {
      console.log(await seedOne(t, area));
    } catch (e) {
      console.log(`  ${t.company.padEnd(42)} FAILED  ${(e as Error).message}`);
    }
  }
  console.log("\nDone. No emails were sent. View them in the admin dashboard or Neon.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
