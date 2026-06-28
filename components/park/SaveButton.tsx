"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveButtonProps {
  placeId: string;
  initialIsSaved: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SaveButton({ placeId, initialIsSaved, isLoggedIn, size = "md", className }: SaveButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?next=/parks/${placeId}`);
      return;
    }

    setIsSaved((prev) => !prev); // optimistic
    setLoading(true);

    try {
      const res = await fetch("/api/saved-parks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parkId: placeId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setIsSaved(data.saved);
    } catch {
      setIsSaved((prev) => !prev); // revert
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isSaved ? "Unsave park" : "Save park"}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-150 disabled:opacity-60",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
        isSaved
          ? "bg-white/90 text-red-500 hover:bg-white"
          : "bg-white/70 text-bark/40 hover:bg-white hover:text-red-400",
        className
      )}
    >
      <Heart
        className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5", isSaved && "fill-current")}
      />
    </button>
  );
}
