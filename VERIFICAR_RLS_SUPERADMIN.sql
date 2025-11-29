-- VERIFICAR_RLS_SUPERADMIN.sql
-- Script para verificar y corregir las políticas RLS para superadmin

-- ============================================
-- PASO 1: Verificar políticas actuales de companies
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
WHERE tablename = 'companies'
ORDER BY policyname;

-- ============================================
-- PASO 2: Verificar políticas actuales de profiles
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
-- PASO 3: Verificar políticas actuales de departments
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
WHERE tablename = 'departments'
ORDER BY policyname;

-- ============================================
-- PASO 4: Verificar políticas actuales de tasks
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
WHERE tablename = 'tasks'
ORDER BY policyname;

-- ============================================
-- PASO 5: Recrear políticas RLS para superadmin (ejecutar si no existen)
-- ============================================

-- Superadmin puede ver todas las empresas
DROP POLICY IF EXISTS "companies_select_superadmin" ON public.companies;
CREATE POLICY "companies_select_superadmin"
  ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Superadmin puede ver todos los perfiles
DROP POLICY IF EXISTS "profiles_select_superadmin" ON public.profiles;
CREATE POLICY "profiles_select_superadmin"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
    )
  );

-- Superadmin puede ver todos los departamentos
DROP POLICY IF EXISTS "departments_select_superadmin" ON public.departments;
CREATE POLICY "departments_select_superadmin"
  ON public.departments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- Superadmin puede ver todas las tareas
DROP POLICY IF EXISTS "tasks_select_superadmin" ON public.tasks;
CREATE POLICY "tasks_select_superadmin"
  ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
  );

-- ============================================
-- PASO 6: Verificar que puedes acceder como superadmin
-- Reemplaza 'TU_USER_ID' con el UUID del superadmin
-- ============================================
-- SELECT 
--   id,
--   role,
--   (SELECT COUNT(*) FROM public.companies) as total_companies,
--   (SELECT COUNT(*) FROM public.profiles) as total_profiles
-- FROM public.profiles
-- WHERE id = '23945475-23fa-43ca-a12c-2ab748c8dfd3'::uuid;
