"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Building2, Users, Briefcase, CheckSquare, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { isToday } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function SuperadminDashboardPage() {
  const { currentUser } = useAuth();
  const { allCompanies, employees, tasks, departments, dataLoading } = useData();
  const [mounted, setMounted] = useState(false);

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug: Log para verificar datos
  useEffect(() => {
    if (mounted) {
      console.log('[SuperadminDashboard] Estado actual:', {
        dataLoading,
        allCompaniesCount: allCompanies.length,
        employeesCount: employees.length,
        tasksCount: tasks.length,
        departmentsCount: departments.length,
      });
    }
  }, [mounted, dataLoading, allCompanies.length, employees.length, tasks.length, departments.length]);

  // Estadísticas generales - DEBE estar antes de cualquier return condicional
  const stats = useMemo(() => {
    const totalCompanies = allCompanies.length;
    const totalEmployees = employees.length;
    const totalDepartments = departments.length;
    const totalTasks = tasks.length;
    
    const completedToday = tasks.filter(
      t => t.status === 'completed' && t.completedAt && isToday(new Date(t.completedAt))
    ).length;
    
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    // Empleados por empresa
    const employeesByCompany = allCompanies.map(company => ({
      companyName: company.displayName || company.name,
      count: employees.filter(emp => emp.companyId === company.id).length,
    }));

    // Tareas por empresa
    const tasksByCompany = allCompanies.map(company => ({
      companyName: company.displayName || company.name,
      pending: tasks.filter(t => t.companyId === company.id && t.status === 'pending').length,
      inProgress: tasks.filter(t => t.companyId === company.id && t.status === 'in_progress').length,
      completed: tasks.filter(t => t.companyId === company.id && t.status === 'completed').length,
    }));

    // Empresas por mes (crecimiento)
    const companiesByMonth = allCompanies.reduce((acc, company) => {
      const date = new Date(company.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedMonths = Object.keys(companiesByMonth).sort();
    const cumulativeCompanies = sortedMonths.reduce((acc, month) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(prev + companiesByMonth[month]);
      return acc;
    }, [] as number[]);

    return {
      totalCompanies,
      totalEmployees,
      totalDepartments,
      totalTasks,
      completedToday,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      employeesByCompany,
      tasksByCompany,
      companiesByMonth: sortedMonths,
      cumulativeCompanies,
    };
  }, [allCompanies, employees, tasks, departments]);

  // Datos para gráficos - DEBE estar antes de cualquier return condicional
  const employeesChartData = useMemo(() => ({
    labels: stats.employeesByCompany.map(e => e.companyName),
    datasets: [
      {
        label: 'Empleados',
        data: stats.employeesByCompany.map(e => e.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }), [stats.employeesByCompany]);

  const tasksChartData = useMemo(() => ({
    labels: stats.tasksByCompany.map(t => t.companyName),
    datasets: [
      {
        label: 'Pendientes',
        data: stats.tasksByCompany.map(t => t.pending),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'En Progreso',
        data: stats.tasksByCompany.map(t => t.inProgress),
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      },
      {
        label: 'Completadas',
        data: stats.tasksByCompany.map(t => t.completed),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  }), [stats.tasksByCompany]);

  const growthChartData = useMemo(() => ({
    labels: stats.companiesByMonth,
    datasets: [
      {
        label: 'Empresas Registradas',
        data: stats.cumulativeCompanies,
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
      },
    ],
  }), [stats.companiesByMonth, stats.cumulativeCompanies]);

  const tasksStatusChartData = useMemo(() => ({
    labels: ['Pendientes', 'En Progreso', 'Completadas'],
    datasets: [
      {
        data: [stats.pendingTasks, stats.inProgressTasks, stats.completedTasks],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(34, 197, 94, 0.7)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }), [stats.pendingTasks, stats.inProgressTasks, stats.completedTasks]);

  // No renderizar hasta que esté montado (evita errores de hidratación)
  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Inicializando...</p>
      </div>
    );
  }

  // Verificar que el usuario es superadmin
  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]">
        <p className="text-destructive">No tienes permisos para acceder a este panel.</p>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando estadísticas globales...</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Empresas: {allCompanies.length} | Empleados: {employees.length} | Tareas: {tasks.length}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-headline text-foreground">
          Panel de Superadministrador
        </h2>
        <p className="text-muted-foreground mt-2">
          Vista global de todas las empresas y estadísticas del sistema
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Empresas registradas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Empleados en todas las empresas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departamentos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Departamentos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas Hoy</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              De {stats.totalTasks} tareas totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Registradas</CardTitle>
          <CardDescription>
            Lista de todas las empresas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allCompanies.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay empresas registradas aún.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Empresa</th>
                      <th className="text-left p-2">Slug</th>
                      <th className="text-right p-2">Empleados</th>
                      <th className="text-right p-2">Departamentos</th>
                      <th className="text-right p-2">Tareas</th>
                      <th className="text-left p-2">Plan</th>
                      <th className="text-left p-2">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCompanies.map((company) => {
                      const companyEmployees = employees.filter(e => e.companyId === company.id).length;
                      const companyDepartments = departments.filter(d => d.companyId === company.id).length;
                      const companyTasks = tasks.filter(t => t.companyId === company.id).length;
                      
                      return (
                        <tr key={company.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">
                            {company.displayName || company.name}
                          </td>
                          <td className="p-2 text-muted-foreground text-sm">
                            {company.slug}
                          </td>
                          <td className="p-2 text-right">{companyEmployees}</td>
                          <td className="p-2 text-right">{companyDepartments}</td>
                          <td className="p-2 text-right">{companyTasks}</td>
                          <td className="p-2 text-sm">
                            <span className="px-2 py-1 bg-secondary rounded text-xs">
                              {company.planCode || 'starter'}
                            </span>
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {new Date(company.createdAt).toLocaleDateString('es-ES')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empleados por Empresa</CardTitle>
            <CardDescription>Distribución de empleados en cada empresa</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.employeesByCompany.length > 0 ? (
              <Bar data={employeesChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Tareas por Empresa</CardTitle>
            <CardDescription>Distribución de tareas por estado en cada empresa</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.tasksByCompany.length > 0 ? (
              <Bar data={tasksChartData} options={{ responsive: true }} />
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crecimiento de Empresas</CardTitle>
            <CardDescription>Empresas registradas a lo largo del tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.companiesByMonth.length > 0 ? (
              <Line data={growthChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado General de Tareas</CardTitle>
            <CardDescription>Distribución de todas las tareas del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalTasks > 0 ? (
              <div className="flex justify-center">
                <Doughnut data={tasksStatusChartData} options={{ responsive: true }} />
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No hay tareas disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
