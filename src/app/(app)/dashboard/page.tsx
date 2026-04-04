
"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Info, History, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import type { AppUser, Department, CleaningTask, EmployeeProfile } from '@/lib/types';
import { isToday } from '@/lib/utils';

import { AdminStatsGrid } from '@/components/dashboard/admin/AdminStatsGrid';
import { CriticalAlertsCard, type AlertItem } from '@/components/dashboard/admin/CriticalAlertsCard';
import { TurnoverStatusCard, type TurnoverItem } from '@/components/dashboard/admin/TurnoverStatusCard';
import { UnassignedDepartmentsListCard } from '@/components/dashboard/admin/UnassignedDepartmentsListCard';
import { CompletedTasksListCard } from '@/components/dashboard/admin/CompletedTasksListCard';
import { EmployeeStatsGrid } from '@/components/dashboard/employee/EmployeeStatsGrid';
import { EmployeeNextTaskCard } from '@/components/dashboard/employee/EmployeeNextTaskCard';

import { Crown, ShieldCheck, User } from 'lucide-react';

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  owner:    { label: 'Propietario', icon: Crown,       className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  admin:    { label: 'Administrador', icon: ShieldCheck, className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  manager:  { label: 'Supervisor', icon: ShieldCheck,   className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  employee: { label: 'Empleado', icon: User,           className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30' },
};

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] ?? { label: role, icon: User, className: 'bg-muted text-muted-foreground' };
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function AdminDashboard() {
  const { currentUser } = useAuth();
  const { company, departments, employees, tasks, rentals, dataLoading, getEmployeeProfileById, updateRentalStatus } = useData();
  const [now, setNow] = useState(new Date());
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  const handleAlertAction = async (alert: AlertItem) => {
    if (alert.type === 'urgent') {
      const rentalId = alert.id.replace('checkout-time-reached-', '');
      try {
        await updateRentalStatus(rentalId, 'completed');
      } catch (error) {
        console.error("Error confirming checkout from alert:", error);
      }
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds(prev => [...prev, alertId]);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000); // 30s
    return () => clearInterval(timer);
  }, []);

  const initialDataLoaded = !dataLoading && departments.length > 0 && employees.length > 0 && tasks.length > 0;

  const pendingCount = useMemo(() => departments.filter(d => d.status === 'pending').length, [departments]);
  const inProgressCount = useMemo(() => departments.filter(d => d.status === 'in_progress').length, [departments]);

  const completedTodayCount = useMemo(() => {
    return tasks.filter(t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))).length;
  }, [tasks]);

  const recentlyCompletedTodayTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt)))
      .map(task => ({ ...task, department: departments.find(d => d.id === task.departmentId) }))
      .filter(task => !!task.department)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5) as (CleaningTask & { department: Department })[];
  }, [tasks, departments]);

  const completedHistoryTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed' && t.completedAt && !isToday(new Date(t.completedAt)))
      .map(task => ({ ...task, department: departments.find(d => d.id === task.departmentId) }))
      .filter(task => !!task.department)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5) as (CleaningTask & { department: Department })[];
  }, [tasks, departments]);

  const unassignedDepartments = useMemo(() => {
    return departments
      .filter(d => d.status === 'pending' && !d.assignedTo)
      .slice(0, 5);
  }, [departments]);

  const departuresToday = useMemo(() => {
    return rentals.filter(r =>
      (r.rentalStatus === 'active' || r.rentalStatus === 'reserved') &&
      new Date(r.checkOutDate) <= now
    );
  }, [rentals, now]);

  const criticalAlerts = useMemo((): AlertItem[] => {
    const alerts: AlertItem[] = [];

    // Alertas por departamentos sin asignar
    unassignedDepartments.forEach((d) => {
      alerts.push({
        id: `unassigned-${d.id}`,
        type: 'unassigned',
        title: 'Sin asignar',
        description: `${d.name} requiere limpieza y no tiene equipo asignado.`,
        actionHref: '/admin/assignments',
        actionLabel: 'Asignar ahora',
      });
    });

    // Alertas por Check-outs hoy (Tiempo cumplido)
    departuresToday.forEach((r) => {
      const dept = departments.find(d => d.id === r.departmentId);
      if (dept) {
        alerts.push({
          id: `checkout-time-reached-${r.id}`,
          type: 'urgent',
          title: 'Tiempo de salida cumplido',
          description: `${dept.name}: La estancia de ${r.tenantName} ha terminado.`,
          guestName: r.tenantName,
          actionLabel: 'Confirmar salida',
        });
      }
    });

    // Alertas por Check-outs inminentes (Próxima hora)
    rentals.forEach((r) => {
      if (r.rentalStatus === 'active' || r.rentalStatus === 'reserved') {
        const checkOutDate = new Date(r.checkOutDate);
        const timeDiff = checkOutDate.getTime() - now.getTime();
        
        // Si falta menos de 1 hora y aún no ha pasado
        if (timeDiff > 0 && timeDiff <= 3600000) {
          const dept = departments.find(d => d.id === r.departmentId);
          if (dept) {
            alerts.push({
              id: `checkout-imminent-${r.id}`,
              type: 'warning',
              title: 'Check-out inminente',
              description: `${dept.name}: El check-out de ${r.tenantName} es en menos de una hora.`,
              guestName: r.tenantName,
              timeAgo: `En ${Math.round(timeDiff / 60000)} min`,
            });
          }
        }
      }
    });

    return alerts.filter(a => !dismissedAlertIds.includes(a.id)).slice(0, 5);
  }, [unassignedDepartments, departuresToday, departments, now, rentals, dismissedAlertIds]);

  const turnoverItems = useMemo((): TurnoverItem[] => {
    const total = departments.length || 1;
    const pending = departments.filter(d => d.status === 'pending').length;
    const inProgress = departments.filter(d => d.status === 'in_progress').length;
    const completed = departments.filter(d => d.status === 'completed').length;
    return [
      { id: 'pending', label: 'Pendientes', percent: Math.round((pending / total) * 100) },
      { id: 'in_progress', label: 'En progreso', percent: Math.round((inProgress / total) * 100) },
      { id: 'completed', label: 'Completados', percent: Math.round((completed / total) * 100) },
    ];
  }, [departments]);

  const userName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'Usuario';

  if (dataLoading && departments.length === 0 && employees.length === 0 && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando datos del panel de administrador...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
          Vista ejecutiva
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Resumen operativo del día para {company?.displayName ?? 'tu empresa'}.
        </p>
        {currentUser && (
          <p className="flex items-center gap-2 mt-2">
            <RoleBadge role={currentUser.role} />
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{userName}</span>
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <AdminStatsGrid
            pendingCount={pendingCount}
            inProgressCount={inProgressCount}
            completedTodayCount={completedTodayCount}
            departmentsCount={departments.length}
            employeesCount={employees.length}
            dataLoading={dataLoading}
            initialDataLoaded={initialDataLoaded}
          />

          <TurnoverStatusCard items={turnoverItems} />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 h-full">
            <CriticalAlertsCard 
              alerts={criticalAlerts} 
              onAction={handleAlertAction}
              onDismiss={handleDismissAlert}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <UnassignedDepartmentsListCard
          departments={unassignedDepartments}
          dataLoading={dataLoading && departments.length === 0}
        />
        <CompletedTasksListCard
          title="Tareas Completadas Hoy"
          description="Limpiezas completadas durante el día."
          tasks={recentlyCompletedTodayTasks}
          employees={employees}
          dataLoading={dataLoading && tasks.length === 0 && departments.length > 0}
          emptyMessage="No hay tareas completadas hoy."
          icon={Clock}
        />
        <CompletedTasksListCard
          title="Historial"
          description="Últimas completadas (días anteriores)."
          tasks={completedHistoryTasks}
          employees={employees}
          dataLoading={dataLoading && tasks.length > 0 && departments.length > 0 && completedHistoryTasks.length === 0}
          emptyMessage="Sin historial reciente."
          icon={History}
        />
      </div>
    </div>
  );
}

function EmployeeDashboard({ user }: { user: AppUser }) {
  const { company, getTasksForEmployee, getDepartmentById, dataLoading, departments } = useData();

  const allUserTasks = useMemo(() => {
    if (user.role !== 'employee' && user.role !== 'manager') return [];
    return getTasksForEmployee(user.id);
  }, [user.id, user.role, getTasksForEmployee]);

  const pendingTasks = useMemo(() => {
    return allUserTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  }, [allUserTasks]);

  const completedTodayTasks = useMemo(() => {
    return allUserTasks.filter(t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt)));
  }, [allUserTasks]);

  const completedHistoryTasks = useMemo(() => {
    return allUserTasks
      .filter(t => t.status === 'completed' && t.completedAt && !isToday(new Date(t.completedAt)))
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5); // For stats grid, count all, not just 5
  }, [allUserTasks]);

  const nextTaskWithDepartment = useMemo(() => {
    if (pendingTasks.length > 0) {
      const task = pendingTasks[0];
      const department = getDepartmentById(task.departmentId);
      return department ? { ...task, department } : task;
    }
    return undefined;
  }, [pendingTasks, getDepartmentById]);

  const initialDataLoaded = !dataLoading;

  const userName = user.fullName || user.name || user.email || 'Usuario';

  if (dataLoading && allUserTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando tus tareas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline text-foreground">
          ¡Bienvenido/a, {company?.displayName ?? 'tu empresa'}!
        </h2>
        <p className="mt-2 flex items-center gap-2">
          <RoleBadge role={user.role} />
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{userName}</span>
        </p>
      </div>
      <p className="text-muted-foreground">Aquí están las tareas asignadas a tu equipo.</p>

      <EmployeeStatsGrid
        activeTasksCount={pendingTasks.length}
        completedTodayCount={completedTodayTasks.length}
        completedHistoryCount={completedHistoryTasks.length} // Count all for the stat
        dataLoading={dataLoading}
        initialDataLoaded={initialDataLoaded}
      />

      <EmployeeNextTaskCard
        nextTask={nextTaskWithDepartment}
        dataLoading={dataLoading}
        initialTasksLoaded={!dataLoading && (pendingTasks.length > 0 || allUserTasks.length > 0)}
      />
    </div>
  );
}


export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { dataLoading: appDataLoading, departments, tasks, employees } = useData();

  // Redirigir superadmin al dashboard de superadmin
  useEffect(() => {
    if (currentUser?.role === 'superadmin') {
      router.replace('/superadmin/dashboard');
    }
  }, [currentUser, router]);

  // Combined loading state that considers auth and initial data for relevant dashboard
  const isLoading = useMemo(() => {
    if (authLoading) return true;
    if (!currentUser) return appDataLoading; // If no user, only app data matters for redirect/login form

    // For logged-in user, check if their specific essential data is still loading
    if (currentUser.role === 'admin' || currentUser.role === 'owner' || currentUser.role === 'manager') {
      return appDataLoading && (departments.length === 0 || employees.length === 0 || tasks.length === 0);
    } else if (currentUser.role === 'employee') {
      return appDataLoading && (departments.length === 0 && tasks.length === 0);
    }
    return appDataLoading; // Fallback
  }, [authLoading, currentUser, appDataLoading, departments, employees, tasks]);


  if (isLoading) {
    return (
      <div className="flex flex-grow items-center justify-center min-h-[calc(100vh-100px)]">
        <LoadingSpinner size={32} />
        <p className="ml-2 text-muted-foreground">Cargando panel...</p>
      </div>
    );
  }

  if (!currentUser) {
    // This case should ideally be handled by AppLayout redirecting to /login,
    // but as a safeguard or if accessed directly.
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-100px)]">
        <Info className="h-10 w-10 text-destructive mb-2" />
        <p className="text-center text-muted-foreground text-lg">Por favor, inicia sesión para ver el panel.</p>
        <Button className="mt-4" asChild>
          <Link href="/login">Ir a Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  if (currentUser?.role === 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-100px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Redirigiendo al panel de superadmin...</p>
      </div>
    );
  }

  return currentUser?.role === 'admin' || currentUser?.role === 'owner'
    ? <AdminDashboard />
    : <EmployeeDashboard user={currentUser} />;
}
