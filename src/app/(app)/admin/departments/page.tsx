
"use client";
import { useState } from 'react';
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { DepartmentForm } from '@/components/department/department-form';
import { DepartmentCard } from '@/components/department/department-card';
import { PlusCircle, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DepartmentsPage() {
  const { departments, employees } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('name_asc');


  const handleOpenForm = (department?: Department) => {
    setEditingDepartment(department || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingDepartment(null);
  };
  
  const filteredDepartments = departments
    .filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(dept => statusFilter === 'all' || dept.status === statusFilter)
    .sort((a, b) => {
        switch (sortOrder) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'status': return a.status.localeCompare(b.status);
            default: return 0;
        }
    });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold font-headline text-foreground flex items-center">
            <Building2 className="mr-3 h-8 w-8 text-primary" />
            Manage Departments
          </h1>
          <Button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Department
          </Button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-card shadow">
        <Input 
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="status">Status</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-10">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No departments found.</p>
          <p className="text-sm text-muted-foreground">Get started by adding a new department.</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center py-10">
           <p className="mt-4 text-lg text-muted-foreground">No departments match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} onEdit={handleOpenForm} employees={employees} />
          ))}
        </div>
      )}
      <DepartmentForm isOpen={isFormOpen} onClose={handleCloseForm} department={editingDepartment} />
    </div>
  );
}
