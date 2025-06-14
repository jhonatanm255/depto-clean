
"use client";
import type { Department, Employee, CleaningTask } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';

interface DataContextType {
  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id' | 'status'>) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;
  employees: Employee[];
  tasks: CleaningTask[];
  assignTask: (departmentId: string, employeeId: string) => void;
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => void;
  getTasksForEmployee: (employeeId: string) => CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialDepartments: Department[] = [
  { id: 'dept1', name: 'Apartamento 101', accessCode: '1234', status: 'pending', assignedTo: 'emp001' },
  { id: 'dept2', name: 'Oficina 200', accessCode: '5678', status: 'completed', lastCleanedAt: new Date(Date.now() - 86400000 * 2).toISOString(), assignedTo: 'emp2' },
  { id: 'dept3', name: 'Condominio 3B', accessCode: '9012', status: 'pending' },
  { id: 'dept4', name: 'Local Comercial 5', accessCode: '4321', status: 'in_progress', assignedTo: 'emp001' },
];

const initialEmployees: Employee[] = [
  { id: 'emp1', name: 'Ana Silva', email: 'ana.silva@example.com' },
  { id: 'emp2', name: 'Carlos Ponce', email: 'carlos.ponce@example.com' },
  { id: 'emp001', name: 'Personal Limpieza', email: 'employee@cleansweep.com' } 
];

const initialTasks: CleaningTask[] = [
    { id: 'task1', departmentId: 'dept1', employeeId: 'emp001', assignedAt: new Date(Date.now() - 86400000).toISOString(), status: 'pending' },
    { id: 'task2', departmentId: 'dept4', employeeId: 'emp001', assignedAt: new Date().toISOString(), status: 'in_progress' },
    { id: 'task3', departmentId: 'dept2', employeeId: 'emp2', assignedAt: new Date(Date.now() - 86400000 * 3).toISOString(), status: 'completed', completedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];


export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments, departmentsLoading] = useLocalStorage<Department[]>('departments_cleansweep', initialDepartments);
  const [tasks, setTasks, tasksLoading] = useLocalStorage<CleaningTask[]>('tasks_cleansweep', initialTasks);
  const employees = initialEmployees; 

  const addDepartment = (deptData: Omit<Department, 'id' | 'status'>) => {
    const newDepartment: Department = {
      ...deptData,
      id: `dept-${Date.now()}`,
      status: 'pending',
    };
    setDepartments((prev) => [...prev, newDepartment]);
  };

  const updateDepartment = (updatedDept: Department) => {
    setDepartments((prev) =>
      prev.map((dept) => (dept.id === updatedDept.id ? updatedDept : dept))
    );
    const task = tasks.find(t => t.departmentId === updatedDept.id && t.employeeId === updatedDept.assignedTo);
    if (task && task.status !== updatedDept.status) {
        updateTaskStatus(task.id, updatedDept.status);
    }
  };
  
  const deleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
    setTasks((prev) => prev.filter((task) => task.departmentId !== id));
  };

  const assignTask = (departmentId: string, employeeId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;

    const otherTasks = tasks.filter(t => t.departmentId !== departmentId || (t.status !== 'pending' && t.status !== 'in_progress'));

    const newTask: CleaningTask = {
      id: `task-${Date.now()}`,
      departmentId,
      employeeId,
      assignedAt: new Date().toISOString(),
      status: 'pending',
    };
    setTasks([...otherTasks, newTask]);
    updateDepartment({ ...department, assignedTo: employeeId, status: 'pending', lastCleanedAt: undefined });
  };

  const updateTaskStatus = (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
          const updatedTask = { ...task, status, completedAt };
          
          setDepartments(prevDepts => prevDepts.map(d => 
            d.id === task.departmentId 
            ? {...d, status, lastCleanedAt: completedAt || d.lastCleanedAt } 
            : d
          ));
          return updatedTask;
        }
        return task;
      })
    );
  };

  const getTasksForEmployee = (employeeId: string) => {
    if (tasksLoading) return [];
    return tasks.filter((task) => task.employeeId === employeeId);
  };

  const getDepartmentById = (departmentId: string) => {
    if (departmentsLoading) return undefined;
    return departments.find(d => d.id === departmentId);
  };
  
  const value = useMemo(() => ({
    departments: departmentsLoading ? initialDepartments : departments, 
    addDepartment, 
    updateDepartment, 
    deleteDepartment,
    employees,
    tasks: tasksLoading ? initialTasks : tasks, 
    assignTask, 
    updateTaskStatus, 
    getTasksForEmployee, 
    getDepartmentById
  }), [departments, employees, tasks, departmentsLoading, tasksLoading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
}
