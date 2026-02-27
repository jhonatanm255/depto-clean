
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
import { LogOut, Moon, Sun, CreditCard, Search, HelpCircle, ClipboardList } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name?: string | null) => {
    if (!name) return "CS";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = company?.displayName ?? currentUser?.name ?? currentUser?.email ?? 'Usuario';
  const canAssign = currentUser?.role === 'owner' || currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/admin/assignments?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex justify-between h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-b-1 border-gray-200 md:border-l md:border-sidebar-border bg-card text-foreground pl-3 pr-3 sm:pl-2 sm:pr-6">
      <div className="flex items-center gap-2">
      <SidebarTrigger className="hidden md:flex shrink-0 h-8 w-8" aria-label="Contraer o expandir menú" />
      <form onSubmit={handleSearch} className="flex-1 min-w-3xl max-w-4xl hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tareas, propiedades o personal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 focus:outline-none"
          />
        </div>
      </form>
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
