-- SOLUCIONAR_RECURSION_RLS.sql
-- Script para solucionar la recursión infinita en las políticas RLS
-- El problema: las políticas intentan consultar profiles para verificar si es superadmin,
-- pero eso causa recursión porque la misma consulta pasa por RLS

-- ============================================
-- PASO 1: Crear función helper para verificar si el usuario es superadmin
-- Esta función usa SECURITY DEFINER para evitar recursión
-- ============================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Leer directamente desde profiles sin pasar por RLS (SECURITY DEFINER)
  SELECT role INTO user_role_val
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role_val = 'superadmin';
END;
$$;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

-- ============================================
-- PASO 2: Eliminar políticas problemáticas
-- ============================================

DROP POLICY IF EXISTS "profiles_select_with_superadmin" ON public.profiles;
DROP POLICY IF EXISTS "companies_select_with_superadmin" ON public.companies;
DROP POLICY IF EXISTS "departments_crud_with_superadmin" ON public.departments;
DROP POLICY IF EXISTS "tasks_crud_with_superadmin" ON public.tasks;
DROP POLICY IF EXISTS "media_reports_crud_with_superadmin" ON public.media_reports;

-- ============================================
-- PASO 3: Recrear políticas usando la función helper (sin recursión)
-- ============================================

-- Profiles: superadmin puede ver todos, otros según reglas normales
CREATE POLICY "profiles_select_with_superadmin"
  ON public.profiles
  FOR SELECT
  USING (
    -- Caso 1: Usuario viendo su propio perfil (incluye superadmin)
    id = auth.uid()
    OR
    -- Caso 2: Superadmin puede ver todos los perfiles (usa función sin recursión)
    public.is_superadmin()
    OR
    -- Caso 3: Usuarios normales viendo perfiles de su compañía
    (
      profiles.company_id = public.get_company_id_for_user(auth.uid())
      AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin', 'manager')
    )
  );

-- Companies: superadmin puede ver todas, otros solo su compañía
CREATE POLICY "companies_select_with_superadmin"
  ON public.companies
  FOR SELECT
  USING (
    -- Superadmin puede ver todas las empresas
    public.is_superadmin()
    OR
    -- Usuarios normales solo ven su compañía
    companies.id = public.get_company_id_for_user(auth.uid())
  );

-- Departments: superadmin puede ver todos, otros solo su compañía
CREATE POLICY "departments_crud_with_superadmin"
  ON public.departments
  FOR ALL
  USING (
    public.is_superadmin()
    OR
    departments.company_id = public.get_company_id_for_user(auth.uid())
  )
  WITH CHECK (
    public.is_superadmin()
    OR
    departments.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Tasks: superadmin puede ver todas, otros solo su compañía
CREATE POLICY "tasks_crud_with_superadmin"
  ON public.tasks
  FOR ALL
  USING (
    public.is_superadmin()
    OR
    tasks.company_id = public.get_company_id_for_user(auth.uid())
  )
  WITH CHECK (
    public.is_superadmin()
    OR
    tasks.company_id = public.get_company_id_for_user(auth.uid())
  );

-- Media Reports: superadmin puede ver todos, otros solo su compañía
CREATE POLICY "media_reports_crud_with_superadmin"
  ON public.media_reports
  FOR ALL
  USING (
    public.is_superadmin()
    OR
    media_reports.company_id = public.get_company_id_for_user(auth.uid())
  )
  WITH CHECK (
    public.is_superadmin()
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
