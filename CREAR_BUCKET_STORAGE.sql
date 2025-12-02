-- ============================================
-- CONFIGURACIÓN DE STORAGE PARA EVIDENCIAS MULTIMEDIA
-- ============================================
-- 
-- IMPORTANTE: 
-- 1. Este script crea las POLÍTICAS de Storage
-- 2. El bucket 'media-files' debe crearse primero desde el Dashboard de Supabase
-- 3. El bucket debe estar marcado como PÚBLICO
-- 
-- Pasos:
-- 1. Ve a Supabase Dashboard → Storage → Create bucket
-- 2. Nombre: 'media-files'
-- 3. Marca como público
-- 4. Luego ejecuta este script para crear las políticas
-- ============================================

-- ============================================
-- PASO 1: Eliminar políticas existentes (si existen)
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to upload media files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read media files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete media files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to media files" ON storage.objects;

-- ============================================
-- PASO 2: Función helper para obtener company_id del usuario
-- ============================================
-- Esta función ya debería existir, pero la incluimos por si acaso
CREATE OR REPLACE FUNCTION public.get_company_id_for_user(uid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = uid;
$$;

-- ============================================
-- PASO 3: Función helper para verificar si es superadmin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
$$;

-- ============================================
-- PASO 4: Crear políticas de Storage
-- ============================================

-- Política 1: Permitir subir archivos a usuarios autenticados de la misma compañía
CREATE POLICY "Allow authenticated users to upload media files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = 'companies' AND
  (
    -- Superadmin puede subir a cualquier compañía
    public.is_superadmin()
    OR
    -- Usuarios normales solo a su compañía
    (storage.foldername(name))[2] = (
      SELECT company_id::text 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
);

-- Política 2: Permitir leer archivos a usuarios autenticados de la misma compañía
CREATE POLICY "Allow authenticated users to read media files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = 'companies' AND
  (
    -- Superadmin puede leer de cualquier compañía
    public.is_superadmin()
    OR
    -- Usuarios normales solo de su compañía
    (storage.foldername(name))[2] = (
      SELECT company_id::text 
      FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
);

-- Política 3: Permitir eliminar archivos solo a admins/owners (y superadmin)
CREATE POLICY "Allow admins to delete media files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-files' AND
  (
    -- Superadmin puede eliminar de cualquier compañía
    public.is_superadmin()
    OR
    -- Admins/owners solo de su compañía
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
      AND company_id::text = (storage.foldername(name))[2]
    )
  )
);

-- Política 4: Permitir lectura pública (para URLs públicas)
-- Esta política permite que las URLs públicas funcionen sin autenticación
CREATE POLICY "Allow public read access to media files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media-files');

-- ============================================
-- PASO 5: Verificar que las políticas se crearon correctamente
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%media%'
ORDER BY policyname;

-- ============================================
-- NOTAS:
-- ============================================
-- 
-- 1. El bucket 'media-files' debe crearse manualmente desde el Dashboard
-- 2. El bucket debe estar marcado como PÚBLICO para que las URLs funcionen
-- 3. Las políticas anteriores permiten:
--    - Subir: Usuarios autenticados a su propia compañía (o superadmin a cualquiera)
--    - Leer: Usuarios autenticados de su compañía (o superadmin), + acceso público
--    - Eliminar: Solo admins/owners (o superadmin)
-- 
-- 4. Estructura de rutas esperada:
--    companies/{company-id}/departments/{department-id}/media/{filename}
-- 
-- 5. Para verificar que el bucket existe:
--    SELECT * FROM storage.buckets WHERE name = 'media-files';

