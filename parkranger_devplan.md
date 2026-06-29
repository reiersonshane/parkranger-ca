# ParkRanger.ca — Development Plan
*Working doc for human + agent collaboration. Each step ends in a reviewable artifact.*

---

## How We Work

Each step below is a discrete unit of work I can execute in one session. You review the output, we iterate, then move on. Steps within a phase can sometimes run in parallel but are listed in dependency order. Where a step touches an external service (Google, Vercel, Supabase), I'll tell you exactly what credentials or config you need to supply.

Estimated effort per step is rough — some will be faster, some will surface surprises and need an extra iteration round.

---

## Phase 0 — Foundation
*Goal: A working URL, a repo, and a dev environment. Nothing visible yet, but everything connected.*

---

### Step 0.1 — Repo & Project Scaffold
**What I do:**
- Initialize a Next.js 14 project (App Router, TypeScript, TailwindCSS)
- Set up folder structure: `/app`, `/components`, `/lib`, `/types`, `/public`
- Configure `tailwind.config.ts` with the ParkRanger colour palette and font stack (Cambria display, Calibri/Inter body)
- Add `.env.example` with all the keys we'll need (no real values)
- Add `README.md` with setup instructions
- Configure ESLint + Prettier

**You do:**
- Create a GitHub repo (name: `parkranger-ca`) and give me the remote URL
- Push the scaffold I generate

**Output you review:** Folder structure, `tailwind.config`, `README`

---

### Step 0.2 — Vercel + Domain Setup
**What I do:**
- Generate `vercel.json` config
- Write deployment instructions (connect GitHub repo to Vercel, set env vars)

**You do:**
- Connect the GitHub repo to Vercel (takes ~3 minutes in the Vercel dashboard)
- Add a CNAME record on your DNS registrar pointing `parkranger.ca` → `cns1.vercel-dns.com`
- Add the domain in Vercel project settings

**Output you review:** Live `https://parkranger.ca` showing Next.js default page

---

### Step 0.3 — Supabase Project Setup
**What I do:**
- Write the SQL migration files for our four core tables:
  - `parks` (google_place_id, city, province, etc.)
  - `users` (extends Supabase Auth)
  - `checkins` (park_id, user_id, note, created_at)
  - `events` (park_id, created_by, title, starts_at, recurrence)
- Write seed data (5–10 Vancouver parks with real Google Place IDs for dev/testing)
- Set up Row Level Security (RLS) policies
- Generate the Prisma schema (or Supabase client types) to match

**You do:**
- Create a Supabase project at supabase.com (free tier is fine)
- Run the migration SQL in the Supabase SQL editor
- Copy the project URL and anon key into `.env.local`

**Output you review:** Tables visible in Supabase dashboard, seed data present

---

### Step 0.4 — Google Places API Setup
**What I do:**
- Write a test script (`scripts/test-places-api.ts`) that fetches one park by Place ID and dumps the response
- Document exactly which Places API fields we use (to stay within the free tier)
- Write the `lib/google-places.ts` wrapper with typed responses

**You do:**
- Go to Google Cloud Console → enable Places API (New) → create an API key
- Restrict the key to Places API + your domain
- Add key to `.env.local`

**Output you review:** Test script returns real park data (name, rating, photos, hours, amenities)

---

## Phase 1 — MVP Core
*Goal: A real park page with real Google data, deployed and shareable. This is the foundation everything else builds on.*

---

### Step 1.1 — Design System & Global Layout
**What I do:**
- Build the global layout: `app/layout.tsx` with nav, footer, font loading
- Create the component library foundation:
  - `<NavBar>` — logo left, search right, sign-in (placeholder)
  - `<Footer>` — minimal, links to About/Contact placeholders
  - `<AmenityBadge>` — icon + label chip (washroom, dogs, sports, etc.)
  - `<StarRating>` — displays Google rating
  - `<ParkCard>` — summary card used in lists and map popups
- Wire Tailwind tokens: colours, spacing, type scale, border radius

**Output you review:** A `/design-system` route showing all components rendered in isolation (like a mini Storybook)

---

### Step 1.2 — Park Detail Page (Google Data)
**What I do:**
- Build `app/parks/[placeId]/page.tsx`
- Server-side fetch from Google Places API (SSR, no client-side API key exposure)
- Sections on the page:
  - Hero photo gallery (Google Photos, up to 5 images, swipeable)
  - Park name, rating, review count, address
  - Open/closed status + hours (expandable)
  - Amenity badges (parsed from Google `types` field)
  - Embedded Google Map (static embed, no JS API needed)
  - "About this park" — Google editorial summary if available
  - Link to Google Maps for directions
- Mobile-first layout, responsive up to desktop
- Loading skeleton for slow connections
- Error state if Place ID not found

**Output you review:** Hit `/parks/ChIJ...` with a real Vancouver park Place ID — full page renders

---

### Step 1.3 — Park Search & Homepage
**What I do:**
- Build the homepage `app/page.tsx`:
  - Hero section with tagline and search bar
  - "Parks near you" section (geolocation-based, browser permission)
  - Hardcoded "Featured Parks" section (our seed data) as fallback
- Build `app/search/page.tsx`:
  - Text search using Google Places Autocomplete (restricted to `park` type)
  - Results list using `<ParkCard>` components
- Build `lib/actions/search.ts` — server action wrapping Places text search

**Output you review:** Can type "Trout Lake" and navigate to the park detail page

---

### Step 1.4 — Map Page
**What I do:**
- Build `app/map/page.tsx` using Google Maps JavaScript API
- Show all parks in the current map viewport (fetched via Places Nearby Search)
- Custom map style (muted, nature-toned — matches brand palette)
- Click a pin → `<ParkCard>` slides up from bottom
- Tap card → navigate to park detail page
- Filter chips across the top: Washrooms, Dog-friendly, Sports fields, Playground, Open Now
- Geolocation button to center on user

**Note:** This is the most technically complex step in Phase 1. May need an iteration round.

**Output you review:** Map loads, pins appear, filters work, clicking through to park detail works

---

### Step 1.5 — SEO & Performance Pass
**What I do:**
- Add `generateMetadata()` to park detail pages (title, description, og:image from Google photo)
- Add `sitemap.ts` (dynamic, seeded parks only for now)
- Add `robots.txt`
- Verify Core Web Vitals (LCP < 1.5s) using Lighthouse in CI
- Add Redis caching layer for Google API responses (TTL: 10 minutes)
  - This requires a Redis instance — Upstash has a free tier that works with Vercel

**You do:**
- Create an Upstash Redis database (free tier, 2 minutes)
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars

**Output you review:** Lighthouse score, park pages load fast on second hit, og:image appears when you share a park link

---

## Phase 2 — Community Layer
*Goal: Users can exist, check in, and post events. The park page comes alive.*

---

### Step 2.1 — Auth (Supabase)
**What I do:**
- Wire Supabase Auth into Next.js (using `@supabase/ssr` package)
- Sign up / sign in with email+password (magic link is cleaner — I'll do that)
- Google OAuth sign-in (one-click, no password)
- `<AuthModal>` component — slides in from right, used everywhere
- Protected route middleware (`middleware.ts`) — redirects to sign-in if needed
- User session available in server components via `createServerClient`
- `/profile` page — display name, avatar (Supabase Storage), joined date

**You do:**
- Enable Google OAuth in Supabase Auth settings (takes 5 min, need a Google OAuth client ID)

**Output you review:** Can sign up, sign in via magic link and Google, session persists across refreshes

---

### Step 2.2 — Check-ins
**What I do:**
- Add "I'm here now" button to park detail page (visible when signed in, prompts sign-in when not)
- `POST /api/checkins` — creates a checkin row, associates with park + user
- Check-ins auto-expire after 3 hours (Postgres function + cron via Supabase)
- Park detail page shows: "X people checked in today", avatars of recent check-ins
- Optimistic UI update — button immediately shows "You're here ✓" without waiting for API

**Output you review:** Check in to a park, see your avatar appear, count updates

---

### Step 2.3 — Events
**What I do:**
- "What's Happening" section on park detail page (below amenities)
- `<EventCard>` component — title, time, recurring badge, creator avatar
- "Post an event" form — title, description, date/time, recurring toggle (weekly/daily)
- `POST /api/events` — creates event, links to park + user
- `GET /api/events?parkId=` — returns upcoming events for a park
- Events sorted by: soonest first, then recurring regulars
- Basic moderation: events soft-deleted after end time + 1 day

**Output you review:** Post an event on a park page, see it appear in the feed, recurring events show correctly

---

### Step 2.4 — Saved Parks (Favourites)
**What I do:**
- Heart icon on every `<ParkCard>` and park detail header
- `saved_parks` table in Supabase (user_id, google_place_id)
- Toggle save/unsave (optimistic UI)
- `/profile` page shows saved parks grid
- "Saved" tab in bottom nav (mobile)

**Output you review:** Save a park, see it on profile, unsave it

---

### Step 2.5 — Activity Feed (Homepage upgrade)
**What I do:**
- Replace the static "Featured Parks" section on homepage with a live feed
- Feed shows: recent check-ins + upcoming events across all parks in the user's city
- If no location permission: show activity from Vancouver as default (we can make this configurable later)
- Feed updates on page load (no polling yet — that's Phase 3)
- Each feed item links to the relevant park page

**Output you review:** Homepage shows live activity, clicking feed item goes to park

---

## Phase 3 — Depth & Polish
*Goal: The site feels alive and complete. Real content, real community signals, ready for public launch.*

---

### Step 3.1 — Reviews & Tips
**What I do:**
- `tips` table: park_id, user_id, body (text, max 280 chars), created_at
- Tips section on park detail page — below events
- "Add a tip" inline form (signed in only)
- Tips are time-stamped and attributed to user (display name + avatar)
- No stars — tips are qualitative ("The south bench gets afternoon sun")
- Basic profanity filter (simple blocklist, not ML)

**Output you review:** Add a tip, see it on the park page, tip persists

---

### Step 3.2 — User-Contributed Photos
**What I do:**
- Photo upload button on park detail page (signed-in users)
- Upload goes to Supabase Storage, URL stored in `park_photos` table
- Community photos appear as additional slides in the hero gallery (after Google photos)
- Moderation: photos are live immediately but flaggable
- Resize + compress on upload (sharp library, max 1200px wide)

**You do:**
- Enable Supabase Storage in your project settings

**Output you review:** Upload a photo, see it appear in the gallery

---

### Step 3.3 — Notifications
**What I do:**
- `notification_prefs` table: user_id, park_id, notify_on (events | checkins | both)
- "Notify me" toggle on saved parks
- Email notifications via Resend (free tier: 3,000 emails/month)
  - Triggered by Supabase Edge Function on new event insert
  - Digest format: "New event at Trout Lake Park this Tuesday"
- `/profile/notifications` settings page

**You do:**
- Create a Resend account (free), get API key
- Add `RESEND_API_KEY` to Vercel env vars

**Output you review:** Subscribe to a park, create an event on it, receive email

---

### Step 3.4 — City Pages & Discovery
**What I do:**
- `app/cities/[city]/page.tsx` — e.g. `/cities/vancouver`
- Shows all parks in that city (our seed data + any user-added parks)
- Ranked by: most check-ins this week, then alphabetical
- City page is SEO-optimized (this is a high-value landing page)
- Add city to sitemap
- Homepage city selector: "Explore parks in → [Vancouver] [Toronto] [Calgary] ..."

**Output you review:** `/cities/vancouver` loads with ranked park list, appears in sitemap

---

### Step 3.5 — Performance, Analytics & Error Monitoring
**What I do:**
- Add Posthog (free tier) for analytics: page views, search terms, check-in events
- Add Sentry (free tier) for error monitoring
- Set up Vercel Analytics (built-in, already available)
- Cache audit: confirm all Google API calls are cached, add cache-control headers to static pages
- Image optimization audit: confirm Next.js `<Image>` used everywhere, no raw `<img>` tags
- Add loading.tsx files for all major routes (streaming UI)

**You do:**
- Create Posthog project, get API key
- Create Sentry project, get DSN

**Output you review:** Analytics dashboard shows page views, errors surface in Sentry

---

### Step 3.6 — Mobile Experience Polish
**What I do:**
- Full audit of every page on mobile (375px viewport)
- Bottom navigation bar on mobile (Home / Map / Saved / Profile)
- Swipe gestures on photo gallery
- Pull-to-refresh on activity feed
- "Add to home screen" PWA config (`manifest.json`, service worker for offline park page cache)
- Touch target audit — all tappable elements min 44×44px

**Output you review:** Walk through all flows on a real phone, nothing feels broken

---

### Step 3.7 — Launch Prep
**What I do:**
- Privacy Policy page (simple, honest, generated and reviewed together)
- Terms of Use page
- About page — the "why parks matter" story
- Contact/feedback form (sends email via Resend)
- 404 and 500 error pages (on-brand)
- Security headers audit (CSP, HSTS, X-Frame-Options via `next.config.ts`)
- Final Lighthouse run targeting 90+ on all metrics
- Social sharing cards (og:image) for city pages + homepage

**Output you review:** All pages exist, no broken links, Lighthouse green

---

## Backlog (Post-Launch Ideas)
*Not planned, just captured so we don't lose them.*

- Activity Groups — recurring groups with member lists (e.g. "Tuesday Running Crew at Queen E Park")
- Park Profiles — verified pages for parks with official contact info
- Moderation dashboard — flag + review reported content
- Push notifications (Web Push API) as alternative to email
- "Who's here" real-time (WebSockets via Supabase Realtime)
- Park condition reports — "Paths are muddy today", "Soccer field is dry"
- Offline mode — cached park detail page when no signal
- French language support (important for Canadian market)
- API for third-party integrations (parks boards, city apps)

---

## Dependency Map

```
0.1 Scaffold
 └─ 0.2 Vercel/Domain
 └─ 0.3 Supabase Schema
 └─ 0.4 Google Places Wrapper
      └─ 1.1 Design System
           └─ 1.2 Park Detail Page   ← first thing a user can actually see
           └─ 1.3 Search + Homepage
           └─ 1.4 Map Page
                └─ 1.5 SEO + Cache
                     └─ 2.1 Auth
                          └─ 2.2 Check-ins
                          └─ 2.3 Events
                          └─ 2.4 Saved Parks
                               └─ 2.5 Activity Feed
                                    └─ Phase 3 (all steps loosely parallel)
```

---

## External Accounts Needed (all free tier)

| Service | What for | When needed |
|---|---|---|
| GitHub | Repo hosting | Step 0.1 |
| Vercel | Hosting + CDN | Step 0.2 |
| Supabase | DB + Auth + Storage | Step 0.3 |
| Google Cloud | Places API + Maps + OAuth | Step 0.4 |
| Upstash | Redis cache | Step 1.5 |
| Resend | Transactional email | Step 3.3 |
| Posthog | Analytics | Step 3.5 |
| Sentry | Error monitoring | Step 3.5 |

---

## Notes on How I'll Work

- Each step I'll produce real, runnable code — not pseudocode or stubs
- I'll ask before making any decision that affects cost or locks in a vendor
- If a step uncovers something unexpected, I'll surface it before proceeding
- We don't need to do steps in strict order — if you want to jump to the map before finishing SEO, we can
- I'll maintain a `CHANGELOG.md` in the repo so you always know what changed

---

*Last updated: June 2026 — v1.0 draft*
