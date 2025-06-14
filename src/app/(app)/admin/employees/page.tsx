
"use client";
import { useState } from 'react';
import type { Employee, CleaningTask, Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/employee/employee-form';
import { EmployeeCard } from '@/components/employee/employee-card';
import { PlusCircle, Users, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function EmployeesPage() {
  const { employees, tasks, departments, dataLoading, getTasksForEmployee } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenForm = (employee?: Employee) => {
    setEditingEmployee(employee || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };
  
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  if (dataLoading && employees.length === 0) { // Show main loader only if no employees yet
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Gestionar Empleados
          </h1>
          <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Agregar Nuevo Empleado
          </Button>
        </div>
         <Alert className="mt-4 text-sm bg-blue-50 border-blue-200 text-blue-700">
            <Info className="h-5 w-5 text-blue-500" />
            <AlertDescription>
              Los empleados agregados aquí son para asignación de tareas. Para iniciar sesión como empleado operativo, usar las credenciales generales: <code className="font-mono text-xs">employee@cleansweep.com</code> / <code className="font-mono text-xs">emp123</code>.
            </AlertDescription>
          </Alert>
      </header>

      <div className="mb-6 p-4 border rounded-lg bg-card shadow">
        <Input 
            placeholder="Buscar empleados por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {dataLoading && employees.length > 0 && (
         <div className="flex items-center justify-center p-4 text-muted-foreground">
            <LoadingSpinner size={20} className="mr-2"/> Actualizando lista...
        </div>
      )}

      {employees.length === 0 && !dataLoading ? (
        <div className="text-center py-10">
          <Users className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No se encontraron empleados.</p>
          <p className="text-sm text-muted-foreground">Comienza agregando un nuevo empleado.</p>
        </div>
      ) : filteredEmployees.length === 0 && !dataLoading ? (
         <div className="text-center py-10">
           <p className="mt-4 text-lg text-muted-foreground">Ningún empleado coincide con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const employeeTasks = getTasksForEmployee(emp.id);
            return (
              <EmployeeCard 
                key={emp.id} 
                employee={emp} 
                onEdit={() => handleOpenForm(emp)} 
                tasks={employeeTasks}
                departments={departments}
              />
            );
          })}
        </div>
      )}
      <EmployeeForm isOpen={isFormOpen} onClose={handleCloseForm} employee={editingEmployee} />
    </div>
  );
}
