-- ============================================
-- CORRECCIÓN DE TRIGGERS DE NOTIFICACIONES
-- ============================================
-- Este script corrige el error de tipo enum en los triggers
-- Ejecuta este script si obtienes el error:
-- "column 'type' is of type notification_type but expression is of type text"
-- ============================================

-- Recrear la función notify_task_assigned con cast correcto
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Recrear la función notify_task_status_changed con cast correcto
CREATE OR REPLACE FUNCTION public.notify_task_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Recrear la función notify_media_uploaded con cast correcto
CREATE OR REPLACE FUNCTION public.notify_media_uploaded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

-- ============================================
-- Verificar que las funciones se recrearon correctamente
-- ============================================
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname IN ('notify_task_assigned', 'notify_task_status_changed', 'notify_media_uploaded')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

