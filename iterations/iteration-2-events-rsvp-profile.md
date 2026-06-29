# Iteration 2 — Event Delete, RSVPs & Profile Events

**Goal:** Let creators delete their own events, let any user RSVP to events, and surface
a full events history on the profile page.

---

## New DB table: `event_attendees`

```sql
CREATE TABLE event_attendees (
  event_id   UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Anyone can read attendee counts
CREATE POLICY "read event_attendees" ON event_attendees FOR SELECT USING (true);
-- Users manage their own RSVPs
CREATE POLICY "manage own rsvps" ON event_attendees FOR ALL USING (auth.uid() = user_id);

-- Required: tables created via SQL editor need explicit grants
GRANT SELECT, INSERT, DELETE ON event_attendees TO anon, authenticated;
```

> **Lesson from previous work:** always run GRANTs after creating a table via SQL editor
> or you'll get "permission denied" 500s at runtime.

---

## Profile event categories

| Category | Source | Filter |
|---|---|---|
| **Hosting** | `events.created_by = user.id` | `deleted_at IS NULL`, any time |
| **Planning to attend** | `event_attendees.user_id = user.id` JOIN events | `starts_at > now()` |
| **Attended** | `event_attendees.user_id = user.id` JOIN events | `starts_at < now()` |

"Hosting" shows both upcoming and past events the user created (so they can delete old ones too).

---

## Steps

### 2.1 — DB: create `event_attendees` table

Run the SQL above in the Supabase SQL editor. Verify with a test insert.

### 2.2 — API: delete event

Add `DELETE /api/events` (or `DELETE /api/events/[id]`).

- Auth required
- Only the creator can delete (`created_by = user.id`)
- Soft delete: `SET deleted_at = NOW()`
- Returns `{ deleted: true }`

### 2.3 — API: toggle RSVP

New route: `POST /api/event-attendees`

Body: `{ eventId: string }`

- Auth required
- Toggle: if row exists → delete (un-RSVP), if not → insert
- Returns `{ attending: boolean, count: number }`

### 2.4 — EventsSection: delete button + RSVP button

**Delete button:**
- Visible only when `event.created_by === currentUser.id`
- Trash icon, confirm with inline "Are you sure?" toggle (no modal needed)
- Calls `DELETE /api/events`, then `router.refresh()`

**RSVP button:**
- "Going" / "Can't go" toggle on each event card
- Attendee count displayed (e.g. "3 going")
- Redirect to `/login?next=/parks/${placeId}` if not logged in
- Optimistic UI: toggle immediately, revert on error

The `GET /api/events` response needs to include attendee count + whether current user
is attending:
```ts
// Updated select:
"id, title, description, starts_at, ends_at, recurrence, created_by,
 profiles(display_name, avatar_url),
 event_attendees(user_id)"
// Then in the response shape:
attendeeCount: event.event_attendees.length,
isAttending: event.event_attendees.some(a => a.user_id === currentUserId),
```

### 2.5 — Profile: events section

Three tabs (or collapsible sections) below the saved parks grid:

1. **Hosting** — events I created, sorted by `starts_at DESC`
   - Show title, park name, date, attendee count
   - Delete button on each (soft-delete, same flow as 2.4)
2. **Going** — future RSVPd events, sorted by `starts_at ASC`
3. **Been there** — past RSVPd events, sorted by `starts_at DESC`

Each card links to the park detail page (`/parks/${event.park_id}`).

---

## Out of scope for this iteration

- Email notifications when someone RSVPs to your event (Step 3.3)
- Event capacity / waitlist
- Editing an existing event (can delete + recreate for now)

---

## Success criteria

- [ ] `event_attendees` table created with RLS + GRANTs
- [ ] Creators can soft-delete their own events from the park detail page
- [ ] Any logged-in user can toggle RSVP on any event
- [ ] Attendee count shown on event cards
- [ ] Profile page shows Hosting / Going / Been there sections
- [ ] All three sections empty-state gracefully when no events
- [ ] No regressions on event creation flow
