import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, CheckCircle, FileText, Printer, Search, X } from 'lucide-react';
import { generatePayroll, getPayrollsByMonth, publishPayrolls } from '../../utils/payrollService';
import toast from 'react-hot-toast';
import SlipGajiTemplate from '../../components/SlipGajiTemplate';

export default function Payroll() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [genConfig, setGenConfig] = useState({ workingDaysMonth: 26, workingDaysPassed: 26 });

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPayrollsByMonth(month);
      setPayrolls(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleOpenModal = () => {
    const [year, m] = month.split('-').map(Number);
    let workingDaysMonth = 0;
    const totalDays = new Date(year, m, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, m - 1, i);
      if (d.getDay() !== 0) workingDaysMonth++; // Not Sunday
    }

    let workingDaysPassed = workingDaysMonth;
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() === m - 1) {
      workingDaysPassed = 0;
      for (let i = 1; i <= today.getDate(); i++) {
        const d = new Date(year, m - 1, i);
        if (d.getDay() !== 0) workingDaysPassed++;
      }
    } else if (new Date(year, m - 1, totalDays) > today) {
      workingDaysPassed = 0; // Future month
    }

    setGenConfig({ workingDaysMonth, workingDaysPassed });
    setShowGenerateModal(true);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setShowGenerateModal(false);
    try {
      await generatePayroll(month, genConfig.workingDaysMonth, genConfig.workingDaysPassed);
      await fetchPayrolls();
      toast.success("Payroll berhasil diproses!");
    } catch (e) {
      toast.error("Gagal memproses payroll: " + e.message);
    } finally {
      setLoading(false);
    }
  };



  const confirmPublish = async () => {
    setShowPublishModal(false);
    setLoading(true);
    try {
      await publishPayrolls(month);
      await fetchPayrolls();
      toast.success("Slip gaji berhasil dipublish!");
    } catch (e) {
      toast.error("Gagal mem-publish payroll: " + e.message);
    } finally {
      setLoading(false);
    }
  };


  const uniqueLines = [...new Set(payrolls.map(p => String(p.employeeLine || '').replace('.0', '')).filter(Boolean))].sort((a, b) => Number(a) - Number(b));

  const filteredPayrolls = payrolls.filter(p => {
    const matchesSearch = p.employeeName.toLowerCase().includes(search.toLowerCase()) || 
                          p.employeeNik.toLowerCase().includes(search.toLowerCase()) ||
                          p.employeeDepartment.toLowerCase().includes(search.toLowerCase());
    
    let matchesLine = true;
    if (filterLine === 'Staff') {
      matchesLine = !p.employeeLine || String(p.employeeLine).trim() === '';
    } else if (filterLine) {
      matchesLine = String(p.employeeLine || '').replace('.0', '') === filterLine;
    }

    return matchesSearch && matchesLine;
  });

  const totalSalary = filteredPayrolls.reduce((sum, p) => sum + (p.takeHomePay || 0), 0);

  const handlePrintBatch = () => {
    setIsBatchPrinting(true);
    setTimeout(() => {
      window.print();
      setIsBatchPrinting(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Payroll & Slip Gaji</h2>
          <p className="text-slate-500 text-sm">Proses kalkulasi gaji dan cetak slip gaji karyawan.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 pl-2">Periode:</label>
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)}
            className="border-none bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-1.5 focus:ring-0 text-slate-700 dark:text-slate-200 font-medium [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleOpenModal}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-sm transition-colors"
        >
          <Calculator size={18} />
          <span>Proses Payroll Bulan Ini</span>
        </button>


        {filteredPayrolls.length > 0 && (
          <button 
            onClick={handlePrintBatch}
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center space-x-2 shadow-sm transition-colors sm:ml-auto"
          >
            <Printer size={18} />
            <span>Cetak Semua Slip</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari NIK atau Nama..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          
          <select
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value)}
            className="border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 w-full sm:w-auto"
          >
            <option value="">Semua (Line & Staff)</option>
            {uniqueLines.map(l => (
              <option key={l} value={l}>Line {l}</option>
            ))}
            <option value="Staff">Staff</option>
          </select>

          <div className="sm:ml-auto text-sm font-medium text-slate-500">
            Total Record: <span className="text-slate-800 dark:text-white">{filteredPayrolls.length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-white dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-600 shadow-sm text-slate-500 z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Karyawan</th>
                <th className="px-6 py-4 font-medium">Line</th>
                <th className="px-6 py-4 font-medium">Status Absen</th>
                <th className="px-6 py-4 font-medium">Take Home Pay</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Belum ada data payroll untuk periode ini. Silakan klik "Proses Payroll".</td>
                </tr>
              ) : (
                filteredPayrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:bg-slate-900/50">
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800 dark:text-white">{p.employeeName}</div>
                      <div className="text-xs text-slate-400">{p.employeeNik} - {p.employeeDepartment}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {p.employeeLine && String(p.employeeLine).trim() !== '' ? `Line ${String(p.employeeLine).replace('.0', '')}` : <span className="text-slate-400 italic">Staff</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-xs space-y-0.5">
                        <div className="text-slate-500">Izin/Alfa: <span className="text-red-500 font-medium">{p.details.totalIzin + p.details.totalAlfa}</span> hari</div>
                        <div className="text-slate-500">OT: <span className="text-sky-600 font-medium">{p.details.totalOTHours}</span> jam</div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-semibold text-slate-800 dark:text-white">Rp {p.takeHomePay.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider
                        ${p.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
                      `}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => setSelectedSlip(p)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <FileText size={14} />
                        <span>Lihat Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && filteredPayrolls.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 sticky bottom-0">
                <tr>
                  <td colSpan="3" className="px-6 py-4 font-bold text-slate-800 dark:text-white text-right">Total Take Home Pay:</td>
                  <td colSpan="3" className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">Rp {totalSalary.toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Slip Gaji Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Slip Gaji: {selectedSlip.employeeName}</h3>
              <button onClick={() => setSelectedSlip(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white dark:bg-slate-800 text-black" id="slip-gaji-content" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              <style>{`
                @media print {
                  @page { size: portrait; margin: 5mm; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  body * { visibility: hidden; }
                  #slip-gaji-content, #slip-gaji-content * { visibility: visible; }
                  #slip-gaji-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100vw;
                    margin: 0;
                    padding: 0;
                    overflow: visible !important;
                    max-height: none !important;
                  }
                  .slip-page-break {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    margin: 0;
                    border: 1px dashed #ccc;
                  }
                }
              `}</style>
              <div className="grid grid-cols-2 gap-0 w-full">
                <div className="slip-page-break p-0">
                  <SlipGajiTemplate selectedSlip={selectedSlip} />
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 print:hidden">
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors flex items-center space-x-2">
                <Printer size={16} />
                <span>Cetak PDF</span>
              </button>
              <button onClick={() => setSelectedSlip(null)} className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Print Container */}
      {isBatchPrinting && (
        <div id="batch-print-content" className="fixed inset-0 z-50 bg-white dark:bg-slate-800" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <style>{`
            @media print {
              @page { size: portrait; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              body * { visibility: hidden; }
              #batch-print-content, #batch-print-content * { visibility: visible; }
              #batch-print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100vw;
                margin: 0;
                padding: 0;
                overflow: visible !important;
                max-height: none !important;
              }
              .slip-page-break {
                page-break-inside: avoid;
                break-inside: avoid;
                margin: 0;
                border: 1px dashed #ccc;
              }
            }
          `}</style>
          <div className="grid grid-cols-2 gap-0 h-full w-full">
            {filteredPayrolls.map(slip => (
              <div key={slip.id} className="slip-page-break p-0">
                <SlipGajiTemplate selectedSlip={slip} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Proses Kalkulasi Payroll</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-sky-50 text-sky-800 p-4 rounded-xl text-sm mb-4">
                Sistem akan mengalkulasi ulang semua slip gaji. Nilai di bawah ini <b>otomatis dihitung dari kalender</b> (hari Minggu libur). Anda bisa mengubahnya jika ada penyesuaian khusus.
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Hari Kerja Sebulan Penuh</label>
                <input 
                  type="number" 
                  value={genConfig.workingDaysMonth}
                  onChange={e => setGenConfig({...genConfig, workingDaysMonth: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Dipakai untuk menghitung Tarif Gaji Pokok Harian.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hari Kerja Berjalan Saat Ini</label>
                <input 
                  type="number" 
                  value={genConfig.workingDaysPassed}
                  onChange={e => setGenConfig({...genConfig, workingDaysPassed: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <p className="text-xs text-slate-500 mt-1">Jika tarikan bulan penuh (akhir bulan), samakan dengan jumlah sebulan. Jika tarikan 2 minggu, isi misal 12.</p>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button onClick={() => setShowGenerateModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100">Batal</button>
                <button onClick={handleGenerate} className="px-5 py-2.5 rounded-xl font-medium bg-sky-500 text-white hover:bg-sky-600 shadow-sm">
                  Mulai Kalkulasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Publish Slip Gaji</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Apakah Anda yakin ingin mengirim (Publish) slip gaji ini? Karyawan akan dapat melihatnya di portal mereka.
              </p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowPublishModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors">
                  Batal
                </button>
                <button onClick={confirmPublish} className="px-5 py-2.5 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-colors flex items-center space-x-2">
                  <CheckCircle size={18} />
                  <span>Ya, Publish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
