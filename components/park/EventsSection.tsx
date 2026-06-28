"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Loader2, RefreshCw, X } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  recurrence: "none" | "daily" | "weekly";
  profiles: { display_name: string; avatar_url: string | null } | null;
}

interface EventsSectionProps {
  placeId: string;
  initialEvents: Event[];
  isLoggedIn: boolean;
}

function formatEventDate(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const dateStr = start.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = start.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  if (!endsAt) return `${dateStr} · ${timeStr}`;
  const end = new Date(endsAt);
  const endTime = end.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr} – ${endTime}`;
}

const RECURRENCE_LABELS = { none: null, daily: "Daily", weekly: "Weekly" };

export function EventsSection({ placeId, initialEvents, isLoggedIn }: EventsSectionProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");

  function handlePostClick() {
    if (!isLoggedIn) {
      router.push(`/login?next=/parks/${placeId}`);
      return;
    }
    setShowForm(true);
  }

  function resetForm() {
    setTitle(""); setDescription(""); setDate(""); setTime("");
    setRecurrence("none"); setError(null); setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const startsAt = new Date(`${date}T${time}`).toISOString();

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parkId: placeId, title, description, startsAt, recurrence }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) { setError(data.error); return; }

    resetForm();
    router.refresh();
  }

  // Min date = today
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-bark">What&apos;s Happening</h2>
        {!showForm && (
          <button
            onClick={handlePostClick}
            className="flex items-center gap-1 text-canopy font-body text-sm font-medium hover:text-leaf transition-colors"
          >
            <Plus className="h-4 w-4" />
            Post event
          </button>
        )}
      </div>

      {/* Post event form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-sky/20 rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body font-medium text-bark text-sm">New event</p>
            <button type="button" onClick={resetForm} className="text-bark/40 hover:text-bark transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && <p className="text-red-600 font-body text-xs">{error}</p>}

          <input
            type="text"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            className="w-full px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark placeholder:text-bark/40 focus:outline-none focus:ring-2 focus:ring-canopy/30"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark placeholder:text-bark/40 focus:outline-none focus:ring-2 focus:ring-canopy/30 resize-none"
          />

          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
              className="flex-1 px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark focus:outline-none focus:ring-2 focus:ring-canopy/30"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="flex-1 px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark focus:outline-none focus:ring-2 focus:ring-canopy/30"
            />
          </div>

          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
            className="w-full px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark focus:outline-none focus:ring-2 focus:ring-canopy/30"
          >
            <option value="none">One-time event</option>
            <option value="weekly">Repeats weekly</option>
            <option value="daily">Repeats daily</option>
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-canopy text-white rounded-xl font-body text-sm font-semibold hover:bg-leaf transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Post event
          </button>
        </form>
      )}

      {/* Events list */}
      {events.length === 0 ? (
        <div className="text-center py-6 text-bark/40 font-body text-sm">
          Nothing planned yet — be the first to post an event!
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-meadow/20 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-body font-semibold text-bark text-sm leading-tight">{event.title}</p>
                  <p className="font-body text-xs text-bark/50 mt-0.5">{formatEventDate(event.starts_at, event.ends_at)}</p>
                  {event.description && (
                    <p className="font-body text-xs text-bark/60 mt-1.5 leading-relaxed">{event.description}</p>
                  )}
                </div>
                {RECURRENCE_LABELS[event.recurrence] && (
                  <span className="shrink-0 text-2xs font-body font-medium px-2 py-0.5 rounded-full bg-sun/20 text-bark/70 flex items-center gap-1">
                    <RefreshCw className="h-2.5 w-2.5" />
                    {RECURRENCE_LABELS[event.recurrence]}
                  </span>
                )}
              </div>
              {event.profiles && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  {event.profiles.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.profiles.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-canopy/20" />
                  )}
                  <span className="font-body text-2xs text-bark/40">{event.profiles.display_name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
