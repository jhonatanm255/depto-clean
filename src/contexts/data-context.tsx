
"use client";
import type { Department, EmployeeProfile, CleaningTask, MediaReport, MediaReportType } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { supabase, SUPABASE_MEDIA_BUCKET } from '@/lib/supabase';
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
import { getAuth, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './auth-context'; 
import type { UploadFileResponse } from '@supabase/storage-js';


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
    onProgress?: (percentage: number) => void
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
    const unsubDepartments = onSnapshot(query(collection(db, "departments"), orderBy("name")), (snapshot) => {
      const deptsData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data(),
        lastCleanedAt: docSnapshot.data().lastCleanedAt ? (docSnapshot.data().lastCleanedAt as Timestamp).toDate() : undefined,
      })) as Department[];
      setDepartments(deptsData);
    }, (error) => {
      console.error("Error fetching departments: ", error);
      toast({ variant: "destructive", title: "Error de Datos", description: "No se pudieron cargar los departamentos."});
    });

    const unsubEmployees = onSnapshot(query(collection(db, "employees"), orderBy("name")), (snapshot) => {
      const empsData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data() 
      })) as EmployeeProfile[];
      setEmployees(empsData);
    }, (error) => {
      console.error("Error fetching employees: ", error);
      toast({ variant: "destructive", title: "Error de Datos", description: "No se pudieron cargar las empleadas."});
    });

    const unsubTasks = onSnapshot(query(collection(db, "tasks"), orderBy("assignedAt", "desc")), (snapshot) => {
      const tasksData = snapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data(),
        assignedAt: (docSnapshot.data().assignedAt as Timestamp).toDate(),
        completedAt: docSnapshot.data().completedAt ? (docSnapshot.data().completedAt as Timestamp).toDate() : undefined,
      })) as CleaningTask[];
      setTasks(tasksData);
    }, (error) => {
      console.error("Error fetching tasks: ", error);
       toast({ variant: "destructive", title: "Error de Datos", description: "No se pudieron cargar las tareas."});
    });
    
    Promise.all([
        getDocs(collection(db, "departments")),
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "tasks"))
    ]).then(() => {
        setDataLoading(false);
    }).catch((error) => {
        console.error("Error en carga inicial de datos (Promise.all):", error);
        setDataLoading(false); 
    });

    return () => {
      unsubDepartments();
      unsubEmployees();
      unsubTasks();
    };
  }, []);

  // --- Department Operations ---
  const addDepartment = useCallback(async (deptData: Omit<Department, 'id' | 'status' | 'lastCleanedAt' | 'assignedTo'>) => {
    try {
      await addDoc(collection(db, "departments"), {
        ...deptData,
        address: deptData.address || '', 
        status: 'pending', // Departamentos nuevos necesitan limpieza
        assignedTo: null,
        lastCleanedAt: null,
      });
      toast({ title: "Departamento Agregado", description: `"${deptData.name}" ha sido agregado.` });
    } catch (error) {
      console.error("Error adding department: ", error);
      toast({ variant: "destructive", title: "Error al Guardar", description: "No se pudo agregar el departamento."});
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
      toast({ variant: "destructive", title: "Error al Guardar", description: "No se pudo actualizar el departamento."});
      throw error; 
    }
  }, []);
  
  const deleteDepartment = useCallback(async (id: string) => {
    try {
      const batch = writeBatch(db);

      const mediaReportsQuery = query(collection(db, "media_reports"), where("departmentId", "==", id));
      const mediaReportsSnapshot = await getDocs(mediaReportsQuery);
      
      const supabaseDeletePaths: string[] = [];
      mediaReportsSnapshot.forEach((reportDoc) => {
        const reportData = reportDoc.data() as MediaReport;
        if (reportData.storagePath) {
          supabaseDeletePaths.push(reportData.storagePath);
        }
        batch.delete(doc(db, "media_reports", reportDoc.id));
      });
      
      if (supabaseDeletePaths.length > 0) {
        const { error: supabaseError } = await supabase.storage.from(SUPABASE_MEDIA_BUCKET).remove(supabaseDeletePaths);
        if (supabaseError) {
          console.warn("Error deleting files from Supabase storage:", supabaseError.message, "Paths:", supabaseDeletePaths);
          toast({ variant: "destructive", title: "Error Parcial", description: "Algunos archivos en Supabase no se pudieron eliminar. Revise la consola." });
        }
      }

      const tasksQuery = query(collection(db, "tasks"), where("departmentId", "==", id));
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.forEach((taskDoc) => {
        batch.delete(doc(db, "tasks", taskDoc.id));
      });
      
      batch.delete(doc(db, "departments", id));
      await batch.commit();
      toast({ title: "Departamento Eliminado", description: "Departamento, tareas y reportes (Firestore y Supabase Storage) asociados eliminados." });
    } catch (error) {
      console.error("Error deleting department: ", error);
      toast({ variant: "destructive", title: "Error al Eliminar", description: "No se pudo eliminar el departamento. Revise la consola."});
      throw error; 
    }
  }, []);

  // --- Employee Operations ---
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

  // --- Task Operations ---
  const assignTask = useCallback(async (departmentId: string, employeeProfileId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) {
      toast({ variant: "destructive", title: "Error de Asignación", description: "Departamento no encontrado." });
      throw new Error("Departamento no encontrado");
    }
    const employee = employees.find(e => e.id === employeeProfileId);
    if (!employee) {
      toast({ variant: "destructive", title: "Error de Asignación", description: "Perfil de empleada no encontrado." });
      throw new Error("Perfil de empleada no encontrado");
    }

    try {
      const batch = writeBatch(db);
      const deptRef = doc(db, "departments", departmentId);
      
      // Buscar una tarea existente para este departamento que NO esté completada
      const existingTaskQuery = query(
        collection(db, "tasks"),
        where("departmentId", "==", departmentId),
        where("status", "in", ["pending", "in_progress"])
      );
      const existingTaskSnapshot = await getDocs(existingTaskQuery);

      if (!existingTaskSnapshot.empty) {
        // Hay una tarea activa, la reasignamos
        const existingTaskDoc = existingTaskSnapshot.docs[0];
        batch.update(existingTaskDoc.ref, {
          employeeId: employeeProfileId,
          assignedAt: Timestamp.now(),
          status: 'pending', // Al reasignar, vuelve a pendiente si no estaba ya así
          completedAt: null, 
        });
        batch.update(deptRef, {
          assignedTo: employeeProfileId,
          status: 'pending', // El departamento tiene una tarea activa pendiente
        });
        toast({ title: "Tarea Reasignada", description: `Limpieza de ${department.name} reasignada a ${employee.name}.` });
      } else {
        // No hay tarea activa o la anterior se completó, creamos una nueva
        const taskRef = doc(collection(db, "tasks"));
        batch.set(taskRef, {
          departmentId,
          employeeId: employeeProfileId,
          assignedAt: Timestamp.now(),
          status: 'pending',
          completedAt: null,
        });
        batch.update(deptRef, {
          assignedTo: employeeProfileId,
          status: 'pending', // El departamento ahora necesita limpieza (tiene una nueva tarea pendiente)
        });
        toast({ title: "Tarea Asignada", description: `Limpieza de ${department.name} asignada a ${employee.name}.` });
      }
      
      await batch.commit();
    } catch (error) {
      console.error("Error assigning/reassigning task: ", error);
      toast({ variant: "destructive", title: "Error de Asignación", description: "No se pudo asignar o reasignar la tarea." });
      throw error;
    }
  }, [departments, employees]);

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      toast({ variant: "destructive", title: "Error de Tarea", description: "Tarea no encontrada." });
      throw new Error("Tarea no encontrada");
    }

    try {
      const batch = writeBatch(db);
      const taskRef = doc(db, "tasks", taskId);
      const deptRef = doc(db, "departments", task.departmentId);

      const taskUpdates: Partial<CleaningTask> = { status: newStatus };
      const departmentUpdates: Partial<Department> = { status: newStatus };

      if (newStatus === 'completed') {
        taskUpdates.completedAt = Timestamp.now();
        departmentUpdates.lastCleanedAt = Timestamp.now();
        departmentUpdates.assignedTo = null; // Departamento queda sin asignación activa
      } else if (newStatus === 'in_progress') {
         // Asegurarse que assignedTo esté correcto en el departamento
        departmentUpdates.assignedTo = task.employeeId;
      } else if (newStatus === 'pending') {
        // Si se vuelve a poner pendiente (ej. admin lo revierte), asegurarse que assignedTo esté correcto
        departmentUpdates.assignedTo = task.employeeId;
      }
      
      batch.update(taskRef, taskUpdates);
      batch.update(deptRef, departmentUpdates);

      await batch.commit();
      toast({ title: "Tarea Actualizada", description: `Estado de la tarea cambiado a ${newStatus}.` });
    } catch (error) {
      console.error("Error updating task status: ", error);
      toast({ variant: "destructive", title: "Error de Tarea", description: "No se pudo actualizar el estado de la tarea."});
      throw error; 
    }
  }, [tasks]);

  // --- Media Report Operations ---
  const addMediaReport = useCallback(async (
    departmentId: string, 
    employeeProfileId: string, 
    file: File, 
    reportType: MediaReportType, 
    description?: string,
    onProgress?: (percentage: number) => void // Callback para el progreso
  ): Promise<void> => {

    return new Promise(async (resolve, reject) => {
      if (!currentUser?.uid) {
        toast({ variant: "destructive", title: "Error de autenticación", description: "No se pudo verificar la empleada." });
        reject(new Error("Usuario no autenticado para subir archivo."));
        return;
      }
      if (!employeeProfileId) {
          toast({ variant: "destructive", title: "Error de Perfil", description: "No se pudo identificar el perfil de la empleada para el reporte." });
          reject(new Error("Perfil de empleada no identificado para el reporte."));
          return;
      }

      const uploadedByAuthUid = currentUser.uid;
      const uniqueFileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const supabasePath = `departments/${departmentId}/media/${uniqueFileName}`;
      
      console.log(`[DataContext] Iniciando subida a Supabase para: ${supabasePath}, Archivo: ${file.name}, Tamaño: ${file.size}`);
      if(onProgress) onProgress(0);

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .upload(supabasePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        // Supabase no tiene un onProgress nativo como Firebase en esta API básica de upload.
        // Si se necesitara progreso detallado, se usaría .createSignedUploadUrl y XHR/Fetch manual.
        // Por ahora, simularemos un progreso al 100% al finalizar la llamada de upload.
        // O podríamos usar onProgress(50) antes y onProgress(100) después si uploadData es exitoso.
        // Para MVP, vamos a asumir que si no hay error, es 100%.

        if (uploadError) {
          console.error("[DataContext] Error subiendo archivo a Supabase Storage: ", uploadError);
          toast({ variant: "destructive", title: "Error de Subida (Supabase)", description: `Detalle: ${uploadError.message}` });
          if(onProgress) onProgress(0); // Reset progress on error
          reject(uploadError);
          return;
        }

        if (!uploadData) {
          console.error("[DataContext] No se recibieron datos de la subida a Supabase.");
          toast({ variant: "destructive", title: "Error de Subida (Supabase)", description: "No se completó la subida del archivo."});
          if(onProgress) onProgress(0);
          reject(new Error("Supabase upload failed to return data."));
          return;
        }
        
        console.log(`[DataContext] Subida a Supabase completada para: ${uploadData.path}`);
        if(onProgress) onProgress(100);


        const { data: urlData } = supabase.storage
          .from(SUPABASE_MEDIA_BUCKET)
          .getPublicUrl(uploadData.path);

        if (!urlData || !urlData.publicUrl) {
            console.error("[DataContext] No se pudo obtener la URL pública de Supabase para:", uploadData.path);
            toast({ variant: "destructive", title: "Error de URL", description: "No se pudo obtener la URL pública del archivo subido." });
            reject(new Error("Failed to get public URL from Supabase."));
            return;
        }
        const publicUrl = urlData.publicUrl;
        console.log(`[DataContext] URL pública de Supabase obtenida: ${publicUrl}`);

        await addDoc(collection(db, "media_reports"), {
          departmentId,
          employeeProfileId, 
          uploadedByAuthUid,  
          storagePath: uploadData.path,
          downloadURL: publicUrl, 
          fileName: file.name,
          contentType: file.type,
          reportType,
          description: description || "",
          uploadedAt: Timestamp.now(),
        });
        console.log(`[DataContext] Metadatos guardados en Firestore para: ${file.name}`);
        toast({ title: "Evidencia Subida", description: "El archivo se ha subido y registrado correctamente." });
        resolve();
        
      } catch (error) {
        console.error("[DataContext] Error en addMediaReport (catch general): ", error);
        if(onProgress) onProgress(0);
        if (!(error instanceof Error && (error.message.includes("Supabase") || error.message.includes("URL pública") || error.message.includes("autenticado") || error.message.includes("Perfil")))) {
           toast({ variant: "destructive", title: "Error Inesperado", description: "Ocurrió un error al subir la evidencia."});
        }
        reject(error);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // currentUser es la dependencia correcta aquí

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
      console.error(`Error obteniendo reportes multimedia para departmentId ${departmentId}: `, error);
      toast({ variant: "destructive", title: "Error de Carga", description: "No se pudieron cargar los reportes multimedia. Verifica los índices de Firestore si el error persiste." });
      return [];
    }
  }, []);

  // --- Getter Functions ---
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

