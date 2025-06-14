
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
  login: (email: string, actualPassword?: string) => Promise<void>; // Simplified parameters
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "admin@cleansweep.com";
// ADMIN_PASSWORD constant is no longer used for the login check itself,
// but the instruction to use 'admin123' (or similar) in Firebase setup remains crucial.

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
             setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userRole,
              name: userName,
              employeeProfileId: employeeProfileId,
            });
          } else {
            console.warn("Usuario de Firebase Auth sin perfil de empleado en Firestore:", firebaseUser.uid);
            // Consider logging out the user if no profile is found after successful auth
            // This prevents a partially logged-in state.
            await signOut(auth); 
            setCurrentUser(null);
            // router.push('/login'); // Avoid push here if it causes loops with AppLayout
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]); // Removed router from dependencies here as push was removed from this effect

  // Simplified login function: always uses email and password from form.
  // Firebase Auth is the sole decider of validity.
  const login = useCallback(async (email: string, password?: string) => {
    setLoading(true);
    const providedEmail = email.toLowerCase();
    
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
      await signInWithEmailAndPassword(auth, providedEmail, password);
      // Successful login will trigger onAuthStateChanged, which updates currentUser.
      // AppLayout or DashboardPage will handle redirection based on currentUser.
      // We can push to dashboard here as a direct consequence of successful login action.
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      let description = "Credenciales inválidas o error de red.";
      // auth/invalid-credential covers user-not-found, wrong-password, etc.
      if (error.code === 'auth/invalid-credential') {
        description = "Email o contraseña incorrectos.";
      }
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: description,
      });
      setCurrentUser(null); // Clear user on failed login
    } finally {
      setLoading(false);
    }
  }, [auth, router]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged will set currentUser to null
      router.push('/login'); // Redirect to login after sign out
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
