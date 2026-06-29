/**
 * lib/google/places.ts
 *
 * Server-side only wrapper for the Google Places API (New).
 * Never import this in client components — the API key stays server-side.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
 */

import type { GooglePark, ParkSummary } from "@/types";
import { parseAmenities, buildPhotoUrl } from "@/lib/utils";
import { cacheGet, cacheSet } from "@/lib/redis";

const PLACES_BASE = "https://places.googleapis.com/v1";

// Fields shared by both single and collection requests
const BASE_FIELD_LIST = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "rating",
  "userRatingCount",
  "currentOpeningHours",
  "regularOpeningHours",
  "photos",
  "types",
  "editorialSummary",
  "websiteUri",
  "nationalPhoneNumber",
];

// Single-place only: currentPopularityData is billed per place — too expensive for
// collection calls that return up to 20 results at once.
const SINGLE_FIELD_LIST = [...BASE_FIELD_LIST, "currentPopularityData"];

// For single-place requests (GET /places/{id})
const PLACE_FIELDS = SINGLE_FIELD_LIST.join(",");
// For collection requests (searchNearby, searchText) each field needs the "places." prefix
const COLLECTION_FIELDS = BASE_FIELD_LIST.map((f) => `places.${f}`).join(",");

function apiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set");
  return key;
}

// ─── Fetch a single park by Place ID ─────────────────────────────────────────

export async function fetchParkByPlaceId(placeId: string): Promise<GooglePark | null> {
  const cacheKey = `park:${placeId}`;
  const cached = await cacheGet<GooglePark>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key":    apiKey(),
        "X-Goog-FieldMask":  PLACE_FIELDS,
      },
      next: { revalidate: 600 },
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`Places API error ${res.status}:`, await res.text());
      return null;
    }

    const data: GooglePark = await res.json();
    data.amenities = parseAmenities(data.types ?? []);
    await cacheSet(cacheKey, data, 600);
    return data;
  } catch (err) {
    console.error("fetchParkByPlaceId failed:", err);
    return null;
  }
}

// ─── Search nearby parks ──────────────────────────────────────────────────────

export async function fetchNearbyParks(
  lat: number,
  lng: number,
  radiusMeters = 2000
): Promise<ParkSummary[]> {
  // Round to ~100m grid to maximise cache hits
  const cacheKey = `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}:${radiusMeters}`;
  const cached = await cacheGet<ParkSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const body = {
      includedTypes: ["park"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    };

    const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type":     "application/json",
        "X-Goog-Api-Key":   apiKey(),
        "X-Goog-FieldMask": COLLECTION_FIELDS,
      },
      body: JSON.stringify(body),
      next: { revalidate: 300 }, // 5 minute cache
    });

    if (!res.ok) {
      console.error(`Nearby search error ${res.status}:`, await res.text());
      return [];
    }

    const data: { places?: GooglePark[] } = await res.json();
    const results = (data.places ?? []).map(googleParkToSummary);
    await cacheSet(cacheKey, results, 300);
    return results;
  } catch (err) {
    console.error("fetchNearbyParks failed:", err);
    return [];
  }
}

// ─── Text search (for search page) ───────────────────────────────────────────

export async function searchParks(query: string, locationBias?: {
  lat: number;
  lng: number;
}): Promise<ParkSummary[]> {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = await cacheGet<ParkSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    const body: Record<string, unknown> = {
      textQuery: query,
      includedType: "park",
      maxResultCount: 10,
    };

    if (locationBias) {
      body.locationBias = {
        circle: {
          center: { latitude: locationBias.lat, longitude: locationBias.lng },
          radius: 50000, // 50km bias radius
        },
      };
    }

    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type":     "application/json",
        "X-Goog-Api-Key":   apiKey(),
        "X-Goog-FieldMask": COLLECTION_FIELDS,
      },
      body: JSON.stringify(body),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error(`Text search error ${res.status}:`, await res.text());
      return [];
    }

    const data: { places?: GooglePark[] } = await res.json();
    const results = (data.places ?? []).map(googleParkToSummary);
    await cacheSet(cacheKey, results, 300);
    return results;
  } catch (err) {
    console.error("searchParks failed:", err);
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function googleParkToSummary(park: GooglePark): ParkSummary {
  const firstPhoto = park.photos?.[0];
  // Always use the server key here — this function only runs server-side
  const key = process.env.GOOGLE_PLACES_API_KEY;
  return {
    placeId:     park.id,
    name:        park.displayName.text,
    address:     park.formattedAddress,
    rating:      park.rating,
    ratingCount: park.userRatingCount,
    photoUrl:    firstPhoto ? buildPhotoUrl(firstPhoto.name, 600, key) : undefined,
    location: {
      lat: park.location.latitude,
      lng: park.location.longitude,
    },
    amenities:   parseAmenities(park.types ?? []),
    isOpen:      park.currentOpeningHours?.openNow,
  };
}
