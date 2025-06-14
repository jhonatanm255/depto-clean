
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
    if (!authLoading && !currentUser && pathname !== '/login') {
      router.replace('/login');
    }
  }, [currentUser, authLoading, router, pathname]);

  // If auth is still loading, or if not authenticated and not on login page, show spinner.
  if (authLoading || (!currentUser && pathname !== '/login')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }
  
  // If user is logged in but tries to access /login, redirect to dashboard
  // This case should ideally not happen if navigation is correct, but good as a safeguard.
  if (currentUser && pathname === '/login') {
    router.replace('/'); // Redirect to dashboard
    return ( // Show spinner during redirection
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // If we reach here, user is authenticated or it's the login page (which is handled by its own layout)
  // For authenticated users, render the app layout with sidebar and header
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
