import React, { useState, useRef, useEffect } from 'react';
import ThemeSwitcher from './Common/ThemeSwitcher';
import {
  Activity,
  User,
  Calendar,
  MessageSquare,
  Sparkles,
  Receipt,
  Pill,
  ChevronDown,
  Bell,
  Plus,
  Search,
  ShieldCheck,
  Building,
  LogOut,
  Stethoscope,
  Crown,
  MapPin,
  CreditCard,
  Menu,
  X,
  Settings,
  UserCog,
  ArrowLeftRight,
  ChevronRight
} from 'lucide-react';

export default function Navbar({
  clinicProfile = {},
  patients = [],
  selectedPatient,
  onSelectPatient,
  onQuickBook,
  currentUser,
  activeTenant,
  availableTenants = [],
  onSwitchTenant,
  onOpenLoginModal,
  onLogout,
  onOpenSubscription,
  onToggleSidebar,
  isSidebarOpen = false,
  onNavigate
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const settingsMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? patients.filter(p =>
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.phone && p.phone.includes(searchQuery)) ||
        (p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const role = currentUser?.role || 'DOCTOR';
  const isPlatformAdmin = currentUser?.globalRole === 'PLATFORM_ADMIN';

  // Role Badge Styling
  const roleBadge = isPlatformAdmin ? {
    label: 'Platform Admin',
    bg: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: Crown
  } : role === 'CLINIC_ADMIN' ? {
    label: 'Super Admin',
    bg: 'bg-blue-100 text-blue-900 border-blue-300',
    icon: ShieldCheck
  } : role === 'DOCTOR' ? {
    label: 'Doctor',
    bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: Stethoscope
  } : {
    label: 'Receptionist',
    bg: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: User
  };

  const RoleIcon = roleBadge.icon;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-3 sm:px-6 h-14 sm:h-16 flex items-center shadow-2xs no-print">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Clinic Info with Mobile Hamburger Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 -ml-1 rounded-xl lg:hidden flex items-center justify-center transition flex-shrink-0 ${
              isSidebarOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isSidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-label={isSidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-blue-600" />
            ) : (
              <Menu className="w-5 h-5 text-slate-700" />
            )}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 overflow-hidden flex-shrink-0">
            {clinicProfile.logo ? (
              <img src={clinicProfile.logo} alt="Clinic Logo" className="w-full h-full object-contain p-0.5 bg-white rounded-lg" />
            ) : (
              <span className="text-xl">🦷</span>
            )}
          </div>
          <div className="min-w-0">
            {/* Static Clinic Name (Royal Blue & Indigo Gradient) & Live Indicator */}
            <div className="flex items-center space-x-2">
              <h1
                className="text-xs sm:text-sm md:text-base font-extrabold text-blue-950 tracking-tight leading-normal truncate max-w-[135px] min-[400px]:max-w-[200px] sm:max-w-[360px] md:max-w-[480px] lg:max-w-[560px]"
                title={clinicProfile.name || 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.'}
              >
                {clinicProfile.name || 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.'}
              </h1>
              <span className="hidden sm:inline-flex items-center bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                Live ●
              </span>
            </div>

            {/* Below: Dental Address */}
            <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-500 font-medium leading-none">
              <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
              <span className="truncate max-w-[130px] min-[400px]:max-w-[190px] sm:max-w-[320px] md:max-w-[460px] text-slate-600 font-medium" title={clinicProfile.address || 'Gaushala-12 Mahaottari Nepal'}>
                {clinicProfile.address || 'Gaushala-12 Mahaottari Nepal'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Patient Search Bar with Search Button & Active Patient */}
        <div ref={searchContainerRef} className="relative hidden xl:flex items-center space-x-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchResults.length > 0) {
                onSelectPatient(searchResults[0]);
                setSearchQuery('');
                setShowDropdown(false);
              }
            }}
            className="flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition"
          >
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 ml-2.5 mr-1 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search patient by name or phone..."
                className="w-44 lg:w-56 py-1.5 text-xs text-slate-900 bg-transparent focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowDropdown(false);
                  }}
                  className="px-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-2 flex items-center space-x-1 transition flex-shrink-0"
              title="Search patient by name or phone number"
            >
              <Search className="w-3 h-3" />
              <span>Search</span>
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 font-medium">
                  No patient found matching "{searchQuery}"
                </div>
              ) : (
                searchResults.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPatient(p);
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className="w-full text-left p-2.5 hover:bg-blue-50 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Phone: {p.phone} • {p.id}
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                      Select
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Active Patient Pill */}
          {selectedPatient && (
            <div className="hidden 2xl:flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-900 px-2.5 py-1 rounded-xl text-xs">
              <span className="text-[10px] text-blue-500 font-bold uppercase">Active:</span>
              <strong className="truncate max-w-[110px]">{selectedPatient.name}</strong>
            </div>
          )}
        </div>

        {/* Right Actions: User Profile, Theme Switcher & Session */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          {/* UI Theme Switcher */}
          <ThemeSwitcher />

          {/* User & Role Badge */}
          <div
            onClick={onOpenLoginModal}
            className="flex items-center space-x-2 cursor-pointer group"
            title="Click to view profile or sign in"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-slate-200 transition">
              <RoleIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition leading-tight block">
                  {currentUser?.name || 'Dr. Mukesh Kushwaha'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 leading-tight block font-medium">
                {activeTenant?.name ? activeTenant.name.split(' ')[0] : 'Nepal Dental'}
              </span>
            </div>
          </div>

          {/* Settings & Account Menu (Replaces standalone Logout button) */}
          <div ref={settingsMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setSettingsOpen(prev => !prev)}
              className={`p-2 rounded-xl transition flex items-center justify-center border ${
                settingsOpen
                  ? 'bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-100 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200 shadow-2xs'
              }`}
              title="Settings & System Menu"
              aria-expanded={settingsOpen}
              aria-haspopup="true"
            >
              <Settings className={`w-4 h-4 transition-transform duration-200 ${settingsOpen ? 'rotate-90 text-blue-600' : 'text-slate-600'}`} />
            </button>

            {/* Dropdown Menu */}
            {settingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                {/* 1. Account Summary Card */}
                <div className="p-3.5 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      <RoleIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate block">
                          {currentUser?.name || 'Dr. Mukesh Kushwaha'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${roleBadge.bg}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        {currentUser?.email || 'No email attached'}
                      </div>
                      <div className="text-[11px] text-blue-700 font-semibold truncate mt-0.5">
                        🏢 {activeTenant?.name || 'Nepal Dental Practice'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Settings Menu Links */}
                <div className="p-2 space-y-1">
                  <div className="px-2.5 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Clinic Settings & Hub
                  </div>

                  {/* Clinic Configuration */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onNavigate) onNavigate('settings');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">Clinic Configuration</div>
                        <div className="text-[10px] text-slate-400 leading-tight">Hours, profile & clinic details</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                  </button>

                  {/* Staff Management (Visible to Super Admin / Platform Admin) */}
                  {(role === 'CLINIC_ADMIN' || isPlatformAdmin) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        if (onNavigate) onNavigate('staff');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <UserCog className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">Staff Management</div>
                          <div className="text-[10px] text-slate-400 leading-tight">Doctors, roles & permissions</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                    </button>
                  )}

                  {/* WhatsApp Automation */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onNavigate) onNavigate('whatsapp');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">WhatsApp Automation</div>
                        <div className="text-[10px] text-slate-400 leading-tight">Reminders & message templates</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                  </button>

                  {/* Account & Subscription */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onNavigate) onNavigate('subscription');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">Account & Subscription</div>
                        <div className="text-[10px] text-slate-400 leading-tight">Plan tier, quota & licensing</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                  </button>

                  {/* Switch Account / Switch Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onOpenLoginModal) onOpenLoginModal();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-purple-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">Switch Account / User ID</div>
                        <div className="text-[10px] text-slate-400 leading-tight">Sign in with different credentials</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                  </button>
                </div>

                {/* 3. Dedicated Logout Action */}
                {onLogout && (
                  <div className="p-2 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition flex items-center justify-between group shadow-2xs"
                      title="Logout from active session"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">Logout</div>
                          <div className="text-[10px] text-red-400 leading-tight">Exit and lock practice workspace</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white px-2 py-0.5 rounded-full transition flex-shrink-0">
                        Exit
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
