
"use client";
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ClipboardEdit } from 'lucide-react';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import type { Department } from '@/lib/types'; // Import Department type

const assignmentSchema = z.object({
  departmentId: z.string().min(1, "Se requiere el departamento"),
  employeeId: z.string().min(1, "Se requiere la empleada"),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

// Helper function to translate status for display
function translateDepartmentStatus(status: Department['status']): string {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'in_progress': return 'En Progreso';
    case 'completed': return 'Completado';
    default: return status;
  }
}

export function AssignmentForm() {
  const { departments, employees, assignTask, dataLoading } = useData();
  
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { departmentId: '', employeeId: '' },
  });

  // Permitir seleccionar cualquier departamento que no esté 'completado' para reasignación
  const assignableDepartments = departments.filter(
    (dept) => dept.status !== 'completed'
  );

  const onSubmit: SubmitHandler<AssignmentFormData> = async (data) => {
    try {
      await assignTask(data.departmentId, data.employeeId);
      form.reset(); 
    } catch (error) {
      console.error("Submit error in AssignmentForm:", error);
    }
  };

  if (dataLoading) { 
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <ClipboardEdit className="mr-2 h-6 w-6 text-primary" /> Asignar o Reasignar Tarea
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <LoadingSpinner size={24} />
          <p className="ml-2 text-muted-foreground">Cargando datos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <ClipboardEdit className="mr-2 h-6 w-6 text-primary" /> Asignar o Reasignar Tarea
        </CardTitle>
        <CardDescription>
          Selecciona un departamento y una empleada. Si el departamento ya tiene una tarea activa, se reasignará.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""} 
                    disabled={assignableDepartments.length === 0 || employees.length === 0 || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Departamentos (No completados)</SelectLabel>
                        {assignableDepartments.length > 0 ? (
                            assignableDepartments.map((dept) => {
                              const assignedEmployee = dept.assignedTo ? employees.find(emp => emp.id === dept.assignedTo) : null;
                              const statusDisplay = translateDepartmentStatus(dept.status);
                              
                              return (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name} ({assignedEmployee ? (
                                    <>
                                      Asignado a: <strong className="text-green-600 font-semibold">{assignedEmployee.name || 'Desconocido'}</strong>, {statusDisplay}
                                    </>
                                  ) : (
                                    statusDisplay
                                  )})
                                </SelectItem>
                              );
                            })
                        ) : (
                            <SelectItem value="no-dept" disabled>No hay departamentos para asignar/reasignar</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleada</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""} 
                    disabled={employees.length === 0 || form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una empleada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectGroup>
                        <SelectLabel>Empleadas</SelectLabel>
                        {employees.length > 0 ? (
                            employees.map((emp) => ( 
                                <SelectItem key={emp.id} value={emp.id}> 
                                {emp.name} ({emp.email})
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-emp" disabled>No hay empleadas disponibles</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
              disabled={assignableDepartments.length === 0 || employees.length === 0 || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
              {form.formState.isSubmitting ? "Procesando..." : "Asignar / Reasignar Tarea"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
