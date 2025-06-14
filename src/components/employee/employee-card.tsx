
"use client";
import type { Employee } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Mail, Edit3, Trash2 } from 'lucide-react';
// import { useData } from '@/contexts/data-context'; // For delete in future
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";

interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
}

export function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
  // const { deleteEmployee } = useData(); // For delete in future

  // const handleDelete = () => {
  //   // deleteEmployee(employee.id);
  // };

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <UserCircle className="mr-2 h-6 w-6 text-primary" />
          {employee.name}
        </CardTitle>
        <CardDescription className="flex items-center pt-1 text-sm">
          ID: {employee.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Mail className="mr-2 h-4 w-4" />
          {employee.email}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" size="sm" onClick={() => onEdit(employee)} aria-label={`Editar ${employee.name}`} disabled>
          <Edit3 className="mr-1 h-4 w-4" /> Editar (Próximamente)
        </Button>
        {/* <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" aria-label={`Eliminar ${employee.name}`} disabled>
              <Trash2 className="mr-1 h-4 w-4" /> Eliminar (Próximamente)
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al empleado "{employee.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog> */}
      </CardFooter>
    </Card>
  );
}
