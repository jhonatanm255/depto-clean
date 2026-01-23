
"use client";
import Link from 'next/link';
import type { CleaningTask, Department } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Zap } from 'lucide-react';

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
    <Card className={nextTask.priority === 'high' ? "border-accent border-.5 ring-1 ring-accent relative" : "relative"}>
      {nextTask.priority === 'high' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="destructive" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm border-2 border-white flex items-center gap-1 px-3 py-0.5 h-6">
            <div className="animate-pulse"><Zap className="h-3 w-3 fill-current" /></div>
            <span className="text-xs font-bold uppercase tracking-wide">Prioritario</span>
          </Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle>Tu Próxima Tarea</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{nextTask.department?.name || <LoadingSpinner size={14} />}</h3>
          </div>
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
