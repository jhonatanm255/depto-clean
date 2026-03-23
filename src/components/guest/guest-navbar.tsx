"use client";

import Link from "next/link";
import { Search, Menu, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GuestNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/alojamientos" className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">CleanSweep</span>
        </Link>

        {/* Search Bar - Center */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full flex items-center shadow-sm rounded-full border border-input bg-background px-3 py-1.5 transition-shadow hover:shadow-md">
            <div className="flex-1 px-3 text-sm font-medium border-r cursor-pointer">
              Cualquier lugar
            </div>
            <div className="flex-1 px-3 text-sm font-medium border-r cursor-pointer">
              Cualquier semana
            </div>
            <div className="flex-1 px-3 text-sm text-muted-foreground cursor-pointer">
              Cuántos
            </div>
            <Button size="icon" className="rounded-full h-8 w-8 shrink-0 ml-2">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full" asChild>
            <Link href="/login">Pon tu espacio</Link>
          </Button>
          
          <div className="flex items-center border rounded-full p-1 pl-3 pr-1 gap-2 hover:shadow-md transition-shadow cursor-pointer bg-background">
            <Menu className="h-5 w-5" />
            <div className="bg-muted text-muted-foreground rounded-full p-1.5">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Search - Bottom */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative w-full flex items-center shadow-sm rounded-full border border-input bg-background/50 p-2 pl-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col ml-3">
            <span className="text-sm font-medium">Empieza tu búsqueda</span>
            <span className="text-xs text-muted-foreground">Cualquier lugar • Cualquier semana</span>
          </div>
        </div>
      </div>
    </header>
  );
}
