
"use client";
import React, { useMemo } from 'react'; // Added useMemo
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, ClipboardCheck, AlertTriangle, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/core/loading-spinner'; 
import type { AppUser } from '@/lib/types'; 

function AdminDashboard() {
  const { departments, employees, dataLoading, getEmployeeProfileById } = useData(); 

  const pendingCount = useMemo(() => departments.filter(d => d.status === 'pending').length, [departments]);
  const completedCount = useMemo(() => departments.filter(d => d.status === 'completed').length, [departments]);

  const recentlyCompleted = useMemo(() => {
    return departments
      .filter(d => d.status === 'completed' && d.lastCleanedAt)
      .sort((a, b) => new Date(b.lastCleanedAt!).getTime() - new Date(a.lastCleanedAt!).getTime())
      .slice(0, 5);
  }, [departments]);

  const needsAttention = useMemo(() => {
    return departments
      .filter(d => d.status === 'pending' && !d.assignedTo)
      .slice(0,5);
  }, [departments]);

  if (dataLoading) { 
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando datos del panel...</p>
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
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleadas</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Departamentos por Asignar</CardTitle>
            <CardDescription>Estos departamentos están pendientes y aún no han sido asignados.</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention.length > 0 ? (
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
              <p className="text-sm text-muted-foreground">No hay departamentos que necesiten asignación actualmente.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tareas Recientemente Completadas</CardTitle>
            <CardDescription>Resumen de las últimas limpiezas completadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentlyCompleted.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {recentlyCompleted.map(dept => {
                  const employee = dept.assignedTo ? getEmployeeProfileById(dept.assignedTo) : null;
                  return (
                    <li key={dept.id} className="p-2 rounded-md hover:bg-muted">
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Completado por {employee?.name || 'N/D'} el {new Date(dept.lastCleanedAt!).toLocaleDateString('es-CL')}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
            ) : (
               <p className="text-sm text-muted-foreground">No hay tareas completadas recientemente.</p>
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
    return user.employeeProfileId ? getTasksForEmployee(user.employeeProfileId) : [];
  }, [user.employeeProfileId, getTasksForEmployee]);
  
  const pendingTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  }, [tasks]);

  const completedTasksCount = useMemo(() => {
    return tasks.filter(t => t.status === 'completed').length;
  }, [tasks]);


  if (dataLoading && !tasks.length) { // Check if tasks are loaded or still in initial dataLoading
     return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando tus tareas...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline text-foreground">¡Bienvenido/a, {user?.name}!</h2>
      <p className="text-muted-foreground">Aquí están tus tareas para hoy.</p>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <Link href="/employee/tasks" legacyBehavior>
              <Button variant="link" className="p-0 h-auto text-sm">Ver Tareas</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasksCount}</div>
            <p className="text-xs text-muted-foreground">Total tareas completadas</p>
          </CardContent>
        </Card>
      </div>

      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tu Próxima Tarea</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{getDepartmentById(pendingTasks[0].departmentId)?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Código de Acceso: {getDepartmentById(pendingTasks[0].departmentId)?.accessCode}
              </p>
              <Link href="/employee/tasks" legacyBehavior>
                 <Button className="mt-2">Ir a Mis Tareas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
       {pendingTasks.length === 0 && (
          <Card>
            <CardHeader><CardTitle>¡Todo Listo!</CardTitle></CardHeader>
            <CardContent><p>No tienes tareas pendientes. ¡Buen trabajo!</p></CardContent>
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
    return <p className="text-center text-muted-foreground">Por favor, inicia sesión para ver el panel.</p>;
  }


  return currentUser?.role === 'admin' 
    ? <AdminDashboard /> 
    : <EmployeeDashboard user={currentUser} />; 
}
