
"use client";
import type { EmployeeProfile, CleaningTask, Department } from '@/lib/types'; // Usar EmployeeProfile
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Mail, Edit3, Trash2, Briefcase, Building2, CheckCircle2, AlertTriangle, Loader2, MapPin, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/data-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmployeeCardProps {
  employee: EmployeeProfile; // Usar EmployeeProfile
  onEdit: (employee: EmployeeProfile) => void; // Usar EmployeeProfile
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
    case 'completed': return 'bg-green-100 dark:bg-emerald-400/10 text-green-600 dark:text-green-400';
    case 'in_progress': return 'bg-blue-100 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400';
    case 'pending': return 'bg-yellow-100 dark:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400';
    default: return 'bg-gray-100 dark:bg-gray-400/10 text-gray-600 dark:text-gray-400';
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


const ROLE_LABEL: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  employee: 'Empleado',
};

const MAX_TASKS_AT_CAPACITY = 5;

function getWorkloadStatus(taskCount: number, inProgressCount: number) {
  if (taskCount >= MAX_TASKS_AT_CAPACITY) return 'at_capacity';
  if (inProgressCount > 0) return 'on_site';
  return 'available';
}

export function EmployeeCard({ employee, onEdit, tasks, departments }: EmployeeCardProps) {
  const { deleteEmployee } = useData();

  const handleDelete = async () => {
    try {
      await deleteEmployee(employee.id);
    } catch (error) {
      console.error("Error eliminando empleada en EmployeeCard:", error);
    }
  };

  const assignedTasksDetails = tasks
    .filter(task => task.employeeId === employee.id)
    .map(task => {
      const department = departments.find(d => d.id === task.departmentId);
      return department ? { ...task, departmentName: department.name, departmentStatus: department.status, departmentAddress: department.address, departmentPriority: department.priority } : null;
    })
    .filter(Boolean) as (CleaningTask & { departmentName: string, departmentStatus: Department['status'], departmentAddress?: string, departmentPriority?: 'normal' | 'high' })[];


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl flex items-center">
            <UserCircle className="mr-2 h-6 w-6 text-primary" />
            {employee.name}
          </CardTitle>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Role Badge */}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 gap-1",
              employee.role === 'admin'
                ? 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                : 'border-slate-400/50 text-slate-600 dark:text-slate-400 bg-slate-500/10'
            )}
          >
            {employee.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
            {ROLE_LABEL[employee.role] ?? employee.role}
          </Badge>

          {/* Workload Status Badge */}
          {(() => {
            const tasksCount = tasks.length;
            const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
            const status = getWorkloadStatus(tasksCount, inProgressCount);
            return (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5",
                  status === 'available' && 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
                  status === 'on_site' && 'border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/10',
                  status === 'at_capacity' && 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10'
                )}
              >
                <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', status === 'available' && 'bg-emerald-500', status === 'on_site' && 'bg-amber-500', status === 'at_capacity' && 'bg-red-500')} />
                {status === 'available' ? 'Disponible' : status === 'on_site' ? 'En sitio' : 'Al límite'}
              </Badge>
            );
          })()}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Mail className="mr-2 h-4 w-4" />
          {employee.email ?? 'Sin correo'}
        </div>
        {assignedTasksDetails.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Briefcase className="mr-2 h-4 w-4 text-primary" />
              Tareas Asignadas ({assignedTasksDetails.length})
            </h4>
            <ScrollArea className="h-[130px] pr-2">
              <ul className="space-y-1.5 text-sm"> {/* Base font size for list items now text-sm */}
                {assignedTasksDetails.map(task => (
                  <li key={task.id} className="p-1.5 rounded-md bg-muted/50">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center text-foreground font-semibold"> {/* Department name made semibold */}
                        <Building2 className="mr-1.5 h-4 w-4 text-muted-foreground" /> {task.departmentName}
                      </span>
                      <div className="flex items-center gap-1">
                        {task.departmentPriority === 'high' && (
                          <Badge variant="destructive" className="bg-orange-400/20 text-orange-600 dark:text-orange-400 text-[10px] px-1.5 py-0.5 h-auto">Prioritario</Badge>
                        )}
                        <Badge
                          variant="default"
                          className={cn("text-primary-foreground capitalize text-[10px] px-1.5 py-0.5", getStatusBadgeVariant(task.status))}
                        >
                          {getStatusIcon(task.status)}
                          {translateStatus(task.status)}
                        </Badge>
                      </div>
                    </div>
                    {task.departmentAddress && (
                      <p className="text-muted-foreground text-xs mt-2 ml-5 flex items-center"> {/* Inherits text-sm */}
                        <MapPin className="mr-1 h-3 w-3 shrink-0" /> {task.departmentAddress}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs mt-2 ml-5"> {/* Inherits text-sm */}
                      Asignada: 
                      <span className="text-xs font-bold ml-1">{new Date(task.assignedAt).toLocaleDateString('es-CL')}</span>
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" aria-label={`Eliminar ${employee.name}`}>
              <Trash2 className="mr-1 h-4 w-4" /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente la cuenta de
                "{employee.name}" y todas las tareas asociadas. La persona no podrá acceder a la aplicación.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
