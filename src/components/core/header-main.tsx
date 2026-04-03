
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/auth-context";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Sun, CreditCard, Search, HelpCircle, ClipboardList, Building2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { useIsMobile } from '@/hooks/use-mobile';
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
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { company } = useData();
  const isMobileView = useIsMobile();

  const getInitials = (name?: string | null) => {
    if (!name) return "CS";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'Usuario';
  const companyName = company?.displayName || company?.name || 'Mi Empresa';
  const canAssign = currentUser?.role === 'owner' || currentUser?.role === 'admin' || currentUser?.role === 'manager';

  return (
    <header className="sticky top-0 z-30 flex justify-between h-[70px] sm:h-16 items-center gap-2 sm:gap-3 border-b border-border/40 hover:border-border/60 transition-colors bg-card text-foreground pl-3 pr-3 sm:pl-2 sm:pr-6">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="hidden md:flex shrink-0 h-8 w-8" aria-label="Contraer o expandir menú" />
        
        {/* Nombre de la empresa */}
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-muted/20 sm:rounded-2xl max-w-[140px] sm:max-w-[400px] overflow-hidden group hover:bg-muted/30 transition-all">
          <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={companyName} className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[10px] font-extrabold text-primary/80 uppercase tracking-widest leading-none mb-0.5 sm:mb-1 truncate">Empresa</span>
            <span className="font-bold text-xs sm:text-sm truncate leading-tight text-foreground">{companyName}</span>
          </div>
        </div>
      </div>



      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {currentUser && <NotificationsBell />}
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="hidden sm:flex" aria-label="Ayuda">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </Button>
        {canAssign && (
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
            <Link href="/admin/assignments">
              <ClipboardList className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Asignar tareas</span>
            </Link>
          </Button>
        )}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                  <AvatarImage src={undefined} alt={displayName} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
                <DropdownMenuItem asChild>
                  <Link href="/subscription"><CreditCard className="mr-2 h-4 w-4" /> Suscripción</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
