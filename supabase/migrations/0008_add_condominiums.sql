-- 0008_add_condominiums.sql

-- Create condominiums table
create table if not exists public.condominiums (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes
create index if not exists condominiums_company_id_idx on public.condominiums (company_id);

-- Add trigger for updated_at
drop trigger if exists set_timestamp_condominiums on public.condominiums;
create trigger set_timestamp_condominiums
before update on public.condominiums
for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.condominiums enable row level security;

-- Add RLS policies for condominiums
drop policy if exists "condominiums_crud_same_company" on public.condominiums;
create policy "condominiums_crud_same_company"
  on public.condominiums
  for all
  using (
    condominiums.company_id = public.get_company_id_for_user(auth.uid())
  )
  with check (
    condominiums.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Add condominium_id to departments
alter table public.departments 
add column if not exists condominium_id uuid references public.condominiums (id) on delete set null;

create index if not exists departments_condominium_id_idx on public.departments (condominium_id);
