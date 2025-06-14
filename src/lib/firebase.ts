
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration (as provided by the user)
const firebaseConfig = {
  apiKey: "AIzaSyDerqx1CxtpuQF6SpB-fZe_v4qdPbngbv4",
  authDomain: "smartclean-9880a.firebaseapp.com",
  databaseURL: "https://smartclean-9880a-default-rtdb.firebaseio.com",
  projectId: "smartclean-9880a",
  storageBucket: "smartclean-9880a.appspot.com", // Corrected common typo: .appspot.com
  messagingSenderId: "584252180584",
  appId: "1:584252180584:web:b09a5499ac76aef2a053dd",
  measurementId: "G-ZYEWJ5R9VX"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

// If you want to use analytics, you can initialize it like this:
// import { getAnalytics } from "firebase/analytics";
// const analytics = getAnalytics(app);

export { db };
