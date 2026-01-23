-- ============================================
-- SCRIPT PARA LIMPIAR BASE DE DATOS
-- MANTIENE: Estructura + Super Admin
-- ELIMINA: Todos los datos de prueba
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Copia y pega TODO este script
-- 3. Haz clic en "Run" o presiona Ctrl+Enter
-- 4. Espera a que termine (verás los mensajes de confirmación)
-- 
-- ============================================

DO $$
DECLARE
  superadmin_user_id uuid;
  superadmin_email text;
BEGIN
  -- Obtener el ID del superadmin (si existe)
  SELECT id, email INTO superadmin_user_id, superadmin_email
  FROM public.profiles
  WHERE role = 'superadmin'
  LIMIT 1;

  IF superadmin_user_id IS NOT NULL THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Super Admin encontrado: %', superadmin_email;
    RAISE NOTICE 'ID: %', superadmin_user_id;
    RAISE NOTICE 'Este usuario NO será eliminado';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '⚠️ No se encontró ningún super admin';
  END IF;

  -- ============================================
  -- PASO 1: ELIMINAR DATOS RELACIONADOS
  -- ============================================

  RAISE NOTICE 'Iniciando limpieza de base de datos...';

  -- Eliminar eventos de webhook
  DELETE FROM public.webhook_events;
  RAISE NOTICE '✓ Eventos de webhook eliminados';

  -- Eliminar pagos
  DELETE FROM public.payments;
  RAISE NOTICE '✓ Pagos eliminados';

  -- Eliminar suscripciones
  DELETE FROM public.subscriptions;
  RAISE NOTICE '✓ Suscripciones eliminadas';

  -- Eliminar notificaciones
  DELETE FROM public.notifications;
  RAISE NOTICE '✓ Notificaciones eliminadas';

  -- Eliminar reportes multimedia (evidencias)
  DELETE FROM public.media_reports;
  RAISE NOTICE '✓ Reportes multimedia eliminados';

  -- Eliminar tareas
  DELETE FROM public.tasks;
  RAISE NOTICE '✓ Tareas eliminadas';

  -- Eliminar departamentos
  DELETE FROM public.departments;
  RAISE NOTICE '✓ Departamentos eliminados';

  -- Eliminar condominios
  DELETE FROM public.condominiums;
  RAISE NOTICE '✓ Condominios eliminados';

  -- ============================================
  -- PASO 2: ELIMINAR PERFILES (EXCEPTO SUPERADMIN)
  -- ============================================

  DELETE FROM public.profiles
  WHERE role != 'superadmin';
  RAISE NOTICE '✓ Perfiles eliminados (superadmin preservado)';

  -- ============================================
  -- PASO 3: ELIMINAR COMPAÑÍAS
  -- ============================================

  DELETE FROM public.companies;
  RAISE NOTICE '✓ Compañías eliminadas';

  -- ============================================
  -- PASO 4: ELIMINAR USUARIOS DE AUTH (EXCEPTO SUPERADMIN)
  -- ============================================

  IF superadmin_user_id IS NOT NULL THEN
    -- Eliminar todos los usuarios EXCEPTO el superadmin
    DELETE FROM auth.users
    WHERE id != superadmin_user_id;
    RAISE NOTICE '✓ Usuarios de autenticación eliminados (superadmin preservado)';
  ELSE
    -- Si no hay superadmin, eliminar todos
    DELETE FROM auth.users;
    RAISE NOTICE '✓ Usuarios de autenticación eliminados';
  END IF;

  -- ============================================
  -- VERIFICACIÓN FINAL
  -- ============================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'LIMPIEZA COMPLETADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Compañías restantes: %', (SELECT COUNT(*) FROM public.companies);
  RAISE NOTICE 'Perfiles restantes: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Departamentos restantes: %', (SELECT COUNT(*) FROM public.departments);
  RAISE NOTICE 'Tareas restantes: %', (SELECT COUNT(*) FROM public.tasks);
  RAISE NOTICE 'Notificaciones restantes: %', (SELECT COUNT(*) FROM public.notifications);
  RAISE NOTICE 'Usuarios auth restantes: %', (SELECT COUNT(*) FROM auth.users);
  RAISE NOTICE '========================================';
  
  IF superadmin_user_id IS NOT NULL THEN
    RAISE NOTICE '✅ BASE DE DATOS LIMPIADA EXITOSAMENTE';
    RAISE NOTICE '✅ Super Admin preservado: %', superadmin_email;
  ELSE
    RAISE NOTICE '✅ BASE DE DATOS LIMPIADA EXITOSAMENTE';
    RAISE NOTICE '⚠️ No había super admin para preservar';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- VERIFICACIÓN MANUAL (OPCIONAL)
-- ============================================
-- Descomenta las siguientes líneas para verificar manualmente:

-- SELECT 'Compañías' as tabla, COUNT(*) as registros FROM public.companies
-- UNION ALL
-- SELECT 'Perfiles', COUNT(*) FROM public.profiles
-- UNION ALL
-- SELECT 'Departamentos', COUNT(*) FROM public.departments
-- UNION ALL
-- SELECT 'Tareas', COUNT(*) FROM public.tasks
-- UNION ALL
-- SELECT 'Notificaciones', COUNT(*) FROM public.notifications
-- UNION ALL
-- SELECT 'Usuarios Auth', COUNT(*) FROM auth.users;

-- Ver el perfil del superadmin:
-- SELECT * FROM public.profiles WHERE role = 'superadmin';
