import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

// attendance collection structure:
// id: YYYY-MM-DD_employeeId
// date: 'YYYY-MM-DD'
// employeeId: string
// status: 'sakit' | 'izin' | 'alfa' | 'cuti' | 'hadir'
// ot_hours: number (jam lembur)
// notes: string

export const saveAttendance = async (date, employeeId, data) => {
  const docId = `${date}_${employeeId}`;
  const docRef = doc(db, 'attendance', docId);
  
  await setDoc(docRef, {
    date,
    employeeId,
    ...data
  }, { merge: true });
};

export const getAttendanceByDate = async (date) => {
  const q = query(collection(db, 'attendance'), where('date', '==', date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAttendanceByMonth = async (yearMonth) => {
  // yearMonth format: 'YYYY-MM'
  // Since we don't have a specific month field, we'll fetch all and filter client side for simplicity
  // For production with large data, it's better to store a 'month' field like 'YYYY-MM' and query it.
  const snapshot = await getDocs(collection(db, 'attendance'));
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(record => record.date.startsWith(yearMonth));
};

export const getAttendanceByDateRange = async (startDate, endDate) => {
  const q = query(
    collection(db, 'attendance'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAttendanceByEmployee = async (employeeId) => {
  const q = query(collection(db, 'attendance'), where('employeeId', '==', employeeId));
  const snapshot = await getDocs(q);
  // Sort descending by date locally
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => b.date.localeCompare(a.date));
};

export const deleteBadCutiRecords = async () => {
  const snapshot = await getDocs(collection(db, 'attendance'));
  let deletedCount = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    if (data.status === 'cuti' && data.notes === 'Diimpor otomatis dari Excel harian') {
       await deleteDoc(document.ref);
       deletedCount++;
    }
  }
  return deletedCount;
};
