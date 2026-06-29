import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/event-attendees/arrive — toggle arrived_at for an event you're attending
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await request.json();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const { data: attendee } = await supabase
    .from("event_attendees")
    .select("arrived_at")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!attendee) {
    return NextResponse.json({ error: "You must RSVP before checking in" }, { status: 403 });
  }

  const newArrivedAt = attendee.arrived_at ? null : new Date().toISOString();

  await supabase
    .from("event_attendees")
    .update({ arrived_at: newArrivedAt })
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  const { count } = await supabase
    .from("event_attendees")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .not("arrived_at", "is", null);

  return NextResponse.json({ arrived: !!newArrivedAt, arrivedCount: count ?? 0 });
}
