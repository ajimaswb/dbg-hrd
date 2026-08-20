import { GoogleGenerativeAI } from '@google/generative-ai';
import { createEmployee } from './employeeService';
import { saveAttendance } from './attendanceService';
import { getMemory, saveMemory } from './memoryService';
import { cariKaryawan, lihatAbsensi, lihatSlipGaji, ringkasanDepartemen } from './aiTools';

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
          employeeId: { type: "STRING", description: "ID unik karyawan" },
          status:     { type: "STRING", description: "Status: hadir, sakit, izin, alfa, atau cuti" },
          ot_hours:   { type: "NUMBER", description: "Jumlah jam lembur" },
          notes:      { type: "STRING", description: "Keterangan absensi" },
          date:       { type: "STRING", description: "Tanggal format YYYY-MM-DD. Gunakan hari ini jika tidak disebutkan." }
        },
        required: ["employeeId", "status", "date"]
      }
    },
    {
      name: "cariKaryawan",
      description: "Mencari data profil dan ID unik karyawan berdasarkan nama, NIK, atau departemen.",
      parameters: {
        type: "OBJECT",
        properties: {
          keyword: { type: "STRING", description: "Nama, NIK, atau nama departemen" }
        },
        required: ["keyword"]
      }
    },
    {
      name: "lihatAbsensi",
      description: "Melihat rekap absensi seorang karyawan pada bulan tertentu.",
      parameters: {
        type: "OBJECT",
        properties: {
          employeeId: { type: "STRING", description: "ID unik karyawan (dapatkan dari cariKaryawan jika belum tahu)" },
          bulan: { type: "STRING", description: "Bulan dengan format YYYY-MM (contoh: 2026-08)" }
        },
        required: ["employeeId", "bulan"]
      }
    },
    {
      name: "lihatSlipGaji",
      description: "Melihat rincian gaji (take home pay, potongan, tunjangan) seorang karyawan pada bulan tertentu.",
      parameters: {
        type: "OBJECT",
        properties: {
          employeeId: { type: "STRING", description: "ID unik karyawan (dapatkan dari cariKaryawan jika belum tahu)" },
          bulan: { type: "STRING", description: "Bulan dengan format YYYY-MM (contoh: 2026-08)" }
        },
        required: ["employeeId", "bulan"]
      }
    },
    {
      name: "ringkasanDepartemen",
      description: "Melihat jumlah total karyawan di seluruh perusahaan dan rincian jumlah per departemen.",
      parameters: {
        type: "OBJECT",
        properties: {}
      }
    }
  ]
};

// ─── Main Chat Function ───────────────────────────────────────────────────────

export const chatWithHRBot = async (message, userId = 'guest') => {
  if (!apiKey) {
    throw new Error('Gemini API Key tidak ditemukan. Pastikan VITE_GEMINI_API_KEY sudah diatur di .env.local');
  }

  // Load memory secara tunggal, tidak ada lagi Knowledge Base!
  const memory = await getMemory(userId);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentDate = now.toISOString().split('T')[0];

  const systemInstruction = `Anda adalah Asisten HR cerdas PT Dwi Bintang Global.
Tugas: menjawab pertanyaan HRD seputar data karyawan, absensi, dan penggajian.
Nada: profesional, ramah, mudah dipahami.
Sistem: hari kalender. Minggu libur. Sabtu = hari kerja (7 jam, dihitung 1 hari penuh). Jam kerja normal 9 jam.
Bulan berjalan saat ini: ${currentMonth} (Tanggal hari ini: ${currentDate}).

KEMAMPUAN SUPER (FUNCTION CALLING 100%):
Anda memiliki ALAT (Tools) untuk mencari data ke database secara real-time.
1. Jika ditanya soal data karyawan, gunakan tool 'cariKaryawan' DAHULU. Jangan mengarang data!
2. Jika butuh employeeId tapi belum tahu, panggil 'cariKaryawan' dulu, setelah dapat hasilnya, otomatis panggil tool 'lihatAbsensi' atau 'lihatSlipGaji' menggunakan ID tersebut. (Berpikir berantai).
3. Jika ditanya soal total karyawan perusahaan, gunakan 'ringkasanDepartemen'.

Navigasi UI:
- Ke Dashboard: [NAVIGATE:/hrd]
- Ke Karyawan: [NAVIGATE:/hrd/employees]
- Ke Absensi: [NAVIGATE:/hrd/attendance]
- Ke Payroll: [NAVIGATE:/hrd/payroll]

ATURAN JAWABAN:
1. Nominal uang dalam format Rp.
2. DILARANG format LaTeX/matematika.
3. Jawaban singkat, padat, ramah. Jika gagal mendapatkan data, bilang saja datanya tidak ada.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction,
      tools: [hrTools]
    });

    let validHistory = [];
    if (Array.isArray(memory)) {
      validHistory = memory.filter(m => m.role && m.parts && m.parts[0]?.text);
    }
    
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
        let iteration = 0;
        // Izinkan hingga 5 tool calls beruntun (Chain of Thought)
        while (calls && calls.length > 0 && iteration < 5) {
          iteration++;
          const functionResponses = [];

          for (const call of calls) {
            try {
              let responseData = null;

              if (call.name === 'tambahKaryawan') {
                const data = { ...call.args, joinDate: currentDate };
                const id = await createEmployee(data);
                responseData = { success: true, message: `Karyawan ditambahkan dengan ID ${id}` };
              } 
              else if (call.name === 'catatAbsensi') {
                await saveAttendance(call.args.date, call.args.employeeId, {
                  status: call.args.status,
                  ot_hours: call.args.ot_hours || 0,
                  notes: call.args.notes || '',
                  employeeName: 'Unknown' // Di sistem baru, nama diambil saat save jika diperlukan
                });
                responseData = { success: true, message: `Absensi dicatat` };
              }
              else if (call.name === 'cariKaryawan') {
                responseData = await cariKaryawan(call.args.keyword);
              }
              else if (call.name === 'lihatAbsensi') {
                responseData = await lihatAbsensi(call.args.employeeId, call.args.bulan);
              }
              else if (call.name === 'lihatSlipGaji') {
                responseData = await lihatSlipGaji(call.args.employeeId, call.args.bulan);
              }
              else if (call.name === 'ringkasanDepartemen') {
                responseData = await ringkasanDepartemen();
              }
              else {
                responseData = { error: "Fungsi tidak dikenali" };
              }

              functionResponses.push({
                functionResponse: {
                  name: call.name,
                  response: responseData
                }
              });
            } catch (e) {
              functionResponses.push({
                functionResponse: { name: call.name, response: { error: e.message } }
              });
            }
          }

          currentHistory.push({ role: 'user', parts: functionResponses });
          result = await model.generateContent({ contents: currentHistory });
          
          if (result.response.candidates?.[0]?.content) {
            currentHistory.push({ role: 'model', parts: result.response.candidates[0].content.parts });
          }
          calls = result.response.functionCalls();
        }

        const finalReply = result.response.text();

        let newHistory = [
          ...validHistory,
          { role: 'user', parts: [{ text: message }] },
          { role: 'model', parts: [{ text: finalReply }] }
        ].slice(-10); // Menambah panjang history karena function calling hemat token
        
        if (newHistory.length > 0 && newHistory[0].role !== 'user') {
          newHistory = newHistory.slice(1);
        }

        saveMemory(userId, newHistory);
        return finalReply;
        
      } catch (err) {
        if (err.message && (err.message.includes('429') || err.message.includes('Quota') || err.message.includes('503'))) {
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)));
            attempt++;
            continue;
          }
        }
        throw err;
      }
    }

  } catch (error) {
    const errorMsg = error.message || '';
    if (errorMsg.includes('429') || errorMsg.includes('Quota')) {
      throw new Error('Wah, maaf ya, saya sedang kelelahan dan butuh istirahat sejenak (Limit API tercapai). 😴');
    }
    if (errorMsg.includes('503') || errorMsg.includes('overloaded')) {
      throw new Error('Server AI Google saat ini sedang sangat sibuk (Error 503). Mohon tunggu beberapa saat dan coba tanyakan lagi. 🔌');
    }
    throw new Error(`Gagal menghubungi AI Assistant: ${errorMsg}`);
  }
};

