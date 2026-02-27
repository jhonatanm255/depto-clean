"use client";
import React, { useState, useMemo } from 'react';
import type { Condominium } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { CondominiumForm } from '@/components/condominium/condominium-form';
import { CondominiumCard } from '@/components/condominium/condominium-card';
import { PlusCircle, Building2, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function CondominiumsPage() {
    const { condominiums, departments, dataLoading } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCondominium, setEditingCondominium] = useState<Condominium | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active'>('all');

    const handleOpenForm = (condo?: Condominium) => {
        setEditingCondominium(condo || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCondominium(null);
    };

    // Count departments per condominium
    const deptsByCondo = useMemo(() => {
        const counts: Record<string, number> = {};
        departments.forEach(dept => {
            if (dept.condominiumId) {
                counts[dept.condominiumId] = (counts[dept.condominiumId] || 0) + 1;
            }
        });
        return counts;
    }, [departments]);

    // Check for active work (in_progress) per condominium
    const activeWorkByCondo = useMemo(() => {
        const active: Record<string, boolean> = {};
        departments.forEach(dept => {
            if (dept.condominiumId && dept.status === 'in_progress') {
                active[dept.condominiumId] = true;
            }
        });
        return active;
    }, [departments]);

    const filteredCondominiums = useMemo(() => {
        return condominiums
            .filter(condo => {
                const matchesSearch =
                    condo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (condo.address && condo.address.toLowerCase().includes(searchTerm.toLowerCase()));
                if (!matchesSearch) return false;
                if (filterActive === 'active') return activeWorkByCondo[condo.id] || false;
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [condominiums, searchTerm, filterActive, activeWorkByCondo]);

    // Completed count per condominium (for progress bar)
    const completedByCondo = useMemo(() => {
        const counts: Record<string, number> = {};
        departments.forEach(dept => {
            if (dept.condominiumId && dept.status === 'completed') {
                counts[dept.condominiumId] = (counts[dept.condominiumId] || 0) + 1;
            }
        });
        return counts;
    }, [departments]);

    const readyUnits = useMemo(() => departments.filter(d => d.status === 'completed').length, [departments]);
    const inProgressUnits = useMemo(() => departments.filter(d => d.status === 'in_progress').length, [departments]);

    if (dataLoading && condominiums.length === 0) {
        return (
            <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <LoadingSpinner size={32} />
                <p className="mt-4 text-muted-foreground">Cargando condominios...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6">
            <header className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground flex items-center gap-2">
                            <Building2 className="h-7 w-7 text-primary" />
                            Gestión de propiedades
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Estado de limpieza en tiempo real en {condominiums.length} {condominiums.length === 1 ? 'propiedad' : 'propiedades'}.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-2 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            {readyUnits} listos
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 text-sm font-medium">
                            <Loader2 className="h-4 w-4" />
                            {inProgressUnits} en progreso
                        </div>
                        <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <PlusCircle className="mr-2 h-5 w-5" /> Añadir propiedad
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, dirección o ciudad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterActive === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterActive('all')}
                    >
                        Todos
                    </Button>
                    <Button
                        variant={filterActive === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterActive('active')}
                        className={cn(filterActive === 'active' && 'bg-amber-500 hover:bg-amber-600')}
                    >
                        Con trabajo activo
                    </Button>
                </div>
            </div>

            {!dataLoading && condominiums.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
                    <Building2 className="mx-auto h-16 w-16 text-muted-foreground/70" />
                    <p className="mt-4 text-xl font-semibold text-muted-foreground">No hay condominios registrados.</p>
                    <p className="text-sm text-muted-foreground">Comienza creando tu primer condominio.</p>
                    <Button onClick={() => handleOpenForm()} className="mt-6">
                        <PlusCircle className="mr-2 h-5 w-5" /> Crear Primer Condominio
                    </Button>
                </div>
            ) : !dataLoading && filteredCondominiums.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
                    <Search className="mx-auto h-16 w-16 text-muted-foreground/70" />
                    <p className="mt-4 text-xl font-semibold text-muted-foreground">No se encontraron resultados.</p>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    {filteredCondominiums.map((condo) => (
                        <CondominiumCard
                            key={condo.id}
                            condominium={condo}
                            onEdit={handleOpenForm}
                            departmentCount={deptsByCondo[condo.id] || 0}
                            completedCount={completedByCondo[condo.id] || 0}
                            hasActiveWork={activeWorkByCondo[condo.id] || false}
                        />
                    ))}
                </div>
            )}

            <CondominiumForm isOpen={isFormOpen} onClose={handleCloseForm} condominium={editingCondominium} />
        </div>
    );
}
