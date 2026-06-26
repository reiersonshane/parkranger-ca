import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const parks = [
    "Trout Lake Park Vancouver BC",
    "Stanley Park Vancouver BC",
    "Queen Elizabeth Park Vancouver BC",
    "Jericho Beach Park Vancouver BC",
    "Kitsilano Beach Park Vancouver BC",
    "Strathcona Park Vancouver BC",
    "Vanier Park Vancouver BC",
    "Hastings Park Vancouver BC",
  ];

  for (const query of parks) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type":     "application/json",
        "X-Goog-Api-Key":   process.env.GOOGLE_PLACES_API_KEY!,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: query, includedType: "park" }),
    });
    const data = await res.json();
    const first = data.places?.[0];
    if (first) {
      console.log(`✅  ${first.displayName.text}`);
      console.log(`    ID:      ${first.id}`);
      console.log(`    Address: ${first.formattedAddress}`);
    } else {
      console.log(`❌  No result for: ${query}`);
    }
    console.log();
  }
}

main().catch(console.error);
