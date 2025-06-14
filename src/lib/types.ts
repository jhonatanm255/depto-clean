
export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string; 
}

export interface Department {
  id: string;
  name: string;
  accessCode: string;
  address?: string; // Nuevo campo para la dirección
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string; 
  lastCleanedAt?: Date; 
}

export interface Employee {
  id: string; 
  name: string;
  email: string; 
}

export interface CleaningTask {
  id: string; 
  departmentId: string; 
  employeeId: string; 
  assignedAt: Date; 
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date; 
}
