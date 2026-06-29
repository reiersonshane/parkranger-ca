import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// DELETE /api/events/[id] — soft-delete an event (creator only)
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("created_by", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
