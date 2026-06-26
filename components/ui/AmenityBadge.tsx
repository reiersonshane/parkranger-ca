"use client";

import {
  Bath, Dog, Trophy, Smile, UtensilsCrossed, Droplets,
  ParkingCircle, Bus, TreePine, Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParkAmenity } from "@/types";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bath, Dog, Trophy, Smile, UtensilsCrossed, Droplets,
  ParkingCircle, Bus, TreePine, Waves,
};

interface AmenityBadgeProps {
  amenity: ParkAmenity;
  size?: "sm" | "md";
  className?: string;
}

export function AmenityBadge({ amenity, size = "md", className }: AmenityBadgeProps) {
  const Icon = ICON_MAP[amenity.icon] ?? TreePine;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-sky border border-meadow/40 text-bark font-body",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm",
        className
      )}
    >
      <Icon className={cn(
        "text-canopy shrink-0",
        size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
      )} />
      <span>{amenity.label}</span>
    </div>
  );
}

interface AmenityBadgeListProps {
  amenities: ParkAmenity[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function AmenityBadgeList({ amenities, max, size = "md", className }: AmenityBadgeListProps) {
  const visible = max ? amenities.slice(0, max) : amenities;
  const overflow = max && amenities.length > max ? amenities.length - max : 0;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visible.map((amenity) => (
        <AmenityBadge key={amenity.key} amenity={amenity} size={size} />
      ))}
      {overflow > 0 && (
        <span className={cn(
          "inline-flex items-center rounded-full bg-parchment border border-meadow/30 text-muted-foreground font-body",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
        )}>
          +{overflow} more
        </span>
      )}
    </div>
  );
}
