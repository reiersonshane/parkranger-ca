"use server";

import { fetchNearbyParks } from "@/lib/google/places";
import type { ParkSummary } from "@/types";

export async function getNearbyParksAction(
  lat: number,
  lng: number
): Promise<ParkSummary[]> {
  return fetchNearbyParks(lat, lng, 2000);
}
