
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppSidebar } from '@/components/core/app-sidebar';
import { HeaderMain } from '@/components/core/header-main';
import { SidebarProvider } from '@/components/ui/sidebar';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only perform redirects once authentication status is resolved
    if (!authLoading) {
      if (!currentUser && pathname !== '/login') {
        router.replace('/login');
      }
      // If user is logged in and somehow lands on /login (e.g. direct navigation), redirect to dashboard
      // Note: /login page itself doesn't use this AppLayout. This is a safeguard if this layout
      // were ever mistakenly applied to /login or a similar auth route.
      else if (currentUser && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [currentUser, authLoading, router, pathname]);

  // Case 1: Authentication is still loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Verificando autenticación...</p>
      </div>
    );
  }

  // Case 2: Auth is done, no user, and current path is NOT the login page.
  // This means a redirect to /login is imminent via the useEffect.
  // Show a loader to prevent flashing the app shell.
  if (!currentUser && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }
  
  // Case 3: Auth is done, user exists, but current path IS the login page.
  // This should ideally not happen as /login uses its own layout.
  // But if it did, a redirect to '/' is imminent. Show a loader.
  if (currentUser && pathname === '/login') {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Redirigiendo al panel principal...</p>
      </div>
    );
  }

  // If none of the above, user is authenticated and on an app page,
  // or (less likely for this layout) unauthenticated and on the login page (which would render {children}).
  // Render the main app structure.
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          {/* The login page (if it were part of {children}) should not show sidebar or header */}
          {pathname !== '/login' && <AppSidebar />}
          <div className="flex flex-1 flex-col">
            {pathname !== '/login' && <HeaderMain />}
            <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NextThemesProvider>
  );
}
