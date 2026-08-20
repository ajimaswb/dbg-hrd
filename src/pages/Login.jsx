import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(identifier, password);
      // AuthContext akan mendeteksi role dari Firestore dan App.jsx RequireAuth yang akan mengarahkan
      navigate('/hrd'); // Secara default navigate ke HRD, nanti RequireAuth bisa merevisi jika rolenya employee
    } catch (err) {
      console.error(err);
      
      const cleanId = identifier.trim().toLowerCase();
      const cleanNik = cleanId.replace(/\s+/g, '');
      
      // Auto-create HRD account if doesn't exist
      if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') && (cleanId === 'hrd@dbg.com' || cleanId === 'hrd' || cleanNik === 'dbg1703011487')) {
        try {
          await createUserWithEmailAndPassword(auth, 'hrd@dbg.com', password);
          navigate('/hrd');
          return;
        } catch (createErr) {
          console.error("Gagal membuat akun HRD:", createErr);
        }
      }

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        setError('NIK/Email atau Password salah');
      } else {
        setError('Gagal masuk. Cek koneksi Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo DBG" className="h-20 mx-auto mb-4 object-contain" onError={(e) => {
            e.target.onerror = null; 
            e.target.style.display = 'none';
            document.getElementById('fallback-logo').style.display = 'flex';
          }} />
          <div id="fallback-logo" className="w-16 h-16 bg-sky-500 text-white rounded-2xl hidden items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-200">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">DBG HRD System</h1>
          <p className="text-slate-500 mt-2">Masuk ke akun Anda</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NIK atau Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors bg-slate-50 focus:bg-white text-slate-900"
                placeholder="Contoh: DBG 12345 atau hrd@dbg.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors bg-slate-50 focus:bg-white text-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 text-sm">
            <span className="text-slate-400 cursor-help" title="Gunakan NIK atau Email Anda untuk masuk">Butuh bantuan?</span>
            <button 
              type="button" 
              onClick={() => alert('Jika menggunakan NIK, silakan hubungi HRD. Jika menggunakan Email asli, hubungi tim IT.')}
              className="text-sky-500 hover:text-sky-600 font-medium hover:underline"
            >
              Lupa Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 text-white font-semibold py-3 rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-sky-200 disabled:opacity-50"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
