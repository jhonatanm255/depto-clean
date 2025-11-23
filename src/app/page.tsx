"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/core/loading-spinner';

export default function RootRedirectPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que la autenticación termine de cargar
    if (!authLoading) { 
      // Pequeño delay para evitar race conditions con AppLayout
      const timer = setTimeout(() => {
        if (currentUser) {
          router.replace('/dashboard'); 
        } else {
          router.replace('/login');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, currentUser, router]);

  // Mostrar loading mientras se determina la redirección
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner size={48} />
      <p className="ml-2 text-muted-foreground">
        {authLoading ? 'Inicializando...' : 'Redirigiendo...'}
      </p>
    </div>
  );
}
