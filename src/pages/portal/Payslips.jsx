import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Printer, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPublishedPayrollsByEmployee } from '../../utils/payrollService';
import SlipGajiTemplate from '../../components/SlipGajiTemplate';

export default function PortalPayslips() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slips, setSlips] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPublishedPayrollsByEmployee(currentUser.uid);
      setSlips(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data slip gaji...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Riwayat Slip Gaji</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Unduh dan cetak slip gaji Anda per bulan.</p>
        
        {slips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {slips.map(slip => (
              <div key={slip.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-sky-300 dark:hover:border-sky-500 transition-colors flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{slip.period}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Telah Diterbitkan</p>
                  </div>
                </div>
                
                <div className="mt-auto space-y-2 border-t border-slate-200 dark:border-slate-700/50 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Take Home Pay</span>
                    <span className="font-bold text-slate-800 dark:text-white">Rp {slip.takeHomePay.toLocaleString('id-ID')}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedSlip(slip)}
                    className="w-full mt-2 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-600 transition-colors text-sm flex items-center justify-center space-x-2"
                  >
                    <span>Lihat Detail</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            <FileText size={48} className="mx-auto mb-3 opacity-20" />
            <p>Belum ada slip gaji yang tersedia.</p>
          </div>
        )}
      </div>

      {/* Slip Detail Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Detail Slip Gaji</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Periode {selectedSlip.period}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSlip(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-white text-black" id="slip-gaji-content" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              <style>{`
                @media print {
                  @page { size: landscape; margin: 0; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  body * { visibility: hidden; }
                  #slip-gaji-content, #slip-gaji-content * { visibility: visible; }
                  #slip-gaji-content {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100vw;
                    margin: 0;
                    padding: 5mm 15mm;
                    overflow: visible !important;
                    max-height: none !important;
                  }
                }
              `}</style>

              <SlipGajiTemplate selectedSlip={selectedSlip} />
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 print:hidden">
              <button onClick={() => window.print()} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors flex items-center space-x-2">
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
    </div>
  );
}
