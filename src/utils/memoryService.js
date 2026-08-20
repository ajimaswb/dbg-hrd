import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';



/**
 * Mengambil history percakapan sebelumnya dari Firestore.
 * @param {string} userId - UID pengguna yang sedang login.
 * @returns {Promise<Array>} - Array history pesan, atau array kosong jika belum ada.
 */
export const getMemory = async (userId) => {
  if (!userId) return [];
  try {
    const ref = doc(db, 'ai_memory', `hr_bot_memory_${userId}`);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().history || [];
    }
    return [];
  } catch (e) {
    console.error('Gagal mengambil AI memory:', e);
    return '';
  }
};

/**
 * Menyimpan history percakapan baru ke Firestore.
 * @param {string} userId - UID pengguna yang sedang login.
 * @param {Array} history - Array history percakapan terakhir.
 */
export const saveMemory = async (userId, history) => {
  if (!userId) return;
  try {
    const ref = doc(db, 'ai_memory', `hr_bot_memory_${userId}`);
    await setDoc(ref, {
      history,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('Gagal menyimpan AI memory:', e);
  }
};

/**
 * Menghapus history yang tersimpan.
 * @param {string} userId - UID pengguna yang sedang login.
 */
export const clearMemory = async (userId) => {
  if (!userId) return;
  try {
    const ref = doc(db, 'ai_memory', `hr_bot_memory_${userId}`);
    await setDoc(ref, { history: [], updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error('Gagal menghapus AI memory:', e);
  }
};
