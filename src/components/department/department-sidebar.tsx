
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import type { Department, Employee } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    KeyRound,
    User,
    Edit3,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    MapPin,
    Camera,
    X,
    Bed,
    Bath,
    Utensils,
    Info,
    DoorOpen
} from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MediaReportsDialog } from '@/components/media/media-reports-dialog';
import { useAuth } from '@/contexts/auth-context';

interface DepartmentSidebarProps {
    department: Department | null;
    onClose: () => void;
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

export function DepartmentSidebar({
    department,
    onClose,
    onEdit,
    employees
}: DepartmentSidebarProps) {
    const { deleteDepartment, condominiums } = useData();
    const { currentUser } = useAuth();
    const [isMediaReportsOpen, setIsMediaReportsOpen] = React.useState(false);

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

    if (!department) return null;

    const condominium = department.condominiumId
        ? condominiums.find(c => c.id === department.condominiumId)
        : null;

    // Calcular total de camas desde el array de distribución
    const totalBeds = (department.beds || []).reduce((acc, bed) => acc + (bed.quantity || 0), 0);

    const assignedEmployee = department.assignedTo ? employees.find(emp => emp.id === department.assignedTo) : null;

    const getStatusBadgeVariant = (status: Department['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700 ';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
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
            onClose();
        } catch (error) {
            console.error("Delete failed in DepartmentSidebar:", error);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-card border-l shadow-xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between bg-muted/30">
                <h2 className="text-xl font-bold font-headline flex items-center">
                    <Building2 className="mr-2 h-6 w-6 text-primary" />
                    Detalles
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Main Info */}
                    <div>
                        {condominium && (
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1">
                                {condominium.name}
                            </p>
                        )}
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <h1 className="text-3xl font-bold font-headline leading-tight">{department.name}</h1>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                                <Badge variant="default" className={cn("text-primary-foreground capitalize py-1 px-2.5 whitespace-nowrap flex items-center justify-center gap-1", getStatusBadgeVariant(department.status))}>
                                    {getStatusIcon(department.status)}
                                    {translateStatus(department.status)}
                                </Badge>
                                {department.lastCleanedAt && (
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        Última: {new Date(department.lastCleanedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        {(department.address || condominium?.address) && (
                            <div className="space-y-2">
                                {condominium?.address && (
                                    <p className="flex items-center text-sm text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-dashed">
                                        <MapPin className="mr-2 h-4 w-4 shrink-0 text-primary" />
                                        <span className="font-semibold">{condominium.address}</span>
                                    </p>
                                )}
                                {department.address && (
                                    <p className="flex items-center text-sm text-muted-foreground bg-muted/20 p-3 rounded-2xl border border-dashed">
                                        <MapPin className="mr-2 h-4 w-4 shrink-0" />
                                        <span>{department.address}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Configuration Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card border rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                            <DoorOpen className="h-6 w-6 text-primary mb-2" />
                            <span className="text-2xl font-bold">{department.bedrooms ?? 0}</span>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Habitaciones</span>
                        </div>
                        <div className="bg-card border rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                            <Bath className="h-6 w-6 text-primary mb-2" />
                            <span className="text-2xl font-bold">{department.bathrooms ?? 0}</span>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Baños</span>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex flex-col gap-4 shadow-sm col-span-2">
                            <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                                <div className="flex items-center gap-3">
                                    <Bed className="h-6 w-6 text-primary" />
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Capacidad de Camas</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-primary">{totalBeds}</span>
                                    <span className="text-[10px] text-primary/60 font-bold uppercase">Total</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-between gap-2">
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
                                            <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-primary/10 rounded-2xl shadow-sm">
                                                <span className="text-[11px] font-bold text-primary/80">{labels[type]}</span>
                                                <div className="h-4 w-[1px] bg-primary/20"></div>
                                                <span className="text-xs font-black text-primary">{bed?.quantity ?? 0}</span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Towels */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Toallas Requeridas</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col p-3 bg-muted/10 rounded-2xl border border-primary/10">
                                <span className="text-xs text-muted-foreground mb-1">Mano</span>
                                <span className="text-lg font-bold">{department.handTowels ?? 0}</span>
                            </div>
                            <div className="flex flex-col p-3 bg-muted/10 rounded-2xl border border-primary/10">
                                <span className="text-xs text-muted-foreground mb-1">Cuerpo</span>
                                <span className="text-lg font-bold">{department.bodyTowels ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Custom Fields */}
                    {department.customFields && department.customFields.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Información Adicional</h3>
                            <div className="space-y-2">
                                {department.customFields.map((field, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-card border rounded-2xl">
                                        <span className="text-sm font-medium text-muted-foreground">{field.name}</span>
                                        <span className="text-sm font-bold">{field.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assignments info */}
                    <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary/70">Asignación Actual</h3>
                        {assignedEmployee ? (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm tracking-tight leading-none mb-1">{assignedEmployee.name}</p>
                                    <p className="text-xs text-muted-foreground">Estado: {translateStatus(department.status)}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">Sin tarea asignada actualmente.</p>
                        )}
                    </div>

                    {/* Notes if any */}
                    {department.notes && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notas Internas</h3>
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-sm text-yellow-800 italic">
                                "{department.notes}"
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-6 border-t bg-muted/30 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full" onClick={() => setIsMediaReportsOpen(true)}>
                        <Camera className="mr-2 h-4 w-4" /> Reportes
                    </Button>
                    {isAdmin && (
                        <Button variant="outline" className="w-full" onClick={() => onEdit(department)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Editar
                        </Button>
                    )}
                </div>

                {isAdmin && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Departamento
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción eliminará el departamento "{department.name}" y todo su historial.
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
                )}
            </div>

            <MediaReportsDialog
                isOpen={isMediaReportsOpen}
                onClose={() => setIsMediaReportsOpen(false)}
                departmentId={department.id}
                departmentName={department.name}
            />
        </div>
    );
}
