# 📁 Configuración de Storage para Evidencias Multimedia

## 📋 Diagnóstico de la Implementación Actual

### ✅ Lo que YA está implementado:

1. **Tabla de Base de Datos** (`media_reports`):
   - ✅ Tabla creada en la migración `0001_multi_tenant_schema.sql`
   - ✅ Índices configurados
   - ✅ Políticas RLS configuradas para acceso por compañía
   - ✅ Soporte para superadmin

2. **Código de la Aplicación**:
   - ✅ Componente de subida: `src/components/media/media-upload-dialog.tsx`
   - ✅ Componente de visualización: `src/components/media/media-reports-dialog.tsx`
   - ✅ Funciones en `data-context.tsx`:
     - `addMediaReport()` - Sube archivos a Supabase Storage
     - `getMediaReportsForDepartment()` - Obtiene evidencias de un departamento
   - ✅ Integración en componentes de tareas y departamentos

3. **Configuración**:
   - ✅ Bucket definido: `media-files` (en `src/lib/supabase.ts`)
   - ✅ Ruta de almacenamiento: `companies/{companyId}/departments/{departmentId}/media/{filename}`

### ❌ Lo que FALTA configurar:

1. **Bucket en Supabase Storage**:
   - ❌ El bucket `media-files` no existe todavía en tu proyecto Supabase
   - ❌ No hay políticas de Storage configuradas

---

## 🚀 Pasos para Configurar el Storage

### Opción 1: Configurar desde el Dashboard de Supabase (Recomendado)

#### Paso 1: Crear el Bucket

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"** o **"Create a new bucket"**
4. Configura el bucket:
   - **Name**: `media-files` (debe ser exactamente este nombre)
   - **Public bucket**: ✅ **SÍ** (marcar como público para permitir acceso a las URLs)
   - **File size limit**: `209715200` (200 MB en bytes) o el tamaño que prefieras
   - **Allowed MIME types**: (opcional) Dejar vacío o agregar: `image/*,video/*`

5. Haz clic en **"Create bucket"**

#### Paso 2: Configurar Políticas de Storage (RLS)

Los buckets en Supabase también usan RLS (Row Level Security). Necesitas crear políticas para permitir:

1. **Subir archivos** - Solo usuarios autenticados de la misma compañía
2. **Leer archivos** - Usuarios autenticados de la misma compañía
3. **Eliminar archivos** - Solo admins/owners de la compañía

Ve a **Storage** → **Policies** → Selecciona el bucket `media-files`

**Política 1: Permitir subir archivos**
```sql
CREATE POLICY "Allow authenticated users to upload media files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = 'companies' AND
  (storage.foldername(name))[2] = (
    SELECT company_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);
```

**Política 2: Permitir leer archivos**
```sql
CREATE POLICY "Allow authenticated users to read media files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = 'companies' AND
  (storage.foldername(name))[2] = (
    SELECT company_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);
```

**Política 3: Permitir eliminar archivos (solo admins)**
```sql
CREATE POLICY "Allow admins to delete media files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'admin')
    AND company_id::text = (storage.foldername(name))[2]
  )
);
```

**Política 4: Permitir lectura pública (para URLs públicas)**
```sql
CREATE POLICY "Allow public read access to media files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media-files');
```

---

### Opción 2: Crear Script SQL (Para ejecutar en SQL Editor)

He creado un script SQL completo que puedes ejecutar directamente en el SQL Editor de Supabase. Este script:
- Verifica si el bucket existe
- Crea el bucket si no existe (requiere service_role)
- Crea todas las políticas necesarias

**Archivo**: `CREAR_BUCKET_STORAGE.sql` (se creará a continuación)

---

## 🔍 Verificación

Después de configurar el bucket y las políticas:

1. **Verifica que el bucket existe**:
   - Ve a Storage en el dashboard
   - Debes ver el bucket `media-files`

2. **Verifica las políticas**:
   - Ve a Storage → Policies
   - Debes ver las 4 políticas creadas

3. **Prueba la funcionalidad**:
   - Inicia sesión en la aplicación
   - Ve a una tarea o departamento
   - Intenta subir una imagen/video
   - Verifica que se guarda correctamente
   - Verifica que puedes ver la evidencia

---

## 🐛 Solución de Problemas

### Error: "Bucket not found"
- **Solución**: El bucket `media-files` no existe. Sigue el Paso 1 de la Opción 1.

### Error: "new row violates row-level security policy"
- **Solución**: Las políticas de Storage no están configuradas. Sigue el Paso 2 de la Opción 1.

### Error: "Access Denied" al intentar ver una imagen
- **Solución**: Falta la política de lectura pública. Agrega la Política 4.

### Los archivos se suben pero no se ven
- **Solución**: Verifica que el bucket está marcado como **público** o que la política de lectura pública está activa.

---

## 📝 Notas Importantes

1. **Tamaño de archivos**: Actualmente el límite está en 200 MB. Puedes ajustarlo en la configuración del bucket o en `media-upload-dialog.tsx` (variable `MAX_FILE_SIZE_MB`).

2. **Estructura de carpetas**: Los archivos se organizan como:
   ```
   media-files/
   └── companies/
       └── {company-id}/
           └── departments/
               └── {department-id}/
                   └── media/
                       └── {timestamp}_{filename}
   ```

3. **Eliminación**: Cuando se elimina un departamento, los archivos NO se eliminan automáticamente del storage (por ahora). El código en `data-context.tsx` intenta eliminarlos pero puede fallar si las políticas no permiten DELETE.

4. **Backup**: Los archivos se almacenan en Supabase Storage. Considera hacer backups periódicos si es crítico.

---

## ✅ Checklist Final

- [ ] Bucket `media-files` creado en Supabase Storage
- [ ] Bucket marcado como **público**
- [ ] Política de INSERT configurada
- [ ] Política de SELECT configurada
- [ ] Política de DELETE configurada (opcional)
- [ ] Política de lectura pública configurada
- [ ] Prueba de subida de archivo exitosa
- [ ] Prueba de visualización de archivo exitosa

