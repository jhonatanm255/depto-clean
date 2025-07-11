
"use client";
import type { CleaningTask, Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, KeyRound, CheckCircle2, Loader2, AlertTriangle, CalendarDays, MapPin, ExternalLink, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { MediaUploadDialog } from '@/components/media/media-upload-dialog'; // Importar

interface TaskCardProps {
  task: CleaningTask;
  department?: Department;
}

function translateStatus(status: CleaningTask['status']) {
  switch (status) {
    case 'completed': return 'Completada';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Pendiente';
    default: return status;
  }
}

export function TaskCard({ task, department }: TaskCardProps) {
  const { updateTaskStatus } = useData();
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);

  const handleUpdateStatus = async (status: 'pending' | 'in_progress' | 'completed') => {
    await updateTaskStatus(task.id, status);
  };

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

  if (!department) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Error de Tarea</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Detalles del departamento no encontrados para esta tarea.</p>
        </CardContent>
      </Card>
    );
  }

  const googleMapsUrl = department.address 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(department.address)}`
    : null;

  return (
    <>
      <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="font-headline text-xl flex items-center">
              <Building2 className="mr-2 h-6 w-6 text-primary" />
              {department.name}
            </CardTitle>
            <Badge variant="default" className={cn("text-primary-foreground capitalize", getStatusBadgeVariant(task.status))}>
              {getStatusIcon(task.status)}
              {translateStatus(task.status)}
            </Badge>
          </div>
          <CardDescription className="flex items-center pt-1 text-sm text-muted-foreground">
            <KeyRound className="mr-2 h-4 w-4" />
            Código de Acceso: {department.accessCode}
          </CardDescription>
          {department.address && (
            <CardDescription className="flex items-start pt-1 text-xs text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4 shrink-0" />
              {department.address}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <p className="flex items-center text-sm text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4"/> Asignada: {new Date(task.assignedAt).toLocaleDateString('es-CL')}
          </p>
          {task.status === 'completed' && task.completedAt && (
            <p className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="mr-2 h-4 w-4"/> Completada: {new Date(task.completedAt).toLocaleDateString('es-CL')}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-2 flex-wrap">
            {googleMapsUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto flex-grow"
                onClick={() => window.open(googleMapsUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Ver en Mapa
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsMediaUploadOpen(true)} 
              className="w-full sm:w-auto flex-grow"
              disabled={task.status === 'completed'} // Opcional: deshabilitar si ya está completada
            >
              <UploadCloud className="mr-2 h-4 w-4" /> Subir Evidencia
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 border-t pt-4 flex-wrap">
          {task.status === 'pending' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('in_progress')} className="w-full sm:w-auto">
                <Loader2 className="mr-1 h-4 w-4" /> Iniciar Limpieza
              </Button>
              <Button size="sm" onClick={() => handleUpdateStatus('completed')} className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
                <CheckCircle2 className="mr-1 h-4 w-4" /> Marcar Completada
              </Button>
            </>
          )}
          {task.status === 'in_progress' && (
            <Button size="sm" onClick={() => handleUpdateStatus('completed')} className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Marcar Completada
            </Button>
          )}
          {task.status === 'completed' && (
            <p className="text-sm text-green-600 font-medium">¡Tarea Completada!</p>
          )}
        </CardFooter>
      </Card>
      {department && (
        <MediaUploadDialog 
          isOpen={isMediaUploadOpen} 
          onClose={() => setIsMediaUploadOpen(false)} 
          departmentId={department.id} 
        />
      )}
    </>
  );
}
