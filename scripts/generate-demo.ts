/**
 * Demo page generator CLI.
 *
 * Usage:
 *   npx tsx scripts/generate-demo.ts "Acme Plumbing" "Denver, CO"
 *
 * Output: ./demo-output/acme-plumbing-demo.html
 * Requires: GEMINI_API_KEY (and optionally GOOGLE_PLACES_API_KEY) in .env
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { generateDemoPage } from "../lib/demo";

const [, , businessName, cityState] = process.argv;

if (!businessName || !cityState) {
  console.error('Usage: npx tsx scripts/generate-demo.ts "Business Name" "City, State"');
  process.exit(1);
}

console.log(`Generating demo page for "${businessName}" in "${cityState}"...`);
const start = Date.now();

try {
  const html = await generateDemoPage(businessName, cityState);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const outDir = path.join(process.cwd(), "demo-output");
  fs.mkdirSync(outDir, { recursive: true });

  const slug = businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const outFile = path.join(outDir, `${slug}-demo.html`);
  fs.writeFileSync(outFile, html, "utf-8");

  console.log(`Done in ${elapsed}s`);
  console.log(`Output: ${outFile}`);
  console.log(`Size: ${(html.length / 1024).toFixed(1)} KB`);
} catch (err) {
  console.error("Generation failed:", err);
  process.exit(1);
}
