
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
  assignedTo?: string; // Employee ID (Firestore document ID)
  lastCleanedAt?: Date; 
}

export interface Employee {
  id: string; // Firestore document ID
  name: string;
  email: string; 
}

export interface CleaningTask {
  id: string; // Firestore document ID
  departmentId: string; // Firestore document ID
  employeeId: string; // Firestore document ID
  assignedAt: Date; 
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date; 
}
