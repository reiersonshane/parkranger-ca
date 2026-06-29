# Iteration 3 — Event-Based Check-ins

**Goal:** Replace park-level check-ins with event-scoped arrivals. People check in to signal
they've arrived for a specific event, not just because they're at a park.

---

## Model change

### Before
```
checkins: park_id, user_id, expires_at (3-hour TTL)
```

### After
```
event_attendees: event_id, user_id, created_at, arrived_at (nullable)
```

"Check in" = set `arrived_at = now()` on the attendee row.
"Check out" = set `arrived_at = NULL`.
No separate table, no TTL job, no parallel expiry logic.

---

## DB migration

```sql
-- Add arrived_at to event_attendees
ALTER TABLE event_attendees ADD COLUMN arrived_at TIMESTAMPTZ;

-- Update RLS + grant to allow UPDATE (needed for arrived_at toggle)
CREATE POLICY "Attendees can update own rsvp" ON event_attendees
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT UPDATE ON event_attendees TO authenticated;
```

> Note: arrived_at UPDATE does not hit the same RLS trap as events soft-delete because
> there is no SELECT policy filtering on arrived_at — the SELECT policy is just `true`.

The `checkins` table is left in place but goes unused. Drop it in a later cleanup migration
once we're confident nothing references it.

---

## Check-in window

"I'm here!" is only actionable within:
- **Opens:** 2 hours before `starts_at`
- **Closes:** `ends_at` if set, otherwise `starts_at + 3 hours`

Outside the window: button is hidden (not just disabled) to keep the event card clean.

---

## API changes

### New: `POST /api/event-attendees/arrive`
Body: `{ eventId: string }`

- Auth required; user must have an existing attendee row
- Toggles `arrived_at`: if null → set to now(), if set → set to null
- Returns `{ arrived: boolean, arrivedCount: number }`

### Updated: `GET /api/events` (and server-side park detail query)
Add `arrived_at` to the `event_attendees(user_id)` select so we can show both
attendee count and arrived count per event:
```
event_attendees(user_id, arrived_at)
```

---

## UI changes

### EventsSection (park detail page)

Each event card gains:
- **"X of Y going have arrived"** count line (shown when arrivedCount > 0)
- **"I'm here!" / "I've arrived"** button — only shown if:
  1. `isAttending === true`
  2. Current time is within the check-in window
- Button is a toggle: arrived → "I've arrived ✓" (filled), not arrived → "I'm here!"
- Optimistic UI same pattern as RSVP button

### CheckInSection
- Remove entirely from `app/parks/[placeId]/page.tsx`
- Delete `components/park/CheckInSection.tsx`

### ParkCard + NearbyParksSection
- Remove `checkinCount` badge from park cards (no more park-level counts)

### Activity feed ("Happening now")
- Vibe is now based on **arrived counts across active events at that park**
- A park is "happening" if it has at least one event with `starts_at` within the window
  and at least one arrived attendee
- Parks with no active events still show in "Happening now" based on upcoming events
  (move to "Coming up" bucket only)

### Profile — "Been there"
- Change filter: events where `arrived_at IS NOT NULL` AND `starts_at < now()`
- More meaningful than "RSVPd to a past event" — requires actually showing up

---

## Notification hook (future, not this iteration)

When `arrived_at` is set via the API, a Supabase Database Webhook or Edge Function
fires and can notify other attendees. The trigger point is clean:
`event_attendees WHERE arrived_at IS NOT NULL`.

---

## Success criteria

- [ ] `arrived_at` column added to `event_attendees` with UPDATE policy + GRANT
- [ ] `POST /api/event-attendees/arrive` toggles arrived_at
- [ ] Event cards show arrived count and "I'm here!" button within window
- [ ] CheckInSection removed from park detail page
- [ ] Checkin badge removed from park cards
- [ ] Activity feed vibe reflects event arrivals
- [ ] Profile "Been there" uses arrived_at
- [ ] `checkins` table still in DB but fully unused (no reads or writes)
