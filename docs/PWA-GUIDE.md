# 📱 Guía de PWA - CleanSweep Manager

## ¿Qué es una PWA?

Una **Progressive Web App (PWA)** es una aplicación web que se comporta como una aplicación nativa móvil. Los usuarios pueden instalarla en sus dispositivos y usarla como cualquier otra app, incluso con funcionalidades offline limitadas.

## ✨ Características Implementadas

### ✅ Instalable
- Los usuarios pueden instalar la app en Android, iOS, Windows, Mac
- Aparece como app independiente con su propio icono
- Se abre en pantalla completa sin la barra del navegador

### ✅ Caché Inteligente
- **Imágenes estáticas**: Se guardan por 30 días
- **Recursos (CSS/JS)**: Se actualizan en segundo plano
- **Google Fonts**: Se guardan por 1 año
- **Firebase Storage**: Se guarda por 30 días
- **API de Supabase**: Caché de 5 minutos con prioridad a red

### ✅ Optimizada para Móviles
- Barra de navegación inferior en dispositivos móviles
- Sidebar colapsable en escritorio
- Diseño responsive en todos los tamaños

### ✅ Iconos Optimizados
- Iconos de diferentes tamaños para todos los dispositivos
- Iconos "maskable" para Android (con el tema de la app)
- Splash screens para iOS

---

## 📲 Cómo Instalar la PWA

### **En Android (Chrome/Edge/Samsung Internet)**

1. Abre la aplicación en tu navegador
2. Toca el menú (⋮) en la esquina superior derecha
3. Selecciona **"Agregar a pantalla de inicio"** o **"Instalar app"**
4. Confirma la instalación
5. La app aparecerá en tu pantalla de inicio

**Alternativa:** Busca el banner de instalación que aparece automáticamente al usar la app.

### **En iOS (Safari)**

1. Abre la aplicación en Safari
2. Toca el botón de **Compartir** (cuadrado con flecha hacia arriba)
3. Desplázate y selecciona **"Agregar a pantalla de inicio"**
4. Personaliza el nombre (opcional)
5. Toca **"Agregar"**
6. La app aparecerá en tu pantalla de inicio

### **En Windows (Edge/Chrome)**

1. Abre la aplicación en tu navegador
2. Haz clic en el icono de instalación (⊕) en la barra de direcciones
3. O ve al menú (⋮) → **"Aplicaciones"** → **"Instalar CleanSweep Manager"**
4. Confirma la instalación
5. La app se abrirá en su propia ventana

### **En macOS (Chrome/Edge/Safari)**

Similar al proceso de Windows, busca la opción de instalación en el menú del navegador.

---

## 🔧 Configuración Técnica

### **Archivos Principales**

```
📦 public/
├── 📄 manifest.json          # Configuración de la PWA
├── 📄 browserconfig.xml      # Configuración para Microsoft
├── 📄 robots.txt             # SEO y crawlers
├── 📁 icons/                 # Iconos de diferentes tamaños
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── icon-192x192-maskable.png
│   └── icon-512x512-maskable.png
├── 📁 splash/                # Splash screens para iOS
│   ├── iphone-14-pro-max-portrait.png
│   ├── iphone-14-pro-portrait.png
│   ├── iphone-13-portrait.png
│   └── iphone-x-portrait.png
└── 📄 sw.js (auto-generado)  # Service Worker
```

### **Service Worker**

El Service Worker se genera automáticamente con `next-pwa` durante el build:

```bash
npm run build
```

Esto creará:
- `/public/sw.js` - El service worker principal
- `/public/workbox-*.js` - Librerías de Workbox para caché

**Nota:** Estos archivos están en `.gitignore` porque se regeneran en cada build.

---

## 🎨 Regenerar Iconos

Si actualizas el logo (`/public/logo.png`), regenera los iconos:

```bash
node scripts/generate-icons-simple.js
```

Este script creará automáticamente:
- 8 tamaños de iconos regulares
- 2 iconos maskable (Android)
- 4 splash screens (iOS)

---

## 🧪 Probar la PWA

### **En Desarrollo**

Por defecto, la PWA está **deshabilitada en desarrollo** para facilitar el debugging. Si quieres probarla:

1. Abre `next.config.ts`
2. Cambia `disable: process.env.NODE_ENV === 'development'` a `disable: false`
3. Reinicia el servidor

### **En Producción**

```bash
npm run build
npm start
```

Luego abre la app en tu navegador y usa las herramientas de desarrollo:

**Chrome DevTools:**
1. Abre DevTools (F12)
2. Ve a la pestaña **"Application"**
3. En el sidebar izquierdo verás:
   - **Manifest** - Verifica la configuración
   - **Service Workers** - Verifica que esté registrado
   - **Cache Storage** - Verifica qué se está guardando

**Lighthouse:**
1. En DevTools, ve a la pestaña **"Lighthouse"**
2. Selecciona "Progressive Web App"
3. Haz clic en "Generate report"
4. Debe obtener una puntuación alta (>90)

---

## 🚀 Despliegue

### **Vercel (Recomendado)**

Vercel soporta PWA automáticamente. Solo haz deploy normal:

```bash
vercel --prod
```

### **Firebase Hosting**

Ya tienes `apphosting.yaml` configurado. La PWA funcionará automáticamente.

### **Otros Providers**

Asegúrate de que:
1. El hosting soporte HTTPS (requerido para PWA)
2. Los archivos en `/public` se sirvan correctamente
3. El `sw.js` sea accesible desde la raíz

---

## 📊 Estrategias de Caché

### **CacheFirst** (Caché primero)
Usado para: Fuentes, imágenes, Firebase Storage

**Comportamiento:**
1. Busca en caché primero
2. Si no existe, descarga de la red
3. Guarda en caché para próximas veces

**Ideal para:** Recursos que no cambian frecuentemente

### **StaleWhileRevalidate** (Obsoleto mientras revalida)
Usado para: CSS, JavaScript

**Comportamiento:**
1. Responde con la versión en caché inmediatamente
2. Descarga la nueva versión en segundo plano
3. La próxima vez usa la versión actualizada

**Ideal para:** Balance entre velocidad y actualización

### **NetworkFirst** (Red primero)
Usado para: API de Supabase

**Comportamiento:**
1. Intenta cargar desde la red (timeout 10s)
2. Si falla, usa la versión en caché
3. Guarda la nueva respuesta en caché

**Ideal para:** Datos que deben estar actualizados pero necesitan fallback offline

---

## 🔐 Consideraciones de Seguridad

### HTTPS Obligatorio
Las PWA **requieren HTTPS** en producción (excepto localhost).

### Permisos
Si agregas funcionalidades como:
- Notificaciones push
- Geolocalización
- Cámara/Micrófono

Los usuarios deberán dar permisos explícitamente.

---

## 📱 Funcionalidades Futuras (Opcionales)

### **Notificaciones Push**

Para notificar a las empleadas de nuevas tareas:

```javascript
// Ejemplo de implementación futura
if ('Notification' in window && 'serviceWorker' in navigator) {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Suscribir al usuario
  }
}
```

### **Sincronización en Segundo Plano**

Para sincronizar datos cuando vuelva la conexión:

```javascript
// Ejemplo de Background Sync
if ('sync' in serviceWorkerRegistration) {
  await serviceWorkerRegistration.sync.register('sync-tasks');
}
```

### **Modo Offline Completo**

Actualmente hay caché básico. Para offline completo necesitarías:
1. IndexedDB para datos locales
2. Detección de estado de red
3. Cola de sincronización para acciones pendientes

---

## 🐛 Solución de Problemas

### **La PWA no se puede instalar**

✅ **Verifica:**
- Estás usando HTTPS (o localhost)
- El `manifest.json` es accesible
- Los iconos existen en `/public/icons/`
- El Service Worker se registró correctamente

### **Los cambios no se reflejan**

La PWA cachea contenido agresivamente:

1. **Limpia la caché:**
   - Chrome: DevTools → Application → Clear storage
   - Safari iOS: Configuración → Safari → Borrar historial

2. **Fuerza actualización del SW:**
   ```javascript
   // En DevTools → Application → Service Workers
   // Haz clic en "Update" o "Unregister"
   ```

### **Íconos no aparecen correctamente**

1. Regenera los iconos: `node scripts/generate-icons-simple.js`
2. Verifica que `/public/icons/` tenga todos los tamaños
3. Limpia caché y reinstala la PWA

### **Service Worker no se registra**

1. Verifica que estés en producción o hayas habilitado PWA en desarrollo
2. Comprueba la consola del navegador por errores
3. Verifica que `sw.js` sea accesible: `https://tudominio.com/sw.js`

---

## 📚 Recursos Adicionales

- [Google PWA Docs](https://web.dev/progressive-web-apps/)
- [next-pwa GitHub](https://github.com/shadowwalker/next-pwa)
- [Workbox (Caché)](https://developers.google.com/web/tools/workbox)
- [Manifest Generator](https://www.simicart.com/manifest-generator.html/)
- [Icon Generator](https://realfavicongenerator.net/)

---

## 💡 Tips y Mejores Prácticas

1. **Actualiza el manifest** cuando cambies el nombre o descripción de la app
2. **Regenera iconos** cuando actualices el logo
3. **Prueba en dispositivos reales** antes de lanzar
4. **Monitorea métricas** de instalación en Google Analytics
5. **Considera notificaciones** solo si son realmente útiles (no spamear)
6. **Mantén el caché limpio** - elimina estrategias innecesarias

---

## 📞 Soporte

Si encuentras problemas con la PWA, verifica:
1. Esta documentación
2. Los logs del navegador (F12 → Console)
3. DevTools → Application → Manifest/Service Workers
4. La configuración en `next.config.ts`

---

**Última actualización:** 2025  
**Versión:** 1.0.0  
**Mantenedor:** Tu equipo de desarrollo




