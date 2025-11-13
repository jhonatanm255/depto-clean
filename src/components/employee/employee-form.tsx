
"use client";
import React from 'react';
import type { EmployeeProfile } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, ShieldCheck } from 'lucide-react';

const employeeSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Debe ser un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: EmployeeProfile | null; 
}

export function EmployeeForm({ isOpen, onClose, employee }: EmployeeFormProps) {
  const { addEmployeeWithAuth } = useData(); 
  
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee 
      ? { name: employee.name, email: employee.email ?? '', password: '' } 
      : { name: '', email: '', password: '' },
  });

  React.useEffect(() => {
    if (isOpen) {
        form.reset(employee 
          ? { name: employee.name, email: employee.email ?? '', password: '' } 
          : { name: '', email: '', password: '' }
        );
    }
  }, [employee, form, isOpen]);


  const onSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    if (employee) {
      alert("La funcionalidad de editar empleado (incluyendo contraseña) aún no está implementada completamente y requiere un flujo de seguridad diferente.");
      onClose();
      return;
    }
    try {
      await addEmployeeWithAuth(data.name, data.email, data.password);
      onClose(); 
    } catch (error) {
      console.error("Submit error en EmployeeForm (addEmployeeWithAuth):", error);
    }
  };
  
  const handleCloseDialog = () => {
    form.reset(); 
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleCloseDialog(); } }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar Perfil de Empleada (Básico)' : 'Agregar Nueva Empleada'}</DialogTitle>
          {!employee && (
            <DialogDescription className="text-xs pt-1">
              Se creará un usuario en Supabase Auth vinculado a tu empresa.
              <br/><strong>Importante:</strong> Comunica la contraseña inicial a la empleada, ya que <strong>no podrás verla nuevamente</strong> por motivos de seguridad.
              <br/>Puedes volver a generar invitaciones o restablecer contraseñas desde el panel de Supabase cuando esté habilitado en la aplicación.
            </DialogDescription>
          )}
        </DialogHeader>
        
        {employee && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-700 mt-2">
            <KeyRound className="h-5 w-5 text-yellow-500" />
            <AlertTitle className="font-semibold">Edición Limitada</AlertTitle>
            <AlertDescription>
              Actualmente solo se puede editar el nombre y email. La gestión de contraseñas de usuarios existentes se realizará en una futura actualización.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ana Pérez" {...field} disabled={form.formState.isSubmitting || !!employee} />
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
                  <FormLabel>Correo Electrónico (Será el usuario)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ej: ana.perez@ejemplo.com" {...field} disabled={form.formState.isSubmitting || !!employee}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!employee && ( 
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña (Mínimo 6 caracteres)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={form.formState.isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground pt-1">Esta contraseña es para la creación inicial de la cuenta. Comunícasela a la empleada.</p>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter className="flex-wrap gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={form.formState.isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || (!!employee && !form.formState.isDirty)}>
                 {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
                 {employee 
                    ? (form.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios (Próx.)') 
                    : (form.formState.isSubmitting ? 'Agregando...' : 'Agregar Empleada y Crear Cuenta')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
