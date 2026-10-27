import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  Calendar,
  Sparkles,
  Receipt,
  Pill,
  Server,
  Stethoscope,
  UserCheck,
  Boxes,
  Package,
  DollarSign,
  Scan
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onTabChange,
  currentUser,
  activeTenant,
  patientCount = 0,
  appointmentCount = 0,
  isOpen = false,
  onClose
}) {
  const role = currentUser?.role || 'DOCTOR';
  const isPlatformAdmin = currentUser?.globalRole === 'PLATFORM_ADMIN';
  const isPharmacyEnabled = activeTenant?.modules?.pharmacy !== false;
  const isFinanceEnabled = activeTenant?.modules?.finance !== false;

  // Role-specific navigation menus (Settings now accessed via Top-Right Settings Hub)
  let menuItems = [];

  if (isPlatformAdmin) {
    menuItems = [
      { id: 'platform', label: 'Developer Console', icon: Server, highlight: true },
      { id: 'dashboard', label: 'Clinic Admin View', icon: LayoutDashboard },
      ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: Boxes }] : []),
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Revenue', icon: DollarSign }] : []),
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan },
      { id: 'orders', label: 'Dental Lab Orders', icon: Package },
      { id: 'appointments', label: 'Appointments & Chairs', icon: Calendar, badge: appointmentCount },
      { id: 'billing', label: 'Billing & Invoices', icon: Receipt }
    ];
  } else if (role === 'CLINIC_ADMIN') {
    menuItems = [
      { id: 'dashboard', label: 'Super Admin Overview', icon: LayoutDashboard, highlight: true },
      { id: 'chart', label: 'Dental Chart (Odontogram)', icon: Activity, badge: 'Interactive' },
      { id: 'prescriptions', label: 'Prescription Pad (Rx)', icon: Pill },
      ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: Boxes, highlight: true }] : []),
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Ledger', icon: DollarSign, highlightGreen: true }] : []),
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan },
      { id: 'orders', label: 'Dental Lab Orders', icon: Package },
      { id: 'appointments', label: 'Appointments & Chairs', icon: Calendar, badge: appointmentCount },
      { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
      { id: 'ai', label: 'AI Clinical Assistant', icon: Sparkles }
    ];
  } else if (role === 'ACCOUNTANT') {
    menuItems = [
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Ledger', icon: DollarSign, highlightGreen: true }] : []),
      { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan },
      { id: 'orders', label: 'Dental Lab Orders', icon: Package },
      ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy POS & Stock', icon: Boxes }] : [])
    ];
  } else if (role === 'PHARMACIST') {
    menuItems = [
      { id: 'pharmacy', label: 'Pharmacy POS & Stock', icon: Boxes, highlight: true },
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan },
      { id: 'orders', label: 'Dental Lab Orders', icon: Package },
      { id: 'billing', label: 'Billing & Invoices', icon: Receipt }
    ];
  } else if (role === 'DOCTOR') {
    menuItems = [
      { id: 'doctor-dashboard', label: "Today's Clinical Queue", icon: Stethoscope, highlight: true },
      { id: 'chart', label: 'Dental Chart (Odontogram)', icon: Activity, badge: 'Interactive' },
      { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan, highlightBlue: true },
      { id: 'orders', label: 'Lab & Custom Orders', icon: Package },
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'appointments', label: 'Chair Schedule', icon: Calendar, badge: appointmentCount },
      { id: 'prescriptions', label: 'Prescription Pad (Rx)', icon: Pill },
      ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy Stock & Form', icon: Boxes }] : []),
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Ledger', icon: DollarSign }] : []),
      { id: 'ai', label: 'AI Clinical Assistant', icon: Sparkles }
    ];
  } else if (role === 'RECEPTIONIST') {
    menuItems = [
      { id: 'reception-dashboard', label: 'Front Desk Queue', icon: UserCheck, highlight: true },
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'xray', label: 'Dental X-Rays', icon: Scan },
      { id: 'orders', label: 'Lab Orders & Delivery', icon: Package },
      { id: 'appointments', label: 'Appointment Calendar', icon: Calendar, badge: appointmentCount },
      ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy Sales POS', icon: Boxes }] : []),
      { id: 'billing', label: 'Payment Collection', icon: Receipt },
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Patient Finances', icon: DollarSign }] : [])
    ];
  } else {
    // Default fallback
    menuItems = [
      { id: 'doctor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'chart', label: 'Dental Chart', icon: Activity },
      { id: 'xray', label: 'Dental X-Ray & Imaging', icon: Scan },
      { id: 'orders', label: 'Dental Lab Orders', icon: Package },
      ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy', icon: Boxes }] : []),
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance', icon: DollarSign }] : []),
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'appointments', label: 'Appointments', icon: Calendar }
    ];
  }

  // Filter menu items if user has custom allowed modules configured
  if (!isPlatformAdmin && Array.isArray(currentUser?.allowedModules) && currentUser.allowedModules.length > 0) {
    const allowed = new Set(currentUser.allowedModules);
    menuItems = menuItems.filter((item) => {
      if (item.id === 'dashboard' || item.id === 'doctor-dashboard' || item.id === 'reception-dashboard') {
        return true; // Keep landing dashboard
      }
      return allowed.has(item.id);
    });
  }

  return (
    <>
      {/* Mobile & Tablet Backdrop Overlay - Anchored beneath the sticky header, never overlapping it */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed top-14 sm:top-16 inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden animate-fadeIn"
          title="Click to close menu"
          aria-hidden="true"
        />
      )}

      {/* Main Navigation Sidebar (Responsive Slide-in Drawer on Mobile/Tablet below header, Static Rail on Desktop) */}
      <aside
        className={`
          fixed top-14 sm:top-16 bottom-0 left-0 z-40 w-72 sm:w-80 bg-white border-r border-slate-200 flex flex-col justify-between p-4 select-none no-print overflow-y-auto transition-transform duration-300 ease-in-out
          lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-64 lg:h-[calc(100vh-4rem)] lg:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="space-y-1">
          {/* Mobile Drawer Header */}
          <div className="flex items-center space-x-2.5 pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <span className="text-2xl">🦷</span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-slate-900 block leading-tight truncate">
                {activeTenant?.name || 'Nepal Dental ERP'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Navigation Menu</span>
            </div>
          </div>

          {/* Section Navigation Header */}
          <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {isPlatformAdmin ? 'Platform Management' : `${role} Navigation`}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
              RBAC
            </span>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-blue-600'
                        : item.highlightGreen
                        ? 'text-emerald-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
