
"use client";
import type { CleaningTask, Department, EmployeeProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import type { LucideIcon } from 'lucide-react';

interface CompletedTaskItem extends CleaningTask {
  department?: Department; // Make department optional as it's looked up
}
interface CompletedTasksListCardProps {
  title: string;
  description: string;
  tasks: CompletedTaskItem[];
  employees: EmployeeProfile[]; // Pass all employees for lookup
  dataLoading: boolean;
  emptyMessage: string;
  icon?: LucideIcon;
}

export function CompletedTasksListCard({ 
  title, 
  description, 
  tasks, 
  employees,
  dataLoading, 
  emptyMessage,
  icon: IconComponent 
}: CompletedTasksListCardProps) {
  
  const getEmployeeNameById = (employeeId: string | null | undefined): string => {
    if (!employeeId) return 'N/D';
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Desconocido';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
            {IconComponent && <IconComponent className="mr-2 h-5 w-5"/>}
            {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {dataLoading && tasks.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner size={20} /><p className="ml-2 text-muted-foreground">Cargando...</p>
          </div>
        ) : tasks.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <ul className="space-y-2">
              {tasks.map(task => {
                const completedDate = typeof task.completedAt === 'string' ? new Date(task.completedAt) : null;
                return (
                  <li key={task.id} className="p-2 rounded-md hover:bg-muted">
                    <p className="font-medium">{task.department?.name || 'Departamento no encontrado'}</p>
                    <p className="text-xs text-muted-foreground">
                      Completado por {getEmployeeNameById(task.employeeId)} el {completedDate ? completedDate.toLocaleDateString('es-CL') : 'N/A'}
                    </p>
                </li>
                );
              })}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
