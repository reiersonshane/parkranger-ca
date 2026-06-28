"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { ParkCard } from "@/components/park/ParkCard";
import { getNearbyParksAction } from "@/lib/actions/search";
import type { ParkSummary } from "@/types";

interface NearbyParksSectionProps {
  featuredParks: ParkSummary[];
  savedPlaceIds?: string[];
  isLoggedIn?: boolean;
}

type State = "idle" | "locating" | "loading" | "done" | "denied";

export function NearbyParksSection({ featuredParks, savedPlaceIds = [], isLoggedIn = false }: NearbyParksSectionProps) {
  const savedSet = new Set(savedPlaceIds);
  const [state, setState] = useState<State>("idle");
  const [nearbyParks, setNearbyParks] = useState<ParkSummary[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState("denied");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState("loading");
        const parks = await getNearbyParksAction(
          pos.coords.latitude,
          pos.coords.longitude
        );
        setNearbyParks(parks.slice(0, 6));
        setState("done");
      },
      () => setState("denied"),
      { timeout: 8000 }
    );
  }, []);

  const showNearby = state === "done" && nearbyParks.length > 0;
  const isLoading = state === "locating" || state === "loading";
  const parks = showNearby ? nearbyParks : featuredParks;
  const heading = showNearby ? "Parks near you" : "Explore Vancouver";

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-bark">{heading}</h2>
        {isLoading && (
          <span className="flex items-center gap-1.5 text-sm text-bark/50 font-body">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Finding parks near you…
          </span>
        )}
        {state === "denied" && (
          <span className="flex items-center gap-1 text-xs text-bark/40 font-body">
            <MapPin className="h-3 w-3" />
            Enable location for personalised results
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {parks.map((park) => (
          <ParkCard key={park.placeId} park={park} isSaved={savedSet.has(park.placeId)} isLoggedIn={isLoggedIn} />
        ))}
      </div>
    </section>
  );
}
