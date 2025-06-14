
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/core/loading-spinner';

export default function RootRedirectPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) { // Only redirect once auth state is resolved
      if (currentUser) {
        router.replace('/'); // Redirect to the main app dashboard (which should be (app)/page.tsx)
      } else {
        router.replace('/login');
      }
    }
  }, [authLoading, currentUser, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Inicializando estado de autenticación...</p>
      </div>
    );
  }

  // If not loading, and useEffect hasn't redirected yet, show a minimal placeholder.
  // This indicates the redirect is being processed.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Procesando redirección...</p>
      </div>
  );
}
