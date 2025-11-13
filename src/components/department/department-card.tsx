
"use client";
import type { Department, Employee } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, KeyRound, User, Edit3, Trash2, CheckCircle2, AlertTriangle, Loader2, MapPin, Camera } from 'lucide-react';
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
import React, { useState } from 'react';
import { MediaReportsDialog } from '@/components/media/media-reports-dialog';

interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void;
  employees: Employee[];
}

function translateStatus(status: Department['status']) {
  switch (status) {
    case 'completed': return 'Limpio';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Necesita Limpieza';
    default: return status;
  }
}

export function DepartmentCard({ department, onEdit, employees }: DepartmentCardProps) {
  const { deleteDepartment } = useData();
  const [isMediaReportsOpen, setIsMediaReportsOpen] = useState(false);
  const assignedEmployee = department.assignedTo ? employees.find(emp => emp.id === department.assignedTo) : null;

  const getStatusBadgeVariant = (status: Department['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600'; // Limpio
      case 'in_progress': return 'bg-blue-500 hover:bg-blue-600'; // En progreso
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600'; // Necesita limpieza
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
    try {
        await deleteDepartment(department.id);
    } catch (error) {
        console.error("Delete failed in DepartmentCard:", error);
    }
  };

  return (
    <>
      <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <div className="">
            <CardTitle className="font-headline text-xl mb-2 items-center">
              <Building2 className="mr-2 h-6 w-6 text-primary" />
              {department.name}
            </CardTitle>
            <Badge variant="default" className={cn("text-primary-foreground capitalize", getStatusBadgeVariant(department.status))}>
              {getStatusIcon(department.status)}
              {translateStatus(department.status)}
            </Badge>
          </div>
          <CardDescription className="flex items-center pt-1 text-sm">
            <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
            Código de Acceso: {department.accessCode}
          </CardDescription>
          {department.address && (
            <CardDescription className="flex items-start pt-1 text-xs text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              {department.address}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          {assignedEmployee && (department.status === 'pending' || department.status === 'in_progress') && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="mr-2 h-4 w-4" />
              Tarea asignada a: {assignedEmployee.name}
            </div>
          )}
          {!department.assignedTo && department.status === 'pending' && (
            <div className="flex items-center text-sm text-yellow-600">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Necesita asignación
            </div>
          )}
          {department.status === 'completed' && (
             <div className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Listo para nueva asignación
            </div>
          )}
          {department.lastCleanedAt && (
            <p className="text-xs text-muted-foreground">
              Última Limpieza: {new Date(department.lastCleanedAt).toLocaleDateString('es-CL')}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-4 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsMediaReportsOpen(true)} aria-label={`Ver evidencias de ${department.name}`}>
            <Camera className="mr-1 h-4 w-4" /> Ver Evidencias
          </Button>
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
                  departamento "{department.name}", todas las tareas y evidencias asociadas.
                  Los archivos en Storage no se eliminarán automáticamente por ahora.
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
      <MediaReportsDialog
        isOpen={isMediaReportsOpen}
        onClose={() => setIsMediaReportsOpen(false)}
        departmentId={department.id}
        departmentName={department.name}
      />
    </>
  );
}
