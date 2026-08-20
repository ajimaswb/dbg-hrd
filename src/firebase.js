import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDmJVi3FRNxNLDitypvW_XqdjFBwO83Rv0",
  authDomain: "dbg-finance.firebaseapp.com",
  projectId: "dbg-finance",
  storageBucket: "dbg-finance.firebasestorage.app",
  messagingSenderId: "520382685798",
  appId: "1:520382685798:web:98838c2323b0b75e5003a7",
  measurementId: "G-2QZ5C3EGLP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
