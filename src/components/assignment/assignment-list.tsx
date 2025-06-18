
"use client";
import type { CleaningTask, Department, EmployeeProfile } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Building2, CalendarDays, CheckCircle2, AlertTriangle, Loader2, Users2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/data-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AssignmentListProps {
  tasks: CleaningTask[];
  departments: Department[];
  employees: EmployeeProfile[];
}

function translateStatus(status: CleaningTask['status']) {
  switch (status) {
    case 'completed': return 'Completada';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Pendiente';
    default: return status;
  }
}

export function AssignmentList({ tasks, departments, employees }: AssignmentListProps) {
  const { dataLoading, getTasksForEmployee } = useData();

  if (dataLoading && employees.length === 0 && tasks.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
             <Users2 className="mr-2 h-6 w-6 text-primary"/> Asignaciones por Empleada
          </CardTitle>
          <CardDescription>Cargando datos de empleadas y tareas...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (employees.length === 0 && !dataLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
           <CardTitle className="font-headline text-2xl flex items-center">
             <Users2 className="mr-2 h-6 w-6 text-primary"/> Asignaciones por Empleada
          </CardTitle>
          <CardDescription>No hay empleadas para mostrar asignaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">Agrega empleadas para ver sus tareas asignadas.</p>
        </CardContent>
      </Card>
    );
  }
  
  const getStatusBadgeVariant = (status: CleaningTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in_progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  const getStatusIcon = (status: CleaningTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  const employeesWithTasks = employees.map(employee => ({
    ...employee,
    assignedTasks: getTasksForEmployee(employee.id)
  })).filter(employee => employee.assignedTasks.length > 0)
     .sort((a,b) => a.name.localeCompare(b.name));

  const employeesWithoutTasks = employees.filter(employee => getTasksForEmployee(employee.id).length === 0)
    .sort((a,b) => a.name.localeCompare(b.name));


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
           <Users2 className="mr-2 h-6 w-6 text-primary"/> Asignaciones por Empleada
        </CardTitle>
        <CardDescription>Resumen de tareas de limpieza agrupadas por cada empleada.</CardDescription>
      </CardHeader>
      <CardContent>
        {dataLoading && employees.length > 0 && tasks.length === 0 && <p className="text-muted-foreground">Cargando tareas...</p>}
        
        {!dataLoading && employeesWithTasks.length === 0 && tasks.length > 0 && (
            <p className="text-center text-muted-foreground py-4">Ninguna de las empleadas actuales tiene tareas asignadas.</p>
        )}
        {!dataLoading && employeesWithTasks.length === 0 && tasks.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No hay tareas asignadas a ninguna empleada.</p>
        )}


        {employeesWithTasks.length > 0 && (
          <Accordion type="multiple" className="w-full space-y-2">
            {employeesWithTasks.map((employee) => {
              const employeeTasks = employee.assignedTasks;
              return (
                <AccordionItem value={employee.id} key={employee.id} className="border bg-card rounded-lg p-0">
                  <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50 rounded-t-lg">
                    <div className="flex items-center">
                      <User className="mr-3 h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg">{employee.name}</span>
                      <Badge variant="secondary" className="ml-3">{employeeTasks.length} tarea(s)</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t">
                    {employeeTasks.length > 0 ? (
                      <ScrollArea className="h-[200px] pr-3"> 
                        <ul className="space-y-3">
                          {employeeTasks.map((task) => {
                            const department = departments.find(d => d.id === task.departmentId);
                            if (!department) return null;
                            return (
                              <li key={task.id} className="p-3 border rounded-md hover:shadow-sm transition-shadow bg-background">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                                  <h4 className="text-base font-medium text-foreground flex items-center">
                                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground"/> {department.name}
                                  </h4>
                                  <Badge variant="default" className={cn("text-primary-foreground capitalize mt-1 sm:mt-0 text-xs", getStatusBadgeVariant(task.status))}>
                                    {getStatusIcon(task.status)}
                                    {translateStatus(task.status)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-0.5">
                                  {department.address && (
                                      <p className="flex items-center"><MapPin className="mr-1.5 h-3 w-3 shrink-0"/> {department.address}</p>
                                  )}
                                  <p className="flex items-center"><CalendarDays className="mr-1.5 h-3 w-3"/> Asignado: {new Date(task.assignedAt).toLocaleDateString('es-CL')}</p>
                                  {task.status === 'completed' && task.completedAt && (
                                    <p className="flex items-center text-green-600"><CheckCircle2 className="mr-1.5 h-3 w-3"/> Completado: {new Date(task.completedAt).toLocaleDateString('es-CL')}</p>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">Esta empleada no tiene tareas asignadas.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
        
        {employeesWithoutTasks.length > 0 && (
            <div className="mt-6">
                <h3 className="text-md font-semibold text-muted-foreground mb-2">Empleadas Sin Tareas Asignadas:</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {employeesWithoutTasks.map(emp => <li key={emp.id}>{emp.name}</li>)}
                </ul>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
