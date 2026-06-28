import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchParkByPlaceId, googleParkToSummary } from "@/lib/google/places";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ParkCard } from "@/components/park/ParkCard";
import { User } from "lucide-react";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Ranger";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const joinedYear = new Date(user.created_at).getFullYear();

  // Fetch saved parks
  const { data: savedData } = await supabase
    .from("saved_parks")
    .select("google_place_id")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false })
    .limit(12);

  const savedPlaceIds = (savedData ?? []).map((s) => s.google_place_id);

  // Fetch park details for each saved park in parallel (Redis cached)
  const savedParks = savedPlaceIds.length > 0
    ? (await Promise.all(savedPlaceIds.map(fetchParkByPlaceId)))
        .filter(Boolean)
        .map((p) => googleParkToSummary(p!))
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="bg-white rounded-2xl shadow-park p-6 flex items-center gap-5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-canopy/10 flex items-center justify-center shrink-0">
            <User className="h-8 w-8 text-canopy" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-bark truncate">{displayName}</h1>
          <p className="text-bark/50 font-body text-sm truncate">{user.email}</p>
          <p className="text-bark/40 font-body text-xs mt-0.5">Ranger since {joinedYear}</p>
        </div>
      </div>

      {/* Saved parks */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-bark mb-4">Saved Parks</h2>
        {savedParks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-park p-8 text-center text-bark/40 font-body text-sm">
            No saved parks yet — tap the heart on any park to save it.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedParks.map((park) => (
              <ParkCard key={park.placeId} park={park} isSaved={true} isLoggedIn={true} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
