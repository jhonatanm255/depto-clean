# 🔴 SOLUCIÓN URGENTE: Problema de Login Timeout

## Problema
El login está tardando más de 10-15 segundos en cargar el perfil desde la base de datos, lo que causa timeouts y bloquea el inicio de sesión.

## ⚡ SOLUCIÓN RÁPIDA (5 minutos)

### Paso 1: Verificar que tu perfil existe

1. Ve a **Supabase Dashboard**: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (menú lateral izquierdo)
4. Ejecuta esta consulta (reemplaza `TU_USER_ID` con el ID que aparece en la consola del navegador):

```sql
SELECT * FROM public.profiles 
WHERE id = 'TU_USER_ID';
```

**Ejemplo** (con el ID de tu caso):
```sql
SELECT * FROM public.profiles 
WHERE id = '5ce04fe7-21b4-4e69-b17c-ec9c8e16def3';
```

### Paso 2A: Si NO hay resultado (tu perfil NO existe)

Tu perfil no existe en la tabla `profiles`. Debes crearlo manualmente:

1. Primero, obtén tu `company_id`. Ejecuta esto:
```sql
SELECT id, name FROM public.companies LIMIT 1;
```

2. Luego, crea tu perfil. Ejecuta esto (reemplaza los valores):
```sql
INSERT INTO public.profiles (id, company_id, role, full_name, email)
VALUES (
  'TU_USER_ID',              -- El mismo ID que usaste arriba
  'TU_COMPANY_ID',           -- El ID de la empresa que obtuviste
  'owner',                   -- O 'admin' según tu rol
  'Tu Nombre Completo',
  'tu@email.com'
);
```

**Ejemplo:**
```sql
INSERT INTO public.profiles (id, company_id, role, full_name, email)
VALUES (
  '5ce04fe7-21b4-4e69-b17c-ec9c8e16def3',
  'abc123-def456-...',  -- Reemplaza con tu company_id real
  'owner',
  'Tu Nombre',
  'jhonm21@gmail.com'
);
```

3. Verifica que se creó:
```sql
SELECT * FROM public.profiles WHERE id = 'TU_USER_ID';
```

### Paso 2B: Si SÍ hay resultado (tu perfil existe)

Si tu perfil existe pero el login sigue siendo lento, el problema son las **políticas RLS**. Sigue el Paso 3.

### Paso 3: Optimizar políticas RLS (si el perfil existe pero es lento)

Ejecuta este script completo en **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Eliminar política antigua si existe
DROP POLICY IF EXISTS "profiles_select_same_company" ON public.profiles;

-- 2. Crear política optimizada para perfiles propios
CREATE POLICY "profiles_select_own_optimized"
ON public.profiles
FOR SELECT
USING (
  -- Prioridad 1: Usuario viendo su propio perfil (usa índice primario, muy rápido)
  id = auth.uid()
  -- Prioridad 2: Solo si no es su propio perfil, verifica compañía
  OR (
    id != auth.uid()
    AND company_id = public.get_company_id_for_user(auth.uid())
    AND public.get_role_for_user(auth.uid()) IN ('owner', 'admin', 'manager')
  )
);

-- 3. Crear función RPC optimizada
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
  -- Consulta directa sin RLS, solo para el usuario autenticado actual
  SELECT to_json(p.*) INTO user_profile
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
  
  RETURN user_profile;
END;
$$;

-- 4. Dar permisos
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
```

## 🔍 Diagnóstico Adicional

Si después de seguir los pasos anteriores el problema persiste:

### Verificar políticas RLS actuales
```sql
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
```

### Verificar que las funciones helper existen
```sql
SELECT proname, prorettype::regtype 
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('get_company_id_for_user', 'get_role_for_user');
```

Si estas funciones NO existen, debes crearlas. Busca en tu proyecto los archivos de migración SQL o créalas:

```sql
-- Función para obtener company_id del usuario
CREATE OR REPLACE FUNCTION public.get_company_id_for_user(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  company_id_val uuid;
BEGIN
  SELECT company_id INTO company_id_val
  FROM public.profiles
  WHERE id = user_id
  LIMIT 1;
  
  RETURN company_id_val;
END;
$$;

-- Función para obtener role del usuario
CREATE OR REPLACE FUNCTION public.get_role_for_user(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_val text;
BEGIN
  SELECT role INTO role_val
  FROM public.profiles
  WHERE id = user_id
  LIMIT 1;
  
  RETURN role_val;
END;
$$;
```

## 📝 Notas Importantes

1. **El archivo `SOLUCION_LOGIN_TIMEOUT.sql`** contiene todas estas consultas organizadas. Puedes ejecutarlo completo en Supabase Dashboard → SQL Editor.

2. **Si tu perfil no existe**, el login NO funcionará hasta que lo crees manualmente. La aplicación espera que cada usuario en `auth.users` tenga un registro correspondiente en `public.profiles`.

3. **Las políticas RLS lentas** pueden causar consultas de 10+ segundos. La solución es optimizarlas poniendo la condición más simple (`id = auth.uid()`) primero.

4. **Verifica tu conexión a internet**. Si Supabase está muy lento desde tu ubicación, considera usar un servicio de VPN o verificar el estado de Supabase.

## ✅ Después de aplicar la solución

1. Intenta iniciar sesión nuevamente
2. Revisa la consola del navegador para ver si hay nuevos errores
3. Si aún hay problemas, comparte los nuevos logs

## 🆘 Si nada funciona

Si después de seguir todos estos pasos el problema persiste:

1. Verifica el estado de Supabase: https://status.supabase.com
2. Prueba desde otra conexión de red (otro WiFi, datos móviles)
3. Verifica que no haya bloqueadores de anuncios o extensiones del navegador interfiriendo
4. Prueba en modo incógnito



