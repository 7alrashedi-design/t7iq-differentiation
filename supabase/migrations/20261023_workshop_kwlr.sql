-- KWLR response isolation: no changes to style scale or fingerprint scoring.
create table if not exists public.workshop_kwlr_runs(
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.workshop_sessions(id) on delete restrict,
 topic text not null default 'المدرسة الانطباعية',
 stage int not null default 0 check (stage between 0 and 4),
 stage_ends_at timestamptz,
 created_at timestamptz not null default now(),
 unique(session_id)
);
create table if not exists public.workshop_kwlr_entries(
 id uuid primary key default gen_random_uuid(),
 run_id uuid not null references public.workshop_kwlr_runs(id) on delete cascade,
 participant_id uuid not null references public.workshop_participants(id) on delete restrict,
 stage int not null check (stage between 1 and 3),
 response_text text not null check (char_length(response_text) between 1 and 2000),
 related_question_id uuid references public.workshop_kwlr_entries(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists idx_kwlr_entries_run_stage on public.workshop_kwlr_entries(run_id,stage);
create index if not exists idx_kwlr_entries_participant on public.workshop_kwlr_entries(participant_id);
alter table public.workshop_kwlr_runs enable row level security;
alter table public.workshop_kwlr_entries enable row level security;
-- No direct public table policies: reads and writes are mediated by workshop-public.
-- Execute this migration before deploying the new KWLR actions.
