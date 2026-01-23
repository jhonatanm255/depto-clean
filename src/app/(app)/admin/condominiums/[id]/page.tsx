"use client";
import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { DepartmentForm } from '@/components/department/department-form';
import { DepartmentCard } from '@/components/department/department-card';
import { DepartmentFilters } from '@/components/department/DepartmentFilters';
import { PlusCircle, Building2, Search, ArrowLeft, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { DepartmentSidebar } from '@/components/department/department-sidebar';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export default function CondominiumDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { condominiums, departments, employees, dataLoading } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('name_asc');
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

    const condoId = typeof params.id === 'string' ? params.id : '';
    const condominium = useMemo(() => condominiums.find(c => c.id === condoId), [condominiums, condoId]);

    const selectedDepartment = useMemo(() =>
        departments.find(d => d.id === selectedDeptId) || null
        , [departments, selectedDeptId]);

    const handleOpenForm = useCallback((department?: Department) => {
        setEditingDepartment(department || null);
        setIsFormOpen(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
        setEditingDepartment(null);
    }, []);

    const filteredDepartments = useMemo(() => {
        if (!condominium) return [];
        return departments
            .filter(dept => dept.condominiumId === condominium.id)
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
    }, [departments, condominium, searchTerm, statusFilter, sortOrder]);

    if (dataLoading && !condominium) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <LoadingSpinner size={32} />
                <p className="mt-4 text-muted-foreground">Cargando condominio...</p>
            </div>
        );
    }

    if (!condominium && !dataLoading) {
        return (
            <div className="container mx-auto py-8 px-4 text-center">
                <h1 className="text-2xl font-bold text-destructive">Condominio no encontrado</h1>
                <Button variant="outline" onClick={() => router.push('/admin/condominiums')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Condominios
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <header className="mb-8">
                <Button variant="ghost" onClick={() => router.push('/admin/condominiums')} className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Condominios
                </Button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
                            <Building2 className="mr-3 h-8 w-8 text-primary" />
                            {condominium?.name}
                        </h1>
                        {condominium?.address && (
                            <div className="flex items-center text-muted-foreground mt-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{condominium.address}</span>
                            </div>
                        )}
                    </div>
                    <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <PlusCircle className="mr-2 h-5 w-5" /> Agregar Departamento
                    </Button>
                </div>
            </header>

            <div className="mb-6">
                <DepartmentFilters
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    sortOrder={sortOrder}
                    onSortOrderChange={setSortOrder}
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className={cn(
                    "flex-1 w-full transition-all duration-300",
                    selectedDeptId ? "lg:max-w-[calc(100%-455px)]" : "w-full"
                )}>
                    {filteredDepartments.length === 0 ? (
                        <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
                            <Building2 className="mx-auto h-16 w-16 text-muted-foreground/70" />
                            <p className="mt-4 text-xl font-semibold text-muted-foreground">
                                {searchTerm || statusFilter !== 'all' ? 'No se encontraron departamentos con los filtros actuales.' : 'Este condominio aún no tiene departamentos.'}
                            </p>
                            <Button onClick={() => handleOpenForm()} className="mt-6">
                                <PlusCircle className="mr-2 h-5 w-5" /> Agregar Primer Departamento
                            </Button>
                        </div>
                    ) : (
                        <div className={cn(
                            "grid gap-4 transition-all duration-300 justify-center md:justify-start",
                            selectedDeptId
                                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
                                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        )}>
                            {filteredDepartments.map((dept) => (
                                <DepartmentCard
                                    key={dept.id}
                                    department={dept}
                                    onEdit={handleOpenForm}
                                    employees={employees}
                                    isSelected={selectedDeptId === dept.id}
                                    onSelect={(d) => setSelectedDeptId(selectedDeptId === d.id ? null : d.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {selectedDeptId && (
                    <aside className="hidden lg:block w-[430px] sticky top-24 h-[calc(100vh-120px)] overflow-hidden rounded-xl border shadow-lg bg-card animate-in slide-in-from-right duration-300">
                        <DepartmentSidebar
                            department={selectedDepartment}
                            onClose={() => setSelectedDeptId(null)}
                            onEdit={handleOpenForm}
                            employees={employees}
                        />
                    </aside>
                )}
            </div>

            <DepartmentForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                department={editingDepartment}
                defaultCondominiumId={condoId}
            />
        </div>
    );
}
