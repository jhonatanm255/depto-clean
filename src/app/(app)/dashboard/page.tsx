
"use client";
import React, { useMemo, useEffect } from 'react';
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
import { UnassignedDepartmentsListCard } from '@/components/dashboard/admin/UnassignedDepartmentsListCard';
import { CompletedTasksListCard } from '@/components/dashboard/admin/CompletedTasksListCard';
import { EmployeeStatsGrid } from '@/components/dashboard/employee/EmployeeStatsGrid';
import { EmployeeNextTaskCard } from '@/components/dashboard/employee/EmployeeNextTaskCard';

// Función helper para obtener el nombre del rol en español
function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    'owner': 'Administrador/ra',
    'admin': 'Administrador/ra',
    'manager': 'Gerente',
    'employee': 'Empleado/a'
  };
  return roleNames[role] || role;
}

function AdminDashboard() {
  const { currentUser } = useAuth();
  const { company, departments, employees, tasks, dataLoading, getEmployeeProfileById } = useData(); 

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
      .slice(0,5);
  }, [departments]);

  const userName = currentUser?.fullName || currentUser?.name || currentUser?.email || 'Usuario';
  const roleName = currentUser ? getRoleName(currentUser.role) : '';

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
        <h2 className="text-3xl font-bold font-headline text-foreground">
          Panel de {company?.displayName ?? 'tu empresa'}
        </h2>
        {currentUser && (
          <p className="text-muted-foreground mt-2">
            {roleName} • {userName}
          </p>
        )}
        <p className="text-muted-foreground">
          Gestiona departamentos, personal y tareas de limpieza.
        </p>
      </div>
      
      <AdminStatsGrid
        pendingCount={pendingCount}
        inProgressCount={inProgressCount}
        completedTodayCount={completedTodayCount}
        departmentsCount={departments.length}
        employeesCount={employees.length}
        dataLoading={dataLoading}
        initialDataLoaded={initialDataLoaded}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <UnassignedDepartmentsListCard 
            departments={unassignedDepartments} 
            dataLoading={dataLoading && departments.length === 0} 
        />
        <CompletedTasksListCard
          title="Tareas Completadas Hoy"
          description="Limpiezas completadas durante el día de hoy."
          tasks={recentlyCompletedTodayTasks}
          employees={employees}
          dataLoading={dataLoading && tasks.length === 0 && departments.length > 0}
          emptyMessage="No hay tareas completadas hoy."
          icon={Clock}
        />
        <CompletedTasksListCard
          title="Historial (Días Anteriores)"
          description="Últimas 5 tareas completadas en días pasados."
          tasks={completedHistoryTasks}
          employees={employees}
          dataLoading={dataLoading && tasks.length > 0 && departments.length > 0 && completedHistoryTasks.length === 0}
          emptyMessage="No hay historial de tareas completadas en días anteriores."
          icon={History}
        />
      </div>
    </div>
  );
}

function EmployeeDashboard({user}: {user: AppUser}) { 
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
      .sort((a,b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0,5); // For stats grid, count all, not just 5
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
  const roleName = getRoleName(user.role);

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
        <p className="text-muted-foreground mt-2">
          {roleName} • {userName}
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
