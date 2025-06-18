
"use client";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DepartmentFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortOrder: string;
  onSortOrderChange: (order: string) => void;
}

export function DepartmentFilters({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: DepartmentFiltersProps) {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-card shadow">
      <Input
        placeholder="Buscar por nombre o dirección..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="md:col-span-1"
        aria-label="Buscar departamentos"
      />
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="md:col-span-1" aria-label="Filtrar por estado">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Estados</SelectItem>
          <SelectItem value="pending">Necesita Limpieza</SelectItem>
          <SelectItem value="pending_assignment">Necesita Limpieza (Sin Asignar Tarea)</SelectItem>
          <SelectItem value="in_progress">Limpieza en Progreso</SelectItem>
          <SelectItem value="completed">Limpio (Completado)</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="md:col-span-1" aria-label="Ordenar por">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name_asc">Nombre (A-Z)</SelectItem>
          <SelectItem value="name_desc">Nombre (Z-A)</SelectItem>
          <SelectItem value="status">Estado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
