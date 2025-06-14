
"use client";
import type { Department, Employee, CleaningTask } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  Timestamp,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface DataContextType {
  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id' | 'status' | 'lastCleanedAt' | 'assignedTo'>) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  tasks: CleaningTask[];
  assignTask: (departmentId: string, employeeId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<void>;
  getTasksForEmployee: (employeeId: string) => CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
  dataLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Firestore Listeners
  useEffect(() => {
    setDataLoading(true);
    const unsubDepartments = onSnapshot(collection(db, "departments"), (snapshot) => {
      const deptsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        lastCleanedAt: doc.data().lastCleanedAt ? (doc.data().lastCleanedAt as Timestamp).toDate() : undefined,
      })) as Department[];
      setDepartments(deptsData);
      setDataLoading(false); // Consider a more robust multi-collection loading state
    }, (error) => {
      console.error("Error fetching departments: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los departamentos."});
      setDataLoading(false);
    });

    const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
      const empsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Employee[];
      setEmployees(empsData);
    }, (error) => {
      console.error("Error fetching employees: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los empleados."});
    });

    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        assignedAt: (doc.data().assignedAt as Timestamp).toDate(),
        completedAt: doc.data().completedAt ? (doc.data().completedAt as Timestamp).toDate() : undefined,
      })) as CleaningTask[];
      setTasks(tasksData);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
       toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las tareas."});
    });

    return () => {
      unsubDepartments();
      unsubEmployees();
      unsubTasks();
    };
  }, []);

  const addDepartment = async (deptData: Omit<Department, 'id' | 'status' | 'lastCleanedAt' | 'assignedTo'>) => {
    try {
      await addDoc(collection(db, "departments"), {
        ...deptData,
        status: 'pending',
        assignedTo: null,
        lastCleanedAt: null,
      });
      toast({ title: "Departamento Agregado", description: `"${deptData.name}" ha sido agregado.` });
    } catch (error) {
      console.error("Error adding department: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el departamento."});
    }
  };

  const updateDepartment = async (updatedDept: Department) => {
    try {
      const deptRef = doc(db, "departments", updatedDept.id);
      const { id, ...dataToUpdate } = updatedDept; // Exclude id from data
      await updateDoc(deptRef, {
        ...dataToUpdate,
        lastCleanedAt: dataToUpdate.lastCleanedAt ? Timestamp.fromDate(new Date(dataToUpdate.lastCleanedAt)) : null,
      });
      toast({ title: "Departamento Actualizado", description: `"${updatedDept.name}" ha sido actualizado.` });
    } catch (error) {
      console.error("Error updating department: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el departamento."});
    }
  };
  
  const deleteDepartment = async (id: string) => {
    try {
      // Also delete associated tasks
      const q = query(collection(db, "tasks"), where("departmentId", "==", id));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((taskDoc) => {
        batch.delete(doc(db, "tasks", taskDoc.id));
      });
      batch.delete(doc(db, "departments", id));
      await batch.commit();
      toast({ title: "Departamento Eliminado", description: "Departamento y tareas asociadas eliminados." });
    } catch (error) {
      console.error("Error deleting department: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el departamento."});
    }
  };

  const addEmployee = async (empData: Omit<Employee, 'id'>) => {
    try {
      await addDoc(collection(db, "employees"), empData);
      toast({ title: "Empleado Agregado", description: `"${empData.name}" ha sido agregado.` });
    } catch (error) {
      console.error("Error adding employee: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el empleado."});
    }
  };

  const assignTask = async (departmentId: string, employeeId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) {
      toast({ variant: "destructive", title: "Error", description: "Departamento no encontrado." });
      return;
    }

    try {
      const batch = writeBatch(db);

      // Check if there's an existing pending/in_progress task for this department and delete it.
      const existingTaskQuery = query(
        collection(db, "tasks"), 
        where("departmentId", "==", departmentId), 
        where("status", "in", ["pending", "in_progress"])
      );
      const existingTaskSnapshot = await getDocs(existingTaskQuery);
      existingTaskSnapshot.forEach(doc => batch.delete(doc.ref));
      
      const newTaskData = {
        departmentId,
        employeeId,
        assignedAt: Timestamp.now(),
        status: 'pending' as 'pending' | 'in_progress' | 'completed',
        completedAt: null,
      };
      const taskRef = doc(collection(db, "tasks")); // Auto-generate ID for new task
      batch.set(taskRef, newTaskData);

      const deptRef = doc(db, "departments", departmentId);
      batch.update(deptRef, { 
        assignedTo: employeeId, 
        status: 'pending',
        lastCleanedAt: null // Reset lastCleanedAt as it's a new assignment
      });
      
      await batch.commit();
      toast({ title: "Tarea Asignada", description: `Departamento asignado al empleado.` });
    } catch (error) {
      console.error("Error assigning task: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo asignar la tarea." });
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast({ variant: "destructive", title: "Error", description: "Tarea no encontrada." });
      return;
    }

    try {
      const batch = writeBatch(db);
      const taskRef = doc(db, "tasks", taskId);
      const completedAt = status === 'completed' ? Timestamp.now() : task.completedAt ? Timestamp.fromDate(new Date(task.completedAt)) : null;
      
      batch.update(taskRef, { status, completedAt });

      const deptRef = doc(db, "departments", task.departmentId);
      batch.update(deptRef, { 
        status, 
        lastCleanedAt: completedAt, // Keep original completedAt if not completing now
        assignedTo: task.employeeId // Ensure assignedTo remains correct
      });

      await batch.commit();
      toast({ title: "Tarea Actualizada", description: `Estado de la tarea cambiado.` });
    } catch (error) {
      console.error("Error updating task status: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado de la tarea."});
    }
  };

  const getTasksForEmployee = (employeeId: string) => {
    return tasks.filter((task) => task.employeeId === employeeId);
  };

  const getDepartmentById = (departmentId: string) => {
    return departments.find(d => d.id === departmentId);
  };
  
  const value = useMemo(() => ({
    departments, 
    addDepartment, 
    updateDepartment, 
    deleteDepartment,
    employees,
    addEmployee,
    tasks, 
    assignTask, 
    updateTaskStatus, 
    getTasksForEmployee, 
    getDepartmentById,
    dataLoading
  }), [departments, employees, tasks, dataLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // IMPORTANT: For a production app, you MUST configure Firestore Security Rules
  // to protect your data from unauthorized access.

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
}
