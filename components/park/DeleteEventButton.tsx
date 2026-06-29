"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, X } from "lucide-react";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setDeleting(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-2xs font-body font-semibold text-red-600 hover:text-red-700 px-2 py-0.5 rounded-lg bg-red-50 border border-red-200 transition-colors"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete?"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-bark/30 hover:text-bark/60">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="text-bark/20 hover:text-red-400 transition-colors"
      title="Delete event"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
