# CleanSweep Manager 🧹

**Gestión de limpieza profesional** - Sistema de asignación y seguimiento de tareas de limpieza en tiempo real.

## 🚀 Características

- ✅ **Progressive Web App (PWA)** - Instalable en todos los dispositivos
- ✅ **Gestión de Usuarios** - Roles de administrador y empleado
- ✅ **Gestión de Departamentos** - Agregar y administrar ubicaciones
- ✅ **Asignaciones** - Asignar departamentos a empleadas
- ✅ **Seguimiento en Tiempo Real** - Estado de limpieza actualizado
- ✅ **Diseño Responsive** - Optimizado para móviles y escritorio
- ✅ **Firebase & Supabase** - Backend robusto y escalable

## 📱 PWA - Instalable como App Móvil

Esta aplicación es una **Progressive Web App** completa. Los usuarios pueden instalarla en sus dispositivos como una app nativa.

**Documentación PWA:**
- [📖 Guía Completa de PWA](./docs/PWA-GUIDE.md)
- [🚀 Quick Start PWA](./docs/PWA-QUICK-START.md)
- [📋 Blueprint del Proyecto](./docs/blueprint.md)

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Regenerar iconos PWA
npm run generate-icons
```

## 🎨 Stack Tecnológico

- **Framework:** Next.js 15.3 con Turbopack
- **UI:** React 18 + Radix UI + Tailwind CSS
- **Backend:** Firebase + Supabase
- **PWA:** next-pwa + Workbox
- **TypeScript:** Completamente tipado
- **AI:** Genkit para funcionalidades de IA

## 📂 Estructura del Proyecto

```
src/
├── app/              # Rutas de Next.js
│   ├── (app)/       # Rutas protegidas
│   └── (auth)/      # Rutas de autenticación
├── components/       # Componentes React
│   ├── core/        # Componentes principales
│   ├── ui/          # Componentes de UI (Radix)
│   └── ...          # Componentes por feature
├── contexts/         # Contextos de React
├── hooks/            # Custom hooks
└── lib/              # Utilidades y configuración

public/
├── icons/            # Iconos PWA (todos los tamaños)
├── splash/           # Splash screens iOS
└── manifest.json     # Configuración PWA
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
vercel --prod
```

### Firebase Hosting
```bash
firebase deploy
```

La aplicación está lista para PWA en cualquier hosting que soporte HTTPS.

## 👥 Roles de Usuario

### Administrador
- Gestionar departamentos
- Gestionar empleadas
- Asignar tareas
- Ver estadísticas completas

### Empleada
- Ver tareas asignadas
- Marcar tareas como completadas
- Ver historial de tareas

## 🎨 Diseño

- **Color primario:** `#73A5C6` (Azul suave)
- **Fondo:** `#F0F4F7` (Azul muy claro)
- **Acento:** `#E08E49` (Naranja cálido)
- **Tipografía:** PT Sans

## 📄 Licencia

Privado - Todos los derechos reservados

---

**Desarrollado con ❤️ para la gestión eficiente de limpieza**
