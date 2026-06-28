"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";

interface Checkin {
  id: string;
  user_id: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
}

interface CheckInSectionProps {
  placeId: string;
  initialCheckins: Checkin[];
  initialIsCheckedIn: boolean;
  isLoggedIn: boolean;
}

export function CheckInSection({
  placeId,
  initialCheckins,
  initialIsCheckedIn,
  isLoggedIn,
}: CheckInSectionProps) {
  const router = useRouter();
  const [checkins, setCheckins] = useState<Checkin[]>(initialCheckins);
  const [isCheckedIn, setIsCheckedIn] = useState(initialIsCheckedIn);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (!isLoggedIn) {
      router.push(`/login?next=/parks/${placeId}`);
      return;
    }

    setLoading(true);

    // Optimistic update
    if (isCheckedIn) {
      setIsCheckedIn(false);
      setCheckins((prev) => prev.filter((c) => c.user_id !== "__current__"));
    } else {
      setIsCheckedIn(true);
      setCheckins((prev) => [
        { id: "__optimistic__", user_id: "__current__", profiles: null },
        ...prev,
      ]);
    }

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parkId: placeId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Refresh to get accurate server state (including current user's avatar)
      router.refresh();
    } catch {
      // Revert optimistic update on failure
      setIsCheckedIn(initialIsCheckedIn);
      setCheckins(initialCheckins);
    } finally {
      setLoading(false);
    }
  }

  const count = checkins.length;
  const avatars = checkins.slice(0, 5).map((c) => c.profiles);

  return (
    <div className="bg-sky/30 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar stack */}
        {count > 0 && (
          <div className="flex -space-x-2 shrink-0">
            {avatars.map((profile, i) =>
              profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-7 w-7 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-white bg-canopy/20 flex items-center justify-center"
                >
                  <MapPin className="h-3 w-3 text-canopy" />
                </div>
              )
            )}
          </div>
        )}
        <p className="font-body text-sm text-bark/70 leading-tight">
          {count === 0 ? (
            "No one checked in yet — be the first!"
          ) : (
            <>
              <span className="font-semibold text-bark">{count}</span>{" "}
              {count === 1 ? "person" : "people"} here now
            </>
          )}
        </p>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm font-semibold transition-colors disabled:opacity-60 ${
          isCheckedIn
            ? "bg-canopy text-white hover:bg-canopy/80"
            : "bg-white border border-canopy text-canopy hover:bg-canopy hover:text-white"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {isCheckedIn ? "You're here ✓" : "Check in"}
      </button>
    </div>
  );
}
