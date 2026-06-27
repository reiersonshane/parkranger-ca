import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AmenityKey, ParkAmenity } from "@/types";

// ─── Tailwind class merge helper ──────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Amenity detection from Google Places types[] ────────────────────────────
// Google doesn't give us a clean "has_washroom" field.
// We infer from the types array and known place names.

const AMENITY_MAP: Record<AmenityKey, { label: string; icon: string }> = {
  washroom:      { label: "Washrooms",     icon: "Bath" },
  dog_friendly:  { label: "Dog friendly",  icon: "Dog" },
  sports_field:  { label: "Sports field",  icon: "Trophy" },
  playground:    { label: "Playground",    icon: "Smile" },
  picnic:        { label: "Picnic area",   icon: "UtensilsCrossed" },
  water_fountain:{ label: "Water fountain",icon: "Droplets" },
  parking:       { label: "Parking",       icon: "ParkingCircle" },
  transit:       { label: "Transit nearby",icon: "Bus" },
  shade:         { label: "Shaded areas",  icon: "TreePine" },
  beach:         { label: "Beach/water",   icon: "Waves" },
};

// Google types that imply certain amenities
const TYPE_AMENITY_MAP: Partial<Record<string, AmenityKey[]>> = {
  "park":                   ["dog_friendly", "shade"],
  "dog_park":               ["dog_friendly"],
  "playground":             ["playground"],
  "sports_complex":         ["sports_field"],
  "stadium":                ["sports_field"],
  "golf_course":            ["sports_field"],
  "swimming_pool":          ["beach"],
  "beach":                  ["beach"],
  "campground":             ["picnic"],
  "parking":                ["parking"],
  "transit_station":        ["transit"],
  "bus_station":            ["transit"],
};

export function parseAmenities(types: string[] = []): ParkAmenity[] {
  const found = new Set<AmenityKey>();

  for (const type of types) {
    const mapped = TYPE_AMENITY_MAP[type];
    if (mapped) mapped.forEach((a) => found.add(a));
  }

  return Array.from(found).map((key) => ({
    key,
    label: AMENITY_MAP[key].label,
    icon:  AMENITY_MAP[key].icon,
  }));
}

export function getAmenityMeta(key: AmenityKey) {
  return AMENITY_MAP[key];
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1)   return "just now";
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7)   return `${diffDays}d ago`;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday    = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });

  if (isToday)    return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" }) + ` · ${time}`;
}

// ─── Google photo URL builder ─────────────────────────────────────────────────

export function buildPhotoUrl(photoName: string, maxWidth = 800, apiKey?: string): string {
  const key = apiKey ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${key}`;
}
