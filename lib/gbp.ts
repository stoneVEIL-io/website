export interface GbpData {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  hours: string[] | null;
  types: string[];
  editorialSummary: string | null;
  photoCount: number;
  topReviews: Array<{
    rating: number;
    author: string | null;
    text: string | null;
    relativeTime: string | null;
  }>;
}

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

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

export async function fetchGbpData(businessName: string, cityState: string): Promise<GbpData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set — GBP fetch skipped.");
    return null;
  }

  try {
    const searchRes = await fetch(SEARCH_URL, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: `${businessName} ${cityState}` }),
    });

    if (!searchRes.ok) {
      console.warn(`Places Text Search failed: ${searchRes.status} — GBP fetch skipped.`);
      return null;
    }

    const searchData = (await searchRes.json()) as {
      places?: Array<{ id: string; displayName?: { text?: string }; formattedAddress?: string }>;
    };

    const first = searchData.places?.[0];
    if (!first?.id) {
      console.warn(`No GBP place found for "${businessName} ${cityState}" — proceeding without GBP data.`);
      return null;
    }

    const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${first.id}`, {
      signal: AbortSignal.timeout(5000),
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": DETAILS_FIELDS,
      },
    });

    if (!detailsRes.ok) {
      console.warn(`Places Details failed: ${detailsRes.status} — GBP fetch skipped.`);
      return null;
    }

    const d = (await detailsRes.json()) as any;

    return {
      name: d.displayName?.text ?? businessName,
      address: d.formattedAddress ?? null,
      phone: d.nationalPhoneNumber ?? null,
      website: d.websiteUri ?? null,
      rating: d.rating ?? null,
      reviewCount: d.userRatingCount ?? 0,
      hours: d.regularOpeningHours?.weekdayDescriptions ?? null,
      types: d.types ?? [],
      editorialSummary: d.editorialSummary?.text ?? null,
      photoCount: d.photos?.length ?? 0,
      topReviews: ((d.reviews ?? []) as any[]).slice(0, 5).map((r) => ({
        rating: r.rating,
        author: r.authorAttribution?.displayName ?? null,
        text: r.text?.text?.slice(0, 200) ?? r.originalText?.text?.slice(0, 200) ?? null,
        relativeTime: r.relativePublishTimeDescription ?? null,
      })),
    };
  } catch (err) {
    console.warn("GBP fetch error (non-fatal):", err);
    return null;
  }
}
