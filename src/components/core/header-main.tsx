
"use client";
import React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Sun, PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar"; // Todavía puede ser usado por AppSidebar desktop
import { useTheme } from "next-themes";
import { useIsMobile } from '@/hooks/use-mobile'; // Para ocultar el botón del panel
import { NotificationsBell } from '@/components/core/notifications-bell';

function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ width: '40px', height: '40px' }} />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Cambiar tema"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}

export function HeaderMain() {
  const { currentUser, logout } = useAuth();
  const { company } = useData();
  const { toggleSidebar } = useSidebar(); 
  const isMobileView = useIsMobile(); // Hook para determinar si es vista móvil

  const getInitials = (name?: string | null) => {
    if (!name) return "CS"; 
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const displayName = company?.displayName ?? currentUser?.name ?? currentUser?.email ?? 'Usuario';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-sidebar text-sidebar-foreground px-4 sm:px-6">
      <div className="flex items-center gap-2">
        {/* Ocultar el botón PanelLeft en móvil ya que usamos BottomNavigationBar */}
        {!isMobileView && ( 
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Abrir/cerrar panel lateral"
            className="md:hidden" // Aseguramos que solo se muestre en desktop si es parte del colapso del sidebar de escritorio
          >
            <PanelLeft className="h-6 w-6" />
          </Button>
        )}
        <h1 className="text-xl font-semibold font-headline text-sidebar-foreground">
          {company?.displayName ?? 'CleanSweep Manager'}
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        {currentUser && <NotificationsBell />}
        <ThemeToggle />
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(displayName)}`} alt={displayName} data-ai-hint="avatar person" />
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
