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
  Phone,
  CreditCard,
  Menu,
  X,
  Settings,
  UserCog,
  ArrowLeftRight,
  ChevronRight
} from 'lucide-react';

function formatClinicHeader(fullName) {
  const name = (fullName || 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.').trim();

  // Special match for Nepal Dental
  if (/nepal\s*dental/i.test(name)) {
    return {
      primary: 'Nepal Dental',
      connector: '&',
      secondary: 'Healthcare Wellness Centre',
      suffix: 'Pvt. Ltd.',
      isSplit: true
    };
  }

  // Generic match for other clinic names
  const pvtMatch = name.match(/^(.*?)(?:,\s*|\s+)(Pvt\.?\s*Ltd\.?|LLC|Inc\.?)$/i);
  let baseName = name;
  let suffix = '';
  if (pvtMatch) {
    baseName = pvtMatch[1];
    suffix = pvtMatch[2];
  }

  const splitMatch = baseName.match(/^(.*?)\s+(?:and|&|-|–)\s+(.*)$/i);
  if (splitMatch) {
    return {
      primary: splitMatch[1],
      connector: '&',
      secondary: splitMatch[2],
      suffix,
      isSplit: true
    };
  }

  return {
    primary: baseName,
    connector: '',
    secondary: '',
    suffix,
    isSplit: false
  };
}

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
  const brandInfo = formatClinicHeader(clinicProfile.name);

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

          {/* Premium 3D Glowing Gradient Logo Tile */}
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/25 flex items-center justify-center text-white flex-shrink-0 group hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
              {clinicProfile.logo ? (
                <img src={clinicProfile.logo} alt="Clinic Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-xl sm:text-2xl filter drop-shadow select-none">🦷</span>
              )}
            </div>
          </div>

          {/* Clinic Brand & Hierarchy with Fancy Colors */}
          <div className="min-w-0 flex flex-col justify-center">
            {/* Line 1: Primary Brand (Royal Indigo-Cyan Gradient) + Secondary & Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap leading-tight">
              <h1
                className="text-xs min-[400px]:text-sm sm:text-base md:text-lg font-black tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-xs truncate max-w-[130px] min-[400px]:max-w-[180px] sm:max-w-none"
                title={clinicProfile.name || 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.'}
              >
                {brandInfo.primary}
              </h1>

              {brandInfo.secondary && (
                <div className="hidden sm:inline-flex items-center gap-1">
                  <span className="text-amber-500 dark:text-amber-400 font-black text-xs sm:text-sm">
                    {brandInfo.connector}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 dark:from-teal-400 dark:via-emerald-300 dark:to-cyan-300 bg-clip-text text-transparent tracking-tight">
                    {brandInfo.secondary}
                  </span>
                </div>
              )}

              {brandInfo.suffix && (
                <span className="hidden md:inline-flex items-center text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-50 to-blue-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-700/60 shadow-2xs">
                  {brandInfo.suffix}
                </span>
              )}

              {/* Pulsing Emerald Live Status Badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs flex-shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>LIVE</span>
              </span>
            </div>

            {/* Line 2: Dental Address & Contact Credentials */}
            <div className="flex items-center space-x-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
              <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
              <span
                className="truncate max-w-[125px] min-[400px]:max-w-[180px] sm:max-w-[300px] md:max-w-[420px] text-slate-600 dark:text-slate-300 font-medium"
                title={clinicProfile.address || 'Gaushala-12 Mahaottari Nepal'}
              >
                {clinicProfile.address || 'Gaushala-12 Mahaottari Nepal'}
              </span>

              {clinicProfile.phone && (
                <>
                  <span className="hidden lg:inline text-slate-300 dark:text-slate-600">•</span>
                  <span className="hidden lg:inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{clinicProfile.phone}</span>
                  </span>
                </>
              )}

              {clinicProfile.regNo && (
                <>
                  <span className="hidden xl:inline text-slate-300 dark:text-slate-600">•</span>
                  <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 px-1.5 py-0.2 rounded-md">
                    <ShieldCheck className="w-2.5 h-2.5 text-teal-600" />
                    <span>{clinicProfile.regNo}</span>
                  </span>
                </>
              )}
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

        {/* Right Actions: Theme Switcher & Settings/Account */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
          {/* UI Theme Switcher */}
          <ThemeSwitcher />

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
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fadeIn select-none">
                {/* 1. Account Summary Card */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">
                      <RoleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block" title={currentUser?.name}>
                          {currentUser?.name || 'Dr. Mukesh Kushwaha'}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${roleBadge.bg}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                        {currentUser?.email || 'No email attached'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Settings Menu Links */}
                <div className="p-1.5 space-y-0.5">
                  {/* Clinic Configuration */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onNavigate) onNavigate('settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition shadow-2xs">
                        <Building className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">Clinic Configuration</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>

                  {/* Staff Management (Visible to Super Admin / Platform Admin) */}
                  {(role === 'CLINIC_ADMIN' || isPlatformAdmin) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        if (onNavigate) onNavigate('staff');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition shadow-2xs">
                          <UserCog className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold truncate">Staff Management</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  )}

                  {/* WhatsApp Automation */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onNavigate) onNavigate('whatsapp');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition shadow-2xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">WhatsApp Automation</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>

                  {/* Account & Subscription */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onNavigate) onNavigate('subscription');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition shadow-2xs">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">Account & Subscription</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>

                  {/* Switch Account / Switch Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      if (onOpenLoginModal) onOpenLoginModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition shadow-2xs">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">Switch Account / User ID</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                </div>

                {/* 3. Dedicated Logout Action */}
                {onLogout && (
                  <div className="p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition flex items-center justify-between group"
                      title="Logout from active session"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition shadow-2xs">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold truncate">Logout</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
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
