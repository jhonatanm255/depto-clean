# 🧪 Cómo Probar la PWA

## 🚀 Pasos Rápidos

### 1. Build la Aplicación

```bash
npm run build
npm start
```

La aplicación estará en: `http://localhost:3000`

### 2. Abre Chrome DevTools

Presiona `F12` y ve a la pestaña **Application**

### 3. Verifica el Manifest

En el sidebar izquierdo:
- Haz clic en **"Manifest"**
- Deberías ver:
  - ✅ Name: "CleanSweep Manager - Gestión de Limpieza"
  - ✅ Short name: "CleanSweep"
  - ✅ Start URL: "/"
  - ✅ Theme color: "#73A5C6"
  - ✅ Icons: 10 iconos de diferentes tamaños

### 4. Verifica el Service Worker

En el sidebar izquierdo:
- Haz clic en **"Service Workers"**
- Deberías ver:
  - ✅ Status: **Activated and running**
  - ✅ Source: `sw.js`

Si no aparece, refresca la página (`Ctrl+R` o `Cmd+R`)

### 5. Prueba la Instalación

**Opción A: Botón de instalación del navegador**
- Busca el ícono de instalación (⊕) en la barra de direcciones
- Haz clic y selecciona "Instalar"

**Opción B: Desde DevTools**
- En la pestaña Application
- Haz clic en **"Manifest"**
- Haz clic en el botón **"Install"** en la parte superior

### 6. Verifica el Caché

En el sidebar izquierdo:
- Haz clic en **"Cache Storage"**
- Expande las entradas
- Deberías ver:
  - ✅ `google-fonts`
  - ✅ `static-images`
  - ✅ `static-resources`

Navega por la app para que se cacheen más recursos.

### 7. Prueba Offline (Opcional)

1. Navega por toda la aplicación una vez (para cachear)
2. En DevTools → Network
3. Cambia "No throttling" a **"Offline"**
4. Refresca la página
5. La app debería cargar (aunque con datos limitados)

---

## 📱 Probar en Móvil Real

### Opción 1: Conectar a la misma WiFi

1. Encuentra tu IP local:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Busca tu dirección IP (ej: `192.168.1.100`)

3. Inicia el servidor:
   ```bash
   npm start
   ```

4. En tu móvil, abre el navegador y ve a:
   ```
   http://TU-IP:3000
   ```
   (ej: `http://192.168.1.100:3000`)

5. Instala la PWA desde el menú del navegador

### Opción 2: Usar ngrok (Túnel HTTPS)

1. Instala ngrok: https://ngrok.com/

2. Inicia tu app:
   ```bash
   npm start
   ```

3. En otra terminal:
   ```bash
   ngrok http 3000
   ```

4. ngrok te dará una URL HTTPS (ej: `https://abc123.ngrok.io`)

5. Abre esa URL en tu móvil

6. Instala la PWA

---

## 🔍 Lighthouse Audit

Lighthouse es una herramienta de Google para auditar PWAs.

### Ejecutar Lighthouse

1. Abre Chrome DevTools (`F12`)
2. Ve a la pestaña **"Lighthouse"**
3. Selecciona:
   - ✅ Progressive Web App
   - ✅ Performance (opcional)
   - ✅ Accessibility (opcional)
   - Device: Mobile
4. Haz clic en **"Generate report"**

### Resultados Esperados

**Progressive Web App:**
- ✅ Installable: 100%
- ✅ PWA Optimized: 100%
- ⚠️ Nota: Puede dar advertencias sobre HTTPS si estás en localhost (es normal)

**Puntuación objetivo:** >90 en PWA

---

## 📸 Screenshots para Verificar

### Android

**Antes de instalar:**
- Banner de instalación aparece automáticamente
- O icono ⊕ en la barra de direcciones

**Después de instalar:**
- Ícono en pantalla de inicio
- Abre en pantalla completa (sin barra del navegador)
- Splash screen con tu logo (rápido, puede que no lo veas)

### iOS

**Antes de instalar:**
- No hay banner automático (limitación de iOS)
- Usuario debe ir a Compartir → "Agregar a pantalla de inicio"

**Después de instalar:**
- Ícono en pantalla de inicio
- Abre en pantalla completa
- Splash screen personalizado

---

## ✅ Checklist de Funcionalidades PWA

Prueba cada una de estas:

- [ ] **Instalación desde escritorio** (Chrome/Edge)
- [ ] **Instalación desde Android** (Chrome)
- [ ] **Instalación desde iOS** (Safari)
- [ ] **Íconos se ven bien** en todos los dispositivos
- [ ] **Splash screen aparece** (iOS)
- [ ] **Funciona offline básico** (caché de recursos estáticos)
- [ ] **Theme color correcto** (#73A5C6)
- [ ] **Orientación portrait** por defecto en móvil
- [ ] **Service Worker registrado** sin errores
- [ ] **Lighthouse PWA score** >90
- [ ] **No errores en Console** de DevTools

---

## 🐛 Troubleshooting

### Service Worker no se registra

**Solución:**
```bash
# Limpia la caché y rebuilds
rm -rf .next
npm run build
npm start
```

### Cambios no se reflejan

**Solución:**
1. Chrome DevTools → Application → Service Workers
2. Haz clic en "Unregister"
3. Refresca la página (`Ctrl+Shift+R` para hard refresh)

### Iconos no aparecen

**Solución:**
```bash
# Regenera los iconos
npm run generate-icons

# Verifica que se crearon
ls public/icons
```

### No puedo instalar en iOS

**Verificar:**
- ✅ Estás usando Safari (no Chrome en iOS)
- ✅ El manifest.json es accesible: `https://tudominio.com/manifest.json`
- ✅ Los iconos existen en `/public/icons/`

### Error de HTTPS

**Nota:** Las PWA requieren HTTPS en producción.

**En desarrollo:** `localhost` es considerado seguro, no necesitas HTTPS.

**En producción:** Usa Vercel, Firebase, o cualquier hosting con HTTPS automático.

---

## 📊 Métricas a Monitorear

Una vez en producción, monitorea:

1. **Tasa de instalación**: ¿Cuántos usuarios instalan la PWA?
2. **Engagement**: ¿Los usuarios que instalan vuelven más?
3. **Performance**: ¿Mejora el tiempo de carga con el caché?
4. **Errores**: ¿El Service Worker causa problemas?

Puedes usar:
- Google Analytics (eventos de instalación)
- Firebase Analytics
- Herramientas de monitoreo de PWA

---

## 🎉 ¡Listo!

Si todos los checks están ✅, tu PWA está lista para producción.

**Siguiente paso:** Deploy a Vercel, Firebase, o tu hosting preferido.

---

**¿Preguntas?** Consulta la [Guía Completa de PWA](./PWA-GUIDE.md)




