-- 0005_add_superadmin.sql
-- Agrega el rol superadmin y permite company_id NULL para superadmins

-- 1. Agregar 'superadmin' al enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- 2. Hacer company_id nullable para permitir superadmins sin compañía
ALTER TABLE public.profiles ALTER COLUMN company_id DROP NOT NULL;

-- 3. Actualizar la constraint de foreign key para permitir NULL
-- Primero eliminar la constraint existente
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;

-- Recrear la constraint permitiendo NULL
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES public.companies (id) 
  ON DELETE CASCADE;

-- 4. Crear función para crear el usuario superadmin
-- Esta función creará el usuario en auth.users y su perfil
CREATE OR REPLACE FUNCTION public.create_superadmin_user(
  user_email text,
  user_password text,
  user_full_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  new_auth_user_id uuid;
BEGIN
  -- Crear usuario en auth.users usando Supabase Admin API
  -- Nota: Esto debe hacerse desde la aplicación usando el Admin Client
  -- Esta función solo crea el perfil después de que el usuario se cree en auth.users
  
  -- Por ahora, retornamos un mensaje indicando que se debe usar el Admin API
  RAISE EXCEPTION 'Esta función debe ser llamada desde la aplicación usando Supabase Admin API. Use create_superadmin_profile() después de crear el usuario en auth.users.';
END;
$$;

-- 5. Función para crear el perfil de superadmin (después de crear en auth.users)
CREATE OR REPLACE FUNCTION public.create_superadmin_profile(
  auth_user_id uuid,
  user_full_name text DEFAULT NULL,
  user_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar perfil de superadmin (sin company_id)
  INSERT INTO public.profiles (
    id,
    company_id,
    role,
    full_name,
    email,
    created_at,
    updated_at
  ) VALUES (
    auth_user_id,
    NULL, -- Superadmin no tiene company_id
    'superadmin',
    user_full_name,
    user_email,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    company_id = NULL,
    full_name = COALESCE(user_full_name, profiles.full_name),
    email = COALESCE(user_email, profiles.email),
    updated_at = now();
END;
$$;

-- 6. Actualizar políticas RLS para superadmin
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

-- 7. Comentarios para documentación
COMMENT ON FUNCTION public.create_superadmin_profile IS 'Crea el perfil de superadmin después de crear el usuario en auth.users usando Admin API';













