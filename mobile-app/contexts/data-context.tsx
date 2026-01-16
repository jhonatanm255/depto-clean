import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth-context';
import { Company, Department, EmployeeProfile, CleaningTask, MediaReport, MediaReportType, TaskStatus, AppUser } from '../lib/types';
import { Alert, Platform } from 'react-native';

const API_PORT = '9002'; // Web app port
// Helper to get API URL based on platform
const getApiUrl = (endpoint: string) => {
    // Replace with your production URL if deployed
    const baseUrl = Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`;
    return `${baseUrl}${endpoint}`;
};

interface DataContextType {
    company: Company | null;
    departments: Department[];
    addDepartment: (input: {
        name: string;
        accessCode?: string | null;
        address?: string | null;
        notes?: string | null;
        bedrooms?: number | null;
        bathrooms?: number | null;
        beds?: Department['beds'];
    }) => Promise<void>;
    updateDepartment: (dept: Department) => Promise<void>;
    deleteDepartment: (id: string) => Promise<void>;

    employees: EmployeeProfile[];
    addEmployeeWithAuth: (name: string, email: string, password: string) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;

    tasks: CleaningTask[];
    assignTask: (departmentId: string, employeeProfileId: string) => Promise<void>;
    updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;

    getTasksForEmployee: (employeeProfileId: string) => CleaningTask[];
    getDepartmentById: (departmentId: string) => Department | undefined;
    getEmployeeProfileById: (employeeProfileId: string) => EmployeeProfile | undefined;

    dataLoading: boolean;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mappers to ensure Typescript safety
const mapDepartment = (row: any): Department => ({
    id: row.id,
    companyId: row.company_id,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const mapEmployee = (row: any): EmployeeProfile => ({
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

const mapTask = (row: any): CleaningTask => ({
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
    const [tasks, setTasks] = useState<CleaningTask[]>([]);
    const [dataLoading, setDataLoading] = useState<boolean>(false); // Start false, Auth triggers load

    const loadData = useCallback(async () => {
        if (!currentUser || !currentUser.companyId) {
            // If superadmin or not fully loaded, maybe don't load or load global?
            // For mobile, we assume mostly single company usage for now.
            return;
        }

        console.log('[DataContext] Loading data for company:', currentUser.companyId);
        setDataLoading(true);
        try {
            const [companyResp, departmentsResp, employeesResp, tasksResp] = await Promise.all([
                supabase.from('companies').select('*').eq('id', currentUser.companyId).maybeSingle(),
                supabase.from('departments').select('*').eq('company_id', currentUser.companyId).order('name', { ascending: true }),
                supabase.from('profiles').select('*').eq('company_id', currentUser.companyId).neq('role', 'owner').order('full_name', { ascending: true }),
                supabase.from('tasks').select('*').eq('company_id', currentUser.companyId).order('assigned_at', { ascending: false }),
            ]);

            if (companyResp.data) {
                // Approximate mapping for company
                const c = companyResp.data;
                setCompany({
                    id: c.id,
                    name: c.name,
                    displayName: c.display_name ?? c.name,
                    slug: c.slug,
                    planCode: c.plan_code,
                    createdAt: c.created_at,
                    updatedAt: c.updated_at
                });
            }

            if (departmentsResp.data) setDepartments(departmentsResp.data.map(mapDepartment));
            if (employeesResp.data) setEmployees(employeesResp.data.map(mapEmployee));
            if (tasksResp.data) setTasks(tasksResp.data.map(mapTask));

        } catch (error) {
            console.error('[DataContext] Error loading data:', error);
            Alert.alert("Error", "No se pudieron cargar los datos.");
        } finally {
            setDataLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            loadData();
        } else {
            setDepartments([]);
            setEmployees([]);
            setTasks([]);
            setCompany(null);
        }
    }, [currentUser, loadData]);

    const addDepartment = useCallback(async (input: {
        name: string;
        accessCode?: string | null;
        address?: string | null;
        notes?: string | null;
        bedrooms?: number | null;
        bathrooms?: number | null;
        beds?: Department['beds'];
    }) => {
        if (!currentUser?.companyId) return;

        try {
            const { data, error } = await supabase
                .from('departments')
                .insert({
                    company_id: currentUser.companyId,
                    name: input.name,
                    access_code: input.accessCode || null,
                    address: input.address || null,
                    notes: input.notes || null,
                    bedrooms: input.bedrooms ?? null,
                    bathrooms: input.bathrooms ?? null,
                    beds: input.beds || [],
                    beds_count: (input.beds || []).reduce((acc, b) => acc + (b.quantity || 0), 0),
                    status: 'pending' // Default status
                })
                .select()
                .single();

            if (error) throw error;
            setDepartments(prev => [...prev, mapDepartment(data)].sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error: any) {
            console.error("Error adding department:", error);
            throw error;
        }
    }, [currentUser]);

    const updateDepartment = useCallback(async (dept: Department) => {
        try {
            const { data, error } = await supabase
                .from('departments')
                .update({
                    name: dept.name,
                    access_code: dept.accessCode,
                    address: dept.address,
                    notes: dept.notes,
                    status: dept.status,
                    assigned_to: dept.assignedTo
                })
                .eq('id', dept.id)
                .select()
                .single();

            if (error) throw error;

            const updated = mapDepartment(data);
            setDepartments(prev => prev.map(d => d.id === dept.id ? updated : d));
        } catch (error) {
            console.error("Error updating department:", error);
            throw error;
        }
    }, []);

    const deleteDepartment = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('departments').delete().eq('id', id);
            if (error) throw error;
            setDepartments(prev => prev.filter(d => d.id !== id));
            // Also cleanup local tasks state if needed
        } catch (error) {
            console.error("Error deleting department", error);
            throw error;
        }
    }, []);

    const addEmployeeWithAuth = useCallback(async (name: string, email: string, password: string) => {
        if (!currentUser) throw new Error("No user");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error("No session");

            const response = await fetch(getApiUrl('/api/employees'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Error creating employee');
            }

            if (result.employee) {
                const newEmp = mapEmployee(result.employee);
                setEmployees(prev => [...prev, newEmp].sort((a, b) => a.name.localeCompare(b.name)));
            }

        } catch (error) {
            console.error("Error creating employee:", error);
            throw error;
        }
    }, [currentUser]);

    const deleteEmployee = useCallback(async (id: string) => {
        // This usually requires admin API call if we want to delete Auth user too?
        // For now, just delete profile? No, that leaves auth orphan. 
        // Web probably forbids deletion or handles it via API.
        // Let's implement basic profile delete for now, but warn.
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            setEmployees(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error("Error deleting employee:", error);
            throw error;
        }
    }, []);

    const assignTask = useCallback(async (departmentId: string, employeeId: string) => {
        if (!currentUser?.companyId) return;
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    company_id: currentUser.companyId,
                    department_id: departmentId,
                    employee_id: employeeId,
                    status: 'pending',
                    assigned_by: currentUser.id,
                    assigned_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Update department status
            await supabase
                .from('departments')
                .update({ status: 'pending', assigned_to: employeeId })
                .eq('id', departmentId);

            setTasks(prev => [mapTask(data), ...prev]);

            // Optimistic update for department list
            setDepartments(prev => prev.map(d => d.id === departmentId ? { ...d, status: 'pending', assignedTo: employeeId } : d));

        } catch (error) {
            console.error("Error assigning task:", error);
            throw error;
        }
    }, [currentUser]);

    const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
        try {
            const updates: any = { status };
            if (status === 'in_progress') updates.started_at = new Date().toISOString();
            if (status === 'completed') updates.completed_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('tasks')
                .update(updates)
                .eq('id', taskId)
                .select()
                .single();

            if (error) throw error;

            const updatedTask = mapTask(data);
            setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

            // Also update department status if completed?
            if (status === 'completed' && updatedTask.departmentId) {
                await supabase
                    .from('departments')
                    .update({ status: 'completed', assigned_to: null, last_cleaned_at: new Date().toISOString() })
                    .eq('id', updatedTask.departmentId);

                setDepartments(prev => prev.map(d => d.id === updatedTask.departmentId ? { ...d, status: 'completed', assignedTo: null, lastCleanedAt: new Date().toISOString() } : d));
            } else if (status === 'in_progress' && updatedTask.departmentId) {
                await supabase.from('departments').update({ status: 'in_progress' }).eq('id', updatedTask.departmentId);
                setDepartments(prev => prev.map(d => d.id === updatedTask.departmentId ? { ...d, status: 'in_progress' } : d));
            }

        } catch (error) {
            console.error("Error updating task:", error);
            throw error;
        }
    }, []);

    const getTasksForEmployee = useCallback((employeeId: string) => {
        return tasks.filter(t => t.employeeId === employeeId);
    }, [tasks]);

    const getDepartmentById = useCallback((id: string) => departments.find(d => d.id === id), [departments]);
    const getEmployeeProfileById = useCallback((id: string) => employees.find(e => e.id === id), [employees]);

    return (
        <DataContext.Provider value={{
            company,
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
            getTasksForEmployee,
            getDepartmentById,
            getEmployeeProfileById,
            dataLoading,
            refreshData: loadData
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData debe usarse dentro de un DataProvider');
    }
    return context;
}
