import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
    const userCredential = await createUserWithEmailAndPassword(auth, "admin@dbg.com", "admin123");
    const uid = userCredential.user.uid;
    await setDoc(doc(db, 'employees', uid), {
      nik: 'admin',
      name: 'Administrator HRD',
      role: 'hrd',
      department: 'HRD',
      status: 'aktif'
    });
    console.log("Admin seeded successfully.");
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      console.log("Admin email already exists. Just making sure Firestore has the role.");
      // We don't have the UID easily if we can't login, but let's try logging in
      import("firebase/auth").then(async ({ signInWithEmailAndPassword }) => {
        const cred = await signInWithEmailAndPassword(auth, "admin@dbg.com", "admin123");
        await setDoc(doc(db, 'employees', cred.user.uid), {
          nik: 'admin',
          name: 'Administrator HRD',
          role: 'hrd',
          department: 'HRD',
          status: 'aktif'
        }, { merge: true });
        console.log("Admin role updated in Firestore.");
        process.exit(0);
      });
    } else {
      console.error(e);
      process.exit(1);
    }
  }
}
seed().then(() => setTimeout(() => process.exit(0), 2000));
