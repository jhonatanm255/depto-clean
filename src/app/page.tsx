
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/core/loading-spinner';

export default function RootPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is resolved
    if (!authLoading) {
      if (currentUser) {
        // User is logged in, redirect to the main app dashboard handled by (app)/page.tsx
        router.replace('/'); 
      } else {
        // User is not logged in, redirect to login
        router.replace('/login');
      }
    }
  }, [authLoading, currentUser, router]);

  // Show a spinner while determining auth state and redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner size={48} />
      <p className="ml-2 text-muted-foreground">Inicializando aplicación...</p>
    </div>
  );
}
