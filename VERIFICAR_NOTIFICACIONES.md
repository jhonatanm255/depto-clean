# 🔍 Verificar que las Notificaciones Funcionen

## Pasos para Diagnosticar

### 1. Verificar que las notificaciones se crean en la BD

Ejecuta este SQL **después de asignar una tarea**:

```sql
-- Ver últimas notificaciones creadas
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.created_at,
  p.email as usuario_notificado,
  p.full_name as nombre_usuario
FROM public.notifications n
LEFT JOIN public.profiles p ON p.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 10;
```

**¿Qué deberías ver?**
- Si hay notificaciones: ✅ Los triggers están funcionando
- Si NO hay notificaciones: ❌ Los triggers no se están ejecutando

### 2. Verificar en la Consola del Navegador

Abre las **Herramientas de Desarrollador** (F12) y revisa:

1. **Console Tab**:
   - Busca mensajes que empiecen con `[Notifications]`
   - Debe aparecer: `[Notifications] 🔔 Iniciando sistema...`
   - Debe aparecer: `[Notifications] 📥 Cargadas X notificaciones...`
   - Debe aparecer: `[Notifications] 🔄 Polling iniciado...`

2. **Network Tab**:
   - Filtra por `notifications`
   - Debe haber peticiones a `/rest/v1/notifications`
   - Si hay errores 400/403, comparte la respuesta

### 3. Verificar que la Campana Aparece

- Busca el icono de **campana** (🔔) en el header (arriba a la derecha)
- Si no lo ves, puede ser un problema de renderizado

### 4. Verificar Permisos RLS

Ejecuta este SQL para verificar que puedes leer tus notificaciones:

```sql
-- Ver tus propias notificaciones (como el usuario actual)
SELECT * FROM public.notifications 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

Si esto devuelve error o está vacío, hay un problema con las políticas RLS.

## Problemas Comunes y Soluciones

### ❌ Las notificaciones NO se crean en la BD

**Causa**: Los triggers no están funcionando

**Solución**:
1. Ejecuta `CORREGIR_TRIGGERS_NOTIFICACIONES.sql`
2. Verifica que los triggers existen:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname LIKE '%notify%';
   ```

### ❌ Las notificaciones SÍ se crean pero NO aparecen en la app

**Causa**: Problema con la carga o polling

**Solución**:
1. Abre la consola (F12)
2. Busca errores que empiecen con `[Notifications]`
3. Verifica que la petición a `/notifications` se está haciendo
4. Espera 5 segundos (el polling verifica cada 5 seg)

### ❌ Error "permission denied"

**Causa**: Problema con políticas RLS

**Solución**:
1. Verifica las políticas:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```
2. Debe haber una política que permita SELECT para tu usuario

### ❌ La campana no aparece

**Causa**: El componente no está renderizado

**Solución**:
1. Verifica que `NotificationsBell` está en `header-main.tsx`
2. Verifica que `NotificationsProvider` está en el layout
3. Recarga la página

## Prueba Completa

1. **Abre la aplicación en dos navegadores diferentes**:
   - Navegador 1: Como admin
   - Navegador 2: Como empleada

2. **En el navegador del admin**:
   - Asigna una tarea a la empleada

3. **En el navegador de la empleada**:
   - Espera 5-10 segundos
   - Haz clic en la campana
   - Deberías ver la notificación "Nueva Tarea Asignada"

## Debugging Avanzado

Si sigues teniendo problemas, ejecuta este script completo de diagnóstico:

```sql
-- Ejecuta: DIAGNOSTICAR_NOTIFICACIONES.sql
```

Y comparte:
1. Los resultados del diagnóstico
2. Los errores de la consola del navegador
3. La respuesta de las peticiones en Network tab






