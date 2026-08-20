import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyDmJVi3FRNxNLDitypvW_XqdjFBwO83Rv0",
  authDomain: "dbg-finance.firebaseapp.com",
  projectId: "dbg-finance",
  storageBucket: "dbg-finance.firebasestorage.app",
  messagingSenderId: "520382685798",
  appId: "1:520382685798:web:98838c2323b0b75e5003a7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  try {
    await signInWithEmailAndPassword(auth, "admin@dbg.com", "admin123");
    console.log("Logged in as admin.");
    
    const data = JSON.parse(fs.readFileSync('public/nonstaff_data.json', 'utf8'));
    let count = 0;
    
    for (const emp of data) {
      if (!emp.nik || emp.nik.trim() === '') continue; // Skip invalid NIKs
      await setDoc(doc(db, 'employees', emp.nik), {
        nik: emp.nik,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        line: emp.line || '',
        joinDate: emp.joinDate || '',
        bankName: emp.bankName || 'Lainnya',
        bankAccount: emp.bankAccount || '',
        status: emp.status,
        components: emp.components, // Use parsed components
        createdAt: new Date().toISOString()
      }, { merge: true });
      count++;
      if (count % 50 === 0) console.log(`Seeded ${count} employees...`);
    }
    
    console.log(`Successfully seeded ${count} employees!`);
  } catch (e) {
    console.error("Error seeding employees:", e);
  }
}

seed().then(() => setTimeout(() => process.exit(0), 1000));
