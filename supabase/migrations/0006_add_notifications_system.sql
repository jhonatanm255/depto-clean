-- ============================================
-- SISTEMA DE NOTIFICACIONES EN TIEMPO REAL
-- ============================================
-- Esta migración crea:
-- 1. Tabla de notificaciones
-- 2. Tipos enumerados para tipos de notificación
-- 3. Triggers para crear notificaciones automáticamente
-- 4. Políticas RLS para acceso seguro
-- ============================================

-- Tipo enumerado para tipos de notificación
do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_type') then
    create type notification_type as enum (
      'task_assigned',      -- Tarea asignada a empleada
      'task_reassigned',    -- Tarea reasignada
      'task_status_changed', -- Cambio de estado (in_progress, completed)
      'media_uploaded',     -- Evidencia subida
      'department_assigned', -- Departamento asignado
      'department_status_changed' -- Cambio de estado del departamento
    );
  end if;
end $$;

-- Tabla de notificaciones
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  related_task_id uuid references public.tasks (id) on delete cascade,
  related_department_id uuid references public.departments (id) on delete cascade,
  related_media_report_id uuid references public.media_reports (id) on delete cascade,
  read boolean not null default false,
  read_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices para mejor rendimiento
create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_company_id_idx on public.notifications (company_id);
create index if not exists notifications_read_idx on public.notifications (read);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, read) where read = false;

-- Habilitar RLS
alter table public.notifications enable row level security;

-- Políticas RLS para notificaciones
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications
  for select
  using (
    user_id = auth.uid()
    or (
      -- Superadmin puede ver todas
      public.is_superadmin()
    )
    or (
      -- Admins/owners pueden ver notificaciones de su compañía
      company_id = public.get_company_id_for_user(auth.uid())
      and public.get_role_for_user(auth.uid()) in ('owner', 'admin')
    )
  );

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_insert_system" on public.notifications;
create policy "notifications_insert_system"
  on public.notifications
  for insert
  with check (
    -- Solo el sistema puede insertar (a través de triggers o service role)
    true
  );

-- ============================================
-- FUNCIONES HELPER PARA CREAR NOTIFICACIONES
-- ============================================

-- Función para obtener el nombre del departamento
create or replace function public.get_department_name(dept_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select name from public.departments where id = dept_id;
$$;

-- Función para obtener el nombre de la empleada
create or replace function public.get_employee_name(emp_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(full_name, email, 'Empleada') from public.profiles where id = emp_id;
$$;

-- Función para obtener el nombre del admin/manager que realiza la acción
create or replace function public.get_action_user_name(user_id uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(full_name, email, 'Administrador') from public.profiles where id = user_id;
$$;

-- ============================================
-- TRIGGERS PARA NOTIFICACIONES AUTOMÁTICAS
-- ============================================

-- Trigger 1: Notificación cuando se asigna/reasigna una tarea
create or replace function public.notify_task_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dept_name text;
  emp_name text;
  admin_name text;
  is_reassignment boolean;
  prev_employee_id uuid;
begin
  -- Obtener nombres
  dept_name := public.get_department_name(new.department_id);
  emp_name := public.get_employee_name(new.employee_id);
  
  -- Verificar si es reasignación
  if tg_op = 'UPDATE' then
    prev_employee_id := old.employee_id;
    is_reassignment := prev_employee_id is not null 
                       and prev_employee_id != new.employee_id
                       and old.status != 'completed';
  else
    is_reassignment := false;
  end if;
  
  -- Obtener nombre del admin que asigna (si existe assigned_by)
  if new.assigned_by is not null then
    admin_name := public.get_action_user_name(new.assigned_by);
  else
    admin_name := 'Administrador';
  end if;
  
  -- Crear notificación para la empleada asignada
  if new.employee_id is not null then
    insert into public.notifications (
      user_id,
      company_id,
      type,
      title,
      message,
      related_task_id,
      related_department_id,
      metadata
    ) values (
      new.employee_id,
      new.company_id,
      (case 
        when is_reassignment then 'task_reassigned'::notification_type
        else 'task_assigned'::notification_type
      end),
      case 
        when is_reassignment then 'Tarea Reasignada'
        else 'Nueva Tarea Asignada'
      end,
      case 
        when is_reassignment then 
          format('Se te ha reasignado la limpieza de %s', dept_name)
        else 
          format('%s te ha asignado la limpieza de %s', admin_name, dept_name)
      end,
      new.id,
      new.department_id,
      jsonb_build_object(
        'department_name', dept_name,
        'assigned_by', admin_name,
        'is_reassignment', is_reassignment
      )
    );
  end if;
  
  return new;
end;
$$;

-- Trigger para INSERT y UPDATE en tasks
drop trigger if exists trigger_notify_task_assigned on public.tasks;
create trigger trigger_notify_task_assigned
  after insert or update of employee_id, assigned_at on public.tasks
  for each row
  when (new.employee_id is not null)
  execute function public.notify_task_assigned();

-- Trigger 2: Notificación cuando cambia el estado de una tarea
create or replace function public.notify_task_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dept_name text;
  emp_name text;
  status_text text;
begin
  -- Solo notificar si cambió el estado
  if old.status = new.status then
    return new;
  end if;
  
  -- Obtener nombres
  dept_name := public.get_department_name(new.department_id);
  emp_name := public.get_employee_name(new.employee_id);
  
  -- Traducir estado
  status_text := case new.status
    when 'in_progress' then 'En Progreso'
    when 'completed' then 'Completada'
    when 'pending' then 'Pendiente'
    else new.status::text
  end;
  
  -- Notificar a la empleada sobre el cambio de estado
  if new.employee_id is not null then
    insert into public.notifications (
      user_id,
      company_id,
      type,
      title,
      message,
      related_task_id,
      related_department_id,
      metadata
    ) values (
      new.employee_id,
      new.company_id,
      'task_status_changed'::notification_type,
      'Estado de Tarea Actualizado',
      format('El estado de la limpieza de %s cambió a: %s', dept_name, status_text),
      new.id,
      new.department_id,
      jsonb_build_object(
        'department_name', dept_name,
        'old_status', old.status,
        'new_status', new.status,
        'status_text', status_text
      )
    );
  end if;
  
  -- Notificar a admins/owners cuando una tarea se completa
  if new.status = 'completed' and old.status != 'completed' then
    -- Notificar a todos los admins/owners de la compañía
    insert into public.notifications (
      user_id,
      company_id,
      type,
      title,
      message,
      related_task_id,
      related_department_id,
      metadata
    )
    select 
      p.id,
      new.company_id,
      'task_status_changed'::notification_type,
      'Tarea Completada',
      format('%s completó la limpieza de %s', emp_name, dept_name),
      new.id,
      new.department_id,
      jsonb_build_object(
        'department_name', dept_name,
        'employee_name', emp_name,
        'status', 'completed'
      )
    from public.profiles p
    where p.company_id = new.company_id
      and p.role in ('owner', 'admin', 'manager')
      and p.id != new.employee_id; -- No notificar a la misma empleada
  end if;
  
  return new;
end;
$$;

-- Trigger para UPDATE de status en tasks
drop trigger if exists trigger_notify_task_status_changed on public.tasks;
create trigger trigger_notify_task_status_changed
  after update of status on public.tasks
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_task_status_changed();

-- Trigger 3: Notificación cuando se sube una evidencia multimedia
create or replace function public.notify_media_uploaded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dept_name text;
  emp_name text;
  uploader_name text;
  report_type_text text;
begin
  -- Obtener nombres
  dept_name := public.get_department_name(new.department_id);
  emp_name := public.get_employee_name(new.employee_id);
  uploader_name := public.get_action_user_name(new.uploaded_by);
  
  -- Traducir tipo de reporte
  report_type_text := case new.report_type
    when 'before' then 'Antes de Limpiar'
    when 'after' then 'Después de Limpiar'
    when 'incident' then 'Incidente'
    else new.report_type::text
  end;
  
  -- Notificar a admins/owners sobre nueva evidencia
  insert into public.notifications (
    user_id,
    company_id,
    type,
    title,
    message,
    related_media_report_id,
    related_department_id,
    metadata
  )
  select 
    p.id,
    new.company_id,
    'media_uploaded'::notification_type,
    'Nueva Evidencia Subida',
    format('%s subió %s para %s', 
      uploader_name, 
      lower(report_type_text), 
      dept_name),
    new.id,
    new.department_id,
    jsonb_build_object(
      'department_name', dept_name,
      'uploader_name', uploader_name,
      'employee_name', emp_name,
      'report_type', new.report_type,
      'report_type_text', report_type_text
    )
  from public.profiles p
  where p.company_id = new.company_id
    and p.role in ('owner', 'admin', 'manager')
    and p.id != new.uploaded_by; -- No notificar al que subió
  
  return new;
end;
$$;

-- Trigger para INSERT en media_reports
drop trigger if exists trigger_notify_media_uploaded on public.media_reports;
create trigger trigger_notify_media_uploaded
  after insert on public.media_reports
  for each row
  execute function public.notify_media_uploaded();

-- ============================================
-- FUNCIÓN PARA MARCAR NOTIFICACIONES COMO LEÍDAS
-- ============================================

create or replace function public.mark_notification_read(notif_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set read = true,
      read_at = now()
  where id = notif_id
    and user_id = auth.uid();
end;
$$;

-- ============================================
-- FUNCIÓN PARA MARCAR TODAS LAS NOTIFICACIONES COMO LEÍDAS
-- ============================================

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set read = true,
      read_at = now()
  where user_id = auth.uid()
    and read = false;
end;
$$;

-- ============================================
-- COMENTARIOS
-- ============================================

comment on table public.notifications is 'Sistema de notificaciones en tiempo real para la aplicación';
comment on column public.notifications.type is 'Tipo de notificación: asignación, cambio de estado, evidencia, etc.';
comment on column public.notifications.read is 'Indica si la notificación ha sido leída';
comment on column public.notifications.metadata is 'Información adicional en formato JSON';

