import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Clock, FileText, LogOut, FileSpreadsheet, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ChatBot from './ChatBot';

export default function Layout({ role = 'hrd' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const hrdMenu = [
    { name: 'Dashboard', path: '/hrd', icon: <LayoutDashboard size={20} /> },
    { name: 'Karyawan', path: '/hrd/employees', icon: <Users size={20} /> },
    { name: 'Absensi', path: '/hrd/attendance', icon: <Clock size={20} /> },
    { name: 'Payroll & Slip', path: '/hrd/payroll', icon: <FileSpreadsheet size={20} /> },
    { name: 'Profil & Pengaturan', path: '/hrd/profile', icon: <Settings size={20} /> },
  ];

  const employeeMenu = [
    { name: 'Beranda', path: '/portal', icon: <LayoutDashboard size={20} /> },
    { name: 'Riwayat Absensi', path: '/portal/attendance', icon: <Clock size={20} /> },
    { name: 'Slip Gaji', path: '/portal/payslips', icon: <FileText size={20} /> },
  ];

  const menus = role === 'hrd' ? hrdMenu : employeeMenu;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-colors duration-200">
        <div className="h-20 flex items-center justify-center px-6 border-b border-slate-100 dark:border-slate-700 py-4">
          <img src="/logo.png" alt="Logo DBG" className="max-h-full max-w-full object-contain dark:bg-white dark:p-1 dark:rounded-xl" onError={(e) => {
            e.target.onerror = null;
            e.target.outerHTML = '<h1 class="text-xl font-bold text-sky-600">DBG HRD</h1>';
          }} />
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menus.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 font-medium' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-8 shadow-sm z-10 transition-colors duration-200">
          <h2 className="text-lg font-medium text-slate-800 dark:text-white">
            {menus.find(m => m.path === location.pathname)?.name || 'Dashboard'}
          </h2>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
      
      {/* AI Assistant ChatBot - Only for HRD */}
      {role === 'hrd' && <ChatBot />}
    </div>
  );
}
