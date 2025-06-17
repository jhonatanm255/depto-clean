
"use client";
import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { TaskCard } from '@/components/task/task-card';
import { Briefcase, CheckSquare, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/core/loading-spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EmployeeTasksPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { getTasksForEmployee, getDepartmentById, dataLoading: appDataLoading, tasks: allTasks } = useData(); // Added allTasks

  const tasks = useMemo(() => {
    if (!currentUser || !currentUser.employeeProfileId) return [];
    return getTasksForEmployee(currentUser.employeeProfileId)
      .sort((a,b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }, [currentUser, getTasksForEmployee]); // getTasksForEmployee already depends on allTasks via DataContext
  
  const pendingTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'pending' || task.status === 'in_progress');
  }, [tasks]);
  
  const completedTasks = useMemo(() => {
    return tasks.filter(task => task.status === 'completed');
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
  
  // Specific loading state for tasks if global loading is done but tasks haven't arrived
  if (!appDataLoading && allTasks.length > 0 && tasks.length === 0 && (pendingTasks.length + completedTasks.length === 0)) {
     // This case means global data is loaded, other tasks might exist, but THIS employee has no tasks.
     // This will be caught by the "No tienes tareas" messages below.
     // If allTasks.length === 0, it means no tasks AT ALL in system yet.
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

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="pending">Pendientes ({appDataLoading && pendingTasks.length === 0 ? "..." : pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completadas ({appDataLoading && completedTasks.length === 0 ? "..." : completedTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {appDataLoading && pendingTasks.length === 0 ? (
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
        <TabsContent value="completed">
           {appDataLoading && completedTasks.length === 0 ? (
             <div className="text-center py-10 border rounded-lg bg-card shadow">
               <LoadingSpinner size={24} />
               <p className="mt-4 text-muted-foreground">Cargando tareas completadas...</p>
             </div>
           ) : completedTasks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg bg-card shadow">
              <Briefcase className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-xl text-muted-foreground">Ninguna tarea completada aún.</p>
              <p className="text-sm text-muted-foreground">Las tareas completadas aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTasks.map((task) => {
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
