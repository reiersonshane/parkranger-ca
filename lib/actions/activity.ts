"use server";

import { createClient } from "@/lib/supabase/server";

export interface ParkActivity {
  parkId: string;
  arrivedCount: number;
}

export interface UpcomingEvent {
  id: string;
  parkId: string;
  title: string;
  startsAt: string;
  recurrence: string;
}

export interface ActivityData {
  activity: ParkActivity[];
  events: UpcomingEvent[];
}

export async function getActivityForParks(parkIds: string[]): Promise<ActivityData> {
  if (parkIds.length === 0) return { activity: [], events: [] };

  const supabase = await createClient();
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: activeEvents }, { data: upcomingEventsData }] = await Promise.all([
    // Events currently in (or approaching) check-in window
    supabase
      .from("events")
      .select("id, park_id, event_attendees(arrived_at)")
      .in("park_id", parkIds)
      .lte("starts_at", twoHoursFromNow)
      .gt("starts_at", threeHoursAgo),
    // Upcoming events this week
    supabase
      .from("events")
      .select("id, park_id, title, starts_at, recurrence")
      .in("park_id", parkIds)
      .is("deleted_at", null)
      .gt("starts_at", now.toISOString())
      .lt("starts_at", weekFromNow)
      .order("starts_at", { ascending: true })
      .limit(10),
  ]);

  // Sum arrived counts per park from active events
  const arrivedMap: Record<string, number> = {};
  for (const event of activeEvents ?? []) {
    const arrived = (event.event_attendees ?? []).filter((a: { arrived_at: string | null }) => a.arrived_at).length;
    arrivedMap[event.park_id] = (arrivedMap[event.park_id] ?? 0) + arrived;
  }

  const activity: ParkActivity[] = parkIds.map((id) => ({
    parkId: id,
    arrivedCount: arrivedMap[id] ?? 0,
  }));

  const events: UpcomingEvent[] = (upcomingEventsData ?? []).map((e) => ({
    id: e.id,
    parkId: e.park_id,
    title: e.title,
    startsAt: e.starts_at,
    recurrence: e.recurrence,
  }));

  return { activity, events };
}
