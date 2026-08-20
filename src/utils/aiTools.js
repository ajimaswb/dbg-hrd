import { db } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

// 1. Cari Karyawan
export const cariKaryawan = async (keyword) => {
  const kw = keyword.toLowerCase();
  const snap = await getDocs(collection(db, 'employees'));
  const results = [];
  
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const nameMatch = data.name && data.name.toLowerCase().includes(kw);
    const nikMatch = data.nik && data.nik.toLowerCase().includes(kw);
    const deptMatch = data.department && data.department.toLowerCase().includes(kw);
    
    if (nameMatch || nikMatch || deptMatch) {
      results.push({
        id: docSnap.id,
        nik: data.nik,
        nama: data.name,
        department: data.department,
        position: data.position,
        gajiPokok: data.baseSalary || data.components?.gaji_pokok || 0,
        tanggalBergabung: data.joinDate
      });
    }
  });

  if (results.length === 0) return { pesan: "Tidak ada karyawan yang cocok dengan pencarian." };
  return { jumlah_ditemukan: results.length, data: results.slice(0, 10) }; // Batasi max 10
};

// 2. Lihat Absensi
export const lihatAbsensi = async (employeeId, bulan) => {
  // bulan format YYYY-MM
  const q = query(
    collection(db, 'attendance'),
    where('employeeId', '==', employeeId),
    where('date', '>=', `${bulan}-01`),
    where('date', '<=', `${bulan}-31`)
  );
  
  const snap = await getDocs(q);
  const ringkasan = { alfa: 0, izin: 0, sakit: 0, cuti: 0, jam_lembur: 0, total_record: 0 };
  const rincian = [];

  snap.forEach(docSnap => {
    const data = docSnap.data();
    ringkasan.total_record++;
    
    const s = data.status?.toLowerCase();
    if (s === 'alfa') ringkasan.alfa++;
    if (s === 'izin') ringkasan.izin++;
    if (s === 'sakit') ringkasan.sakit++;
    if (s === 'cuti') ringkasan.cuti++;
    if (data.ot_hours) ringkasan.jam_lembur += data.ot_hours;

    rincian.push({ tanggal: data.date, status: data.status, lembur: data.ot_hours, catatan: data.notes });
  });

  return { ringkasan, rincian };
};

// 3. Lihat Slip Gaji
export const lihatSlipGaji = async (employeeId, bulan) => {
  const q = query(
    collection(db, 'payrolls'),
    where('employeeId', '==', employeeId),
    where('period', '==', bulan)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return { pesan: `Tidak ada data gaji untuk periode ${bulan}` };
  
  const p = snap.docs[0].data();
  return {
    id: snap.docs[0].id,
    periode: p.period,
    status: p.status,
    pendapatan: {
      gajiPokok: p.components?.gaji_pokok || 0,
      tunjanganLembur: p.components?.tunjangan_lembur || 0,
      lainnya: p.components?.tunjangan_lainnya || 0,
    },
    potongan: {
      bpjs: p.components?.potongan_bpjs || 0,
      absen: p.components?.potongan_absen || 0,
    },
    takeHomePay: p.takeHomePay
  };
};

// 4. Ringkasan Departemen
export const ringkasanDepartemen = async () => {
  const snap = await getDocs(collection(db, 'employees'));
  const stats = {};
  let totalKaryawan = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const dept = data.department || 'Belum Diatur';
    if (!stats[dept]) stats[dept] = 0;
    stats[dept]++;
    totalKaryawan++;
  });

  return { total_seluruh_karyawan: totalKaryawan, jumlah_per_departemen: stats };
};
