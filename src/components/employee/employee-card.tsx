
"use client";
import type { Employee, CleaningTask, Department } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Mail, Edit3, Trash2, Briefcase, Building2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  tasks: CleaningTask[];
  departments: Department[];
}

function translateStatus(status: Department['status'] | CleaningTask['status']) {
  switch (status) {
    case 'completed': return 'Completado';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Pendiente';
    default: return status;
  }
}

const getStatusBadgeVariant = (status: Department['status'] | CleaningTask['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-500 hover:bg-green-600';
    case 'in_progress': return 'bg-blue-500 hover:bg-blue-600';
    case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};
  
const getStatusIcon = (status: Department['status'] | CleaningTask['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-4 w-4 mr-1" />;
    case 'in_progress': return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
    case 'pending': return <AlertTriangle className="h-4 w-4 mr-1" />;
    default: return null;
  }
};


export function EmployeeCard({ employee, onEdit, tasks, departments }: EmployeeCardProps) {
  // const { deleteEmployee } = useData(); // For delete in future

  // const handleDelete = () => {
  //   // deleteEmployee(employee.id);
  // };
  
  const assignedTasksDetails = tasks
    .map(task => {
      const department = departments.find(d => d.id === task.departmentId);
      return department ? { ...task, departmentName: department.name, departmentStatus: department.status } : null;
    })
    .filter(Boolean) as (CleaningTask & { departmentName: string, departmentStatus: Department['status'] })[];


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <UserCircle className="mr-2 h-6 w-6 text-primary" />
          {employee.name}
        </CardTitle>
        <CardDescription className="flex items-center pt-1 text-sm">
          ID: {employee.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Mail className="mr-2 h-4 w-4" />
          {employee.email}
        </div>
        {assignedTasksDetails.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Briefcase className="mr-2 h-4 w-4 text-primary" />
              Tareas Asignadas ({assignedTasksDetails.length})
            </h4>
            <ScrollArea className="h-[100px] pr-2">
              <ul className="space-y-1.5 text-xs">
                {assignedTasksDetails.map(task => (
                  <li key={task.id} className="p-1.5 rounded-md bg-muted/50">
                    <div className="flex justify-between items-center">
                       <span className="flex items-center text-foreground">
                         <Building2 className="mr-1.5 h-3 w-3 text-muted-foreground" /> {task.departmentName}
                       </span>
                       <Badge 
                          variant="default" 
                          className={cn("text-primary-foreground capitalize text-[10px] px-1.5 py-0.5", getStatusBadgeVariant(task.status))}
                        >
                          {getStatusIcon(task.status)}
                          {translateStatus(task.status)}
                        </Badge>
                    </div>
                     <p className="text-muted-foreground text-[10px] ml-5">
                        Asignada: {task.assignedAt.toLocaleDateString('es-CL')}
                      </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
         {assignedTasksDetails.length === 0 && (
           <p className="mt-4 pt-3 border-t text-xs text-muted-foreground">No tiene tareas asignadas actualmente.</p>
         )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(employee)} aria-label={`Editar ${employee.name}`} disabled>
          <Edit3 className="mr-1 h-4 w-4" /> Editar (Próx.)
        </Button>
        {/* <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" aria-label={`Eliminar ${employee.name}`} disabled>
              <Trash2 className="mr-1 h-4 w-4" /> Eliminar (Próx.)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al empleado "{employee.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog> */}
      </CardFooter>
    </Card>
  );
}
