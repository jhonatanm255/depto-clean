
"use client";
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building2, ClipboardCheck, AlertTriangle, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/core/loading-spinner';

function AdminDashboard() {
  const { departments, employees } = useData();
  const pendingCount = departments.filter(d => d.status === 'pending').length;
  const completedCount = departments.filter(d => d.status === 'completed').length;

  const recentlyCompleted = departments
    .filter(d => d.status === 'completed' && d.lastCleanedAt)
    .sort((a, b) => new Date(b.lastCleanedAt!).getTime() - new Date(a.lastCleanedAt!).getTime())
    .slice(0, 5);

  const needsAttention = departments
    .filter(d => d.status === 'pending' && !d.assignedTo)
    .slice(0,5);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline text-foreground">Panel de Administrador</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departamentos</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Departamentos por Asignar</CardTitle>
            <CardDescription>Estos departamentos están pendientes y aún no han sido asignados.</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <ul className="space-y-2">
                  {needsAttention.map(dept => (
                    <li key={dept.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <span>{dept.name}</span>
                      <Link href="/admin/assignments" legacyBehavior>
                        <Button variant="outline" size="sm">Asignar</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No hay departamentos que necesiten asignación actualmente.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tareas Recientemente Completadas</CardTitle>
            <CardDescription>Resumen de las últimas limpiezas completadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentlyCompleted.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {recentlyCompleted.map(dept => (
                  <li key={dept.id} className="p-2 rounded-md hover:bg-muted">
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Completado por {employees.find(e => e.id === dept.assignedTo)?.name || 'N/D'} el {new Date(dept.lastCleanedAt!).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            ) : (
               <p className="text-sm text-muted-foreground">No hay tareas completadas recientemente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const { getTasksForEmployee, getDepartmentById } = useData();
  const tasks = currentUser ? getTasksForEmployee(currentUser.id) : [];
  
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline text-foreground">¡Bienvenido/a, {currentUser?.name}!</h2>
      <p className="text-muted-foreground">Aquí están tus tareas para hoy.</p>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <Link href="/employee/tasks" legacyBehavior>
              <Button variant="link" className="p-0 h-auto text-sm">Ver Tareas</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasksCount}</div>
            <p className="text-xs text-muted-foreground">Total tareas completadas</p>
          </CardContent>
        </Card>
      </div>

      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tu Próxima Tarea</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{getDepartmentById(pendingTasks[0].departmentId)?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Código de Acceso: {getDepartmentById(pendingTasks[0].departmentId)?.accessCode}
              </p>
              <Link href="/employee/tasks" legacyBehavior>
                 <Button className="mt-2">Ir a Mis Tareas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
       {pendingTasks.length === 0 && (
          <Card>
            <CardHeader><CardTitle>¡Todo Listo!</CardTitle></CardHeader>
            <CardContent><p>No tienes tareas pendientes. ¡Buen trabajo!</p></CardContent>
          </Card>
        )}
    </div>
  );
}


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-grow items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // No redirection logic here, (app)/layout.tsx handles it if currentUser is null.
  // This component will only render if currentUser is available after loading.

  if (!currentUser) {
    // This case should ideally not be reached if (app)/layout.tsx's redirection is effective.
    // However, as a fallback or during brief transitions, show loading.
     return (
      <div className="flex flex-grow items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return currentUser.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}
