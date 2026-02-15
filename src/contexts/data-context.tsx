"use client";
import type { Company, Department, EmployeeProfile, CleaningTask, MediaReport, MediaReportType, TaskStatus, Condominium } from '@/lib/types';


import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_MEDIA_BUCKET } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';

interface DataContextType {
  company: Company | null;
  condominiums: Condominium[];
  departments: Department[];
  addDepartment: (input: {
    name: string;
    condominiumId?: string | null;
    accessCode?: string | null;
    address?: string | null;
    notes?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    bedsCount?: number | null;
    beds?: Department['beds'];
    handTowels?: number | null;
    bodyTowels?: number | null;
    customFields?: Department['customFields'];
  }) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  employees: EmployeeProfile[];
  addEmployeeWithAuth: (name: string, email: string, password: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  tasks: CleaningTask[];
  assignTask: (departmentId: string, employeeProfileId: string, priority?: 'normal' | 'high') => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  toggleDepartmentPriority: (departmentId: string, currentPriority: 'normal' | 'high') => Promise<void>;

  addMediaReport: (
    departmentId: string,
    employeeProfileId: string | null,
    file: File,
    reportType: MediaReportType,
    description?: string,
    onProgress?: (percentage: number) => void,
    taskId?: string
  ) => Promise<void>;
  getMediaReportsForDepartment: (departmentId: string) => Promise<MediaReport[]>;

  getTasksForEmployee: (employeeProfileId: string) => CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
  getEmployeeProfileById: (employeeProfileId: string) => EmployeeProfile | undefined;
  dataLoading: boolean;

  // Funciones para superadmin
  allCompanies: Company[];
  getAllCompanies: () => Promise<Company[]>;
  getAllEmployees: () => Promise<EmployeeProfile[]>;
  getAllTasks: () => Promise<CleaningTask[]>;
  getAllDepartments: () => Promise<Department[]>;

  // Condominiums
  addCondominium: (input: { name: string; address?: string | null }) => Promise<void>;
  updateCondominium: (condo: Condominium) => Promise<void>;
  deleteCondominium: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

type DepartmentRow = {
  id: string;
  company_id: string;
  condominium_id: string | null;
  name: string;
  access_code: string | null;
  address: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  last_cleaned_at: string | null;
  notes: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  beds_count: number | null;
  beds: Department['beds'];
  hand_towels: number | null;
  body_towels: number | null;
  custom_fields: Department['customFields'];
  priority: 'normal' | 'high' | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  company_id: string;
  role: EmployeeProfile['role'];
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type TaskRow = {
  id: string;
  company_id: string;
  department_id: string;
  employee_id: string | null;
  assigned_by: string | null;
  status: TaskStatus;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  priority: 'normal' | 'high' | null;
  created_at: string;
  updated_at: string;
};

type MediaReportRow = {
  id: string;
  company_id: string;
  department_id: string;
  task_id: string | null;
  employee_id: string | null;
  uploaded_by: string;
  report_type: MediaReportType;
  storage_path: string;
  download_url: string | null;
  file_name: string | null;
  content_type: string | null;
  description: string | null;
  uploaded_at: string;
  metadata: Record<string, unknown> | null;
};

type CompanyRow = {
  id: string;
  name: string;
  display_name: string | null;
  slug: string;
  legal_name: string | null;
  tax_id: string | null;
  timezone: string | null;
  plan_code: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const mapDepartment = (row: DepartmentRow): Department => ({
  id: row.id,
  companyId: row.company_id,
  condominiumId: row.condominium_id,
  name: row.name,
  accessCode: row.access_code,
  address: row.address,
  status: row.status,
  assignedTo: row.assigned_to,
  lastCleanedAt: row.last_cleaned_at,
  notes: row.notes,
  bedrooms: row.bedrooms,
  bathrooms: row.bathrooms,
  bedsCount: row.beds_count,
  beds: Array.isArray(row.beds) ? row.beds : [],
  handTowels: row.hand_towels,
  bodyTowels: row.body_towels,
  customFields: Array.isArray(row.custom_fields) ? row.custom_fields : [],
  priority: row.priority ?? 'normal',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEmployee = (row: ProfileRow): EmployeeProfile => ({
  id: row.id,
  companyId: row.company_id,
  name: row.full_name ?? row.email ?? 'Sin nombre',
  fullName: row.full_name ?? undefined,
  email: row.email ?? undefined,
  role: row.role,
  phone: row.phone ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
  metadata: row.metadata ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTask = (row: TaskRow): CleaningTask => ({
  id: row.id,
  companyId: row.company_id,
  departmentId: row.department_id,
  employeeId: row.employee_id ?? undefined,
  assignedBy: row.assigned_by ?? undefined,
  status: row.status,
  assignedAt: row.assigned_at,
  startedAt: row.started_at ?? undefined,
  completedAt: row.completed_at ?? undefined,
  notes: row.notes ?? undefined,
  priority: row.priority ?? 'normal',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMediaReport = (row: MediaReportRow): MediaReport => ({
  id: row.id,
  companyId: row.company_id,
  departmentId: row.department_id,
  taskId: row.task_id ?? undefined,
  employeeId: row.employee_id ?? undefined,
  uploadedBy: row.uploaded_by,
  storagePath: row.storage_path,
  downloadUrl: row.download_url ?? undefined,
  fileName: row.file_name ?? undefined,
  contentType: row.content_type ?? undefined,
  reportType: row.report_type,
  description: row.description ?? undefined,
  uploadedAt: row.uploaded_at,
  metadata: row.metadata ?? undefined,
});

const mapCompany = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  displayName: row.display_name ?? row.name,
  slug: row.slug,
  legalName: row.legal_name ?? undefined,
  taxId: row.tax_id ?? undefined,
  timezone: row.timezone ?? undefined,
  planCode: row.plan_code ?? 'starter',
  metadata: row.metadata ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const { currentUser } = useAuth();
  const lastLoadedUserIdRef = React.useRef<string | null>(null);
  const lastLoadedCompanyIdRef = React.useRef<string | null>(null);
  const priorityChannelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isSuperadmin = currentUser?.role === 'superadmin';

  const loadData = useCallback(async () => {
    if (!currentUser) {
      console.log('[DataContext] No hay usuario actual, saltando carga de datos');
      return;
    }

    if (isSuperadmin) {
      // Para superadmin, cargar todas las empresas y datos globales
      console.log('[DataContext] Cargando datos globales para superadmin', {
        userId: currentUser.id,
        role: currentUser.role,
      });
      setDataLoading(true);
      const startTime = Date.now();

      try {
        const [companiesResp, departmentsResp, employeesResp, tasksResp, condosResp] = await Promise.all([
          supabase
            .from('companies')
            .select('id, name, slug, legal_name, tax_id, timezone, plan_code, metadata, display_name, created_at, updated_at')
            .order('created_at', { ascending: false }),
          supabase
            .from('departments')
            .select('*')
            .order('name', { ascending: true }),
          supabase
            .from('profiles')
            .select('*')
            .order('full_name', { ascending: true }),
          supabase
            .from('tasks')
            .select('*')
            .order('assigned_at', { ascending: false }),
          supabase
            .from('condominiums')
            .select('*')
            .order('name', { ascending: true }),
        ]);

        const elapsed = Date.now() - startTime;
        console.log(`[DataContext] Consultas globales completadas en ${elapsed}ms`);

        // Log de errores detallado
        if (companiesResp.error) {
          console.error('[DataContext] Error en companies:', companiesResp.error);
          throw companiesResp.error;
        }
        if (departmentsResp.error) {
          console.error('[DataContext] Error en departments:', departmentsResp.error);
          throw departmentsResp.error;
        }
        if (employeesResp.error) {
          console.error('[DataContext] Error en employees:', employeesResp.error);
          throw employeesResp.error;
        }
        if (tasksResp.error) {
          console.error('[DataContext] Error en tasks:', tasksResp.error);
          throw tasksResp.error;
        }
        if (condosResp.error) {
          console.error('[DataContext] Error en condominiums:', condosResp.error);
          throw condosResp.error;
        }

        const companiesData = (companiesResp.data as CompanyRow[]) || [];
        const departmentsData = (departmentsResp.data as DepartmentRow[]) || [];
        const employeesData = (employeesResp.data as ProfileRow[]) || [];
        const tasksData = (tasksResp.data as TaskRow[]) || [];
        const condosData = (condosResp.data as any[]) || [];

        setAllCompanies(companiesData.map(mapCompany));
        setCondominiums(condosData.map((c: any) => ({
          id: c.id,
          companyId: c.company_id,
          name: c.name,
          address: c.address,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        })));
        setDepartments(departmentsData.map(mapDepartment));
        setEmployees(employeesData.map(mapEmployee));
        setTasks(tasksData.map(mapTask));
        setCompany(null); // Superadmin no tiene una compañía específica

        console.log('[DataContext] ✓ Datos globales cargados:', {
          companies: companiesData.length,
          departments: departmentsData.length,
          employees: employeesData.length,
          tasks: tasksData.length,
        });
        console.log('[DataContext] Primeras empresas:', companiesData.slice(0, 3).map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('[DataContext] Error cargando datos globales:', error);
        toast({
          variant: 'destructive',
          title: 'Error de datos',
          description: 'No se pudo cargar la información global.',
        });
      } finally {
        setDataLoading(false);
      }
      return;
    }

    // Carga normal para usuarios regulares
    console.log('[DataContext] Iniciando carga de datos para companyId:', currentUser.companyId);

    // Si por alguna razón no hay companyId (por ejemplo, superadmin o perfil incompleto),
    // evitar hacer consultas con company_id = '' que generan errores 400/22P02.
    if (!currentUser.companyId) {
      console.warn('[DataContext] ⚠️ currentUser.companyId está vacío, saltando carga de datos por compañía');
      setCompany(null);
      setDepartments([]);
      setEmployees([]);
      setTasks([]);
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    const startTime = Date.now();

    try {
      const [companyResp, departmentsResp, employeesResp, tasksResp, condosResp] = await Promise.all([
        supabase
          .from('companies')
          .select('id, name, slug, legal_name, tax_id, timezone, plan_code, metadata, display_name, created_at, updated_at')
          .eq('id', currentUser.companyId)
          .maybeSingle<CompanyRow>(),
        supabase
          .from('departments')
          .select('*')
          .eq('company_id', currentUser.companyId)
          .order('name', { ascending: true }),
        supabase
          .from('profiles')
          .select('*')
          .eq('company_id', currentUser.companyId)
          .in('role', ['manager', 'employee'])
          .order('full_name', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('company_id', currentUser.companyId)
          .order('assigned_at', { ascending: false }),
        supabase
          .from('condominiums')
          .select('*')
          .eq('company_id', currentUser.companyId)
          .order('name', { ascending: true }),
      ]);

      const elapsed = Date.now() - startTime;
      console.log(`[DataContext] Consultas completadas en ${elapsed}ms`);

      if (companyResp.error) {
        console.error('[DataContext] Error cargando company:', companyResp.error);
        throw companyResp.error;
      }
      if (departmentsResp.error) {
        console.error('[DataContext] Error cargando departments:', departmentsResp.error);
        throw departmentsResp.error;
      }
      if (employeesResp.error) {
        console.error('[DataContext] Error cargando employees:', employeesResp.error);
        throw employeesResp.error;
      }
      if (tasksResp.error) {
        console.error('[DataContext] Error cargando tasks:', tasksResp.error);
        throw tasksResp.error;
      }
      if (condosResp.error) {
        console.error('[DataContext] Error cargando condominiums:', condosResp.error);
        throw condosResp.error;
      }

      const departmentsData = (departmentsResp.data as DepartmentRow[]) || [];
      const employeesData = (employeesResp.data as ProfileRow[]) || [];
      const tasksData = (tasksResp.data as TaskRow[]) || [];
      const condosData = (condosResp.data as any[]) || [];

      setCondominiums(condosData.map((c: any) => ({
        id: c.id,
        companyId: c.company_id,
        name: c.name,
        address: c.address,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      })));

      console.log('[DataContext] Datos cargados:', {
        company: companyResp.data ? '✓' : '✗',
        condominiums: condosData.length,
        departments: departmentsData.length,
        employees: employeesData.length,
        tasks: tasksData.length,
      });

      // Mapear company (display_name puede no existir en la BD aún)
      if (companyResp.data) {
        const companyData = companyResp.data as any;
        const company: Company = {
          id: companyData.id,
          name: companyData.name,
          displayName: companyData.display_name ?? companyData.name, // Usar name si display_name no existe
          slug: companyData.slug,
          legalName: companyData.legal_name ?? undefined,
          taxId: companyData.tax_id ?? undefined,
          timezone: companyData.timezone ?? undefined,
          planCode: companyData.plan_code ?? 'starter',
          metadata: companyData.metadata ?? undefined,
          createdAt: companyData.created_at,
          updatedAt: companyData.updated_at,
        };
        setCompany(company);
      } else {
        setCompany(null);
      }
      setDepartments(departmentsData.map(mapDepartment));
      setEmployees(employeesData.map(mapEmployee));
      setTasks(tasksData.map(mapTask));

      console.log('[DataContext] ✓ Datos actualizados en estado');
    } catch (error) {
      console.error('[DataContext] Error cargando datos:', error);
      toast({
        variant: 'destructive',
        title: 'Error de datos',
        description: 'No se pudo cargar la información. Intenta nuevamente.',
      });
    } finally {
      setDataLoading(false);
      console.log('[DataContext] Carga de datos finalizada, dataLoading = false');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      console.log('[DataContext] Usuario no autenticado, limpiando datos');
      setCompany(null);
      setDepartments([]);
      setEmployees([]);
      setTasks([]);
      setAllCompanies([]);
      setDataLoading(false);
      lastLoadedUserIdRef.current = null;
      lastLoadedCompanyIdRef.current = null;
      return;
    }

    // Optimización: Solo recargar datos si:
    // 1. El usuario cambió (diferente ID)
    // 2. Es la primera carga
    // 3. El companyId cambió (importante: usuario mínimo → usuario completo)
    const userIdChanged = lastLoadedUserIdRef.current !== currentUser.id;
    const companyIdChanged = lastLoadedCompanyIdRef.current !== currentUser.companyId;
    const isFirstLoad = lastLoadedUserIdRef.current === null;

    if (userIdChanged || isFirstLoad || companyIdChanged) {
      console.log('[DataContext] Usuario autenticado detectado, cargando datos...', {
        userId: currentUser.id,
        companyId: currentUser.companyId,
        previousUserId: lastLoadedUserIdRef.current,
        previousCompanyId: lastLoadedCompanyIdRef.current,
        isFirstLoad,
        userIdChanged,
        companyIdChanged
      });
      lastLoadedUserIdRef.current = currentUser.id;
      lastLoadedCompanyIdRef.current = currentUser.companyId || null;
      void loadData();
    } else {
      console.log('[DataContext] Usuario y companyId no cambiaron, omitiendo recarga de datos para optimizar rendimiento');
    }
  }, [currentUser, isSuperadmin, loadData]);

  // Canal de broadcast para cambios de prioridad (funciona incluso si Postgres Realtime no está habilitado)
  useEffect(() => {
    if (!currentUser?.companyId) return;
    // Limpiar canal anterior si existe
    if (priorityChannelRef.current) {
      supabase.removeChannel(priorityChannelRef.current);
      priorityChannelRef.current = null;
    }
    const channel = supabase.channel(`company-${currentUser.companyId}-dept-priority`, {
      config: { broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'priority_changed' }, ({ payload }) => {
      const { departmentId, priority } = payload as { departmentId: string; priority: 'normal' | 'high' };
      setDepartments((prev) => prev.map((d) => (d.id === departmentId ? { ...d, priority } : d)));
      setTasks((prev) =>
        prev.map((t) =>
          t.departmentId === departmentId && t.status !== 'completed' ? { ...t, priority } : t
        )
      );
    });
    channel.on('broadcast', { event: 'task_status_changed' }, ({ payload }) => {
      const { taskId, departmentId, status, departmentPriority } = payload as {
        taskId: string;
        departmentId: string;
        status: TaskStatus;
        departmentPriority?: 'normal' | 'high';
      };
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      setDepartments((prev) => prev.map((d) => {
        if (d.id !== departmentId) return d;
        const base = { ...d, status };
        const withPriority = departmentPriority ? { ...base, priority: departmentPriority } : base;
        // Si la tarea se completó, limpiar asignación para ocultar el icono de rayo en tiempo real
        return status === 'completed' ? { ...withPriority, assignedTo: null } : withPriority;
      }));
    });
    channel.subscribe();
    priorityChannelRef.current = channel;
    return () => {
      if (priorityChannelRef.current) {
        supabase.removeChannel(priorityChannelRef.current);
        priorityChannelRef.current = null;
      }
    };
  }, [currentUser?.companyId]);

  // Suscripción a cambios en tiempo real (Realtime)
  useEffect(() => {
    if (!currentUser?.companyId) return;

    console.log('[DataContext] 🔌 Suscribiendo a cambios en tiempo real para company:', currentUser.companyId);

    const channel = supabase.channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departments',
          filter: `company_id=eq.${currentUser.companyId}`,
        },
        (payload) => {
          console.log('[DataContext] ⚡ Cambio en departments:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const newDept = mapDepartment(payload.new as DepartmentRow);
            setDepartments((prev) => {
              if (prev.some(d => d.id === newDept.id)) return prev; // Evitar duplicados
              return [...prev, newDept].sort((a, b) => a.name.localeCompare(b.name));
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedDept = mapDepartment(payload.new as DepartmentRow);
            setDepartments((prev) => prev.map((d) => (d.id === updatedDept.id ? updatedDept : d)));
          } else if (payload.eventType === 'DELETE') {
            setDepartments((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `company_id=eq.${currentUser.companyId}`,
        },
        (payload) => {
          console.log('[DataContext] ⚡ Cambio en tasks:', payload.eventType);
          if (payload.eventType === 'INSERT') {
            const newTask = mapTask(payload.new as TaskRow);
            setTasks((prev) => {
              if (prev.some(t => t.id === newTask.id)) return prev;
              return [newTask, ...prev].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = mapTask(payload.new as TaskRow);
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[DataContext] Estado de suscripción realtime:', status);
      });

    return () => {
      console.log('[DataContext] 🔌 Desuscribiendo realtime...');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.companyId]);

  const addDepartment = useCallback<DataContextType['addDepartment']>(async (input) => {
    if (!currentUser) {
      console.error('[DataContext] ❌ Intento de agregar departamento sin usuario autenticado');
      throw new Error('Usuario no autenticado');
    }

    console.log('[DataContext] 📝 Agregando departamento:', {
      name: input.name,
      companyId: currentUser.companyId,
      userId: currentUser.id,
    });

    try {
      // Verificar que tenemos una sesión activa
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('[DataContext] ❌ Error al obtener sesión:', sessionError);
        throw new Error('Error al verificar la sesión. Por favor, inicia sesión nuevamente.');
      }
      if (!session?.session) {
        console.error('[DataContext] ❌ No hay sesión activa');
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }
      console.log('[DataContext] ✓ Sesión activa verificada:', {
        userId: session.session.user.id,
        email: session.session.user.email,
      });

      // Verificar que el usuario tiene un perfil válido en la base de datos
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_id, role')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('[DataContext] ❌ Error al verificar perfil:', profileError);
        throw new Error('No se pudo verificar tu perfil. Por favor, contacta al administrador.');
      }

      if (!profile || !profile.company_id) {
        console.error('[DataContext] ❌ Perfil sin company_id');
        throw new Error('Tu perfil no tiene una empresa asignada. Por favor, contacta al administrador.');
      }

      if (profile.company_id !== currentUser.companyId) {
        console.error('[DataContext] ❌ company_id no coincide entre perfil y usuario:', {
          profile_company_id: profile.company_id,
          user_company_id: currentUser.companyId,
        });
        throw new Error('Error de seguridad: El company_id no coincide. Por favor, inicia sesión nuevamente.');
      }

      console.log('[DataContext] ✓ Perfil verificado:', {
        userId: profile.id,
        companyId: profile.company_id,
        role: profile.role,
      });

      // Insertar el departamento
      const insertData = {
        company_id: currentUser.companyId,
        condominium_id: input.condominiumId || null,
        name: input.name.trim(),
        access_code: input.accessCode?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        beds_count: input.bedsCount ?? null,
        beds: input.beds || [],
        hand_towels: input.handTowels ?? null,
        body_towels: input.bodyTowels ?? null,
        custom_fields: input.customFields || [],
      };

      console.log('[DataContext] 🔄 Insertando en Supabase:', insertData);

      const { data, error } = await supabase
        .from('departments')
        .insert(insertData)
        .select('*')
        .single<DepartmentRow>();

      if (error) {
        console.error('[DataContext] ❌ Error al insertar departamento:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      if (!data) {
        console.error('[DataContext] ❌ Insert exitoso pero no se devolvieron datos');
        throw new Error('El departamento se creó pero no se pudo recuperar. Por favor, recarga la página.');
      }

      console.log('[DataContext] ✅ Departamento insertado exitosamente:', {
        id: data.id,
        name: data.name,
        company_id: data.company_id,
        expected_company_id: currentUser.companyId,
        match: data.company_id === currentUser.companyId,
      });

      // Verificar que el company_id coincide
      if (data.company_id !== currentUser.companyId) {
        console.error('[DataContext] ❌ ERROR CRÍTICO: company_id no coincide!', {
          inserted: data.company_id,
          expected: currentUser.companyId,
        });
        toast({
          variant: 'destructive',
          title: 'Error de seguridad',
          description: 'El departamento se creó con un company_id incorrecto. Contacta al administrador.',
        });
      }

      // Verificar que el departamento se puede leer inmediatamente después de insertarlo
      console.log('[DataContext] 🔍 Verificando que el departamento se puede leer...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', data.id)
        .single<DepartmentRow>();

      if (verifyError) {
        console.error('[DataContext] ❌ Error al verificar el departamento:', {
          code: verifyError.code,
          message: verifyError.message,
          details: verifyError.details,
          hint: verifyError.hint,
        });
        console.error('[DataContext] ⚠️ Esto puede indicar un problema con las políticas RLS');
      } else if (!verifyData) {
        console.warn('[DataContext] ⚠️ No se devolvieron datos al verificar el departamento');
      } else {
        console.log('[DataContext] ✅ Departamento verificado correctamente:', {
          id: verifyData.id,
          name: verifyData.name,
          company_id: verifyData.company_id,
        });
      }

      // También verificar que podemos listar todos los departamentos de la empresa
      const { data: allDepartments, error: listError } = await supabase
        .from('departments')
        .select('id, name, company_id')
        .eq('company_id', currentUser.companyId);

      if (listError) {
        console.error('[DataContext] ❌ Error al listar departamentos después de insertar:', listError);
      } else {
        console.log('[DataContext] 📋 Total de departamentos de la empresa:', allDepartments?.length || 0);
        const found = allDepartments?.find(d => d.id === data.id);
        if (!found) {
          console.error('[DataContext] ❌ El departamento recién creado NO aparece en la lista!');
        } else {
          console.log('[DataContext] ✅ El departamento recién creado SÍ aparece en la lista');
        }
      }

      // Actualizar el estado local
      const mapped = mapDepartment(data);
      setDepartments((prev) => {
        const updated = [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name));
        console.log('[DataContext] 📊 Estado actualizado. Total de departamentos:', updated.length);
        return updated;
      });

      toast({
        title: 'Departamento agregado',
        description: `"${input.name}" fue creado correctamente.`
      });

      // Recargar los datos después de un breve delay para asegurar consistencia
      setTimeout(() => {
        console.log('[DataContext] 🔄 Recargando datos después de crear departamento...');
        void loadData();
      }, 500);

    } catch (error) {
      console.error('[DataContext] ❌ Error completo al agregar departamento:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo agregar el departamento. Verifica tu conexión e intenta nuevamente.';

      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: errorMessage,
      });
      throw error;
    }
  }, [currentUser, loadData]);

  const updateDepartment = useCallback<DataContextType['updateDepartment']>(async (dept) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const { data, error } = await supabase
        .from('departments')
        .update({
          name: dept.name,
          condominium_id: dept.condominiumId ?? null,
          access_code: dept.accessCode ?? null,
          address: dept.address ?? null,
          status: dept.status,
          assigned_to: dept.assignedTo ?? null,
          last_cleaned_at: dept.lastCleanedAt ?? null,
          notes: dept.notes ?? null,
          bedrooms: dept.bedrooms ?? null,
          bathrooms: dept.bathrooms ?? null,
          beds_count: dept.bedsCount ?? null,
          beds: dept.beds || [],
          hand_towels: dept.handTowels ?? null,
          body_towels: dept.bodyTowels ?? null,
          custom_fields: dept.customFields || [],
        })
        .eq('id', dept.id)
        .eq('company_id', currentUser.companyId)
        .select('*')
        .single<DepartmentRow>();

      if (error) {
        throw error;
      }

      const updated = mapDepartment(data);
      setDepartments((prev) => prev.map((d) => (d.id === dept.id ? updated : d)));
      toast({ title: 'Departamento actualizado', description: `"${dept.name}" fue actualizado.` });
    } catch (error) {
      console.error('Error actualizando departamento:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo actualizar el departamento.',
      });
      throw error;
    }
  }, [currentUser]);

  const deleteDepartment = useCallback<DataContextType['deleteDepartment']>(async (id) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const { data: mediaRows, error: mediaError } = await supabase
        .from('media_reports')
        .select('id, storage_path')
        .eq('company_id', currentUser.companyId)
        .eq('department_id', id);

      if (mediaError) {
        throw mediaError;
      }

      const storagePaths = (mediaRows ?? []).map((row) => row.storage_path).filter(Boolean);
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .remove(storagePaths);
        if (storageError) {
          console.warn('Error eliminando archivos de storage:', storageError);
          toast({
            variant: 'destructive',
            title: 'Error parcial',
            description: 'Algunos archivos no se pudieron eliminar del storage.',
          });
        }
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)
        .eq('company_id', currentUser.companyId);

      if (error) {
        throw error;
      }

      setDepartments((prev) => prev.filter((dept) => dept.id !== id));
      toast({ title: 'Departamento eliminado', description: 'El departamento ha sido eliminado.' });
    } catch (error) {
      console.error('Error eliminando departamento:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el departamento. Verifica que no tenga tareas asignadas.',
      });
      throw error;
    }
  }, [currentUser]);

  const addCondominium = useCallback<DataContextType['addCondominium']>(async (input) => {
    if (!currentUser) throw new Error('Usuario no autenticado');

    try {
      const { data, error } = await supabase
        .from('condominiums')
        .insert({
          company_id: currentUser.companyId,
          name: input.name.trim(),
          address: input.address?.trim() || null,
        })
        .select('*')
        .single();

      if (error) throw error;

      const newCondo: Condominium = {
        id: data.id,
        companyId: data.company_id,
        name: data.name,
        address: data.address,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setCondominiums(prev => [...prev, newCondo].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Condominio creado', description: `"${input.name}" ha sido creado.` });
    } catch (error) {
      console.error('Error creating condominium:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear',
        description: 'No se pudo crear el condominio.',
      });
      throw error;
    }
  }, [currentUser]);

  const updateCondominium = useCallback<DataContextType['updateCondominium']>(async (condo) => {
    if (!currentUser) throw new Error('Usuario no autenticado');

    try {
      const { data, error } = await supabase
        .from('condominiums')
        .update({
          name: condo.name,
          address: condo.address,
        })
        .eq('id', condo.id)
        .eq('company_id', currentUser.companyId)
        .select('*')
        .single();

      if (error) throw error;

      const updatedCondo: Condominium = {
        id: data.id,
        companyId: data.company_id,
        name: data.name,
        address: data.address,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setCondominiums(prev => prev.map(c => c.id === condo.id ? updatedCondo : c));
      toast({ title: 'Condominio actualizado', description: `"${condo.name}" ha sido actualizado.` });
    } catch (error) {
      console.error('Error updating condominium:', error);
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: 'No se pudo actualizar el condominio.',
      });
      throw error;
    }
  }, [currentUser]);

  const deleteCondominium = useCallback<DataContextType['deleteCondominium']>(async (id) => {
    if (!currentUser) throw new Error('Usuario no autenticado');

    try {
      const { error } = await supabase
        .from('condominiums')
        .delete()
        .eq('id', id)
        .eq('company_id', currentUser.companyId);

      if (error) throw error;

      setCondominiums(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Condominio eliminado', description: 'El condominio ha sido eliminado.' });
    } catch (error) {
      console.error('Error deleting condominium:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el condominio. Verifica que no tenga departamentos asociados.',
      });
      throw error;
    }
  }, [currentUser]);


  const addEmployeeWithAuth = useCallback<DataContextType['addEmployeeWithAuth']>(async (name, email, password) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Obtener el token de sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('No se pudo obtener la sesión actual. Por favor, inicia sesión nuevamente.');
      }

      // Llamar al endpoint API para crear el empleado
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Error ${response.status}: ${response.statusText}`;
        const errorDetails = errorData.details ? ` ${errorData.details}` : '';

        // Mensajes de error más amigables con detalles
        if (response.status === 409) {
          throw new Error(errorMessage + (errorDetails ? `\n${errorDetails}` : ''));
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para crear empleadas. Contacta a un administrador.');
        } else if (response.status === 400) {
          throw new Error(errorMessage + (errorDetails ? `\n${errorDetails}` : ''));
        } else {
          throw new Error((errorMessage + (errorDetails ? `\n${errorDetails}` : '')) || 'No se pudo crear la cuenta de la empleada.');
        }
      }

      const result = await response.json();

      if (!result.employee) {
        throw new Error('No se recibió la información de la empleada creada.');
      }

      const mapped = mapEmployee(result.employee as ProfileRow);
      setEmployees((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));

      toast({
        title: 'Empleada agregada',
        description: `Se creó la cuenta para "${name}". La persona ya puede iniciar sesión con su correo y contraseña.`,
      });
    } catch (error) {
      console.error('Error creando empleada:', error);
      const errorMessage = error instanceof Error ? error.message : 'No se pudo crear la cuenta.';
      toast({
        variant: 'destructive',
        title: 'Error al crear cuenta',
        description: errorMessage,
      });
      throw error;
    }
  }, [currentUser]);

  const deleteEmployee = useCallback<DataContextType['deleteEmployee']>(async (id) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // No permitir eliminar a uno mismo
    if (id === currentUser.id) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: 'No puedes eliminar tu propia cuenta.',
      });
      throw new Error('No puedes eliminar tu propia cuenta');
    }

    try {
      // Verificar que la empleada pertenece a la misma compañía
      const employee = employees.find((emp) => emp.id === id);
      if (!employee) {
        throw new Error('Empleada no encontrada');
      }

      if (employee.companyId !== currentUser.companyId) {
        throw new Error('No tienes permiso para eliminar esta empleada');
      }

      // Obtener el token de acceso actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No se pudo obtener el token de acceso');
      }

      // Llamar a la API para eliminar el usuario (esto elimina tanto auth.users como profiles)
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'No se pudo eliminar la empleada';
        console.error('[DataContext] Error de la API:', {
          status: response.status,
          error: errorData,
        });
        throw new Error(errorMessage);
      }

      // Actualizar el estado local
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      // También eliminar tareas asignadas a esta empleada
      setTasks((prev) => prev.filter((task) => task.employeeId !== id));

      toast({
        title: 'Empleada eliminada',
        description: `La cuenta de "${employee.name}" fue eliminada correctamente.`,
      });
    } catch (error) {
      console.error('Error eliminando empleada:', error);
      toast({
        variant: 'destructive',
        title: 'Error al eliminar',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la empleada.',
      });
      throw error;
    }
  }, [currentUser, employees]);

  const assignTask = useCallback<DataContextType['assignTask']>(async (departmentId, employeeProfileId, priority = 'normal') => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const department = departments.find((d) => d.id === departmentId);
    if (!department) {
      toast({ variant: 'destructive', title: 'Error de asignación', description: 'Departamento no encontrado.' });
      throw new Error('Departamento no encontrado');
    }

    const employee = employees.find((e) => e.id === employeeProfileId);
    if (!employee) {
      toast({ variant: 'destructive', title: 'Error de asignación', description: 'Empleada no encontrada.' });
      throw new Error('Empleada no encontrada');
    }

    const now = new Date().toISOString();
    const activeTask = tasks.find(
      (task) => task.departmentId === departmentId && (task.status === 'pending' || task.status === 'in_progress')
    );

    try {
      let updatedTaskRow: TaskRow | null = null;

      if (activeTask) {
        const { data, error } = await supabase
          .from('tasks')
          .update({
            employee_id: employeeProfileId,
            assigned_at: now,
            status: 'pending',
            priority: priority,
            started_at: null,
            completed_at: null,
          })
          .eq('id', activeTask.id)
          .eq('company_id', currentUser.companyId)
          .select('*')
          .single<TaskRow>();

        if (error) {
          throw error;
        }
        updatedTaskRow = data;
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            company_id: currentUser.companyId,
            department_id: departmentId,
            employee_id: employeeProfileId,
            status: 'pending',
            assigned_at: now,
            priority: priority,
          })
          .select('*')
          .single<TaskRow>();

        if (error) {
          throw error;
        }
        updatedTaskRow = data;
      }

      if (!updatedTaskRow) {
        throw new Error('No se pudo obtener la tarea actualizada.');
      }

      const { data: deptRow, error: deptError } = await supabase
        .from('departments')
        .update({
          assigned_to: employeeProfileId,
          status: 'pending',
          priority: priority,
        })
        .eq('id', departmentId)
        .eq('company_id', currentUser.companyId)
        .select('*')
        .single<DepartmentRow>();

      if (deptError) {
        throw deptError;
      }

      const updatedTask = mapTask(updatedTaskRow);
      setTasks((prev) => {
        const filtered = prev.filter((task) => task.id !== updatedTask.id);
        return [updatedTask, ...filtered].sort(
          (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        );
      });

      setDepartments((prev) => prev.map((d) => (d.id === departmentId ? mapDepartment(deptRow) : d)));

      toast({
        title: activeTask ? 'Tarea reasignada' : 'Tarea asignada',
        description: `Limpieza de ${department.name} asignada a ${employee.name}.`,
      });
    } catch (error) {
      console.error('Error asignando tarea:', error);
      toast({
        variant: 'destructive',
        title: 'Error de asignación',
        description: 'No se pudo asignar o reasignar la tarea.',
      });
      throw error;
    }
  }, [currentUser, departments, employees, tasks]);

  const toggleDepartmentPriority = useCallback<DataContextType['toggleDepartmentPriority']>(async (departmentId, currentPriority) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const newPriority = currentPriority === 'high' ? 'normal' : 'high';

    try {
      // 1. Actualizar departamento
      const { error: deptError } = await supabase
        .from('departments')
        .update({ priority: newPriority })
        .eq('id', departmentId)
        .eq('company_id', currentUser.companyId);

      if (deptError) throw deptError;

      // 2. Buscar tarea activa y actualizarla si existe
      const activeTask = tasks.find(t => t.departmentId === departmentId && t.status !== 'completed');
      if (activeTask) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ priority: newPriority })
          .eq('id', activeTask.id)
          .eq('company_id', currentUser.companyId);

        if (taskError) throw taskError;

        // Actualizar estado local de tareas
        setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? { ...t, priority: newPriority } : t)));
      }

      // 3. Actualizar estado local de departamentos
      setDepartments((prev) => prev.map((d) => (d.id === departmentId ? { ...d, priority: newPriority } : d)));

      // 4. Notificar al empleado asignado
      const currentDept = departments.find(d => d.id === departmentId);
      if (currentDept && currentDept.assignedTo) {
         const { error: notifError } = await supabase.from('notifications').insert({
           company_id: currentUser.companyId,
           user_id: currentDept.assignedTo,
           type: 'department_status_changed',
           title: newPriority === 'high' ? '¡Prioridad Alta!' : 'Prioridad Normalizada',
           message: `El departamento ${currentDept.name} ha cambiado a prioridad ${newPriority === 'high' ? 'ALTA' : 'normal'}.`,
           related_department_id: departmentId,
           read: false
         });
         
         if (notifError) {
            console.error('Error enviando notificación de prioridad:', notifError);
         }
      }

      // 5. Broadcast a todos los clientes de la misma compañía para reflejar el cambio al instante
      priorityChannelRef.current?.send({
        type: 'broadcast',
        event: 'priority_changed',
        payload: { departmentId, priority: newPriority },
      });

      toast({ 
        title: newPriority === 'high' ? 'Prioridad Alta' : 'Prioridad Normal', 
        description: `El departamento ${newPriority === 'high' ? 'ahora es prioritario' : 'ya no es prioritario'}.` 
      });
    } catch (error) {
      console.error('Error cambiando prioridad:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cambiar la prioridad.',
      });
      throw error;
    }
  }, [currentUser, tasks, departments]);

  const updateTaskStatus = useCallback<DataContextType['updateTaskStatus']>(async (taskId, newStatus) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      toast({ variant: 'destructive', title: 'Error de tarea', description: 'Tarea no encontrada.' });
      throw new Error('Tarea no encontrada');
    }

    const now = new Date().toISOString();
    const taskUpdates: Partial<TaskRow> = { status: newStatus };

    if (newStatus === 'completed') {
      taskUpdates.completed_at = now;
    } else if (newStatus === 'in_progress') {
      taskUpdates.started_at = task.startedAt ?? now;
      taskUpdates.completed_at = null;
    } else if (newStatus === 'pending') {
      taskUpdates.started_at = null;
      taskUpdates.completed_at = null;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(taskUpdates)
        .eq('id', taskId)
        .eq('company_id', currentUser.companyId)
        .select('*')
        .single<TaskRow>();

      if (error) {
        throw error;
      }

      const departmentUpdates: Partial<DepartmentRow> = { status: newStatus };
      if (newStatus === 'completed') {
        departmentUpdates.last_cleaned_at = now;
        departmentUpdates.assigned_to = null;
        departmentUpdates.priority = 'normal'; // Reset priority automatically
      } else {
        departmentUpdates.assigned_to = data.employee_id;
      }

      const { data: deptRow, error: deptError } = await supabase
        .from('departments')
        .update(departmentUpdates)
        .eq('id', data.department_id)
        .eq('company_id', currentUser.companyId)
        .select('*')
        .single<DepartmentRow>();

      if (deptError) {
        throw deptError;
      }

      setTasks((prev) => prev.map((t) => (t.id === taskId ? mapTask(data) : t)));
      setDepartments((prev) => prev.map((d) => (d.id === data.department_id ? mapDepartment(deptRow) : d)));

      // Broadcast de cambio de estado (y prioridad normal si se completó)
      priorityChannelRef.current?.send({
        type: 'broadcast',
        event: 'task_status_changed',
        payload: {
          taskId,
          departmentId: data.department_id,
          status: newStatus,
          departmentPriority: newStatus === 'completed' ? 'normal' : undefined,
        },
      });
      if (newStatus === 'completed') {
        priorityChannelRef.current?.send({
          type: 'broadcast',
          event: 'priority_changed',
          payload: { departmentId: data.department_id, priority: 'normal' },
        });
      }

      toast({ title: 'Tarea actualizada', description: `Estado cambiado a ${newStatus}.` });
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      toast({
        variant: 'destructive',
        title: 'Error de tarea',
        description: 'No se pudo actualizar el estado.',
      });
      throw error;
    }
  }, [currentUser, tasks]);

  const addMediaReport = useCallback<DataContextType['addMediaReport']>(async (
    departmentId,
    employeeProfileId,
    file,
    reportType,
    description,
    onProgress,
    taskId
  ) => {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const uniqueFileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storagePath = `companies/${currentUser.companyId}/departments/${departmentId}/media/${uniqueFileName}`;

    try {
      onProgress?.(0);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      if (!uploadData?.path) {
        throw new Error('No se pudo determinar la ruta del archivo subido.');
      }

      onProgress?.(100);
      const { data: urlData } = supabase.storage
        .from(SUPABASE_MEDIA_BUCKET)
        .getPublicUrl(uploadData.path);

      const { error } = await supabase
        .from('media_reports')
        .insert({
          company_id: currentUser.companyId,
          department_id: departmentId,
          task_id: taskId ?? null,
          employee_id: employeeProfileId,
          uploaded_by: currentUser.id,
          storage_path: uploadData.path,
          download_url: urlData?.publicUrl ?? null,
          file_name: file.name,
          content_type: file.type,
          report_type: reportType,
          description: description ?? null,
        });

      if (error) {
        throw error;
      }

      toast({ title: 'Reporte guardado', description: 'El archivo fue registrado correctamente.' });
    } catch (error) {
      console.error('Error subiendo media report:', error);
      onProgress?.(0);
      toast({
        variant: 'destructive',
        title: 'Error al subir',
        description: 'No se pudo subir el reporte.',
      });
      throw error;
    }
  }, [currentUser]);

  const getMediaReportsForDepartment = useCallback<DataContextType['getMediaReportsForDepartment']>(async (departmentId) => {
    if (!currentUser) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('media_reports')
        .select('*')
        .eq('company_id', currentUser.companyId)
        .eq('department_id', departmentId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data as MediaReportRow[]).map(mapMediaReport);
    } catch (error) {
      console.error('Error cargando media reports:', error);
      toast({
        variant: 'destructive',
        title: 'Error de carga',
        description: 'No se pudieron obtener las evidencias.',
      });
      return [];
    }
  }, [currentUser]);

  const getTasksForEmployee = useCallback<DataContextType['getTasksForEmployee']>((employeeProfileId) => {
    return tasks
      .filter((task) => task.employeeId === employeeProfileId)
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }, [tasks]);

  const getDepartmentById = useCallback<DataContextType['getDepartmentById']>((departmentId) => {
    return departments.find((dept) => dept.id === departmentId);
  }, [departments]);

  const getEmployeeProfileById = useCallback<DataContextType['getEmployeeProfileById']>((employeeProfileId) => {
    return employees.find((emp) => emp.id === employeeProfileId);
  }, [employees]);

  // Funciones para superadmin
  const getAllCompanies = useCallback<DataContextType['getAllCompanies']>(async () => {
    if (!isSuperadmin) {
      throw new Error('Solo superadmin puede acceder a todas las empresas');
    }
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, slug, legal_name, tax_id, timezone, plan_code, metadata, display_name, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as CompanyRow[]).map(mapCompany);
  }, [isSuperadmin]);

  const getAllEmployees = useCallback<DataContextType['getAllEmployees']>(async () => {
    if (!isSuperadmin) {
      throw new Error('Solo superadmin puede acceder a todos los empleados');
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data as ProfileRow[]).map(mapEmployee);
  }, [isSuperadmin]);

  const getAllTasks = useCallback<DataContextType['getAllTasks']>(async () => {
    if (!isSuperadmin) {
      throw new Error('Solo superadmin puede acceder a todas las tareas');
    }
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return (data as TaskRow[]).map(mapTask);
  }, [isSuperadmin]);

  const getAllDepartments = useCallback<DataContextType['getAllDepartments']>(async () => {
    if (!isSuperadmin) {
      throw new Error('Solo superadmin puede acceder a todos los departamentos');
    }
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data as DepartmentRow[]).map(mapDepartment);
  }, [isSuperadmin]);

  const value = useMemo<DataContextType>(() => ({
    company,
    condominiums,
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    employees,
    addEmployeeWithAuth,
    deleteEmployee,
    tasks,
    assignTask,
    updateTaskStatus,
    toggleDepartmentPriority,
    addMediaReport,
    getMediaReportsForDepartment,
    getTasksForEmployee,
    getDepartmentById,
    getEmployeeProfileById,
    dataLoading,
    allCompanies,
    getAllCompanies,
    getAllEmployees,
    getAllTasks,
    getAllDepartments,
    addCondominium,
    updateCondominium,
    deleteCondominium,
  }), [
    company, condominiums, departments, employees, tasks, dataLoading,
    addDepartment, updateDepartment, deleteDepartment,
    addEmployeeWithAuth, deleteEmployee,
    assignTask, updateTaskStatus, toggleDepartmentPriority,
    addMediaReport, getMediaReportsForDepartment,
    getTasksForEmployee, getDepartmentById, getEmployeeProfileById,
    allCompanies, getAllCompanies, getAllEmployees, getAllTasks, getAllDepartments,
    addCondominium, updateCondominium, deleteCondominium,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
}


