import { GoogleGenerativeAI } from '@google/generative-ai';
import { createEmployee } from './employeeService';
import { saveAttendance } from './attendanceService';
import { getMemory, saveMemory } from './memoryService';
import { getKnowledgeBase, queryKnowledge } from './knowledgeBaseService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// ─── HR Tools (Function Calling) ──────────────────────────────────────────────

const hrTools = {
  functionDeclarations: [
    {
      name: "tambahKaryawan",
      description: "Menambahkan data karyawan baru ke dalam database.",
      parameters: {
        type: "OBJECT",
        properties: {
          nik:         { type: "STRING",  description: "Nomor Induk Karyawan (misal DBG123)" },
          name:        { type: "STRING",  description: "Nama lengkap karyawan" },
          department:  { type: "STRING",  description: "Departemen karyawan" },
          position:    { type: "STRING",  description: "Jabatan karyawan" },
          baseSalary:  { type: "NUMBER",  description: "Gaji pokok tanpa titik (misal 5000000)" },
          bankName:    { type: "STRING",  description: "Nama bank (misal BCA, Mandiri)" },
          bankAccount: { type: "STRING",  description: "Nomor rekening bank" },
          line:        { type: "STRING",  description: "Line produksi (opsional)" },
        },
        required: ["nik", "name", "department", "position", "baseSalary"]
      }
    },
    {
      name: "catatAbsensi",
      description: "Mencatat absensi harian / eksepsi (sakit, izin, alfa, cuti, lembur) untuk seorang karyawan.",
      parameters: {
        type: "OBJECT",
        properties: {
          employeeId: { type: "STRING", description: "ID unik karyawan dari knowledge base (field ID:...)" },
          status:     { type: "STRING", description: "Status: hadir, sakit, izin, alfa, atau cuti" },
          ot_hours:   { type: "NUMBER", description: "Jumlah jam lembur" },
          notes:      { type: "STRING", description: "Keterangan absensi" },
          date:       { type: "STRING", description: "Tanggal format YYYY-MM-DD. Gunakan hari ini jika tidak disebutkan." }
        },
        required: ["employeeId", "status", "date"]
      }
    }
  ]
};

// (Summarizer LLM dihapus untuk menghindari Rate Limit ganda / Quota Exceeded)

// ─── Main Chat Function ───────────────────────────────────────────────────────

export const chatWithHRBot = async (message, userId = 'guest') => {
  if (!apiKey) {
    throw new Error('Gemini API Key tidak ditemukan. Pastikan VITE_GEMINI_API_KEY sudah diatur di .env.local');
  }

  // Load memory (ringkasan sesi lama) dan knowledge base (indeks data) secara paralel
  const [memory, kb] = await Promise.all([getMemory(userId), getKnowledgeBase()]);

  // Ambil data relevan dari knowledge base lokal — TANPA memanggil Firestore lagi
  const relevantData = queryKnowledge(kb, message, 12);

  // Simpan referensi employeeIndex untuk resolving nama saat function calling
  const employeeIndex = kb?.employeeIndex || {};

  const systemInstruction = `Anda adalah Asisten HR cerdas untuk perusahaan PT Dwi Bintang Global.
Tugas: menjawab pertanyaan HRD seputar data karyawan, absensi, dan penggajian.
Nada: profesional, ramah, mudah dipahami.
Sistem: hari kalender. Minggu libur. Sabtu = hari kerja (7 jam, dihitung 1 hari penuh). Jam kerja normal 9 jam.

KEMAMPUAN:
1. Tools untuk MENAMBAHKAN KARYAWAN dan MENCATAT ABSENSI secara otomatis.
2. Jika HRD minta tambah karyawan / catat absen → GUNAKAN TOOLS, jangan hanya instruksi manual.
3. Jika perlu mengarahkan user ke halaman lain, berikan tag navigasi secara terpisah di akhir kalimat (tanpa tanda kurung).
4. Daftar tag Navigasi:
   - Ke Dashboard: [NAVIGATE:/hrd]
   - Ke Karyawan: [NAVIGATE:/hrd/employees]
   - Ke Absensi: [NAVIGATE:/hrd/attendance]
   - Ke Payroll: [NAVIGATE:/hrd/payroll]

FORMAT DATA: ID|NIK|Nama|Dept|Line|GajiPokok|Alfa|Izin|OT|TakeHomePay
PENTING: Gunakan nilai ID:... sebagai 'employeeId' saat memanggil tool catatAbsensi.

${relevantData}

ATURAN JAWABAN:
1. Nominal uang dalam format Rp.
2. Jawablah segala jenis pertanyaan dengan ramah, informatif, dan membantu. Jika ditanya pertanyaan umum di luar konteks HRD, Anda tetap diperbolehkan menjawabnya menggunakan wawasan luas Anda. Namun, jika ditanya soal *data karyawan spesifik* yang memang tidak ada di sistem, barulah jawab: "Maaf, data karyawan tersebut tidak tersedia di sistem saat ini."
3. Jawaban singkat, padat, gunakan bullet jika menjabarkan banyak hal.
4. DILARANG format LaTeX/matematika. Gunakan '->' atau '=>' untuk panah.
5. Jika knowledge base belum dibangun, minta HRD klik tombol "Perbarui Knowledge Base" di profil.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction,
      tools: [hrTools]
    });

    // Validasi format history agar tidak crash jika formatnya salah
    let validHistory = [];
    if (Array.isArray(memory)) {
      validHistory = memory.filter(m => m.role && m.parts && m.parts[0]?.text);
    }
    
    // --- Sistem Auto-Retry (Mencegah Error 429 jika API terlalu cepat dipanggil) ---
    const maxRetries = 2;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        let currentHistory = [...validHistory];
        currentHistory.push({ role: 'user', parts: [{ text: message }] });

        let result = await model.generateContent({ contents: currentHistory });
        let calls = result.response.functionCalls();
        
        if (result.response.candidates?.[0]?.content) {
          currentHistory.push({ role: 'model', parts: result.response.candidates[0].content.parts });
        }

    // ─── Function Call Loop ──────────────────────────────────────────────────
    while (calls && calls.length > 0) {
      const functionResponses = [];

      for (const call of calls) {
        if (call.name === 'tambahKaryawan') {
          try {
            const data = { ...call.args, joinDate: new Date().toISOString().split('T')[0] };
            const id = await createEmployee(data);
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { success: true, message: `Karyawan berhasil ditambahkan dengan ID ${id}` }
              }
            });
          } catch (e) {
            functionResponses.push({
              functionResponse: { name: call.name, response: { error: e.message } }
            });
          }

        } else if (call.name === 'catatAbsensi') {
          try {
            // Resolve nama dari employeeIndex lokal (tanpa Firestore read!)
            const empData = employeeIndex[call.args.employeeId];
            const employeeName = empData?.nama || 'Unknown';
            await saveAttendance(call.args.date, call.args.employeeId, {
              status:       call.args.status,
              ot_hours:     call.args.ot_hours || 0,
              notes:        call.args.notes || '',
              employeeName: employeeName
            });
            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { success: true, message: `Absensi ${employeeName} berhasil dicatat` }
              }
            });
          } catch (e) {
            functionResponses.push({
              functionResponse: { name: call.name, response: { error: e.message } }
            });
          }
        }
      }

      currentHistory.push({ role: 'function', parts: functionResponses });
      result = await model.generateContent({ contents: currentHistory });
      
      if (result.response.candidates?.[0]?.content) {
        currentHistory.push({ role: 'model', parts: result.response.candidates[0].content.parts });
      }
      calls = result.response.functionCalls();
    }

        const finalReply = result.response.text();

        // Update memory dengan sistem rolling window (simpan maksimal 6 pesan terakhir / 3 turn)
        let newHistory = [
          ...validHistory,
          { role: 'user', parts: [{ text: message }] },
          { role: 'model', parts: [{ text: finalReply }] }
        ].slice(-6); // Ambil 6 pesan terakhir saja agar tidak boros token
        
        // Pastikan urutan selalu diawali dengan 'user'
        if (newHistory.length > 0 && newHistory[0].role !== 'user') {
          newHistory = newHistory.slice(1);
        }

        // Simpan history ke Firestore di background
        saveMemory(userId, newHistory);

        return finalReply;
        
      } catch (err) {
        if (err.message && (err.message.includes('429') || err.message.includes('Quota exceeded'))) {
          if (attempt < maxRetries) {
            console.warn(`Hit rate limit. Retrying in ${2 * (attempt + 1)}s...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1))); // Tunggu 2s, 4s...
            attempt++;
            continue;
          }
        }
        throw err; // Lempar error ke blok catch utama jika retries habis atau error lain
      }
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    if (error.message && (error.message.includes('429') || error.message.includes('Quota exceeded'))) {
      throw new Error('Wah, maaf ya, saya sedang kelelahan dan butuh istirahat sejenak (Limit API tercapai). Sistem akan kembali normal dalam 1-2 menit. 😴');
    } else if (error.message && (error.message.includes('503') || error.message.includes('unavailable') || error.message.includes('500'))) {
      throw new Error('Duh, server AI-nya sedang penuh atau down nih (Error 503). Tunggu sebentar lalu coba sapa saya lagi ya! 🔌');
    }
    throw new Error(`Gagal menghubungi AI Assistant: ${error.message}`);
  }
};
