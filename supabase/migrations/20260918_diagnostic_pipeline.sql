-- 2026-09-18: diagnostic pipeline + private RLS helper
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

revoke all on function private.current_org_id() from public, anon;
grant execute on function private.current_org_id() to authenticated;

drop policy if exists "org members read organization" on public.organizations;
drop policy if exists "org members access classes" on public.classes;
drop policy if exists "org members access students" on public.students;
drop policy if exists "org members access mastery" on public.mastery;
drop policy if exists "org members access lessons" on public.lesson_blueprints;
drop policy if exists "org members access evidence" on public.lesson_evidence;
drop function if exists public.current_org_id();

create policy "org members read organization"
on public.organizations for select to authenticated
using (id = private.current_org_id());

create policy "org members access classes"
on public.classes for all to authenticated
using (organization_id = private.current_org_id())
with check (organization_id = private.current_org_id());

create policy "org members access students"
on public.students for all to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id
      and c.organization_id = private.current_org_id()
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id
      and c.organization_id = private.current_org_id()
  )
);

create policy "org members access mastery"
on public.mastery for all to authenticated
using (
  exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = mastery.student_id
      and c.organization_id = private.current_org_id()
  )
)
with check (
  exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = mastery.student_id
      and c.organization_id = private.current_org_id()
  )
);

create policy "org members access lessons"
on public.lesson_blueprints for all to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = lesson_blueprints.class_id
      and c.organization_id = private.current_org_id()
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = lesson_blueprints.class_id
      and c.organization_id = private.current_org_id()
  )
);

create policy "org members access evidence"
on public.lesson_evidence for all to authenticated
using (
  exists (
    select 1
    from public.lesson_blueprints l
    join public.classes c on c.id = l.class_id
    where l.id = lesson_evidence.lesson_id
      and c.organization_id = private.current_org_id()
  )
)
with check (
  exists (
    select 1
    from public.lesson_blueprints l
    join public.classes c on c.id = l.class_id
    where l.id = lesson_evidence.lesson_id
      and c.organization_id = private.current_org_id()
  )
);

create table if not exists public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_name text not null default 'T7IQ Differentiation',
  status text not null default 'active' check (status in ('pending','active','paused','completed')),
  training_completed_at timestamptz,
  access_starts_at timestamptz,
  access_ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, organization_id)
);

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  scope text not null default 'baseline' check (scope in ('baseline','unit','skill','checkpoint')),
  status text not null default 'draft' check (status in ('draft','open','closed','processed')),
  taken_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnostic_items (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  item_order int not null,
  max_score numeric(6,2) not null default 1,
  weight numeric(6,3) not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  unique(diagnostic_id, item_order)
);

create table if not exists public.diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  item_id uuid not null references public.diagnostic_items(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(6,2) not null default 0,
  captured_at timestamptz not null default now(),
  unique(item_id, student_id)
);

alter table public.program_enrollments enable row level security;
alter table public.diagnostics enable row level security;
alter table public.diagnostic_items enable row level security;
alter table public.diagnostic_results enable row level security;

create index if not exists idx_program_enrollments_user on public.program_enrollments(user_id);
create index if not exists idx_program_enrollments_org on public.program_enrollments(organization_id);
create index if not exists idx_diagnostics_class on public.diagnostics(class_id);
create index if not exists idx_diag_items_diagnostic on public.diagnostic_items(diagnostic_id);
create index if not exists idx_diag_items_skill on public.diagnostic_items(skill_id);
create index if not exists idx_diag_results_diagnostic on public.diagnostic_results(diagnostic_id);
create index if not exists idx_diag_results_student on public.diagnostic_results(student_id);
create index if not exists idx_diag_results_item on public.diagnostic_results(item_id);

create policy "user reads own enrollment"
on public.program_enrollments for select to authenticated
using (user_id = (select auth.uid()));

create policy "org members access diagnostics"
on public.diagnostics for all to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = diagnostics.class_id
      and c.organization_id = private.current_org_id()
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = diagnostics.class_id
      and c.organization_id = private.current_org_id()
  )
);

create policy "org members access diagnostic items"
on public.diagnostic_items for all to authenticated
using (
  exists (
    select 1
    from public.diagnostics d
    join public.classes c on c.id = d.class_id
    where d.id = diagnostic_items.diagnostic_id
      and c.organization_id = private.current_org_id()
  )
)
with check (
  exists (
    select 1
    from public.diagnostics d
    join public.classes c on c.id = d.class_id
    where d.id = diagnostic_items.diagnostic_id
      and c.organization_id = private.current_org_id()
  )
);

create policy "org members access diagnostic results"
on public.diagnostic_results for all to authenticated
using (
  exists (
    select 1
    from public.diagnostics d
    join public.classes c on c.id = d.class_id
    where d.id = diagnostic_results.diagnostic_id
      and c.organization_id = private.current_org_id()
  )
)
with check (
  exists (
    select 1
    from public.diagnostics d
    join public.classes c on c.id = d.class_id
    where d.id = diagnostic_results.diagnostic_id
      and c.organization_id = private.current_org_id()
  )
);
