
"use client";
import React from 'react';
import type { EmployeeProfile } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { ShieldCheck, UserCog } from 'lucide-react';

const employeeSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Debe ser un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(['admin', 'employee']).default('employee'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: EmployeeProfile | null;
}

export function EmployeeForm({ isOpen, onClose, employee }: EmployeeFormProps) {
  const { addEmployeeWithAuth } = useData();
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === 'owner';

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? { name: employee.name, email: employee.email ?? '', password: '', role: 'employee' }
      : { name: '', email: '', password: '', role: 'employee' },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(employee
        ? { name: employee.name, email: employee.email ?? '', password: '', role: 'employee' }
        : { name: '', email: '', password: '', role: 'employee' }
      );
    }
  }, [employee, form, isOpen]);

  const onSubmit: SubmitHandler<EmployeeFormData> = async (data) => {
    if (employee) {
      onClose();
      return;
    }
    try {
      await addEmployeeWithAuth(data.name, data.email, data.password, data.role);
      onClose();
    } catch (error) {
      console.error("Submit error en EmployeeForm:", error);
    }
  };

  const handleCloseDialog = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleCloseDialog(); } }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            {employee ? 'Ver Perfil' : 'Agregar Nuevo Perfil'}
          </DialogTitle>
          {!employee && (
            <DialogDescription className="text-xs pt-1">
              Se creará una cuenta de acceso a la aplicación vinculada a tu empresa.
              <br /><strong>Importante:</strong> Comunica la contraseña inicial de forma segura ya que <strong>no podrás verla nuevamente</strong>.
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
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
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Ej: ana.perez@ejemplo.com" {...field} disabled={form.formState.isSubmitting || !!employee} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!employee && (
              <>
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
                    </FormItem>
                  )}
                />

                {/* Selector de Rol — solo visible para el Propietario */}
                {isOwner && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol del Perfil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={form.formState.isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employee">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />
                                Empleado
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                Administrador
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          El administrador tiene acceso completo excepto crear o eliminar otros administradores.
                        </p>
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            <DialogFooter className="flex-wrap gap-2 sm:gap-0 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={form.formState.isSubmitting}>
                  Cancelar
                </Button>
              </DialogClose>
              {!employee && (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
                  {form.formState.isSubmitting ? 'Creando...' : 'Crear Perfil y Cuenta'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
