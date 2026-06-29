import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/events?parkId=... — upcoming events for a park
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parkId = searchParams.get("parkId");
  if (!parkId) return NextResponse.json({ error: "parkId required" }, { status: 400 });

  const supabase = await createClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, starts_at, ends_at, recurrence, profiles(display_name, avatar_url)")
    .eq("park_id", parkId)
    .is("deleted_at", null)
    .gt("starts_at", oneHourAgo)
    .order("starts_at", { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/events — create an event
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { parkId, title, description, startsAt, endsAt, recurrence } = await request.json();
  if (!parkId || !title || !startsAt) {
    return NextResponse.json({ error: "parkId, title, and startsAt are required" }, { status: 400 });
  }

  // Best-effort park upsert
  await supabase.from("parks").upsert(
    { google_place_id: parkId, city: "Vancouver", province: "BC" },
    { onConflict: "google_place_id", ignoreDuplicates: true }
  );

  const { data, error } = await supabase
    .from("events")
    .insert({
      park_id: parkId,
      created_by: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      starts_at: startsAt,
      ends_at: endsAt || null,
      recurrence: recurrence ?? "none",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-RSVP the creator
  await supabase.from("event_attendees").insert({ event_id: data.id, user_id: user.id });

  return NextResponse.json({ id: data.id });
}
