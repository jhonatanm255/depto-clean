# 🎯 Guía Rápida: Crear Bucket de Storage para Evidencias

## 📌 Resumen Ejecutivo

Tu aplicación ya tiene TODO el código implementado para subir y ver evidencias multimedia. Solo falta crear el **bucket** en Supabase Storage y configurar las políticas.

---

## ⚡ Pasos Rápidos (5 minutos)

### 1️⃣ Crear el Bucket desde el Dashboard

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **Storage**
4. Haz clic en **"New bucket"** o **"Create bucket"**
5. Configura:
   - **Name**: `media-files` ⚠️ **Debe ser exactamente este nombre**
   - **Public bucket**: ✅ **SÍ** (marca esta casilla)
   - **File size limit**: `209715200` (200 MB) o el que prefieras
6. Haz clic en **"Create bucket"**

### 2️⃣ Crear las Políticas de Storage

1. En el mismo Dashboard, ve a **Storage** → **Policies**
2. O mejor aún, ve al **SQL Editor**
3. Copia y pega el contenido del archivo `CREAR_BUCKET_STORAGE.sql`
4. Haz clic en **"Run"** o presiona `Ctrl + Enter`

¡Listo! 🎉

---

## 🔍 Verificación Rápida

Después de completar los pasos:

1. **Verifica el bucket**:
   - Storage → Debe aparecer `media-files`

2. **Verifica las políticas**:
   - Storage → Policies → Debe haber 4 políticas relacionadas con `media`

3. **Prueba en la app**:
   - Inicia sesión
   - Ve a una tarea
   - Haz clic en "Subir Evidencia"
   - Sube una imagen
   - Verifica que se guarda y se puede ver

---

## ❌ Si algo falla

### Error: "Bucket not found"
👉 **Solución**: No creaste el bucket. Vuelve al paso 1.

### Error: "Access denied" o "new row violates row-level security policy"
👉 **Solución**: No ejecutaste el script SQL de políticas. Vuelve al paso 2.

### Los archivos se suben pero no se ven
👉 **Solución**: El bucket no está marcado como público. Edítalo y marca la casilla "Public bucket".

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `CONFIGURAR_STORAGE_EVIDENCIAS.md` - Guía completa con diagnóstico
- `CREAR_BUCKET_STORAGE.sql` - Script SQL con las políticas

---

## ✅ Checklist

- [ ] Bucket `media-files` creado
- [ ] Bucket marcado como público
- [ ] Script SQL de políticas ejecutado
- [ ] Prueba de subida exitosa
- [ ] Prueba de visualización exitosa

