# Guía de Despliegue en Vercel

## Variables de Entorno Requeridas

Debes configurar las siguientes variables de entorno en Vercel antes de desplegar:

### Variables Públicas (NEXT_PUBLIC_*)

Estas variables son accesibles desde el cliente y deben estar configuradas:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Valor: `https://dapsjjxublpmpkxupkfp.supabase.co`
   - Descripción: URL de tu proyecto de Supabase

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Valor: Tu clave anónima de Supabase
   - Descripción: Clave pública para autenticación desde el cliente

### Variables Privadas (Solo Servidor)

Estas variables solo están disponibles en el servidor y son sensibles:

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Valor: Tu clave de servicio de Supabase (service_role)
   - Descripción: Clave privada para operaciones administrativas (crear usuarios, etc.)
   - ⚠️ **IMPORTANTE**: Esta clave nunca debe exponerse al cliente

## Cómo Configurar Variables en Vercel

### Método 1: Desde el Dashboard de Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **Settings** → **Environment Variables**
3. Agrega cada variable:
   - **Name**: El nombre de la variable (ej: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: El valor de la variable
   - **Environment**: Selecciona `Production`, `Preview`, y `Development` según necesites
4. Haz clic en **Save**
5. **Re-despliega** tu aplicación para que los cambios surtan efecto

### Método 2: Desde la CLI de Vercel

```bash
# Configurar variables de entorno
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Para producción específicamente
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

## Verificar Configuración en Supabase

Antes de desplegar, asegúrate de que:

1. ✅ Las migraciones de la base de datos estén aplicadas:
   - `supabase/migrations/0001_multi_tenant_schema.sql`
   - `supabase/migrations/0002_add_display_name_to_companies.sql`

2. ✅ La función RPC esté creada:
   - `supabase/functions/register-company-owner.sql`

3. ✅ Las políticas RLS estén activas y funcionando

## Verificar el Despliegue

Después de configurar las variables:

1. Haz un nuevo despliegue:
   ```bash
   vercel --prod
   ```

2. Verifica que la aplicación cargue correctamente

3. Prueba el registro de una nueva empresa:
   - Ve a `/register`
   - Completa el formulario
   - Verifica que se cree la empresa y el usuario

## Solución de Problemas

### Error: "Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY"

**Causa**: Las variables de entorno no están configuradas en Vercel.

**Solución**: 
1. Verifica que las variables estén configuradas en el dashboard de Vercel
2. Asegúrate de que estén disponibles para el entorno correcto (Production/Preview/Development)
3. Re-despliega la aplicación después de agregar las variables

### Error: "SUPABASE_SERVICE_ROLE_KEY no está definido"

**Causa**: La variable de servicio no está configurada en Vercel.

**Solución**:
1. Agrega `SUPABASE_SERVICE_ROLE_KEY` en Vercel (Settings → Environment Variables)
2. ⚠️ **IMPORTANTE**: No uses `NEXT_PUBLIC_` como prefijo para esta variable, ya que debe ser privada
3. Re-despliega la aplicación

### Error: "relation does not exist" o "function does not exist"

**Causa**: Las migraciones de la base de datos no se han aplicado en Supabase.

**Solución**:
1. Ve al SQL Editor en tu proyecto de Supabase
2. Ejecuta las migraciones en orden:
   - Primero: `0001_multi_tenant_schema.sql`
   - Segundo: `0002_add_display_name_to_companies.sql`
3. Ejecuta la función: `register-company-owner.sql`

### Error: "invalid login credentials" o problemas de autenticación

**Causa**: Posible problema con las políticas RLS o con la configuración de autenticación.

**Solución**:
1. Verifica que las políticas RLS estén correctamente configuradas
2. Verifica que el usuario tenga un perfil en la tabla `profiles`
3. Revisa los logs de Supabase para ver errores específicos

## Checklist de Despliegue

Antes de desplegar a producción, verifica:

- [ ] Variables de entorno configuradas en Vercel
- [ ] Migraciones de base de datos aplicadas en Supabase
- [ ] Función RPC `register_company_owner` creada
- [ ] Políticas RLS activas y probadas
- [ ] Build local funciona sin errores (`npm run build`)
- [ ] Pruebas locales funcionan correctamente
- [ ] Variables sensibles (service_role_key) no están expuestas al cliente

## Recursos Adicionales

- [Documentación de Vercel sobre Variables de Entorno](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentación de Supabase sobre RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentación de Next.js sobre Variables de Entorno](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

