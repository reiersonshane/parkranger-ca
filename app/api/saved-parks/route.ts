import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/saved-parks — toggle save/unsave
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { parkId } = await request.json();
  if (!parkId) return NextResponse.json({ error: "parkId required" }, { status: 400 });

  const { data: existing } = await supabase
    .from("saved_parks")
    .select("google_place_id")
    .eq("user_id", user.id)
    .eq("google_place_id", parkId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_parks").delete().eq("user_id", user.id).eq("google_place_id", parkId);
    return NextResponse.json({ saved: false });
  }

  await supabase.from("saved_parks").insert({ user_id: user.id, google_place_id: parkId });
  return NextResponse.json({ saved: true });
}
