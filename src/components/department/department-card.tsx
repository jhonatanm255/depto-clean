
"use client";
import type { Department, Employee } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, KeyRound, User, Edit3, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/data-context';

interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void;
  employees: Employee[];
}

function translateStatus(status: Department['status']) {
  switch (status) {
    case 'completed': return 'Completado';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Pendiente';
    default: return status;
  }
}

export function DepartmentCard({ department, onEdit, employees }: DepartmentCardProps) {
  const { deleteDepartment } = useData();
  const assignedEmployee = employees.find(emp => emp.id === department.assignedTo);

  const getStatusBadgeVariant = (status: Department['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in_progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: Department['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  const handleDelete = async () => {
    await deleteDepartment(department.id);
  };

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="font-headline text-xl flex items-center">
            <Building2 className="mr-2 h-6 w-6 text-primary" />
            {department.name}
          </CardTitle>
          <Badge variant="default" className={cn("text-primary-foreground capitalize", getStatusBadgeVariant(department.status))}>
            {getStatusIcon(department.status)}
            {translateStatus(department.status)}
          </Badge>
        </div>
        <CardDescription className="flex items-center pt-1">
          <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
          Código de Acceso: {department.accessCode}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {assignedEmployee && (
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            Asignado a: {assignedEmployee.name}
          </div>
        )}
        {!assignedEmployee && department.status === 'pending' && (
           <div className="flex items-center text-sm text-yellow-600">
             <AlertTriangle className="mr-2 h-4 w-4" />
             Necesita asignación
           </div>
        )}
         {department.lastCleanedAt && (
          <p className="text-xs text-muted-foreground">
            Última Limpieza: {new Date(department.lastCleanedAt).toLocaleDateString('es-CL')}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(department)} aria-label={`Editar ${department.name}`}>
          <Edit3 className="mr-1 h-4 w-4" /> Editar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" aria-label={`Eliminar ${department.name}`}>
              <Trash2 className="mr-1 h-4 w-4" /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el
                departamento "{department.name}" y todas las tareas asociadas.
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
