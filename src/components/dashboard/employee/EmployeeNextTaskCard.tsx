
"use client";
import Link from 'next/link';
import type { CleaningTask, Department } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/core/loading-spinner';

interface EmployeeNextTaskCardProps {
  nextTask?: CleaningTask & { department?: Department }; // Task could be undefined if none pending
  dataLoading: boolean;
  initialTasksLoaded: boolean;
}

export function EmployeeNextTaskCard({ nextTask, dataLoading, initialTasksLoaded }: EmployeeNextTaskCardProps) {
  if (dataLoading && !initialTasksLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tu Próxima Tarea</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-4">
          <LoadingSpinner size={20} /><p className="ml-2 text-muted-foreground">Buscando próxima tarea...</p>
        </CardContent>
      </Card>
    );
  }

  if (!nextTask) { // Handles both !initialTasksLoaded (after loading) AND no pending tasks
    return (
      <Card>
        <CardHeader><CardTitle>¡Todo Listo por Hoy!</CardTitle></CardHeader>
        <CardContent><p>No tienes tareas pendientes. ¡Buen trabajo! Revisa tu historial si lo deseas.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu Próxima Tarea</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{nextTask.department?.name || <LoadingSpinner size={14}/>}</h3>
          <p className="text-sm text-muted-foreground">
            Dirección: {nextTask.department?.address || "No especificada"}
          </p>
          <p className="text-sm text-muted-foreground">
            Código de Acceso: {nextTask.department?.accessCode || "..."}
          </p>
          <Button className="mt-2" asChild>
            <Link href="/employee/tasks">Ir a Mis Tareas</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
