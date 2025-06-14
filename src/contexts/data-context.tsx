
"use client";
import type { Department, Employee, CleaningTask } from '@/lib/types';
import useLocalStorage from '@/hooks/use-local-storage';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useMemo } from 'react';

interface DataContextType {
  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id' | 'status'>) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;
  employees: Employee[]; // For now, employees are static
  tasks: CleaningTask[];
  assignTask: (departmentId: string, employeeId: string) => void;
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => void;
  getTasksForEmployee: (employeeId: string) => CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialDepartments: Department[] = [
  { id: 'dept1', name: 'Apartment 101', accessCode: '1234', status: 'pending', assignedTo: 'emp1' },
  { id: 'dept2', name: 'Office Suite 200', accessCode: '5678', status: 'completed', lastCleanedAt: new Date().toISOString(), assignedTo: 'emp2' },
  { id: 'dept3', name: 'Condo 3B', accessCode: '9012', status: 'pending' },
];

const initialEmployees: Employee[] = [
  { id: 'emp1', name: 'Alice Smith', email: 'alice@example.com' },
  { id: 'emp2', name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 'emp001', name: 'Cleaning Staff', email: 'employee@cleansweep.com' } // Corresponds to mock employee user
];

const initialTasks: CleaningTask[] = [
    { id: 'task1', departmentId: 'dept1', employeeId: 'emp1', assignedAt: new Date().toISOString(), status: 'pending' },
];


export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useLocalStorage<Department[]>('departments', initialDepartments);
  const [tasks, setTasks] = useLocalStorage<CleaningTask[]>('tasks', initialTasks);
  const employees = initialEmployees; // Static for now

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
    // also update task if department is assigned and status changes
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

    // Remove existing task for this department if any
    const otherTasks = tasks.filter(t => t.departmentId !== departmentId);

    const newTask: CleaningTask = {
      id: `task-${Date.now()}`,
      departmentId,
      employeeId,
      assignedAt: new Date().toISOString(),
      status: 'pending',
    };
    setTasks([...otherTasks, newTask]);
    updateDepartment({ ...department, assignedTo: employeeId, status: 'pending' });
  };

  const updateTaskStatus = (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const updatedTask = { ...task, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined };
          const department = departments.find(d => d.id === task.departmentId);
          if (department) {
            // Use a new state variable for departments to trigger re-render properly
            setDepartments(prevDepts => prevDepts.map(d => d.id === task.departmentId ? {...d, status, lastCleanedAt: status === 'completed' ? new Date().toISOString() : d.lastCleanedAt} : d));
          }
          return updatedTask;
        }
        return task;
      })
    );
  };


  const getTasksForEmployee = (employeeId: string) => {
    return tasks.filter((task) => task.employeeId === employeeId);
  };

  const getDepartmentById = (departmentId: string) => {
    return departments.find(d => d.id === departmentId);
  };
  
  const value = useMemo(() => ({
    departments, addDepartment, updateDepartment, deleteDepartment,
    employees,
    tasks, assignTask, updateTaskStatus, getTasksForEmployee, getDepartmentById
  }), [departments, employees, tasks]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

