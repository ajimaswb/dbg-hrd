import React, { useState, useEffect, useCallback } from 'react';
import { Search, Save, X, Clock, AlertCircle, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { getEmployees } from '../../utils/employeeService';
import { getAttendanceByDate, saveAttendance } from '../../utils/attendanceService';

export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLine, setFilterLine] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const defaultHours = 9;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [formData, setFormData] = useState({
    status: 'sakit',
    ot_hours: 0,
    notes: ''
  });


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const emps = await getEmployees();
      setEmployees(emps);
      
      const records = await getAttendanceByDate(date);
      const recordMap = {};
      records.forEach(r => {
        recordMap[r.employeeId] = r;
      });
      setAttendanceRecords(recordMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uniqueLines = [...new Set(employees.map(e => e.line).filter(Boolean))].sort();
  const uniqueDepartments = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                          emp.nik.toLowerCase().includes(search.toLowerCase());
    const matchesLine = filterLine ? emp.line === filterLine : true;
    const matchesDept = filterDepartment ? emp.department === filterDepartment : true;
    return matchesSearch && matchesLine && matchesDept;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';

    // Handle special sorting for attendance status and OT
    if (sortConfig.key === 'status') {
      aVal = attendanceRecords[a.id]?.status || 'hadir';
      bVal = attendanceRecords[b.id]?.status || 'hadir';
    } else if (sortConfig.key === 'ot') {
      aVal = attendanceRecords[a.id]?.ot_hours || 0;
      bVal = attendanceRecords[b.id]?.ot_hours || 0;
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });


  const handleOpenModal = (emp) => {
    setSelectedEmp(emp);
    const existing = attendanceRecords[emp.id];
    setFormData({
      status: existing?.status && existing.status !== 'hadir' ? existing.status : 'sakit',
      ot_hours: existing?.ot_hours || 0,
      actual_hours: existing?.actual_hours || defaultHours,
      notes: existing?.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await saveAttendance(date, selectedEmp.id, {
        status: formData.status,
        ot_hours: Number(formData.ot_hours),
        actual_hours: formData.status === 'hadir_sebagian' ? Number(formData.actual_hours) : defaultHours,
        notes: formData.notes
      });
      setShowModal(false);
      fetchData();
    } catch (e) {
      alert("Gagal menyimpan data absensi: " + e.message);
    }
  };

  const markAsHadir = async (empId) => {
    try {
      await saveAttendance(date, empId, {
        status: 'hadir',
        ot_hours: 0,
        notes: 'Dihapus dari eksepsi'
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Absensi</h2>
          <p className="text-slate-500 text-sm">Catat absensi di luar kehadiran normal dan jam lembur (OT).</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 pl-2">Tanggal:</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border-none bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-1.5 focus:ring-0 text-slate-700 dark:text-slate-200 font-medium [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-start space-x-3">
        <AlertCircle className="text-sky-500 mt-0.5 flex-shrink-0" size={20} />
        <p className="text-sm text-sky-800">
          <strong>Catatan HRD:</strong> Sistem ini menggunakan metode <em>Exception</em>. Artinya, seluruh karyawan 
          secara otomatis dianggap <strong>Hadir</strong>. Anda hanya perlu menginput karyawan yang Sakit, Izin, Cuti, Alfa, atau yang memiliki jam Lembur (OT).
        </p>
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
          
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 appearance-none"
              >
                <option value="">Semua Dept</option>
                {uniqueDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div className="relative w-full sm:w-40">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <select
                value={filterLine}
                onChange={(e) => setFilterLine(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 appearance-none"
              >
                <option value="">Semua Line</option>
                {uniqueLines.map(l => (
                  <option key={l} value={l}>Line {l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-white dark:bg-slate-800 sticky top-0 border-b border-slate-200 dark:border-slate-600 shadow-sm text-slate-500 z-10">
              <tr>
                <th onClick={() => handleSort('name')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Karyawan {getSortIcon('name')}</th>
                <th onClick={() => handleSort('department')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Departemen {getSortIcon('department')}</th>
                <th onClick={() => handleSort('line')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Line {getSortIcon('line')}</th>
                <th onClick={() => handleSort('status')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Status Absen {getSortIcon('status')}</th>
                <th onClick={() => handleSort('ot')} className="px-6 py-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Lembur (OT) {getSortIcon('ot')}</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">Karyawan tidak ditemukan.</td>
                </tr>
              ) : (
                sortedEmployees.map((emp) => {
                  const record = attendanceRecords[emp.id];
                  const isException = record && record.status && record.status !== 'hadir';
                  const hasOt = record && record.ot_hours > 0;
                  
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-800 dark:text-white">{emp.name}</div>
                        <div className="text-xs text-slate-400">{emp.nik}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-slate-700 dark:text-slate-300">{emp.department}</span>
                      </td>
                      <td className="px-6 py-3">
                        {emp.line ? <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">Line {emp.line}</span> : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-3">
                        {isException ? (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider
                            ${record.status === 'sakit' ? 'bg-orange-100 text-orange-700' : ''}
                            ${record.status === 'izin' ? 'bg-blue-100 text-blue-700' : ''}
                            ${record.status === 'alfa' ? 'bg-red-100 text-red-700' : ''}
                            ${record.status === 'cuti' ? 'bg-purple-100 text-purple-700' : ''}
                            ${record.status === 'hadir_sebagian' ? 'bg-yellow-100 text-yellow-700' : ''}
                          `}>
                            {record.status.replace('_', ' ')}
                            {record.status === 'hadir_sebagian' && ` (${record.actual_hours} Jam)`}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600">
                            Hadir
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {hasOt ? (
                          <span className="flex items-center space-x-1 text-sky-600 font-semibold bg-sky-50 px-2 py-1 rounded-md w-max">
                            <Clock size={14} />
                            <span>{record.ot_hours} Jam</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {(isException || hasOt) ? (
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => handleOpenModal(emp)} className="text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                            <button onClick={() => markAsHadir(emp.id)} className="text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">Batal</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleOpenModal(emp)}
                            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-sky-700 border border-slate-200 dark:border-slate-600 hover:border-sky-200 hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Input Absen / OT
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Input Data: {selectedEmp.name}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status Kehadiran</label>
                <div className="grid grid-cols-2 gap-3">
                  {['sakit', 'izin', 'alfa', 'cuti', 'hadir_sebagian'].map(s => (
                    <label key={s} className={`
                      flex items-center justify-center px-4 py-3 border rounded-xl cursor-pointer transition-all text-center
                      ${formData.status === s ? 'border-sky-500 bg-sky-50 text-sky-700 font-semibold shadow-sm' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50'}
                    `}>
                      <input 
                        type="radio" 
                        name="status" 
                        value={s} 
                        checked={formData.status === s}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev, 
                            status: val,
                            ...( ['sakit', 'izin', 'alfa', 'cuti'].includes(val) ? { ot_hours: 0 } : {} )
                          }));
                        }}
                        className="sr-only" 
                      />
                      <span className="capitalize">{s.replace('_', ' ')}</span>
                    </label>
                  ))}
                  <label className={`
                      col-span-1 flex items-center justify-center px-4 py-3 border rounded-xl cursor-pointer transition-all text-center
                      ${formData.status === 'hadir' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold shadow-sm' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50'}
                    `}>
                      <input 
                        type="radio" 
                        name="status" 
                        value="hadir" 
                        checked={formData.status === 'hadir'}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="sr-only" 
                      />
                      <span>Hadir (Full)</span>
                    </label>
                </div>
              </div>

              {formData.status === 'hadir_sebagian' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Jam Kerja Aktual</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="9"
                      value={formData.actual_hours}
                      onChange={(e) => setFormData({...formData, actual_hours: e.target.value})}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium text-slate-800 dark:text-white"
                    />
                    <span className="text-slate-500 font-medium">Jam</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Isi berapa jam Karyawan tersebut masuk (Normal: {defaultHours} Jam).</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jam Lembur (OT)</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    value={formData.ot_hours}
                    onChange={(e) => setFormData({...formData, ot_hours: e.target.value})}
                    disabled={['sakit', 'izin', 'alfa', 'cuti'].includes(formData.status)}
                    className={`w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-medium ${['sakit', 'izin', 'alfa', 'cuti'].includes(formData.status) ? 'text-slate-400 opacity-50 cursor-not-allowed' : 'text-slate-800 dark:text-white'}`}
                  />
                  <span className="text-slate-500 font-medium">Jam</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Isi 0 jika tidak ada lembur.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea 
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:bg-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  placeholder="Misal: Surat keterangan dokter terlampir"
                ></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl shadow-lg shadow-sky-200 transition-colors flex items-center justify-center space-x-2">
                  <Save size={18} />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
