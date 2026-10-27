import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  Users,
  Calendar,
  Sparkles,
  MessageSquare,
  Receipt,
  Pill,
  Settings,
  ShieldAlert,
  Server,
  Building,
  Globe,
  Key,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Boxes,
  UserCog,
  Package,
  DollarSign,
  Scan,
  ChevronDown,
  ChevronRight,
  FolderCog
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

  // Track Settings active tab state and expand Settings folder automatically
  const isSettingsActive = ['settings', 'staff', 'whatsapp', 'subscription'].includes(activeTab);
  const [openFolders, setOpenFolders] = useState({
    'settings-folder': true
  });

  useEffect(() => {
    if (isSettingsActive) {
      setOpenFolders((prev) => ({ ...prev, 'settings-folder': true }));
    }
  }, [isSettingsActive]);

  // Role-specific navigation menus with Settings Folder
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
      { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
      {
        id: 'settings-folder',
        label: 'Settings',
        icon: Settings,
        isFolder: true,
        children: [
          { id: 'settings', label: 'Clinic Configuration', icon: Building },
          { id: 'staff', label: 'Staff Management', icon: UserCog },
          { id: 'whatsapp', label: 'WhatsApp Automation', icon: MessageSquare }
        ]
      }
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
      { id: 'ai', label: 'AI Clinical Assistant', icon: Sparkles },
      {
        id: 'settings-folder',
        label: 'Settings',
        icon: Settings,
        isFolder: true,
        children: [
          { id: 'settings', label: 'Clinic Configuration', icon: Building },
          { id: 'staff', label: 'Staff Management', icon: UserCog },
          { id: 'whatsapp', label: 'WhatsApp Automation', icon: MessageSquare },
          { id: 'subscription', label: 'Subscription & Plan', icon: CreditCard }
        ]
      }
    ];
  } else if (role === 'ACCOUNTANT') {
    menuItems = [
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Ledger', icon: DollarSign, highlightGreen: true }] : []),
      { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan },
      { id: 'orders', label: 'Dental Lab Orders', icon: Package },
      ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy POS & Stock', icon: Boxes }] : []),
      {
        id: 'settings-folder',
        label: 'Settings',
        icon: Settings,
        isFolder: true,
        children: [
          { id: 'subscription', label: 'Account & Plan', icon: CreditCard }
        ]
      }
    ];
  } else if (role === 'PHARMACIST') {
    menuItems = [
      { id: 'pharmacy', label: 'Pharmacy POS & Stock', icon: Boxes, highlight: true },
      { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
      { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan },
      { id: 'orders', label: 'Dental Lab Orders', icon: Package },
      { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
      {
        id: 'settings-folder',
        label: 'Settings',
        icon: Settings,
        isFolder: true,
        children: [
          { id: 'whatsapp', label: 'WhatsApp Patient CRM', icon: MessageSquare },
          { id: 'subscription', label: 'Account & Plan', icon: CreditCard }
        ]
      }
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
      { id: 'ai', label: 'AI Clinical Assistant', icon: Sparkles },
      {
        id: 'settings-folder',
        label: 'Settings',
        icon: Settings,
        isFolder: true,
        children: [
          { id: 'settings', label: 'Clinic Configuration', icon: Building },
          { id: 'subscription', label: 'Account & Plan', icon: CreditCard }
        ]
      }
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
      ...(isFinanceEnabled ? [{ id: 'finance', label: 'Patient Finances', icon: DollarSign }] : []),
      {
        id: 'settings-folder',
        label: 'Settings',
        icon: Settings,
        isFolder: true,
        children: [
          { id: 'whatsapp', label: 'WhatsApp Patient CRM', icon: MessageSquare },
          { id: 'subscription', label: 'Account & Plan', icon: CreditCard }
        ]
      }
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
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      {
        id: 'settings-folder',
        label: 'Settings',
        icon: Settings,
        isFolder: true,
        children: [
          { id: 'subscription', label: 'Account & Plan', icon: CreditCard }
        ]
      }
    ];
  }

  // Filter menu items if user has custom allowed modules configured
  if (!isPlatformAdmin && Array.isArray(currentUser?.allowedModules) && currentUser.allowedModules.length > 0) {
    const allowed = new Set(currentUser.allowedModules);
    menuItems = menuItems.filter((item) => {
      if (item.id === 'dashboard' || item.id === 'doctor-dashboard' || item.id === 'reception-dashboard') {
        return true; // Keep landing dashboard
      }
      if (item.isFolder) {
        return allowed.has('settings') || allowed.has('settings-folder');
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

          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{isPlatformAdmin ? 'Platform Management' : `${role} Navigation`}</span>
            <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
              RBAC
            </span>
          </div>

          {menuItems.map((item) => {
            if (item.isFolder) {
              const isFolderOpen = !!openFolders[item.id];
              const isChildActive = item.children?.some((child) => activeTab === child.id);
              const FolderIcon = item.icon || Settings;

              return (
                <div key={item.id} className="pt-1.5 space-y-1">
                  {/* Folder Group Header Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenFolders((prev) => {
                        const nextState = !prev[item.id];
                        // If opening and not currently on any child tab, navigate to first child
                        if (nextState && !isChildActive && item.children.length > 0) {
                          onTabChange(item.children[0].id);
                          if (onClose) onClose();
                        }
                        return { ...prev, [item.id]: nextState };
                      });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition group ${
                      isChildActive
                        ? 'bg-blue-50/90 text-blue-900 border border-blue-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title={`${item.label} (Click to ${isFolderOpen ? 'collapse' : 'expand'})`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                          isChildActive
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                        }`}
                      >
                        <FolderIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          isChildActive ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.children.length}
                      </span>
                      {isFolderOpen ? (
                        <ChevronDown className={`w-3.5 h-3.5 transition ${isChildActive ? 'text-blue-700' : 'text-slate-400'}`} />
                      ) : (
                        <ChevronRight className={`w-3.5 h-3.5 transition ${isChildActive ? 'text-blue-700' : 'text-slate-400'}`} />
                      )}
                    </div>
                  </button>

                  {/* Folder Children List */}
                  {isFolderOpen && (
                    <div className="ml-3 pl-2.5 border-l-2 border-slate-200 space-y-1 py-0.5 animate-fadeIn">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActiveTab = activeTab === child.id;

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              onTabChange(child.id);
                              if (onClose) onClose();
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isChildActiveTab
                                ? 'bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/20'
                                : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <ChildIcon
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  isChildActiveTab ? 'text-white' : 'text-slate-400'
                                }`}
                              />
                              <span className="truncate">{child.label}</span>
                            </div>

                            {child.badge !== undefined && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  isChildActiveTab
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {child.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                        : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
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
