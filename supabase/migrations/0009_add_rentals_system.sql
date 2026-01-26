-- 0009_add_rentals_system.sql
-- Sistema completo de gestión de rentas de departamentos

-- ============================================
-- TIPOS ENUMERADOS
-- ============================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'rental_status') then
    create type rental_status as enum ('reserved', 'active', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'rental_payment_status') then
    create type rental_payment_status as enum ('pending', 'partial', 'paid', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'department_rental_status') then
    create type department_rental_status as enum ('available', 'reserved', 'occupied', 'maintenance');
  end if;
end $$;

-- ============================================
-- TABLA: rentals (Rentas)
-- ============================================

create table if not exists public.rentals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  
  -- Información del arrendatario
  tenant_name text not null,
  tenant_email text,
  tenant_phone text,
  tenant_id_number text,
  tenant_emergency_contact text,
  tenant_emergency_phone text,
  
  -- Información de la renta
  rental_status rental_status not null default 'reserved',
  check_in_date timestamptz not null,
  check_out_date timestamptz not null,
  actual_check_in timestamptz,
  actual_check_out timestamptz,
  
  -- Información financiera
  total_amount numeric(10, 2) not null,
  deposit_amount numeric(10, 2) default 0,
  payment_status rental_payment_status not null default 'pending',
  amount_paid numeric(10, 2) default 0,
  currency text default 'USD',
  
  -- Detalles de la renta
  number_of_guests integer not null,
  number_of_adults integer,
  number_of_children integer,
  special_requests text,
  
  -- Gestión de llaves/acceso
  keys_delivered boolean default false,
  keys_delivered_at timestamptz,
  keys_delivered_by uuid references public.profiles (id),
  keys_returned boolean default false,
  keys_returned_at timestamptz,
  keys_returned_to uuid references public.profiles (id),
  
  -- Inventario y condición
  check_in_inventory jsonb default '{}'::jsonb,
  check_out_inventory jsonb default '{}'::jsonb,
  damages_reported jsonb default '[]'::jsonb,
  cleaning_notes text,
  
  -- Información adicional
  booking_source text,
  booking_reference text,
  notes text,
  metadata jsonb default '{}'::jsonb,
  
  -- Control de usuario
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraint: check-out debe ser después de check-in
  constraint check_dates check (check_out_date > check_in_date)
);

-- Índices para mejor rendimiento
create index if not exists rentals_company_id_idx on public.rentals (company_id);
create index if not exists rentals_department_id_idx on public.rentals (department_id);
create index if not exists rentals_status_idx on public.rentals (rental_status);
create index if not exists rentals_check_in_date_idx on public.rentals (check_in_date);
create index if not exists rentals_check_out_date_idx on public.rentals (check_out_date);
create index if not exists rentals_booking_reference_idx on public.rentals (booking_reference);
create index if not exists rentals_payment_status_idx on public.rentals (payment_status);

-- ============================================
-- TABLA: rental_payments (Pagos de Renta)
-- ============================================

create table if not exists public.rental_payments (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  
  -- Información del pago
  amount numeric(10, 2) not null,
  currency text default 'USD',
  payment_method text not null,
  payment_type text not null,
  
  -- Detalles
  payment_date timestamptz not null default now(),
  payment_reference text,
  notes text,
  
  -- Control
  received_by uuid references public.profiles (id),
  
  -- Timestamps
  created_at timestamptz not null default now()
);

create index if not exists rental_payments_rental_id_idx on public.rental_payments (rental_id);
create index if not exists rental_payments_company_id_idx on public.rental_payments (company_id);
create index if not exists rental_payments_payment_date_idx on public.rental_payments (payment_date);

-- ============================================
-- TABLA: rental_guests (Huéspedes)
-- ============================================

create table if not exists public.rental_guests (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references public.rentals (id) on delete cascade,
  
  -- Información del huésped
  full_name text not null,
  email text,
  phone text,
  id_number text,
  age_group text,
  
  -- Timestamps
  created_at timestamptz not null default now()
);

create index if not exists rental_guests_rental_id_idx on public.rental_guests (rental_id);

-- ============================================
-- MODIFICAR TABLA: departments
-- ============================================

-- Agregar campos relacionados con rentas
alter table public.departments 
add column if not exists rental_status department_rental_status default 'available',
add column if not exists current_rental_id uuid references public.rentals (id) on delete set null,
add column if not exists is_rentable boolean default true,
add column if not exists rental_price_per_night numeric(10, 2),
add column if not exists max_guests integer,
add column if not exists min_nights integer default 1,
add column if not exists cleaning_fee numeric(10, 2);

-- Índices
create index if not exists departments_rental_status_idx on public.departments (rental_status);
create index if not exists departments_current_rental_id_idx on public.departments (current_rental_id);

-- ============================================
-- TRIGGERS PARA updated_at
-- ============================================

drop trigger if exists set_timestamp_rentals on public.rentals;
create trigger set_timestamp_rentals
before update on public.rentals
for each row execute function public.handle_updated_at();

-- ============================================
-- FUNCIONES HELPER
-- ============================================

-- Función para verificar disponibilidad de departamento
create or replace function public.check_rental_availability(
  dept_id uuid,
  check_in timestamptz,
  check_out timestamptz,
  exclude_rental_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return not exists (
    select 1
    from public.rentals
    where department_id = dept_id
      and rental_status in ('reserved', 'active')
      and (id != exclude_rental_id or exclude_rental_id is null)
      and (check_in_date, check_out_date) overlaps (check_in, check_out)
  );
end;
$$;

-- Función para calcular tasa de ocupación
create or replace function public.calculate_occupancy_rate(
  comp_id uuid,
  start_date timestamptz,
  end_date timestamptz
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  total_days numeric;
  occupied_days numeric;
  total_departments integer;
begin
  -- Obtener número total de departamentos rentables
  select count(*) into total_departments
  from public.departments
  where company_id = comp_id
    and is_rentable = true;
  
  if total_departments = 0 then
    return 0;
  end if;
  
  -- Calcular días totales posibles
  total_days := extract(epoch from (end_date - start_date)) / 86400 * total_departments;
  
  -- Calcular días ocupados
  select coalesce(sum(
    extract(epoch from (
      least(check_out_date, end_date) - greatest(check_in_date, start_date)
    )) / 86400
  ), 0) into occupied_days
  from public.rentals
  where company_id = comp_id
    and rental_status in ('active', 'completed')
    and (check_in_date, check_out_date) overlaps (start_date, end_date);
  
  -- Retornar porcentaje
  return round((occupied_days / total_days * 100)::numeric, 2);
end;
$$;

-- Función para obtener rentas activas
create or replace function public.get_active_rentals(comp_id uuid)
returns setof public.rentals
language sql
security definer
set search_path = public
as $$
  select *
  from public.rentals
  where company_id = comp_id
    and rental_status = 'active'
  order by check_out_date asc;
$$;

-- Función para obtener próximos check-ins
create or replace function public.get_upcoming_check_ins(
  comp_id uuid,
  days_ahead integer default 7
)
returns setof public.rentals
language sql
security definer
set search_path = public
as $$
  select *
  from public.rentals
  where company_id = comp_id
    and rental_status = 'reserved'
    and check_in_date between now() and (now() + (days_ahead || ' days')::interval)
  order by check_in_date asc;
$$;

-- Función para obtener próximos check-outs
create or replace function public.get_upcoming_check_outs(
  comp_id uuid,
  days_ahead integer default 7
)
returns setof public.rentals
language sql
security definer
set search_path = public
as $$
  select *
  from public.rentals
  where company_id = comp_id
    and rental_status = 'active'
    and check_out_date between now() and (now() + (days_ahead || ' days')::interval)
  order by check_out_date asc;
$$;

-- ============================================
-- TRIGGERS AUTOMÁTICOS
-- ============================================

-- Trigger: Actualizar estado del departamento al crear/actualizar renta
create or replace function public.update_department_rental_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_status department_rental_status;
begin
  -- Determinar nuevo estado según el estado de la renta
  if new.rental_status = 'active' then
    new_status := 'occupied';
  elsif new.rental_status = 'reserved' then
    new_status := 'reserved';
  elsif new.rental_status in ('completed', 'cancelled') then
    -- Verificar si hay otra renta activa o reservada
    if exists (
      select 1 from public.rentals
      where department_id = new.department_id
        and id != new.id
        and rental_status in ('active', 'reserved')
    ) then
      -- Hay otra renta, mantener estado según esa renta
      select case
        when rental_status = 'active' then 'occupied'::department_rental_status
        else 'reserved'::department_rental_status
      end into new_status
      from public.rentals
      where department_id = new.department_id
        and id != new.id
        and rental_status in ('active', 'reserved')
      order by check_in_date asc
      limit 1;
    else
      -- No hay más rentas, marcar como disponible
      new_status := 'available';
    end if;
  end if;
  
  -- Actualizar departamento
  update public.departments
  set rental_status = new_status,
      current_rental_id = case
        when new.rental_status in ('active', 'reserved') then new.id
        else null
      end,
      updated_at = now()
  where id = new.department_id;
  
  return new;
end;
$$;

drop trigger if exists trigger_update_department_rental_status on public.rentals;
create trigger trigger_update_department_rental_status
  after insert or update of rental_status on public.rentals
  for each row
  execute function public.update_department_rental_status();

-- Trigger: Crear tarea de limpieza automática en check-out
create or replace function public.create_cleaning_task_on_checkout()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dept_name text;
begin
  -- Solo ejecutar si cambió a 'completed' desde 'active'
  if old.rental_status = 'active' and new.rental_status = 'completed' then
    -- Obtener nombre del departamento
    select name into dept_name
    from public.departments
    where id = new.department_id;
    
    -- Crear tarea de limpieza con alta prioridad
    insert into public.tasks (
      company_id,
      department_id,
      status,
      priority,
      notes,
      assigned_at,
      created_at
    ) values (
      new.company_id,
      new.department_id,
      'pending',
      'high',
      format('Limpieza post check-out. Arrendatario: %s. Salida: %s', 
        new.tenant_name, 
        to_char(new.actual_check_out, 'DD/MM/YYYY HH24:MI')
      ),
      now(),
      now()
    );
    
    -- Actualizar estado de limpieza del departamento
    update public.departments
    set status = 'pending',
        updated_at = now()
    where id = new.department_id;
    
    raise notice 'Tarea de limpieza creada para departamento: %', dept_name;
  end if;
  
  return new;
end;
$$;

drop trigger if exists trigger_create_cleaning_task_on_checkout on public.rentals;
create trigger trigger_create_cleaning_task_on_checkout
  after update of rental_status on public.rentals
  for each row
  when (old.rental_status = 'active' and new.rental_status = 'completed')
  execute function public.create_cleaning_task_on_checkout();

-- Trigger: Actualizar payment_status al agregar pago
create or replace function public.update_rental_payment_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rental_total numeric;
  total_paid numeric;
  new_payment_status rental_payment_status;
begin
  -- Obtener total de la renta
  select total_amount into rental_total
  from public.rentals
  where id = new.rental_id;
  
  -- Calcular total pagado
  select coalesce(sum(amount), 0) into total_paid
  from public.rental_payments
  where rental_id = new.rental_id;
  
  -- Determinar nuevo estado de pago
  if total_paid >= rental_total then
    new_payment_status := 'paid';
  elsif total_paid > 0 then
    new_payment_status := 'partial';
  else
    new_payment_status := 'pending';
  end if;
  
  -- Actualizar renta
  update public.rentals
  set payment_status = new_payment_status,
      amount_paid = total_paid,
      updated_at = now()
  where id = new.rental_id;
  
  return new;
end;
$$;

drop trigger if exists trigger_update_rental_payment_status on public.rental_payments;
create trigger trigger_update_rental_payment_status
  after insert or delete on public.rental_payments
  for each row
  execute function public.update_rental_payment_status();

-- ============================================
-- POLÍTICAS RLS
-- ============================================

-- Habilitar RLS
alter table public.rentals enable row level security;
alter table public.rental_payments enable row level security;
alter table public.rental_guests enable row level security;

-- Políticas para rentals
drop policy if exists "rentals_select_same_company" on public.rentals;
create policy "rentals_select_same_company"
  on public.rentals
  for select
  using (
    rentals.company_id = public.get_company_id_for_user(auth.uid())
    or public.is_superadmin()
  );

drop policy if exists "rentals_insert_same_company" on public.rentals;
create policy "rentals_insert_same_company"
  on public.rentals
  for insert
  with check (
    rentals.company_id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin', 'manager')
  );

drop policy if exists "rentals_update_same_company" on public.rentals;
create policy "rentals_update_same_company"
  on public.rentals
  for update
  using (
    rentals.company_id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin', 'manager')
  );

drop policy if exists "rentals_delete_same_company" on public.rentals;
create policy "rentals_delete_same_company"
  on public.rentals
  for delete
  using (
    rentals.company_id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin')
  );

-- Políticas para rental_payments
drop policy if exists "rental_payments_select_same_company" on public.rental_payments;
create policy "rental_payments_select_same_company"
  on public.rental_payments
  for select
  using (
    rental_payments.company_id = public.get_company_id_for_user(auth.uid())
    or public.is_superadmin()
  );

drop policy if exists "rental_payments_insert_same_company" on public.rental_payments;
create policy "rental_payments_insert_same_company"
  on public.rental_payments
  for insert
  with check (
    rental_payments.company_id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin', 'manager')
  );

-- Políticas para rental_guests
drop policy if exists "rental_guests_select_via_rental" on public.rental_guests;
create policy "rental_guests_select_via_rental"
  on public.rental_guests
  for select
  using (
    exists (
      select 1 from public.rentals
      where rentals.id = rental_guests.rental_id
        and (
          rentals.company_id = public.get_company_id_for_user(auth.uid())
          or public.is_superadmin()
        )
    )
  );

drop policy if exists "rental_guests_insert_via_rental" on public.rental_guests;
create policy "rental_guests_insert_via_rental"
  on public.rental_guests
  for insert
  with check (
    exists (
      select 1 from public.rentals
      where rentals.id = rental_guests.rental_id
        and rentals.company_id = public.get_company_id_for_user(auth.uid())
        and public.get_role_for_user(auth.uid()) in ('owner', 'admin', 'manager')
    )
  );

-- ============================================
-- COMENTARIOS
-- ============================================

comment on table public.rentals is 'Gestión de rentas de departamentos';
comment on table public.rental_payments is 'Pagos asociados a rentas';
comment on table public.rental_guests is 'Huéspedes asociados a rentas';

comment on column public.departments.rental_status is 'Estado de renta del departamento: available, reserved, occupied, maintenance';
comment on column public.departments.current_rental_id is 'ID de la renta activa o reservada actual';
comment on column public.departments.is_rentable is 'Indica si el departamento está disponible para rentar';
