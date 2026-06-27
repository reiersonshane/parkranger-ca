import Link from "next/link";
import { Search, Map } from "lucide-react";
import { fetchNearbyParks } from "@/lib/google/places";
import { NearbyParksSection } from "@/components/park/NearbyParksSection";

export default async function HomePage() {
  // Fetch featured Vancouver parks server-side (used as fallback if no geolocation)
  const featuredParks = await fetchNearbyParks(49.2577, -123.1207, 8000);
  const displayParks = featuredParks.slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="bg-canopy text-white px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-meadow font-body text-sm font-semibold uppercase tracking-widest mb-4">
            Your neighbourhood awaits
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
            Where communities<br />come alive
          </h1>
          <p className="text-white/75 text-lg font-body mb-10 max-w-xl mx-auto">
            Find local parks, see who&apos;s there right now, and discover what&apos;s happening — from dog walks to beer league to seniors tai chi.
          </p>

          {/* Search */}
          <form action="/search" method="get" className="flex gap-2 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bark/40" />
              <input
                name="q"
                type="text"
                placeholder="Find a park…"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white text-bark placeholder:text-bark/40 font-body text-sm focus:outline-none focus:ring-2 focus:ring-sun"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-sun text-bark font-body font-semibold rounded-xl hover:bg-sun/90 transition-colors text-sm shrink-0"
            >
              Search
            </button>
          </form>

          <Link
            href="/map"
            className="inline-flex items-center gap-2 mt-4 text-meadow hover:text-white text-sm font-body transition-colors"
          >
            <Map className="h-4 w-4" />
            Or browse the map
          </Link>
        </div>
      </section>

      {/* Parks grid — nearby via geolocation, falls back to featured Vancouver */}
      <NearbyParksSection featuredParks={displayParks} />

      {/* How it works */}
      <section className="bg-parchment border-t border-meadow/20 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-bark text-center mb-10">
            More than a map
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🗺️",
                title: "Find parks near you",
                body: "Browse an interactive map, filter by amenities — washrooms, dog-friendly, sports fields, playgrounds — and see what's open right now.",
              },
              {
                icon: "👋",
                title: "Check in & be seen",
                body: "Tap 'I'm here now' when you arrive. See who else is at the park. Regulars make plans. Strangers become neighbours.",
              },
              {
                icon: "📅",
                title: "Post & find events",
                body: "From beer league sign-ups to weekly dog walks — community events live on the park page where people actually look.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-meadow/20 shadow-park"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-display font-bold text-bark text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-bark/60 font-body text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
