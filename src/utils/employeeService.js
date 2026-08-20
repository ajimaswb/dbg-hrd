import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';

export const getEmployees = async () => {
  const snapshot = await getDocs(collection(db, 'employees'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const createEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(collection(db, 'employees'), employeeData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

export const updateEmployee = async (uid, employeeData) => {
  await updateDoc(doc(db, 'employees', uid), employeeData);
};

export const deleteEmployee = async (uid) => {
  // Note: This only deletes Firestore data. 
  // Deleting Firebase Auth users securely from the client is not allowed by default without Admin SDK.
  // For a full system, an Admin SDK Cloud Function should be used.
  await deleteDoc(doc(db, 'employees', uid));
};
