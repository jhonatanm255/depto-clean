# Configuración de Variables de Entorno

## Para Desarrollo Local

1. Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# URL de tu proyecto de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dapsjjxublpmpkxupkfp.supabase.co

# Clave anónima de Supabase (pública, segura para el cliente)
# La encuentras en: Supabase Dashboard → Settings → API → anon/public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui

# Clave de servicio de Supabase (PRIVADA, solo para el servidor)
# La encuentras en: Supabase Dashboard → Settings → API → service_role key
# ⚠️ NUNCA expongas esta clave en el cliente
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

2. Reemplaza los valores `tu_clave_anon_aqui` y `tu_service_role_key_aqui` con tus claves reales de Supabase.

3. Reinicia el servidor de desarrollo:
```bash
npm run dev
```

## Dónde Encontrar las Claves en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Encontrarás:
   - **Project URL**: Esta es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Esta es tu `SUPABASE_SERVICE_ROLE_KEY` (⚠️ MANTÉN ESTA SECRETA)

## Verificar que Está Funcionando

Después de configurar las variables, verifica en la consola del navegador que no aparezcan errores como:
- "Faltan variables de entorno"
- "NEXT_PUBLIC_SUPABASE_URL no está definido"
- "OCTYPE htm" o errores de JSON inválido

Si ves estos errores, verifica que:
1. El archivo `.env.local` existe en la raíz del proyecto
2. Las variables tienen los nombres correctos (sin espacios, con mayúsculas)
3. Has reiniciado el servidor después de crear/modificar `.env.local`

