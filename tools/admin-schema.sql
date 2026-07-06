-- ═══════════════════════════════════════════════════════════════════
-- Portfolio content editor — Supabase schema (project pvconwkeshzoovchvzqm)
-- Run ONCE in the Supabase dashboard → SQL Editor → New query → Run.
-- (Or let Claude run it via the Supabase connector once it's reconnected.)
--
-- Model: one row (id='main') holding the whole editable content as JSON.
-- Anyone may READ it (the site is public). Only a signed-in session whose
-- email is the OWNER may WRITE. The anon key in the JS is public by design;
-- these RLS policies are what actually protect the content.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.portfolio_content (
  id          text primary key,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;

-- public read
drop policy if exists "portfolio public read" on public.portfolio_content;
create policy "portfolio public read"
  on public.portfolio_content for select
  using (true);

-- owner-only insert (email must match)
drop policy if exists "portfolio owner insert" on public.portfolio_content;
create policy "portfolio owner insert"
  on public.portfolio_content for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = 'asmalbatati@hotmail.com');

-- owner-only update
drop policy if exists "portfolio owner update" on public.portfolio_content;
create policy "portfolio owner update"
  on public.portfolio_content for update to authenticated
  using      (lower(auth.jwt() ->> 'email') = 'asmalbatati@hotmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'asmalbatati@hotmail.com');

-- seed the single content row
insert into public.portfolio_content (id, data)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- After running this, in the dashboard also:
--   Authentication → URL Configuration → add these to "Redirect URLs":
--     https://asmbatati.vercel.app/**   and   http://localhost:4176/**
--   (so the email sign-in link can return to the site)
--   Optional — Authentication → Email Templates → Magic Link: make sure it
--   contains {{ .Token }} if you'd rather type a 6-digit code than click a link.
