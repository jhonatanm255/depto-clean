
"use client";
import { useState, useEffect } from 'react';
import type { EmployeeProfile } from '@/lib/types'; // Usar EmployeeProfile
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/employee/employee-form';
import { EmployeeCard } from '@/components/employee/employee-card';
import { PlusCircle, Users, Info, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EmployeesPage() {
  const { employees, tasks, departments, dataLoading, getTasksForEmployee } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenForm = (employee?: EmployeeProfile) => {
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

  if (dataLoading && employees.length === 0) { 
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando empleadas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary" />
            Gestionar Empleadas
          </h1>
          <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Agregar Nueva Empleada
          </Button>
        </div>
         <Alert className="mt-4 text-sm bg-yellow-50 border-yellow-300 text-yellow-800">
            <ShieldAlert className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="font-semibold">¡Importante sobre Cuentas de Empleadas!</AlertTitle>
            <AlertDescription>
              Al agregar una nueva empleada, se creará una cuenta de usuario con el email y contraseña que especifiques.
              La empleada podrá usar estas credenciales para iniciar sesión.
              <br />
              <strong>Atención:</strong> Después de crear una cuenta de empleada, como administrador, <strong>deberás volver a iniciar sesión</strong> en tu propia cuenta de administrador. Este es un comportamiento temporal debido a la forma en que se crean las cuentas desde la aplicación.
              <br />
              La edición de perfiles de empleadas (incluyendo cambio de contraseña) es una funcionalidad planificada para el futuro.
            </AlertDescription>
          </Alert>
      </header>

      <div className="mb-6 p-4 border rounded-lg bg-card shadow">
        <Input 
            placeholder="Buscar empleadas por nombre o email..."
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
          <p className="mt-4 text-lg text-muted-foreground">No se encontraron empleadas.</p>
          <p className="text-sm text-muted-foreground">Comienza agregando una nueva empleada.</p>
        </div>
      ) : filteredEmployees.length === 0 && !dataLoading ? (
         <div className="text-center py-10">
           <p className="mt-4 text-lg text-muted-foreground">Ninguna empleada coincide con tu búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const employeeTasks = getTasksForEmployee(emp.id); // emp.id es el ID del documento de Firestore
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
