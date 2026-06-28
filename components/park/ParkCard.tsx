import Image from "next/image";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { AmenityBadgeList } from "@/components/ui/AmenityBadge";
import { SaveButton } from "@/components/park/SaveButton";
import type { ParkSummary } from "@/types";

interface ParkCardProps {
  park: ParkSummary;
  variant?: "default" | "compact" | "horizontal";
  isSaved?: boolean;
  isLoggedIn?: boolean;
  className?: string;
}

export function ParkCard({ park, variant = "default", isSaved = false, isLoggedIn = false, className }: ParkCardProps) {
  const href = `/parks/${park.placeId}`;

  if (variant === "compact") {
    return (
      <Link href={href} className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-white border border-meadow/20",
        "hover:border-meadow/60 hover:shadow-park transition-all duration-150",
        className
      )}>
        {park.photoUrl && (
          <div className="relative h-12 w-12 rounded-lg overflow-hidden shrink-0">
            <Image src={park.photoUrl} alt={park.name} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-bark text-sm font-display truncate">{park.name}</p>
          {park.rating && (
            <StarRating rating={park.rating} count={park.ratingCount} size="sm" />
          )}
        </div>
        {park.isOpen !== undefined && (
          <span className={cn(
            "text-xs font-medium shrink-0",
            park.isOpen ? "text-leaf" : "text-red-500"
          )}>
            {park.isOpen ? "Open" : "Closed"}
          </span>
        )}
      </Link>
    );
  }

  if (variant === "horizontal") {
    return (
      <Link href={href} className={cn(
        "flex gap-4 p-4 rounded-2xl bg-white border border-meadow/20",
        "hover:border-meadow/60 hover:shadow-park transition-all duration-150",
        className
      )}>
        {park.photoUrl && (
          <div className="relative h-24 w-24 rounded-xl overflow-hidden shrink-0">
            <Image src={park.photoUrl} alt={park.name} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0 py-1">
          <h3 className="font-bold text-bark font-display text-base leading-tight">{park.name}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="h-3 w-3 text-bark/40 shrink-0" />
            <p className="text-xs text-bark/60 font-body truncate">{park.address}</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {park.rating && (
              <StarRating rating={park.rating} count={park.ratingCount} size="sm" />
            )}
            {park.isOpen !== undefined && (
              <span className={cn(
                "text-xs font-medium",
                park.isOpen ? "text-leaf" : "text-red-500"
              )}>
                {park.isOpen ? "Open now" : "Closed"}
              </span>
            )}
            {park.checkinCount !== undefined && park.checkinCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-canopy font-medium">
                <Users className="h-3 w-3" />
                {park.checkinCount} here
              </span>
            )}
          </div>
          <AmenityBadgeList amenities={park.amenities} max={3} size="sm" className="mt-2" />
        </div>
      </Link>
    );
  }

  // default — vertical card
  return (
    <Link href={href} className={cn(
      "group flex flex-col rounded-2xl bg-white border border-meadow/20 overflow-hidden",
      "hover:border-meadow/60 hover:shadow-park-lg transition-all duration-200",
      className
    )}>
      <div className="relative h-48 w-full bg-meadow/20">
        {park.photoUrl ? (
          <Image
            src={park.photoUrl}
            alt={park.name}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🌳</span>
          </div>
        )}
        {park.isOpen !== undefined && (
          <div className={cn(
            "absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold",
            park.isOpen
              ? "bg-canopy text-white"
              : "bg-white/90 text-red-600"
          )}>
            {park.isOpen ? "Open now" : "Closed"}
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {park.checkinCount !== undefined && park.checkinCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sun/90 text-bark text-xs font-semibold">
              <Users className="h-3 w-3" />
              {park.checkinCount}
            </div>
          )}
          <SaveButton placeId={park.placeId} initialIsSaved={isSaved} isLoggedIn={isLoggedIn} size="sm" />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-bold text-bark font-display text-lg leading-tight">{park.name}</h3>
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-bark/40 shrink-0" />
          <p className="text-sm text-bark/60 font-body truncate">{park.address}</p>
        </div>
        {park.rating && (
          <StarRating rating={park.rating} count={park.ratingCount} />
        )}
        <AmenityBadgeList amenities={park.amenities} max={4} size="sm" />
      </div>
    </Link>
  );
}
