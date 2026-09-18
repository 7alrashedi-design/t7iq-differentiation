-- Workshop runtime foundation for Al-Tamayoz
-- Applied to Supabase project mihalnbzprdqaaprjkha on 2026-09-18.
-- Creates workshop sessions, participants, Asloobi scale items/responses,
-- fingerprint results, product catalog, and participant product selections.
-- Source content is based on the supplied Asloobi and product-evaluation files.

create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references public.training_programs(id) on delete set null,
  title text not null,
  session_code text not null unique,
  status text not null default 'draft' check (status in ('draft','open','live','closed','archived')),
  trainer_names text[] not null default '{}',
  venue text,
  starts_at timestamptz,
  ends_at timestamptz,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.workshop_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workshop_sessions(id) on delete cascade,
  participant_token uuid not null default gen_random_uuid() unique,
  full_name text not null,
  organization_name text,
  email text,
  mobile text,
  joined_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.style_scale_items (
  id int primary key,
  statement text not null,
  style_code text not null check (style_code in ('W','O','V','T','K1a','K2c','K3s','K4p','K5h','K6m')),
  item_order int not null unique,
  active boolean not null default true
);

create table if not exists public.style_scale_responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.workshop_participants(id) on delete cascade,
  item_id int not null references public.style_scale_items(id) on delete restrict,
  score int not null check (score between 1 and 5),
  answered_at timestamptz not null default now(),
  unique(participant_id,item_id)
);

create table if not exists public.fingerprint_results (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.workshop_participants(id) on delete cascade unique,
  fingerprint_code text not null,
  primary_code text not null,
  secondary_codes text[] not null default '{}',
  dimension_scores jsonb not null,
  generated_at timestamptz not null default now()
);

create table if not exists public.product_catalog (
  product_id text primary key,
  product_name text not null,
  style_category text not null,
  style_code text not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.participant_products (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.workshop_participants(id) on delete cascade,
  product_id text not null references public.product_catalog(product_id) on delete restrict,
  current_level int not null default 1 check (current_level between 1 and 3),
  status text not null default 'selected' check (status in ('selected','in_progress','submitted','completed')),
  selected_at timestamptz not null default now(),
  unique(participant_id,product_id)
);

create index if not exists idx_workshop_sessions_status on public.workshop_sessions(status);
create index if not exists idx_workshop_participants_session on public.workshop_participants(session_id);
create index if not exists idx_style_responses_participant on public.style_scale_responses(participant_id);
create index if not exists idx_participant_products_participant on public.participant_products(participant_id);

alter table public.workshop_sessions enable row level security;
alter table public.workshop_participants enable row level security;
alter table public.style_scale_items enable row level security;
alter table public.style_scale_responses enable row level security;
alter table public.fingerprint_results enable row level security;
alter table public.product_catalog enable row level security;
alter table public.participant_products enable row level security;

drop policy if exists "admins manage workshop sessions" on public.workshop_sessions;
create policy "admins manage workshop sessions"
on public.workshop_sessions for all to authenticated
using (private.is_platform_admin() or created_by = (select auth.uid()))
with check (private.is_platform_admin() or created_by = (select auth.uid()));

drop policy if exists "public reads open workshop sessions" on public.workshop_sessions;
create policy "public reads open workshop sessions"
on public.workshop_sessions for select to anon, authenticated
using (status in ('open','live') or private.is_platform_admin() or created_by = (select auth.uid()));

drop policy if exists "public reads style scale" on public.style_scale_items;
create policy "public reads style scale"
on public.style_scale_items for select to anon, authenticated
using (active = true);

drop policy if exists "public reads product catalog" on public.product_catalog;
create policy "public reads product catalog"
on public.product_catalog for select to anon, authenticated
using (active = true);
