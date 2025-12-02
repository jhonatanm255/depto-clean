-- EJECUTAR_CREAR_SUPERADMIN.sql
-- Script listo para ejecutar - Solo reemplaza el UUID del usuario
-- 
-- PASOS:
-- 1. Primero crea el usuario en Supabase Dashboard → Authentication → Add User
--    - Email: admin@cleansweep.com
--    - Password: Isabela04
--    - Auto Confirm User: ✓
--
-- 2. Obtén el UUID del usuario ejecutando:
--    SELECT id FROM auth.users WHERE email = 'admin@cleansweep.com';
--
-- 3. Reemplaza 'TU_UUID_AQUI' abajo con el UUID obtenido y ejecuta todo el script

-- ============================================
-- CREAR PERFIL SUPERADMIN
-- ============================================
-- Reemplaza 'TU_UUID_AQUI' con el UUID del usuario
SELECT public.create_superadmin_profile(
  'TU_UUID_AQUI'::uuid,  -- ⚠️ REEMPLAZA ESTE VALOR
  'Super Admin',
  'admin@cleansweep.com'
);

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



