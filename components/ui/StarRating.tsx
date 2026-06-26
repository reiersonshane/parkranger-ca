"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  count,
  size = "md",
  showNumber = true,
  className,
}: StarRatingProps) {
  const starSize = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" }[size];
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Star className={cn(starSize, "fill-sun text-sun")} />
      {showNumber && (
        <span className={cn(textSize, "font-semibold text-bark font-body")}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={cn(textSize, "text-bark/50 font-body")}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
