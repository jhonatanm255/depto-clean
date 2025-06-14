
"use client";
import type { User, UserRole } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_ADMIN_USER: User = { id: 'admin001', email: 'admin@cleansweep.com', role: 'admin', name: 'Admin User' };
const MOCK_EMPLOYEE_USER: User = { id: 'emp001', email: 'employee@cleansweep.com', role: 'employee', name: 'Cleaning Staff' };


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser, storageLoading] = useLocalStorage<User | null>('currentUser', null);
  const router = useRouter();

  // The main loading state is now directly from useLocalStorage's third return value (storageLoading)
  const loading = storageLoading;

  const login = (email: string, role: UserRole) => {
    // In a real app, you'd verify credentials against a backend
    if (role === 'admin' && email.toLowerCase() === MOCK_ADMIN_USER.email.toLowerCase()) {
      setCurrentUser(MOCK_ADMIN_USER);
      router.push('/');
    } else if (role === 'employee' && email.toLowerCase() === MOCK_EMPLOYEE_USER.email.toLowerCase()) {
      setCurrentUser(MOCK_EMPLOYEE_USER);
       router.push('/');
    } else {
      // Handle login failure (e.g., show an error message)
      console.error('Login failed: Invalid credentials or role.');
      alert('Login failed. Check email and role.');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };
  
  const value = useMemo(() => ({ currentUser, setCurrentUser, login, logout, loading }), [currentUser, setCurrentUser, login, logout, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
