
"use client";
import React, { useState, useMemo, useCallback } from 'react'; // Added useMemo, useCallback
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { DepartmentForm } from '@/components/department/department-form';
import { DepartmentCard } from '@/components/department/department-card';
import { PlusCircle, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/core/loading-spinner';

export default function DepartmentsPage() {
  const { departments, employees, dataLoading } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name_asc');


  const handleOpenForm = useCallback((department?: Department) => {
    setEditingDepartment(department || null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingDepartment(null);
  }, []);
  
  const filteredDepartments = useMemo(() => {
    return departments
      .filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(dept => {
          if (statusFilter === 'all') return true;
          if (statusFilter === 'pending_assignment') {
              return dept.status === 'pending' && !dept.assignedTo;
          }
          return dept.status === statusFilter;
      })
      .sort((a, b) => {
          switch (sortOrder) {
              case 'name_asc': return a.name.localeCompare(b.name);
              case 'name_desc': return b.name.localeCompare(a.name);
              case 'status': return a.status.localeCompare(b.status);
              default: return 0;
          }
      });
  }, [departments, searchTerm, statusFilter, sortOrder]);

  if (dataLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando departamentos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
            <Building2 className="mr-3 h-8 w-8 text-primary" />
            Gestionar Departamentos
          </h1>
          <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Agregar Nuevo Departamento
          </Button>
        </div>
         <p className="text-muted-foreground mt-1">
            Crea, visualiza y organiza los departamentos o áreas que necesitan limpieza.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-card shadow">
        <Input 
            placeholder="Buscar departamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="pending_assignment">Pendiente (Sin Asignar)</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
            </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
                <SelectItem value="status">Estado</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {departments.length === 0 && !dataLoading ? (
        <div className="text-center py-10">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No se encontraron departamentos.</p>
          <p className="text-sm text-muted-foreground">Comienza agregando un nuevo departamento.</p>
        </div>
      ) : filteredDepartments.length === 0 && !dataLoading ? (
        <div className="text-center py-10">
           <p className="mt-4 text-lg text-muted-foreground">Ningún departamento coincide con tus filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} onEdit={handleOpenForm} employees={employees} />
          ))}
        </div>
      )}
      <DepartmentForm isOpen={isFormOpen} onClose={handleCloseForm} department={editingDepartment} />
    </div>
  );
}
