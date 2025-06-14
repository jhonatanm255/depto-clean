
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  Sidebar, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Building2, 
  ClipboardEdit,
  Briefcase,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'employee')[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Panel Principal', icon: LayoutDashboard, roles: ['admin', 'employee'] },
  { href: '/admin/departments', label: 'Departamentos', icon: Building2, roles: ['admin'] },
  { href: '/admin/assignments', label: 'Asignar Tareas', icon: ClipboardEdit, roles: ['admin'] },
  { href: '/employee/tasks', label: 'Mis Tareas', icon: Briefcase, roles: ['employee'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  if (!currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
           <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-headline text-lg font-semibold text-primary">CleanSweep</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  className={cn(
                    (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
         <SidebarMenuButton
            onClick={logout}
            tooltip="Cerrar Sesión"
            className="w-full justify-start hover:bg-destructive/20 hover:text-destructive group-data-[collapsible=icon]:justify-center"
          >
            <LogOut className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
          </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
