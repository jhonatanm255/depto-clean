"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ChatMessage, AppUser } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth-context';
import { useData } from './data-context';

type Contact = {
    id: string;
    name: string;
    role: string;
    unreadCount: number;
    lastMessage?: ChatMessage;
};

interface ChatContextType {
    messages: ChatMessage[];
    contacts: Contact[];
    activeContactId: string | null;
    setActiveContactId: (id: string | null) => void;
    sendMessage: (content: string) => Promise<void>;
    markAsRead: (senderId: string) => Promise<void>;
    deleteConversation: (contactId: string) => Promise<void>;
    typingUsers: Record<string, string>;
    sendTypingStatus: (targetId: string) => void;
    unreadTotal: number;
    loading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const { employees } = useData(); // employees has all profiles (admins, employees, etc)
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [typingUsers, setTypingUsers] = useState<Record<string, { name: string, timestamp: number }>>({});
    const channelRef = React.useRef<any>(null);

    const isEmployee = currentUser?.role === 'employee' || currentUser?.role === 'manager';

    const loadMessages = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            if (data) {
                const mappedMessages: ChatMessage[] = data.map(msg => ({
                    id: msg.id,
                    companyId: msg.company_id,
                    senderId: msg.sender_id,
                    receiverId: msg.receiver_id,
                    content: msg.content,
                    isRead: msg.is_read,
                    createdAt: msg.created_at,
                    updatedAt: msg.updated_at
                }));
                setMessages(mappedMessages);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            loadMessages();
        } else {
            setMessages([]);
            setActiveContactId(null);
        }
    }, [currentUser, loadMessages]);

    // Supabase Realtime subscription
    useEffect(() => {
        if (!currentUser) return;

        // Filtro de tiempo real: superadmins ven todo, usuarios normales solo su empresa
        const realtimeFilter = currentUser.role === 'superadmin' 
            ? undefined 
            : `company_id=eq.${currentUser.companyId}`;

        const channel = supabase.channel('chat_messages_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: realtimeFilter
                },
                (payload) => {
                    const newMsg = payload.new;
                    // Only add if we are sender or receiver
                    if (newMsg.sender_id === currentUser.id || newMsg.receiver_id === currentUser.id) {
                        setMessages(prev => {
                            // Si el mensaje ya existe por ID real, lo ignoramos
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            
                            // Filtrar el mensaje optimista (temp-...) que tenga el mismo contenido
                            // para reemplazarlo por el mensaje real de la base de datos
                            const filteredPrev = prev.filter(m => 
                                !(m.id.startsWith('temp-') && m.content === newMsg.content && m.senderId === newMsg.sender_id)
                            );

                            return [
                                ...filteredPrev, 
                                {
                                    id: newMsg.id,
                                    companyId: newMsg.company_id,
                                    senderId: newMsg.sender_id,
                                    receiverId: newMsg.receiver_id,
                                    content: newMsg.content,
                                    isRead: newMsg.is_read,
                                    createdAt: newMsg.created_at,
                                    updatedAt: newMsg.updated_at
                                }
                            ];
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: realtimeFilter
                },
                (payload) => {
                    const updatedMsg = payload.new;
                    setMessages(prev => prev.map(msg => 
                        msg.id === updatedMsg.id 
                            ? { ...msg, isRead: updatedMsg.is_read } 
                            : msg
                    ));
                }
            )
            .on(
                'broadcast',
                { event: 'typing' },
                (payload) => {
                    const { userId, userName, targetId } = payload.payload;
                    if (targetId === currentUser.id) {
                        setTypingUsers(prev => ({
                            ...prev,
                            [userId]: { name: userName, timestamp: Date.now() }
                        }));
                    }
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [currentUser]);

    // Cleanup typing status
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTypingUsers(prev => {
                const next = { ...prev };
                let changed = false;
                Object.keys(next).forEach(id => {
                    if (now - next[id].timestamp > 3000) {
                        delete next[id];
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const sendTypingStatus = useCallback((targetId: string) => {
        if (!currentUser || !channelRef.current) return;
        
        channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload: { 
                userId: currentUser.id, 
                userName: currentUser.fullName || currentUser.email || 'Alguien',
                targetId 
            }
        });
    }, [currentUser]);

    // Build contacts list
    const contacts: Contact[] = React.useMemo(() => {
        if (!currentUser) return [];

        // 1. Obtener perfiles base (compañeros de trabajo)
        let baseProfiles = [...employees];
        
        // Si es un empleado básico, solo puede ver cargos superiores por defecto
        if (currentUser.role === 'employee') {
            baseProfiles = baseProfiles.filter(e => 
                e.role === 'admin' || e.role === 'owner' || e.role === 'manager' || e.role === 'superadmin'
            );
        }
        
        // Quitarse a uno mismo
        let availableProfiles = baseProfiles.filter(e => e.id !== currentUser.id);

        // 2. Identificar "perfiles fantasma" (personas que nos han escrito pero no están en la lista filtrada)
        const messageUserIds = new Set<string>();
        messages.forEach(m => {
            if (m.senderId !== currentUser.id) messageUserIds.add(m.senderId);
            if (m.receiverId !== currentUser.id) messageUserIds.add(m.receiverId);
        });

        const ghostUserIds = Array.from(messageUserIds).filter(
            id => id !== currentUser.id && !availableProfiles.some(p => p.id === id)
        );

        // Combinar perfiles disponibles con perfiles de mensajes (fantasmas)
        const ghostProfiles = ghostUserIds.map(id => {
            // Intentar encontrarlo en la lista completa de empleados (sin filtrar)
            const emp = employees.find(e => e.id === id);
            if (emp) return emp;
            // Si no existe, crear perfil mínimo (esto pasaría con superadmins globales)
            return { 
                id, 
                role: 'contact', 
                name: 'Usuario',
                fullName: 'Usuario'
            } as any;
        });

        const allVisibleProfiles = [...availableProfiles, ...ghostProfiles];

        return allVisibleProfiles.map(profile => {
            const contactMessages = messages.filter(
                m => (m.senderId === profile.id && m.receiverId === currentUser.id) ||
                     (m.senderId === currentUser.id && m.receiverId === profile.id)
            );
            
            const lastMessage = contactMessages.length > 0 
                ? contactMessages[contactMessages.length - 1] 
                : undefined;
                
            const unreadCount = contactMessages.filter(
                m => m.senderId === profile.id && m.receiverId === currentUser.id && !m.isRead
            ).length;

            return {
                id: profile.id,
                name: profile.fullName || profile.email || 'Usuario',
                role: profile.role,
                unreadCount,
                lastMessage
            };
        }).sort((a, b) => {
            // Sort by most recent message first
            const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return timeB - timeA;
        });
    }, [currentUser, employees, messages]);

    const unreadTotal = contacts.reduce((sum, contact) => sum + contact.unreadCount, 0);

    const sendMessage = async (content: string) => {
        if (!currentUser || !activeContactId || !content.trim()) return;

        // Buscar el contacto para obtener su companyId si el remitente no tiene uno (superadmin)
        const contact = contacts.find(c => c.id === activeContactId);
        // Si el usuario es superadmin y no tiene companyId, usamos el del contacto
        // En DataContext, corregimos para que los empleados SIEMPRE tengan companyId
        const targetCompanyId = currentUser.companyId || (contact as any)?.companyId || employees.find(e => e.id === activeContactId)?.companyId;

        if (!targetCompanyId) {
            console.error("No se pudo determinar el company_id para el mensaje");
            return;
        }

        try {
            const tempId = `temp-${Date.now()}`;
            const tempMsg: ChatMessage = {
                id: tempId,
                companyId: targetCompanyId,
                senderId: currentUser.id,
                receiverId: activeContactId,
                content: content.trim(),
                isRead: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Optimistic update
            setMessages(prev => [...prev, tempMsg]);

            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    company_id: targetCompanyId,
                    sender_id: currentUser.id,
                    receiver_id: activeContactId,
                    content: content.trim(),
                });

            if (error) throw error;
        } catch (error) {
            console.error("Error sending message:", error);
            // Refresh on error to fix optimistic UI
            loadMessages();
        }
    };

    const markAsRead = async (senderId: string) => {
        if (!currentUser) return;

        // Find unread messages from this sender to me
        const unreadMsgIds = messages
            .filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.isRead)
            .map(m => m.id);

        if (unreadMsgIds.length === 0) return;

        // Optimistic update
        setMessages(prev => prev.map(m => 
            unreadMsgIds.includes(m.id) ? { ...m, isRead: true } : m
        ));

        try {
            await supabase
                .from('chat_messages')
                .update({ is_read: true })
                .in('id', unreadMsgIds);
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    const deleteConversation = async (contactId: string) => {
        if (!currentUser || !contactId) return;

        // Optimistic update
        setMessages(prev => prev.filter(m => 
            !(m.senderId === contactId && m.receiverId === currentUser.id) &&
            !(m.senderId === currentUser.id && m.receiverId === contactId)
        ));

        try {
            const { error } = await supabase
                .from('chat_messages')
                .delete()
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUser.id})`);
            
            if (error) throw error;
            
            if (activeContactId === contactId) {
                setActiveContactId(null);
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
            loadMessages();
        }
    };

    const value = {
        messages,
        contacts,
        activeContactId,
        setActiveContactId,
        sendMessage,
        markAsRead,
        deleteConversation,
        typingUsers: Object.fromEntries(
            Object.entries(typingUsers).map(([id, data]) => [id, data.name])
        ),
        sendTypingStatus,
        unreadTotal,
        loading
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
