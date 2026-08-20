/**
 * knowledgeBaseService.js
 * 
 * Membangun dan mengelola "Knowledge Cache" — representasi terkompresi dari
 * seluruh data HR yang disimpan di Firestore. AI menggunakan cache ini untuk
 * menjawab pertanyaan tanpa harus mengambil data mentah berukuran besar.
 * 
 * Format cache dirancang agar sangat ringkas sehingga hemat token API.
 */
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

const KB_DOC_ID = 'hr_knowledge_base';
const KB_COLLECTION = 'ai_knowledge';

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Membaca data bulan ini dari Firestore dan membangun knowledge cache terkompresi.
 * Harus dipanggil secara eksplisit (dari tombol UI atau setelah ada perubahan data).
 * 
 * @returns {Promise<object>} knowledge base yang baru dibangun
 */
export const buildKnowledgeBase = async () => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Ambil data secara paralel dengan filter khusus bulan ini untuk hemat kuota baca
  const [empSnap, attSnap, paySnap] = await Promise.all([
    getDocs(collection(db, 'employees')),
    getDocs(query(
      collection(db, 'attendance'), 
      where('date', '>=', `${currentMonth}-01`), 
      where('date', '<=', `${currentMonth}-31`)
    )),
    getDocs(query(
      collection(db, 'payrolls'),
      where('period', '==', currentMonth)
    )),
  ]);

  const employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const attendance = attSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const payrolls   = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Bangun indeks karyawan terkompresi
  //    Format: { id: { nik, name, dept, line, pos, salary } }
  const employeeIndex = {};
  const deptStats = {};
  const lineStats = {};

  for (const e of employees) {
    employeeIndex[e.id] = {
      nik:    e.nik || '',
      nama:   e.name || '',
      dept:   e.department || '',
      line:   e.line || '',
      pos:    e.position || '',
      gp:     (e.components?.gaji_pokok || e.baseSalary || 0),
      bank:   e.bankName || '',
      rek:    e.bankAccount || '',
      masuk:  e.joinDate || '',
    };

    // Statistik per departemen
    const d = e.department || 'Lainnya';
    deptStats[d] = (deptStats[d] || { count: 0, totalGaji: 0 });
    deptStats[d].count++;
    deptStats[d].totalGaji += (e.components?.gaji_pokok || e.baseSalary || 0);

    // Statistik per line
    if (e.line) {
      lineStats[e.line] = (lineStats[e.line] || { count: 0 });
      lineStats[e.line].count++;
    }
  }

  // 3. Bangun ringkasan absensi per karyawan (bulan ini saja)
  //    Format: { employeeId: { alfa, izin, sakit, cuti, ot } }
  const attendanceSummary = {};
  for (const a of attendance) {
    if (!a.date || !a.date.startsWith(currentMonth)) continue;
    const empId = a.employeeId;
    if (!attendanceSummary[empId]) {
      attendanceSummary[empId] = { alfa: 0, izin: 0, sakit: 0, cuti: 0, ot: 0 };
    }
    const s = a.status?.toLowerCase();
    if (s === 'alfa')  attendanceSummary[empId].alfa++;
    if (s === 'izin')  attendanceSummary[empId].izin++;
    if (s === 'sakit') attendanceSummary[empId].sakit++;
    if (s === 'cuti')  attendanceSummary[empId].cuti++;
    attendanceSummary[empId].ot += (a.ot_hours || 0);
  }

  // 4. Bangun ringkasan payroll bulan ini per karyawan
  //    Format: { employeeId: { thp, status } }
  const payrollSummary = {};
  let totalTakeHomePay = 0;
  for (const p of payrolls) {
    if (p.period !== currentMonth) continue;
    const empId = p.employeeId;
    payrollSummary[empId] = {
      thp:    p.takeHomePay || 0,
      status: p.status || 'draft',
    };
    totalTakeHomePay += (p.takeHomePay || 0);
  }

  // 5. Lookup cepat: nama → id (untuk pencarian berdasarkan nama)
  const nameIndex = {};
  const nikIndex = {};
  for (const e of employees) {
    if (e.name) nameIndex[e.name.toLowerCase()] = e.id;
    if (e.nik)  nikIndex[e.nik.toLowerCase()]   = e.id;
  }

  // 6. Ringkasan global (dikirim ke AI di setiap query)
  const globalSummary = {
    bulan:       currentMonth,
    totalKary:   employees.length,
    totalAbsen:  attendance.filter(a => a.date?.startsWith(currentMonth)).length,
    totalTakeHomePay,
    deptStats,
    lineStats,
  };

  const kb = {
    builtAt:         now.toISOString(),
    currentMonth,
    globalSummary,
    employeeIndex,
    attendanceSummary,
    payrollSummary,
    nameIndex,
    nikIndex,
  };

  // 7. Simpan ke Firestore
  await setDoc(doc(db, KB_COLLECTION, KB_DOC_ID), {
    builtAt:      kb.builtAt,
    currentMonth: kb.currentMonth,
    data:         JSON.stringify(kb), // simpan sebagai string JSON
  });

  return kb;
};

// ─── Reader ───────────────────────────────────────────────────────────────────

/**
 * Mengambil knowledge base dari Firestore cache.
 * @returns {Promise<object|null>}
 */
export const getKnowledgeBase = async () => {
  try {
    const snap = await getDoc(doc(db, KB_COLLECTION, KB_DOC_ID));
    if (!snap.exists()) return null;
    return JSON.parse(snap.data().data);
  } catch (e) {
    console.error('Gagal membaca knowledge base:', e);
    return null;
  }
};

// ─── Query Engine ─────────────────────────────────────────────────────────────

/**
 * Mencari karyawan yang relevan dengan pertanyaan user dari knowledge base.
 * Mengembalikan data terformat ringkas siap dikirim ke AI.
 * 
 * @param {object} kb - Knowledge base
 * @param {string} message - Pertanyaan user
 * @param {number} maxResults - Batas jumlah karyawan yang dikembalikan
 * @returns {string} - Teks ringkas siap dimasukkan ke prompt AI
 */
export const queryKnowledge = (kb, message, maxResults = 10) => {
  if (!kb) return '(Knowledge base belum dibangun)';

  const msg = message.toLowerCase();
  const stopWords = new Set(['hari', 'ini', 'besok', 'kemarin', 'tolong', 'saya', 'mau',
    'ingin', 'buat', 'ada', 'dan', 'yang', 'untuk', 'dari', 'ke', 'di', 'dengan',
    'apakah', 'berapa', 'siapa', 'kapan', 'bagaimana', 'mohon', 'bisa']);

  const keywords = msg.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));

  // Cari ID karyawan yang relevan
  const matchedIds = new Set();

  // Cari berdasarkan nama atau NIK
  for (const kw of keywords) {
    for (const [nameLower, id] of Object.entries(kb.nameIndex || {})) {
      if (nameLower.includes(kw)) matchedIds.add(id);
    }
    for (const [nikLower, id] of Object.entries(kb.nikIndex || {})) {
      if (nikLower.includes(kw)) matchedIds.add(id);
    }
  }

  // Cari berdasarkan departemen atau line
  if (matchedIds.size === 0) {
    for (const [id, emp] of Object.entries(kb.employeeIndex || {})) {
      const empText = `${emp.dept} ${emp.line} ${emp.pos}`.toLowerCase();
      if (keywords.some(kw => empText.includes(kw))) {
        matchedIds.add(id);
      }
    }
  }

  // Jika masih kosong, ambil semua (terbatas)
  const idsToShow = matchedIds.size > 0
    ? [...matchedIds].slice(0, maxResults)
    : Object.keys(kb.employeeIndex || {}).slice(0, maxResults);

  // Format ringkas untuk AI
  const rows = idsToShow.map(id => {
    const e = kb.employeeIndex[id] || {};
    const a = kb.attendanceSummary[id] || {};
    const p = kb.payrollSummary[id] || {};
    return [
      `ID:${id}`,
      `NIK:${e.nik}`,
      `Nama:${e.nama}`,
      `Dept:${e.dept}`,
      `Line:${e.line || '-'}`,
      `GP:${e.gp}`,
      `Alfa:${a.alfa||0}`,
      `Izin:${a.izin||0}`,
      `OT:${a.ot||0}h`,
      `THP:${p.thp||'-'}`,
    ].join('|');
  });

  const gs = kb.globalSummary;
  const deptInfo = Object.entries(gs.deptStats || {})
    .map(([d, v]) => `${d}(${v.count})`)
    .join(', ');

  return `=== KNOWLEDGE BASE (${gs.bulan}) ===
Total Karyawan: ${gs.totalKary} | Dept: ${deptInfo}
Total Gaji Keseluruhan (Take Home Pay): Rp ${gs.totalTakeHomePay?.toLocaleString('id-ID') || 0}
Format: ID|NIK|Nama|Dept|Line|GajiPokok|Alfa|Izin|OT|TakeHomePay
--- Data Relevan (${rows.length} karyawan) ---
${rows.join('\n')}`;
};
