
"use client";
import React, { useState, useMemo, useCallback } from 'react';
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { DepartmentForm } from '@/components/department/department-form';
import { DepartmentCard } from '@/components/department/department-card';
import { DepartmentFilters } from '@/components/department/DepartmentFilters';
import { PlusCircle, Building2, Search } from 'lucide-react';
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
      .filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || (dept.address && dept.address.toLowerCase().includes(searchTerm.toLowerCase())))
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

  if (dataLoading && departments.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando lista de departamentos...</p>
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

      <DepartmentFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />
      
      {dataLoading && departments.length > 0 && (
         <div className="flex items-center justify-center p-4 text-muted-foreground">
            <LoadingSpinner size={20} className="mr-2"/> Actualizando lista de departamentos...
        </div>
      )}

      {!dataLoading && departments.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground/70" />
          <p className="mt-4 text-xl font-semibold text-muted-foreground">No se encontraron departamentos.</p>
          <p className="text-sm text-muted-foreground">Comienza agregando un nuevo departamento para administrarlo.</p>
           <Button onClick={() => handleOpenForm()} className="mt-6">
            <PlusCircle className="mr-2 h-5 w-5" /> Agregar Primer Departamento
          </Button>
        </div>
      ) : !dataLoading && filteredDepartments.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
           <Search className="mx-auto h-16 w-16 text-muted-foreground/70" />
           <p className="mt-4 text-xl font-semibold text-muted-foreground">Ningún departamento coincide con tus filtros.</p>
           <p className="text-sm text-muted-foreground">Intenta ajustar los términos de búsqueda o los filtros aplicados.</p>
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
