
"use client";
import type { CleaningTask, Department, Employee } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Building2, CalendarDays, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignmentListProps {
  tasks: CleaningTask[];
  departments: Department[];
  employees: Employee[];
}

export function AssignmentList({ tasks, departments, employees }: AssignmentListProps) {
  if (tasks.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Current Assignments</CardTitle>
          <CardDescription>No tasks are currently assigned.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">Assign tasks using the form above.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: CleaningTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in_progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };
  
  const getStatusIcon = (status: CleaningTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Current Assignments</CardTitle>
        <CardDescription>Overview of all assigned cleaning tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3">
          <ul className="space-y-4">
            {tasks.map((task) => {
              const department = departments.find(d => d.id === task.departmentId);
              const employee = employees.find(e => e.id === task.employeeId);
              if (!department || !employee) return null;

              return (
                <li key={task.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-card">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                    <h3 className="text-lg font-semibold text-primary flex items-center">
                      <Building2 className="mr-2 h-5 w-5"/> {department.name}
                    </h3>
                    <Badge variant="default" className={cn("text-primary-foreground capitalize mt-2 sm:mt-0", getStatusBadgeVariant(task.status))}>
                      {getStatusIcon(task.status)}
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center"><User className="mr-2 h-4 w-4"/> Assigned to: {employee.name}</p>
                    <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4"/> Assigned on: {new Date(task.assignedAt).toLocaleDateString()}</p>
                    {task.status === 'completed' && task.completedAt && (
                      <p className="flex items-center text-green-600"><CheckCircle2 className="mr-2 h-4 w-4"/> Completed on: {new Date(task.completedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
