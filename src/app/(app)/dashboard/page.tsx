
"use client";
import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, ClipboardCheck, AlertTriangle, Briefcase, Info, Clock, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/core/loading-spinner'; 
import type { AppUser, Department } from '@/lib/types'; 
import { isToday } from '@/lib/utils';

function AdminDashboard() {
  const { departments, employees, tasks, dataLoading, getEmployeeProfileById } = useData(); 

  const pendingCount = useMemo(() => departments.filter(d => d.status === 'pending').length, [departments]);
  
  const completedTodayCount = useMemo(() => {
    return tasks.filter(t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))).length;
  }, [tasks]);

  const recentlyCompletedToday = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt)))
      .map(task => ({ ...task, department: departments.find(d => d.id === task.departmentId) }))
      .filter(task => !!task.department)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5) as (typeof tasks[0] & { department: Department })[];
  }, [tasks, departments]);

  const completedHistory = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed' && t.completedAt && !isToday(new Date(t.completedAt)))
      .map(task => ({ ...task, department: departments.find(d => d.id === task.departmentId) }))
      .filter(task => !!task.department)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5) as (typeof tasks[0] & { department: Department })[];
  }, [tasks, departments]);


  const needsAttention = useMemo(() => {
    return departments
      .filter(d => d.status === 'pending' && !d.assignedTo)
      .slice(0,5);
  }, [departments]);

  if (dataLoading && departments.length === 0 && employees.length === 0 && tasks.length === 0) { 
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando datos del panel de administrador...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline text-foreground">Panel de Administrador</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departamentos</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading && departments.length === 0 ? <LoadingSpinner size={16}/> : departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes (Depto)</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading && pendingCount === 0 && departments.length === 0 ? <LoadingSpinner size={16}/> : pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
            <Clock className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading && completedTodayCount === 0 && tasks.length === 0 ? <LoadingSpinner size={16}/> : completedTodayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleadas</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading && employees.length === 0 ? <LoadingSpinner size={16}/> : employees.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Departamentos por Asignar</CardTitle>
            <CardDescription>Departamentos pendientes sin asignación.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading && needsAttention.length === 0 && departments.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                    <LoadingSpinner size={20} /><p className="ml-2 text-muted-foreground">Cargando...</p>
                </div>
            ) : needsAttention.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <ul className="space-y-2">
                  {needsAttention.map(dept => (
                    <li key={dept.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <span>{dept.name}</span>
                      <Link href="/admin/assignments" legacyBehavior>
                        <Button variant="outline" size="sm">Asignar</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No hay departamentos que necesiten asignación.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tareas Completadas Hoy</CardTitle>
            <CardDescription>Limpiezas completadas durante el día de hoy.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading && recentlyCompletedToday.length === 0 && tasks.length === 0 ? (
                 <div className="flex items-center justify-center p-4">
                    <LoadingSpinner size={20} /><p className="ml-2 text-muted-foreground">Cargando...</p>
                </div>
            ) : recentlyCompletedToday.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {recentlyCompletedToday.map(task => {
                  const employee = task.employeeId ? getEmployeeProfileById(task.employeeId) : null;
                  return (
                    <li key={task.id} className="p-2 rounded-md hover:bg-muted">
                      <p className="font-medium">{task.department?.name || 'Departamento no encontrado'}</p>
                      <p className="text-xs text-muted-foreground">
                        Completado por {employee?.name || 'N/D'} el {new Date(task.completedAt!).toLocaleDateString('es-CL')}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
            ) : (
               <p className="text-sm text-muted-foreground">No hay tareas completadas hoy.</p>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5"/>Historial (Días Anteriores)</CardTitle>
            <CardDescription>Últimas 5 tareas completadas en días pasados.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading && completedHistory.length === 0 && tasks.length > 0 ? (
                 <div className="flex items-center justify-center p-4">
                    <LoadingSpinner size={20} /><p className="ml-2 text-muted-foreground">Cargando historial...</p>
                </div>
            ) : completedHistory.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {completedHistory.map(task => {
                  const employee = task.employeeId ? getEmployeeProfileById(task.employeeId) : null;
                  return (
                    <li key={task.id} className="p-2 rounded-md hover:bg-muted">
                      <p className="font-medium">{task.department?.name || 'Departamento no encontrado'}</p>
                      <p className="text-xs text-muted-foreground">
                        Completado por {employee?.name || 'N/D'} el {new Date(task.completedAt!).toLocaleDateString('es-CL')}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
            ) : (
               <p className="text-sm text-muted-foreground">No hay historial de tareas completadas en días anteriores.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmployeeDashboard({user}: {user: AppUser}) { 
  const { getTasksForEmployee, getDepartmentById, dataLoading } = useData(); 

  const tasks = useMemo(() => {
    if (!user.employeeProfileId) return [];
    return getTasksForEmployee(user.employeeProfileId);
  }, [user.employeeProfileId, getTasksForEmployee]);
  
  const pendingTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  }, [tasks]);

  const completedTodayTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt)));
  }, [tasks]);

  const completedHistoryTasks = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed' && t.completedAt && !isToday(new Date(t.completedAt)))
      .sort((a,b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0,5);
  }, [tasks]);


  if (dataLoading && tasks.length === 0 && !user.employeeProfileId) {
     return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando tus tareas...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline text-foreground">¡Bienvenida, {user?.name}!</h2>
      <p className="text-muted-foreground">Aquí están tus tareas para hoy y tu historial.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading && pendingTasks.length === 0 && tasks.length === 0 ? <LoadingSpinner size={16}/> : pendingTasks.length}</div>
            <Link href="/employee/tasks" legacyBehavior>
              <Button variant="link" className="p-0 h-auto text-sm">Ver Tareas Pendientes</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
            <Clock className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading && completedTodayTasks.length === 0 && tasks.length === 0 ? <LoadingSpinner size={16}/> : completedTodayTasks.length}</div>
             <Link href="/employee/tasks?tab=completed_today" legacyBehavior>
                <Button variant="link" className="p-0 h-auto text-sm">Ver Completadas Hoy</Button>
            </Link>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historial Completadas</CardTitle>
            <History className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading && completedHistoryTasks.length === 0 && tasks.length > 0 ? <LoadingSpinner size={16}/> : completedHistoryTasks.length}</div>
             <Link href="/employee/tasks?tab=completed_history" legacyBehavior>
                <Button variant="link" className="p-0 h-auto text-sm">Ver Historial</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {dataLoading && pendingTasks.length === 0 && tasks.length === 0 ? (
          <div className="flex items-center justify-center p-4">
              <LoadingSpinner size={20} /><p className="ml-2 text-muted-foreground">Buscando próxima tarea...</p>
          </div>
      ) : pendingTasks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tu Próxima Tarea</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{getDepartmentById(pendingTasks[0].departmentId)?.name || <LoadingSpinner size={14}/>}</h3>
              <p className="text-sm text-muted-foreground">
                Dirección: {getDepartmentById(pendingTasks[0].departmentId)?.address || "No especificada"}
              </p>
              <p className="text-sm text-muted-foreground">
                Código de Acceso: {getDepartmentById(pendingTasks[0].departmentId)?.accessCode || "..."}
              </p>
              <Link href="/employee/tasks" legacyBehavior>
                 <Button className="mt-2">Ir a Mis Tareas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
          <Card>
            <CardHeader><CardTitle>¡Todo Listo por Hoy!</CardTitle></CardHeader>
            <CardContent><p>No tienes tareas pendientes. ¡Buen trabajo! Revisa tu historial si lo deseas.</p></CardContent>
          </Card>
        )}
    </div>
  );
}


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth(); 
  const { dataLoading: appDataLoading } = useData(); 

  if (authLoading || (!currentUser && appDataLoading)) { 
     return (
      <div className="flex flex-grow items-center justify-center">
        <LoadingSpinner size={32} /> 
        <p className="ml-2 text-muted-foreground">Cargando panel...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Info className="h-10 w-10 text-destructive mb-2" />
        <p className="text-center text-muted-foreground text-lg">Por favor, inicia sesión para ver el panel.</p>
        <Link href="/login" legacyBehavior>
            <Button className="mt-4">Ir a Iniciar Sesión</Button>
        </Link>
      </div>
    );
  }

  return currentUser?.role === 'admin' 
    ? <AdminDashboard /> 
    : <EmployeeDashboard user={currentUser} />; 
}
