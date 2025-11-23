-- SOLUCION_LOGIN_TIMEOUT.sql
-- Ejecuta este script en Supabase Dashboard → SQL Editor para diagnosticar y solucionar el problema de login

-- ============================================
-- PASO 1: Verificar que tu perfil existe
-- ============================================
-- Reemplaza 'TU_USER_ID' con tu ID de usuario (lo encuentras en la consola del navegador)
-- Ejemplo: SELECT * FROM public.profiles WHERE id = '5ce04fe7-21b4-4e69-b17c-ec9c8e16def3';

SELECT 
  id,
  email,
  company_id,
  role,
  full_name,
  created_at
FROM public.profiles 
WHERE id = 'TU_USER_ID';  -- ⚠️ REEMPLAZA CON TU USER ID

-- ============================================
-- PASO 2: Si tu perfil NO existe, créalo manualmente
-- ============================================
-- Primero obtén tu company_id ejecutando:
-- SELECT company_id FROM public.profiles LIMIT 1;
-- Luego crea tu perfil (REEMPLAZA los valores):

/*
INSERT INTO public.profiles (id, company_id, role, full_name, email)
VALUES (
  'TU_USER_ID',           -- ⚠️ Tu ID de usuario de auth.users
  'TU_COMPANY_ID',        -- ⚠️ El company_id que obtuviste
  'owner',                -- ⚠️ O 'admin', 'manager', 'employee' según corresponda
  'Tu Nombre Completo',
  'tu@email.com'
);
*/

-- ============================================
-- PASO 3: Verificar políticas RLS de profiles
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- PASO 4: Optimizar política RLS para perfiles propios
-- ============================================
-- Esta política permite que un usuario vea su propio perfil rápidamente
-- sin evaluar la segunda condición compleja primero

DROP POLICY IF EXISTS "profiles_select_own_optimized" ON public.profiles;

CREATE POLICY "profiles_select_own_optimized"
ON public.profiles
FOR SELECT
USING (
  -- Prioridad 1: Usuario viendo su propio perfil (más rápido, usa índice primario)
  id = auth.uid()
  -- Prioridad 2: Usuarios viendo perfiles de su compañía (solo si no es su propio perfil)
  OR (
    id != auth.uid()  -- Evitar duplicar la primera condición
    AND profiles.company_id = public.get_company_id_for_user(auth.uid())
    AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin', 'manager')
  )
);

-- Eliminar la política antigua si existe
DROP POLICY IF EXISTS "profiles_select_same_company" ON public.profiles;

-- ============================================
-- PASO 5: Crear función RPC optimizada para obtener perfil
-- ============================================
DROP FUNCTION IF EXISTS public.get_my_profile();

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile json;
BEGIN
  -- Consulta directa sin RLS, pero solo para el usuario autenticado actual
  SELECT to_json(p.*) INTO user_profile
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
  
  RETURN user_profile;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- ============================================
-- PASO 6: Verificar que las funciones helper existen
-- ============================================
SELECT 
  proname as function_name,
  prorettype::regtype as return_type
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('get_company_id_for_user', 'get_role_for_user');

-- ============================================
-- PASO 7: Verificar índices en la tabla profiles
-- ============================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- ============================================
-- PASO 8: Si no existe índice en id, crearlo (aunque debería ser PK)
-- ============================================
-- La columna id debería ser PRIMARY KEY, pero verificamos:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE tablename = 'profiles' 
      AND indexname = 'profiles_pkey'
  ) THEN
    RAISE NOTICE 'Advertencia: La tabla profiles no tiene PRIMARY KEY en id';
  END IF;
END $$;

-- ============================================
-- DIAGNÓSTICO: Probar consulta directa
-- ============================================
-- Ejecuta esta consulta para ver si puedes leer tu propio perfil:
-- (REEMPLAZA con tu user ID)

-- SELECT * FROM public.profiles WHERE id = auth.uid();

