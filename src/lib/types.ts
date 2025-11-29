
export type UserRole = 'superadmin' | 'owner' | 'admin' | 'manager' | 'employee';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type MediaReportType = 'before' | 'after' | 'incident';

export interface Company {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  legalName?: string | null;
  taxId?: string | null;
  timezone?: string | null;
  planCode: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  companyId: string;
  role: UserRole;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  metadata?: Record<string, unknown>;
  invitedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  email: string | null;
  role: UserRole;
  companyId: string; // Puede estar vacío para superadmin
  name?: string | null;
  fullName?: string | null;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  accessCode?: string | null;
  address?: string | null;
  status: TaskStatus;
  assignedTo?: string | null;
  lastCleanedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeProfile {
  id: string;
  companyId: string;
  name: string;
  fullName?: string | null;
  email?: string | null;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningTask {
  id: string;
  companyId: string;
  departmentId: string;
  employeeId?: string | null;
  assignedBy?: string | null;
  status: TaskStatus;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaReport {
  id: string;
  companyId: string;
  departmentId: string;
  employeeId?: string | null;
  uploadedBy: string;
  storagePath: string;
  downloadUrl?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  reportType: MediaReportType;
  description?: string | null;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
}

export type Employee = EmployeeProfile;
