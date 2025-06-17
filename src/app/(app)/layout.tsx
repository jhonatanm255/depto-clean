
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
import { BottomNavigationBar } from '@/components/core/bottom-navigation-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser && pathname !== '/login') { 
        router.replace('/login');
      } else if (currentUser && pathname === '/login') { 
        router.replace('/dashboard');
      }
    }
  }, [currentUser, authLoading, router, pathname]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Verificando autenticación (AppLayout)...</p>
      </div>
    );
  }

  if (!currentUser && pathname !== '/login') { 
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Redirigiendo a inicio de sesión (AppLayout)...</p>
      </div>
    );
  }
  
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider> {/* SidebarProvider todavía puede ser útil para el estado del sidebar de escritorio si se usa useSidebar() allí */}
        <div className="flex min-h-screen w-full">
          {!isMobile && <AppSidebar />} {/* AppSidebar solo para escritorio */}
          <div className="flex flex-1 flex-col">
            <HeaderMain />
            <main className={cn(
              "flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8",
              isMobile && "pb-20" // Padding para la barra de navegación inferior (h-16 + p-4 usual)
            )}>
              {children}
            </main>
            {isMobile && <BottomNavigationBar />} {/* BottomNavigationBar solo para móvil */}
          </div>
        </div>
      </SidebarProvider>
    </NextThemesProvider>
  );
}
