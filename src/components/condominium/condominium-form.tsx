"use client";
import React from 'react';
import type { Condominium } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Building2, MapPin } from 'lucide-react';

const condominiumSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    address: z.string().optional(),
});

type CondominiumFormData = z.infer<typeof condominiumSchema>;

interface CondominiumFormProps {
    isOpen: boolean;
    onClose: () => void;
    condominium?: Condominium | null;
}

export function CondominiumForm({ isOpen, onClose, condominium }: CondominiumFormProps) {
    const { addCondominium, updateCondominium } = useData();

    const form = useForm<CondominiumFormData>({
        resolver: zodResolver(condominiumSchema),
        defaultValues: {
            name: '',
            address: '',
        },
    });

    React.useEffect(() => {
        if (isOpen) {
            if (condominium) {
                form.reset({
                    name: condominium.name,
                    address: condominium.address ?? '',
                });
            } else {
                form.reset({
                    name: '',
                    address: '',
                });
            }
        }
    }, [condominium, form, isOpen]);

    const onSubmit: SubmitHandler<CondominiumFormData> = async (data) => {
        try {
            if (condominium) {
                await updateCondominium({
                    ...condominium,
                    name: data.name,
                    address: data.address?.trim() ? data.address : null,
                });
            } else {
                await addCondominium({
                    name: data.name,
                    address: data.address?.trim() ? data.address : null,
                });
            }
            onClose();
        } catch (error) {
            console.error("Submit error in CondominiumForm:", error);
        }
    };

    const handleCloseDialog = () => {
        form.reset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleCloseDialog(); } }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{condominium ? 'Editar Condominio' : 'Agregar Nuevo Condominio'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Condominio</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ej: Torres del Sol" {...field} className="pl-9" disabled={form.formState.isSubmitting} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dirección (Opcional)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Textarea placeholder="Ej: Av. Principal 123" {...field} className="pl-9 min-h-[80px]" disabled={form.formState.isSubmitting} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={form.formState.isSubmitting}>Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
                                {form.formState.isSubmitting ? (condominium ? 'Guardando...' : 'Agregando...') : (condominium ? 'Guardar Cambios' : 'Crear Condominio')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
