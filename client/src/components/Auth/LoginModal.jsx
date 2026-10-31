import React, { useState } from 'react';
import AnayaCraftLogo from '../Common/AnayaCraftLogo';
import {
  User,
  Lock,
  AlertCircle,
  ArrowRight,
  LogOut,
  Phone,
  Mail,
  Headphones,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

// Dedicated Official WhatsApp Vector Icon
function WhatsAppIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function LoginModal({
  isOpen,
  onClose,
  currentUser,
  activeTenant,
  onLoginSuccess,
  onLogout
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  // Customer Support Contact Details
  const supportPhone = activeTenant?.supportPhone || '+977 98012 34567';
  const supportPhoneClean = supportPhone.replace(/[^0-9+]/g, '');
  const supportEmail = activeTenant?.supportEmail || 'support@anacraft.com';
  const whatsAppDigits = supportPhone.replace(/[^0-9]/g, '');
  const whatsAppLink = `https://wa.me/${whatsAppDigits}?text=${encodeURIComponent('Hello Anaya Craft Support, I need assistance with Dental Practice ERP.')}`;

  const handleCopySupportInfo = () => {
    const text = `Customer Support - Anaya Craft Dental ERP\nPhone: ${supportPhone}\nWhatsApp: ${supportPhone}\nEmail: ${supportEmail}\nPortal: https://anacraft.com`;
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const identifier = username.trim();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, email: identifier, password })
      });

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          if (!res.ok) {
            throw new Error(`Backend server is connecting or not responding (HTTP ${res.status}). Please ensure backend is running.`);
          }
          throw new Error('Server returned an unexpected response. Please try again.');
        }
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Login failed. Please check your credentials.');
      }

      // Store token & session
      localStorage.setItem('dental_auth_token', data.token);
      localStorage.setItem('dental_user', JSON.stringify(data.user));
      localStorage.setItem('dental_tenant', JSON.stringify(data.activeTenant));

      onLoginSuccess(data);
      if (onClose) onClose();
    } catch (err) {
      if (err.name === 'SyntaxError' || (err.message && err.message.includes('Unexpected token'))) {
        setError('Backend server is currently restarting or unavailable. Please retry in a few seconds.');
      } else {
        setError(err.message || 'Login failed. Please check credentials or network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn ${
        currentUser
          ? 'bg-slate-900/40 backdrop-blur-xs'
          : 'bg-gradient-to-br from-slate-100 via-white to-blue-50/50'
      }`}
    >
      {/* Decorative ambient subtle blooms for standalone login screen */}
      {!currentUser && (
        <>
          <div className="absolute w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -top-32 -left-32 pointer-events-none" />
          <div className="absolute w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -bottom-32 -right-32 pointer-events-none" />
          <div className="absolute w-[450px] h-[450px] bg-cyan-400/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        </>
      )}

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] relative z-10">
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
                  Sign in with your username to access your practice.
                </p>
              </div>
            </div>

            {/* Only allow closing if already logged in */}
            {currentUser && onClose && (
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white p-1 rounded-lg text-lg font-bold"
                title="Close modal"
              >
                ✕
              </button>
            )}
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
                    if (onClose) onClose();
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
            <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Enter username (e.g. devadmin, nepaladmin, apexadmin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In & Access Practice'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Redesigned Customer Support & Helpdesk Section */}
          <div className="pt-3 border-t border-slate-200/90 space-y-3">
            <div className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2.5">
              {/* Support Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span>Customer Support & Helpdesk</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Online</span>
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Need help with sign in or credentials?
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopySupportInfo}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition flex items-center space-x-1"
                  title="Copy support contact details"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy Info</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3 Contact Action Cards: Phone, WhatsApp, Email */}
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Direct Phone Call */}
                <a
                  href={`tel:${supportPhoneClean}`}
                  className="p-2 rounded-xl bg-white hover:bg-blue-50/90 border border-slate-200 hover:border-blue-400 transition group shadow-2xs flex flex-col items-center justify-center text-center"
                  title={`Call Support: ${supportPhone}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition mb-1">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 leading-tight">
                    Phone Call
                  </span>
                  <span className="text-[9px] text-slate-500 group-hover:text-blue-600 font-mono leading-tight mt-0.5 truncate w-full">
                    {supportPhone}
                  </span>
                </a>

                {/* 2. WhatsApp Direct Live Chat */}
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white hover:bg-emerald-50/90 border border-slate-200 hover:border-emerald-400 transition group shadow-2xs flex flex-col items-center justify-center text-center"
                  title="Chat directly on WhatsApp"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 group-hover:bg-[#25D366] text-[#25D366] group-hover:text-white flex items-center justify-center transition mb-1">
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 leading-tight">
                    WhatsApp
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold leading-tight mt-0.5">
                    Live Chat ↗
                  </span>
                </a>

                {/* 3. Email Support Desk */}
                <a
                  href={`mailto:${supportEmail}?subject=Dental%20Practice%20ERP%20Support%20Request`}
                  className="p-2 rounded-xl bg-white hover:bg-indigo-50/90 border border-slate-200 hover:border-indigo-400 transition group shadow-2xs flex flex-col items-center justify-center text-center"
                  title={`Email Support: ${supportEmail}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition mb-1">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 leading-tight">
                    Email Desk
                  </span>
                  <span className="text-[9px] text-slate-500 group-hover:text-indigo-600 font-mono leading-tight mt-0.5 truncate w-full">
                    {supportEmail}
                  </span>
                </a>
              </div>
            </div>

            {/* Official Anaya Craft Branding Footer */}
            <div className="pt-0.5 flex flex-col items-center justify-center text-center select-none">
              <AnayaCraftLogo variant="brand-card" size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
