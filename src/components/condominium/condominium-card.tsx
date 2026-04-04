"use client";
import React from 'react';
import type { Condominium } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Building2, MapPin, MoreHorizontal, Pencil, Trash2, ArrowRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

interface CondominiumCardProps {
    condominium: Condominium;
    onEdit: (condo: Condominium) => void;
    departmentCount: number;
    /** Number of departments in this condo with status completed (for progress bar) */
    completedCount?: number;
    hasActiveWork?: boolean;
}


export function CondominiumCard({ condominium, onEdit, departmentCount, completedCount = 0, hasActiveWork }: CondominiumCardProps) {
    const { deleteCondominium } = useData();
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

    const handleDelete = async () => {
        try {
            await deleteCondominium(condominium.id);
            setShowDeleteDialog(false);
        } catch (error) {
            console.error('Error al eliminar condominio', error);
        }
    };

    const progressPercent = departmentCount > 0
        ? Math.round((completedCount / departmentCount) * 100)
        : 0;

    return (
        <>
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group relative rounded-2xl border-border/50">
                {/* Image Section */}
                <div className="relative h-72 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {condominium.imageUrl ? (
                        <img
                            src={condominium.imageUrl}
                            alt={condominium.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
                            <Building2 className="w-16 h-16 text-slate-400 dark:text-slate-600" />
                        </div>
                    )}

                    {/* Overlay badges on image */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                        {/* El indicador ahora está en el área de contenido (punto rojo al lado del nombre) */}
                    </div>

                    {/* Menu button */}
                    <div className="absolute top-3 right-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-black/70 border-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(condominium)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Content Section */}
                <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate" title={condominium.name}>
                            {condominium.name}
                        </h3>
                        {hasActiveWork && (
                            <div className="relative flex items-center mr-2 justify-center h-4 w-4 shrink-0" title="Trabajo en progreso">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white dark:border-slate-900 shadow-sm"></span>
                            </div>
                        )}
                    </div>
                    {condominium.address && (
                        <div className="flex items-start text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{condominium.address}</span>
                        </div>
                    )}

                    {/* Progress */}
                    {departmentCount > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>Progreso de Limpieza</span>
                                <span className={cn(
                                    progressPercent === 100 ? "text-emerald-600" : "text-primary"
                                )}>{progressPercent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        completedCount === departmentCount ? "bg-emerald-500" :
                                        (completedCount > 0 || hasActiveWork) ? "bg-primary" :
                                        "bg-amber-500"
                                    )}
                                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {completedCount}/{departmentCount} unidades atendidas
                            </p>
                        </div>
                    )}

                    {departmentCount === 0 && (
                        <div className="flex items-center text-sm font-medium text-muted-foreground bg-muted/30 p-2 rounded-lg">
                            <Building2 className="h-4 w-4 mr-2 text-primary" />
                            Sin departamentos asignados
                        </div>
                    )}
                </CardContent>

                <CardFooter className="px-5 pb-4 pt-0">
                    <Button asChild className="w-full hover:bg-primary hover:text-primary-foreground transition-colors rounded-xl" variant="outline">
                        <Link href={`/admin/condominiums/${condominium.id}`}>
                            Ver Departamentos <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar condominio?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el condominio "{condominium.name}".
                            Asegúrate de que no tenga departamentos asignados o estos quedarán huérfanos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
