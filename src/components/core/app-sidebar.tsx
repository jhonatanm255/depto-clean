
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import {
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  ClipboardEdit,
  Briefcase,
  LogOut,
  Users,
  History,
  Shield,
  KeyRound,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { UserRole } from '@/lib/types';

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: 'Administrador',
    admin: 'Administrador',
    manager: 'Gerente',
    employee: 'Empleado/a',
    superadmin: 'Superadmin',
  };
  return labels[role] ?? role;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { href: '/superadmin/dashboard', label: 'Panel Superadmin', icon: Shield, roles: ['superadmin'] },
  { href: '/dashboard', label: 'Panel Principal', icon: LayoutDashboard, roles: ['owner', 'admin', 'manager', 'employee'] },
  { href: '/admin/condominiums', label: 'Condominios', icon: Building2, roles: ['owner', 'admin', 'manager'] },
  { href: '/admin/rentals', label: 'Rentas', icon: KeyRound, roles: ['owner', 'admin', 'manager'] },
  { href: '/admin/employees', label: 'Gestionar Empleados', icon: Users, roles: ['owner', 'admin'] },
  { href: '/admin/assignments', label: 'Asignar Tareas', icon: ClipboardEdit, roles: ['owner', 'admin', 'manager'] },
  { href: '/employee/tasks', label: 'Mis Tareas', icon: Briefcase, roles: ['employee', 'manager'] },
  { href: '/employee/tasks?tab=completed_history', label: 'Historial Tareas', icon: History, roles: ['employee', 'manager'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();
  const { company } = useData();
  const isMobile = useIsMobile();

  if (isMobile || !currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar hidden md:flex">
      <SidebarHeader className="p-4 flex items-center justify-start border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <Image src="/logo.png" alt="CleanSweep Logo" width={32} height={32} className="h-8 w-8 object-contain opacity-95" data-ai-hint="company logo" />
          <span className="font-headline text-[1.1rem] font-normal text-sidebar-foreground whitespace-nowrap tracking-wide">
            Clean<span className='text-[#E1C750]'>Sweep</span>
          </span>
        </Link>
        <Link href="/dashboard" className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
          <Image src="/logo.png" alt="CleanSweep Logo" width={28} height={28} className="h-7 w-7 object-contain opacity-95" data-ai-hint="company logo" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2 group-data-[collapsible=icon]:px-1.5">
        <SidebarMenu className="gap-0.5">
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
                    "rounded-lg transition-colors min-h-10 py-2.5 [&>svg]:!size-6 font-normal",
                    "group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!px-3 group-data-[collapsible=icon]:!py-2 group-data-[collapsible=icon]:!justify-center",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                  )}
                >
                  <Link href={item.href} className="flex items-center justify-start group-data-[collapsible=icon]:w-full">
                    <item.icon className="h-5 w-5 shrink-0" strokeWidth={.9} />
                    <span className="group-data-[collapsible=icon]:hidden text-[0.85rem]">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 mt-auto border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9 shrink-0 border-2 border-sidebar-border">
            <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-foreground">
              {(currentUser?.name ?? currentUser?.email ?? 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.95rem] font-normal text-sidebar-foreground truncate">
              {currentUser?.name ?? currentUser?.email ?? 'Usuario'}
            </p>
            <p className="text-[0.8rem] font-normal text-sidebar-foreground/70 truncate">{getRoleLabel(currentUser.role)}</p>
          </div>
        </div>
        <SidebarMenuButton
          asChild
          tooltip="Configuración"
          className="w-full justify-start rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground font-normal group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!px-3 group-data-[collapsible=icon]:!justify-center"
        >
          <Link href="/subscription" className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
            <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span className="group-data-[collapsible=icon]:hidden">Configuración</span>
          </Link>
        </SidebarMenuButton>
        <SidebarMenuButton
          onClick={logout}
          tooltip="Cerrar Sesión"
          className="w-full justify-start rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground font-normal group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!px-3 group-data-[collapsible=icon]:!justify-center"
        >
          <LogOut className="h-6 w-6 shrink-0" strokeWidth={1.5} />
          <span className="group-data-[collapsible=icon]:hidden text-[0.95rem]">Cerrar Sesión</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
