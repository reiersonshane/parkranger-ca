"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Calendar, RefreshCw } from "lucide-react";
import { getNearbyParksAction } from "@/lib/actions/search";
import { getActivityForParks } from "@/lib/actions/activity";
import { getParkVibe } from "@/lib/utils/vibes";
import type { ParkSummary } from "@/types";
import type { ActivityData, ParkActivity } from "@/lib/actions/activity";

interface ActivityFeedProps {
  savedParks: ParkSummary[];
  isLoggedIn: boolean;
}

type LocationState = "idle" | "requesting" | "granted" | "denied";

const VIBE_COLORS = {
  green: "bg-leaf/10 text-leaf border-leaf/20",
  yellow: "bg-sun/20 text-bark border-sun/30",
  orange: "bg-orange-100 text-orange-700 border-orange-200",
  gray: "bg-meadow/10 text-bark/60 border-meadow/20",
};

function formatEventDate(startsAt: string): string {
  const date = new Date(startsAt);
  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `Today · ${date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
  if (diffDays === 1) return `Tomorrow · ${date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}

export function ActivityFeed({ savedParks, isLoggedIn }: ActivityFeedProps) {
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [nearbyParks, setNearbyParks] = useState<ParkSummary[]>([]);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);

  // Merge saved + nearby, deduplicate by placeId
  function mergeParks(nearby: ParkSummary[], saved: ParkSummary[]): ParkSummary[] {
    const seen = new Set<string>();
    return [...nearby, ...saved].filter((p) => {
      if (seen.has(p.placeId)) return false;
      seen.add(p.placeId);
      return true;
    });
  }

  async function fetchActivity(parks: ParkSummary[]) {
    if (parks.length === 0) return;
    setLoading(true);
    const ids = parks.slice(0, 10).map((p) => p.placeId);
    const data = await getActivityForParks(ids);
    setActivity(data);
    setLoading(false);
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState("denied");
      if (savedParks.length > 0) fetchActivity(savedParks);
      return;
    }

    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocationState("granted");
        setLoading(true);
        const nearby = await getNearbyParksAction(pos.coords.latitude, pos.coords.longitude);
        const merged = mergeParks(nearby.slice(0, 8), savedParks);
        setNearbyParks(nearby.slice(0, 8));
        await fetchActivity(merged);
      },
      () => {
        setLocationState("denied");
        if (savedParks.length > 0) fetchActivity(savedParks);
        else setLoading(false);
      },
      { timeout: 8000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allParks = mergeParks(nearbyParks, savedParks);
  const parkMap = Object.fromEntries(allParks.map((p) => [p.placeId, p]));

  const activityItems = (activity?.activity ?? [])
    .filter((a: ParkActivity) => parkMap[a.parkId] && a.arrivedCount > 0)
    .sort((a: ParkActivity, b: ParkActivity) => b.arrivedCount - a.arrivedCount)
    .slice(0, 4);

  const eventItems = (activity?.events ?? [])
    .filter((e) => parkMap[e.parkId])
    .slice(0, 4);

  const hasContent = activityItems.length > 0 || eventItems.length > 0;
  const isWaiting = locationState === "requesting" || loading;

  // Don't render anything until we know what to show
  if (locationState === "idle") return null;

  // No location + not logged in → nothing to show
  if (locationState === "denied" && !isLoggedIn && savedParks.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      {isWaiting && !hasContent && (
        <div className="flex items-center gap-2 text-bark/40 font-body text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding activity near you…
        </div>
      )}

      {!isWaiting && !hasContent && (
        <div className="text-bark/40 font-body text-sm text-center py-4">
          Quiet out there — be the first to check in or post an event!
        </div>
      )}

      {activityItems.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl font-bold text-bark mb-4">Happening now</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activityItems.map(({ parkId, arrivedCount }: ParkActivity) => {
              const park = parkMap[parkId];
              const vibe = getParkVibe(arrivedCount);
              return (
                <Link
                  key={parkId}
                  href={`/parks/${parkId}`}
                  className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-meadow/20 hover:border-meadow/50 hover:shadow-park transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display font-semibold text-bark text-sm leading-tight truncate">
                      {park.name}
                    </p>
                    <span className={`shrink-0 text-2xs font-body font-semibold px-2 py-0.5 rounded-full border ${VIBE_COLORS[vibe.color]}`}>
                      {vibe.label}
                    </span>
                  </div>
                  <p className="font-body text-xs text-bark/60 leading-snug">{vibe.copy}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {eventItems.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold text-bark mb-4">Coming up this week</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eventItems.map((event) => {
              const park = parkMap[event.parkId];
              return (
                <Link
                  key={event.id}
                  href={`/parks/${event.parkId}`}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-meadow/20 hover:border-meadow/50 hover:shadow-park transition-all"
                >
                  <div className="h-9 w-9 rounded-xl bg-sun/20 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-bark/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-bark text-sm leading-tight truncate">{event.title}</p>
                    <p className="font-body text-xs text-canopy mt-0.5 truncate">{park.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="font-body text-xs text-bark/50">{formatEventDate(event.startsAt)}</p>
                      {event.recurrence !== "none" && (
                        <span className="flex items-center gap-0.5 text-2xs text-bark/40">
                          <RefreshCw className="h-2.5 w-2.5" />
                          {event.recurrence}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
