
"use client";
import type { CleaningTask, Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, KeyRound, CheckCircle2, Loader2, AlertTriangle, CalendarDays, MapPin, ExternalLink, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { MediaUploadDialog } from '@/components/media/media-upload-dialog';
import { Bed, Bath, ChevronDown, ChevronUp, User, Utensils } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskCardProps {
  task: CleaningTask;
  department?: Department;
  isSelected?: boolean;
  onSelect?: () => void;
}

function translateStatus(status: CleaningTask['status']) {
  switch (status) {
    case 'completed': return 'Completada';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Pendiente';
    default: return status;
  }
}

export function TaskCard({ task, department, isSelected, onSelect }: TaskCardProps) {
  const { updateTaskStatus, tasks, condominiums } = useData();
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const isExpanded = isMobile ? localIsExpanded : false;

  const condominium = department?.condominiumId
    ? condominiums.find(c => c.id === department.condominiumId)
    : null;

  const handleCardClick = () => {
    if (!isMobile && onSelect) {
      onSelect();
    } else if (isMobile) {
      setLocalIsExpanded(prev => !prev);
    }
  };

  // Calcular total de camas si existe el departamento
  const totalBeds = React.useMemo(() => {
    if (!department?.beds) return 0;
    return department.beds.reduce((acc, bed) => acc + (bed.quantity || 0), 0);
  }, [department]);

  const handleUpdateStatus = async (status: 'pending' | 'in_progress' | 'completed') => {
    await updateTaskStatus(task.id, status);
  };

  const getStatusBadgeVariant = (status: CleaningTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in_progress': return 'bg-primary hover:bg-primary/90';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: CleaningTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
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
      <Card
        onClick={handleCardClick}
        className={cn(
          "flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden",
          isSelected || isExpanded ? "ring-.5 ring-primary border-primary shadow-primary/20" : ""
        )}
      >
        {/* Header Compacto (Siempre visible) */}
        <CardHeader className="p-4 flex-grow-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="h-6 w-6 text-primary shrink-0" />
              <div className="min-w-0">
                {condominium && (
                  <p className="text-xs text-muted-foreground uppercase font-bold truncate">
                    {condominium.name}
                  </p>
                )}
                <h3 className="font-headline text-lg font-bold truncate">
                  {department.name}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="default" className={cn("text-primary-foreground capitalize text-[10px] sm:text-xs shrink-0 flex items-center gap-1 px-2.5 py-0.5", getStatusBadgeVariant(task.status))}>
                {getStatusIcon(task.status)}
                {translateStatus(task.status)}
              </Badge>
              {isMobile && (
                <div className="text-muted-foreground ml-1">
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span className="flex items-center text-sm text-muted-foreground mr-3">
              <KeyRound className="mr-1 h-4 w-4 shrink-0" />
              {department.accessCode}
            </span>
            <div className="flex items-center gap-4 text-sm text-muted-foreground border-l pl-4 ml-1">
              <div className="flex items-center">
                <Bed className="mr-2 h-5 w-5 text-primary/60" />
                <span>{department.bedrooms ?? 0}</span>
              </div>
              <div className="flex items-center">
                <Bath className="mr-2 h-5 w-5 text-primary/60" />
                <span>{department.bathrooms ?? 0}</span>
              </div>
              <div className="flex items-center">
                <Bed className="mr-2 h-5 w-5 text-primary/60" />
                <span>{totalBeds}</span>
              </div>
            </div>
          </div>
          {(department.address || condominium?.address) && (
            <CardDescription className="flex items-center pt-2 text-xs text-muted-foreground border-t mt-2">
              <MapPin className="mr-2 h-3.5 w-3.5 shrink-0" />
              <div className="flex flex-col min-w-0">
                {condominium?.address && (
                  <span className="truncate font-medium">{condominium.address}</span>
                )}
                {department.address && (
                  <span className="truncate">{department.address}</span>
                )}
              </div>
            </CardDescription>
          )}
        </CardHeader>

        {/* Sección de Contenido (Se expande en móvil, oculto en desktop) */}
        <div className={cn(
          "transition-all duration-300 ease-in-out lg:hidden",
          isExpanded ? "max-h-[1000px] opacity-100 pb-4" : "max-h-0 opacity-0 pb-0"
        )}>
          <CardContent className="px-4 py-0 space-y-4">
            {/* Detalles de Distribución (Similar al Sidebar) - Solo visible cuando está expandido o en desktop */}
            <div className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Bed className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Camas</span>
                  </div>
                  <div className="space-y-1">
                    {department.beds && department.beds.length > 0 ? (
                      department.beds.map((bed, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{bed.type.replace('_', ' ')}:</span>
                          <span className="font-semibold">{bed.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Sin camas registradas</p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 p-2.5 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Utensils className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Adicionales</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Toallas (C/M):</span>
                      <span className="font-semibold">{department.bodyTowels ?? 0} / {department.handTowels ?? 0}</span>
                    </div>
                    {department.customFields && department.customFields.map((field, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2">{field.name}:</span>
                        <span className="font-semibold">{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Información de Tarea */}
              <div className="flex items-center justify-between pt-2 border-t text-[10px] text-muted-foreground uppercase font-bold">
                <span className="flex items-center">
                  <CalendarDays className="mr-1 h-3 w-3" /> Asignada: {new Date(task.assignedAt).toLocaleDateString('es-CL')}
                </span>
                {task.status === 'completed' && task.completedAt && (
                  <span className="flex items-center text-green-600">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> {new Date(task.completedAt).toLocaleDateString('es-CL')}
                  </span>
                )}
              </div>
            </div>
          </CardContent>

        </div>

        <CardFooter className="p-4 flex flex-col gap-2 mt-auto border-t">
          <div className="flex gap-2 w-full">
            {googleMapsUrl && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(googleMapsUrl, '_blank');
                }}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Mapa
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsMediaUploadOpen(true);
              }}
              className="flex-1 h-8 text-xs"
              disabled={task.status === 'completed'}
            >
              <UploadCloud className="mr-1.5 h-3.5 w-3.5" /> Evidencia
            </Button>
          </div>

          <div className="w-full pt-2 border-t">
            {task.status === 'pending' && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleUpdateStatus('in_progress'); }} className="flex-1 h-9 text-xs">
                  <Loader2 className="mr-1 h-3.5 w-3.5" /> Iniciar
                </Button>
                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUpdateStatus('completed'); }} className="bg-green-500 hover:bg-green-600 text-white flex-1 h-9 text-xs">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Completar
                </Button>
              </div>
            )}
            {task.status === 'in_progress' && (
              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUpdateStatus('completed'); }} className="bg-green-500 hover:bg-green-600 text-white w-full h-9 text-xs">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Finalizar Tarea
              </Button>
            )}
            {task.status === 'completed' && (
              <div className="bg-green-5 text-green-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center border border-green-100 italic">
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Tarea Completada con Éxito
              </div>
            )}
          </div>
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
