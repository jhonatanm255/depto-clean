
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Importar getStorage
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANTE: Reemplaza estos valores con la configuración REAL de tu proyecto Firebase.
// Puedes encontrarla en la Consola de Firebase > Configuración del Proyecto > General > Tus apps.
const firebaseConfig = {
  apiKey: "AIzaSyDerqx1CxtpuQF6SpB-fZe_v4qdPbngbv4", // CAMBIAR ESTO
  authDomain: "smartclean-9880a.firebaseapp.com", // CAMBIAR ESTO
  databaseURL: "https://smartclean-9880a-default-rtdb.firebaseio.com", // CAMBIAR ESTO (si usas RTDB)
  projectId: "smartclean-9880a", // CAMBIAR ESTO
  storageBucket: "smartclean-9880a.appspot.com", // CAMBIAR ESTO
  messagingSenderId: "584252180584", // CAMBIAR ESTO
  appId: "1:584252180584:web:b09a5499ac76aef2a053dd", // CAMBIAR ESTO
  measurementId: "G-ZYEWJ5R9VX" // CAMBIAR ESTO (opcional)
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app); // Inicializar y exportar storage

// Si quieres usar Analytics (opcional):
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);

export { db, storage }; // Exportar storage
