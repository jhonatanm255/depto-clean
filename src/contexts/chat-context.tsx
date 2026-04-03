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

        const channel = supabase.channel('chat_messages_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `company_id=eq.${currentUser.companyId}`
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
                    filter: `company_id=eq.${currentUser.companyId}`
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
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    // Build contacts list
    const contacts: Contact[] = React.useMemo(() => {
        if (!currentUser) return [];

        let availableProfiles = employees.filter(e => e.id !== currentUser.id);

        // If employee, maybe only show admins/owners, 
        // If admin, show everyone.
        // The request says "hablar el administrador con los empleados", so:
        if (isEmployee) {
            availableProfiles = availableProfiles.filter(e => e.role === 'admin' || e.role === 'owner');
        }

        return availableProfiles.map(profile => {
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
    }, [currentUser, employees, messages, isEmployee]);

    const unreadTotal = contacts.reduce((sum, contact) => sum + contact.unreadCount, 0);

    const sendMessage = async (content: string) => {
        if (!currentUser || !activeContactId || !content.trim()) return;

        try {
            const tempId = `temp-${Date.now()}`;
            const tempMsg: ChatMessage = {
                id: tempId,
                companyId: currentUser.companyId,
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
                    company_id: currentUser.companyId,
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

    const value = {
        messages,
        contacts,
        activeContactId,
        setActiveContactId,
        sendMessage,
        markAsRead,
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
