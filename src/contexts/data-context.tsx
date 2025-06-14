
"use client";
import type { Department, EmployeeProfile, CleaningTask } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
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
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './auth-context'; // Para obtener el admin actual

interface DataContextType {
  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id' | 'status' | 'lastCleanedAt' | 'assignedTo'>) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  
  employees: EmployeeProfile[]; // Ahora usamos EmployeeProfile
  // addEmployee: (emp: Omit<EmployeeProfile, 'id' | 'authUid'>) => Promise<void>; // Reemplazado
  addEmployeeWithAuth: (name: string, email: string, password: string) => Promise<void>;
  // updateEmployeeProfile: (id: string, data: Partial<Omit<EmployeeProfile, 'id' | 'authUid'>>) => Promise<void>;
  // deleteEmployeeProfile: (id: string) => Promise<void>;

  tasks: CleaningTask[];
  assignTask: (departmentId: string, employeeProfileId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<void>;
  
  getTasksForEmployee: (employeeProfileId: string) => CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
  getEmployeeProfileById: (employeeProfileId: string) => EmployeeProfile | undefined;
  dataLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]); // Usar EmployeeProfile
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { currentUser: adminUser, login: adminLogin } = useAuth(); // Para re-autenticar al admin

  useEffect(() => {
    setDataLoading(true);
    const unsubDepartments = onSnapshot(collection(db, "departments"), (snapshot) => {
      const deptsData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data(),
        lastCleanedAt: docSnapshot.data().lastCleanedAt ? (docSnapshot.data().lastCleanedAt as Timestamp).toDate() : undefined,
      })) as Department[];
      setDepartments(deptsData);
    }, (error) => {
      console.error("Error fetching departments: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los departamentos."});
    });

    const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
      const empsData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data() 
      })) as EmployeeProfile[];
      setEmployees(empsData);
    }, (error) => {
      console.error("Error fetching employees: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los empleados."});
    });

    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasksData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data(),
        assignedAt: (docSnapshot.data().assignedAt as Timestamp).toDate(),
        completedAt: docSnapshot.data().completedAt ? (docSnapshot.data().completedAt as Timestamp).toDate() : undefined,
      })) as CleaningTask[];
      setTasks(tasksData);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
       toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las tareas."});
    });
    
    Promise.all([
        getDocs(collection(db, "departments")),
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "tasks"))
    ]).then(() => {
        setDataLoading(false);
    }).catch((error) => {
        console.error("Error en carga inicial de datos:", error);
        setDataLoading(false); 
    });

    return () => {
      unsubDepartments();
      unsubEmployees();
      unsubTasks();
    };
  }, []);

  const addDepartment = useCallback(async (deptData: Omit<Department, 'id' | 'status' | 'lastCleanedAt' | 'assignedTo'>) => {
    try {
      await addDoc(collection(db, "departments"), {
        ...deptData,
        address: deptData.address || '', 
        status: 'pending',
        assignedTo: null,
        lastCleanedAt: null,
      });
      toast({ title: "Departamento Agregado", description: `"${deptData.name}" ha sido agregado.` });
    } catch (error) {
      console.error("Error adding department: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el departamento."});
      throw error; 
    }
  }, []);

  const updateDepartment = useCallback(async (updatedDept: Department) => {
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
      throw error; 
    }
  }, []);
  
  const deleteDepartment = useCallback(async (id: string) => {
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
      throw error; 
    }
  }, []);

  const addEmployeeWithAuth = useCallback(async (name: string, email: string, password: string) => {
    const auth = getAuth();
    const adminAuthUid = adminUser?.uid; // Guardar el UID del admin actual
    const adminAuthEmail = adminUser?.email;

    if (!adminAuthUid || !adminAuthEmail) {
        toast({ variant: "destructive", title: "Error de Administrador", description: "No se pudo verificar la sesión del administrador." });
        throw new Error("Admin no autenticado");
    }

    try {
      // 1. Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newEmployeeAuthUid = userCredential.user.uid;

      // 2. Crear perfil de empleado en Firestore
      await addDoc(collection(db, "employees"), {
        authUid: newEmployeeAuthUid,
        name: name,
        email: email,
      });
      
      toast({ title: "Empleada Agregada", description: `Cuenta para "${name}" creada. El administrador deberá volver a iniciar sesión.` });

      // IMPORTANTE: createUserWithEmailAndPassword loguea al nuevo usuario.
      // Necesitamos desloguearlo y volver a loguear al admin.
      // Esta es la parte "hacky" y menos ideal de hacerlo desde el cliente.
      await firebaseSignOut(auth); // Desloguea a la nueva empleada
      // Re-autenticar al administrador. Asumimos que ADMIN_PASSWORD está disponible o se maneja de otra forma.
      // Aquí, la constante ADMIN_PASSWORD solo la conoce el AuthProvider.
      // Esta es una limitación: no podemos re-loguear al admin de forma segura aquí sin su contraseña.
      // Por ahora, el admin tendrá que loguearse manualmente de nuevo.
      // await adminLogin(adminAuthEmail, "ADMIN_PASSWORD_PLACEHOLDER", 'admin', "ADMIN_PASSWORD_PLACEHOLDER");
      // La línea anterior no funcionará directamente como está.

    } catch (error: any) {
      console.error("Error adding employee with auth: ", error);
      let description = "No se pudo crear la cuenta de la empleada.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Este correo electrónico ya está en uso por otra cuenta.";
      } else if (error.code === 'auth/weak-password') {
        description = "La contraseña es demasiado débil.";
      }
      toast({ variant: "destructive", title: "Error al Crear Cuenta", description });
      throw error; 
    }
  }, [adminUser]);


  const assignTask = useCallback(async (departmentId: string, employeeProfileId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) {
      toast({ variant: "destructive", title: "Error", description: "Departamento no encontrado." });
      throw new Error("Departamento no encontrado");
    }
     const employee = employees.find(e => e.id === employeeProfileId);
    if (!employee) {
      toast({ variant: "destructive", title: "Error", description: "Perfil de empleado no encontrado." });
      throw new Error("Perfil de empleado no encontrado");
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
        employeeId: employeeProfileId, // Usar el ID del perfil de Firestore
        assignedAt: Timestamp.now(),
        status: 'pending' as 'pending' | 'in_progress' | 'completed',
        completedAt: null,
      };
      const taskRef = doc(collection(db, "tasks")); 
      batch.set(taskRef, newTaskData);

      const deptRef = doc(db, "departments", departmentId);
      batch.update(deptRef, { 
        assignedTo: employeeProfileId, 
        status: 'pending',
        lastCleanedAt: null 
      });
      
      await batch.commit();
      toast({ title: "Tarea Asignada", description: `Departamento asignado a ${employee.name}.` });
    } catch (error) {
      console.error("Error assigning task: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo asignar la tarea." });
      throw error; 
    }
  }, [departments, employees]);

  const updateTaskStatus = useCallback(async (taskId: string, status: 'pending' | 'in_progress' | 'completed') => {
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
      throw error; 
    }
  }, [tasks]);

  const getTasksForEmployee = useCallback((employeeProfileId: string) => {
    return tasks.filter((task) => task.employeeId === employeeProfileId);
  }, [tasks]);

  const getDepartmentById = useCallback((departmentId: string) => {
    return departments.find(d => d.id === departmentId);
  }, [departments]);

  const getEmployeeProfileById = useCallback((employeeProfileId: string) => {
    return employees.find(e => e.id === employeeProfileId);
  }, [employees]);
  
  const value = useMemo(() => ({
    departments, 
    addDepartment, 
    updateDepartment, 
    deleteDepartment,
    employees,
    addEmployeeWithAuth,
    tasks, 
    assignTask, 
    updateTaskStatus, 
    getTasksForEmployee, 
    getDepartmentById,
    getEmployeeProfileById,
    dataLoading
  }), [
    departments, addDepartment, updateDepartment, deleteDepartment, 
    employees, addEmployeeWithAuth,
    tasks, assignTask, updateTaskStatus, 
    getTasksForEmployee, getDepartmentById, getEmployeeProfileById,
    dataLoading
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
