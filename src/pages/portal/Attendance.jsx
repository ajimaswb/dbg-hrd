import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceByEmployee } from '../../utils/attendanceService';

export default function PortalAttendance() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAttendanceByEmployee(currentUser.uid);
      setAttendance(data);
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

  const filteredAttendance = attendance.filter(record => record.date.startsWith(month));

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data absensi...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Riwayat Absensi</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pantau kehadiran dan overtime Anda.</p>
        </div>
        <div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-transparent focus:ring-2 focus:ring-sky-500 outline-none text-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-sm">
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Jam Masuk</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Jam Pulang</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Overtime</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">{record.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
                        record.status === 'hadir' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                        record.status === 'sakit' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                        record.status === 'izin' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                        'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.time_in || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.time_out || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.ot_hours ? `${record.ot_hours} Jam` : '-'}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{record.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Tidak ada data absensi untuk bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
