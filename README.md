# ParkRanger.ca

> Where communities come alive.

A community platform for local parks — find parks, discover what's happening, check in, and connect with your neighbourhood.

## Tech Stack

- **Frontend**: Next.js 14 (App Router, TypeScript, TailwindCSS)
- **Database + Auth**: Supabase (PostgreSQL + Row Level Security)
- **Park Data**: Google Places API (New)
- **Maps**: Google Maps JavaScript API + Embed API
- **Hosting**: Vercel
- **Cache**: Upstash Redis

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/reiersonshane/parkranger-ca.git
cd parkranger-ca
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your actual keys (see `.env.example` for descriptions).

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL editor and run `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key into `.env.local`

### 4. Set up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable:
   - Places API (New)
   - Maps JavaScript API
   - Maps Embed API
3. Create two API keys:
   - **Server key** (no HTTP referrer restriction) → `GOOGLE_PLACES_API_KEY`
   - **Browser key** (restrict to your domain) → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
4. Test the setup: `npx tsx scripts/test-places-api.ts`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Visit [http://localhost:3000/design-system](http://localhost:3000/design-system) to see all UI components.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── parks/[placeId]/   # Park detail page
│   ├── map/               # Interactive map
│   ├── search/            # Park search
│   ├── cities/[city]/     # City landing pages
│   ├── profile/           # User profile
│   ├── design-system/     # Component showcase (dev only)
│   └── api/               # API routes
├── components/
│   ├── layout/            # NavBar, Footer
│   ├── park/              # ParkCard and park-specific components
│   ├── ui/                # AmenityBadge, StarRating, etc.
│   └── auth/              # Auth modal, user avatar
├── lib/
│   ├── google/            # Google Places API wrapper
│   ├── supabase/          # Supabase client (browser + server)
│   └── utils/             # cn(), formatters, amenity parser
├── types/                 # Shared TypeScript types
├── supabase/migrations/   # SQL schema migrations
└── scripts/               # Dev utilities (test-places-api, etc.)
```

## Development Plan

See the full step-by-step dev plan in the repo wiki or `DEVPLAN.md`.

## Contributing

This is a personal project for now. Issues and ideas welcome.
