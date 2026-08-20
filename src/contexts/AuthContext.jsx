import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to format NIK into fake email for Firebase Auth
  const formatEmail = (nikOrEmail) => {
    if (nikOrEmail.includes('@')) {
      return nikOrEmail.trim().toLowerCase();
    }
    // Remove spaces and make lowercase, then append domain
    const cleanNik = nikOrEmail.replace(/\s+/g, '').toLowerCase();
    
    // Khusus HRD, arahkan NIK-nya ke akun master HRD
    if (cleanNik === 'dbg1703011487' || cleanNik === 'hrd') {
      return 'hrd@dbg.com';
    }
    
    return `${cleanNik}@dbg.com`;
  };

  async function login(nik, password) {
    const email = formatEmail(nik);
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return firebaseSignOut(auth);
  }

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fast-path untuk admin bawaan agar tidak terblokir permission denied Firestore
        if (user.email === 'admin@dbg.com' || user.email === 'hrd@dbg.com') {
          setUserRole('hrd');
          setCurrentUser(user);
          setLoading(false);
          return;
        }

        try {
          const docRef = doc(db, 'employees', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role || 'employee');
          } else {
            setUserRole('employee');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('employee');
        }
      } else {
        setUserRole(null);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
