"use client";
import React, { useState, useMemo } from 'react';
import type { Condominium } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { CondominiumForm } from '@/components/condominium/condominium-form';
import { CondominiumCard } from '@/components/condominium/condominium-card';
import { PlusCircle, Building2, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Input } from '@/components/ui/input';

export default function CondominiumsPage() {
    const { condominiums, departments, dataLoading } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCondominium, setEditingCondominium] = useState<Condominium | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenForm = (condo?: Condominium) => {
        setEditingCondominium(condo || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingCondominium(null);
    };

    const filteredCondominiums = useMemo(() => {
        return condominiums
            .filter(condo =>
                condo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (condo.address && condo.address.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [condominiums, searchTerm]);

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
            <header className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
                        <Building2 className="mr-3 h-8 w-8 text-primary" />
                        Condominios
                    </h1>
                    <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <PlusCircle className="mr-2 h-5 w-5" /> Nuevo Condominio
                    </Button>
                </div>
                <p className="text-muted-foreground mt-1">
                    Gestiona los condominios y agrupa tus departamentos para una mejor organización.
                </p>
            </header>

            <div className="mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar condominios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
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
                            hasActiveWork={activeWorkByCondo[condo.id] || false}
                        />
                    ))}
                </div>
            )}

            <CondominiumForm isOpen={isFormOpen} onClose={handleCloseForm} condominium={editingCondominium} />
        </div>
    );
}
