-- Platform admin, organization types, and workshop builder

alter table public.organizations
  add column if not exists organization_type text not null default 'school'
    check (organization_type in ('school','individual','training_provider')),
  add column if not exists status text not null default 'active'
    check (status in ('active','inactive'));

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('platform_admin','school_admin','trainer','teacher','supervisor','admin'));

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('platform_admin','admin')
  )
$$;

revoke all on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;

create table if not exists public.training_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  audience text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  delivery_mode text not null default 'blended' check (delivery_mode in ('in_person','online','blended')),
  starts_at timestamptz,
  ends_at timestamptz,
  completion_rule jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.training_programs(id) on delete cascade,
  title text not null,
  description text,
  module_order int not null default 1,
  unlock_rule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(program_id, module_order)
);

create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
  title text not null,
  lesson_type text not null default 'content' check (lesson_type in ('content','video','file','activity','assignment','assessment')),
  content jsonb not null default '{}'::jsonb,
  lesson_order int not null default 1,
  required boolean not null default true,
  estimated_minutes int,
  created_at timestamptz not null default now(),
  unique(module_id, lesson_order)
);

create table if not exists public.training_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  score numeric(6,2),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table public.program_enrollments
  add column if not exists program_id uuid references public.training_programs(id) on delete set null;

alter table public.training_programs enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_lessons enable row level security;
alter table public.training_progress enable row level security;

create index if not exists idx_training_modules_program on public.training_modules(program_id);
create index if not exists idx_training_lessons_module on public.training_lessons(module_id);
create index if not exists idx_training_progress_user on public.training_progress(user_id);
create index if not exists idx_program_enrollments_program on public.program_enrollments(program_id);

drop policy if exists "platform admin manages organizations" on public.organizations;
create policy "platform admin manages organizations"
on public.organizations for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "platform admin reads profiles" on public.profiles;
create policy "platform admin reads profiles"
on public.profiles for select to authenticated
using (private.is_platform_admin() or id = (select auth.uid()));

drop policy if exists "platform admin manages profiles" on public.profiles;
create policy "platform admin manages profiles"
on public.profiles for update to authenticated
using (private.is_platform_admin() or id = (select auth.uid()))
with check (private.is_platform_admin() or id = (select auth.uid()));

drop policy if exists "admins manage training programs" on public.training_programs;
create policy "admins manage training programs"
on public.training_programs for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "authenticated read published programs" on public.training_programs;
create policy "authenticated read published programs"
on public.training_programs for select to authenticated
using (status = 'published' or private.is_platform_admin());

drop policy if exists "admins manage training modules" on public.training_modules;
create policy "admins manage training modules"
on public.training_modules for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "enrolled users read modules" on public.training_modules;
create policy "enrolled users read modules"
on public.training_modules for select to authenticated
using (
  private.is_platform_admin()
  or exists (
    select 1 from public.program_enrollments e
    where e.program_id = training_modules.program_id
      and e.user_id = (select auth.uid())
      and e.status in ('active','completed')
  )
);

drop policy if exists "admins manage training lessons" on public.training_lessons;
create policy "admins manage training lessons"
on public.training_lessons for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "enrolled users read lessons" on public.training_lessons;
create policy "enrolled users read lessons"
on public.training_lessons for select to authenticated
using (
  private.is_platform_admin()
  or exists (
    select 1
    from public.training_modules m
    join public.program_enrollments e on e.program_id = m.program_id
    where m.id = training_lessons.module_id
      and e.user_id = (select auth.uid())
      and e.status in ('active','completed')
  )
);

drop policy if exists "users manage own training progress" on public.training_progress;
create policy "users manage own training progress"
on public.training_progress for all to authenticated
using (user_id = (select auth.uid()) or private.is_platform_admin())
with check (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "platform admin access classes" on public.classes;
create policy "platform admin access classes"
on public.classes for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "platform admin access students" on public.students;
create policy "platform admin access students"
on public.students for all to authenticated
using (private.is_platform_admin())
with check (private.is_platform_admin());

drop policy if exists "school admin manages own organization" on public.organizations;
create policy "school admin manages own organization"
on public.organizations for update to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'school_admin'
      and p.organization_id = organizations.id
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'school_admin'
      and p.organization_id = organizations.id
  )
);
