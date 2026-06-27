"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { GoogleParkHours } from "@/types";
import { cn } from "@/lib/utils";

interface HoursAccordionProps {
  hours: GoogleParkHours;
}

export function HoursAccordion({ hours }: HoursAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const { openNow, weekdayDescriptions } = hours;
  const hasDetails = weekdayDescriptions && weekdayDescriptions.length > 0;

  return (
    <div className="rounded-xl border border-meadow/30 overflow-hidden">
      <button
        onClick={() => hasDetails && setExpanded((e) => !e)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left",
          hasDetails && "hover:bg-meadow/5 transition-colors"
        )}
        aria-expanded={expanded}
      >
        <span
          className={cn(
            "flex items-center gap-2 text-sm font-body font-semibold",
            openNow ? "text-leaf" : "text-bark/60"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              openNow ? "bg-leaf" : "bg-bark/30"
            )}
          />
          {openNow ? "Open now" : "Closed"}
        </span>
        {hasDetails && (
          <span className="flex items-center gap-1 text-xs text-bark/40 font-body">
            See hours
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </span>
        )}
      </button>

      {expanded && hasDetails && (
        <div className="border-t border-meadow/20 px-4 py-3 space-y-1.5 bg-parchment/50">
          {weekdayDescriptions!.map((desc, i) => (
            <p key={i} className="text-sm font-body text-bark/70">
              {desc}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
