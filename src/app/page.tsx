
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

// This page is now a pure redirector based on auth state.
// It should not display any significant UI itself.
// The root loading.tsx or (app)/layout.tsx will handle visual loading states.
export default function RootRedirectPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is resolved
    if (!authLoading) {
      if (currentUser) {
        // User is logged in, redirect to the main app dashboard.
        // This relies on (app)/page.tsx handling the '/' route within the app layout.
        router.replace('/');
      } else {
        // User is not logged in, redirect to login.
        router.replace('/login');
      }
    }
  }, [authLoading, currentUser, router]);

  // Return null. If redirects are slow or authLoading is stuck true,
  // Next.js will show src/app/loading.tsx or the loader in (app)/layout.tsx.
  return null;
}
