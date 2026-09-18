-- T7IQ Differentiation MVP schema
-- مشروع مستقل عن Tahaddi

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,
  organization_id uuid references organizations(id) on delete cascade,
  role text not null check (role in ('admin','trainer','teacher','supervisor')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  teacher_id uuid references profiles(id) on delete set null,
  name text not null,
  stage text not null,
  grade text not null,
  subject text not null,
  academic_year text not null,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  external_code text,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  stage text not null,
  grade text not null,
  subject text not null,
  code text not null unique,
  name text not null,
  parent_skill_id uuid references skills(id),
  prerequisite_skill_ids uuid[] not null default '{}',
  hidden_alignment jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  state text not null check (state in ('gap','emerging','developing','secure','mastered')),
  score numeric(5,2),
  confidence numeric(5,2),
  evidence_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique(student_id, skill_id)
);

create table if not exists lesson_blueprints (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  title text not null,
  target_skill_ids uuid[] not null default '{}',
  recommendation jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','implemented')),
  scheduled_for date,
  created_at timestamptz not null default now()
);

create table if not exists lesson_evidence (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lesson_blueprints(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  result numeric(5,2),
  evidence_type text not null default 'exit_ticket',
  created_at timestamptz not null default now()
);

create index if not exists idx_mastery_student on mastery(student_id);
create index if not exists idx_mastery_skill on mastery(skill_id);
create index if not exists idx_lessons_class on lesson_blueprints(class_id);
