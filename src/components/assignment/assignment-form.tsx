
"use client";
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
// import { toast } from '@/hooks/use-toast'; // Toast se maneja en DataContext
import { ClipboardEdit } from 'lucide-react';
import { LoadingSpinner } from '@/components/core/loading-spinner'; 

const assignmentSchema = z.object({
  departmentId: z.string().min(1, "Se requiere el departamento"),
  employeeId: z.string().min(1, "Se requiere el empleado"), // Este será el ID del EmployeeProfile
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
      form.reset(); 
    } catch (error) {
      // Error toast is handled by DataContext due to re-throw
      // react-hook-form's isSubmitting state will automatically reset on promise rejection
      console.error("Submit error in AssignmentForm:", error);
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
          <ClipboardEdit className="mr-2 h-6 w-6 text-primary" /> Asignar Nueva Tarea
        </CardTitle>
        <CardDescription>Selecciona un departamento y una empleada para asignar una tarea de limpieza.</CardDescription>
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
                    disabled={availableDepartments.length === 0 || employees.length === 0 || form.formState.isSubmitting}
                  >
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
                            employees.map((emp) => ( // emp es EmployeeProfile, emp.id es el ID del documento
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
              disabled={availableDepartments.length === 0 || employees.length === 0 || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
              {form.formState.isSubmitting ? "Asignando..." : "Asignar Tarea"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
