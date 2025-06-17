
"use client";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Briefcase, Clock, History } from 'lucide-react';

interface EmployeeStatsGridProps {
  activeTasksCount: number;
  completedTodayCount: number;
  completedHistoryCount: number;
  dataLoading: boolean;
  initialDataLoaded: boolean;
}

export function EmployeeStatsGrid({ 
  activeTasksCount, 
  completedTodayCount, 
  completedHistoryCount,
  dataLoading,
  initialDataLoaded
}: EmployeeStatsGridProps) {
  
  const StatCard = ({ title, value, icon: Icon, iconColor, linkHref, linkText, isLoading }: { title: string, value: number, icon: React.ElementType, iconColor: string, linkHref: string, linkText: string, isLoading?: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
            {isLoading ? <LoadingSpinner size={16}/> : value}
        </div>
        <Button variant="link" className="p-0 h-auto text-sm" asChild>
          <Link href={linkHref}>{linkText}</Link>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard 
        title="Tareas Activas" 
        value={activeTasksCount} 
        icon={Briefcase} 
        iconColor="text-primary" 
        linkHref="/employee/tasks" 
        linkText="Ver Tareas Pendientes"
        isLoading={dataLoading && !initialDataLoaded}
      />
      <StatCard 
        title="Completadas Hoy" 
        value={completedTodayCount} 
        icon={Clock} 
        iconColor="text-green-500" 
        linkHref="/employee/tasks?tab=completed_today" 
        linkText="Ver Completadas Hoy"
        isLoading={dataLoading && !initialDataLoaded}
      />
      <StatCard 
        title="Historial Completadas" 
        value={completedHistoryCount} 
        icon={History} 
        iconColor="text-muted-foreground" 
        linkHref="/employee/tasks?tab=completed_history" 
        linkText="Ver Historial"
        isLoading={dataLoading && !initialDataLoaded}
      />
    </div>
  );
}
