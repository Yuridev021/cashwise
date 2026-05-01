import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD0O0Dgm75mx2RTEXoOiZtYOYK_QBrDw9U",
  authDomain: "cashwise-ce41b.firebaseapp.com",
  projectId: "cashwise-ce41b",
  storageBucket: "cashwise-ce41b.firebasestorage.app",
  messagingSenderId: "1093797817481",
  appId: "1:1093797817481:web:3b9dfad9cf06c00f8b6a58",
};

// Inicializa o Firebase apenas se não estiver já inicializado
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);