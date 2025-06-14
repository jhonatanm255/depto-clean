
"use client";
import React from 'react';
import type { Employee } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/core/loading-spinner';

const employeeSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Debe ser un correo electrónico válido"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null; 
}

export function EmployeeForm({ isOpen, onClose, employee }: EmployeeFormProps) {
  const { addEmployee } = useData(); 
  
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? { name: employee.name, email: employee.email } : { name: '', email: '' },
  });

  React.useEffect(() => {
    if (isOpen) {
        form.reset(employee ? { name: employee.name, email: employee.email } : { name: '', email: '' });
    }
  }, [employee, form, isOpen]);


  const onSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    try {
      if (employee) {
        // await updateEmployee({ ...employee, ...data }); // Implement in future
        // For now, editing is disabled.
      } else {
        await addEmployee(data);
      }
      onClose(); 
    } catch (error) {
      // Error toast is handled by DataContext
      console.error("Submit error in EmployeeForm:", error);
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
          <DialogTitle>{employee ? 'Editar Empleado (Próximamente)' : 'Agregar Nuevo Empleado'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ana Pérez" {...field} disabled={!!employee || form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ana.perez@ejemplo.com" {...field} disabled={!!employee || form.formState.isSubmitting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={form.formState.isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || !!employee}>
                 {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
                 {employee ? 'Guardar Cambios (Próx.)' : (form.formState.isSubmitting ? 'Agregando...' : 'Agregar Empleado')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
