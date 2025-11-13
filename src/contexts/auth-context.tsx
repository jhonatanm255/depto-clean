
"use client";
import type { AppUser, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useMemo, useCallback, useState }from 'react';
import { toast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ProfileRow = {
  id: string;
  company_id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const hydrateUser = useCallback(async (user: User | null): Promise<boolean> => {
    if (!user) {
      setCurrentUser(null);
      return false;
    }

    try {
      console.log('[AuthContext] Intentando cargar perfil para usuario:', user.id);
      const startTime = Date.now();
      
      // Realizar la consulta con timeout usando Promise.race
      const profileQuery = supabase
        .from('profiles')
        .select('company_id, role, full_name, email')
        .eq('id', user.id)
        .maybeSingle<ProfileRow>();
      
      // Crear una promesa de timeout que rechaza después de 5 segundos
      const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((_, reject) => {
        setTimeout(() => {
          reject(new Error('TIMEOUT: La consulta tardó más de 5 segundos'));
        }, 5000);
      });

      let result;
      try {
        result = await Promise.race([profileQuery, timeoutPromise]);
      } catch (raceError) {
        if (raceError instanceof Error && raceError.message === 'TIMEOUT: La consulta tardó más de 5 segundos') {
          console.error('[AuthContext] ⚠️ Timeout en consulta a profiles (5s)');
          console.error('[AuthContext] Posibles causas:');
          console.error('  - Problema de red/conectividad');
          console.error('  - Problema con políticas RLS');
          console.error('  - Problema con la base de datos de Supabase');
          setCurrentUser(null);
          return false;
        }
        throw raceError;
      }

      const { data, error } = result;
      const elapsed = Date.now() - startTime;
      console.log(`[AuthContext] Consulta completada en ${elapsed}ms`);

      if (error) {
        console.error('[AuthContext] Error obteniendo perfil:', error);
        // PGRST116 es "no rows returned", que es esperado si no hay perfil aún
        if (error.code !== 'PGRST116') {
          toast({
            variant: "destructive",
            title: "Error de perfil",
            description: "No se pudo cargar tu información. Intenta iniciar sesión nuevamente.",
          });
        }
        setCurrentUser(null);
        return false;
      }

      if (!data || !data.company_id) {
        console.warn('[AuthContext] Perfil sin company_id para usuario:', user.id);
        setCurrentUser(null);
        return false;
      }

      console.log('[AuthContext] ✓ Perfil cargado exitosamente:', {
        userId: user.id,
        companyId: data.company_id,
        role: data.role,
        elapsed: `${elapsed}ms`
      });

      setCurrentUser({
        id: user.id,
        email: user.email ?? null,
        role: data.role,
        companyId: data.company_id,
        name: data.full_name ?? data.email ?? user.email,
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
    let timeoutId: NodeJS.Timeout | null = null;

    const initSession = async () => {
      setLoading(true);
      console.log('[AuthContext] Iniciando carga de sesión...');
      
      // Timeout de seguridad: si después de 8 segundos no se ha resuelto, forzar loading = false
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('[AuthContext] ⚠️ Timeout en carga inicial de sesión (8s). Forzando loading = false');
          setLoading(false);
        }
      }, 8000);

      try {
        const sessionStartTime = Date.now();
        const { data: sessionData, error } = await supabase.auth.getSession();
        const sessionElapsed = Date.now() - sessionStartTime;
        console.log(`[AuthContext] getSession completado en ${sessionElapsed}ms`);
        
        if (error) {
          console.error('[AuthContext] Error obteniendo sesión inicial:', error);
          if (mounted) {
            setLoading(false);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          return;
        }
        
        if (!mounted) {
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

        if (sessionData?.session?.user) {
          console.log('[AuthContext] Sesión encontrada, hidratando usuario...');
          const hydrateStartTime = Date.now();
          await hydrateUser(sessionData.session.user);
          const hydrateElapsed = Date.now() - hydrateStartTime;
          console.log(`[AuthContext] hydrateUser completado en ${hydrateElapsed}ms`);
        } else {
          console.log('[AuthContext] No hay sesión activa');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('[AuthContext] Error inesperado en initSession:', err);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (mounted) {
          console.log('[AuthContext] Finalizando carga de sesión, estableciendo loading = false');
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // No actualizar loading durante cambios de autenticación para evitar bloqueos
      // Solo hidratar el usuario silenciosamente
      if (mounted) {
        try {
          await hydrateUser(session?.user ?? null);
        } catch (err) {
          console.error('Error en onAuthStateChange:', err);
        }
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      authListener.subscription.unsubscribe();
    };
  }, [hydrateUser]);

  const login = useCallback(async (email: string, password?: string) => {
    setLoading(true);
    const providedEmail = email.trim().toLowerCase();

    if (!password) {
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: "Se requiere contraseña.",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: providedEmail,
        password,
      });

      if (error) {
        console.error('Error de inicio de sesión:', error);
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: error.message ?? "Credenciales inválidas o error de red.",
        });
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const success = await hydrateUser(data.session?.user ?? null);
      if (success) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error inesperado en login:', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [hydrateUser, router]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setCurrentUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión. Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  }, [router]);
  
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
