
"use client";
import React, { useState, useMemo, useCallback } from 'react';
import type { EmployeeProfile } from '@/lib/types'; 
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/employee/employee-form';
import { EmployeeCard } from '@/components/employee/employee-card';
import { PlusCircle, Users, Info, ShieldAlert, Search, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EmployeesPage() {
  const { employees, tasks, departments, dataLoading, getTasksForEmployee } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenForm = useCallback((employee?: EmployeeProfile) => {
    setEditingEmployee(employee || null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  }, []);
  
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (emp.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm]);

  if (dataLoading && employees.length === 0) { 
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando lista de empleadas...</p>
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
          <AlertTitle className="font-semibold">Gestión de cuentas en Supabase</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Al agregar una empleada, se crea un usuario en Supabase Auth con el <strong>correo y contraseña</strong> que indiques. La persona recibirá un correo de activación si tu proyecto lo requiere.
            </p>
            <p>
              <strong>Contraseña inicial:</strong> Comunícala de forma segura; no podrás verla nuevamente después de crear la cuenta.
            </p>
            <p>
              La edición avanzada (roles adicionales, restablecer contraseñas, desactivar usuarios) se habilitará en próximas versiones. Mientras tanto, puedes administrar detalles sensibles desde la consola de Supabase.
            </p>
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
            <LoadingSpinner size={20} className="mr-2"/> Actualizando lista de empleadas...
        </div>
      )}

      {!dataLoading && employees.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
          <Users className="mx-auto h-16 w-16 text-muted-foreground/70" />
          <p className="mt-4 text-xl font-semibold text-muted-foreground">No se encontraron empleadas.</p>
          <p className="text-sm text-muted-foreground">Comienza agregando una nueva empleada para administrarla.</p>
           <Button onClick={() => handleOpenForm()} className="mt-6">
            <PlusCircle className="mr-2 h-5 w-5" /> Agregar Primera Empleada
          </Button>
        </div>
      ) : !dataLoading && filteredEmployees.length === 0 ? (
         <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
           <Search className="mx-auto h-16 w-16 text-muted-foreground/70" />
           <p className="mt-4 text-xl font-semibold text-muted-foreground">Ninguna empleada coincide con tu búsqueda.</p>
           <p className="text-sm text-muted-foreground">Intenta ajustar el término de búsqueda.</p>
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
