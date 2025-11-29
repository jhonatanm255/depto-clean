-- EJECUTAR_DIRECTO.sql
-- Método alternativo: Insertar directamente en la tabla
-- IMPORTANTE: Primero ejecuta la parte del enum si no se ha hecho

-- ============================================
-- PASO 1: Agregar 'superadmin' al enum user_role (si no existe)
-- ============================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- ============================================
-- PASO 2: CREAR PERFIL SUPERADMIN DIRECTAMENTE
-- ============================================
INSERT INTO public.profiles (
  id,
  company_id,
  role,
  full_name,
  email,
  created_at,
  updated_at
) VALUES (
  '23945475-23fa-43ca-a12c-2ab748c8dfd3'::uuid,
  NULL,  -- Superadmin no tiene company_id
  'superadmin'::user_role,
  'Super Admin',
  'admin@cleansweep.com',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'superadmin'::user_role,
  company_id = NULL,
  full_name = 'Super Admin',
  email = 'admin@cleansweep.com',
  updated_at = now();

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
