"use client";

import React, { useState, useMemo, useCallback } from 'react';
import type { EmployeeProfile, UserRole } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/employee/employee-form';
import { EmployeeCard } from '@/components/employee/employee-card';
import { PlusCircle, Users, ShieldAlert, Search, Download, LayoutGrid, List, MoreHorizontal, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ROLES: { value: 'all' | UserRole; label: string }[] = [
  { value: 'all', label: 'Todo el personal' },
  { value: 'employee', label: 'Personal de limpieza' },
  { value: 'manager', label: 'Supervisores' },
  { value: 'admin', label: 'Administración' },
];

const MAX_TASKS_AT_CAPACITY = 5;

function getWorkloadStatus(
  taskCount: number,
  inProgressCount: number
): 'available' | 'on_site' | 'at_capacity' {
  if (taskCount >= MAX_TASKS_AT_CAPACITY) return 'at_capacity';
  if (inProgressCount > 0) return 'on_site';
  return 'available';
}

export default function EmployeesPage() {
  const { employees, departments, condominiums, dataLoading, getTasksForEmployee } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const handleOpenForm = useCallback((employee?: EmployeeProfile) => {
    setEditingEmployee(employee || null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        const matchesSearch =
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (emp.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (roleFilter === 'all') return true;
        if (roleFilter === 'admin') return emp.role === 'admin' || emp.role === 'owner';
        return emp.role === roleFilter;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm, roleFilter]);

  const handleExportCSV = useCallback(() => {
    const headers = ['Nombre', 'Email', 'Rol', 'Estado de carga', 'Asignación actual'];
    const rows = filteredEmployees.map(emp => {
      const employeeTasks = getTasksForEmployee(emp.id);
      const inProgress = employeeTasks.filter(t => t.status === 'in_progress').length;
      const status = getWorkloadStatus(employeeTasks.length, inProgress);
      const statusLabel = status === 'available' ? 'Disponible' : status === 'on_site' ? 'En sitio' : 'Al límite';
      const firstTask = employeeTasks[0];
      const dept = firstTask ? departments.find(d => d.id === firstTask.departmentId) : null;
      const assignment = dept ? dept.name : 'Sin asignación';
      const roleLabel = emp.role === 'employee' ? 'Personal limpieza' : emp.role === 'manager' ? 'Supervisor' : emp.role === 'admin' ? 'Admin' : emp.role;
      return [emp.name, emp.email ?? '', roleLabel, statusLabel, assignment];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEmployees, getTasksForEmployee, departments]);

  if (dataLoading && employees.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando lista de empleadas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" />
          Directorio de personal
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gestiona {employees.length} {employees.length === 1 ? 'miembro' : 'miembros'} en {condominiums.length} {condominiums.length === 1 ? 'propiedad' : 'propiedades'}.
        </p>
      </header>

      <Alert className="mb-6 text-sm bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="font-semibold">Cuentas en Supabase</AlertTitle>
        <AlertDescription>
          La contraseña inicial se define al crear la cuenta; comunícala de forma segura.
        </AlertDescription>
      </Alert>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, propiedad o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredEmployees.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir personal
          </Button>
          <div className="flex rounded-lg border bg-muted/30 p-0.5">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('list')}
              aria-label="Vista lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setViewMode('grid')}
              aria-label="Vista cuadrícula"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | UserRole)} className="mb-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {ROLES.map(r => (
            <TabsTrigger key={r.value} value={r.value} className="text-sm">
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {dataLoading && employees.length > 0 && (
        <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
          <LoadingSpinner size={20} className="mr-2" /> Actualizando...
        </div>
      )}

      {!dataLoading && employees.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card">
          <Users className="mx-auto h-16 w-16 text-muted-foreground/70" />
          <p className="mt-4 text-xl font-semibold text-muted-foreground">No hay personal registrado.</p>
          <Button onClick={() => handleOpenForm()} className="mt-6">
            <PlusCircle className="mr-2 h-5 w-5" /> Añadir primera empleada
          </Button>
        </div>
      ) : !dataLoading && filteredEmployees.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/70" />
          <p className="mt-4 text-xl font-semibold text-muted-foreground">Ningún resultado con los filtros actuales.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Personal</TableHead>
                <TableHead>Estado de carga</TableHead>
                <TableHead>Asignación actual</TableHead>
                <TableHead className="w-[80px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const employeeTasks = getTasksForEmployee(emp.id);
                const inProgress = employeeTasks.filter(t => t.status === 'in_progress').length;
                const status = getWorkloadStatus(employeeTasks.length, inProgress);
                const firstTask = employeeTasks[0];
                const dept = firstTask ? departments.find(d => d.id === firstTask.departmentId) : null;
                const assignmentText = dept ? dept.name : 'Sin asignación';
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email ?? '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          status === 'available' && 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
                          status === 'on_site' && 'border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/10',
                          status === 'at_capacity' && 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10'
                        )}
                      >
                        <span className={cn('mr-1.5 inline-block h-2 w-2 rounded-full', status === 'available' && 'bg-emerald-500', status === 'on_site' && 'bg-amber-500', status === 'at_capacity' && 'bg-red-500')} />
                        {status === 'available' ? 'Disponible' : status === 'on_site' ? 'En sitio' : 'Al límite'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={assignmentText}>
                      {assignmentText}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenForm(emp)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground p-3 border-t">
            Mostrando 1–{filteredEmployees.length} de {filteredEmployees.length} miembros
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(300px,350px))]">
          {filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={() => handleOpenForm(emp)}
              tasks={getTasksForEmployee(emp.id)}
              departments={departments}
            />
          ))}
        </div>
      )}

      <EmployeeForm isOpen={isFormOpen} onClose={handleCloseForm} employee={editingEmployee} />
    </div>
  );
}
