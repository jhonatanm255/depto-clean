
"use client";
import type { AppUser, UserRole, EmployeeProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useMemo, useCallback, useState }from 'react';
import { toast } from '@/hooks/use-toast';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseAuthUser 
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password_unused: string, role_unused: UserRole, actualPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@cleansweep.com";
const ADMIN_PASSWORD = "admin123"; 

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        let userRole: UserRole = 'employee';
        let userName: string | undefined = firebaseUser.displayName || firebaseUser.email || 'Usuario';
        let employeeProfileId: string | undefined = undefined;

        if (firebaseUser.email === ADMIN_EMAIL) {
          userRole = 'admin';
          userName = 'Usuario Administrador';
           setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userRole,
            name: userName,
          });
        } else {
          const q = query(collection(db, "employees"), where("authUid", "==", firebaseUser.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const employeeDoc = querySnapshot.docs[0];
            const employeeData = employeeDoc.data() as EmployeeProfile;
            userName = employeeData.name;
            employeeProfileId = employeeDoc.id;
            userRole = 'employee';
          } else {
            console.warn("Usuario de Firebase Auth sin perfil de empleado en Firestore:", firebaseUser.uid);
            await signOut(auth);
            setCurrentUser(null);
            setLoading(false);
            router.push('/login');
            return;
          }
           setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userRole,
            name: userName,
            employeeProfileId: employeeProfileId,
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, router]);

  const login = useCallback(async (email: string, password_unused: string, role_unused: UserRole, actualPassword?: string) => {
    setLoading(true);
    const providedEmail = email.toLowerCase();
    const providedPassword = actualPassword || password_unused;

    try {
      if (providedEmail === ADMIN_EMAIL) {
        // Primero, una verificación local de la contraseña del admin (esto es opcional si Firebase Auth es la única fuente de verdad)
        if (providedPassword === ADMIN_PASSWORD) {
          // Luego, el intento real de inicio de sesión con Firebase Authentication
          await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
          // onAuthStateChanged se encargará de setear currentUser y la lógica de redirección ya está en AppLayout/DashboardPage
          router.push('/dashboard'); 
        } else {
          // La contraseña local no coincide, no es necesario llamar a Firebase Auth
          throw new Error("Contraseña de administrador incorrecta.");
        }
      } else {
        if (!providedPassword) { // Asegurar que haya contraseña para empleados
           throw new Error("Contraseña requerida para empleados.");
        }
        await signInWithEmailAndPassword(auth, providedEmail, providedPassword);
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      let description = "Credenciales inválidas o error de red.";
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' || 
          error.code === 'auth/invalid-credential' || // Cubre varios casos de credenciales incorrectas
          error.message.includes("incorrecta")) { // Para el error local de admin
        description = "Email o contraseña incorrectos.";
      }
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: description,
      });
      setCurrentUser(null); 
    } finally {
      setLoading(false);
    }
  }, [auth, router]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión.",
      });
    } finally {
      setLoading(false);
    }
  }, [auth, router]);
  
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
