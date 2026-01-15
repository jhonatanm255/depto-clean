
"use client";
import type { Department, Employee } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, KeyRound, User, Edit3, Trash2, CheckCircle2, AlertTriangle, Loader2, MapPin, Camera, ChevronDown, ChevronUp, Bed, Bath } from 'lucide-react';
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
import React, { useState, useEffect, useMemo } from 'react';
import { MediaReportsDialog } from '@/components/media/media-reports-dialog';

interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void;
  employees: Employee[];
  isExpanded?: boolean; // Estado controlado desde el padre (solo móvil)
  onExpandToggle?: (deptId: string) => void; // Callback para toggle (solo móvil)
  isSelected?: boolean; // Para resaltar en desktop
  onSelect?: (department: Department) => void; // Para seleccionar en desktop
}

function translateStatus(status: Department['status']) {
  switch (status) {
    case 'completed': return 'Limpio';
    case 'in_progress': return 'En Progreso';
    case 'pending': return 'Necesita Limpieza';
    default: return status;
  }
}

export function DepartmentCard({
  department,
  onEdit,
  employees,
  isExpanded: controlledIsExpanded,
  onExpandToggle,
  isSelected,
  onSelect
}: DepartmentCardProps) {
  const { deleteDepartment } = useData();
  const [isMediaReportsOpen, setIsMediaReportsOpen] = useState(false);
  const [localIsExpanded, setLocalIsExpanded] = useState(false);

  // Calcular total de camas desde el array de distribución
  const totalBeds = useMemo(() => {
    if (!department.beds) return 0;
    return department.beds.reduce((acc, bed) => acc + (bed.quantity || 0), 0);
  }, [department.beds]);

  // Detectar si es móvil (para habilitar/deshabilitar expansión)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)'); // breakpoint lg de Tailwind
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Determinar si está expandido: 
  // En móvil (lg:hidden o < 1024px) permitimos expansión.
  // En desktop forzamos false para usar el sidebar.
  const isExpanded = isMobile
    ? (controlledIsExpanded !== undefined ? controlledIsExpanded : localIsExpanded)
    : false;

  const handleCardClick = () => {
    if (onSelect && !isMobile) {
      // En desktop, click selecciona para el sidebar
      onSelect(department);
    } else {
      // En móvil, click en la tarjeta expande/colapsa
      if (onExpandToggle) {
        onExpandToggle(department.id);
      } else {
        setLocalIsExpanded(prev => !prev);
      }
      // También notificamos la selección para resaltar la tarjeta si es necesario
      if (onSelect) onSelect(department);
    }
  };

  const assignedEmployee = department.assignedTo ? employees.find(emp => emp.id === department.assignedTo) : null;

  const getStatusBadgeVariant = (status: Department['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600'; // Limpio
      case 'in_progress': return 'bg-primary hover:bg-primary/90'; // En progreso
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

  // Determinar si estamos en desktop (cuando hay control desde el padre)
  const isDesktop = controlledIsExpanded !== undefined;

  return (
    <>
      <Card
        onClick={handleCardClick}
        className={cn(
          "flex flex-col shadow-lg hover:shadow-xl overflow-hidden cursor-pointer transition-all duration-200",
          isSelected ? "ring-2 ring-primary border-primary shadow-primary/20" : ""
        )}
      >
        {/* Vista compacta (colapsada) */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isExpanded
              ? "max-h-0 opacity-0"
              : "max-h-[200px] opacity-100"
          )}
        >
          <div className="flex items-center justify-between p-3.5 gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary shrink-0" />
                  <h3 className="font-headline text-lg font-bold truncate">
                    {department.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                  <Badge variant="default" className={cn("text-primary-foreground capitalize text-xs", getStatusBadgeVariant(department.status))}>
                    {getStatusIcon(department.status)}
                    {translateStatus(department.status)}
                  </Badge>
                  <span className="flex items-center text-sm text-muted-foreground mr-3">
                    <KeyRound className="mr-1 h-4 w-4 shrink-0" />
                    {department.accessCode}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground border-l pl-4 ml-1">
                    <div className="flex items-center">
                      <Bed className="mr-2 h-5 w-5 text-primary/60" />
                      <span>{department.bedrooms ?? 0} Hab.</span>
                    </div>
                    <div className="flex items-center">
                      <Bath className="mr-2 h-5 w-5 text-primary/60" />
                      <span>{department.bathrooms ?? 0} Baños</span>
                    </div>
                    <div className="flex items-center">
                      <Bed className="mr-2 h-5 w-5 text-primary/60" />
                      <span>{totalBeds} Camas</span>
                    </div>
                  </div>
                </div>
              </div>
              {!onSelect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar que dispare onSelect si existiera
                    if (onExpandToggle) {
                      onExpandToggle(department.id);
                    } else {
                      setLocalIsExpanded(prev => !prev);
                    }
                  }}
                  className="shrink-0 h-8 w-8 p-0"
                  aria-label="Expandir detalles"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Vista expandida (completa) */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isExpanded
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="font-headline text-xl mb-1 flex items-center overflow-hidden">
                      <Building2 className="mr-2 h-5 w-5 text-primary shrink-0" />
                      <span className="truncate">{department.name}</span>
                    </CardTitle>
                    <Badge variant="default" className={cn("text-primary-foreground capitalize shrink-0", getStatusBadgeVariant(department.status))}>
                      {getStatusIcon(department.status)}
                      {translateStatus(department.status)}
                    </Badge>
                  </div>
                </div>
                {!onSelect && !isSelected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onExpandToggle) {
                        onExpandToggle(department.id);
                      } else {
                        setLocalIsExpanded(false);
                      }
                    }}
                    className="shrink-0"
                    aria-label="Colapsar detalles"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                )}
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

              {isExpanded && (
                <div className="pt-4 border-t mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col p-3 bg-muted/20 rounded-lg border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Habitaciones</span>
                      <div className="flex items-center text-sm font-bold">
                        <Bed className="mr-2 h-4 w-4 text-primary" />
                        {department.bedrooms ?? 0}
                      </div>
                    </div>
                    <div className="flex flex-col p-3 bg-muted/20 rounded-lg border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Baños</span>
                      <div className="flex items-center text-sm font-bold">
                        <Bath className="mr-2 h-4 w-4 text-primary" />
                        {department.bathrooms ?? 0}
                      </div>
                    </div>
                    <div className="col-span-2 space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-primary" />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Distribución de Camas</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-primary">{totalBeds}</span>
                          <span className="text-[8px] text-primary/60 font-bold uppercase">Total</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const bedTypes = ['individual', 'matrimonial', 'king'];
                          const labels: Record<string, string> = {
                            individual: 'Indiv.',
                            matrimonial: 'Matrim.',
                            king: 'King'
                          };
                          return bedTypes.map((type) => {
                            const bed = department.beds?.find(b => b.type.toLowerCase() === type);
                            return (
                              <div key={type} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-primary/10 rounded overflow-hidden">
                                <span className="text-[9px] font-bold text-primary/80">{labels[type]}</span>
                                <div className="h-3 w-[1px] bg-primary/20"></div>
                                <span className="text-xs font-black text-primary">{bed?.quantity ?? 0}</span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Toallas Mano</span>
                      <span className="text-sm font-bold">{department.handTowels ?? 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Toallas Cuerpo</span>
                      <span className="text-sm font-bold">{department.bodyTowels ?? 0}</span>
                    </div>
                  </div>

                  {department.customFields && department.customFields.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Más Información</span>
                      <div className="space-y-1">
                        {department.customFields.map((field, idx) => (
                          <div key={idx} className="text-xs flex justify-between">
                            <span className="text-muted-foreground">{field.name}:</span>
                            <span className="font-semibold">{field.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
          </div>
        </div>
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
