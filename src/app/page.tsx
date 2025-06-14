
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/core/loading-spinner';

export default function RootPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (currentUser) {
        // Si hay usuario y ya no está cargando, redirige a la página principal de la app (dashboard)
        // Esto es un fallback, ya que (app)/layout.tsx también maneja esto.
        // La idea es que / sea manejado por (app)/page.tsx
        router.replace('/'); 
      } else {
        // Si no hay usuario y ya no está cargando, redirige a login
        router.replace('/login');
      }
    }
  }, [authLoading, currentUser, router]);

  // Muestra un spinner mientras se determina el estado de autenticación y se redirige
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner size={48} />
    </div>
  );
}
