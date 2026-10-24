import React, { useState } from 'react';
import AnayaCraftLogo from '../Common/AnayaCraftLogo';
import {
  User,
  Lock,
  AlertCircle,
  ArrowRight,
  LogOut
} from 'lucide-react';

export default function LoginModal({
  isOpen,
  onClose,
  currentUser,
  activeTenant,
  onLoginSuccess,
  onLogout
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Login failed.');
      }

      // Store token & session
      localStorage.setItem('dental_auth_token', data.token);
      localStorage.setItem('dental_user', JSON.stringify(data.user));
      localStorage.setItem('dental_tenant', JSON.stringify(data.activeTenant));

      onLoginSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-white rounded-2xl p-1.5 shadow-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                <img
                  src="/anaya-craft-icon.png"
                  alt="Anaya Craft"
                  className="w-full h-full object-contain select-none"
                />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Dental Practice Login</span>
                  <span className="text-[10px] bg-blue-500/40 text-blue-200 px-2 py-0.5 rounded-full font-mono uppercase">
                    Secure
                  </span>
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Sign in with your individual clinic credentials.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg text-lg font-bold"
              title="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Current Logged In Status Badge */}
          {currentUser && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-blue-300">Logged in as:</span>
                <strong className="text-white font-bold">{currentUser.name}</strong>
                <span className="bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">
                  {currentUser.role || currentUser.globalRole}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center space-x-1 text-red-300 hover:text-red-100 font-bold transition text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Credentials Bar */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              1-Click Demo Credentials:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@nepaldental.com.np');
                  setPassword('Admin@123');
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 transition"
                title="Login as Nepal Dental Clinic Owner / Super Admin"
              >
                👑 Clinic Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('dr.mukesh@nepaldental.com.np');
                  setPassword('Doctor@123');
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition"
                title="Login as Lead Dental Surgeon Dr. Mukesh Kushwaha"
              >
                🩺 Dr. Mukesh
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('dr.anita@nepaldental.com.np');
                  setPassword('DoctorAnita@2026');
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 transition"
                title="Login as Orthodontist & Clinic Admin Dr. Anita Sharma"
              >
                ✨ Dr. Anita (Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('reception@nepaldental.com.np');
                  setPassword('Reception@123');
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition"
                title="Login as Receptionist Sita Thapa"
              >
                📋 Reception
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('devadmin@anacraft.com');
                  setPassword('DevAdmin@123');
                }}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 transition"
                title="Login as Anaya Craft Platform Developer Admin"
              >
                💻 Dev Admin
              </button>
            </div>
          </div>

          {/* Individual Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@nepaldental.com.np"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In & Authenticate'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Official Branding with 100% Visible Text */}
          <div className="pt-2 pb-1 border-t border-slate-100 flex items-center justify-center select-none">
            <AnayaCraftLogo variant="brand-card" size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
