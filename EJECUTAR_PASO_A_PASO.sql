-- EJECUTAR_PASO_A_PASO.sql
-- IMPORTANTE: Ejecuta cada sección POR SEPARADO
-- No ejecutes todo a la vez, cada sección debe ejecutarse individualmente

-- ============================================
-- PASO 1: Agregar 'superadmin' al enum user_role
-- EJECUTA SOLO ESTO PRIMERO
-- ============================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- ESPERA A QUE ESTE COMANDO TERMINE
-- Luego ejecuta el PASO 2 (no ejecutes todo junto)

-- ============================================
-- PASO 2: Hacer company_id nullable (si no se hizo)
-- EJECUTA ESTO DESPUÉS DEL PASO 1
-- ============================================
ALTER TABLE public.profiles ALTER COLUMN company_id DROP NOT NULL;

-- ESPERA A QUE ESTE COMANDO TERMINE
-- Luego ejecuta el PASO 3

-- ============================================
-- PASO 3: CREAR PERFIL SUPERADMIN
-- EJECUTA ESTO DESPUÉS DEL PASO 2
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
-- PASO 4: VERIFICAR QUE SE CREÓ CORRECTAMENTE
-- EJECUTA ESTO AL FINAL PARA VERIFICAR
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
