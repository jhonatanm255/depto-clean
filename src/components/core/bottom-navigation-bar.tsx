
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  LayoutDashboard, 
  Building2, 
  ClipboardEdit,
  Briefcase,
  Users,
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
];

export function BottomNavigationBar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t bg-card text-card-foreground shadow-top md:hidden">
      {filteredNavItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} legacyBehavior passHref>
            <a
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-md transition-colors w-full h-full",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6 mb-0.5", isActive ? "text-primary" : "")} />
              <span className={cn("text-xs leading-tight", isActive ? "font-medium" : "")}>{item.label}</span>
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
