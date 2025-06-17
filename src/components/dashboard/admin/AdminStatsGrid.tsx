
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { AlertTriangle, Activity, Clock, Building2, Users } from 'lucide-react';

interface AdminStatsGridProps {
  pendingCount: number;
  inProgressCount: number;
  completedTodayCount: number;
  departmentsCount: number;
  employeesCount: number;
  dataLoading: boolean;
  initialDataLoaded: boolean; // True if initial fetch for counts is done
}

export function AdminStatsGrid({ 
  pendingCount, 
  inProgressCount, 
  completedTodayCount, 
  departmentsCount, 
  employeesCount, 
  dataLoading,
  initialDataLoaded
}: AdminStatsGridProps) {
  
  const StatCard = ({ title, value, icon: Icon, iconColor, isLoading }: { title: string, value: number, icon: React.ElementType, iconColor: string, isLoading?: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <LoadingSpinner size={16} /> : value}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Tareas Pendientes (Depto)" 
          value={pendingCount} 
          icon={AlertTriangle} 
          iconColor="text-yellow-500"
          isLoading={dataLoading && !initialDataLoaded}
        />
        <StatCard 
          title="Tareas en Progreso (Depto)" 
          value={inProgressCount} 
          icon={Activity} 
          iconColor="text-blue-500"
          isLoading={dataLoading && !initialDataLoaded}
        />
        <StatCard 
          title="Completadas Hoy" 
          value={completedTodayCount} 
          icon={Clock} 
          iconColor="text-green-500"
          isLoading={dataLoading && !initialDataLoaded}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatCard 
          title="Total Departamentos" 
          value={departmentsCount} 
          icon={Building2} 
          iconColor="text-muted-foreground"
          isLoading={dataLoading && !initialDataLoaded}
        />
        <StatCard 
          title="Total Empleadas" 
          value={employeesCount} 
          icon={Users} 
          iconColor="text-muted-foreground"
          isLoading={dataLoading && !initialDataLoaded}
        />
      </div>
    </>
  );
}
