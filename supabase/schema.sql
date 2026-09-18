-- T7IQ Differentiation schema
-- مشروع مستقل عن Tahaddi

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  role text not null check (role in ('admin','trainer','teacher','supervisor')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  name text not null,
  stage text not null,
  grade text not null,
  subject text not null,
  academic_year text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  external_code text,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  stage text not null,
  grade text not null,
  subject text not null,
  code text not null unique,
  name text not null,
  parent_skill_id uuid references public.skills(id),
  prerequisite_skill_ids uuid[] not null default '{}',
  hidden_alignment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  state text not null check (state in ('gap','emerging','developing','secure','mastered')),
  score numeric(5,2),
  confidence numeric(5,2),
  evidence_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(student_id, skill_id)
);

create table if not exists public.lesson_blueprints (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  title text not null,
  target_skill_ids uuid[] not null default '{}',
  recommendation jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','implemented')),
  scheduled_for date,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_evidence (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lesson_blueprints(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  result numeric(5,2),
  evidence_type text not null default 'exit_ticket',
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_classes_org on public.classes(organization_id);
create index if not exists idx_classes_teacher on public.classes(teacher_id);
create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_skills_parent on public.skills(parent_skill_id);
create index if not exists idx_mastery_student on public.mastery(student_id);
create index if not exists idx_mastery_skill on public.mastery(skill_id);
create index if not exists idx_lessons_class on public.lesson_blueprints(class_id);
create index if not exists idx_evidence_lesson on public.lesson_evidence(lesson_id);
create index if not exists idx_evidence_student on public.lesson_evidence(student_id);
create index if not exists idx_evidence_skill on public.lesson_evidence(skill_id);

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_org_id() from public;
revoke all on function public.current_org_id() from anon;
revoke all on function public.current_org_id() from authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.skills enable row level security;
alter table public.mastery enable row level security;
alter table public.lesson_blueprints enable row level security;
alter table public.lesson_evidence enable row level security;

create policy "org members read organization"
on public.organizations for select
to authenticated
using (id = public.current_org_id());

create policy "users read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "users update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "org members access classes"
on public.classes for all
to authenticated
using (organization_id = public.current_org_id())
with check (organization_id = public.current_org_id());

create policy "org members access students"
on public.students for all
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id
      and c.organization_id = public.current_org_id()
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = students.class_id
      and c.organization_id = public.current_org_id()
  )
);

create policy "authenticated read skills"
on public.skills for select
to authenticated
using (true);

create policy "org members access mastery"
on public.mastery for all
to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = mastery.student_id
      and c.organization_id = public.current_org_id()
  )
)
with check (
  exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = mastery.student_id
      and c.organization_id = public.current_org_id()
  )
);

create policy "org members access lessons"
on public.lesson_blueprints for all
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = lesson_blueprints.class_id
      and c.organization_id = public.current_org_id()
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = lesson_blueprints.class_id
      and c.organization_id = public.current_org_id()
  )
);

create policy "org members access evidence"
on public.lesson_evidence for all
to authenticated
using (
  exists (
    select 1
    from public.lesson_blueprints l
    join public.classes c on c.id = l.class_id
    where l.id = lesson_evidence.lesson_id
      and c.organization_id = public.current_org_id()
  )
)
with check (
  exists (
    select 1
    from public.lesson_blueprints l
    join public.classes c on c.id = l.class_id
    where l.id = lesson_evidence.lesson_id
      and c.organization_id = public.current_org_id()
  )
);
