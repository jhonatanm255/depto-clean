
"use client";
import React from 'react';
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/core/loading-spinner';

const departmentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  accessCode: z.string().min(1, "Se requiere el código de acceso"),
  address: z.string().optional(), // Dirección es opcional
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
      ? { name: department.name, accessCode: department.accessCode, address: department.address || '' } 
      : { name: '', accessCode: '', address: '' },
  });

  React.useEffect(() => {
    if (isOpen) { 
      if (department) {
        form.reset({ name: department.name, accessCode: department.accessCode, address: department.address || '' });
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
            ...data,
            address: data.address || undefined, // Ensure undefined if empty
            lastCleanedAt: department.lastCleanedAt ? new Date(department.lastCleanedAt) : undefined,
        });
      } else {
        await addDepartment(data);
      }
      onClose(); 
    } catch (error) {
      // Error toast is handled by DataContext due to re-throw
      // react-hook-form's isSubmitting state will automatically reset on promise rejection
      console.error("Submit error in DepartmentForm:", error);
    }
  };

  const handleCloseDialog = () => {
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
                    <Input placeholder="Ej: Apartamento 101" {...field} />
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
                    <Input placeholder="Ej: 1234#" {...field} />
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
                    <Textarea placeholder="Ej: Av. Siempre Viva 742, Springfield" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
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
