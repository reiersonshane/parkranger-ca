export interface ParkVibe {
  label: string;
  copy: string;
  color: "green" | "yellow" | "orange" | "gray";
}

// Maps a 0–100 Google busyness score to a normalised check-in-like count bucket.
// Google data has much larger sample size so we lean on it when available.
function googleBusynessToCount(score: number): number {
  if (score <= 10) return 0;
  if (score <= 25) return 2;
  if (score <= 45) return 4;
  if (score <= 65) return 8;
  if (score <= 80) return 15;
  return 25;
}

export function getParkVibe(
  checkinCount: number,
  googleBusyness?: number
): ParkVibe {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  const isMorning = hour >= 6 && hour < 12;
  const isEvening = hour >= 17 && hour < 22;
  const isLate = hour >= 22 || hour < 6;

  if (isLate) {
    return { label: "Night owl territory", copy: "Quiet under the stars right now", color: "gray" };
  }

  // Blend: if Google data present, weight it 60% / check-ins 40%
  let count = checkinCount;
  if (googleBusyness !== undefined) {
    const googleCount = googleBusynessToCount(googleBusyness);
    if (checkinCount === 0) {
      count = googleCount;
    } else {
      count = Math.round(googleCount * 0.6 + checkinCount * 0.4);
    }
  }

  if (count === 0) {
    if (isMorning) return { label: "Fresh start", copy: "Perfect morning for a quiet walk — all yours", color: "gray" };
    if (isEvening) return { label: "Evening calm", copy: "Peaceful tonight — great for a wind-down stroll", color: "gray" };
    return { label: "All yours", copy: "Peaceful and quiet — you'd have the place to yourself", color: "gray" };
  }

  if (count <= 2) {
    if (isMorning) return { label: "Early birds", copy: "A couple of early risers out there", color: "gray" };
    return { label: "Quiet", copy: "A few people enjoying the calm", color: "gray" };
  }

  if (count <= 5) {
    if (isWeekend && isMorning) return { label: "Weekend warmup", copy: "Weekend crowd is just getting started", color: "green" };
    return { label: "Getting going", copy: "Starting to fill up — good time to head over", color: "green" };
  }

  if (count <= 10) {
    if (isEvening) return { label: "Evening crowd", copy: "Evening crowd is out — great energy right now", color: "green" };
    if (isWeekend) return { label: "Weekend vibes", copy: "Weekend energy is building", color: "green" };
    return { label: "Buzzing", copy: "This park is buzzing today", color: "green" };
  }

  if (count <= 20) {
    if (isWeekend) return { label: "Weekend vibes", copy: "Weekend vibes in full effect — join the crew", color: "yellow" };
    return { label: "Popping", copy: "Popping off right now — join the fun", color: "yellow" };
  }

  // 21+
  if (isWeekend) return { label: "Party in the park", copy: "It's giving block party energy out there", color: "orange" };
  return { label: "Packed", copy: "It's a full house — busy day at the park", color: "orange" };
}

// Human-readable label for the raw Google busyness percentage
export function getBusynessLabel(score: number): { text: string; color: string } {
  if (score <= 10) return { text: "Not busy", color: "text-bark/40" };
  if (score <= 30) return { text: "A little busy", color: "text-leaf" };
  if (score <= 55) return { text: "Moderately busy", color: "text-leaf" };
  if (score <= 75) return { text: "Pretty busy", color: "text-amber-600" };
  if (score <= 90) return { text: "Very busy", color: "text-orange-600" };
  return { text: "As busy as it gets", color: "text-red-600" };
}
