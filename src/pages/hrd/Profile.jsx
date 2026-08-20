import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { updateProfile, updateEmail, updatePassword, verifyBeforeUpdateEmail } from 'firebase/auth';
import { Moon, Sun, User, Mail, Lock, Save, AlertCircle, DatabaseZap, BrainCircuit, RefreshCw, Loader2, Bot, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { buildKnowledgeBase, getKnowledgeBase } from '../../utils/knowledgeBaseService';
import { clearMemory, getMemory } from '../../utils/memoryService';
import { getEmployees, deleteEmployee } from '../../utils/employeeService';

export default function Profile() {
  const { currentUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // AI Knowledge Base state
  const [kbStatus, setKbStatus] = useState('checking'); // 'checking' | 'ready' | 'missing' | 'building'
  const [kbInfo, setKbInfo] = useState(null);
  const [memoryStatus, setMemoryStatus] = useState('checking'); // 'checking' | 'has_memory' | 'empty'
  const [isResettingMemory, setIsResettingMemory] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Cek status KB dan Memory saat halaman dibuka
  useEffect(() => {
    getKnowledgeBase().then(kb => {
      if (kb) {
        setKbStatus('ready');
        setKbInfo({ builtAt: kb.builtAt, totalKary: kb.globalSummary?.totalKary || 0, currentMonth: kb.currentMonth });
      } else {
        setKbStatus('missing');
      }
    });
    getMemory().then(mem => {
      setMemoryStatus(mem ? 'has_memory' : 'empty');
    });
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const promises = [];
      let emailUpdated = false;

      // Periksa apakah ada perubahan nama
      if (displayName !== currentUser.displayName) {
        promises.push(updateProfile(currentUser, { displayName }));
      }

      // Periksa apakah ada perubahan email
      if (email !== currentUser.email) {
        try {
          await updateEmail(currentUser, email);
          emailUpdated = true;
        } catch (emailErr) {
          if (emailErr.code === 'auth/operation-not-allowed' || emailErr.message.includes('verify')) {
            // Fallback to verifyBeforeUpdateEmail if direct update is blocked
            await verifyBeforeUpdateEmail(currentUser, email);
            toast.success(`Link verifikasi telah dikirim ke ${email}. Silakan cek kotak masuk Anda.`);
          } else {
            throw emailErr;
          }
        }
      }

      // Periksa apakah ada perubahan password
      if (password) {
        if (password !== confirmPassword) {
          throw new Error("Password baru dan konfirmasi tidak cocok!");
        }
        promises.push(updatePassword(currentUser, password));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      if (promises.length > 0 || emailUpdated) {
        toast.success("Profil berhasil diperbarui!");
        if (password) {
          toast.success("Perubahan password berhasil disimpan.");
        }
        setPassword('');
        setConfirmPassword('');
      } else if (email === currentUser.email && displayName === currentUser.displayName && !password) {
        toast("Tidak ada perubahan yang perlu disimpan.", { icon: 'ℹ️' });
      }
      
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Sesi Anda sudah terlalu lama. Silakan logout dan login kembali sebelum mengubah sandi/email.");
      } else {
        toast.error(error.message || "Gagal memperbarui profil.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildKB = async () => {
    setKbStatus('building');
    try {
      const kb = await buildKnowledgeBase();
      setKbStatus('ready');
      setKbInfo({ builtAt: kb.builtAt, totalKary: kb.globalSummary?.totalKary || 0, currentMonth: kb.currentMonth });
      toast.success(`Knowledge Base berhasil dibangun! (${kb.globalSummary?.totalKary || 0} karyawan)`);
    } catch (e) {
      setKbStatus('missing');
      toast.error('Gagal membangun Knowledge Base: ' + e.message);
    }
  };

  const handleResetMemory = async () => {
    setIsResettingMemory(true);
    try {
      await clearMemory();
      setMemoryStatus('empty');
      toast.success('Memori AI berhasil direset.');
    } catch (e) {
      toast.error('Gagal mereset memori: ' + e.message);
    } finally {
      setIsResettingMemory(false);
    }
  };

  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const handleDeleteAllEmployees = async () => {
    if (!window.confirm("AWAS! Apakah Anda yakin ingin MENGHAPUS SEMUA data karyawan? Tindakan ini tidak bisa dibatalkan!")) return;
    const pwd = window.prompt("Ketik 'HAPUS SEMUA' untuk melanjutkan:");
    if (pwd !== "HAPUS SEMUA") {
      alert("Penghapusan dibatalkan.");
      return;
    }
    
    setIsDeletingAll(true);
    try {
      const employees = await getEmployees();
      let count = 0;
      for (const emp of employees) {
        await deleteEmployee(emp.id);
        count++;
      }
      toast.success(`Berhasil menghapus ${count} karyawan.`);
    } catch (e) {
      toast.error("Terjadi kesalahan: " + e.message);
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <User className="text-sky-600 dark:text-sky-400" />
          Pengaturan Akun HRD
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                  placeholder="Nama HRD"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                  placeholder="admin@dbg.com"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password Baru (Opsional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-colors"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          {isDarkMode ? <Moon className="text-indigo-400" /> : <Sun className="text-amber-500" />}
          Preferensi Tampilan
        </h2>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Tema Gelap (Dark Mode)</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ubah tampilan antarmuka menjadi gelap untuk kenyamanan mata. Beberapa halaman mungkin masih dalam tahap penyesuaian warna.
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
              isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* AI Assistant Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Bot className="text-indigo-500" />
          Pengaturan Asisten AI
        </h2>

        <div className="space-y-4">
          {/* Knowledge Base */}
          <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <DatabaseZap size={16} className={kbStatus === 'ready' ? 'text-emerald-500' : 'text-amber-500'} />
                Knowledge Base AI
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Indeks terkompresi dari seluruh data karyawan, absensi, dan payroll. Wajib dibangun agar AI hemat token.
              </p>
              {kbStatus === 'ready' && kbInfo && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Aktif — {kbInfo.totalKary} karyawan · Diperbarui: {new Date(kbInfo.builtAt).toLocaleString('id-ID')}
                </p>
              )}
              {kbStatus === 'missing' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">⚠️ Belum dibangun — AI tidak bisa mengakses data karyawan.</p>
              )}
            </div>
            <button
              onClick={handleBuildKB}
              disabled={kbStatus === 'building'}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                kbStatus === 'missing'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {kbStatus === 'building'
                ? <><Loader2 size={14} className="animate-spin" /> Membangun...</>
                : kbStatus === 'missing'
                ? <><DatabaseZap size={14} /> Build KB</>
                : <><RefreshCw size={14} /> Perbarui KB</>}
            </button>
          </div>

          {/* Memory Reset */}
          <div className="flex items-start justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <BrainCircuit size={16} className="text-purple-500" />
                Memori Percakapan AI
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ringkasan otomatis dari sesi obrolan sebelumnya yang digunakan AI untuk mengingat konteks.
              </p>
              {memoryStatus === 'has_memory' && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ada memori tersimpan dari sesi sebelumnya.
                </p>
              )}
              {memoryStatus === 'empty' && (
                <p className="text-xs text-slate-400 mt-2">Tidak ada memori — AI mulai dari awal setiap sesi.</p>
              )}
            </div>
            <button
              onClick={handleResetMemory}
              disabled={isResettingMemory || memoryStatus === 'empty'}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              {isResettingMemory
                ? <><Loader2 size={14} className="animate-spin" /> Mereset...</>
                : <><BrainCircuit size={14} /> Reset Memori</>}
            </button>
          </div>
        </div>
      </div>

      {/* Dangerous Actions */}
      <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 md:p-8 shadow-sm border border-red-200 dark:border-red-800/30 transition-colors">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-6 flex items-center gap-2">
          <AlertCircle size={24} />
          Zona Bahaya (Data Karyawan)
        </h2>
        
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-red-100 dark:border-red-900/30">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Hapus Seluruh Data Karyawan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tindakan ini akan menghapus semua profil karyawan secara permanen dari database.
            </p>
          </div>
          <button
            onClick={handleDeleteAllEmployees}
            disabled={isDeletingAll}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            {isDeletingAll
              ? <><Loader2 size={14} className="animate-spin" /> Menghapus...</>
              : <><Trash2 size={14} /> Hapus Semua Karyawan</>}
          </button>
        </div>
      </div>
    </div>
  );
}
