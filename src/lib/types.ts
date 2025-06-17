
export type UserRole = 'admin' | 'employee';

// Representa el usuario en el contexto de la aplicación,
// puede combinar datos de Firebase Auth y Firestore.
export interface AppUser {
  uid: string; // Firebase Auth UID
  email: string | null; // Firebase Auth email
  role: UserRole;
  name?: string; // Obtenido de Firestore
  // id de empleado de Firestore, si es un empleado
  // para facilitar la búsqueda de su perfil específico en la colección 'employees'
  employeeProfileId?: string; 
}


export interface Department {
  id: string;
  name: string;
  accessCode: string;
  address?: string; 
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string; // employeeProfileId
  lastCleanedAt?: Date; 
}

// Representa el perfil de datos de una empleada en Firestore
export interface EmployeeProfile {
  id: string; // Document ID en Firestore
  authUid?: string; // UID de Firebase Auth si tiene cuenta individual
  name: string;
  email: string; 
  // No almacenamos la contraseña aquí
}

export interface CleaningTask {
  id: string; 
  departmentId: string; 
  employeeId: string; // employeeProfileId (el ID del documento en la colección 'employees')
  assignedAt: Date; 
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date; 
}

export type MediaReportType = 'before' | 'after' | 'incident';

export interface MediaReport {
  id: string;
  departmentId: string;
  employeeProfileId: string; 
  uploadedByAuthUid: string; 
  storagePath: string; 
  downloadURL: string;
  fileName: string;
  contentType: string; 
  reportType: MediaReportType;
  description?: string;
  uploadedAt: Date; 
}
