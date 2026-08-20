import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs,  } from 'firebase/firestore';

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
const db = getFirestore(app);

async function checkAccess() {
    try {
        const snap = await getDocs(collection(db, 'employees'));
        console.log("Found", snap.docs.length, "employees.");
        process.exit(0);
    } catch (e) {
        console.error("Access denied:", e);
        process.exit(1);
    }
}
checkAccess();
