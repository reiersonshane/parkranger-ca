/**
 * scripts/test-places-api.ts
 *
 * Quick test to confirm your Google Places API key is working.
 *
 * Usage:
 *   npx tsx scripts/test-places-api.ts
 *
 * Prerequisites:
 *   1. Copy .env.example to .env.local and fill in GOOGLE_PLACES_API_KEY
 *   2. npm install -D tsx dotenv
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const PLACE_ID = "ChIJNWPHfHFzhlQRFJBGFhGEEn0"; // Trout Lake Park, Vancouver

const FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "currentOpeningHours",
  "photos",
  "types",
  "editorialSummary",
].join(",");

async function main() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    console.error("❌  GOOGLE_PLACES_API_KEY not found in .env.local");
    process.exit(1);
  }

  console.log("🔍  Fetching Trout Lake Park from Google Places API...\n");

  const res = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}`, {
    headers: {
      "X-Goog-Api-Key":   key,
      "X-Goog-FieldMask": FIELDS,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌  API error ${res.status}:`, body);
    process.exit(1);
  }

  const data = await res.json();

  console.log("✅  Success!\n");
  console.log("─── Park Details ─────────────────────────────");
  console.log("Name:     ", data.displayName?.text);
  console.log("Address:  ", data.formattedAddress);
  console.log("Rating:   ", data.rating, `(${data.userRatingCount} reviews)`);
  console.log("Open now: ", data.currentOpeningHours?.openNow ?? "unknown");
  console.log("Types:    ", (data.types ?? []).join(", "));
  console.log("Photos:   ", data.photos?.length ?? 0, "available");
  console.log("Summary:  ", data.editorialSummary?.text ?? "(none)");
  console.log("\n─── Raw response (first 1000 chars) ──────────");
  console.log(JSON.stringify(data, null, 2).slice(0, 1000) + "\n…");
}

main().catch(console.error);
