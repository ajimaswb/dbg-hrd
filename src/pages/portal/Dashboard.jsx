import React, { useState, useEffect, useCallback } from 'react';
import { Clock, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceByEmployee } from '../../utils/attendanceService';
import { getPublishedPayrollsByEmployee } from '../../utils/payrollService';

export default function PortalDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    hadir: 0,
    eksepsi: 0,
    ot: 0,
    period: ''
  });
  const [latestSlip, setLatestSlip] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Attendance for current month
      const attendance = await getAttendanceByEmployee(currentUser.uid);
      const today = new Date();
      const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      let eksepsiCount = 0;
      let otHours = 0;

      attendance.forEach(record => {
        if (record.date.startsWith(currentMonthPrefix)) {
          if (record.status !== 'hadir') eksepsiCount++;
          if (record.ot_hours) otHours += record.ot_hours;
        }
      });

      setSummary({
        eksepsi: eksepsiCount,
        ot: otHours,
        period: currentMonthPrefix
      });

      // 2. Fetch Latest Payslip
      const slips = await getPublishedPayrollsByEmployee(currentUser.uid);
      if (slips.length > 0) {
        setLatestSlip(slips[0]);
      }
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
    return <div className="p-8 text-center text-slate-500">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-sky-500 rounded-2xl p-8 text-white shadow-md shadow-sky-200">
        <h2 className="text-2xl font-bold mb-1">Selamat datang di Portal Karyawan!</h2>
        <p className="text-sky-100">Cek rekap absensi dan unduh slip gaji Anda di sini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                <Clock size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Ringkasan Bulan Ini</h3>
            </div>
            <Link to="/portal/attendance" className="text-sm font-medium text-sky-600 flex items-center hover:text-sky-700">
              Detail <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Periode: {summary.period}</p>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
              <span className="text-slate-600 dark:text-slate-300">Total Eksepsi (Izin/Sakit/Alfa)</span>
              <span className="font-semibold text-slate-800 dark:text-white">{summary.eksepsi} Hari</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 dark:text-slate-300">Total Overtime (OT)</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{summary.ot} Jam</span>
            </div>
          </div>
        </div>

        {/* Payslip Summary */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Slip Gaji Terakhir</h3>
            </div>
            <Link to="/portal/payslips" className="text-sm font-medium text-sky-600 flex items-center hover:text-sky-700">
              Lihat Semua <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          
          {latestSlip ? (
              <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Bulan: <span className="font-medium text-slate-700 dark:text-slate-200">{latestSlip.period}</span></p>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-slate-600 dark:text-slate-300">Total Penerimaan</span>
                  <span className="font-medium text-slate-800 dark:text-white">Rp {latestSlip.totalPendapatan.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50">
                  <span className="text-slate-600 dark:text-slate-300">Total Potongan</span>
                  <span className="font-medium text-red-600 dark:text-red-400">- Rp {latestSlip.totalPotongan.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="font-bold text-slate-800 dark:text-white">Take Home Pay</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">Rp {latestSlip.takeHomePay.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <Link 
                to="/portal/payslips"
                className="mt-4 w-full py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center"
              >
                Unduh PDF
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FileText size={48} className="mb-2 opacity-20" />
              <p>Belum ada slip gaji yang diterbitkan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
