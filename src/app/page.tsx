
"use client";
// This page will effectively become the dashboard if the user is logged in,
// due to the (app) layout structure.
// If not logged in, (app)/layout.tsx will redirect to /login.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Users, Building2, ClipboardCheck, AlertTriangle, Briefcase } from 'lucide-react';
import type { Department } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/core/loading-spinner';

function AdminDashboard() {
  const { departments, employees } = useData();
  const pendingCount = departments.filter(d => d.status === 'pending').length;
  const completedCount = departments.filter(d => d.status === 'completed').length;
  const inProgressCount = departments.filter(d => d.status === 'in_progress').length;

  const recentlyCompleted = departments
    .filter(d => d.status === 'completed' && d.lastCleanedAt)
    .sort((a, b) => new Date(b.lastCleanedAt!).getTime() - new Date(a.lastCleanedAt!).getTime())
    .slice(0, 5);

  const needsAttention = departments
    .filter(d => d.status === 'pending' && !d.assignedTo)
    .slice(0,5);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline text-foreground">Admin Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
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
            <CardTitle>Departments Needing Assignment</CardTitle>
            <CardDescription>These departments are pending and not yet assigned.</CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttention.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <ul className="space-y-2">
                  {needsAttention.map(dept => (
                    <li key={dept.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <span>{dept.name}</span>
                      <Link href="/admin/assignments" legacyBehavior>
                        <Button variant="outline" size="sm">Assign</Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">No departments currently need assignment.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recently Completed Tasks</CardTitle>
            <CardDescription>Overview of the latest completed cleanings.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentlyCompleted.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <ul className="space-y-2">
                {recentlyCompleted.map(dept => (
                  <li key={dept.id} className="p-2 rounded-md hover:bg-muted">
                    <p className="font-medium">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Completed by {employees.find(e => e.id === dept.assignedTo)?.name || 'N/A'} on {new Date(dept.lastCleanedAt!).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            ) : (
               <p className="text-sm text-muted-foreground">No tasks completed recently.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const { getTasksForEmployee, getDepartmentById, departments } = useData();
  const tasks = currentUser ? getTasksForEmployee(currentUser.id) : [];
  
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold font-headline text-foreground">Welcome, {currentUser?.name}!</h2>
      <p className="text-muted-foreground">Here are your tasks for today.</p>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <Link href="/employee/tasks" legacyBehavior>
              <Button variant="link" className="p-0 h-auto text-sm">View Tasks</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <ClipboardCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasksCount}</div>
            <p className="text-xs text-muted-foreground">Total tasks completed</p>
          </CardContent>
        </Card>
      </div>

      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Next Task</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{getDepartmentById(pendingTasks[0].departmentId)?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Access Code: {getDepartmentById(pendingTasks[0].departmentId)?.accessCode}
              </p>
              <Link href="/employee/tasks" legacyBehavior>
                 <Button className="mt-2">Go to My Tasks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
       {pendingTasks.length === 0 && (
          <Card>
            <CardHeader><CardTitle>All Clear!</CardTitle></CardHeader>
            <CardContent><p>You have no pending tasks. Great job!</p></CardContent>
          </Card>
        )}
    </div>
  );
}


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading and there's no current user, redirect to login
    if (!authLoading && !currentUser) {
      router.replace('/login');
    }
  }, [authLoading, currentUser, router]);

  // If auth is loading, OR if we are about to redirect (auth loaded, no user), show a loading spinner
  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // If currentUser exists (authLoading is false here), render the dashboard
  if (currentUser) {
    return currentUser.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
  }
  
  // Fallback, should generally not be reached if logic above is correct
  return null; 
}
