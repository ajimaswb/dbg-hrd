import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Layout & Auth
import Layout from './components/Layout';
import Login from './pages/Login';

import HrdDashboard from './pages/hrd/Dashboard';
import Employees from './pages/hrd/Employees';
import Attendance from './pages/hrd/Attendance';
import Payroll from './pages/hrd/Payroll';
import Profile from './pages/hrd/Profile';

// Portal Pages
import PortalDashboard from './pages/portal/Dashboard';
import PortalAttendance from './pages/portal/Attendance';
import PortalPayslips from './pages/portal/Payslips';

function RequireAuth({ children, allowedRole }) {
  const { currentUser, userRole } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika userRole belum selesai dimuat, kita bisa mengembalikan null atau loader sementara
  if (userRole === null) {
    return <div className="p-8 text-center text-slate-500">Memeriksa hak akses...</div>;
  }

  if (allowedRole && userRole !== allowedRole) {
    // Redirect to their respective dashboard if they try to access wrong role page
    return <Navigate to={userRole === 'hrd' ? '/hrd' : '/portal'} replace />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* HRD Routes */}
        <Route path="/hrd" element={<RequireAuth allowedRole="hrd"><Layout role="hrd" /></RequireAuth>}>
          <Route index element={<HrdDashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<div className="p-8 text-center text-slate-500">Halaman sedang dibangun...</div>} />
        </Route>

        {/* Employee Portal Routes */}
        <Route path="/portal" element={<RequireAuth allowedRole="employee"><Layout role="employee" /></RequireAuth>}>
          <Route index element={<PortalDashboard />} />
          <Route path="attendance" element={<PortalAttendance />} />
          <Route path="payslips" element={<PortalPayslips />} />
          <Route path="*" element={<div className="p-8 text-center text-slate-500">Halaman sedang dibangun...</div>} />
        </Route>
      </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
