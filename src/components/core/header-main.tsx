
"use client";
import { useAuth } from "@/contexts/auth-context";
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
import { LogOut, UserCircle, Moon, Sun, PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar"; // Ensure this path is correct
import { useTheme } from "next-themes"; // Assuming next-themes is or will be installed

// Helper component for theme toggle if next-themes is used
function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  // Ensure component only renders on client
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}


export function HeaderMain() {
  const { currentUser, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  // const { setTheme, theme } = useTheme(); // If using next-themes
  // For now, a placeholder for theme toggle logic if next-themes is not setup
  const [currentTheme, setCurrentTheme] = React.useState('light');
  React.useEffect(() => {
    // Basic theme detection for icon display; full theming needs next-themes or similar
    if (typeof window !== 'undefined') {
      setCurrentTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }
  }, []);


  const getInitials = (name?: string) => {
    if (!name) return "CS"; // CleanSweep
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold font-headline text-primary">CleanSweep Manager</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Placeholder for ThemeToggle, assuming next-themes is not yet integrated
            If next-themes is integrated, replace this with <ThemeToggle /> 
        */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            if (newTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            setCurrentTheme(newTheme);
          }}
          aria-label="Toggle theme"
        >
          {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(currentUser.name)}`} alt={currentUser.name || "User"} data-ai-hint="avatar person" />
                  <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{currentUser.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

// Ensure React is imported if not already from other imports
import React from 'react';
