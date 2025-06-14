export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string; // Optional: Employee name might be stored here
}

export interface Department {
  id: string;
  name: string;
  accessCode: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string; // Employee ID
  lastCleanedAt?: string; // ISO date string
}

export interface Employee {
  id: string;
  name: string;
  email: string; // Could be same as user email if employee is a user
}

export interface CleaningTask {
  id: string;
  departmentId: string;
  employeeId: string;
  assignedAt: string; // ISO date string
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string; // ISO date string
}
