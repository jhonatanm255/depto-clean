
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
      if (currentUser && pathname === '/login') {
        router.replace('/');
      }
    }
  }, [currentUser, authLoading, router, pathname]);

  // Case 1: Authentication is still loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Case 2: Auth is done, no user, and not on login page (redirect to /login is imminent)
  if (!currentUser && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Case 3: Auth is done, user exists, but is on login page (redirect to / is imminent)
  if (currentUser && pathname === '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // If none of the above, user is authenticated and on an app page, or unauthenticated and on the login page.
  // The login page itself will be rendered via {children} if pathname is /login and !currentUser.
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
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
