# Crear Usuario Superadmin

Este documento explica cómo crear el usuario superadmin para acceder al panel de administración global.

## Pasos para Crear el Superadmin

### 1. Ejecutar la Migración SQL

Primero, ejecuta la migración que agrega el rol superadmin:

```sql
-- Ejecutar desde Supabase Dashboard → SQL Editor
-- Archivo: supabase/migrations/0005_add_superadmin.sql
```

### 2. Crear el Usuario

Tienes dos opciones para crear el usuario superadmin:

#### Opción A: Usando la API (Recomendado)

Hacer una petición POST a `/api/create-superadmin`:

```bash
curl -X POST https://tu-dominio.com/api/create-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cleansweep.com",
    "password": "Isabela04",
    "fullName": "Super Admin"
  }'
```

O desde el navegador usando la consola de desarrollador:

```javascript
fetch('/api/create-superadmin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@cleansweep.com',
    password: 'Isabela04',
    fullName: 'Super Admin'
  })
}).then(r => r.json()).then(console.log);
```

#### Opción B: Manualmente desde Supabase Dashboard

1. Ve a **Supabase Dashboard → Authentication → Users**
2. Haz clic en **"Add User"**
3. Ingresa:
   - Email: `admin@cleansweep.com`
   - Password: `Isabela04`
   - Auto Confirm User: ✓ (activado)
4. Haz clic en **"Create User"**
5. Copia el UUID del usuario creado
6. Ve a **SQL Editor** y ejecuta:

```sql
SELECT public.create_superadmin_profile(
  '23945475-23fa-43ca-a12c-2ab748c8dfd3'::uuid,
  'Super Admin',
  'admin@cleansweep.com'
);
```

**Nota**: Reemplaza `'23945475-23fa-43ca-a12c-2ab748c8dfd3'` con el UUID real del usuario que acabas de crear.

### 3. Verificar que se Creó Correctamente

Ejecuta en SQL Editor:

```sql
SELECT id, role, company_id, full_name, email 
FROM public.profiles 
WHERE email = 'admin@cleansweep.com';
```

Deberías ver:
- `role` = `superadmin`
- `company_id` = `NULL`

### 4. Iniciar Sesión

1. Ve a `/login`
2. Ingresa:
   - Email: `admin@cleansweep.com`
   - Password: `Isabela04`
3. Serás redirigido automáticamente a `/superadmin/dashboard`

## Funcionalidades del Superadmin

El panel de superadmin te permite:

- Ver todas las empresas registradas
- Ver estadísticas globales del sistema
- Ver todos los empleados de todas las empresas
- Ver todas las tareas del sistema
- Ver gráficos en tiempo real de:
  - Empleados por empresa
  - Tareas por estado y empresa
  - Crecimiento de empresas
  - Distribución de tareas

## Seguridad

⚠️ **IMPORTANTE**: El endpoint `/api/create-superadmin` no está protegido por defecto. En producción, deberías:

1. Proteger este endpoint con autenticación adicional
2. O crear el superadmin manualmente desde el servidor
3. O restringir el acceso por IP

Para proteger el endpoint, puedes agregar verificación de una clave secreta:

```typescript
// En src/app/api/create-superadmin/route.ts
const secretKey = request.headers.get('x-superadmin-secret');
if (secretKey !== process.env.SUPERADMIN_CREATION_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
