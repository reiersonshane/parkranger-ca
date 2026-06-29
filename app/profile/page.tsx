import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchParkByPlaceId, googleParkToSummary } from "@/lib/google/places";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ParkCard } from "@/components/park/ParkCard";
import { User, Calendar, RefreshCw } from "lucide-react";
import { DeleteEventButton } from "@/components/park/DeleteEventButton";

export const metadata: Metadata = { title: "Profile" };

function formatEventDate(startsAt: string): string {
  const date = new Date(startsAt);
  const now = new Date();
  const isPast = date < now;
  if (isPast) {
    return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `Today · ${date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
  if (diffDays === 1) return `Tomorrow · ${date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}

interface EventRow {
  id: string;
  title: string;
  starts_at: string;
  park_id: string;
  recurrence: string;
  event_attendees?: { user_id: string }[];
}

function EventCard({ event, deletable }: { event: EventRow; deletable?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/parks/${event.park_id}`}
        className="flex items-start gap-3 p-3 rounded-xl bg-white border border-meadow/20 hover:border-meadow/50 hover:shadow-park transition-all flex-1 min-w-0"
      >
        <div className="h-8 w-8 rounded-lg bg-sun/20 flex items-center justify-center shrink-0">
          <Calendar className="h-3.5 w-3.5 text-bark/60" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body font-semibold text-bark text-sm leading-tight truncate">{event.title}</p>
          <p className="font-body text-xs text-bark/50 mt-0.5">{formatEventDate(event.starts_at)}</p>
        </div>
        {event.recurrence !== "none" && (
          <RefreshCw className="h-3 w-3 text-bark/30 shrink-0 mt-1" />
        )}
      </Link>
      {deletable && <DeleteEventButton eventId={event.id} />}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-center text-bark/40 font-body text-sm py-4">{text}</p>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Ranger";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const joinedYear = new Date(user.created_at).getFullYear();
  const now = new Date().toISOString();

  const [
    { data: savedData },
    { data: hostedData },
    { data: rsvpData },
  ] = await Promise.all([
    supabase.from("saved_parks").select("google_place_id").eq("user_id", user.id).order("saved_at", { ascending: false }).limit(12),
    supabase.from("events").select("id, title, starts_at, park_id, recurrence, event_attendees(user_id)").eq("created_by", user.id).is("deleted_at", null).order("starts_at", { ascending: false }).limit(20),
    supabase.from("event_attendees").select("event_id, arrived_at, events!inner(id, title, starts_at, park_id, recurrence, deleted_at)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
  ]);

  const savedPlaceIds = (savedData ?? []).map((s) => s.google_place_id);
  const savedParks = savedPlaceIds.length > 0
    ? (await Promise.all(savedPlaceIds.map(fetchParkByPlaceId))).filter(Boolean).map((p) => googleParkToSummary(p!))
    : [];

  const hostedEvents: EventRow[] = (hostedData ?? []) as EventRow[];

  // Split RSVP'd events into upcoming and past, filtering soft-deleted
  const rsvpRows = (rsvpData ?? []) as unknown as { arrived_at: string | null; events: EventRow & { deleted_at: string | null } }[];
  const activeRsvps = rsvpRows.filter((r) => r.events && !r.events.deleted_at);
  const goingEvents = activeRsvps.filter((r) => r.events.starts_at > now).map((r) => r.events);
  // Been there = actually arrived at a past event
  const beenThereEvents = activeRsvps.filter((r) => r.arrived_at && r.events.starts_at <= now).map((r) => r.events);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
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
      <div>
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

      {/* Events: Hosting */}
      <div>
        <h2 className="font-display text-lg font-bold text-bark mb-4">Events I&apos;m Hosting</h2>
        {hostedEvents.length === 0 ? (
          <EmptyState text="No events created yet — post one from any park page." />
        ) : (
          <div className="space-y-2">
            {hostedEvents.map((event) => <EventCard key={event.id} event={event} deletable />)}
          </div>
        )}
      </div>

      {/* Events: Going */}
      <div>
        <h2 className="font-display text-lg font-bold text-bark mb-4">Going</h2>
        {goingEvents.length === 0 ? (
          <EmptyState text="No upcoming events — RSVP to events from any park page." />
        ) : (
          <div className="space-y-2">
            {goingEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </div>

      {/* Events: Been there */}
      {beenThereEvents.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold text-bark mb-4">Been There</h2>
          <div className="space-y-2">
            {beenThereEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </div>
      )}

      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
