"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GoogleParkPhoto } from "@/types";
import { buildPhotoUrl } from "@/lib/utils";

interface PhotoGalleryProps {
  photos: GoogleParkPhoto[];
  parkName: string;
}

export function PhotoGallery({ photos, parkName }: PhotoGalleryProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const displayed = photos.slice(0, 5);

  if (displayed.length === 0) {
    return (
      <div className="w-full aspect-video bg-meadow/20 flex items-center justify-center">
        <span className="text-6xl">🌲</span>
      </div>
    );
  }

  function prev() {
    setCurrent((i) => (i - 1 + displayed.length) % displayed.length);
  }
  function next() {
    setCurrent((i) => (i + 1) % displayed.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  }

  const photo = displayed[current];
  const url = buildPhotoUrl(photo.name, 1200);

  return (
    <div
      className="relative w-full aspect-video bg-bark/10 overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Image
        src={url}
        alt={`${parkName} — photo ${current + 1}`}
        fill
        className="object-cover"
        priority={current === 0}
        sizes="(max-width: 768px) 100vw, 1200px"
      />

      {displayed.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-soil/50 text-white hover:bg-soil/80 backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-soil/50 text-white hover:bg-soil/80 backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {displayed.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Photo ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>

          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-soil/60 text-white text-xs font-body backdrop-blur-sm">
            {current + 1} / {displayed.length}
          </div>
        </>
      )}
    </div>
  );
}
