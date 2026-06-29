# Iteration 1 — Google Live Busyness

**Goal:** Supplement our own check-in counts with Google's `currentPopularityData` field so
the vibe system has signal even before the community builds up check-in volume.

---

## Background

Google Places API (New) exposes `currentPopularityData`, which returns a live busyness
percentage (0–100) representing how busy a place is right now relative to its typical peak.
This is the same data that powers the "Usually busy" / "Live: busier than usual" labels on
Google Maps. It is part of the **Pro billing tier** (same tier as photos and ratings — already
in use).

---

## Caching strategy

`currentPopularityData` is added to the field mask only for **single-place** fetches
(`fetchParkByPlaceId`). Collection calls (searchNearby, searchText) fetch up to 20 parks at
once — adding a billed field there would multiply cost by 20 per search. Single-place fetches
are Redis-cached for 10 minutes, so the Google API call happens at most once per 10 minutes
per park, regardless of how many users visit.

---

## Steps

### 1.1 — Add field mask + type

- Add `currentPopularityData` to the field list used by `fetchParkByPlaceId` only
- Update the `GooglePark` type to include the optional field:
  ```ts
  currentPopularityData?: {
    currentPopularity: number;   // 0–100
    fetchTime?: string;
  };
  ```
- The existing Redis 10-min TTL covers caching automatically (the whole GooglePark object
  is stored)

### 1.2 — Blend into vibe system

Update `getParkVibe` to accept an optional `googleBusyness?: number` parameter (0–100).
Blending rule:
- If Google data is present AND our check-in count is 0: use Google busyness to pick the
  vibe tier (treat 0–20 as quiet, 21–50 as getting going, 51–75 as buzzing, 76+ as packed)
- If both present: weight Google 60% / check-ins 40% (Google has much larger sample size)
- If only check-ins: existing behaviour unchanged

### 1.3 — Surface on park detail page

Add a "right now" busyness indicator below the rating on the park detail page. Shows when
`currentPopularity` is available. Example: a thin coloured bar or a small badge like
"Moderately busy right now".

### 1.4 — Surface in activity feed

Pass `googleBusyness` through `getActivityForParks` so the feed's vibe cards can use it.
Since those parks are already fetched by `fetchParkByPlaceId` (Redis-cached), the data is
free at this point.

---

## Unknowns / risks

- `currentPopularityData` is only returned when Google has enough visit history for a place.
  Parks may not have data (especially smaller neighbourhood parks). Must handle `undefined`
  gracefully everywhere.
- The field name and response shape should be verified against a live API call before building
  the UI.

---

## Out of scope

- `popularTimesHistograms` (the hourly bar chart by day of week) — useful but a separate
  iteration. More complex to display and costs more to fetch.
- Storing busyness history in our own DB — not needed yet.

---

## Success criteria

- [ ] `currentPopularityData` added to single-place field mask
- [ ] Type updated, no TypeScript errors
- [ ] Vibe function blends Google data when present
- [ ] Park detail page shows busyness indicator when data is available
- [ ] Activity feed vibes reflect Google data
- [ ] Tested against ≥ 2 Vancouver parks to confirm data returns
- [ ] No regressions on parks where Google data is absent
