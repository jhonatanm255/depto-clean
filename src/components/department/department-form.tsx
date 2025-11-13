
"use client";
import React from 'react';
import type { Department } from '@/lib/types';
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

const departmentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  accessCode: z.string().min(1, "Se requiere el código de acceso"),
  address: z.string().optional(), 
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department | null;
}

export function DepartmentForm({ isOpen, onClose, department }: DepartmentFormProps) {
  const { addDepartment, updateDepartment } = useData();
  
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: department 
      ? { name: department.name, accessCode: department.accessCode ?? '', address: department.address ?? '' } 
      : { name: '', accessCode: '', address: '' },
  });

  React.useEffect(() => {
    if (isOpen) { 
      if (department) {
        form.reset({ name: department.name, accessCode: department.accessCode ?? '', address: department.address ?? '' });
      } else {
        form.reset({ name: '', accessCode: '', address: '' });
      }
    }
  }, [department, form, isOpen]);

  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    try {
      if (department) {
        await updateDepartment({ 
          ...department, 
          name: data.name,
          accessCode: data.accessCode,
          address: data.address?.trim() ? data.address : null,
        });
      } else {
        await addDepartment({
          name: data.name,
          accessCode: data.accessCode,
          address: data.address?.trim() ? data.address : null,
        });
      }
      onClose(); 
    } catch (error) {
      console.error("Submit error in DepartmentForm:", error);
      // El toast de error lo maneja DataContext
      // react-hook-form resetea isSubmitting automáticamente si la promesa es rechazada.
    }
  };

  const handleCloseDialog = () => {
    form.reset(); // Limpiar el formulario al cerrar
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleCloseDialog(); } }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{department ? 'Editar Departamento' : 'Agregar Nuevo Departamento'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Departamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Apartamento 101" {...field} disabled={form.formState.isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Acceso</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 1234#" {...field} disabled={form.formState.isSubmitting}/>
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
                    <Textarea placeholder="Ej: Av. Siempre Viva 742, Springfield" {...field} disabled={form.formState.isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-wrap gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={form.formState.isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
                {form.formState.isSubmitting ? (department ? 'Guardando...' : 'Agregando...') : (department ? 'Guardar Cambios' : 'Agregar Departamento')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
