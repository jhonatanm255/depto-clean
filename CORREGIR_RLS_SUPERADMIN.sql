-- CORREGIR_RLS_SUPERADMIN.sql
-- Script para corregir las políticas RLS y funciones para superadmin
-- Ejecuta esto completo en Supabase Dashboard → SQL Editor

-- ============================================
-- PASO 1: Eliminar TODAS las políticas que dependen de las funciones
-- ============================================

DROP POLICY IF EXISTS "companies_select_own" ON public.companies;
DROP POLICY IF EXISTS "companies_select_with_superadmin" ON public.companies;
DROP POLICY IF EXISTS "companies_update_owner_admin" ON public.companies;
DROP POLICY IF EXISTS "profiles_select_same_company" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_with_superadmin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_optimized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_same_company" ON public.profiles;
DROP POLICY IF EXISTS "departments_crud_same_company" ON public.departments;
DROP POLICY IF EXISTS "departments_crud_with_superadmin" ON public.departments;
DROP POLICY IF EXISTS "tasks_crud_same_company" ON public.tasks;
DROP POLICY IF EXISTS "tasks_crud_with_superadmin" ON public.tasks;
DROP POLICY IF EXISTS "media_reports_crud_same_company" ON public.media_reports;
DROP POLICY IF EXISTS "media_reports_crud_with_superadmin" ON public.media_reports;
DROP POLICY IF EXISTS "companies_select_superadmin" ON public.companies;
DROP POLICY IF EXISTS "profiles_select_superadmin" ON public.profiles;
DROP POLICY IF EXISTS "departments_select_superadmin" ON public.departments;
DROP POLICY IF EXISTS "tasks_select_superadmin" ON public.tasks;

-- ============================================
-- PASO 2: Actualizar funciones helper para manejar superadmin
-- ============================================

-- Actualizar función get_company_id_for_user para manejar superadmin
CREATE OR REPLACE FUNCTION public.get_company_id_for_user(uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_company_id uuid;
  user_role_val user_role;
BEGIN
  -- Obtener company_id y role directamente (SECURITY DEFINER permite saltar RLS)
  SELECT company_id, role INTO user_company_id, user_role_val
  FROM public.profiles
  WHERE id = uid;
  
  -- Si es superadmin, retornar NULL (no tiene company_id)
  IF user_role_val = 'superadmin' THEN
    RETURN NULL;
  END IF;
  
  RETURN user_company_id;
END;
$$;

-- Actualizar función get_role_for_user
CREATE OR REPLACE FUNCTION public.get_role_for_user(uid uuid)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM public.profiles
  WHERE id = uid;
  
  RETURN user_role_val;
END;
$$;

-- ============================================
-- PASO 3: Recrear TODAS las políticas RLS (incluyendo soporte para superadmin)
-- ============================================

-- Companies: superadmin puede ver todas, otros solo su compañía
CREATE POLICY "companies_select_with_superadmin"
  ON public.companies
  FOR SELECT
  USING (
    -- Superadmin puede ver todas las empresas
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR
    -- Usuarios normales solo ven su compañía
    companies.id = public.get_company_id_for_user(auth.uid())
  );

CREATE POLICY "companies_update_owner_admin"
  ON public.companies
  FOR UPDATE
  USING (
    companies.id = public.get_company_id_for_user(auth.uid())
    AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin')
  );

-- Profiles: superadmin puede ver todos, otros según reglas normales
CREATE POLICY "profiles_select_with_superadmin"
  ON public.profiles
  FOR SELECT
  USING (
    -- Caso 1: Usuario viendo su propio perfil (incluye superadmin)
    id = auth.uid()
    OR
    -- Caso 2: Superadmin puede ver todos los perfiles
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
    )
    OR
    -- Caso 3: Usuarios normales viendo perfiles de su compañía
    (
      profiles.company_id = public.get_company_id_for_user(auth.uid())
      AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles
  FOR UPDATE
  USING (
    id = auth.uid()
    OR (
      profiles.company_id = public.get_company_id_for_user(auth.uid())
      AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin')
    )
  );

CREATE POLICY "profiles_insert_same_company"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    profiles.company_id = public.get_company_id_for_user(auth.uid())
    AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin')
  );

-- Departments: superadmin puede ver todos, otros solo su compañía
CREATE POLICY "departments_crud_with_superadmin"
  ON public.departments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR
    departments.company_id = public.get_company_id_for_user(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR
    departments.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Tasks: superadmin puede ver todas, otros solo su compañía
CREATE POLICY "tasks_crud_with_superadmin"
  ON public.tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR
    tasks.company_id = public.get_company_id_for_user(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR
    tasks.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Media Reports: superadmin puede ver todos, otros solo su compañía
CREATE POLICY "media_reports_crud_with_superadmin"
  ON public.media_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR
    media_reports.company_id = public.get_company_id_for_user(auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'superadmin'
    )
    OR
    media_reports.company_id = public.get_company_id_for_user(auth.uid())
  );

-- ============================================
-- PASO 4: Verificar que las políticas se crearon correctamente
-- ============================================
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'companies', 'departments', 'tasks', 'media_reports')
  AND schemaname = 'public'
ORDER BY tablename, policyname;