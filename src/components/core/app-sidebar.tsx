
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
  Users,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile'; 
import Image from 'next/image';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'employee')[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Panel Principal', icon: LayoutDashboard, roles: ['admin', 'employee'] },
  { href: '/admin/departments', label: 'Departamentos', icon: Building2, roles: ['admin'] },
  { href: '/admin/employees', label: 'Gestionar Empleados', icon: Users, roles: ['admin'] },
  { href: '/admin/assignments', label: 'Asignar Tareas', icon: ClipboardEdit, roles: ['admin'] },
  { href: '/employee/tasks', label: 'Mis Tareas', icon: Briefcase, roles: ['employee'] },
  { href: '/employee/tasks?tab=completed_history', label: 'Historial Tareas', icon: History, roles: ['employee'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const isMobile = useIsMobile(); 

  
  if (isMobile || !currentUser) return null; 

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <Sidebar collapsible="icon" className="border-r hidden md:flex"> 
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
           <Image src="/logo.png" alt="CleanSweep Logo" width={32} height={32} className="h-8 w-8 object-contain" data-ai-hint="company logo"/>
          <span className="font-headline text-lg font-semibold text-primary">CleanSweep</span>
        </Link>
         {/* Icon only for collapsed state */}
        <Link href="/dashboard" className="hidden items-center gap-2 group-data-[collapsible=icon]:flex">
           <Image src="/logo.png" alt="CleanSweep Logo" width={28} height={28} className="h-7 w-7 object-contain" data-ai-hint="company logo"/>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarMenu>
          {filteredNavItems.map((item) => {
            const currentTab = pathname.includes('?') ? pathname.substring(pathname.indexOf('?') + 1) : null;
            const itemTab = item.href.includes('?') ? item.href.substring(item.href.indexOf('?') + 1) : null;
            const basePath = pathname.split('?')[0];
            const itemBasePath = item.href.split('?')[0];

            let isActive = basePath === itemBasePath;
            if (itemTab) {
              isActive = isActive && currentTab === itemTab;
            } else if (currentTab && basePath === itemBasePath) {
               isActive = false;
            }
             if (item.href === '/employee/tasks' && basePath === '/employee/tasks' && !currentTab && !itemTab) {
              isActive = true; 
            }

            return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.label}
                className={cn(
                  isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" 
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
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
