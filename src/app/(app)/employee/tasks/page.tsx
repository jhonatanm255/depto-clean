
"use client";
import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { TaskListSection } from '@/components/task/TaskListSection';
import { Briefcase, CheckSquare, Info, Clock, History, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/core/loading-spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isToday } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { DepartmentSidebar } from '@/components/department/department-sidebar';
import { cn } from '@/lib/utils';


export default function EmployeeTasksPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { getTasksForEmployee, getDepartmentById, dataLoading: appDataLoading, tasks: allTasksFromContext, employees } = useData();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || "pending";


  const tasks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role !== 'employee' && currentUser.role !== 'manager') return [];
    return getTasksForEmployee(currentUser.id);
  }, [currentUser, getTasksForEmployee]);

  // Estado para el departamento seleccionado
  const [selectedDeptId, setSelectedDeptId] = React.useState<string | null>(null);

  const selectedDepartment = useMemo(() =>
    selectedDeptId ? getDepartmentById(selectedDeptId) : null
    , [selectedDeptId, getDepartmentById]);

  const handleSelectDepartment = (deptId: string) => {
    setSelectedDeptId(prev => prev === deptId ? null : deptId);
  };
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
  // Check if data context has loaded at least once (i.e., allTasksFromContext is not empty or appDataLoading is false)
  const initialDataContextLoadDone = !appDataLoading || allTasksFromContext.length > 0;


  if (globalLoading && (!currentUser || !initialDataContextLoadDone)) {
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
        <Button className="mt-4" asChild>
          <Link href="/login">Ir a Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }
  if (currentUser.role !== 'employee' && currentUser.role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Info className="h-10 w-10 text-destructive mb-2" />
        <p className="text-center text-muted-foreground text-lg">Tu rol actual no tiene tareas asignables.</p>
        <p className="text-sm text-muted-foreground">Por favor, contacta al administrador.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
          <Briefcase className="mr-3 h-8 w-8 text-primary" />
          {initialTab === 'completed_history' ? 'Historial de Tareas Completadas' : 'Mis Tareas de Limpieza'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {initialTab === 'completed_history'
            ? 'Revisa tus tareas completadas en días anteriores.'
            : 'Ve y gestiona tus tareas de limpieza asignadas.'}
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className={cn(
          "flex-1 w-full transition-all duration-300",
          selectedDeptId ? "lg:max-w-[calc(100%-400px)]" : "w-full"
        )}>
          <Tabs defaultValue={initialTab} className="w-full" value={initialTab}>
            {initialTab !== 'completed_history' && (
              <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
                <TabsTrigger value="pending" asChild>
                  <Link href="/employee/tasks?tab=pending">
                    <CalendarDays className="mr-2 h-4 w-4 md:hidden lg:inline-block" />
                    Pendientes ({appDataLoading && pendingTasks.length === 0 && !initialDataContextLoadDone ? "..." : pendingTasks.length})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="completed_today" asChild>
                  <Link href="/employee/tasks?tab=completed_today">
                    <Clock className="mr-2 h-4 w-4 md:hidden lg:inline-block" />
                    Completadas Hoy ({appDataLoading && completedTodayTasks.length === 0 && !initialDataContextLoadDone ? "..." : completedTodayTasks.length})
                  </Link>
                </TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="pending">
              <TaskListSection
                tasks={pendingTasks}
                getDepartmentById={getDepartmentById}
                isLoading={appDataLoading}
                initialLoadDone={initialDataContextLoadDone}
                emptyStateTitle="¡Todo al día!"
                emptyStateMessage="No tienes tareas pendientes."
                emptyStateIcon={CheckSquare}
                selectedDeptId={selectedDeptId}
                onSelectDepartment={handleSelectDepartment}
              />
            </TabsContent>

            <TabsContent value="completed_today">
              <TaskListSection
                tasks={completedTodayTasks}
                getDepartmentById={getDepartmentById}
                isLoading={appDataLoading}
                initialLoadDone={initialDataContextLoadDone}
                emptyStateTitle="Ninguna tarea completada hoy."
                emptyStateMessage="Las tareas que completes hoy aparecerán aquí."
                emptyStateIcon={Clock}
                selectedDeptId={selectedDeptId}
                onSelectDepartment={handleSelectDepartment}
              />
            </TabsContent>

            <TabsContent value="completed_history">
              <TaskListSection
                tasks={completedHistoryTasks}
                getDepartmentById={getDepartmentById}
                isLoading={appDataLoading}
                initialLoadDone={initialDataContextLoadDone}
                emptyStateTitle="No hay historial de tareas completadas."
                emptyStateMessage="Las tareas completadas en días anteriores aparecerán aquí."
                emptyStateIcon={History}
                selectedDeptId={selectedDeptId}
                onSelectDepartment={handleSelectDepartment}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar de detalles (solo visible en desktop cuando hay selección) */}
        {selectedDeptId && (
          <aside className="hidden lg:block w-[380px] sticky top-24 h-[calc(100vh-120px)] overflow-hidden rounded-xl border shadow-lg bg-card animate-in slide-in-from-right duration-300">
            <DepartmentSidebar
              department={selectedDepartment || null}
              onClose={() => setSelectedDeptId(null)}
              onEdit={() => { }} // Los empleados no editan
              employees={employees} // Pasar empleados para mostrar asignación
            />
          </aside>
        )}
      </div>
    </div>
  );
}
