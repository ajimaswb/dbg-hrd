import React, { useState, useEffect } from 'react';
import { Users, Clock, FileSpreadsheet, Building2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployees } from '../../utils/employeeService';
import { getAttendanceByMonth, getAttendanceByDateRange } from '../../utils/attendanceService';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#64748b'];

export default function HrdDashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([
    { name: 'Senin', hadir: 0, absen: 0 },
    { name: 'Selasa', hadir: 0, absen: 0 },
    { name: 'Rabu', hadir: 0, absen: 0 },
    { name: 'Kamis', hadir: 0, absen: 0 },
    { name: 'Jumat', hadir: 0, absen: 0 },
    { name: 'Sabtu', hadir: 0, absen: 0 },
  ]);
  const [attendanceByLineData, setAttendanceByLineData] = useState([]);
  const [todayExceptions, setTodayExceptions] = useState({ total: 0, izin: 0, sakit: 0, alfa: 0, cuti: 0 });
  const [loading, setLoading] = useState(true);
  const [lineChartLoading, setLineChartLoading] = useState(false);
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [lineStartDate, setLineStartDate] = useState(todayDateStr);
  const [lineEndDate, setLineEndDate] = useState(todayDateStr);

  const monthsIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentMonthName = `${monthsIndo[new Date().getMonth()]} ${new Date().getFullYear()}`;

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const hour = new Date().getHours();
  let greeting = 'Pagi';
  if (hour >= 11 && hour < 15) greeting = 'Siang';
  else if (hour >= 15 && hour < 18) greeting = 'Sore';
  else if (hour >= 18) greeting = 'Malam';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const d = new Date();
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        const [empData, attData] = await Promise.all([
          getEmployees(),
          getAttendanceByMonth(yearMonth)
        ]);
        setEmployees(empData);
        
        // Calculate current week Mon-Sat
        const curr = new Date();
        // getDay() is 0 (Sun) to 6 (Sat). If Sunday (0), Monday was -6 days ago. 
        const dayOfWeek = curr.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const weekDates = [];
        for (let i = 0; i < 6; i++) {
          const dayDate = new Date(curr.getTime());
          dayDate.setDate(curr.getDate() + diffToMonday + i);
          const y = dayDate.getFullYear();
          const m = String(dayDate.getMonth() + 1).padStart(2, '0');
          const dStr = String(dayDate.getDate()).padStart(2, '0');
          weekDates.push(`${y}-${m}-${dStr}`);
        }

        const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const trend = weekDates.map((dateStr, index) => {
          if (dateStr > todayStr) {
            return { name: days[index], hadir: null, absen: null, persentase: null };
          }
          const recordsForDay = attData.filter(r => r.date === dateStr);
          const absen = recordsForDay.filter(r => r.status !== 'hadir' && r.status !== 'hadir_sebagian').length;
          const hadir = empData.length > 0 ? empData.length - absen : 0;
          const persentase = empData.length > 0 ? Number(((hadir / empData.length) * 100).toFixed(1)) : 0;
          return { name: days[index], hadir, absen, persentase };
        });
        
        setAttendanceData(trend);

        // Calculate today's exceptions
        const todayRecords = attData.filter(r => r.date === todayStr && r.status !== 'hadir' && r.status !== 'hadir_sebagian');
        
        setTodayExceptions({
          total: todayRecords.length,
          izin: todayRecords.filter(r => r.status === 'izin').length,
          sakit: todayRecords.filter(r => r.status === 'sakit').length,
          alfa: todayRecords.filter(r => r.status === 'alfa').length,
          cuti: todayRecords.filter(r => r.status === 'cuti').length
        });
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLineChartData = async () => {
      if (employees.length === 0) return;
      setLineChartLoading(true);
      try {
        const records = await getAttendanceByDateRange(lineStartDate, lineEndDate);
        
        // calculate days difference
        const start = new Date(lineStartDate);
        const end = new Date(lineEndDate);
        let workingDays = 0;
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getDay() !== 0) workingDays++; // Exclude Sundays
        }
        
        if (workingDays === 0) workingDays = 1;

        const linesData = {};
        employees.forEach(emp => {
          if (emp.line) {
            if (!linesData[emp.line]) {
              linesData[emp.line] = { name: `Line ${emp.line}`, hadir: 0, absen: 0, total: 0 };
            }
            linesData[emp.line].total += 1;
            
            // Get records for this employee within the date range
            const empRecords = records.filter(r => r.employeeId === emp.id && r.status !== 'hadir' && r.status !== 'hadir_sebagian');
            
            const exceptionCount = empRecords.length;
            const presenceCount = workingDays - exceptionCount;
            
            linesData[emp.line].absen += exceptionCount;
            linesData[emp.line].hadir += (presenceCount > 0 ? presenceCount : 0);
          }
        });

        const lineChartData = Object.values(linesData)
          .map(line => ({
            ...line,
            persentase: (line.total > 0 && workingDays > 0) ? Number(((line.hadir / (line.total * workingDays)) * 100).toFixed(1)) : 0
          }))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
        setAttendanceByLineData(lineChartData);

      } catch (error) {
        console.error(error);
      } finally {
        setLineChartLoading(false);
      }
    };
    
    fetchLineChartData();
  }, [lineStartDate, lineEndDate, employees]);

  // Compute department composition (Sewing vs Non-Sewing)
  const deptCounts = employees.reduce((acc, emp) => {
    const isSewing = emp.department === 'Sewing' && emp.position === 'Operator';
    const category = isSewing ? 'Sewing' : 'Non Sewing';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, { 'Sewing': 0, 'Non Sewing': 0 });

  const pieData = Object.keys(deptCounts).map(key => ({
    name: key,
    value: deptCounts[key]
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Selamat {greeting}, {currentUser?.displayName?.split(' ')[0] || 'HRD'}! 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Berikut adalah ringkasan data HR hari ini.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Karyawan</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{loading ? '...' : employees.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Departemen</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{loading ? '...' : new Set(employees.map(emp => emp.department)).size}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Absensi Hari Ini</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{loading ? '...' : todayExceptions.total}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {loading ? 'Memuat...' : (
                [
                  todayExceptions.sakit > 0 ? `${todayExceptions.sakit} Sakit` : null,
                  todayExceptions.izin > 0 ? `${todayExceptions.izin} Izin` : null,
                  todayExceptions.alfa > 0 ? `${todayExceptions.alfa} Alfa` : null,
                  todayExceptions.cuti > 0 ? `${todayExceptions.cuti} Cuti` : null,
                ].filter(Boolean).join(', ') || 'Semua Hadir'
              )}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Draft Payroll Aktif</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{currentMonthName}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Komposisi Karyawan Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
            <Users size={18} className="mr-2 text-slate-400 dark:text-slate-500" /> Komposisi Karyawan
          </h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 dark:text-slate-500">Memuat grafik...</div>
          ) : pieData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 dark:text-slate-500">Belum ada data</div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`${value} Orang`, 'Jumlah']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tren Kehadiran Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 transition-colors">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center">
            <TrendingUp size={18} className="mr-2 text-slate-400 dark:text-slate-500" /> Tren Kehadiran Minggu Ini
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={attendanceData}
                margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar yAxisId="left" dataKey="hadir" name="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="left" dataKey="absen" name="Absensi" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="persentase" name="% Kehadiran" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tingkat Kehadiran Per Line Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 transition-colors lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
              <Building2 size={18} className="mr-2 text-slate-400 dark:text-slate-500" /> Kehadiran Tiap Line
            </h3>
            
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-600">
              <input 
                type="date"
                value={lineStartDate}
                onChange={e => setLineStartDate(e.target.value)}
                className="text-sm bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 py-1 [color-scheme:light] dark:[color-scheme:dark]"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date"
                value={lineEndDate}
                onChange={e => setLineEndDate(e.target.value)}
                className="text-sm bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 py-1 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {lineChartLoading ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 dark:text-slate-500">Memuat grafik...</div>
          ) : attendanceByLineData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 dark:text-slate-500">Belum ada data line</div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={attendanceByLineData}
                  margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar yAxisId="left" dataKey="hadir" name="Hadir" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Bar yAxisId="left" dataKey="absen" name="Absensi" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  <Line yAxisId="right" type="monotone" dataKey="persentase" name="% Kehadiran" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions / Info */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl shadow-sm p-6 text-white flex flex-col md:flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Siap untuk memproses Payroll bulan ini?</h3>
          <p className="text-sky-100 text-sm">Pastikan semua absensi telah ditinjau sebelum mengkalkulasi payroll.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button onClick={() => navigate('/hrd/attendance')} className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-medium transition-colors border border-white/20 flex items-center">
            <CheckCircle2 size={16} className="mr-2" />
            Tinjau Absensi
          </button>
        </div>
      </div>
    </div>
  );
}
