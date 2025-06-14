
"use client";
import type { User, UserRole } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ADMIN_USER: User = { id: 'admin001', email: 'admin@cleansweep.com', role: 'admin', name: 'Usuario Admin' };
const MOCK_EMPLOYEE_USER: User = { id: 'emp001', email: 'employee@cleansweep.com', role: 'employee', name: 'Personal de Limpieza' };


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser, storageInitialized] = useLocalStorage<User | null>('currentUser', null);
  const router = useRouter();

  const loading = !storageInitialized; // Auth is loading if storage is NOT yet initialized

  const login = useCallback((email: string, role: UserRole) => {
    if (role === 'admin' && email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase()) {
      setCurrentUser(MOCK_ADMIN_USER);
      router.push('/'); 
    } else if (role === 'employee' && email.toLowerCase() === MOCK_EMPLOYEE_USER.email.toLowerCase()) {
      setCurrentUser(MOCK_EMPLOYEE_USER);
       router.push('/'); 
    } else {
      console.error('Login failed: Invalid credentials or role.');
      toast({
          variant: "destructive",
          title: "Error de inicio de sesión",
          description: "Credenciales inválidas. Por favor, verifica tu email, contraseña y rol.",
      });
    }
  }, [setCurrentUser, router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    router.push('/login'); 
  }, [setCurrentUser, router]);
  
  const value = useMemo(() => ({ currentUser, setCurrentUser, login, logout, loading }), 
    [currentUser, setCurrentUser, login, logout, loading]
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
