/**
 * Phase 0 / Task 0.1 spike: Google Places API GBP data fetch.
 *
 * Usage:
 *   npx tsx scripts/gbp-spike.ts "Business Name" "City, State"
 *
 * Requires GOOGLE_PLACES_API_KEY in .env.
 *
 * Outputs the data fields we plan to feed into Gemini for the contractor audit:
 *   name, address, phone, website, hours, rating, review count, top reviews,
 *   services (from types + editorial_summary), photo count.
 */

import "dotenv/config";
import { Client, PlaceInputType } from "@googlemaps/google-maps-services-js";

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

const client = new Client({});

const query = `${name} ${location}`;

const find = await client.findPlaceFromText({
  params: {
    input: query,
    inputtype: PlaceInputType.textQuery,
    fields: ["place_id", "name", "formatted_address"],
    key: API_KEY,
  },
});

const candidate = find.data.candidates[0];
if (!candidate?.place_id) {
  console.error(`No place found for "${query}".`);
  console.error("Status:", find.data.status);
  process.exit(2);
}

const details = await client.placeDetails({
  params: {
    place_id: candidate.place_id,
    fields: [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "website",
      "opening_hours",
      "rating",
      "user_ratings_total",
      "reviews",
      "types",
      "editorial_summary",
      "photo",
    ],
    key: API_KEY,
  },
});

const d = details.data.result;

const summary = {
  name: d.name,
  address: d.formatted_address,
  phone: d.formatted_phone_number ?? null,
  website: d.website ?? null,
  rating: d.rating ?? null,
  reviewCount: d.user_ratings_total ?? 0,
  hours: d.opening_hours?.weekday_text ?? null,
  types: d.types ?? [],
  editorialSummary: d.editorial_summary?.overview ?? null,
  photoCount: d.photos?.length ?? 0,
  topReviews: (d.reviews ?? []).slice(0, 5).map((r) => ({
    rating: r.rating,
    author: r.author_name,
    text: r.text?.slice(0, 200),
    relativeTime: r.relative_time_description,
  })),
};

console.log(JSON.stringify(summary, null, 2));
