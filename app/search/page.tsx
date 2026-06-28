import type { Metadata } from "next";
import { Search } from "lucide-react";
import { searchParks } from "@/lib/google/places";
import { createClient } from "@/lib/supabase/server";
import { ParkCard } from "@/components/park/ParkCard";

export const metadata: Metadata = {
  title: "Find a Park",
  description: "Search for parks by name or neighbourhood.",
};

export default async function SearchPage(props: PageProps<"/search">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const [results, supabase] = await Promise.all([
    query ? searchParks(query) : Promise.resolve([]),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: savedData } = user
    ? await supabase.from("saved_parks").select("google_place_id").eq("user_id", user.id)
    : { data: [] };
  const savedSet = new Set((savedData ?? []).map((s) => s.google_place_id));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-bark mb-6">
        Find a park
      </h1>

      {/* Search form */}
      <form action="/search" method="get" className="flex gap-2 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark/40" />
          <input
            name="q"
            type="text"
            defaultValue={query}
            placeholder="Search by park name or neighbourhood…"
            autoFocus={!query}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-meadow/30 bg-white text-bark placeholder:text-bark/40 font-body text-sm focus:outline-none focus:ring-2 focus:ring-canopy"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-canopy text-white font-body font-semibold rounded-xl hover:bg-canopy/90 transition-colors text-sm shrink-0"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {query && (
        <div>
          <p className="text-sm font-body text-bark/50 mb-4">
            {results.length > 0
              ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`
              : `No parks found for "${query}"`}
          </p>

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((park) => (
                <ParkCard key={park.placeId} park={park} variant="horizontal" isSaved={savedSet.has(park.placeId)} isLoggedIn={!!user} />
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <p className="text-center text-bark/40 font-body text-sm mt-12">
          Try &ldquo;Stanley Park&rdquo; or &ldquo;Trout Lake&rdquo;
        </p>
      )}
    </div>
  );
}
