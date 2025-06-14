
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
        <p className="ml-2 text-muted-foreground">Inicializando estado de autenticación (Root)...</p>
      </div>
    );
  }

  // If not authLoading, useEffect is about to redirect (or has already started). Show a placeholder.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Procesando redirección (Root)...</p>
      </div>
  );
}
