
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
      if (!currentUser && pathname !== '/login') { // /login page uses a different layout
        router.replace('/login');
      }
    }
  }, [currentUser, authLoading, router, pathname]);

  // Case 1: Authentication is still loading from AuthProvider/useLocalStorage
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Verificando autenticación (AppLayout)...</p>
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
        <p className="ml-2 text-muted-foreground">Redirigiendo a inicio de sesión (AppLayout)...</p>
      </div>
    );
  }
  
  // If user is authenticated and on an app page, render the main app structure.
  // Or if we are on the /login page (which has its own layout, so this part of AppLayout won't be used for /login).
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <HeaderMain />
            <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NextThemesProvider>
  );
}
