export interface ParkVibe {
  label: string;
  copy: string;
  color: "green" | "yellow" | "orange" | "gray";
}

export function getParkVibe(count: number): ParkVibe {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const isWeekend = day === 0 || day === 6;
  const isMorning = hour >= 6 && hour < 12;
  const isEvening = hour >= 17 && hour < 22;
  const isLate = hour >= 22 || hour < 6;

  if (isLate) {
    return { label: "Night owl territory", copy: "Quiet under the stars right now", color: "gray" };
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
