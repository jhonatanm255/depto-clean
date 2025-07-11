
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'employee')[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard, roles: ['admin', 'employee'] },
  { href: '/admin/departments', label: 'Deptos', icon: Building2, roles: ['admin'] },
  { href: '/admin/employees', label: 'Empleadas', icon: Users, roles: ['admin'] },
  { href: '/admin/assignments', label: 'Asignar', icon: ClipboardEdit, roles: ['admin'] },
  { href: '/employee/tasks', label: 'Tareas', icon: Briefcase, roles: ['employee'] },
  { href: '/employee/tasks?tab=completed_history', label: 'Historial', icon: History, roles: ['employee'] },
];

export function BottomNavigationBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-card text-card-foreground shadow-top md:hidden">
      {filteredNavItems.map((item) => {
        const itemPathname = item.href.split('?')[0];
        const itemQueryParam = item.href.split('?')[1]?.split('=')[1];
        
        let isActive = pathname === itemPathname;
        if (itemQueryParam && isActive) {
            isActive = searchParams.get('tab') === itemQueryParam;
        } else if (itemPathname !== '/dashboard' && pathname.startsWith(itemPathname) && !itemQueryParam && !searchParams.get('tab')){
            if (item.href === '/employee/tasks' && pathname === '/employee/tasks' && !searchParams.get('tab')){
                isActive = true;
             } else if (item.href.includes('?')) {
                // If item.href has query params but current path doesn't match query params, it's not active
                isActive = false;
             } else if (!item.href.includes('?') && pathname.startsWith(itemPathname) && itemPathname !== '/dashboard') {
                isActive = true;
             }
        }


        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-md transition-colors w-full h-full",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-6 w-6 mb-0.5", isActive ? "text-primary" : "")} />
            <span className={cn("text-xs leading-tight", isActive ? "font-medium" : "")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
