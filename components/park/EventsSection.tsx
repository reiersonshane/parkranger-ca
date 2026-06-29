"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, Loader2, RefreshCw, X, Trash2, Users, Check, MapPin } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  recurrence: "none" | "daily" | "weekly";
  created_by: string;
  attendeeCount: number;
  isAttending: boolean;
  arrivedCount: number;
  isArrived: boolean;
  profiles: { display_name: string; avatar_url: string | null } | null;
}

interface EventsSectionProps {
  placeId: string;
  initialEvents: Event[];
  isLoggedIn: boolean;
  currentUserId?: string;
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

function isInCheckInWindow(startsAt: string, endsAt: string | null): boolean {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = endsAt ? new Date(endsAt).getTime() : start + 3 * 60 * 60 * 1000;
  return now >= start - 2 * 60 * 60 * 1000 && now <= end;
}

const RECURRENCE_LABELS = { none: null, daily: "Daily", weekly: "Weekly" };

export function EventsSection({ placeId, initialEvents, isLoggedIn, currentUserId }: EventsSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [attendanceMap, setAttendanceMap] = useState<Record<string, { count: number; isAttending: boolean }>>(() =>
    Object.fromEntries(initialEvents.map((e) => [e.id, { count: e.attendeeCount, isAttending: e.isAttending }]))
  );
  const [arrivalMap, setArrivalMap] = useState<Record<string, { arrivedCount: number; isArrived: boolean }>>(() =>
    Object.fromEntries(initialEvents.map((e) => [e.id, { arrivedCount: e.arrivedCount, isArrived: e.isArrived }]))
  );
  const [rsvpingId, setRsvpingId] = useState<string | null>(null);
  const [arrivingId, setArrivingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly">("none");

  function handlePostClick() {
    if (!isLoggedIn) { router.push(`/login?next=/parks/${placeId}`); return; }
    setShowForm(true);
  }

  function resetForm() {
    setTitle(""); setDescription(""); setDate(""); setTime("");
    setRecurrence("none"); setFormError(null); setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) { setFormError("Please pick a date and time."); return; }
    const startsAt = new Date(`${date}T${time}`);
    if (isNaN(startsAt.getTime())) { setFormError("Invalid date or time."); return; }
    setSubmitting(true); setFormError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parkId: placeId, title, description, startsAt: startsAt.toISOString(), recurrence }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error); return; }
      resetForm();
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (confirmDeleteId !== eventId) { setConfirmDeleteId(eventId); return; }
    setDeleting(eventId);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      setDeletedIds((prev) => new Set([...prev, eventId]));
      setConfirmDeleteId(null);
    }
    setDeleting(null);
  }

  async function handleRsvp(eventId: string) {
    if (!isLoggedIn) { router.push(`/login?next=/parks/${placeId}`); return; }
    const current = attendanceMap[eventId] ?? { count: 0, isAttending: false };
    setAttendanceMap((prev) => ({
      ...prev,
      [eventId]: { count: current.isAttending ? current.count - 1 : current.count + 1, isAttending: !current.isAttending },
    }));
    setRsvpingId(eventId);
    try {
      const res = await fetch("/api/event-attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAttendanceMap((prev) => ({ ...prev, [eventId]: { count: data.count, isAttending: data.attending } }));
        // If un-RSVPing, also clear arrival state
        if (!data.attending) {
          setArrivalMap((prev) => ({ ...prev, [eventId]: { ...prev[eventId], isArrived: false } }));
        }
      } else {
        setAttendanceMap((prev) => ({ ...prev, [eventId]: current }));
      }
    } catch {
      setAttendanceMap((prev) => ({ ...prev, [eventId]: current }));
    } finally {
      setRsvpingId(null);
    }
  }

  async function handleArrive(eventId: string) {
    if (!isLoggedIn) { router.push(`/login?next=/parks/${placeId}`); return; }
    const current = arrivalMap[eventId] ?? { arrivedCount: 0, isArrived: false };
    setArrivalMap((prev) => ({
      ...prev,
      [eventId]: { arrivedCount: current.isArrived ? current.arrivedCount - 1 : current.arrivedCount + 1, isArrived: !current.isArrived },
    }));
    setArrivingId(eventId);
    try {
      const res = await fetch("/api/event-attendees/arrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        const data = await res.json();
        setArrivalMap((prev) => ({ ...prev, [eventId]: { arrivedCount: data.arrivedCount, isArrived: data.arrived } }));
      } else {
        setArrivalMap((prev) => ({ ...prev, [eventId]: current }));
      }
    } catch {
      setArrivalMap((prev) => ({ ...prev, [eventId]: current }));
    } finally {
      setArrivingId(null);
    }
  }

  const visibleEvents = initialEvents.filter((e) => !deletedIds.has(e.id));
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-bark">What&apos;s Happening</h2>
        {!showForm && (
          <button onClick={handlePostClick} className="flex items-center gap-1 text-canopy font-body text-sm font-medium hover:text-leaf transition-colors">
            <Plus className="h-4 w-4" />
            Post event
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-sky/20 rounded-2xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body font-medium text-bark text-sm">New event</p>
            <button type="button" onClick={resetForm} className="text-bark/40 hover:text-bark transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          {formError && <p className="text-red-600 font-body text-xs">{formError}</p>}
          <input type="text" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required className="w-full px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark placeholder:text-bark/40 focus:outline-none focus:ring-2 focus:ring-canopy/30" />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} className="w-full px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark placeholder:text-bark/40 focus:outline-none focus:ring-2 focus:ring-canopy/30 resize-none" />
          <div className="flex gap-2">
            <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} required className="flex-1 px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark focus:outline-none focus:ring-2 focus:ring-canopy/30" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="flex-1 px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark focus:outline-none focus:ring-2 focus:ring-canopy/30" />
          </div>
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as typeof recurrence)} className="w-full px-3 py-2 rounded-xl border border-meadow/30 bg-white font-body text-sm text-bark focus:outline-none focus:ring-2 focus:ring-canopy/30">
            <option value="none">One-time event</option>
            <option value="weekly">Repeats weekly</option>
            <option value="daily">Repeats daily</option>
          </select>
          <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-2.5 bg-canopy text-white rounded-xl font-body text-sm font-semibold hover:bg-leaf transition-colors disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            Post event
          </button>
        </form>
      )}

      {visibleEvents.length === 0 ? (
        <div className="text-center py-6 text-bark/40 font-body text-sm">
          Nothing planned yet — be the first to post an event!
        </div>
      ) : (
        <div className="space-y-3">
          {visibleEvents.map((event) => {
            const attendance = attendanceMap[event.id] ?? { count: event.attendeeCount, isAttending: event.isAttending };
            const arrival = arrivalMap[event.id] ?? { arrivedCount: event.arrivedCount, isArrived: event.isArrived };
            const isCreator = !!currentUserId && event.created_by === currentUserId;
            const isConfirming = confirmDeleteId === event.id;
            const inWindow = isInCheckInWindow(event.starts_at, event.ends_at);

            return (
              <div key={event.id} className="rounded-2xl border border-meadow/20 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-bark text-sm leading-tight">{event.title}</p>
                    <p className="font-body text-xs text-bark/50 mt-0.5">{formatEventDate(event.starts_at, event.ends_at)}</p>
                    {event.description && (
                      <p className="font-body text-xs text-bark/60 mt-1.5 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {RECURRENCE_LABELS[event.recurrence] && (
                      <span className="text-2xs font-body font-medium px-2 py-0.5 rounded-full bg-sun/20 text-bark/70 flex items-center gap-1">
                        <RefreshCw className="h-2.5 w-2.5" />
                        {RECURRENCE_LABELS[event.recurrence]}
                      </span>
                    )}
                    {isCreator && (
                      isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(event.id)} disabled={deleting === event.id} className="text-2xs font-body font-semibold text-red-600 hover:text-red-700 px-2 py-0.5 rounded-lg bg-red-50 border border-red-200 transition-colors">
                            {deleting === event.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete?"}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-bark/30 hover:text-bark/60">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleDelete(event.id)} className="text-bark/20 hover:text-red-400 transition-colors" title="Delete event">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Arrived count */}
                {arrival.arrivedCount > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-2xs font-body text-leaf font-medium">
                    <MapPin className="h-3 w-3" />
                    {arrival.arrivedCount} {arrival.arrivedCount === 1 ? "person has" : "people have"} arrived
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-meadow/10">
                  <div className="flex items-center gap-2">
                    {event.profiles && (
                      <div className="flex items-center gap-1.5">
                        {event.profiles.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.profiles.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-canopy/20" />
                        )}
                        <span className="font-body text-2xs text-bark/40">{event.profiles.display_name}</span>
                      </div>
                    )}
                    {attendance.count > 0 && (
                      <span className="flex items-center gap-1 font-body text-2xs text-bark/40">
                        <Users className="h-3 w-3" />
                        {attendance.count} going
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* I'm here — only for attendees within the check-in window */}
                    {attendance.isAttending && inWindow && (
                      <button
                        onClick={() => handleArrive(event.id)}
                        disabled={arrivingId === event.id}
                        className={`flex items-center gap-1 text-2xs font-body font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          arrival.isArrived
                            ? "bg-leaf text-white border-leaf"
                            : "bg-white text-leaf border-leaf/40 hover:border-leaf hover:bg-leaf/5"
                        }`}
                      >
                        {arrivingId === event.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : arrival.isArrived ? (
                          <><Check className="h-3 w-3" /> I&apos;m here</>
                        ) : (
                          <><MapPin className="h-3 w-3" /> I&apos;m here!</>
                        )}
                      </button>
                    )}

                    {/* RSVP */}
                    <button
                      onClick={() => handleRsvp(event.id)}
                      disabled={rsvpingId === event.id}
                      className={`flex items-center gap-1 text-2xs font-body font-semibold px-2.5 py-1 rounded-full border transition-all ${
                        attendance.isAttending
                          ? "bg-canopy text-white border-canopy"
                          : "bg-white text-canopy border-canopy/30 hover:border-canopy hover:bg-canopy/5"
                      }`}
                    >
                      {rsvpingId === event.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : attendance.isAttending ? (
                        <><Check className="h-3 w-3" /> Going</>
                      ) : (
                        "I'm going"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
