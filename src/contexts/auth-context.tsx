
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
import { db } from '@/lib/firebase'; // Asegúrate que db está exportado de firebase.ts
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, password_unused: string, role_unused: UserRole, actualPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
  // Ya no necesitamos setCurrentUser directamente, se maneja con onAuthStateChanged
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales fijas para el admin
const ADMIN_EMAIL = "admin@cleansweep.com";
const ADMIN_PASSWORD = "admin123"; // Esta contraseña es solo para el login inicial del admin

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        // Usuario autenticado con Firebase Auth
        // Ahora determinamos si es admin o empleado y obtenemos datos de Firestore
        let userRole: UserRole = 'employee'; // Default a empleado
        let userName: string | undefined = firebaseUser.displayName || firebaseUser.email || 'Usuario';
        let employeeProfileId: string | undefined = undefined;

        if (firebaseUser.email === ADMIN_EMAIL) {
          userRole = 'admin';
          userName = 'Usuario Admin'; // Nombre fijo para el admin
           setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userRole,
            name: userName,
          });
        } else {
          // Es un empleado, buscamos su perfil en Firestore por authUid
          const q = query(collection(db, "employees"), where("authUid", "==", firebaseUser.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const employeeDoc = querySnapshot.docs[0];
            const employeeData = employeeDoc.data() as EmployeeProfile;
            userName = employeeData.name;
            employeeProfileId = employeeDoc.id; // ID del documento de perfil de empleado
            userRole = 'employee';
          } else {
            // No se encontró perfil, podría ser un error o un usuario que no debería estar aquí
            console.warn("Usuario de Firebase Auth sin perfil de empleado en Firestore:", firebaseUser.uid);
            // Considerar desloguear o manejar este caso
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
        // No hay usuario autenticado
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, router]);

  const login = useCallback(async (email: string, password_unused: string, role_unused: UserRole, actualPassword?: string) => {
    setLoading(true);
    const providedEmail = email.toLowerCase();
    const providedPassword = actualPassword || password_unused; // Usar actualPassword si se provee

    try {
      if (providedEmail === ADMIN_EMAIL) {
        if (providedPassword === ADMIN_PASSWORD) {
          await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
          // onAuthStateChanged se encargará de setear currentUser y redirigir
          router.push('/dashboard');
        } else {
          throw new Error("Contraseña de administrador incorrecta.");
        }
      } else {
        // Intento de login como empleado con sus credenciales individuales
        if (!actualPassword) {
           throw new Error("Contraseña requerida para empleados.");
        }
        await signInWithEmailAndPassword(auth, providedEmail, actualPassword);
        // onAuthStateChanged se encargará de setear currentUser y redirigir
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      let description = "Credenciales inválidas o error de red.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.message.includes("incorrecta")) {
        description = "Email o contraseña incorrectos.";
      } else if (error.code === 'auth/invalid-credential') {
        description = "Credenciales inválidas proporcionadas.";
      }
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: description,
      });
      setCurrentUser(null); // Asegurar que no quede un usuario viejo
    } finally {
      setLoading(false);
    }
  }, [auth, router]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged se encargará de setear currentUser a null
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
