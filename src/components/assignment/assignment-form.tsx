
"use client";
import type { Department, Employee } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { ClipboardEdit } from 'lucide-react';

const assignmentSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  employeeId: z.string().min(1, "Employee is required"),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export function AssignmentForm() {
  const { departments, employees, assignTask, tasks } = useData();
  
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { departmentId: '', employeeId: '' },
  });

  const availableDepartments = departments.filter(
    (dept) => !tasks.some(task => task.departmentId === dept.id && (task.status === 'pending' || task.status === 'in_progress'))
  );


  const onSubmit: SubmitHandler<AssignmentFormData> = (data) => {
    try {
      assignTask(data.departmentId, data.employeeId);
      toast({ title: "Task Assigned", description: `Department assigned to employee.` });
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not assign task."});
      console.error(error);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <ClipboardEdit className="mr-2 h-6 w-6 text-primary" /> Assign New Task
        </CardTitle>
        <CardDescription>Select a department and an employee to assign a cleaning task.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Departments</SelectLabel>
                        {availableDepartments.length > 0 ? (
                            availableDepartments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                                </SelectItem>
                            ))
                        ) : (
                            <SelectItem value="no-dept" disabled>No departments available for assignment</SelectItem>
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
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectGroup>
                        <SelectLabel>Employees</SelectLabel>
                        {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                            </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={availableDepartments.length === 0}>
              Assign Task
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
