import { NextResponse } from "next/server";

const PLACE_ID = "ChIJNTdgR7N2hlQRsGx3wkOQ0sk"; // Trout Lake Park, Vancouver
const FIELDS = ["id", "displayName", "rating", "userRatingCount"].join(",");

export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "GOOGLE_PLACES_API_KEY is not set" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${PLACE_ID}`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELDS,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { ok: false, status: res.status, error: body },
      { status: 502 }
    );
  }

  const data = await res.json();
  return NextResponse.json({
    ok: true,
    park: {
      id: data.id,
      name: data.displayName?.text,
      rating: data.rating,
      ratingCount: data.userRatingCount,
    },
  });
}
