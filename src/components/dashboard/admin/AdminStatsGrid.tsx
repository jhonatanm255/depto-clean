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
  initialDataLoaded: boolean;
}

export function AdminStatsGrid({
  pendingCount,
  inProgressCount,
  completedTodayCount,
  departmentsCount,
  employeesCount,
  dataLoading,
  initialDataLoaded,
}: AdminStatsGridProps) {
  const unassignedCount = 0; // could be derived from props if passed
  const targetDaily = 30;

  const StatCard = ({
    title,
    value,
    icon: Icon,
    accentBg,
    accentText,
    tag,
    subtitle,
    subtitleClassName,
    isLoading,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    accentBg: string;
    accentText: string;
    tag?: string;
    subtitle?: string;
    subtitleClassName?: string;
    isLoading?: boolean;
  }) => (
    <Card className="overflow-hidden relative bg-card border border-border shadow-sm">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBg}`} />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pl-5 pr-4 pt-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {tag && (
            <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${accentBg} ${accentText}`}>
              {tag}
            </span>
          )}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentBg} ${accentText}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="pl-5 pb-4 pt-0">
        <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
          {isLoading ? <LoadingSpinner size={20} /> : value}
        </div>
        {subtitle && <p className={`text-xs mt-1 ${subtitleClassName ?? 'text-muted-foreground'}`}>{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tareas Pendientes"
          value={pendingCount}
          icon={AlertTriangle}
          accentBg="bg-amber-500"
          accentText="text-white"
          tag={unassignedCount > 0 ? `Atrasadas: ${unassignedCount}` : undefined}
          subtitle={pendingCount > 0 ? "Requieren asignación" : undefined}
          isLoading={dataLoading && !initialDataLoaded}
        />
        <StatCard
          title="En Progreso"
          value={inProgressCount}
          icon={Activity}
          accentBg="bg-blue-500"
          accentText="text-white"
          tag={inProgressCount > 0 ? `${inProgressCount} activos` : undefined}
          subtitle="Al día"
          isLoading={dataLoading && !initialDataLoaded}
        />
        <StatCard
          title="Completadas Hoy"
          value={completedTodayCount}
          icon={Clock}
          accentBg="bg-emerald-500"
          accentText="text-white"
          tag={`Meta: ${targetDaily}`}
          subtitle={completedTodayCount >= targetDaily ? "Meta alcanzada" : undefined}
          subtitleClassName={completedTodayCount >= targetDaily ? "text-emerald-600 dark:text-emerald-400" : undefined}
          isLoading={dataLoading && !initialDataLoaded}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Departamentos"
          value={departmentsCount}
          icon={Building2}
          accentBg="bg-slate-400"
          accentText="text-white"
          isLoading={dataLoading && !initialDataLoaded}
        />
        <StatCard
          title="Total Empleadas"
          value={employeesCount}
          icon={Users}
          accentBg="bg-slate-400"
          accentText="text-white"
          isLoading={dataLoading && !initialDataLoaded}
        />
      </div>
    </>
  );
}
