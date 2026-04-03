-- Migration: 20260403_add_company_logo
-- Soporte para logo corporativo personalizado

-- 1. Añadir columna logo_url a la tabla companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Asegurar que el bucket 'logos' existe en storage.buckets
-- Nota: Esto asume que el usuario tiene permisos para insertar en storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'logos', 'logos', true, 2097152, '{image/png,image/jpeg,image/webp,image/svg+xml}'
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'logos'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de RLS para el bucket 'logos'

-- Lectura pública para cualquier usuario (anon o autenticado)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

-- Permitir a usuarios 'owner' y 'admin' gestionar el logo de su propia empresa
-- El archivo se guardará bajo una carpeta con el ID de la empresa: company_id/logo.png
DROP POLICY IF EXISTS "Manage Own Company Logo" ON storage.objects;
CREATE POLICY "Manage Own Company Logo" ON storage.objects 
FOR ALL 
USING (
    bucket_id = 'logos' 
    AND (storage.foldername(name))[1] = public.get_company_id_for_user(auth.uid())::text
    AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin')
)
WITH CHECK (
    bucket_id = 'logos' 
    AND (storage.foldername(name))[1] = public.get_company_id_for_user(auth.uid())::text
    AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin')
);
