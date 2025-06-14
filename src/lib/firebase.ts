
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// ######################################################################
// #  IMPORTANTE: REEMPLAZA ESTO CON LA CONFIGURACIÓN REAL DE TU PROYECTO FIREBASE  #
// #  Puedes encontrarla en la consola de Firebase > Configuración del Proyecto    #
// ######################################################################
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // <-- REEMPLAZAR
  authDomain: "YOUR_AUTH_DOMAIN", // <-- REEMPLAZAR
  projectId: "YOUR_PROJECT_ID", // <-- REEMPLAZAR - ESTE ES EL QUE CAUSA EL ERROR 400
  storageBucket: "YOUR_STORAGE_BUCKET", // <-- REEMPLAZAR
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // <-- REEMPLAZAR
  appId: "YOUR_APP_ID" // <-- REEMPLAZAR
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export { db };
