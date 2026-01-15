-- AGREGAR COLUMNAS FALTANTES A LA TABLA DEPARTMENTS
-- Ejecuta este script en el SQL Editor de Supabase (https://supabase.com/dashboard/project/_/sql)

ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS bedrooms integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bathrooms integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS beds_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS beds jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS hand_towels integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS body_towels integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '[]'::jsonb;

-- NOTA: Después de ejecutar esto, es posible que necesites recargar la página 
-- de la aplicación web para que el caché del esquema se actualice.
