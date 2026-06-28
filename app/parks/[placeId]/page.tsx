import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ExternalLink, TreePine } from "lucide-react";
import { fetchParkByPlaceId } from "@/lib/google/places";
import { buildPhotoUrl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/ui/StarRating";
import { AmenityBadgeList } from "@/components/ui/AmenityBadge";
import { PhotoGallery } from "@/components/park/PhotoGallery";
import { HoursAccordion } from "@/components/park/HoursAccordion";
import { CheckInSection } from "@/components/park/CheckInSection";
import { EventsSection } from "@/components/park/EventsSection";

export async function generateMetadata(
  props: PageProps<"/parks/[placeId]">
): Promise<Metadata> {
  const { placeId } = await props.params;
  const park = await fetchParkByPlaceId(placeId);
  if (!park) return {};

  return {
    title: park.displayName.text,
    description:
      park.editorialSummary?.text ??
      `Explore ${park.displayName.text} — ratings, amenities, hours, and more.`,
    openGraph: {
      title: park.displayName.text,
      description: park.editorialSummary?.text,
    },
  };
}

export default async function ParkDetailPage(
  props: PageProps<"/parks/[placeId]">
) {
  const { placeId } = await props.params;
  const [park, supabase] = await Promise.all([
    fetchParkByPlaceId(placeId),
    createClient(),
  ]);

  if (!park) notFound();

  const hours = park.currentOpeningHours ?? park.regularOpeningHours;

  // Fetch active checkins + current user in parallel
  const { data: { user } } = await supabase.auth.getUser();
  const { data: checkins } = await supabase
    .from("checkins")
    .select("id, user_id, profiles(display_name, avatar_url)")
    .eq("park_id", placeId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const activeCheckins = checkins ?? [];
  const isCheckedIn = !!user && activeCheckins.some((c) => c.user_id === user.id);

  // Fetch upcoming events
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, starts_at, ends_at, recurrence, profiles(display_name, avatar_url)")
    .eq("park_id", placeId)
    .is("deleted_at", null)
    .gt("starts_at", oneHourAgo)
    .order("starts_at", { ascending: true })
    .limit(20);

  // Build photo URLs server-side using the server key (browser key lacks Places API)
  const serverKey = process.env.GOOGLE_PLACES_API_KEY;
  const photoUrls = (park.photos ?? [])
    .slice(0, 5)
    .map((p) => buildPhotoUrl(p.name, 1200, serverKey));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    park.displayName.text
  )}&query_place_id=${placeId}`;

  const staticMapUrl = serverKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${park.location.latitude},${park.location.longitude}&zoom=15&size=800x400&scale=2&markers=color:0x2D5A27%7C${park.location.latitude},${park.location.longitude}&key=${serverKey}`
    : null;

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Photo gallery */}
      <PhotoGallery photoUrls={photoUrls} parkName={park.displayName.text} />

      {/* Main content */}
      <div className="px-4 pt-6 space-y-6">
        {/* Name + rating */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-bark leading-tight">
            {park.displayName.text}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {park.rating && (
              <StarRating
                rating={park.rating}
                count={park.userRatingCount}
                size="md"
              />
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-canopy font-body hover:underline flex items-center gap-1"
            >
              View on Google Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-bark/70">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-bark/40" />
          <p className="font-body text-sm">{park.formattedAddress}</p>
        </div>

        {/* Check-in */}
        <CheckInSection
          placeId={placeId}
          initialCheckins={activeCheckins as unknown as Parameters<typeof CheckInSection>[0]["initialCheckins"]}
          initialIsCheckedIn={isCheckedIn}
          isLoggedIn={!!user}
        />

        {/* Hours */}
        {hours && <HoursAccordion hours={hours} />}

        {/* Amenities */}
        {park.amenities && park.amenities.length > 0 && (
          <div>
            <h2 className="font-display font-semibold text-bark mb-3">
              Amenities
            </h2>
            <AmenityBadgeList amenities={park.amenities} />
          </div>
        )}

        {/* About */}
        {park.editorialSummary?.text && (
          <div>
            <h2 className="font-display font-semibold text-bark mb-2">
              About this park
            </h2>
            <p className="font-body text-sm text-bark/70 leading-relaxed">
              {park.editorialSummary.text}
            </p>
          </div>
        )}

        {/* Events */}
        <EventsSection
          placeId={placeId}
          initialEvents={(events ?? []) as unknown as Parameters<typeof EventsSection>[0]["initialEvents"]}
          isLoggedIn={!!user}
        />

        {/* Divider */}
        <div className="h-px bg-meadow/20" />

        {/* Static map */}
        {staticMapUrl ? (
          <div>
            <h2 className="font-display font-semibold text-bark mb-3">
              Location
            </h2>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden border border-meadow/20 hover:opacity-90 transition-opacity"
            >
              <Image
                src={staticMapUrl}
                alt={`Map of ${park.displayName.text}`}
                width={800}
                height={400}
                className="w-full"
              />
            </a>
          </div>
        ) : (
          <div className="rounded-2xl bg-meadow/10 p-6 text-center">
            <TreePine className="h-8 w-8 text-canopy mx-auto mb-2" />
            <p className="text-sm font-body text-bark/60">
              {park.formattedAddress}
            </p>
          </div>
        )}

        {/* Directions CTA */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-canopy text-white font-body font-semibold hover:bg-canopy/90 transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Get directions
        </a>

        {/* Back link */}
        <div className="text-center pb-4">
          <Link
            href="/"
            className="text-sm font-body text-canopy hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
