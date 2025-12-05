# 🔔 Sistema de Notificaciones en Tiempo Real

## 📋 Resumen

Se ha implementado un sistema completo de notificaciones en tiempo real que incluye:

- ✅ **Notificaciones en la aplicación** (toast + lista)
- ✅ **Push Notifications** (PWA)
- ✅ **Notificaciones automáticas** mediante triggers en la base de datos
- ✅ **Tiempo real** usando Supabase Realtime

## 🎯 Eventos que Generan Notificaciones

1. **Tarea Asignada**: Cuando un admin asigna un departamento a una empleada
2. **Tarea Reasignada**: Cuando un admin reasigna un departamento a otra empleada
3. **Cambio de Estado**: Cuando una empleada cambia el estado de una tarea (pending → in_progress → completed)
4. **Evidencia Subida**: Cuando se sube una foto/video como evidencia
5. **Tarea Completada**: Los admins reciben notificación cuando una tarea se completa

## 🚀 Pasos de Instalación

### Paso 1: Ejecutar la Migración SQL

Ejecuta la migración que crea la tabla de notificaciones y los triggers:

```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: supabase/migrations/0006_add_notifications_system.sql
```

Esta migración:
- Crea la tabla `notifications`
- Crea los tipos de notificación
- Crea triggers automáticos para generar notificaciones
- Configura políticas RLS

### Paso 2: ⚠️ Realtime (Opcional - Requiere Plan de Pago)

> **Nota**: El sistema funciona **perfectamente sin Realtime** usando polling periódico. Realtime solo es necesario si quieres actualizaciones instantáneas (< 1 segundo). Con polling, las notificaciones se actualizan cada 5 segundos, lo cual es suficiente para la mayoría de casos.

Si tienes un plan de pago y quieres habilitar Realtime:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Database** → **Replication**
3. Habilita la replicación para la tabla `notifications`:
   - Busca `public.notifications`
   - Haz clic en el toggle para habilitar Realtime

**O usando SQL:**
```sql
-- Habilitar Realtime para la tabla notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

**Si no tienes plan de pago**: No necesitas hacer nada, el sistema funcionará con polling automático cada 5 segundos.

### Paso 3: Verificar que Todo Funciona

1. **Reinicia tu servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Inicia sesión en la aplicación**

3. **Solicita permisos de notificaciones**:
   - Verás un botón "Activar Push" en el menú de notificaciones
   - Haz clic para habilitar las notificaciones push

4. **Prueba las notificaciones**:
   - Asigna una tarea a una empleada
   - La empleada debería recibir una notificación inmediatamente
   - Si la página está en segundo plano, recibirá una notificación push

## 📱 Características del Sistema

### Notificaciones en la Aplicación

- **Campana de notificaciones** en el header
- **Contador de no leídas** con badge rojo
- **Lista desplegable** con todas las notificaciones
- **Marcar como leída** individual o todas
- **Navegación** a la página relevante al hacer clic

### Push Notifications

- **Notificaciones push** cuando la página está en segundo plano
- **Solo se muestran** si la página no está visible
- **Al hacer clic** navegan a la página relevante
- **Cierre automático** después de 5 segundos

### Actualización Automática

- **Actualización cada 5 segundos** usando polling (funciona sin plan de pago)
- **O instantánea con Realtime** si tienes plan de pago (opcional)
- **Sin necesidad de refrescar** la página
- **Sincronización** entre múltiples pestañas/dispositivos

## 🎨 Componentes Creados

### 1. `NotificationsProvider`
- Contexto que maneja el estado de las notificaciones
- Suscripción a Realtime
- Gestión de Push Notifications

### 2. `NotificationsBell`
- Componente de UI para mostrar la campana
- Badge con contador de no leídas
- Popover con lista de notificaciones

### 3. Migración SQL
- Tabla `notifications`
- Triggers automáticos
- Funciones helper

## 🔧 Configuración Avanzada

### Personalizar Notificaciones

Puedes personalizar los mensajes de las notificaciones editando los triggers en la migración SQL:

```sql
-- Ejemplo: Cambiar el mensaje de asignación
message := format('Has sido asignada a limpiar %s', dept_name);
```

### Agregar Nuevos Tipos de Notificación

1. Agrega el tipo al enum en la migración:
```sql
alter type notification_type add value 'nuevo_tipo';
```

2. Crea un trigger o función que genere la notificación
3. Agrega el tipo en `src/lib/types.ts`

### Desactivar Notificaciones Push

Las notificaciones push solo se muestran si:
- El permiso está otorgado
- La página no está visible/enfoque

Para desactivarlas completamente, puedes comentar la llamada a `showPushNotification()` en el contexto.

## 🐛 Solución de Problemas

### Las notificaciones no aparecen

1. **Verifica que la migración se ejecutó**:
   ```sql
   SELECT * FROM public.notifications LIMIT 1;
   ```

2. **Verifica los triggers**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
   ```

3. **Espera hasta 5 segundos**: Las notificaciones se actualizan automáticamente cada 5 segundos con polling (no requiere Realtime)

4. **Verifica en la consola**: Debe aparecer `[Notifications]` en los logs del navegador

### Las notificaciones push no funcionan

1. **Verifica el permiso**:
   - El navegador debe tener permiso para notificaciones
   - Haz clic en "Activar Push" en el menú de notificaciones

2. **Verifica que la PWA está instalada**:
   - Las notificaciones push funcionan mejor en PWA instalada

3. **Verifica la consola del navegador**:
   - Busca errores relacionados con notificaciones

### Las notificaciones no se crean automáticamente

1. **Verifica los triggers**:
   ```sql
   SELECT tgname, tgenabled FROM pg_trigger 
   WHERE tgname LIKE '%notify%';
   ```

2. **Prueba manualmente**:
   - Asigna una tarea y verifica si se crea la notificación
   - Revisa los logs de Supabase

## 📊 Estructura de Datos

### Tabla `notifications`

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  company_id uuid REFERENCES companies(id),
  type notification_type,
  title text,
  message text,
  related_task_id uuid REFERENCES tasks(id),
  related_department_id uuid REFERENCES departments(id),
  related_media_report_id uuid REFERENCES media_reports(id),
  read boolean DEFAULT false,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

## ✅ Checklist de Implementación

- [ ] Migración SQL ejecutada
- [ ] **NO es necesario habilitar Realtime** (el sistema funciona con polling cada 5 segundos)
- [ ] Aplicación reiniciada
- [ ] Permisos de notificaciones solicitados
- [ ] Notificación de prueba recibida
- [ ] Push notifications funcionando
- [ ] Triggers creando notificaciones automáticamente

> **Nota importante**: El sistema funciona perfectamente **sin Realtime** usando polling automático cada 5 segundos. No necesitas plan de pago. Las notificaciones se actualizarán automáticamente sin necesidad de refrescar la página.

## 🎉 ¡Listo!

Tu sistema de notificaciones está completamente configurado. Los usuarios recibirán notificaciones automáticamente cuando:

- Se les asigne una tarea
- Se reasigne una tarea
- Cambien el estado de una tarea
- Se suban evidencias
- Se completen tareas

¡Disfruta de las notificaciones en tiempo real! 🚀

