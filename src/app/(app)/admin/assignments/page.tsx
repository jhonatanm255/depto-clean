"use client";

import { useData } from "@/contexts/data-context";
import { AssignmentList } from "@/components/assignment/assignment-list";
import { AssignmentForm } from "@/components/assignment/assignment-form";
import { TaskHubPanels } from "@/components/assignment/task-hub-panels";
import { ClipboardEdit, Users2, UserPlus } from "lucide-react";
import { LoadingSpinner } from "@/components/core/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AssignmentsPage() {
  const { tasks, departments, employees, dataLoading } = useData();

  if (dataLoading && tasks.length === 0 && departments.length === 0 && employees.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando datos para asignaciones...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground flex items-center gap-2">
          <ClipboardEdit className="h-7 w-7 text-primary" />
          Asignar tareas de limpieza
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Asigna o reasigna departamentos a una empleada. Puedes hacerlo de forma individual abajo o por lotes en el panel.
        </p>
      </header>

      {/* Formulario: asignar o reasignar UNA tarea (un departamento + una empleada) */}
      <section aria-label="Asignar o reasignar una tarea">
        <h2 className="text-lg font-semibold font-headline text-foreground mb-3 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Asignar o reasignar una tarea
        </h2>
        <AssignmentForm />
      </section>

      {/* Panel por lotes: varias unidades + una empleada */}
      <section aria-label="Asignación por lotes">
        <h2 className="text-lg font-semibold font-headline text-foreground mb-3">
          Asignación por lotes
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Selecciona varias unidades sin asignar y una empleada, luego &quot;Asignar y confirmar&quot;.
        </p>
        <TaskHubPanels
          departments={departments}
          employees={employees}
          dataLoading={dataLoading}
        />
      </section>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-[280px] grid-cols-2">
          <TabsTrigger value="list">Por empleada</TabsTrigger>
          <TabsTrigger value="quick">Ayuda</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          <h2 className="text-lg font-semibold font-headline text-foreground mb-4 flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            Tareas por empleada
          </h2>
          {(dataLoading && employees.length === 0) ? (
            <div className="flex items-center justify-center p-6 border rounded-lg bg-card">
              <LoadingSpinner size={24} className="mr-2" />
              <p className="text-muted-foreground">Cargando asignaciones...</p>
            </div>
          ) : (
            <AssignmentList tasks={tasks} departments={departments} employees={employees} />
          )}
        </TabsContent>
        <TabsContent value="quick" className="mt-4">
          <p className="text-sm text-muted-foreground">
            <strong>Una tarea:</strong> usa el formulario &quot;Asignar o reasignar una tarea&quot; — elige departamento y empleada y pulsa &quot;Asignar / Reasignar Tarea&quot;. Si el departamento ya tenía una tarea activa, se reasignará a la nueva empleada.
            <br /><br />
            <strong>Por lotes:</strong> en &quot;Asignación por lotes&quot; marca las unidades de la izquierda, elige una empleada a la derecha y &quot;Asignar y confirmar&quot;.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
