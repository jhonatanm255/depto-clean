// ... existing code ...

export type MediaReportType = 'before' | 'after' | 'incident';

export type NotificationType = 
  | 'task_assigned'
  | 'task_reassigned'
  | 'task_status_changed'
  | 'media_uploaded'
  | 'department_assigned'
  | 'department_status_changed';

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

export type NotificationType = 
  | 'task_assigned'
  | 'task_reassigned'
  | 'task_status_changed'
  | 'media_uploaded'
  | 'department_assigned'
  | 'department_status_changed';

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

// ... existing code ...
