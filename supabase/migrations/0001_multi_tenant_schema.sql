-- 0001_multi_tenant_schema.sql
-- Esquema inicial multi-tenant para CleanSweep SaaS en Supabase Postgres

-- Extensiones necesarias
create extension if not exists "pgcrypto";

-- Tipos enumerados
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('owner', 'admin', 'manager', 'employee');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('pending', 'in_progress', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'media_report_type') then
    create type media_report_type as enum ('before', 'after', 'incident');
  end if;
end $$;

-- Tabla de compañías / clientes
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  tax_id text,
  timezone text default 'UTC',
  plan_code text default 'starter',
  metadata jsonb default '{}'::jsonb,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_slug_idx on public.companies (slug);

-- Perfilar usuarios (1:1 con auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  role user_role not null default 'employee',
  full_name text,
  email text,
  phone text,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles (company_id);
create index if not exists profiles_role_idx on public.profiles (role);

-- Tabla de departamentos o ubicaciones
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  access_code text,
  address text,
  status task_status not null default 'pending',
  assigned_to uuid references public.profiles (id),
  last_cleaned_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departments_company_id_idx on public.departments (company_id);
create index if not exists departments_status_idx on public.departments (status);

-- Tabla de tareas de limpieza
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  employee_id uuid references public.profiles (id),
  assigned_by uuid references public.profiles (id),
  status task_status not null default 'pending',
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_company_id_idx on public.tasks (company_id);
create index if not exists tasks_department_id_idx on public.tasks (department_id);
create index if not exists tasks_employee_id_idx on public.tasks (employee_id);
create index if not exists tasks_status_idx on public.tasks (status);

-- Reportes multimedia / evidencias
create table if not exists public.media_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  employee_id uuid references public.profiles (id),
  uploaded_by uuid not null references public.profiles (id),
  report_type media_report_type not null,
  storage_path text not null,
  download_url text,
  file_name text,
  content_type text,
  description text,
  uploaded_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

create index if not exists media_reports_company_id_idx on public.media_reports (company_id);
create index if not exists media_reports_department_id_idx on public.media_reports (department_id);
create index if not exists media_reports_employee_id_idx on public.media_reports (employee_id);

-- Disparadores para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on public.companies;
create trigger set_timestamp
before update on public.companies
for each row execute function public.handle_updated_at();

drop trigger if exists set_timestamp_departments on public.departments;
create trigger set_timestamp_departments
before update on public.departments
for each row execute function public.handle_updated_at();

drop trigger if exists set_timestamp_tasks on public.tasks;
create trigger set_timestamp_tasks
before update on public.tasks
for each row execute function public.handle_updated_at();

drop trigger if exists set_timestamp_profiles on public.profiles;
create trigger set_timestamp_profiles
before update on public.profiles
for each row execute function public.handle_updated_at();

-- Habilitar RLS
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.tasks enable row level security;
alter table public.media_reports enable row level security;

-- Funciones helper (SECURITY DEFINER para evitar recursión con RLS)
drop function if exists public.get_company_id_for_user(uuid);
create or replace function public.get_company_id_for_user(uid uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select company_id
  from public.profiles
  where id = uid;
$$;

drop function if exists public.get_role_for_user(uuid);
create or replace function public.get_role_for_user(uid uuid)
returns user_role
language sql
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = uid;
$$;

-- Políticas RLS

-- Companies: usuarios pueden ver su compañía; owners/admins gestionan
drop policy if exists "companies_select_own" on public.companies;
create policy "companies_select_own"
  on public.companies
  for select
  using (
    companies.id = public.get_company_id_for_user(auth.uid())
  );

drop policy if exists "companies_update_owner_admin" on public.companies;
create policy "companies_update_owner_admin"
  on public.companies
  for update
  using (
    companies.id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin')
  );

-- Profiles: cada usuario ve su perfil y los de su compañía
drop policy if exists "profiles_select_same_company" on public.profiles;
create policy "profiles_select_same_company"
  on public.profiles
  for select
  using (
    id = auth.uid()
    or (
      profiles.company_id = public.get_company_id_for_user(auth.uid())
      and public.get_role_for_user(auth.uid()) in ('owner', 'admin', 'manager')
    )
  );

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
  on public.profiles
  for update
  using (
    id = auth.uid()
    or (
      profiles.company_id = public.get_company_id_for_user(auth.uid())
      and public.get_role_for_user(auth.uid()) in ('owner', 'admin')
    )
  );

drop policy if exists "profiles_insert_same_company" on public.profiles;
create policy "profiles_insert_same_company"
  on public.profiles
  for insert
  with check (
    profiles.company_id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin')
  );

-- Departments
drop policy if exists "departments_crud_same_company" on public.departments;
create policy "departments_crud_same_company"
  on public.departments
  for all
  using (
    departments.company_id = public.get_company_id_for_user(auth.uid())
  )
  with check (
    departments.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Tasks
drop policy if exists "tasks_crud_same_company" on public.tasks;
create policy "tasks_crud_same_company"
  on public.tasks
  for all
  using (
    tasks.company_id = public.get_company_id_for_user(auth.uid())
  )
  with check (
    tasks.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Media Reports
drop policy if exists "media_reports_crud_same_company" on public.media_reports;
create policy "media_reports_crud_same_company"
  on public.media_reports
  for all
  using (
    media_reports.company_id = public.get_company_id_for_user(auth.uid())
  )
  with check (
    media_reports.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Permitir inserción de perfil en registro inicial (service role o función onboarding)
-- Para clientes públicos (anon) se recomienda un edge function para crear empresas/usuarios.


