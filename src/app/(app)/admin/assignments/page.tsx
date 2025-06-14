
"use client";
import { useData } from '@/contexts/data-context';
import { AssignmentForm } from '@/components/assignment/assignment-form';
import { AssignmentList } from '@/components/assignment/assignment-list';
import { ClipboardEdit } from 'lucide-react';

export default function AssignmentsPage() {
  const { tasks, departments, employees } = useData();
  
  // Sort tasks by most recently assigned first
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
          <ClipboardEdit className="mr-3 h-8 w-8 text-primary" />
          Assign & View Tasks
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <AssignmentForm />
        </div>
        <div className="lg:col-span-2">
          <AssignmentList tasks={sortedTasks} departments={departments} employees={employees} />
        </div>
      </div>
    </div>
  );
}
