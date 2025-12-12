
"use client";
import type { AppUser, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useMemo, useCallback, useState, useRef }from 'react';
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
  company_id: string | null; // Nullable para superadmin
  role: UserRole;
  full_name: string | null;
  email: string | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const currentUserRef = useRef<AppUser | null>(null);
  const hasValidSessionRef = useRef<boolean>(false); // Track si hay sesión válida en Supabase
  
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
      const startTime = Date.now();
      
      // Estrategia 1: Intentar consulta directa primero (más rápida si funciona)
      console.log('[AuthContext] Intentando consulta directa a profiles...');
      
      const profileQuery = supabase
        .from('profiles')
        .select('company_id, role, full_name, email')
        .eq('id', user.id)
        .maybeSingle<ProfileRow>();
      
      // Timeout de 5 segundos para la consulta directa
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('TIMEOUT: La consulta directa tardó más de 5 segundos'));
        }, 5000);
      });

      let result: { data: ProfileRow | null; error: any } | undefined;
      let useRpcFallback = false;
      
      try {
        result = await Promise.race([profileQuery, timeoutPromise]);
        // Si llegamos aquí, la consulta completó antes del timeout
        if (timeoutId) clearTimeout(timeoutId);
      } catch (raceError) {
        // Limpiar timeout si aún está activo
        if (timeoutId) clearTimeout(timeoutId);
        
        if (raceError instanceof Error && raceError.message.includes('TIMEOUT')) {
          console.warn('[AuthContext] ⚠️ Consulta directa muy lenta, intentando con función RPC...');
          useRpcFallback = true;
        } else {
          // Si es otro error, intentar RPC también
          console.warn('[AuthContext] ⚠️ Error en consulta directa, intentando con función RPC...');
          useRpcFallback = true;
        }
      }

      // Estrategia 2: Si la consulta directa falló o fue lenta, usar función RPC
      if (useRpcFallback) {
        console.log('[AuthContext] Usando función RPC get_my_profile() como alternativa...');
        const rpcStartTime = Date.now();
        
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile');
          
          if (rpcError) {
            console.error('[AuthContext] Error en función RPC:', rpcError);
            // Si la función RPC no existe, intentar con la consulta directa de nuevo
            if (rpcError.message?.includes('function') || rpcError.code === '42883') {
              console.warn('[AuthContext] Función RPC no existe, usando consulta directa con timeout más largo...');
              const { data: directData, error: directError } = await supabase
                .from('profiles')
                .select('company_id, role, full_name, email')
                .eq('id', user.id)
                .maybeSingle<ProfileRow>();
              
              if (directError) {
                throw directError;
              }
              
              result = { data: directData, error: null };
            } else {
              throw rpcError;
            }
          } else if (rpcData) {
            // La función RPC retorna un JSON, necesitamos convertirlo
            const profile = rpcData as unknown as ProfileRow;
            if (profile && profile.company_id) {
              result = { data: profile, error: null };
              const rpcElapsed = Date.now() - rpcStartTime;
              console.log(`[AuthContext] ✓ Función RPC completada en ${rpcElapsed}ms`);
            } else {
              // El perfil no existe
              result = { data: null, error: { code: 'PGRST116', message: 'No rows returned' } };
            }
          } else {
            // No hay datos, el perfil no existe
            result = { data: null, error: { code: 'PGRST116', message: 'No rows returned' } };
          }
        } catch (rpcError) {
          console.error('[AuthContext] Error en función RPC:', rpcError);
          // Si RPC también falla, mostrar error detallado
          const elapsed = Date.now() - startTime;
          console.error(`[AuthContext] ⚠️ TIMEOUT CRÍTICO: Todas las consultas fallaron después de ${elapsed}ms`);
          console.error(`[AuthContext] Usuario ID: ${user.id}`);
          console.error(`[AuthContext] Email: ${user.email || 'N/A'}`);
          console.error('[AuthContext] ═══════════════════════════════════════════════════════');
          console.error('[AuthContext] PROBLEMA SERIO: No se pudo cargar el perfil');
          console.error('[AuthContext] ═══════════════════════════════════════════════════════');
          console.error('[AuthContext] POSIBLES CAUSAS:');
          console.error('  1. ⚠️ Tu perfil NO existe en la tabla profiles');
          console.error('  2. ⚠️ Políticas RLS bloqueando la consulta (muy lentas)');
          console.error('  3. ⚠️ La función RPC get_my_profile() no existe o tiene errores');
          console.error('  4. ⚠️ Supabase muy lento o caído');
          console.error('  5. ⚠️ Problema de conectividad de red');
          console.error('[AuthContext] ═══════════════════════════════════════════════════════');
          console.error('[AuthContext] SOLUCIÓN INMEDIATA:');
          console.error('[AuthContext] 1. Ve a Supabase Dashboard → SQL Editor');
          console.error('[AuthContext] 2. Ejecuta: SELECT * FROM profiles WHERE id = \'' + user.id + '\';');
          console.error('[AuthContext] 3. Si NO hay resultado, tu perfil NO existe. Crea uno manualmente.');
          console.error('[AuthContext] 4. Si hay resultado pero es lento, ejecuta el script SOLUCION_LOGIN_TIMEOUT.sql');
          console.error('[AuthContext] 5. Verifica que la función get_my_profile() existe: SELECT * FROM pg_proc WHERE proname = \'get_my_profile\';');
          console.error('[AuthContext] ═══════════════════════════════════════════════════════');
          
          toast({
            variant: "destructive",
            title: "Error crítico: No se pudo cargar tu perfil",
            description: `No se pudo cargar tu perfil después de múltiples intentos. Ve a Supabase Dashboard y ejecuta: SELECT * FROM profiles WHERE id = '${user.id}'; Si no hay resultado, tu perfil no existe y debes crearlo manualmente. Revisa SOLUCION_LOGIN_TIMEOUT.sql para más ayuda.`,
          });
          setCurrentUser(null);
          return false;
        }
      }

      if (!result) {
        console.error('[AuthContext] No se obtuvo resultado de la consulta');
        setCurrentUser(null);
        return false;
      }

      const { data, error } = result;
      const elapsed = Date.now() - startTime;
      
      if (elapsed > 3000) {
        console.warn(`[AuthContext] ⚠️ Consulta lenta: ${elapsed}ms`);
      } else {
        console.log(`[AuthContext] Consulta completada en ${elapsed}ms`);
      }

      if (error) {
        console.error('[AuthContext] Error obteniendo perfil:', error);
        
        // PGRST116 es "no rows returned", que es esperado si no hay perfil aún
        if (error.code === 'PGRST116') {
          console.warn('[AuthContext] Usuario sin perfil en la tabla profiles');
          setCurrentUser(null);
          return false;
        }
        
        // Otros errores
        console.error('[AuthContext] Detalles del error:', {
          code: error.code,
          message: error.message,
        });
        
        toast({
          variant: "destructive",
          title: "Error al cargar perfil",
          description: "No se pudo cargar tu información. Intenta iniciar sesión nuevamente.",
        });
        setCurrentUser(null);
        return false;
      }

      // Superadmin puede no tener company_id
      if (!data) {
        console.warn('[AuthContext] Perfil sin datos para usuario:', user.id);
        return false;
      }

      // Si no es superadmin y no tiene company_id, hay un problema
      if (data.role !== 'superadmin' && !data.company_id) {
        console.warn('[AuthContext] Perfil sin company_id para usuario no-superadmin:', user.id);
        console.warn('[AuthContext] ⚠️ IMPORTANTE: La sesión de Supabase sigue válida, solo el perfil tiene problemas');
        return false;
      }

      console.log('[AuthContext] ✓ Perfil cargado:', {
        userId: user.id,
        companyId: data.company_id || '(superadmin)',
        role: data.role,
        elapsed: `${elapsed}ms`
      });

      // Actualizar el usuario con la información completa de perfil (sobrescribiendo el provisional)
      setCurrentUser({
        id: user.id,
        email: user.email ?? null,
        role: data.role,
        companyId: data.company_id || '', // Superadmin tiene companyId vacío
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
    let isInitializing = true;

    // Función simple para cargar sesión (rápida: primero usuario mínimo, luego perfil en segundo plano)
    const loadSession = async () => {
      if (!mounted) return;

      try {
        setLoading(true);
        // Timeout de seguridad para evitar que getSession se quede colgado indefinidamente
        let sessionTimeoutId: NodeJS.Timeout | undefined;
        const sessionTimeoutPromise = new Promise<never>((_, reject) => {
          sessionTimeoutId = setTimeout(() => {
            reject(new Error('TIMEOUT: getSession tardó más de 15 segundos'));
          }, 15000);
        });

        const getSessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([
          getSessionPromise,
          sessionTimeoutPromise,
        ] as const).catch((err) => {
          if (err instanceof Error && err.message.includes('TIMEOUT')) {
            console.error('[AuthContext] ⚠️ Timeout en getSession (15s)');
          } else {
            console.error('[AuthContext] Error inesperado en getSession:', err);
          }
          return { data: { session: null }, error: err } as any;
        });

        if (sessionTimeoutId) {
          clearTimeout(sessionTimeoutId);
        }
        
        if (error instanceof Error) {
          console.error('[AuthContext] Error obteniendo sesión:', error);
          if (mounted) {
            setCurrentUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          hasValidSessionRef.current = true;
          console.log('[AuthContext] Sesión encontrada, creando usuario mínimo y cargando perfil en segundo plano...');

          // 1) Usuario mínimo inmediato para que la app pueda seguir
          if (mounted) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email ?? null,
              role: 'employee' as UserRole, // rol provisional hasta cargar perfil real
              companyId: '',
              name: session.user.email || 'Usuario',
            });
          }

          // 2) Cargar perfil completo en segundo plano (sin bloquear la UI)
          hydrateUser(session.user).then((success) => {
            if (!success) {
              console.warn('[AuthContext] Perfil no cargado, se mantiene usuario mínimo');
            }
          }).catch((err) => {
            console.error('[AuthContext] Error hidratando perfil en segundo plano:', err);
          });
        } else {
          hasValidSessionRef.current = false;
          if (mounted) {
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Error cargando sesión:', err);
        if (mounted) {
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          isInitializing = false;
        }
      }
    };

    // Cargar sesión inicial
    loadSession();

    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log(`[AuthContext] Auth state: ${event}`, session ? 'con sesión' : 'sin sesión');

      if (event === 'SIGNED_OUT') {
        hasValidSessionRef.current = false;
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          hasValidSessionRef.current = true;
          // Crear usuario mínimo inmediatamente si no existe
          if (!currentUserRef.current && mounted) {
            setCurrentUser({
              id: session.user.id,
              email: session.user.email ?? null,
              role: 'employee' as UserRole,
              companyId: '',
              name: session.user.email || 'Usuario',
            });
          }

          // Solo hidratar perfil si:
          // 1. Es SIGNED_IN (nuevo login) - siempre hidratar
          // 2. Es TOKEN_REFRESHED pero el usuario no está completamente cargado (sin companyId)
          // Esto evita recargas innecesarias cuando solo se refresca el token
          const shouldHydrate = event === 'SIGNED_IN' || 
            (event === 'TOKEN_REFRESHED' && (!currentUserRef.current || !currentUserRef.current.companyId));
          
          if (shouldHydrate) {
            // Hidratar perfil en segundo plano
            hydrateUser(session.user).then((success) => {
              if (!success) {
                console.warn('[AuthContext] Perfil no cargado tras SIGNED_IN/TOKEN_REFRESHED, se mantiene usuario mínimo');
              }
            }).catch((err) => {
              console.error('[AuthContext] Error hidratando perfil tras SIGNED_IN/TOKEN_REFRESHED:', err);
            });
          } else {
            console.log('[AuthContext] TOKEN_REFRESHED: Usuario ya está completamente cargado, omitiendo re-hidratación');
          }
        }
      }

      // INITIAL_SESSION se maneja automáticamente por getSession
      if (event === 'INITIAL_SESSION' && session?.user && !isInitializing) {
        hasValidSessionRef.current = true;
        if (!currentUserRef.current && mounted) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email ?? null,
            role: 'employee' as UserRole,
            companyId: '',
            name: session.user.email || 'Usuario',
          });
        }

        // Hidratar perfil en segundo plano también en este caso
        hydrateUser(session.user).then((success) => {
          if (!success) {
            console.warn('[AuthContext] Perfil no cargado en INITIAL_SESSION, se mantiene usuario mínimo');
          }
        }).catch((err) => {
          console.error('[AuthContext] Error hidratando perfil en INITIAL_SESSION:', err);
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateUser]);

  const login = useCallback(async (email: string, password?: string) => {
    if (!password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Se requiere contraseña.",
      });
      return;
    }

    setLoading(true);
    const providedEmail = email.trim().toLowerCase();

    // Timeout más largo para signInWithPassword (15 segundos) debido a problemas de red
    let signInTimeoutId: NodeJS.Timeout | undefined;
    const signInTimeoutPromise = new Promise<never>((_, reject) => {
      signInTimeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT: signInWithPassword tardó más de 15 segundos'));
      }, 15000);
    });

    try {
      console.log('[AuthContext] Intentando iniciar sesión para:', providedEmail);
      const loginStartTime = Date.now();

      // Primero autenticar (con timeout corto de 5s)
      const signInPromise = supabase.auth.signInWithPassword({
        email: providedEmail,
        password,
      });

      const { data, error } = await Promise.race([signInPromise, signInTimeoutPromise]);

      if (signInTimeoutId) clearTimeout(signInTimeoutId);

      const signInElapsed = Date.now() - loginStartTime;
      console.log(`[AuthContext] signInWithPassword completado en ${signInElapsed}ms`);

      if (error) {
        console.error('[AuthContext] Error de inicio de sesión:', error);
        
        let errorMessage = "Credenciales inválidas o error de conexión.";
        
        // Mensajes de error más específicos
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('Invalid credentials')) {
          errorMessage = "Correo electrónico o contraseña incorrectos.";
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = "Por favor, confirma tu correo electrónico antes de iniciar sesión.";
        } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
          errorMessage = "Error de conexión. Verifica tu conexión a internet.";
        }
        
        toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: errorMessage,
        });
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      if (!data.session?.user) {
        console.error('[AuthContext] No se recibió usuario en la sesión');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo iniciar sesión. Intenta nuevamente.",
        });
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Sesión iniciada: crear usuario mínimo inmediato para que la UX sea rápida
      console.log('[AuthContext] Sesión iniciada, creando usuario mínimo y cargando perfil en segundo plano...');
      const totalElapsed = Date.now() - loginStartTime;
      console.log(`[AuthContext] Login (auth) completado en ${totalElapsed}ms`);
      
      if (data.session?.user) {
        hasValidSessionRef.current = true;

        // Usuario mínimo inmediato
        setCurrentUser({
          id: data.session.user.id,
          email: data.session.user.email ?? null,
          role: 'employee' as UserRole,
          companyId: '',
          name: data.session.user.email || 'Usuario',
        });

        // Hidratar perfil en segundo plano (no bloquea la redirección)
        hydrateUser(data.session.user).then((success) => {
          if (success) {
            console.log('[AuthContext] Perfil cargado correctamente tras login');
          } else {
            console.warn('[AuthContext] Perfil no cargado tras login, se mantiene usuario mínimo');
          }
        }).catch((err) => {
          console.error('[AuthContext] Error hidratando perfil tras login:', err);
        });
        
        // Verificar que la sesión se guardó
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            const stored = localStorage.getItem('sb-auth-token');
            console.log('[AuthContext] Sesión en localStorage:', stored ? 'SÍ ✓' : 'NO ✗');
            if (!stored) {
              console.error('[AuthContext] ⚠️ CRÍTICO: Sesión NO guardada. Forzando guardado...');
              // Forzar guardado manualmente
              const sessionStr = JSON.stringify(data.session);
              localStorage.setItem('sb-auth-token', sessionStr);
            }
          }, 200);
        }
        
        // Redirigir inmediatamente sin esperar a hydrateUser
        router.push('/dashboard');
      } else {
        console.log('[AuthContext] Login falló: no hay sesión');
      }
    } catch (err) {
      if (signInTimeoutId) clearTimeout(signInTimeoutId);
      
      if (err instanceof Error && err.message.includes('TIMEOUT')) {
        if (err.message.includes('signInWithPassword')) {
          console.error('[AuthContext] ⚠️ Timeout en signInWithPassword (15s)');
          toast({
            variant: "destructive",
            title: "Timeout",
            description: "La autenticación está tardando demasiado. Verifica tu conexión e intenta nuevamente.",
          });
        } else {
          // El timeout de hydrateUser ya mostró su mensaje
          console.error('[AuthContext] ⚠️ Timeout en hydrateUser');
        }
      } else {
        console.error('[AuthContext] Error inesperado en login:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Ocurrió un error inesperado. Intenta nuevamente.",
        });
      }
      setCurrentUser(null);
    } finally {
      // Asegurar que loading siempre se resetee, incluso si hay errores
      setLoading(false);
    }
  }, [hydrateUser, router]);

  const logout = useCallback(async () => {
    console.log('[AuthContext] Iniciando logout...');
    
    // Limpiar inmediatamente para respuesta rápida
    setCurrentUser(null);
    setLoading(false);
    
    // Redirigir inmediatamente sin esperar signOut
    router.push('/login');
    
    // Hacer signOut en segundo plano (no bloqueante)
    supabase.auth.signOut().catch((error) => {
      console.error('[AuthContext] Error al cerrar sesión en segundo plano:', error);
      // No mostrar error al usuario ya que ya lo redirigimos
    });
    
    console.log('[AuthContext] Logout iniciado (redirigiendo inmediatamente)');
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
