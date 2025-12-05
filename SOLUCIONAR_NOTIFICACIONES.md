# 🔧 Solucionar Problemas con Notificaciones

## 🔍 Diagnóstico Rápido

### Paso 1: Verificar que las notificaciones se están creando

Ejecuta este SQL en Supabase para verificar si se crean notificaciones cuando asignas una tarea:

```sql
-- Ver últimas notificaciones creadas
SELECT * FROM public.notifications 
ORDER BY created_at DESC 
LIMIT 10;
```

**Si NO hay notificaciones:**
- Los triggers no se están ejecutando
- Necesitas ejecutar el script `CORREGIR_TRIGGERS_NOTIFICACIONES.sql`
- O verificar que los triggers existen

**Si SÍ hay notificaciones pero no aparecen en la app:**
- El problema es en el frontend (carga o polling)
- Sigue al Paso 2

### Paso 2: Verificar en la Consola del Navegador

Abre las herramientas de desarrollador (F12) y revisa:

1. **Console Tab**: Busca mensajes que empiecen con `[Notifications]`
   - Debe aparecer: `[Notifications] Cargando notificaciones...`
   - Si hay errores, cópialos aquí

2. **Network Tab**: Verifica las peticiones a Supabase
   - Debe haber peticiones a `/rest/v1/notifications`
   - Si hay errores 400 o 403, hay un problema de permisos

### Paso 3: Verificar Permisos RLS

Ejecuta este SQL para verificar las políticas:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';
```

Debes ver al menos una política que permita SELECT para el usuario actual.

### Paso 4: Verificar que el Componente está Renderizado

1. Abre la aplicación
2. Busca la campana de notificaciones en el header (arriba a la derecha)
3. Si no la ves, verifica que `NotificationsBell` esté importado en `header-main.tsx`

## 🛠️ Soluciones Comunes

### Problema 1: Las notificaciones no se crean

**Solución**: Ejecuta el script de corrección:
```sql
-- Ejecuta: CORREGIR_TRIGGERS_NOTIFICACIONES.sql
```

### Problema 2: Las notificaciones se crean pero no aparecen

**Causa posible**: El polling no está funcionando o hay error al cargar

**Solución**:
1. Verifica la consola del navegador para errores
2. Verifica que el usuario tenga acceso (RLS)
3. Espera 5 segundos (el polling verifica cada 5 segundos)

### Problema 3: Error "permission denied" al cargar notificaciones

**Solución**: Verifica las políticas RLS ejecutando:

```sql
-- Ver políticas actuales
SELECT * FROM pg_policies WHERE tablename = 'notifications';

-- Si no hay políticas, crearlas (debe estar en la migración)
-- O ejecutar la migración nuevamente
```

### Problema 4: La campana no aparece

**Solución**: Verifica que:
1. `NotificationsProvider` está en el layout ✅
2. `NotificationsBell` está en `header-main.tsx` ✅
3. No hay errores de importación

## 🔍 Verificación Paso a Paso

### 1. Verificar que las notificaciones se crearon en la BD

Ejecuta después de asignar una tarea:

```sql
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.created_at,
  p.email as usuario,
  p.full_name as nombre_usuario
FROM public.notifications n
JOIN public.profiles p ON p.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 5;
```

### 2. Verificar que el usuario puede leer sus notificaciones

Ejecuta como el usuario que debería recibir la notificación:

```sql
-- Reemplaza 'TU_USER_ID_AQUI' con el ID del usuario
SELECT * FROM public.notifications 
WHERE user_id = 'TU_USER_ID_AQUI'
ORDER BY created_at DESC;
```

### 3. Verificar triggers activos

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname LIKE '%notify%';
```

Todos los triggers deben mostrar `O` (enabled).

## 💡 Prueba Manual

1. **Asigna una tarea** a una empleada
2. **Espera 5 segundos** (el polling verifica cada 5 seg)
3. **Haz clic en la campana** de notificaciones en el header
4. **Deberías ver** la notificación "Nueva Tarea Asignada"

Si después de 5 segundos no aparece:
- Abre la consola del navegador (F12)
- Busca errores relacionados con `[Notifications]`
- Verifica que la petición a Supabase se esté haciendo

## 📞 Información para Debugging

Si sigues teniendo problemas, necesito:

1. **Salida del script de diagnóstico**: Ejecuta `DIAGNOSTICAR_NOTIFICACIONES.sql`
2. **Errores de la consola**: Copia todos los errores que empiecen con `[Notifications]`
3. **Respuesta de la API**: En Network tab, busca la petición a `/notifications` y comparte la respuesta






