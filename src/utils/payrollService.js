import { db } from '../firebase';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { getEmployees } from './employeeService';
import { getAttendanceByMonth } from './attendanceService';

// workingDaysMonth = divisor for daily rate (e.g. 26)
// workingDaysPassed = multiplier for how many days they actually worked (e.g. 12 for mid-month, 26 for full month)
export const generatePayroll = async (yearMonth, workingDaysMonth, workingDaysPassed) => {
  // yearMonth: 'YYYY-MM'
  
  const employees = await getEmployees();
  const allAttendances = await getAttendanceByMonth(yearMonth);

  const batch = writeBatch(db);
  const generatedRecords = [];
  
  // Clean up existing draft payrolls for this month
  const existingPayrolls = await getDocs(query(collection(db, 'payrolls'), where('period', '==', yearMonth)));
  existingPayrolls.forEach(docSnap => {
    if (docSnap.data().status === 'draft') {
      batch.delete(docSnap.ref);
    }
  });

  for (const emp of employees) {
    // LOGIC AUDIT: Abaikan karyawan non-aktif JIKA mereka resign di bulan-bulan sebelumnya
    const empResignMonth = emp.resignDate ? emp.resignDate.substring(0, 7) : '';
    if (emp.status === 'non-aktif') {
      if (!emp.resignDate) continue; // Tidak ada tanggal keluar, lewati
      if (empResignMonth < yearMonth) continue; // Sudah keluar di bulan lalu, lewati
    }

    // Filter attendance for this employee
    const empAttendances = allAttendances.filter(a => a.employeeId === emp.id);
    
    let totalAlfa = 0;
    let totalIzin = 0;
    let totalSakit = 0;
    let totalCuti = 0;
    let totalOTHours = 0;
    let totalHariAbsen = 0; // Menggabungkan alfa, izin, dan hadir sebagian

    empAttendances.forEach(att => {
      if (att.status === 'alfa') {
        totalAlfa += 1;
        totalHariAbsen += 1;
      }
      if (att.status === 'izin') {
        totalIzin += 1;
        totalHariAbsen += 1;
      }
      if (att.status === 'sakit') totalSakit += 1;
      if (att.status === 'cuti') totalCuti += 1;
      if (att.status === 'hadir_sebagian' && att.actual_hours !== undefined) {
        // Normal 9 jam. Jika kerja kurang dari 9 jam, selisihnya dihitung absen.
        // LOGIC AUDIT: Gunakan Math.max untuk mencegah bug jam minus yang berakibat penambahan gaji
        const absenHari = Math.max(0, 9 - att.actual_hours) / 9;
        totalHariAbsen += absenHari;
      }
      if (att.ot_hours) totalOTHours += att.ot_hours;
    });

    const comps = emp.components || {};
    const gajiPokok = comps.gaji_pokok || 0;
    
    // Asumsi perhitungan
    // 1. OT Rate = (Gaji Pokok / 173) per jam lembur
    const otRatePerHour = Math.round(gajiPokok / 173);
    const totalOTPay = otRatePerHour * totalOTHours;

    // 2. Daily Rate = (Gaji Pokok / workingDaysMonth) per hari
    const dailyWage = Math.round(gajiPokok / workingDaysMonth);
    const potonganAbsen = Math.round(dailyWage * totalHariAbsen); 
    
    // 3. Hitung Gaji Pokok Prorata = (Daily Rate x (HariKerjaBerjalan - HariAbsen))
    
    // LOGIC AUDIT: Hitung workingDaysPassed secara individual jika karyawan baru masuk atau keluar di bulan ini
    let individualWorkingDaysPassed = workingDaysPassed;
    const empJoinMonth = emp.joinDate ? emp.joinDate.substring(0, 7) : '';
    const isFirstMonth = empJoinMonth === yearMonth;
    const isResignMonth = emp.status === 'non-aktif' && empResignMonth === yearMonth;

    if ((isFirstMonth && emp.joinDate) || (isResignMonth && emp.resignDate)) {
      const [year, month] = yearMonth.split('-').map(Number);
      
      const startDate = (isFirstMonth && emp.joinDate) ? new Date(emp.joinDate) : new Date(year, month - 1, 1);
      
      let endDateObj = new Date(year, month, 0); // Akhir bulan secara default
      const today = new Date();
      if (today.getFullYear() === year && today.getMonth() === month - 1) {
        endDateObj = today; // Jika sedang berjalan, hitung sampai hari ini
      }
      if (isResignMonth && emp.resignDate) {
        const resignDateObj = new Date(emp.resignDate);
        if (resignDateObj < endDateObj) {
          endDateObj = resignDateObj; // Hitung hanya sampai tanggal resign
        }
      }

      individualWorkingDaysPassed = 0;
      for (let d = new Date(startDate); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0) { // Bukan hari Minggu
          individualWorkingDaysPassed++;
        }
      }
    }

    const totalHariHadir = Math.max(0, individualWorkingDaysPassed - totalHariAbsen);
    const gajiPokokProrata = Math.round(dailyWage * totalHariHadir);

    // Koperasi Logic
    // Simpanan Wajib Koperasi dipotong setiap bulan
    // Simpanan Pokok Koperasi (tambahan) hanya dipotong di bulan pertama (Join Date)
    
    const wajibKoperasi = comps.potongan_koperasi_wajib || 0;
    const pokokKoperasi = isFirstMonth ? (comps.potongan_pokok_koperasi || 0) : 0;

    // LOGIC AUDIT: Tunjangan Absen HANGUS jika ada 1 Alfa/Izin/Sakit
    const baseTunjanganAbsen = comps.tunjangan_absen || 0;
    const finalTunjanganAbsen = (totalAlfa > 0 || totalIzin > 0 || totalSakit > 0) ? 0 : baseTunjanganAbsen;

    // LOGIC AUDIT: Tunjangan Transport diprorata berdasarkan rasio kehadiran terhadap total hari kerja bulan ini
    const baseTunjanganTransport = comps.tunjangan_transport || 0;
    const finalTunjanganTransport = Math.round((baseTunjanganTransport / workingDaysMonth) * totalHariHadir);

    // Pendapatan
    // Di sini kita gunakan gajiPokokProrata sebagai pengganti GajiPokok utuh jika di tengah bulan
    const totalPendapatan = gajiPokokProrata 
      + (comps.tunjangan_masa_kerja || 0) 
      + (comps.tunjangan_skill || 0) 
      + (comps.tunjangan_jabatan || 0)
      + (comps.tunjangan_insentif || 0)
      + finalTunjanganTransport
      + finalTunjanganAbsen
      + totalOTPay;
    
    // Potongan Tetap
    const totalPotonganTetap = (comps.potongan_bpjs_tk || 0) 
      + (comps.potongan_bpjs_kes || 0) 
      + (comps.potongan_forum || 0)
      + (comps.potongan_ganti_rugi || 0)
      + (comps.potongan_kasbon || 0)
      + pokokKoperasi
      + (comps.potongan_simpanan_bersama || 0)
      + (comps.potongan_angsuran_koperasi || 0)
      + wajibKoperasi;
    
    // Total Potongan (Potongan Absen TIDAK dikurangkan lagi karena sudah memotong Gaji Pokok Prorata, tapi kita tetapkan totalPotongan hanya potongan tetap)
    const totalPotongan = totalPotonganTetap;

    const takeHomePay = totalPendapatan - totalPotongan;

    const payrollData = {
      employeeId: emp.id,
      employeeNik: emp.nik,
      employeeName: emp.name,
      employeeDepartment: emp.department,
      employeeLine: emp.line || '',
      period: yearMonth,
      details: {
        gajiPokok,
        gajiPokokProrata, // Simpan untuk referensi cetakan
        tunjanganMasaKerja: comps.tunjangan_masa_kerja || 0,
        tunjanganSkill: comps.tunjangan_skill || 0,
        tunjanganJabatan: comps.tunjangan_jabatan || 0,
        tunjanganInsentif: comps.tunjangan_insentif || 0,
        tunjanganTransport: finalTunjanganTransport,
        tunjanganAbsen: finalTunjanganAbsen,
        totalOTHours,
        totalOTPay,
        potonganBpjsTk: comps.potongan_bpjs_tk || 0,
        potonganBpjsKes: comps.potongan_bpjs_kes || 0,
        potonganForum: comps.potongan_forum || 0,
        potonganGantiRugi: comps.potongan_ganti_rugi || 0,
        potonganKasbon: comps.potongan_kasbon || 0,
        potonganPokokKoperasi: pokokKoperasi,
        potonganSimpananBersama: comps.potongan_simpanan_bersama || 0,
        potonganAngsuranKoperasi: comps.potongan_angsuran_koperasi || 0,
        potonganKoperasi: wajibKoperasi,
        totalAlfa,
        totalIzin,
        totalSakit,
        totalHariAbsen, // Menambahkan info total hari absen (termasuk desimal)
        potonganAbsen,
        totalHariHadir
      },
      totalPendapatan,
      totalPotongan,
      takeHomePay,
      status: 'draft', // draft -> published
      generatedAt: new Date().toISOString()
    };

    const docId = `${yearMonth}_${emp.id}`;
    const docRef = doc(db, 'payrolls', docId);
    batch.set(docRef, payrollData);
    
    generatedRecords.push({ id: docId, ...payrollData });
  }

  await batch.commit();
  return generatedRecords;
};

export const getPayrollsByMonth = async (yearMonth) => {
  const q = query(collection(db, 'payrolls'), where('period', '==', yearMonth));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getPublishedPayrollsByEmployee = async (employeeId) => {
  const q = query(
    collection(db, 'payrolls'), 
    where('employeeId', '==', employeeId),
    where('status', '==', 'published')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => b.period.localeCompare(a.period));
};

export const publishPayrolls = async (yearMonth) => {
  const payrolls = await getPayrollsByMonth(yearMonth);
  const batch = writeBatch(db);
  
  payrolls.forEach(p => {
    if (p.status === 'draft') {
      const docRef = doc(db, 'payrolls', p.id);
      batch.update(docRef, { status: 'published' });
    }
  });

  await batch.commit();
};
