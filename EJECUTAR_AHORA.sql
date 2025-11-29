-- EJECUTAR_AHORA.sql
-- Script listo para ejecutar con el UUID del usuario
-- Copia y pega este script completo en Supabase Dashboard → SQL Editor

-- ============================================
-- PASO 1: Verificar que la función existe
-- ============================================
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'create_superadmin_profile';

-- ============================================
-- PASO 2: CREAR PERFIL SUPERADMIN (si la función existe)
-- ============================================
-- Si el paso 1 muestra la función, ejecuta esto:
DO $$
BEGIN
  PERFORM public.create_superadmin_profile(
    '23945475-23fa-43ca-a12c-2ab748c8dfd3'::uuid,
    'Super Admin'::text,
    'admin@cleansweep.com'::text
  );
END $$;

-- ============================================
-- VERIFICAR QUE SE CREÓ CORRECTAMENTE
-- ============================================
SELECT 
  id, 
  role, 
  company_id, 
  full_name, 
  email,
  created_at
FROM public.profiles 
WHERE email = 'admin@cleansweep.com';

-- Deberías ver:
-- - role = 'superadmin'
-- - company_id = NULL
-- - full_name = 'Super Admin'
-- - email = 'admin@cleansweep.com'
