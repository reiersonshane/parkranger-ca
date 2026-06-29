import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/event-attendees — toggle RSVP for an event
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await request.json();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("event_attendees")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);
  } else {
    await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id });
  }

  const { count } = await supabase
    .from("event_attendees")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  return NextResponse.json({ attending: !existing, count: count ?? 0 });
}
