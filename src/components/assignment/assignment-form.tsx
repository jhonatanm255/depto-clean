
"use client";
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { ClipboardEdit } from 'lucide-react';

const assignmentSchema = z.object({
  departmentId: z.string().min(1, "Se requiere el departamento"),
  employeeId: z.string().min(1, "Se requiere el empleado"),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export function AssignmentForm() {
  const { departments, employees, assignTask, tasks, dataLoading } = useData();
  
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { departmentId: '', employeeId: '' },
  });

  const availableDepartments = departments.filter(
    (dept) => !tasks.some(task => task.departmentId === dept.id && (task.status === 'pending' || task.status === 'in_progress'))
  );


  const onSubmit: SubmitHandler<AssignmentFormData> = async (data) => {
    try {
      await assignTask(data.departmentId, data.employeeId);
      // Toast is handled within assignTask
      form.reset();
    } catch (error) {
      // Toast for general error, specific errors handled in assignTask
      toast({ variant: "destructive", title: "Error Inesperado", description: "No se pudo asignar la tarea."});
      console.error(error);
    }
  };

  if (dataLoading) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center">
            <ClipboardEdit className="mr-2 h-6 w-6 text-primary" /> Asignar Nueva Tarea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Cargando datos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <ClipboardEdit className="mr-2 h-6 w-6 text-primary" /> Asignar Nueva Tarea
        </CardTitle>
        <CardDescription>Selecciona un departamento y un empleado para asignar una tarea de limpieza.</CardDescription>
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
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={availableDepartments.length === 0 && employees.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Departamentos Disponibles</SelectLabel>
                        {availableDepartments.length > 0 ? (
                            availableDepartments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-dept" disabled>No hay departamentos disponibles</SelectItem>
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
                  <FormLabel>Empleado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={employees.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un empleado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectGroup>
                        <SelectLabel>Empleados</SelectLabel>
                        {employees.length > 0 ? (
                            employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                {emp.name}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-emp" disabled>No hay empleados disponibles</SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={availableDepartments.length === 0 || employees.length === 0 || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Asignando..." : "Asignar Tarea"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
