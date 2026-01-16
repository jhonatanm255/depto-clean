import React, { createContext, useContext, useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate de importar tu cliente supabase configurado para RN
import { User, Session } from '@supabase/supabase-js';
import { AppUser, UserRole } from '../lib/types';
import { Alert } from 'react-native';

interface AuthContextType {
    currentUser: AppUser | null;
    loading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ProfileRow = {
    id: string;
    company_id: string | null;
    role: UserRole;
    full_name: string | null;
    email: string | null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const currentUserRef = useRef<AppUser | null>(null);

    // Mantener ref sincronizado con state
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    const hydrateUser = useCallback(async (user: User | null): Promise<boolean> => {
        if (!user) {
            setCurrentUser(null);
            return false;
        }

        try {
            console.log('[AuthContext] Cargando perfil para usuario:', user.id);

            // Estrategia 1: Consulta directa
            const { data, error } = await supabase
                .from('profiles')
                .select('company_id, role, full_name, email')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                console.error('[AuthContext] Error obteniendo perfil:', error);

                // Fallback a función RPC si la consulta falla (opcional, como en web)
                if (error.code !== 'PGRST116') { // PGRST116 es "no data found"
                    try {
                        const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile');
                        if (!rpcError && rpcData) {
                            const profile = rpcData as unknown as ProfileRow;
                            if (profile) {
                                setCurrentUser({
                                    id: user.id,
                                    email: user.email ?? null,
                                    role: profile.role,
                                    companyId: profile.company_id || '',
                                    name: profile.full_name ?? profile.email ?? user.email ?? 'Usuario',
                                    fullName: profile.full_name ?? undefined,
                                });
                                return true;
                            }
                        }
                    } catch (e) {
                        console.error("RPC fallback failed", e);
                    }
                }

                setCurrentUser(null);
                return false;
            }

            if (!data) {
                console.warn('[AuthContext] Perfil sin datos para usuario:', user.id);
                // Permitir acceso básico si no hay perfil? No, mejor fallar seguro.
                // O quizás es superadmin sin perfil en tabla pública?
                return false;
            }

            console.log('[AuthContext] ✓ Perfil cargado:', {
                role: data.role,
                company: data.company_id
            });

            setCurrentUser({
                id: user.id,
                email: user.email ?? null,
                role: data.role as UserRole,
                companyId: data.company_id || '',
                name: data.full_name ?? data.email ?? user.email ?? 'Usuario',
                fullName: data.full_name ?? undefined,
            });
            return true;

        } catch (err) {
            console.error('[AuthContext] Error inesperado en hydrateUser:', err);
            setCurrentUser(null);
            return false;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadSession = async () => {
            try {
                setLoading(true);
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session?.user) {
                    console.log('[AuthContext] Sesión encontrada, hidratando...');
                    await hydrateUser(session.user);
                } else {
                    console.log('[AuthContext] No hay sesión activa');
                }
            } catch (err) {
                console.error('[AuthContext] Error cargando sesión:', err);
                if (mounted) setCurrentUser(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            console.log(`[AuthContext] Auth state changed: ${event}`);

            if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setLoading(false);
            } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
                // Solo re-hidratar si el usuario cambió o si no tenemos perfil cargado
                if (!currentUserRef.current || currentUserRef.current.id !== session.user.id) {
                    await hydrateUser(session.user);
                }
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [hydrateUser]);

    const login = useCallback(async (email: string, password?: string) => {
        if (!password) {
            Alert.alert("Error", "Se requiere contraseña.");
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) throw error;

            if (data.session?.user) {
                await hydrateUser(data.session.user);
            }
        } catch (error: any) {
            console.error('[AuthContext] Login error:', error);
            Alert.alert("Error de Inicio de Sesión", error.message || "Credenciales inválidas");
        } finally {
            setLoading(false);
        }
    }, [hydrateUser]);

    const logout = useCallback(async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setCurrentUser(null);
        } catch (error: any) {
            console.error("Logout error", error);
            // Forzar limpieza local aunque falle el servidor
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const value = useMemo(() => ({ currentUser, loading, login, logout }),
        [currentUser, loading, login, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}
