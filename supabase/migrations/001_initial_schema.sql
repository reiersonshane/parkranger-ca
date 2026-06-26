-- ============================================================
-- ParkRanger.ca — Initial Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- Extends Supabase Auth users with display info
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Park Ranger',
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ─── parks ────────────────────────────────────────────────────────────────────
-- We don't store Google data here — only our own enrichment + references
create table public.parks (
  google_place_id  text primary key,
  city             text,
  province         text,
  custom_name      text,   -- override for local name if Google's is wrong
  created_at       timestamptz not null default now()
);

alter table public.parks enable row level security;
create policy "Parks are publicly readable"
  on public.parks for select using (true);
create policy "Authenticated users can insert parks"
  on public.parks for insert with check (auth.role() = 'authenticated');

-- ─── checkins ─────────────────────────────────────────────────────────────────
create table public.checkins (
  id            uuid primary key default uuid_generate_v4(),
  park_id       text not null references public.parks(google_place_id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  note          text check (char_length(note) <= 140),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '3 hours')
);

create index checkins_park_id_idx    on public.checkins(park_id);
create index checkins_expires_at_idx on public.checkins(expires_at);

alter table public.checkins enable row level security;
create policy "Checkins are publicly readable"
  on public.checkins for select using (true);
create policy "Users can insert their own checkins"
  on public.checkins for insert with check (auth.uid() = user_id);
create policy "Users can delete their own checkins"
  on public.checkins for delete using (auth.uid() = user_id);

-- Auto-cleanup expired checkins (runs via Supabase cron or pg_cron)
create or replace function public.delete_expired_checkins()
returns void language sql security definer as $$
  delete from public.checkins where expires_at < now();
$$;

-- ─── events ───────────────────────────────────────────────────────────────────
create table public.events (
  id            uuid primary key default uuid_generate_v4(),
  park_id       text not null references public.parks(google_place_id) on delete cascade,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  title         text not null check (char_length(title) <= 100),
  description   text check (char_length(description) <= 500),
  starts_at     timestamptz not null,
  ends_at       timestamptz,
  recurrence    text not null default 'none' check (recurrence in ('none','daily','weekly')),
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz  -- soft delete
);

create index events_park_id_idx   on public.events(park_id);
create index events_starts_at_idx on public.events(starts_at);

alter table public.events enable row level security;
create policy "Events are publicly readable"
  on public.events for select using (deleted_at is null);
create policy "Authenticated users can create events"
  on public.events for insert with check (auth.uid() = created_by);
create policy "Creators can update their events"
  on public.events for update using (auth.uid() = created_by);

-- ─── tips ─────────────────────────────────────────────────────────────────────
create table public.tips (
  id          uuid primary key default uuid_generate_v4(),
  park_id     text not null references public.parks(google_place_id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) >= 10 and char_length(body) <= 280),
  created_at  timestamptz not null default now()
);

create index tips_park_id_idx on public.tips(park_id);

alter table public.tips enable row level security;
create policy "Tips are publicly readable"
  on public.tips for select using (true);
create policy "Authenticated users can add tips"
  on public.tips for insert with check (auth.uid() = user_id);
create policy "Users can delete their own tips"
  on public.tips for delete using (auth.uid() = user_id);

-- ─── saved_parks ──────────────────────────────────────────────────────────────
create table public.saved_parks (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  google_place_id  text not null,
  saved_at         timestamptz not null default now(),
  primary key (user_id, google_place_id)
);

alter table public.saved_parks enable row level security;
create policy "Users can read their own saved parks"
  on public.saved_parks for select using (auth.uid() = user_id);
create policy "Users can save parks"
  on public.saved_parks for insert with check (auth.uid() = user_id);
create policy "Users can unsave parks"
  on public.saved_parks for delete using (auth.uid() = user_id);

-- ─── Seed data (Vancouver parks) ─────────────────────────────────────────────
-- Real Google Place IDs for testing
insert into public.parks (google_place_id, city, province) values
  ('ChIJNWPHfHFzhlQRFJBGFhGEEn0', 'Vancouver', 'BC'), -- Trout Lake Park
  ('ChIJdV-JjjdzhlQRJr7BWXW8nZA', 'Vancouver', 'BC'), -- Stanley Park
  ('ChIJI7R9fklzhlQRK6p5i0XDzqo', 'Vancouver', 'BC'), -- Queen Elizabeth Park
  ('ChIJi5oIvmRzhlQRRE_igYWJtFM', 'Vancouver', 'BC'), -- Jericho Beach Park
  ('ChIJfx3BKFF0hlQRSxIEMcJn3Hs', 'Vancouver', 'BC'), -- Kitsilano Beach Park
  ('ChIJ-TCRRsVzhlQRqt_jZtXRwRE', 'Vancouver', 'BC'), -- Strathcona Park
  ('ChIJo9r3WFl0hlQRsyXJ7YNAh0M', 'Vancouver', 'BC'), -- Vanier Park
  ('ChIJFVJz05JzhlQRbNDpKi-7L0E', 'Vancouver', 'BC')  -- Hastings Park
on conflict do nothing;
