-- ============================================
-- DIAGNÓSTICO DE NOTIFICACIONES
-- ============================================
-- Este script te ayuda a diagnosticar por qué las notificaciones no funcionan
-- Ejecuta este script después de intentar asignar una tarea
-- ============================================

-- 1. Verificar que la tabla notifications existe
SELECT 
  'Tabla notifications' as verificacion,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
    THEN '✅ Existe'
    ELSE '❌ No existe'
  END as resultado;

-- 2. Verificar que el tipo enum notification_type existe
SELECT 
  'Tipo notification_type' as verificacion,
  CASE 
    WHEN EXISTS (SELECT FROM pg_type WHERE typname = 'notification_type')
    THEN '✅ Existe'
    ELSE '❌ No existe'
  END as resultado;

-- 3. Verificar que las funciones de triggers existen
SELECT 
  'Funciones de triggers' as verificacion,
  array_agg(proname) as funciones_encontradas
FROM pg_proc
WHERE proname IN ('notify_task_assigned', 'notify_task_status_changed', 'notify_media_uploaded')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Verificar que los triggers están activos
SELECT 
  'Triggers activos' as verificacion,
  array_agg(tgname) as triggers_encontrados
FROM pg_trigger
WHERE tgname LIKE '%notify%'
  AND tgenabled = 'O'; -- O = enabled

-- 5. Ver todas las notificaciones recientes (últimas 10)
SELECT 
  'Últimas 10 notificaciones' as verificacion,
  id,
  user_id,
  type,
  title,
  message,
  read,
  created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 10;

-- 6. Verificar políticas RLS
SELECT 
  'Políticas RLS' as verificacion,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'notifications'
  AND schemaname = 'public';

-- 7. Contar notificaciones por usuario (si hay datos)
SELECT 
  'Notificaciones por usuario' as verificacion,
  user_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE read = false) as sin_leer,
  COUNT(*) FILTER (WHERE read = true) as leidas
FROM public.notifications
GROUP BY user_id
ORDER BY total DESC
LIMIT 5;

-- 8. Verificar última tarea creada (para comparar con notificaciones)
SELECT 
  'Última tarea creada' as verificacion,
  t.id as task_id,
  t.employee_id,
  t.assigned_at,
  t.status,
  d.name as department_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.related_task_id = t.id
    )
    THEN '✅ Tiene notificación'
    ELSE '❌ Sin notificación'
  END as tiene_notificacion
FROM public.tasks t
JOIN public.departments d ON d.id = t.department_id
ORDER BY t.assigned_at DESC
LIMIT 1;






