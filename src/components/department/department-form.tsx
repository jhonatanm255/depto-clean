
"use client";
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';

const departmentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  accessCode: z.string().min(1, "Access code is required"),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department | null; // For editing
}

export function DepartmentForm({ isOpen, onClose, department }: DepartmentFormProps) {
  const { addDepartment, updateDepartment } = useData();
  
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: department ? { name: department.name, accessCode: department.accessCode } : { name: '', accessCode: '' },
  });

  // Reset form when department prop changes (e.g., opening dialog for different department or new)
  React.useEffect(() => {
    if (department) {
      form.reset({ name: department.name, accessCode: department.accessCode });
    } else {
      form.reset({ name: '', accessCode: '' });
    }
  }, [department, form, isOpen]);


  const onSubmit: SubmitHandler<DepartmentFormData> = (data) => {
    try {
      if (department) {
        updateDepartment({ ...department, ...data });
        toast({ title: "Department Updated", description: `${data.name} has been updated.` });
      } else {
        addDepartment(data);
        toast({ title: "Department Added", description: `${data.name} has been added.` });
      }
      form.reset();
      onClose();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save department." });
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { form.reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{department ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Apartment 101" {...field} />
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
                  <FormLabel>Access Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1234#" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => { form.reset(); onClose();}}>Cancel</Button>
              </DialogClose>
              <Button type="submit">{department ? 'Save Changes' : 'Add Department'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Ensure React is imported
import React from 'react';
