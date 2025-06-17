
"use client";
import React, { useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { TaskCard } from '@/components/task/task-card';
import { Briefcase, CheckSquare, Info, Clock, History, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/core/loading-spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isToday } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';


export default function EmployeeTasksPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { getTasksForEmployee, getDepartmentById, dataLoading: appDataLoading, tasks: allTasks } = useData();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || "pending";


  const tasks = useMemo(() => {
    if (!currentUser || !currentUser.employeeProfileId) return [];
    return getTasksForEmployee(currentUser.employeeProfileId) // Already sorted by assignedAt desc in context
  }, [currentUser, getTasksForEmployee]); 
  
  const pendingTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'pending' || task.status === 'in_progress');
  }, [tasks]);
  
  const completedTodayTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'completed' && task.completedAt && isToday(new Date(task.completedAt)));
  }, [tasks]);

  const completedHistoryTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'completed' && task.completedAt && !isToday(new Date(task.completedAt)));
  }, [tasks]);


  const globalLoading = authLoading || appDataLoading;

  if (globalLoading && (!currentUser || tasks.length === 0)) {
    return (
      <div className="flex flex-grow items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} /> 
        <p className="ml-2 text-muted-foreground">Cargando datos de usuario y tareas...</p>
      </div>
    );
  }

  if (!currentUser) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Info className="h-10 w-10 text-destructive mb-2" />
            <p className="text-center text-muted-foreground text-lg">Debes iniciar sesión para ver tus tareas.</p>
            <Link href="/login" legacyBehavior>
                <Button className="mt-4">Ir a Iniciar Sesión</Button>
            </Link>
        </div>
     );
  }
  if (!currentUser.employeeProfileId) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
             <Info className="h-10 w-10 text-destructive mb-2" />
            <p className="text-center text-muted-foreground text-lg">No se pudo identificar tu perfil de empleada.</p>
            <p className="text-sm text-muted-foreground">Por favor, contacta al administrador.</p>
        </div>
     );
  }
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
          <Briefcase className="mr-3 h-8 w-8 text-primary" />
          Mis Tareas de Limpieza
        </h1>
        <p className="text-muted-foreground mt-1">Ve y gestiona tus tareas de limpieza asignadas.</p>
      </header>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px] mb-6">
          <TabsTrigger value="pending">
            <CalendarDays className="mr-2 h-4 w-4 md:hidden lg:inline-block" />
            Pendientes ({appDataLoading && pendingTasks.length === 0 ? "..." : pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed_today">
             <Clock className="mr-2 h-4 w-4 md:hidden lg:inline-block" />
            Completadas Hoy ({appDataLoading && completedTodayTasks.length === 0 ? "..." : completedTodayTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed_history">
             <History className="mr-2 h-4 w-4 md:hidden lg:inline-block" />
            Historial ({appDataLoading && completedHistoryTasks.length === 0 ? "..." : completedHistoryTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {appDataLoading && pendingTasks.length === 0 && tasks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-card shadow">
              <LoadingSpinner size={24} />
              <p className="mt-4 text-muted-foreground">Cargando tareas pendientes...</p>
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-card shadow">
              <CheckSquare className="mx-auto h-16 w-16 text-green-500" />
              <p className="mt-4 text-xl text-muted-foreground">¡Todo al día!</p>
              <p className="text-sm text-muted-foreground">No tienes tareas pendientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingTasks.map((task) => {
                const department = getDepartmentById(task.departmentId);
                return <TaskCard key={task.id} task={task} department={department} />;
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed_today">
           {appDataLoading && completedTodayTasks.length === 0 && tasks.length === 0 ? (
             <div className="text-center py-10 border rounded-lg bg-card shadow">
               <LoadingSpinner size={24} />
               <p className="mt-4 text-muted-foreground">Cargando tareas completadas hoy...</p>
             </div>
           ) : completedTodayTasks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-card shadow">
              <Clock className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-xl text-muted-foreground">Ninguna tarea completada hoy.</p>
              <p className="text-sm text-muted-foreground">Las tareas que completes hoy aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTodayTasks.map((task) => {
                const department = getDepartmentById(task.departmentId);
                return <TaskCard key={task.id} task={task} department={department} />;
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed_history">
           {appDataLoading && completedHistoryTasks.length === 0 && tasks.length > 0 ? ( // tasks.length > 0 to differentiate from initial load
             <div className="text-center py-10 border rounded-lg bg-card shadow">
               <LoadingSpinner size={24} />
               <p className="mt-4 text-muted-foreground">Cargando historial de tareas...</p>
             </div>
           ) : completedHistoryTasks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-card shadow">
              <History className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-xl text-muted-foreground">No hay historial de tareas completadas.</p>
              <p className="text-sm text-muted-foreground">Las tareas completadas en días anteriores aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedHistoryTasks.map((task) => {
                const department = getDepartmentById(task.departmentId);
                return <TaskCard key={task.id} task={task} department={department} />;
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
