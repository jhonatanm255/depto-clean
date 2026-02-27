
"use client";
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  LayoutDashboard,
  Building2,
  ClipboardEdit,
  Briefcase,
  Users,
  History,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard, roles: ['owner', 'admin', 'manager', 'employee'] },
  { href: '/admin/condominiums', label: 'Condominios', icon: Building2, roles: ['owner', 'admin', 'manager'] },
  { href: '/admin/rentals', label: 'Rentas', icon: KeyRound, roles: ['owner', 'admin', 'manager'] },
  { href: '/admin/employees', label: 'Empleadas', icon: Users, roles: ['owner', 'admin'] },
  { href: '/admin/assignments', label: 'Asignar', icon: ClipboardEdit, roles: ['owner', 'admin', 'manager'] },
  { href: '/employee/tasks', label: 'Tareas', icon: Briefcase, roles: ['employee', 'manager'] },
  { href: '/employee/tasks?tab=completed_history', label: 'Historial', icon: History, roles: ['employee', 'manager'] },
];

export function BottomNavigationBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-sidebar-border bg-sidebar text-sidebar-foreground md:hidden">
      {filteredNavItems.map((item) => {
        const itemPathname = item.href.split('?')[0];
        const itemQueryParam = item.href.split('?')[1]?.split('=')[1];
        const currentTab = searchParams.get('tab');

        let isActive = false;

        // Primero verificar que el pathname coincida
        if (pathname === itemPathname) {
          // Si el item tiene query params, verificar que coincidan exactamente
          if (itemQueryParam) {
            isActive = currentTab === itemQueryParam;
          } else {
            // Si el item NO tiene query params, solo debe estar activo si tampoco hay query params en la URL
            isActive = !currentTab;
          }
        } else if (itemPathname !== '/dashboard' && pathname.startsWith(itemPathname)) {
          // Para otros paths que empiecen con el itemPathname (pero no sean exactos)
          // Solo activar si el item NO tiene query params y la URL tampoco tiene query params
          if (!itemQueryParam && !currentTab) {
            isActive = true;
          }
        }


        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 transition-colors w-full h-full",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className={cn("h-6 w-6 mb-0.5", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground")} />
            <span className={cn("text-xs leading-tight", isActive ? "font-medium text-sidebar-primary-foreground" : "text-sidebar-foreground")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
