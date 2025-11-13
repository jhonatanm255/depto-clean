# Diagnóstico: Departamentos No Se Guardan

## Problema
Los departamentos creados desaparecen después de cerrar sesión y volver a iniciar sesión.

## Pasos para Diagnosticar

### 1. Verificar en la Consola del Navegador

Abre la consola del navegador (F12) y busca estos mensajes cuando creas un departamento:

#### ✅ Mensajes de Éxito Esperados:
```
[DataContext] 📝 Agregando departamento: { name: "...", companyId: "...", userId: "..." }
[DataContext] ✓ Sesión activa verificada: { userId: "...", email: "..." }
[DataContext] ✓ Perfil verificado: { userId: "...", companyId: "...", role: "..." }
[DataContext] 🔄 Insertando en Supabase: { company_id: "...", name: "...", ... }
[DataContext] ✅ Departamento insertado exitosamente: { id: "...", name: "...", company_id: "..." }
[DataContext] ✅ Departamento verificado correctamente: { id: "...", name: "...", company_id: "..." }
[DataContext] ✅ El departamento recién creado SÍ aparece en la lista
[DataContext] 📊 Estado actualizado. Total de departamentos: X
```

#### ❌ Mensajes de Error a Buscar:
- `❌ Error al insertar departamento:` - Indica un error de Supabase
- `❌ ERROR CRÍTICO: company_id no coincide!` - Indica un problema de seguridad
- `❌ El departamento recién creado NO aparece en la lista!` - Indica un problema con RLS
- `❌ Error al verificar el departamento:` - Indica un problema con las políticas RLS

### 2. Verificar Directamente en Supabase

#### Paso 1: Acceder a Supabase Dashboard
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "Table Editor" en el menú lateral

#### Paso 2: Verificar la Tabla `departments`
1. Abre la tabla `departments`
2. Verifica si hay registros con el `company_id` de tu empresa
3. Compara el `company_id` de los departamentos con el `company_id` de tu perfil

#### Paso 3: Verificar tu Perfil
1. Abre la tabla `profiles`
2. Busca tu usuario por email o ID
3. Verifica que tengas un `company_id` válido
4. Anota el `company_id` de tu perfil

#### Paso 4: Verificar la Tabla `companies`
1. Abre la tabla `companies`
2. Verifica que existe una empresa con el `company_id` de tu perfil
3. Anota el `id` de tu empresa

### 3. Verificar las Políticas RLS

#### En Supabase SQL Editor:
```sql
-- Verificar que tienes un perfil válido
SELECT id, email, company_id, role 
FROM public.profiles 
WHERE id = auth.uid();

-- Verificar que puedes ver tus departamentos
SELECT id, name, company_id 
FROM public.departments 
WHERE company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE id = auth.uid()
);

-- Verificar la función get_company_id_for_user
SELECT public.get_company_id_for_user(auth.uid());
```

### 4. Crear un Departamento Manualmente (Prueba)

En Supabase SQL Editor, ejecuta:

```sql
-- Primero, obtén tu company_id
SELECT company_id FROM public.profiles WHERE id = auth.uid();

-- Luego, inserta un departamento de prueba (reemplaza 'TU_COMPANY_ID' con el ID real)
INSERT INTO public.departments (company_id, name, access_code)
VALUES (
  'TU_COMPANY_ID',  -- Reemplaza con tu company_id real
  'Departamento de Prueba',
  'TEST123'
)
RETURNING *;
```

Si esto funciona, el problema está en el código de la aplicación.
Si esto falla, el problema está en las políticas RLS.

### 5. Verificar las Políticas RLS

En Supabase SQL Editor, ejecuta:

```sql
-- Ver todas las políticas de la tabla departments
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
WHERE tablename = 'departments';
```

### 6. Probar la Inserción con el Cliente de Supabase

En la consola del navegador, ejecuta:

```javascript
// Obtener el cliente de Supabase
const { supabase } = await import('/src/lib/supabase');

// Verificar la sesión
const { data: session } = await supabase.auth.getSession();
console.log('Sesión:', session);

// Verificar el perfil
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.session.user.id)
  .single();
console.log('Perfil:', profile, 'Error:', profileError);

// Intentar insertar un departamento de prueba
const { data: dept, error: deptError } = await supabase
  .from('departments')
  .insert({
    company_id: profile.company_id,
    name: 'Prueba desde consola',
    access_code: 'TEST123'
  })
  .select()
  .single();
console.log('Departamento:', dept, 'Error:', deptError);

// Verificar que se puede leer
const { data: allDepts, error: readError } = await supabase
  .from('departments')
  .select('*')
  .eq('company_id', profile.company_id);
console.log('Todos los departamentos:', allDepts, 'Error:', readError);
```

## Posibles Causas y Soluciones

### Causa 1: Políticas RLS Bloqueando la Inserción
**Síntoma:** Error al insertar, código de error relacionado con RLS
**Solución:** Verificar que la función `get_company_id_for_user` funciona correctamente

### Causa 2: company_id Incorrecto
**Síntoma:** Los departamentos se crean con un `company_id` diferente
**Solución:** Verificar que `currentUser.companyId` es correcto

### Causa 3: Datos No Se Persisten
**Síntoma:** Los departamentos aparecen en el estado local pero no en la base de datos
**Solución:** Verificar que el insert realmente se ejecuta y no hay errores silenciosos

### Causa 4: Problema de Caché
**Síntoma:** Los departamentos están en la base de datos pero no se cargan
**Solución:** Verificar que `loadData` se ejecuta correctamente después del login

## Información para Reportar el Problema

Si el problema persiste, proporciona esta información:

1. **Logs de la consola** cuando creas un departamento
2. **Logs de la consola** cuando inicias sesión
3. **Resultado de las consultas SQL** en Supabase
4. **Screenshots** de la tabla `departments` en Supabase
5. **Screenshots** de tu perfil en la tabla `profiles`
6. **Mensajes de error** específicos (código, mensaje, detalles)

## Comandos Útiles en Supabase SQL Editor

```sql
-- Ver todos los departamentos de una empresa
SELECT * FROM public.departments WHERE company_id = 'TU_COMPANY_ID';

-- Ver todos los perfiles de una empresa
SELECT * FROM public.profiles WHERE company_id = 'TU_COMPANY_ID';

-- Ver todas las empresas
SELECT * FROM public.companies;

-- Ver las políticas RLS de departments
SELECT * FROM pg_policies WHERE tablename = 'departments';

-- Verificar la función get_company_id_for_user
SELECT public.get_company_id_for_user('TU_USER_ID');
```

