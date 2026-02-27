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

// Estados de renta (rentals)
export type RentalStatus = 'reserved' | 'active' | 'completed' | 'cancelled';
export type RentalPaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';
export type DepartmentRentalStatus = 'available' | 'reserved' | 'occupied' | 'maintenance';

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
export interface Condominium {
  id: string;
  companyId: string;
  name: string;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  companyId: string;
  condominiumId?: string | null;
  name: string;
  accessCode?: string | null;
  address?: string | null;
  status: TaskStatus;
  priority?: 'normal' | 'high';
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
  // Campos de gestión de rentas (migración 0009)
  rentalStatus?: DepartmentRentalStatus | null;
  currentRentalId?: string | null;
  isRentable?: boolean | null;
  rentalPricePerNight?: number | null;
  maxGuests?: number | null;
  minNights?: number | null;
  cleaningFee?: number | null;
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
  priority?: 'normal' | 'high';
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
  taskId?: string; // Vinculación a la tarea específica
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

// Renta de departamento
export interface Rental {
  id: string;
  companyId: string;
  departmentId: string;
  tenantName: string;
  tenantEmail?: string | null;
  tenantPhone?: string | null;
  tenantIdNumber?: string | null;
  tenantEmergencyContact?: string | null;
  tenantEmergencyPhone?: string | null;
  rentalStatus: RentalStatus;
  checkInDate: string;
  checkOutDate: string;
  actualCheckIn?: string | null;
  actualCheckOut?: string | null;
  totalAmount: number;
  depositAmount?: number | null;
  paymentStatus: RentalPaymentStatus;
  amountPaid?: number | null;
  currency?: string | null;
  numberOfGuests: number;
  numberOfAdults?: number | null;
  numberOfChildren?: number | null;
  specialRequests?: string | null;
  keysDelivered?: boolean | null;
  keysDeliveredAt?: string | null;
  keysDeliveredBy?: string | null;
  keysReturned?: boolean | null;
  keysReturnedAt?: string | null;
  keysReturnedTo?: string | null;
  checkInInventory?: Record<string, unknown> | null;
  checkOutInventory?: Record<string, unknown> | null;
  damagesReported?: unknown[] | null;
  cleaningNotes?: string | null;
  bookingSource?: string | null;
  bookingReference?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Pago de renta
export interface RentalPayment {
  id: string;
  rentalId: string;
  companyId: string;
  amount: number;
  currency?: string | null;
  paymentMethod: string;
  paymentType: string;
  paymentDate: string;
  paymentReference?: string | null;
  notes?: string | null;
  receivedBy?: string | null;
  createdAt: string;
}

// Huésped de renta
export interface RentalGuest {
  id: string;
  rentalId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  idNumber?: string | null;
  ageGroup?: string | null;
  createdAt: string;
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
