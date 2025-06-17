
"use client";
import type { Department } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/core/loading-spinner';

interface UnassignedDepartmentsListCardProps {
  departments: Department[];
  dataLoading: boolean;
}

export function UnassignedDepartmentsListCard({ departments, dataLoading }: UnassignedDepartmentsListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Departamentos por Asignar</CardTitle>
        <CardDescription>Departamentos pendientes sin asignación.</CardDescription>
      </CardHeader>
      <CardContent>
        {dataLoading && departments.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <LoadingSpinner size={20} /><p className="ml-2 text-muted-foreground">Cargando...</p>
          </div>
        ) : departments.length > 0 ? (
          <ScrollArea className="h-[200px]">
            <ul className="space-y-2">
              {departments.map(dept => (
                <li key={dept.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                  <span>{dept.name}</span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/assignments">Asignar</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground">No hay departamentos que necesiten asignación.</p>
        )}
      </CardContent>
    </Card>
  );
}
