"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import Link from "next/link";
import Image from "next/image";
import { Locate, X, MapPin } from "lucide-react";
import { getNearbyParksAction } from "@/lib/actions/search";
import { StarRating } from "@/components/ui/StarRating";
import { AmenityBadgeList } from "@/components/ui/AmenityBadge";
import { cn } from "@/lib/utils";
import type { ParkSummary, AmenityKey } from "@/types";

const VANCOUVER = { lat: 49.2827, lng: -123.1207 };

const FILTER_OPTIONS: { key: AmenityKey | "open"; label: string }[] = [
  { key: "open", label: "Open now" },
  { key: "dog_friendly", label: "Dogs" },
  { key: "washroom", label: "Washrooms" },
  { key: "sports_field", label: "Sports" },
  { key: "playground", label: "Playground" },
];

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f0ebe2" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3b2a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f0e8" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9b99a" }] },
  { featureType: "landscape.natural", stylers: [{ color: "#e8f0e0" }] },
  { featureType: "park", elementType: "geometry", stylers: [{ color: "#c8ddb0" }] },
  { featureType: "park", elementType: "labels.text.fill", stylers: [{ color: "#2d5a27" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#e8e3da" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ddd7cc" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#cec6b8" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7a6a58" }] },
  { featureType: "transit", stylers: [{ visibility: "simplified" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#a8cce0" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a7a9b" }] },
];

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const [parks, setParks] = useState<ParkSummary[]>([]);
  const [selectedPark, setSelectedPark] = useState<ParkSummary | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [isLocating, setIsLocating] = useState(false);

  // ─── Initialise map ────────────────────────────────────────────────────────

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !containerRef.current) return;

    setOptions({ key: apiKey, v: "weekly" });

    (async () => {
      const { Map: GMap } = await importLibrary("maps") as google.maps.MapsLibrary;
      const map = new GMap(containerRef.current!, {
        center: VANCOUVER,
        zoom: 14,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      });

      mapInstanceRef.current = map;

      // Fetch parks whenever the map settles
      map.addListener("idle", async () => {
        const center = map.getCenter()!;
        const results = await getNearbyParksAction(center.lat(), center.lng());
        setParks((prev) => {
          const merged = new Map(prev.map((p) => [p.placeId, p]));
          results.forEach((p) => merged.set(p.placeId, p));
          return Array.from(merged.values());
        });
      });
    })();
  }, []);

  // ─── Sync markers when parks or filters change ─────────────────────────────

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || typeof google === "undefined") return;

    const filtered = parks.filter((p) => {
      for (const f of filters) {
        if (f === "open") { if (!p.isOpen) return false; }
        else if (!p.amenities.some((a) => a.key === f)) return false;
      }
      return true;
    });

    const visibleIds = new Set(filtered.map((p) => p.placeId));

    // Show/hide existing markers
    for (const [id, marker] of markersRef.current) {
      marker.setMap(visibleIds.has(id) ? map : null);
    }

    // Add markers for new parks
    filtered.forEach((park) => {
      if (markersRef.current.has(park.placeId)) return;

      const marker = new google.maps.Marker({
        position: park.location,
        map,
        title: park.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#2D5A27",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      marker.addListener("click", () => setSelectedPark(park));
      markersRef.current.set(park.placeId, marker);
    });
  }, [parks, filters]);

  // ─── Geolocation ──────────────────────────────────────────────────────────

  function locateUser() {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current!.panTo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        mapInstanceRef.current!.setZoom(15);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    );
  }

  // ─── Filter toggle ─────────────────────────────────────────────────────────

  function toggleFilter(key: string) {
    setFilters((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Filter bar */}
      <div className="absolute top-3 left-0 right-0 flex justify-center px-3 z-10 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pointer-events-auto">
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-body font-medium shadow-park transition-colors",
                filters.has(key)
                  ? "bg-canopy text-white"
                  : "bg-white text-bark hover:bg-meadow/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Locate me button */}
      <button
        onClick={locateUser}
        disabled={isLocating}
        aria-label="Centre on my location"
        className="absolute bottom-6 right-4 z-10 p-3 bg-white rounded-full shadow-park-lg text-canopy hover:bg-meadow/10 transition-colors disabled:opacity-50"
      >
        <Locate className={cn("h-5 w-5", isLocating && "animate-pulse")} />
      </button>

      {/* Park bottom sheet */}
      {selectedPark && (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-3 animate-in slide-in-from-bottom duration-200">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-park-lg overflow-hidden">
            <div className="flex gap-3 p-4">
              {/* Thumbnail */}
              {selectedPark.photoUrl && (
                <div className="relative h-20 w-20 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={selectedPark.photoUrl}
                    alt={selectedPark.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-bark text-base leading-tight">
                    {selectedPark.name}
                  </h3>
                  <button
                    onClick={() => setSelectedPark(null)}
                    aria-label="Close"
                    className="shrink-0 p-1 rounded-full hover:bg-bark/10 transition-colors"
                  >
                    <X className="h-4 w-4 text-bark/50" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  {selectedPark.rating && (
                    <StarRating rating={selectedPark.rating} count={selectedPark.ratingCount} size="sm" />
                  )}
                  {selectedPark.isOpen !== undefined && (
                    <span className={cn("text-xs font-medium", selectedPark.isOpen ? "text-leaf" : "text-bark/40")}>
                      {selectedPark.isOpen ? "Open" : "Closed"}
                    </span>
                  )}
                </div>

                {selectedPark.amenities.length > 0 && (
                  <AmenityBadgeList amenities={selectedPark.amenities} max={3} size="sm" className="mt-2" />
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="px-4 pb-4 flex items-center gap-2">
              <Link
                href={`/parks/${selectedPark.placeId}`}
                className="flex-1 text-center py-2.5 bg-canopy text-white font-body font-semibold rounded-xl text-sm hover:bg-canopy/90 transition-colors"
              >
                View park
              </Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query_place_id=${selectedPark.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 border border-meadow/30 rounded-xl text-bark/60 hover:text-canopy hover:border-canopy transition-colors"
                aria-label="Directions"
              >
                <MapPin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
