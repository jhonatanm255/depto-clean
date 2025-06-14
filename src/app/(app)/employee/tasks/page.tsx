
"use client";
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { TaskCard } from '@/components/task/task-card';
import { Briefcase, CheckSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from '@/components/core/loading-spinner';

export default function EmployeeTasksPage() {
  const { currentUser } = useAuth();
  const { getTasksForEmployee, getDepartmentById } = useData();

  if (!currentUser) {
    return (
      <div className="flex flex-grow items-center justify-center">
        <LoadingSpinner size={32} /> 
        <p className="ml-2 text-muted-foreground">Cargando datos de usuario...</p>
      </div>
    );
  }

  const tasks = getTasksForEmployee(currentUser.id)
    .sort((a,b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  
  const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

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
          <TabsTrigger value="pending">Pendientes ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completadas ({completedTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {pendingTasks.length === 0 ? (
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
           {completedTasks.length === 0 ? (
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
