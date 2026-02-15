"use client";

import type { Notification, NotificationType } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface NotificationRow {
  id: string;
  user_id: string;
  company_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_task_id: string | null;
  related_department_id: string | null;
  related_media_report_id: string | null;
  read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  notificationPermission: NotificationPermission | null;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedTaskId: row.related_task_id ?? undefined,
    relatedDepartmentId: row.related_department_id ?? undefined,
    relatedMediaReportId: row.related_media_report_id ?? undefined,
    read: row.read,
    readAt: row.read_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef = useRef(true);
  const lastNotificationTimeRef = useRef<string | null>(null);
  const serviceWorkerRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Registrar service worker y cargar permisos al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Cargar permisos de notificación
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Si el permiso es 'default' (no preguntado), solicitar automáticamente via Toast
      // Esto cumple con "al inicio solo se le pregunte al usuario"
      if (Notification.permission === 'default' && currentUser) {
        const timer = setTimeout(() => {
          toast({
            title: "¿Activar notificaciones?",
            description: "Recibe alertas en tiempo real sobre tareas y reportes.",
            action: (
              <ToastAction altText="Activar notificaciones" onClick={() => requestNotificationPermission()}>
                Activar
              </ToastAction>
            ),
            duration: Infinity, // Se queda hasta que el usuario decida
          });
        }, 3000); // Pequeño retraso para no ser intrusivo al cargar
        return () => clearTimeout(timer);
      }
    }

    // Registrar service worker para notificaciones push nativas
    if ('serviceWorker' in navigator) {
      // Esperar a que el service worker principal (next-pwa) esté listo
      navigator.serviceWorker.ready.then(() => {
        // Registrar nuestro service worker de notificaciones
        return navigator.serviceWorker.register('/notification-sw.js');
      })
      .then((registration) => {
        console.log('[Notifications] ✅ Service Worker de notificaciones registrado:', registration);
        serviceWorkerRegistrationRef.current = registration;
        
        // Verificar si hay actualizaciones
        registration.update();
      })
      .catch((error) => {
        console.error('[Notifications] ❌ Error registrando Service Worker de notificaciones:', error);
        // Si falla, intentar registrar directamente
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/notification-sw.js')
            .then((reg) => {
              serviceWorkerRegistrationRef.current = reg;
              console.log('[Notifications] ✅ Service Worker registrado en segundo intento');
            })
            .catch((err) => {
              console.error('[Notifications] ❌ Error en segundo intento:', err);
            });
        }
      });
    }
  }, []);

  // Solicitar permiso para notificaciones push
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[Notifications] Push notifications no están disponibles en este navegador');
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      setNotificationPermission('denied');
      toast({
        variant: 'destructive',
        title: 'Notificaciones bloqueadas',
        description: 'Por favor, habilita las notificaciones en la configuración de tu navegador.',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast({
          title: 'Notificaciones activadas',
          description: 'Recibirás notificaciones cuando haya cambios en tus tareas.',
        });
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Notificaciones bloqueadas',
          description: 'No podrás recibir notificaciones push.',
        });
        return false;
      }
    } catch (error) {
      console.error('[Notifications] Error solicitando permiso:', error);
      return false;
    }
  }, []);

  // Mostrar notificación push nativa (en la barra del sistema)
  const showPushNotification = useCallback(async (notification: Notification) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      // Intentar usar Service Worker primero (notificaciones nativas en móvil)
      // Esto hace que aparezcan en la barra de notificaciones del sistema
      if ('serviceWorker' in navigator) {
        let registration = serviceWorkerRegistrationRef.current;
        
        // Si no tenemos el registration guardado, intentar obtenerlo
        if (!registration) {
          try {
            registration = await navigator.serviceWorker.ready;
            serviceWorkerRegistrationRef.current = registration;
          } catch (e) {
            console.warn('[Notifications] Service Worker no está listo, usando fallback');
          }
        }
        
        if (registration) {
          // Mostrar notificación desde el Service Worker (aparece en la barra del sistema móvil)
          const notificationOptions: any = {
            body: notification.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: notification.id, // Evitar duplicados
            data: {
              notificationId: notification.id,
              relatedTaskId: notification.relatedTaskId,
              relatedDepartmentId: notification.relatedDepartmentId,
              url: notification.relatedTaskId 
                ? '/employee/tasks' 
                : notification.relatedDepartmentId 
                ? '/admin/departments' 
                : '/dashboard'
            },
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200], // Vibración en dispositivos móviles (no está en el tipo estándar pero es soportado)
            actions: [
              {
                action: 'open',
                title: 'Abrir',
              }
            ]
          };

          await registration.showNotification(notification.title, notificationOptions);
          
          console.log('[Notifications] ✅ Notificación push nativa mostrada desde Service Worker');
          return;
        }
      }

      // Fallback: usar Notification API directamente (funciona pero no es tan nativa)
      const notificationOptions: NotificationOptions = {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notification.id,
        data: {
          notificationId: notification.id,
          relatedTaskId: notification.relatedTaskId,
          relatedDepartmentId: notification.relatedDepartmentId,
        },
        requireInteraction: false,
      };

      const pushNotification = new Notification(notification.title, notificationOptions);

      pushNotification.onclick = () => {
        window.focus();
        pushNotification.close();
        
        if (notification.relatedTaskId) {
          window.location.href = '/employee/tasks';
        } else if (notification.relatedDepartmentId) {
          window.location.href = '/admin/departments';
        } else {
          window.location.href = '/dashboard';
        }
      };

      setTimeout(() => {
        pushNotification.close();
      }, 5000);
    } catch (error) {
      console.error('[Notifications] Error mostrando notificación push:', error);
    }
  }, []);

  // Cargar notificaciones desde la base de datos
  const loadNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limitar a las 100 más recientes

      if (error) {
        console.error('[Notifications] Error cargando notificaciones:', error);
        throw error;
      }

      const mappedNotifications = (data as NotificationRow[] || []).map(mapNotification);
      console.log('[Notifications] 📥 Cargadas', mappedNotifications.length, 'notificaciones iniciales');
      
      // Inicializar el ref con la última notificación
      if (mappedNotifications.length > 0) {
        lastNotificationTimeRef.current = mappedNotifications[0].createdAt;
        console.log('[Notifications] ⏰ Timestamp de referencia inicializado:', lastNotificationTimeRef.current);
      }
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('[Notifications] Error en loadNotifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        notif_id: notificationId,
      });

      if (error) {
        console.error('[Notifications] Error marcando como leída:', error);
        throw error;
      }

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, read: true, readAt: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('[Notifications] Error en markAsRead:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo marcar la notificación como leída.',
      });
    }
  }, [currentUser]);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (error) {
        console.error('[Notifications] Error marcando todas como leídas:', error);
        throw error;
      }

      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read: true,
          readAt: notif.readAt || new Date().toISOString(),
        }))
      );

      toast({
        title: 'Notificaciones leídas',
        description: 'Todas las notificaciones han sido marcadas como leídas.',
      });
    } catch (error) {
      console.error('[Notifications] Error en markAllAsRead:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron marcar todas las notificaciones como leídas.',
      });
    }
  }, [currentUser]);

  // Sistema de notificaciones en tiempo real con Realtime (fallback a polling)
  useEffect(() => {
    if (!currentUser || !mountedRef.current) {
      return;
    }

    console.log('[Notifications] 🔔 Iniciando sistema de notificaciones para usuario:', currentUser.id);
    
    // Cargar notificaciones iniciales
    loadNotifications();

    // Función para procesar una nueva notificación
    const processNewNotification = (notification: Notification) => {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map(n => n.id));
        if (existingIds.has(notification.id)) {
          return prev; // Ya existe, no agregar duplicado
        }
        
        // Mostrar toast en la aplicación
        toast({
          title: notification.title,
          description: notification.message,
        });

        // Siempre mostrar notificación push nativa en la barra del sistema si hay permiso
        // Esto funciona incluso cuando la app está en primer plano
        if (notificationPermission === 'granted') {
          showPushNotification(notification);
        }
        
        // Agregar al inicio (más recientes primero)
        return [notification, ...prev];
      });
    };

    // Función de polling como respaldo
    let pollingInterval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (pollingInterval) return; // Ya está corriendo

      const checkForNewNotifications = async () => {
        if (!currentUser || !mountedRef.current) {
          return;
        }

        try {
          const timeFilter = lastNotificationTimeRef.current 
            ? lastNotificationTimeRef.current 
            : new Date(Date.now() - 30000).toISOString();

          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .gt('created_at', timeFilter)
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) {
            console.error('[Notifications] ❌ Error verificando nuevas notificaciones:', error);
            return;
          }

          const newNotifications = (data as NotificationRow[] || []).map(mapNotification);

          if (newNotifications.length > 0) {
            console.log('[Notifications] ✅ Se encontraron', newNotifications.length, 'notificaciones nuevas (polling)');
            
            lastNotificationTimeRef.current = newNotifications[0].createdAt;
            
            newNotifications.forEach((notification) => {
              processNewNotification(notification);
            });
          }
        } catch (error) {
          console.error('[Notifications] ❌ Error en checkForNewNotifications:', error);
        }
      };

      // Verificar cada 10 segundos (menos frecuente que antes, ya que Realtime es primario)
      pollingInterval = setInterval(checkForNewNotifications, 10000);
      console.log('[Notifications] 🔄 Polling iniciado como respaldo - verificando cada 10 segundos');
    };

    // Intentar usar Realtime primero
    try {
      // Crear canal de Realtime para escuchar nuevas notificaciones
      const channel = supabase
        .channel(`notifications:${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`,
          },
          (payload) => {
            if (!mountedRef.current) return;
            
            console.log('[Notifications] 🔔 Nueva notificación recibida en tiempo real:', payload.new);
            const newNotification = mapNotification(payload.new as NotificationRow);
            processNewNotification(newNotification);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Notifications] ✅ Suscrito a Realtime - notificaciones en tiempo real activas');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Notifications] ⚠️ Error en Realtime, usando polling como respaldo');
            startPolling();
          }
        });

      channelRef.current = channel;

      // Si después de 3 segundos no se suscribió, usar polling
      const realtimeTimeout = setTimeout(() => {
        if (channelRef.current && channelRef.current.state !== 'joined') {
          console.warn('[Notifications] ⚠️ Realtime no disponible, usando polling');
          startPolling();
        }
      }, 3000);

      // Inicializar timestamp de referencia
      const initRef = () => {
        setNotifications((prev) => {
          if (prev.length > 0) {
            lastNotificationTimeRef.current = prev[0].createdAt;
          }
          return prev;
        });
      };
      
      const initTimeout = setTimeout(initRef, 1000);

      // Limpiar al desmontar
      return () => {
        clearTimeout(realtimeTimeout);
        clearTimeout(initTimeout);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        if (channelRef.current) {
          console.log('[Notifications] 🛑 Desconectando canal Realtime');
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    } catch (error) {
      console.error('[Notifications] ❌ Error configurando Realtime, usando polling:', error);
      // Fallback a polling si hay error
      startPolling();

      // Inicializar timestamp de referencia
      const initRef = () => {
        setNotifications((prev) => {
          if (prev.length > 0) {
            lastNotificationTimeRef.current = prev[0].createdAt;
          }
          return prev;
        });
      };
      
      const initTimeout = setTimeout(initRef, 1000);

      return () => {
        clearTimeout(initTimeout);
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    }
  }, [currentUser, loadNotifications, notificationPermission, showPushNotification]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Calcular cantidad de no leídas
  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications,
    requestNotificationPermission,
    notificationPermission,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

