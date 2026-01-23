"use client";
import React from 'react';
import type { Condominium } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Building2, MapPin, MoreHorizontal, Pencil, Trash2, ArrowRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    hasActiveWork?: boolean;
}


export function CondominiumCard({ condominium, onEdit, departmentCount, hasActiveWork }: CondominiumCardProps) {
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

    return (
        <>
            <Card className="hover:shadow-md transition-shadow group relative">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center text-xl font-bold truncate pr-8" title={condominium.name}>
                            <Building className="h-5 w-5 mr-2 text-primary" />
                            {condominium.name}
                            {hasActiveWork && (
                                <span className="relative flex h-4 w-4 ml-2 items-center justify-center">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-4 right-4">
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
                </CardHeader>

                <CardContent className="pb-4 space-y-3">
                    {condominium.address && (
                        <div className="flex items-start text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{condominium.address}</span>
                        </div>
                    )}
                    <div className="flex items-center text-sm font-medium text-muted-foreground bg-muted/30 p-2 rounded-lg">
                        <Building2 className="h-4 w-4 mr-2 text-primary" />
                        {departmentCount} {departmentCount === 1 ? 'Departamento' : 'Departamentos'}
                    </div>
                </CardContent>
                <CardFooter className="pt-0">
                    <Button asChild className="w-full hover:bg-primary hover:text-primary-foreground transition-colors" variant="outline">
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
