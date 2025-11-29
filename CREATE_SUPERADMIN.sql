-- CREATE_SUPERADMIN.sql
-- Script para crear el usuario superadmin
-- Ejecuta este script DESPUÉS de ejecutar la migración 0005_add_superadmin.sql
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta primero la migración: supabase/migrations/0005_add_superadmin.sql
-- 2. Luego ejecuta este script desde Supabase Dashboard → SQL Editor
--    O usa la API endpoint: POST /api/create-superadmin con el body JSON:
--    {
--      "email": "admin@cleansweep.com",
--      "password": "Isabela04",
--      "fullName": "Super Admin"
--    }

-- Método 1: Usar la API (RECOMENDADO)
-- Hacer una petición POST a: https://tu-dominio.com/api/create-superadmin
-- Con el body JSON mostrado arriba

-- Método 2: Crear manualmente (si prefieres hacerlo directamente en SQL)
-- NOTA: Necesitarás el UUID del usuario después de crearlo en auth.users
-- usando Supabase Dashboard → Authentication → Add User

-- Paso 1: Crear usuario en auth.users (debes hacerlo desde Supabase Dashboard → Authentication)
-- Email: admin@cleansweep.com
-- Password: Isabela04
-- Email Confirm: Sí

-- Paso 2: Obtener el UUID del usuario recién creado
-- SELECT id FROM auth.users WHERE email = 'admin@cleansweep.com';

-- Paso 3: Crear el perfil superadmin (reemplaza 'USER_UUID_AQUI' con el UUID obtenido)
/*
SELECT public.create_superadmin_profile(
  'USER_UUID_AQUI'::uuid,
  'Super Admin',
  'admin@cleansweep.com'
);
*/

-- Paso 4: Verificar que se creó correctamente
-- SELECT id, role, company_id, full_name, email 
-- FROM public.profiles 
-- WHERE email = 'admin@cleansweep.com';

-- El resultado debería mostrar role = 'superadmin' y company_id = NULL
