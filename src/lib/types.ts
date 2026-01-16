// Tipos de roles de usuario
export type UserRole = 'owner' | 'admin' | 'manager' | 'employee' | 'superadmin';

// Tipo de estado de tarea
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// Tipo de reporte de medios
export type MediaReportType = 'before' | 'after' | 'incident';

// Tipo de notificación
export type NotificationType =
  | 'task_assigned'
  | 'task_reassigned'
  | 'task_status_changed'
  | 'media_uploaded'
  | 'department_assigned'
  | 'department_status_changed';

// Usuario de la aplicación
export interface AppUser {
  id: string;
  email: string | null;
  role: UserRole;
  companyId: string; // Vacío para superadmin
  name: string;
  fullName?: string;
}

// Compañía
export interface Company {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  timezone?: string;
  planCode: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Departamento
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
  bedrooms?: number | null;
  bathrooms?: number | null;
  bedsCount?: number | null;
  beds?: Array<{ type: 'individual' | 'matrimonial' | 'king' | 'sofa_cama' | 'cuna', quantity: number }> | null;
  handTowels?: number | null;
  bodyTowels?: number | null;
  customFields?: Array<{ name: string, value: string }> | null;
  createdAt: string;
  updatedAt: string;
}

// Perfil de empleado
export interface EmployeeProfile {
  id: string;
  companyId: string;
  name: string;
  fullName?: string;
  email?: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Alias para compatibilidad
export type Employee = EmployeeProfile;

// Tarea de limpieza
export interface CleaningTask {
  id: string;
  companyId: string;
  departmentId: string;
  employeeId?: string;
  assignedBy?: string;
  status: TaskStatus;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Reporte de medios
export interface MediaReport {
  id: string;
  companyId: string;
  departmentId: string;
  employeeId?: string;
  uploadedBy: string;
  storagePath: string;
  downloadUrl?: string;
  fileName?: string;
  contentType?: string;
  reportType: MediaReportType;
  description?: string;
  uploadedAt: string;
  metadata?: Record<string, unknown>;
}

// Notificación
export interface Notification {
  id: string;
  userId: string;
  companyId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string | null;
  relatedDepartmentId?: string | null;
  relatedMediaReportId?: string | null;
  read: boolean;
  readAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
