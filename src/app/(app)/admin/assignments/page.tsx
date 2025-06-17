
"use client";
import { useData } from '@/contexts/data-context';
import { AssignmentForm } from '@/components/assignment/assignment-form';
import { AssignmentList } from '@/components/assignment/assignment-list';
import { ClipboardEdit, Loader2, Users2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/core/loading-spinner';

export default function AssignmentsPage() {
  const { tasks, departments, employees, dataLoading } = useData();
  
  // La lista de tareas ahora se agrupa por empleado en AssignmentList

  if (dataLoading && tasks.length === 0 && departments.length === 0 && employees.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando datos para asignaciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
          <ClipboardEdit className="mr-3 h-8 w-8 text-primary" />
          Asignar y Ver Tareas
        </h1>
         <p className="text-muted-foreground mt-1">
            Aquí puedes asignar departamentos a empleadas para su limpieza. Las tareas activas se pueden reasignar.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <AssignmentForm />
        </div>
        <div className="lg:col-span-2">
           <h2 className="text-2xl font-semibold font-headline text-foreground mb-4 flex items-center">
            <Users2 className="mr-3 h-7 w-7 text-primary" />
            Tareas por Empleada
          </h2>
          {(dataLoading && employees.length === 0) ? (
            <div className="flex items-center justify-center p-6 border rounded-lg bg-card shadow-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <p className="text-muted-foreground">Cargando lista de asignaciones...</p>
            </div>
          ) : (
            <AssignmentList tasks={tasks} departments={departments} employees={employees} />
          )}
        </div>
      </div>
    </div>
  );
}
