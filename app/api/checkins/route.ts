import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/checkins?parkId=... — active checkins for a park
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parkId = searchParams.get("parkId");
  if (!parkId) return NextResponse.json({ error: "parkId required" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checkins")
    .select("id, user_id, created_at, profiles(display_name, avatar_url)")
    .eq("park_id", parkId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/checkins — toggle checkin for current user
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { parkId } = await request.json();
  if (!parkId) return NextResponse.json({ error: "parkId required" }, { status: 400 });

  // Best-effort park record (FK constraint removed — failure here is non-fatal)
  await supabase.from("parks").upsert(
    { google_place_id: parkId, city: "Vancouver", province: "BC" },
    { onConflict: "google_place_id", ignoreDuplicates: true }
  );

  // Check for an existing active checkin
  const { data: existing } = await supabase
    .from("checkins")
    .select("id")
    .eq("park_id", parkId)
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existing) {
    // Toggle off
    await supabase.from("checkins").delete().eq("id", existing.id);
    return NextResponse.json({ checked_in: false });
  }

  // Toggle on
  const { data, error } = await supabase
    .from("checkins")
    .insert({ park_id: parkId, user_id: user.id })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checked_in: true, id: data.id });
}
