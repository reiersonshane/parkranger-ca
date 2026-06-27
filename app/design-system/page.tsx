/**
 * /design-system — visual reference for all components
 * Only accessible in development (or if you navigate to it directly)
 */
import { AmenityBadge, AmenityBadgeList } from "@/components/ui/AmenityBadge";
import { StarRating } from "@/components/ui/StarRating";
import { ParkCard } from "@/components/park/ParkCard";
import type { ParkSummary, ParkAmenity } from "@/types";

const SAMPLE_AMENITIES: ParkAmenity[] = [
  { key: "washroom",      label: "Washrooms",      icon: "Bath"           },
  { key: "dog_friendly",  label: "Dog friendly",   icon: "Dog"            },
  { key: "sports_field",  label: "Sports field",   icon: "Trophy"         },
  { key: "playground",    label: "Playground",     icon: "Smile"          },
  { key: "water_fountain",label: "Water fountain", icon: "Droplets"       },
  { key: "shade",         label: "Shaded areas",   icon: "TreePine"       },
];

const SAMPLE_PARK: ParkSummary = {
  placeId:    "ChIJN1t_tDeuEmsRUsoyG83frY4",
  name:       "Trout Lake Park",
  address:    "3300 Victoria Dr, Vancouver, BC",
  rating:     4.7,
  ratingCount:1204,
  location:   { lat: 49.2527, lng: -123.0702 },
  amenities:  SAMPLE_AMENITIES.slice(0, 4),
  isOpen:     true,
  checkinCount: 12,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-xl font-bold text-bark mb-1">{title}</h2>
      <div className="h-px bg-meadow/30 mb-6" />
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <p className="text-meadow text-xs font-body uppercase tracking-widest mb-1">Internal</p>
        <h1 className="font-display text-3xl font-bold text-bark">Design System</h1>
        <p className="text-bark/60 font-body mt-2">Component reference for ParkRanger.ca</p>
      </div>

      {/* Colour Palette */}
      <Section title="Colour Palette">
        <div className="flex flex-wrap gap-3">
          {[
            ["Canopy",    "#2D5A27"],
            ["Leaf",      "#5A8F3C"],
            ["Meadow",    "#A8C97F"],
            ["Sun",       "#E8A020"],
            ["Bark",      "#3B2A1A"],
            ["Soil",      "#1C1610"],
            ["Sky",       "#D4EAF7"],
            ["Parchment", "#F7F3EC"],
          ].map(([name, hex]) => (
            <div key={name} className="flex flex-col items-center gap-1.5">
              <div
                className="h-14 w-14 rounded-xl border border-bark/10"
                style={{ backgroundColor: hex }}
              />
              <p className="text-xs font-body text-bark font-medium">{name}</p>
              <p className="text-2xs font-mono text-bark/40">{hex}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-4">
          <div>
            <p className="text-2xs text-bark/40 font-mono mb-1">font-display / Cambria</p>
            <p className="font-display text-4xl font-bold text-bark">Where Communities Come Alive</p>
          </div>
          <div>
            <p className="text-2xs text-bark/40 font-mono mb-1">font-body / Inter</p>
            <p className="font-body text-base text-bark">
              Find local parks, see who&apos;s there right now, and discover what&apos;s happening — from dog walks to beer league to seniors tai chi.
            </p>
          </div>
          <div>
            <p className="text-2xs text-bark/40 font-mono mb-1">font-body small / muted</p>
            <p className="font-body text-sm text-bark/60">
              Park data provided by Google Places · Updated regularly
            </p>
          </div>
        </div>
      </Section>

      {/* Star Rating */}
      <Section title="StarRating">
        <div className="flex flex-wrap gap-6 items-center">
          <StarRating rating={4.7} count={1204} size="lg" />
          <StarRating rating={4.2} count={328}  size="md" />
          <StarRating rating={3.8} count={56}   size="sm" />
          <StarRating rating={4.9}               size="md" showNumber={false} />
        </div>
      </Section>

      {/* Amenity Badges */}
      <Section title="AmenityBadge">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-bark/40 font-body mb-2">Size: md (default)</p>
            <AmenityBadgeList amenities={SAMPLE_AMENITIES} />
          </div>
          <div>
            <p className="text-xs text-bark/40 font-body mb-2">Size: sm</p>
            <AmenityBadgeList amenities={SAMPLE_AMENITIES} size="sm" />
          </div>
          <div>
            <p className="text-xs text-bark/40 font-body mb-2">With overflow (max=3)</p>
            <AmenityBadgeList amenities={SAMPLE_AMENITIES} max={3} />
          </div>
        </div>
      </Section>

      {/* Park Card */}
      <Section title="ParkCard">
        <div className="space-y-8">
          <div>
            <p className="text-xs text-bark/40 font-body mb-3">Variant: default (vertical)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ParkCard park={SAMPLE_PARK} />
              <ParkCard park={{ ...SAMPLE_PARK, name: "Queen Elizabeth Park", photoUrl: undefined, isOpen: false }} />
            </div>
          </div>
          <div>
            <p className="text-xs text-bark/40 font-body mb-3">Variant: horizontal</p>
            <div className="space-y-3 max-w-lg">
              <ParkCard park={SAMPLE_PARK} variant="horizontal" />
              <ParkCard park={{ ...SAMPLE_PARK, name: "Stanley Park", checkinCount: 0 }} variant="horizontal" />
            </div>
          </div>
          <div>
            <p className="text-xs text-bark/40 font-body mb-3">Variant: compact</p>
            <div className="space-y-2 max-w-xs">
              <ParkCard park={SAMPLE_PARK} variant="compact" />
              <ParkCard park={{ ...SAMPLE_PARK, name: "Jericho Beach Park" }} variant="compact" />
            </div>
          </div>
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="Loading Skeleton">
        <div className="space-y-3 max-w-sm">
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-40 w-full" />
        </div>
      </Section>
    </div>
  );
}
