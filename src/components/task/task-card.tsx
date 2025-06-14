
"use client";
import type { CleaningTask, Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, KeyRound, CheckCircle2, Loader2, AlertTriangle, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface TaskCardProps {
  task: CleaningTask;
  department?: Department;
}

export function TaskCard({ task, department }: TaskCardProps) {
  const { updateTaskStatus } = useData();

  const handleUpdateStatus = (status: 'pending' | 'in_progress' | 'completed') => {
    updateTaskStatus(task.id, status);
    toast({ title: "Task Updated", description: `Task status set to ${status.replace('_', ' ')}.` });
  };

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


  if (!department) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Task Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Department details not found for this task.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="font-headline text-xl flex items-center">
            <Building2 className="mr-2 h-6 w-6 text-primary" />
            {department.name}
          </CardTitle>
          <Badge variant="default" className={cn("text-primary-foreground capitalize", getStatusBadgeVariant(task.status))}>
            {getStatusIcon(task.status)}
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardDescription className="flex items-center pt-1">
          <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
          Access Code: {department.accessCode}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
         <p className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4"/> Assigned: {new Date(task.assignedAt).toLocaleDateString()}
        </p>
        {task.status === 'completed' && task.completedAt && (
           <p className="flex items-center text-sm text-green-600">
             <CheckCircle2 className="mr-2 h-4 w-4"/> Completed: {new Date(task.completedAt).toLocaleDateString()}
           </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 border-t pt-4">
        {task.status === 'pending' && (
          <>
            <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('in_progress')}>
              <Loader2 className="mr-1 h-4 w-4" /> Start Cleaning
            </Button>
            <Button size="sm" onClick={() => handleUpdateStatus('completed')} className="bg-green-500 hover:bg-green-600 text-white">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Completed
            </Button>
          </>
        )}
        {task.status === 'in_progress' && (
          <Button size="sm" onClick={() => handleUpdateStatus('completed')} className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Completed
          </Button>
        )}
        {task.status === 'completed' && (
          <p className="text-sm text-green-600 font-medium">Task Completed!</p>
        )}
      </CardFooter>
    </Card>
  );
}
