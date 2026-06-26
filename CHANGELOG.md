# Changelog

## Step 0.1 — Scaffold (2026-06-26)

### Added
- Next.js 14 project (App Router, TypeScript, TailwindCSS)
- Brand colour palette and font stack in `tailwind.config.ts`
- Security headers in `next.config.ts`
- Full TypeScript type definitions (`types/index.ts`)
- Utility functions: `cn()`, `parseAmenities()`, `formatRelativeTime()`, `buildPhotoUrl()`
- Google Places API wrapper (`lib/google/places.ts`) — server-side only
- Supabase client helpers for browser and server components
- Component library:
  - `<AmenityBadge>` + `<AmenityBadgeList>`
  - `<StarRating>`
  - `<ParkCard>` (3 variants: default, horizontal, compact)
  - `<NavBar>` + `<MobileBottomNav>`
  - `<Footer>`
- Global layout with sticky nav and mobile bottom nav
- Homepage with hero, search bar, and feature highlights
- `/design-system` page showing all components
- Supabase migration SQL (`supabase/migrations/001_initial_schema.sql`)
  - Tables: profiles, parks, checkins, events, tips, saved_parks
  - RLS policies on all tables
  - Auto-create profile trigger on sign-up
  - Seed data: 8 Vancouver parks with real Google Place IDs
- Test script: `scripts/test-places-api.ts`
- `.env.example` with all required keys documented
- `README.md` with setup instructions

### Next step
Step 0.2 — Vercel deployment + domain setup
