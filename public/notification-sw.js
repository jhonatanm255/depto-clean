// Service Worker para notificaciones push nativas
// Este service worker maneja notificaciones push que aparecen en la barra del sistema

self.addEventListener('push', (event) => {
  console.log('[SW] Push event recibido:', event);
  
  let notificationData = {
    title: 'CleanSweep Manager',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'default',
    data: {}
  };

  // Si el evento tiene datos, usarlos
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: data.id || data.tag || notificationData.tag,
        data: {
          notificationId: data.id,
          relatedTaskId: data.relatedTaskId,
          relatedDepartmentId: data.relatedDepartmentId,
          url: data.url || '/dashboard'
        },
        requireInteraction: false,
        silent: false
      };
    } catch (e) {
      console.error('[SW] Error parseando datos del push:', e);
      // Usar datos como texto si no es JSON
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Mostrar la notificación
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: [200, 100, 200], // Vibración en móviles
      actions: [
        {
          action: 'open',
          title: 'Abrir',
        },
        {
          action: 'close',
          title: 'Cerrar',
        }
      ]
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  let urlToOpen = '/dashboard';

  // Determinar la URL según el tipo de notificación
  if (notificationData.relatedTaskId) {
    urlToOpen = '/employee/tasks';
  } else if (notificationData.relatedDepartmentId) {
    urlToOpen = '/admin/departments';
  } else if (notificationData.url) {
    urlToOpen = notificationData.url;
  }

  // Manejar acciones
  if (event.action === 'close') {
    return; // Solo cerrar, no abrir nada
  }

  // Abrir o enfocar la ventana/cliente
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar si hay una ventana abierta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen || client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Manejar cuando se cierra una notificación
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificación cerrada:', event);
});
