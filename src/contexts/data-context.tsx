
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
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  tasks: CleaningTask[];
  assignTask: (departmentId: string, employeeId: string) => void;
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => void;
  getTasksForEmployee: (employeeId: string) => CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialDepartments: Department[] = [];
const initialEmployeesData: Employee[] = []; // Renamed to avoid conflict, will be empty
const initialTasks: CleaningTask[] = [];


export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments, departmentsLoading] = useLocalStorage<Department[]>('departments_cleansweep', initialDepartments);
  const [employees, setEmployees, employeesLoading] = useLocalStorage<Employee[]>('employees_cleansweep', initialEmployeesData);
  const [tasks, setTasks, tasksLoading] = useLocalStorage<CleaningTask[]>('tasks_cleansweep', initialTasks);
  
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
    const task = tasks.find(t => t.departmentId === updatedDept.id && t.employeeId === updatedDept.assignedTo && (t.status === 'pending' || t.status === 'in_progress'));
    if (task && task.status !== updatedDept.status && (updatedDept.status === 'pending' || updatedDept.status === 'in_progress' || updatedDept.status === 'completed')) {
        updateTaskStatus(task.id, updatedDept.status);
    }
  };
  
  const deleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
    setTasks((prev) => prev.filter((task) => task.departmentId !== id));
  };

  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...empData,
      id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Added randomness to ID
    };
    setEmployees((prev) => [...prev, newEmployee]);
  };

  const assignTask = (departmentId: string, employeeId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;

    // Remove any existing pending/in_progress task for this department before assigning a new one
    const otherTasks = tasks.filter(t => !(t.departmentId === departmentId && (t.status === 'pending' || t.status === 'in_progress')));

    const newTask: CleaningTask = {
      id: `task-${Date.now()}`,
      departmentId,
      employeeId,
      assignedAt: new Date().toISOString(),
      status: 'pending',
    };
    setTasks([...otherTasks, newTask]);
    // Update department status and assignedTo
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
            ? {...d, status, lastCleanedAt: completedAt || d.lastCleanedAt, assignedTo: task.employeeId } 
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
    employees: employeesLoading ? initialEmployeesData : employees,
    addEmployee,
    tasks: tasksLoading ? initialTasks : tasks, 
    assignTask, 
    updateTaskStatus, 
    getTasksForEmployee, 
    getDepartmentById
  }), [departments, employees, tasks, departmentsLoading, employeesLoading, tasksLoading]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
}
