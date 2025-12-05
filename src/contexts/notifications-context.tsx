"use client";

import type { Notification, NotificationType } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';
import { toast } from '@/hooks/use-toast';

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

  // Cargar permisos de notificación al montar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
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

  // Mostrar notificación push
  const showPushNotification = useCallback((notification: Notification) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    // Solo mostrar si la página no está visible o si el usuario está en otra pestaña
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      // Si la página está visible, solo mostrar toast
      return;
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notification.id, // Evitar duplicados
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
        
        // Navegar a la página relevante si hay un ID relacionado
        if (notification.relatedTaskId) {
          window.location.href = '/employee/tasks';
        } else if (notification.relatedDepartmentId) {
          window.location.href = '/admin/departments';
        } else {
          window.location.href = '/dashboard';
        }
      };

      // Cerrar automáticamente después de 5 segundos
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

  // Polling para nuevas notificaciones (funciona sin Realtime - Plan Gratuito)
  useEffect(() => {
    if (!currentUser || !mountedRef.current) {
      return;
    }

    console.log('[Notifications] 🔔 Iniciando sistema de notificaciones para usuario:', currentUser.id);
    
    // Cargar notificaciones iniciales
    loadNotifications();

    // Función para verificar nuevas notificaciones
    const checkForNewNotifications = async () => {
      if (!currentUser || !mountedRef.current) {
        return;
      }

      try {
        // Obtener el timestamp de referencia (última notificación conocida o últimos 30 segundos)
        const timeFilter = lastNotificationTimeRef.current 
          ? lastNotificationTimeRef.current 
          : new Date(Date.now() - 30000).toISOString(); // Últimos 30 segundos si no hay referencia

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .gt('created_at', timeFilter)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('[Notifications] ❌ Error verificando nuevas notificaciones:', error);
          console.error('[Notifications] Detalles del error:', JSON.stringify(error, null, 2));
          return;
        }

        const newNotifications = (data as NotificationRow[] || []).map(mapNotification);

        if (newNotifications.length > 0) {
          console.log('[Notifications] ✅ Se encontraron', newNotifications.length, 'notificaciones nuevas');
          
          // Actualizar el timestamp de referencia con la más reciente
          lastNotificationTimeRef.current = newNotifications[0].createdAt;
          
          // Agregar nuevas notificaciones al inicio
          setNotifications((prev) => {
            const existingIds = new Set(prev.map(n => n.id));
            const trulyNew = newNotifications.filter(n => !existingIds.has(n.id));
            
            if (trulyNew.length === 0) {
              return prev;
            }
            
            // Mostrar cada notificación nueva (de más antigua a más reciente)
            [...trulyNew].reverse().forEach((newNotification) => {
              toast({
                title: newNotification.title,
                description: newNotification.message,
              });

              if (notificationPermission === 'granted') {
                showPushNotification(newNotification);
              }
            });
            
            // Agregar al inicio (más recientes primero)
            return [...trulyNew.reverse(), ...prev];
          });
        }
      } catch (error) {
        console.error('[Notifications] ❌ Error en checkForNewNotifications:', error);
      }
    };

    // Inicializar el timestamp de referencia después de cargar notificaciones iniciales
    const initRef = () => {
      setNotifications((prev) => {
        if (prev.length > 0) {
          lastNotificationTimeRef.current = prev[0].createdAt;
        }
        return prev;
      });
    };
    
    // Esperar un poco para que se carguen las notificaciones iniciales
    const initTimeout = setTimeout(initRef, 1000);

    // Verificar cada 5 segundos
    const pollingInterval = setInterval(checkForNewNotifications, 5000);
    console.log('[Notifications] 🔄 Polling iniciado - verificando cada 5 segundos');

    // Limpiar al desmontar
    return () => {
      console.log('[Notifications] 🛑 Limpiando polling');
      clearTimeout(initTimeout);
      clearInterval(pollingInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
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

