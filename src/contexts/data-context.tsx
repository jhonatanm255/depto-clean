
"use client";
import type { Department, EmployeeProfile, CleaningTask, MediaReport, MediaReportType } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { db, storage } from '@/lib/firebase';
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
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './auth-context'; 

interface DataContextType {
  departments: Department[];
  addDepartment: (dept: Omit<Department, 'id' | 'status' | 'lastCleanedAt' | 'assignedTo'>) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  
  employees: EmployeeProfile[]; 
  addEmployeeWithAuth: (name: string, email: string, password: string) => Promise<void>;

  tasks: CleaningTask[];
  assignTask: (departmentId: string, employeeProfileId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: 'pending' | 'in_progress' | 'completed') => Promise<void>;
  
  addMediaReport: (
    departmentId: string, 
    employeeProfileId: string, 
    file: File, 
    reportType: MediaReportType, 
    description?: string,
    onProgress?: (progress: number) => void
  ) => Promise<void>;
  getMediaReportsForDepartment: (departmentId: string) => Promise<MediaReport[]>;

  getTasksForEmployee: (employeeProfileId: string) => CleaningTask[];
  getDepartmentById: (departmentId: string) => Department | undefined;
  getEmployeeProfileById: (employeeProfileId: string) => EmployeeProfile | undefined;
  dataLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { currentUser } = useAuth(); 

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
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las empleadas."});
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
      const batch = writeBatch(db);

      const mediaReportsQuery = query(collection(db, "media_reports"), where("departmentId", "==", id));
      const mediaReportsSnapshot = await getDocs(mediaReportsQuery);
      
      const deletePromises: Promise<void>[] = [];
      mediaReportsSnapshot.forEach((reportDoc) => {
        const reportData = reportDoc.data() as MediaReport;
        if (reportData.storagePath) {
          const storageFileRef = ref(storage, reportData.storagePath);
          deletePromises.push(deleteObject(storageFileRef).catch(err => console.warn("Error deleting file from storage, may not exist or protected:", err, reportData.storagePath)));
        }
        batch.delete(doc(db, "media_reports", reportDoc.id));
      });
      
      await Promise.all(deletePromises);

      const tasksQuery = query(collection(db, "tasks"), where("departmentId", "==", id));
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.forEach((taskDoc) => {
        batch.delete(doc(db, "tasks", taskDoc.id));
      });
      
      batch.delete(doc(db, "departments", id));
      await batch.commit();
      toast({ title: "Departamento Eliminado", description: "Departamento, tareas y reportes (Firestore y Storage) asociados eliminados." });
    } catch (error) {
      console.error("Error deleting department: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el departamento."});
      throw error; 
    }
  }, []);

  const addEmployeeWithAuth = useCallback(async (name: string, email: string, password: string) => {
    const auth = getAuth();
    const adminAuthUid = currentUser?.uid; 

    if (!adminAuthUid) {
        toast({ variant: "destructive", title: "Error de Administrador", description: "No se pudo verificar la sesión del administrador." });
        throw new Error("Admin no autenticado");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newEmployeeAuthUid = userCredential.user.uid;

      await addDoc(collection(db, "employees"), {
        authUid: newEmployeeAuthUid,
        name: name,
        email: email,
      });
      
      toast({ title: "Empleada Agregada", description: `Cuenta para "${name}" creada. El administrador deberá volver a iniciar sesión.` });
      await firebaseSignOut(auth); 

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
  }, [currentUser]);


 const assignTask = useCallback(async (departmentId: string, employeeProfileId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) {
      toast({ variant: "destructive", title: "Error", description: "Departamento no encontrado." });
      throw new Error("Departamento no encontrado");
    }
    const employee = employees.find(e => e.id === employeeProfileId);
    if (!employee) {
      toast({ variant: "destructive", title: "Error", description: "Perfil de empleada no encontrado." });
      throw new Error("Perfil de empleada no encontrado");
    }

    try {
      const batch = writeBatch(db);
      const deptRef = doc(db, "departments", departmentId);
      
      const existingTaskQuery = query(
        collection(db, "tasks"),
        where("departmentId", "==", departmentId),
        where("status", "in", ["pending", "in_progress"])
      );
      const existingTaskSnapshot = await getDocs(existingTaskQuery);

      if (!existingTaskSnapshot.empty) {
        const existingTaskDoc = existingTaskSnapshot.docs[0];
        batch.update(existingTaskDoc.ref, {
          employeeId: employeeProfileId,
          assignedAt: Timestamp.now(),
          status: 'pending', 
          completedAt: null, 
        });
        toast({ title: "Tarea Reasignada", description: `Departamento ${department.name} reasignado a ${employee.name}.` });
      } else {
        const taskRef = doc(collection(db, "tasks"));
        batch.set(taskRef, {
          departmentId,
          employeeId: employeeProfileId,
          assignedAt: Timestamp.now(),
          status: 'pending',
          completedAt: null,
        });
        toast({ title: "Tarea Asignada", description: `Departamento ${department.name} asignado a ${employee.name}.` });
      }
      
      batch.update(deptRef, {
        assignedTo: employeeProfileId,
        status: 'pending', 
        lastCleanedAt: null, 
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error assigning/reassigning task: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo asignar o reasignar la tarea." });
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
      toast({ title: "Tarea Actualizada", description: `Estado de la tarea cambiado a ${status}.` });
    } catch (error) {
      console.error("Error updating task status: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado de la tarea."});
      throw error; 
    }
  }, [tasks]);

  const addMediaReport = useCallback(async (
    departmentId: string, 
    employeeProfileId: string, 
    file: File, 
    reportType: MediaReportType, 
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<void> => {
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Error de autenticación", description: "No se pudo verificar la empleada." });
      throw new Error("Usuario no autenticado para subir archivo.");
    }
     if (!employeeProfileId) {
        toast({ variant: "destructive", title: "Error de Perfil", description: "No se pudo identificar el perfil de la empleada para el reporte." });
        throw new Error("Perfil de empleada no identificado para el reporte.");
    }

    const uploadedByAuthUid = currentUser.uid;
    const uniqueFileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storagePath = `departments/${departmentId}/media/${uniqueFileName}`;
    const fileRef = ref(storage, storagePath);
    console.log(`[DataContext] Iniciando subida para: ${storagePath}, Archivo: ${file.name}, Tamaño: ${file.size}`);

    return new Promise((resolve, reject) => {
      try {
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[DataContext] Progreso de subida: ${progress}% (${snapshot.bytesTransferred}/${snapshot.totalBytes})`);
            if (onProgress) {
              onProgress(progress);
            }
            switch (snapshot.state) {
              case 'paused':
                console.log('[DataContext] Subida pausada');
                break;
              case 'running':
                console.log('[DataContext] Subida en progreso');
                break;
            }
          },
          (error) => {
            console.error("[DataContext] Error subiendo archivo a Storage: ", error);
            let errorMessage = "No se pudo subir el archivo.";
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = "No tienes permiso para subir archivos. Verifica las reglas de Firebase Storage.";
                break;
              case 'storage/canceled':
                errorMessage = "La subida del archivo fue cancelada.";
                break;
              case 'storage/unknown':
                errorMessage = "Ocurrió un error desconocido durante la subida.";
                break;
              default:
                 errorMessage = `Error de Storage: ${error.message} (Código: ${error.code})`;
            }
            toast({ variant: "destructive", title: "Error de Subida", description: errorMessage });
            reject(error);
          },
          async () => {
            console.log(`[DataContext] Subida completada para: ${storagePath}`);
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`[DataContext] URL de descarga obtenida: ${downloadURL}`);
              await addDoc(collection(db, "media_reports"), {
                departmentId,
                employeeProfileId, // ID del perfil de Firestore
                uploadedByAuthUid,  // Auth UID del usuario logueado
                storagePath,
                downloadURL,
                fileName: file.name,
                contentType: file.type,
                reportType,
                description: description || "",
                uploadedAt: Timestamp.now(),
              });
              console.log(`[DataContext] Metadatos guardados en Firestore para: ${file.name}`);
              toast({ title: "Evidencia Subida", description: "El archivo se ha subido y registrado correctamente." });
              resolve();
            } catch (firestoreError) {
              console.error("[DataContext] Error guardando metadatos en Firestore: ", firestoreError);
              toast({ variant: "destructive", title: "Error de Registro", description: "El archivo se subió pero no se pudo registrar en la base de datos." });
              reject(firestoreError);
            }
          }
        );
      } catch (initializationError) {
          console.error("[DataContext] Error inicializando subida a Storage: ", initializationError);
          toast({ variant: "destructive", title: "Error de Configuración", description: "No se pudo iniciar la subida del archivo. Revisa la configuración de Storage." });
          reject(initializationError);
      }
    });
  }, [currentUser]);

  const getMediaReportsForDepartment = useCallback(async (departmentId: string): Promise<MediaReport[]> => {
    try {
      const q = query(
        collection(db, "media_reports"), 
        where("departmentId", "==", departmentId),
        orderBy("uploadedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
        uploadedAt: (docSnapshot.data().uploadedAt as Timestamp).toDate(),
      })) as MediaReport[];
    } catch (error) {
      console.error("Error obteniendo reportes multimedia: ", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los reportes." });
      return [];
    }
  }, []);


  const getTasksForEmployee = useCallback((employeeProfileId: string) => {
    return tasks.filter((task) => task.employeeId === employeeProfileId)
                .sort((a,b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
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
    addMediaReport,
    getMediaReportsForDepartment,
    getTasksForEmployee, 
    getDepartmentById,
    getEmployeeProfileById,
    dataLoading
  }), [
    departments, addDepartment, updateDepartment, deleteDepartment, 
    employees, addEmployeeWithAuth,
    tasks, assignTask, updateTaskStatus, 
    addMediaReport, getMediaReportsForDepartment,
    getTasksForEmployee, getDepartmentById, getEmployeeProfileById,
    dataLoading, currentUser 
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

