
"use client";
import type { CleaningTask, Department } from '@/lib/types';
import { TaskCard } from '@/components/task/task-card';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import type { LucideIcon } from 'lucide-react';

interface TaskListSectionProps {
  tasks: CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
  isLoading: boolean;
  initialLoadDone: boolean; // True if data context has loaded at least once
  emptyStateTitle: string;
  emptyStateMessage: string;
  emptyStateIcon: LucideIcon;
}

export function TaskListSection({
  tasks,
  getDepartmentById,
  isLoading,
  initialLoadDone,
  emptyStateTitle,
  emptyStateMessage,
  emptyStateIcon: EmptyStateIcon,
}: TaskListSectionProps) {

  if (isLoading && !initialLoadDone) {
    return (
      <div className="text-center py-10 border rounded-lg bg-card shadow">
        <LoadingSpinner size={24} />
        <p className="mt-4 text-muted-foreground">Cargando tareas...</p>
      </div>
    );
  }
  
  if (!isLoading && tasks.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg bg-card shadow">
        <EmptyStateIcon className="mx-auto h-16 w-16 text-muted-foreground/70" />
        <p className="mt-4 text-xl font-semibold text-muted-foreground">{emptyStateTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => {
        const department = getDepartmentById(task.departmentId);
        return <TaskCard key={task.id} task={task} department={department} />;
      })}
    </div>
  );
}
