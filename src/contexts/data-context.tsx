
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

  useEffect(() => {
    setDataLoading(true);
    const unsubDepartments = onSnapshot(collection(db, "departments"), (snapshot) => {
      const deptsData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data(),
        lastCleanedAt: docSnapshot.data().lastCleanedAt ? (docSnapshot.data().lastCleanedAt as Timestamp).toDate() : undefined,
      })) as Department[];
      setDepartments(deptsData);
      // Consider a more robust multi-collection loading state manager if app grows
      if (employees.length > 0 && tasks.length > 0) setDataLoading(false);
    }, (error) => {
      console.error("Error fetching departments: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los departamentos."});
      setDataLoading(false);
    });

    const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
      const empsData = snapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() })) as Employee[];
      setEmployees(empsData);
      if (departments.length > 0 && tasks.length > 0) setDataLoading(false);
    }, (error) => {
      console.error("Error fetching employees: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los empleados."});
      setDataLoading(false);
    });

    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data(),
        assignedAt: (docSnapshot.data().assignedAt as Timestamp).toDate(),
        completedAt: docSnapshot.data().completedAt ? (docSnapshot.data().completedAt as Timestamp).toDate() : undefined,
      })) as CleaningTask[];
      setTasks(tasksData);
      if (departments.length > 0 && employees.length > 0) setDataLoading(false);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
       toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las tareas."});
       setDataLoading(false);
    });
    
    // Initial loading complete check
    Promise.all([
        getDocs(collection(db, "departments")),
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "tasks"))
    ]).then(() => {
        setDataLoading(false);
    }).catch(() => {
        setDataLoading(false); // also set to false on initial fetch error
    });


    return () => {
      unsubDepartments();
      unsubEmployees();
      unsubTasks();
    };
  }, []); // department, employees, tasks removed from deps to avoid re-subscribing

  const addDepartment = async (deptData: Omit<Department, 'id' | 'status' | 'lastCleanedAt' | 'assignedTo'>) => {
    try {
      await addDoc(collection(db, "departments"), {
        ...deptData,
        address: deptData.address || '', // Ensure address is at least an empty string
        status: 'pending',
        assignedTo: null,
        lastCleanedAt: null,
      });
      toast({ title: "Departamento Agregado", description: `"${deptData.name}" ha sido agregado.` });
    } catch (error) {
      console.error("Error adding department: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el departamento."});
      throw error; // Re-throw error for react-hook-form
    }
  };

  const updateDepartment = async (updatedDept: Department) => {
    try {
      const deptRef = doc(db, "departments", updatedDept.id);
      const { id, ...dataToUpdate } = updatedDept; 
      await updateDoc(deptRef, {
        ...dataToUpdate,
        address: dataToUpdate.address || '',
        lastCleanedAt: dataToUpdate.lastCleanedAt ? Timestamp.fromDate(new Date(dataToUpdate.lastCleanedAt)) : null,
      });
      toast({ title: "Departamento Actualizado", description: `"${updatedDept.name}" ha sido actualizado.` });
    } catch (error) {
      console.error("Error updating department: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el departamento."});
      throw error; // Re-throw error
    }
  };
  
  const deleteDepartment = async (id: string) => {
    try {
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
      throw error; // Re-throw error
    }
  };

  const addEmployee = async (empData: Omit<Employee, 'id'>) => {
    try {
      await addDoc(collection(db, "employees"), empData);
      toast({ title: "Empleado Agregado", description: `"${empData.name}" ha sido agregado.` });
    } catch (error) {
      console.error("Error adding employee: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el empleado."});
      throw error; // Re-throw error
    }
  };

  const assignTask = async (departmentId: string, employeeId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) {
      toast({ variant: "destructive", title: "Error", description: "Departamento no encontrado." });
      throw new Error("Departamento no encontrado");
    }

    try {
      const batch = writeBatch(db);
      const existingTaskQuery = query(
        collection(db, "tasks"), 
        where("departmentId", "==", departmentId), 
        where("status", "in", ["pending", "in_progress"])
      );
      const existingTaskSnapshot = await getDocs(existingTaskQuery);
      existingTaskSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
      
      const newTaskData = {
        departmentId,
        employeeId,
        assignedAt: Timestamp.now(),
        status: 'pending' as 'pending' | 'in_progress' | 'completed',
        completedAt: null,
      };
      const taskRef = doc(collection(db, "tasks")); 
      batch.set(taskRef, newTaskData);

      const deptRef = doc(db, "departments", departmentId);
      batch.update(deptRef, { 
        assignedTo: employeeId, 
        status: 'pending',
        lastCleanedAt: null 
      });
      
      await batch.commit();
      toast({ title: "Tarea Asignada", description: `Departamento asignado al empleado.` });
    } catch (error) {
      console.error("Error assigning task: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo asignar la tarea." });
      throw error; // Re-throw error
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast({ variant: "destructive", title: "Error", description: "Tarea no encontrada." });
      throw new Error("Tarea no encontrada");
    }

    try {
      const batch = writeBatch(db);
      const taskRef = doc(db, "tasks", taskId);
      const newCompletedAtTimestamp = status === 'completed' ? Timestamp.now() : task.completedAt ? Timestamp.fromDate(new Date(task.completedAt)) : null;
      
      batch.update(taskRef, { status, completedAt: newCompletedAtTimestamp });

      const deptRef = doc(db, "departments", task.departmentId);
      batch.update(deptRef, { 
        status, 
        lastCleanedAt: newCompletedAtTimestamp,
        assignedTo: task.employeeId 
      });

      await batch.commit();
      toast({ title: "Tarea Actualizada", description: `Estado de la tarea cambiado.` });
    } catch (error) {
      console.error("Error updating task status: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado de la tarea."});
      throw error; // Re-throw error
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


  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
}
