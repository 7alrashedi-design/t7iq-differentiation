-- Workshop MVP levels, evaluation attempts, and annual-study applications.
-- Applied to Supabase on 2026-09-18.
create table if not exists public.product_rubric_templates (
  id uuid primary key default gen_random_uuid(),
  level_no int not null check (level_no between 1 and 3),
  section text not null,
  subsection text,
  criterion_key text not null,
  criterion_template text not null,
  essential boolean not null default false,
  min_score int not null default 0,
  max_score int not null default 6,
  sort_order int not null,
  unique(level_no,criterion_key)
);
create table if not exists public.product_evaluation_attempts (
  id uuid primary key default gen_random_uuid(),
  participant_product_id uuid not null references public.participant_products(id) on delete cascade,
  level_no int not null check (level_no between 1 and 3),
  evaluator_type text not null default 'self' check (evaluator_type in ('self','trainer','peer')),
  evaluator_user_id uuid references auth.users(id) on delete set null,
  evaluator_participant_id uuid references public.workshop_participants(id) on delete set null,
  average_score numeric(5,2),
  essential_pass boolean,
  passed boolean,
  feedback text,
  created_at timestamptz not null default now()
);
create table if not exists public.product_evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.product_evaluation_attempts(id) on delete cascade,
  rubric_template_id uuid not null references public.product_rubric_templates(id) on delete restrict,
  score int not null check (score between 0 and 6),
  note text,
  unique(attempt_id,rubric_template_id)
);
create table if not exists public.workshop_applications (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.workshop_participants(id) on delete cascade unique,
  interested boolean not null default true,
  email text,mobile text,school_name text,note text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);