-- EJECUTAR_COMPLETO.sql
-- Script completo: primero agrega superadmin al enum, luego crea el perfil

-- ============================================
-- PASO 1: Agregar 'superadmin' al enum user_role
-- ============================================
-- Esto es necesario antes de poder usar el valor 'superadmin'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- ============================================
-- PASO 2: Verificar que el valor fue agregado
-- ============================================
SELECT unnest(enum_range(NULL::user_role)) AS role_value;

-- Deberías ver: owner, admin, manager, employee, superadmin

-- ============================================
-- PASO 3: Hacer company_id nullable (si no se hizo en la migración)
-- ============================================
ALTER TABLE public.profiles ALTER COLUMN company_id DROP NOT NULL;

-- ============================================
-- PASO 4: CREAR PERFIL SUPERADMIN
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
-- PASO 5: VERIFICAR QUE SE CREÓ CORRECTAMENTE
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
