/**
 * Phase 0 / Task 0.1 spike: Places API (New) GBP data fetch.
 *
 * Uses the new places.googleapis.com endpoints because legacy Places API is
 * no longer enableable for new GCP projects (Google deprecation as of 2025).
 *
 * Usage:
 *   npx tsx scripts/gbp-spike.ts "Business Name" "City, State"
 *
 * Requires GOOGLE_PLACES_API_KEY in .env with Places API (New) enabled.
 */

import "dotenv/config";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_PLACES_API_KEY in .env");
  process.exit(1);
}

const [, , name, location] = process.argv;
if (!name || !location) {
  console.error('Usage: npx tsx scripts/gbp-spike.ts "Business Name" "City, State"');
  process.exit(1);
}

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

const searchRes = await fetch(SEARCH_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
  },
  body: JSON.stringify({ textQuery: `${name} ${location}` }),
});

if (!searchRes.ok) {
  console.error("Text Search failed:", searchRes.status);
  console.error(await searchRes.text());
  process.exit(3);
}

const searchData = (await searchRes.json()) as {
  places?: Array<{ id: string; displayName?: { text?: string }; formattedAddress?: string }>;
};

const first = searchData.places?.[0];
if (!first?.id) {
  console.error(`No place found for "${name} ${location}".`);
  console.error("Response:", JSON.stringify(searchData, null, 2));
  process.exit(2);
}

const DETAILS_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
  "rating",
  "userRatingCount",
  "reviews",
  "types",
  "editorialSummary",
  "photos",
  "primaryType",
  "primaryTypeDisplayName",
].join(",");

const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${first.id}`, {
  headers: {
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": DETAILS_FIELDS,
  },
});

if (!detailsRes.ok) {
  console.error("Place Details failed:", detailsRes.status);
  console.error(await detailsRes.text());
  process.exit(4);
}

const d = (await detailsRes.json()) as any;

const summary = {
  id: d.id,
  name: d.displayName?.text,
  primaryType: d.primaryTypeDisplayName?.text ?? d.primaryType,
  address: d.formattedAddress,
  phone: d.nationalPhoneNumber ?? null,
  website: d.websiteUri ?? null,
  rating: d.rating ?? null,
  reviewCount: d.userRatingCount ?? 0,
  hours: d.regularOpeningHours?.weekdayDescriptions ?? null,
  types: d.types ?? [],
  editorialSummary: d.editorialSummary?.text ?? null,
  photoCount: d.photos?.length ?? 0,
  topReviews: (d.reviews ?? []).slice(0, 5).map((r: any) => ({
    rating: r.rating,
    author: r.authorAttribution?.displayName,
    text: r.text?.text?.slice(0, 200) ?? r.originalText?.text?.slice(0, 200),
    relativeTime: r.relativePublishTimeDescription,
  })),
};

console.log(JSON.stringify(summary, null, 2));
