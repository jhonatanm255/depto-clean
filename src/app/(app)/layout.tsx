
"use client";
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
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
  const [forceRedirect, setForceRedirect] = useState(false);

  useEffect(() => {
    // Timeout de seguridad: 35 segundos (más que el timeout de auth-context de 30s)
    // para dar tiempo a que auth-context complete su carga
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (authLoading) {
      const timeoutDuration = 35000; // 35 segundos, más que el timeout de auth-context
      timeoutId = setTimeout(() => {
        console.warn(`[AppLayout] ⚠️ Timeout de seguridad: authLoading lleva más de 35s`);
        if (!currentUser && pathname !== '/login') {
          setForceRedirect(true);
          router.replace('/login');
        }
      }, timeoutDuration);
    }

    // Solo redirigir cuando la autenticación haya terminado de cargar
    // No forzar redirección durante la carga inicial
    if (!authLoading) {
      if (!currentUser) {
        // Si no hay usuario y no estamos en login, redirigir a login
        if (pathname !== '/login' && pathname !== '/register') {
          console.log('[AppLayout] No hay usuario, redirigiendo a /login');
          router.replace('/login');
        }
      } else if (currentUser && (pathname === '/login' || pathname === '/register')) {
        // Si hay usuario y estamos en login/register, redirigir según su rol
        if (currentUser.role === 'superadmin') {
          console.log('[AppLayout] Superadmin autenticado, redirigiendo a /superadmin/dashboard');
          router.replace('/superadmin/dashboard');
        } else {
          console.log('[AppLayout] Usuario autenticado, redirigiendo a /dashboard');
          router.replace('/dashboard');
        }
      } else if (currentUser?.role === 'superadmin' && pathname === '/dashboard') {
        // Si es superadmin y está en dashboard normal, redirigir a superadmin dashboard
        console.log('[AppLayout] Superadmin en dashboard normal, redirigiendo a /superadmin/dashboard');
        router.replace('/superadmin/dashboard');
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [currentUser, authLoading, router, pathname, isMobile]);

  // Mostrar loading solo si realmente está cargando y no hay que forzar redirección
  if (authLoading && !forceRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Verificando autenticación (AppLayout)...</p>
      </div>
    );
  }

  // Si no hay usuario después de cargar, redirigir o mostrar mensaje
  if (!currentUser) {
    // Si estamos en login, mostrar el contenido con navbar
    if (pathname === '/login' || pathname === '/register') {
      return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen w-full flex-col">
            <HeaderMain />
            <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
              {children}
            </main>
          </div>
        </NextThemesProvider>
      );
    }
    
    // Si no estamos en login y no hay usuario, mostrar loading mientras redirige
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-2 text-muted-foreground">Redirigiendo a inicio de sesión (AppLayout)...</p>
      </div>
    );
  }
  
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <DataProvider>
        <NotificationsProvider>
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
        </NotificationsProvider>
      </DataProvider>
    </NextThemesProvider>
  );
}
