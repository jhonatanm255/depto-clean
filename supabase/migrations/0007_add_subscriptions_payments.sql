-- 0007_add_subscriptions_payments.sql
-- Sistema de suscripciones y pagos con PayPal

-- Tipos enumerados para suscripciones
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type subscription_status as enum ('active', 'cancelled', 'expired', 'past_due', 'trialing');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'completed', 'failed', 'refunded', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'plan_type') then
    create type plan_type as enum ('free', 'paid');
  end if;
end $$;

-- Tabla de planes de suscripción
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- 'free', 'paid'
  name text not null,
  description text,
  plan_type plan_type not null,
  price_usd numeric(10, 2) not null default 0,
  duration_days integer not null, -- Duración en días (30 para mensual)
  features jsonb default '[]'::jsonb, -- Array de características del plan
  paypal_plan_id text, -- ID del plan en PayPal (solo para planes de pago)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insertar planes por defecto
insert into public.subscription_plans (code, name, description, plan_type, price_usd, duration_days, features)
values
  ('free', 'Plan Gratuito', 'Plan de prueba gratuito por 1 mes', 'free', 0.00, 30, '["Acceso básico", "Hasta 5 departamentos", "Soporte por email"]'::jsonb),
  ('paid', 'Plan Premium', 'Plan de pago mensual con todas las características', 'paid', 29.99, 30, '["Acceso completo", "Departamentos ilimitados", "Soporte prioritario", "Reportes avanzados"]'::jsonb)
on conflict (code) do nothing;

-- Tabla de suscripciones
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  status subscription_status not null default 'trialing',
  paypal_subscription_id text unique, -- ID de suscripción en PayPal
  paypal_plan_id text, -- ID del plan en PayPal
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  trial_end timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_company_id_idx on public.subscriptions (company_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_paypal_subscription_id_idx on public.subscriptions (paypal_subscription_id);

-- Tabla de pagos/transacciones
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  paypal_order_id text unique, -- ID de orden en PayPal
  paypal_transaction_id text, -- ID de transacción en PayPal
  amount_usd numeric(10, 2) not null,
  currency text not null default 'USD',
  status payment_status not null default 'pending',
  payment_method text default 'paypal',
  paypal_payer_id text,
  paypal_payer_email text,
  -- Campos de seguridad: hash de datos sensibles
  payment_data_hash text, -- Hash de datos sensibles para verificación
  failure_reason text,
  refunded_at timestamptz,
  refund_amount numeric(10, 2),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_subscription_id_idx on public.payments (subscription_id);
create index if not exists payments_company_id_idx on public.payments (company_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_paypal_order_id_idx on public.payments (paypal_order_id);
create index if not exists payments_paypal_transaction_id_idx on public.payments (paypal_transaction_id);

-- Tabla de eventos de webhook (auditoría y seguridad)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  paypal_event_id text unique, -- ID del evento en PayPal
  paypal_resource_type text,
  paypal_resource_id text,
  payload jsonb not null, -- Payload completo del webhook
  signature text, -- Firma del webhook para verificación
  verified boolean not null default false, -- Si la firma fue verificada
  processed boolean not null default false,
  processing_error text,
  created_at timestamptz not null default now()
);

create index if not exists webhook_events_paypal_event_id_idx on public.webhook_events (paypal_event_id);
create index if not exists webhook_events_verified_idx on public.webhook_events (verified);
create index if not exists webhook_events_processed_idx on public.webhook_events (processed);

-- Trigger para updated_at
drop trigger if exists set_timestamp_subscription_plans on public.subscription_plans;
create trigger set_timestamp_subscription_plans
before update on public.subscription_plans
for each row execute function public.handle_updated_at();

drop trigger if exists set_timestamp_subscriptions on public.subscriptions;
create trigger set_timestamp_subscriptions
before update on public.subscriptions
for each row execute function public.handle_updated_at();

drop trigger if exists set_timestamp_payments on public.payments;
create trigger set_timestamp_payments
before update on public.payments
for each row execute function public.handle_updated_at();

-- Función para actualizar el plan_code de la compañía cuando cambia la suscripción
create or replace function public.update_company_plan_code()
returns trigger as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    update public.companies
    set plan_code = (select code from public.subscription_plans where id = new.plan_id),
        updated_at = now()
    where id = new.company_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists update_company_plan_on_subscription_change on public.subscriptions;
create trigger update_company_plan_on_subscription_change
after insert or update on public.subscriptions
for each row execute function public.update_company_plan_code();

-- Función para verificar si una suscripción está activa
create or replace function public.is_subscription_active(sub_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where id = sub_id
      and status = 'active'
      and current_period_end > now()
      and cancel_at_period_end = false
  );
$$;

-- Habilitar RLS
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.webhook_events enable row level security;

-- Políticas RLS para subscription_plans (público, solo lectura)
drop policy if exists "subscription_plans_select_all" on public.subscription_plans;
create policy "subscription_plans_select_all"
  on public.subscription_plans
  for select
  using (is_active = true);

-- Políticas RLS para subscriptions
drop policy if exists "subscriptions_select_own_company" on public.subscriptions;
create policy "subscriptions_select_own_company"
  on public.subscriptions
  for select
  using (
    subscriptions.company_id = public.get_company_id_for_user(auth.uid())
    or public.get_role_for_user(auth.uid()) = 'superadmin'
  );

drop policy if exists "subscriptions_update_owner_admin" on public.subscriptions;
create policy "subscriptions_update_owner_admin"
  on public.subscriptions
  for update
  using (
    subscriptions.company_id = public.get_company_id_for_user(auth.uid())
    and public.get_role_for_user(auth.uid()) in ('owner', 'admin')
  );

-- Políticas RLS para payments
drop policy if exists "payments_select_own_company" on public.payments;
create policy "payments_select_own_company"
  on public.payments
  for select
  using (
    payments.company_id = public.get_company_id_for_user(auth.uid())
    or public.get_role_for_user(auth.uid()) = 'superadmin'
  );

-- Políticas RLS para webhook_events (solo superadmin puede ver)
drop policy if exists "webhook_events_select_superadmin" on public.webhook_events;
create policy "webhook_events_select_superadmin"
  on public.webhook_events
  for select
  using (
    public.get_role_for_user(auth.uid()) = 'superadmin'
  );

-- Función para crear suscripción inicial (free) al crear una compañía
create or replace function public.create_initial_free_subscription()
returns trigger as $$
declare
  free_plan_id uuid;
begin
  -- Obtener el ID del plan free
  select id into free_plan_id
  from public.subscription_plans
  where code = 'free'
  limit 1;

  if free_plan_id is not null then
    -- Crear suscripción free por 30 días
    insert into public.subscriptions (
      company_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      trial_end
    ) values (
      new.id,
      free_plan_id,
      'trialing',
      now(),
      now() + interval '30 days',
      now() + interval '30 days'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger para crear suscripción free automáticamente
drop trigger if exists create_free_subscription_on_company_create on public.companies;
create trigger create_free_subscription_on_company_create
after insert on public.companies
for each row execute function public.create_initial_free_subscription();

