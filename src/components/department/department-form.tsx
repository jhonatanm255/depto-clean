
"use client";
import React from 'react';
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
// Toast is handled in DataContext

const departmentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  accessCode: z.string().min(1, "Se requiere el código de acceso"),
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
    defaultValues: department ? { name: department.name, accessCode: department.accessCode } : { name: '', accessCode: '' },
  });

  React.useEffect(() => {
    if (isOpen) { 
      if (department) {
        form.reset({ name: department.name, accessCode: department.accessCode });
      } else {
        form.reset({ name: '', accessCode: '' });
      }
    }
  }, [department, form, isOpen]);


  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    try {
      if (department) {
        // Retain existing status, assignedTo, and lastCleanedAt if not explicitly changed by other logic
        await updateDepartment({ 
            ...department, 
            ...data,
            lastCleanedAt: department.lastCleanedAt ? new Date(department.lastCleanedAt) : undefined,
        });
      } else {
        await addDepartment(data);
      }
      onClose();
    } catch (error) {
      console.error(error);
      // Toast handled by DataContext
    }
  };

  const handleCloseDialog = () => {
    form.reset({ name: department ? department.name : '', accessCode: department ? department.accessCode : '' });
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (department ? 'Guardando...' : 'Agregando...') : (department ? 'Guardar Cambios' : 'Agregar Departamento')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
