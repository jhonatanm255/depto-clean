"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquareMore, X, Send, ChevronLeft, User as UserIcon, Trash2, Crown, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/contexts/chat-context';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from '@/components/ui/alert-dialog';

export function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { currentUser } = useAuth();
    const { 
        contacts, 
        messages, 
        activeContactId, 
        setActiveContactId, 
        sendMessage, 
        markAsRead,
        deleteConversation,
        typingUsers,
        sendTypingStatus,
        unreadTotal
    } = useChat();

    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastTypingSent = useRef<number>(0);

    // Typing status sender logic
    useEffect(() => {
        if (newMessage && activeContactId) {
            const now = Date.now();
            if (now - lastTypingSent.current > 2000) {
                sendTypingStatus(activeContactId);
                lastTypingSent.current = now;
            }
        }
    }, [newMessage, activeContactId, sendTypingStatus]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeContactId]);

    // Mark as read when opening a conversation
    useEffect(() => {
        if (isOpen && activeContactId) {
            markAsRead(activeContactId);
        }
    }, [isOpen, activeContactId, messages, markAsRead]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        await sendMessage(newMessage);
        setNewMessage('');
    };

    if (!currentUser) return null;

    const activeContact = contacts.find(c => c.id === activeContactId);

    // Configuración visual de roles (igual que vista ejecutiva)
    const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
        owner:      { label: 'Propietario',   icon: Crown,       className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' },
        admin:      { label: 'Administrador', icon: ShieldCheck,  className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' },
        manager:    { label: 'Supervisor',    icon: ShieldCheck,  className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30' },
        employee:   { label: 'Empleado',      icon: UserIcon,    className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30' },
        superadmin: { label: 'Soporte',       icon: ShieldCheck,  className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30' },
    };

    const getRoleBadge = (role: string) => {
        const cfg = ROLE_CONFIG[role] ?? { label: role, icon: UserIcon, className: 'bg-muted text-muted-foreground border border-border' };
        const Icon = cfg.icon;
        return (
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full w-fit ${cfg.className}`}>
                <Icon className="h-2.5 w-2.5" />
                {cfg.label}
            </span>
        );
    };
    
    // Calculate which messages belong to the active conversation
    const activeMessages = activeContactId 
        ? messages.filter(
            m => (m.senderId === activeContactId && m.receiverId === currentUser.id) ||
                 (m.senderId === currentUser.id && m.receiverId === activeContactId)
          ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        : [];

    return (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="h-14 border-b border-border bg-primary/5 flex items-center px-4 justify-between shrink-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {activeContactId ? (
                                <button 
                                    onClick={() => setActiveContactId(null)}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
                                >
                                    <ChevronLeft className="w-5 h-5 text-foreground/70" />
                                </button>
                            ) : null}
                            
                            <div className="flex items-center gap-2 overflow-hidden">
                                {activeContactId && activeContact ? (
                                    <>
                                        <Avatar className="w-8 h-8 shrink-0">
                                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                                {activeContact.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            {getRoleBadge(activeContact.role)}
                                            <span className="font-semibold text-sm truncate leading-tight mt-0.5">{activeContact.name}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <MessageSquareMore className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-semibold text-sm">Mensajes</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {activeContactId && (
                                <button 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors shrink-0 text-red-500/70 hover:text-red-600"
                                    title="Eliminar conversación"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
                            >
                                <X className="w-5 h-5 text-foreground/70" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-muted/10 relative">
                        {!activeContactId ? (
                            /* Contacts List */
                            <ScrollArea className="h-full">
                                {contacts.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-3">
                                        <UserIcon className="w-12 h-12 opacity-20" />
                                        <p className="text-sm">No tienes contactos disponibles o no hay usuarios registrados.</p>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {contacts.map(contact => (
                                            <button
                                                key={contact.id}
                                                onClick={() => setActiveContactId(contact.id)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                                            >
                                                <div className="relative shrink-0">
                                                    <Avatar className="w-10 h-10 border border-border/50">
                                                        <AvatarFallback className="bg-primary/10 text-primary/70 text-xs">
                                                            {contact.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {contact.unreadCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                                                            {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <div className="flex flex-col gap-0.5">
                                                            {getRoleBadge(contact.role)}
                                                            <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                                                                {contact.name}
                                                            </span>
                                                        </div>
                                                        {contact.lastMessage && (
                                                            <span className="text-[10px] text-muted-foreground shrink-0 pl-2 mt-1">
                                                                {format(new Date(contact.lastMessage.createdAt), 'HH:mm', { locale: es })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center gap-2 mt-0.5">
                                                        <p className="text-xs text-muted-foreground truncate font-normal">
                                                            {contact.lastMessage ? contact.lastMessage.content : <span className="italic">Chatear ahora</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        ) : (
                            /* Conversation Area */
                            <div className="h-full flex flex-col">
                                <div 
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-4 space-y-4"
                                >
                                    {activeMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center px-4 space-y-2 opacity-50">
                                            <MessageSquareMore className="w-8 h-8 mb-2" />
                                            <p className="text-sm">Inicia la conversación.</p>
                                        </div>
                                    ) : (
                                        activeMessages.map((msg, index) => {
                                            const isMe = msg.senderId === currentUser.id;
                                            const msgDate = new Date(msg.createdAt);
                                            const prevMsgDate = index > 0 ? new Date(activeMessages[index - 1].createdAt) : null;
                                            
                                            // Lógica para mostrar el separador de fecha si cambia el día
                                            const showDateSeparator = !prevMsgDate || 
                                                format(msgDate, 'yyyy-MM-dd') !== format(prevMsgDate, 'yyyy-MM-dd');

                                            const showTime = index === 0 || 
                                                msgDate.getTime() - (prevMsgDate?.getTime() || 0) > 5 * 60 * 1000 || showDateSeparator;
                                            
                                            return (
                                                <React.Fragment key={msg.id}>
                                                    {showDateSeparator && (
                                                        <div className="flex justify-center my-6 sticky top-0 z-10">
                                                            <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground border border-border shadow-sm uppercase tracking-wider">
                                                                {format(msgDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') 
                                                                    ? 'Hoy' 
                                                                    : format(msgDate, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')
                                                                        ? 'Ayer'
                                                                        : format(msgDate, "eeee, d 'de' MMMM", { locale: es })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                                        {showTime && !showDateSeparator && (
                                                            <span className="text-[10px] text-muted-foreground/60 mb-1 mt-2 font-medium">
                                                                {format(msgDate, "HH:mm", { locale: es })}
                                                            </span>
                                                        )}
                                                        <div 
                                                            className={cn(
                                                                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm relative group",
                                                                isMe 
                                                                    ? "bg-primary text-primary-foreground rounded-br-none" 
                                                                    : "bg-white dark:bg-slate-800 border border-border/50 text-foreground rounded-bl-none"
                                                            )}
                                                        >
                                                            {msg.content}
                                                            <span className={cn(
                                                                "text-[8px] opacity-0 group-hover:opacity-60 transition-opacity absolute bottom-1",
                                                                isMe ? "-left-8 text-primary" : "-right-8 text-muted-foreground"
                                                            )}>
                                                                {format(msgDate, "HH:mm")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })
                                    )}

                                    {/* Indicador de escritura */}
                                    {activeContactId && typingUsers[activeContactId] && (
                                        <div className="flex items-start">
                                            <div className="bg-muted px-3 py-1.5 rounded-2xl rounded-bl-none shadow-sm animate-in fade-in slide-in-from-left-2">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex gap-0.5">
                                                        <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                        <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                        <span className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground italic font-medium">
                                                        {typingUsers[activeContactId]} escribiendo...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Input Area */}
                                <div className="p-3 bg-card border-t border-border shrink-0">
                                    <form onSubmit={handleSend} className="relative flex items-center">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Escribe un mensaje..."
                                            className="pr-12 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50"
                                        />
                                        <Button 
                                            type="submit" 
                                            size="icon"
                                            disabled={!newMessage.trim()} 
                                            className="absolute right-1 w-8 h-8 rounded-full"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary hover:scale-105 active:scale-95 transition-all relative outline-none focus:outline-none focus:ring-0"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquareMore className="w-6 h-6" />}
                
                {!isOpen && unreadTotal > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
                        {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                )}
            </button>

            {/* Custom Delete Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción borrará permanentemente todos los mensajes con {activeContact?.name}. 
                            No se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => activeContactId && deleteConversation(activeContactId)}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
