"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchParkByPlaceId } from "@/lib/google/places";

export interface ParkActivity {
  parkId: string;
  checkinCount: number;
  googleBusyness?: number;
}

export interface UpcomingEvent {
  id: string;
  parkId: string;
  title: string;
  startsAt: string;
  recurrence: string;
}

export interface ActivityData {
  checkins: ParkActivity[];
  events: UpcomingEvent[];
}

export async function getActivityForParks(parkIds: string[]): Promise<ActivityData> {
  if (parkIds.length === 0) return { checkins: [], events: [] };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch Supabase data + Google busyness (Redis-cached) in parallel
  const [{ data: checkins }, { data: events }, googleParks] = await Promise.all([
    supabase
      .from("checkins")
      .select("park_id")
      .in("park_id", parkIds)
      .gt("expires_at", now),
    supabase
      .from("events")
      .select("id, park_id, title, starts_at, recurrence")
      .in("park_id", parkIds)
      .is("deleted_at", null)
      .gt("starts_at", now)
      .lt("starts_at", weekFromNow)
      .order("starts_at", { ascending: true })
      .limit(10),
    Promise.all(parkIds.map(fetchParkByPlaceId)),
  ]);

  // Build a busyness map from the Google results (all Redis-cached)
  const busynessMap: Record<string, number> = {};
  for (const park of googleParks) {
    if (park?.currentPopularityData) {
      busynessMap[park.id] = park.currentPopularityData.currentPopularity;
    }
  }

  // Count check-ins per park
  const countMap: Record<string, number> = {};
  for (const c of checkins ?? []) {
    countMap[c.park_id] = (countMap[c.park_id] ?? 0) + 1;
  }

  const checkinActivity: ParkActivity[] = parkIds.map((id) => ({
    parkId: id,
    checkinCount: countMap[id] ?? 0,
    googleBusyness: busynessMap[id],
  }));

  const upcomingEvents: UpcomingEvent[] = (events ?? []).map((e) => ({
    id: e.id,
    parkId: e.park_id,
    title: e.title,
    startsAt: e.starts_at,
    recurrence: e.recurrence,
  }));

  return { checkins: checkinActivity, events: upcomingEvents };
}
