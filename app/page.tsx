import Link from "next/link";
import { Search, Map, TreePine } from "lucide-react";

export default function HomePage() {
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
          <form action="/search" className="flex gap-2 max-w-md mx-auto">
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

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-display text-2xl font-bold text-bark text-center mb-10">
          More than a map
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🗺️",
              title: "Find parks near you",
              body: "Browse an interactive map, filter by amenities — washrooms, dog-friendly, sports fields, playgrounds — and see what&apos;s open right now.",
            },
            {
              icon: "👋",
              title: "Check in & be seen",
              body: "Tap &apos;I&apos;m here now&apos; when you arrive. See who else is at the park. Regulars make plans. Strangers become neighbours.",
            },
            {
              icon: "📅",
              title: "Post & find events",
              body: "From beer league sign-ups to weekly dog walks — community events live on the park page where people actually look.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-6 border border-meadow/20 shadow-park">
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-display font-bold text-bark text-lg mb-2">{item.title}</h3>
              <p
                className="text-bark/60 font-body text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: item.body }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-parchment border-t border-meadow/20 px-4 py-16 text-center">
        <TreePine className="h-10 w-10 text-canopy mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-bark mb-3">
          Your park is waiting
        </h2>
        <p className="text-bark/60 font-body mb-6 max-w-sm mx-auto">
          Explore parks in your city and see what&apos;s happening today.
        </p>
        <Link
          href="/map"
          className="inline-flex items-center gap-2 px-6 py-3 bg-canopy text-white font-body font-semibold rounded-xl hover:bg-canopy/90 transition-colors"
        >
          <Map className="h-4 w-4" />
          Open the map
        </Link>
      </section>
    </div>
  );
}
