"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { EmployeeProfile, UserRole } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/employee/employee-form';
import { EmployeeCard } from '@/components/employee/employee-card';
import { PlusCircle, Users, ShieldAlert, Search, Download, LayoutGrid, List, MoreHorizontal, Pencil, Trash2, ShieldCheck, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Roles visibles en la UI (se oculta 'manager')
const ROLE_FILTERS: { value: 'all' | UserRole; label: string }[] = [
  { value: 'all', label: 'Todo el personal' },
  { value: 'employee', label: 'Empleados' },
  { value: 'admin', label: 'Administradores' },
];

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  owner: 'Propietario',
  admin: 'Administrador',
  employee: 'Empleado',
};

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
  const { employees, departments, condominiums, dataLoading, getTasksForEmployee, deleteEmployee } = useData();
  const { currentUser } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeProfile | null>(null);

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('grid');
    }
  }, []);

  const handleOpenForm = useCallback((employee?: EmployeeProfile) => {
    setEditingEmployee(employee || null);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  }, []);

  // Determina si el usuario actual puede eliminar a un empleado dado
  const canDelete = useCallback((emp: EmployeeProfile) => {
    if (emp.id === currentUser?.id) return false; // Nunca auto-eliminarse
    if (emp.role === 'owner') return false; // Nadie puede eliminar al propietario
    if (emp.role === 'admin' || emp.role === 'manager') {
      return isOwner; // Solo el propietario puede eliminar admins
    }
    return isOwner || isAdmin; // Propietario y admin pueden eliminar empleados
  }, [currentUser, isOwner, isAdmin]);

  const filteredEmployees = useMemo(() => {
    return employees
      .filter(emp => {
        // Ocultar el rol 'manager' y el rol 'owner' de la lista
        if (emp.role === 'manager' || emp.role === 'owner' || emp.role === 'superadmin') return false;

        const matchesSearch =
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (emp.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (roleFilter === 'all') return true;
        if (roleFilter === 'admin') return emp.role === 'admin';
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
      const roleLabel = ROLE_LABEL[emp.role] ?? emp.role;
      return [emp.name, emp.email ?? '', roleLabel, statusLabel, assignment];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEmployees, getTasksForEmployee, departments]);

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await deleteEmployee(employeeToDelete.id);
    } catch (e) {
      // Error handled in context
    } finally {
      setEmployeeToDelete(null);
    }
  };

  if (dataLoading && employees.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando lista de personal...</p>
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
          Gestiona {filteredEmployees.length} {filteredEmployees.length === 1 ? 'miembro' : 'miembros'} en {condominiums.length} {condominiums.length === 1 ? 'propiedad' : 'propiedades'}.
        </p>
      </header>

      <Alert className="mb-6 text-sm bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          La contraseña inicial se define al crear la cuenta; comunícala de forma segura al nuevo miembro.
        </AlertDescription>
      </Alert>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
          {ROLE_FILTERS.map(r => (
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

      {!dataLoading && filteredEmployees.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card">
          <Users className="mx-auto h-16 w-16 text-muted-foreground/70" />
          <p className="mt-4 text-xl font-semibold text-muted-foreground">
            {employees.filter(e => e.role !== 'owner' && e.role !== 'manager' && e.role !== 'superadmin').length === 0
              ? 'No hay personal registrado.'
              : 'Ningún resultado con los filtros actuales.'}
          </p>
          {employees.filter(e => e.role !== 'owner' && e.role !== 'manager' && e.role !== 'superadmin').length === 0 && (
            <Button onClick={() => handleOpenForm()} className="mt-6">
              <PlusCircle className="mr-2 h-5 w-5" /> Añadir primer miembro
            </Button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="border rounded-lg overflow-x-auto bg-card">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Personal</TableHead>
                <TableHead>Rol</TableHead>
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
                          "text-xs gap-1",
                          emp.role === 'admin'
                            ? 'border-emerald-500/50 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                            : 'border-slate-400/50 text-slate-600 dark:text-slate-400 bg-slate-500/10'
                        )}
                      >
                        {emp.role === 'admin'
                          ? <ShieldCheck className="h-3 w-3" />
                          : <User className="h-3 w-3" />
                        }
                        {ROLE_LABEL[emp.role] ?? emp.role}
                      </Badge>
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
                            <Pencil className="mr-2 h-4 w-4" /> Ver perfil
                          </DropdownMenuItem>
                          {canDelete(emp) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => setEmployeeToDelete(emp)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground p-3 border-t">
            Mostrando {filteredEmployees.length} de {filteredEmployees.length} miembros
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={(open) => { if (!open) setEmployeeToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar perfil?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar a <strong>{employeeToDelete?.name}</strong> ({employeeToDelete?.email}).
              Esta acción eliminará su cuenta de acceso y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
