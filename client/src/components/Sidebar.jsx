import React from 'react';
import {
  Calendar,
  Users,
  Activity,
  Scan,
  Pill,
  Package,
  Sparkles,
  Receipt,
  ShoppingCartPlus,
  DollarSign,
  LayoutGrid,
  Stethoscope,
  UserCheck,
  Server
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

  // Role-specific navigation categorized into structured workflow sections
  let menuSections = [];

  if (isPlatformAdmin) {
    menuSections = [
      {
        title: 'DAILY WORKFLOW',
        items: [
          { id: 'appointments', label: 'Appointments & Chairs', icon: Calendar, badge: appointmentCount },
          { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
          { id: 'chart', label: 'Dental Chart (Odontogram)', icon: Activity, badge: 'Interactive' },
          { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan }
        ]
      },
      {
        title: 'CLINICAL & TREATMENT',
        items: [
          { id: 'orders', label: 'Dental Lab Orders', icon: Package },
          { id: 'ai', label: 'AI Clinical Assistant', icon: Sparkles, badge: 'New' }
        ]
      },
      {
        title: 'FINANCIALS & INVENTORY',
        items: [
          { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
          ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: ShoppingCartPlus }] : []),
          ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Revenue', icon: DollarSign }] : [])
        ]
      },
      {
        title: 'MANAGEMENT',
        items: [
          { id: 'platform', label: 'Developer Console', icon: Server },
          { id: 'dashboard', label: 'Super Admin Overview', icon: LayoutGrid }
        ]
      }
    ];
  } else if (role === 'CLINIC_ADMIN') {
    menuSections = [
      {
        title: 'DAILY WORKFLOW',
        items: [
          { id: 'appointments', label: 'Appointments & Chairs', icon: Calendar, badge: appointmentCount },
          { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
          { id: 'chart', label: 'Dental Chart (Odontogram)', icon: Activity, badge: 'Interactive' },
          { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan }
        ]
      },
      {
        title: 'CLINICAL & TREATMENT',
        items: [
          { id: 'prescriptions', label: 'Prescription Pad (Rx)', icon: Pill },
          { id: 'orders', label: 'Dental Lab Orders', icon: Package },
          { id: 'ai', label: 'AI Clinical Assistant', icon: Sparkles, badge: 'New' }
        ]
      },
      {
        title: 'FINANCIALS & INVENTORY',
        items: [
          { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
          ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: ShoppingCartPlus }] : []),
          ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Revenue', icon: DollarSign }] : [])
        ]
      },
      {
        title: 'MANAGEMENT',
        items: [
          { id: 'dashboard', label: 'Super Admin Overview', icon: LayoutGrid }
        ]
      }
    ];
  } else if (role === 'DOCTOR') {
    menuSections = [
      {
        title: 'DAILY WORKFLOW',
        items: [
          { id: 'doctor-dashboard', label: "Today's Clinical Queue", icon: Stethoscope },
          { id: 'appointments', label: 'Appointments & Chairs', icon: Calendar, badge: appointmentCount },
          { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
          { id: 'chart', label: 'Dental Chart (Odontogram)', icon: Activity, badge: 'Interactive' },
          { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan }
        ]
      },
      {
        title: 'CLINICAL & TREATMENT',
        items: [
          { id: 'prescriptions', label: 'Prescription Pad (Rx)', icon: Pill },
          { id: 'orders', label: 'Dental Lab Orders', icon: Package },
          { id: 'ai', label: 'AI Clinical Assistant', icon: Sparkles, badge: 'New' }
        ]
      },
      ...(isPharmacyEnabled || isFinanceEnabled ? [{
        title: 'FINANCIALS & INVENTORY',
        items: [
          ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: ShoppingCartPlus }] : []),
          ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Revenue', icon: DollarSign }] : [])
        ]
      }] : [])
    ];
  } else if (role === 'RECEPTIONIST') {
    menuSections = [
      {
        title: 'DAILY WORKFLOW',
        items: [
          { id: 'reception-dashboard', label: 'Front Desk Queue', icon: UserCheck },
          { id: 'appointments', label: 'Appointments & Chairs', icon: Calendar, badge: appointmentCount },
          { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
          { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan }
        ]
      },
      {
        title: 'CLINICAL & LAB',
        items: [
          { id: 'orders', label: 'Dental Lab Orders', icon: Package }
        ]
      },
      {
        title: 'FINANCIALS & INVENTORY',
        items: [
          { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
          ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: ShoppingCartPlus }] : []),
          ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Revenue', icon: DollarSign }] : [])
        ]
      }
    ];
  } else if (role === 'ACCOUNTANT') {
    menuSections = [
      {
        title: 'FINANCIALS & INVENTORY',
        items: [
          ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Revenue', icon: DollarSign }] : []),
          { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
          ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: ShoppingCartPlus }] : [])
        ]
      },
      {
        title: 'DAILY WORKFLOW',
        items: [
          { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
          { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan },
          { id: 'orders', label: 'Dental Lab Orders', icon: Package }
        ]
      }
    ];
  } else if (role === 'PHARMACIST') {
    menuSections = [
      {
        title: 'FINANCIALS & INVENTORY',
        items: [
          { id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: ShoppingCartPlus },
          { id: 'billing', label: 'Billing & Invoices', icon: Receipt }
        ]
      },
      {
        title: 'DAILY WORKFLOW',
        items: [
          { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
          { id: 'orders', label: 'Dental Lab Orders', icon: Package },
          { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan }
        ]
      }
    ];
  } else {
    menuSections = [
      {
        title: 'DAILY WORKFLOW',
        items: [
          { id: 'doctor-dashboard', label: 'Dashboard', icon: LayoutGrid },
          { id: 'appointments', label: 'Appointments & Chairs', icon: Calendar, badge: appointmentCount },
          { id: 'patients', label: 'Patients (EHR)', icon: Users, badge: patientCount },
          { id: 'chart', label: 'Dental Chart (Odontogram)', icon: Activity },
          { id: 'xray', label: 'Dental X-Ray & PACS', icon: Scan }
        ]
      },
      {
        title: 'CLINICAL & TREATMENT',
        items: [
          { id: 'orders', label: 'Dental Lab Orders', icon: Package }
        ]
      },
      {
        title: 'FINANCIALS & INVENTORY',
        items: [
          { id: 'billing', label: 'Billing & Invoices', icon: Receipt },
          ...(isPharmacyEnabled ? [{ id: 'pharmacy', label: 'Pharmacy & Stock POS', icon: ShoppingCartPlus }] : []),
          ...(isFinanceEnabled ? [{ id: 'finance', label: 'Finance & Revenue', icon: DollarSign }] : [])
        ]
      }
    ];
  }

  // Filter sections and items if user has custom allowed modules configured
  if (!isPlatformAdmin && Array.isArray(currentUser?.allowedModules) && currentUser.allowedModules.length > 0) {
    const allowed = new Set(currentUser.allowedModules);
    menuSections = menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.id === 'dashboard' || item.id === 'doctor-dashboard' || item.id === 'reception-dashboard') {
            return true; // Keep landing dashboard
          }
          return allowed.has(item.id);
        })
      }))
      .filter((section) => section.items.length > 0);
  }

  return (
    <>
      {/* Mobile & Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed top-14 sm:top-16 inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden animate-fadeIn"
          title="Click to close menu"
          aria-hidden="true"
        />
      )}

      {/* Main Navigation Sidebar */}
      <aside
        className={`
          fixed top-14 sm:top-16 bottom-0 left-0 z-40 w-72 sm:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-3 select-none no-print overflow-y-auto transition-transform duration-300 ease-in-out
          lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-64 lg:h-[calc(100vh-4rem)] lg:translate-x-0
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="space-y-4">
          {/* Mobile Drawer Header */}
          <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <span className="text-2xl">🦷</span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white block leading-tight truncate">
                {activeTenant?.name || 'Nepal Dental ERP'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Navigation Menu</span>
            </div>
          </div>

          {/* Categorized Sections */}
          {menuSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className={sIdx > 0 ? 'pt-2 border-t border-slate-100 dark:border-slate-800/80' : ''}>
              {section.title && (
                <div className="px-3 pb-1.5 pt-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                    {section.title}
                  </span>
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onTabChange(item.id);
                        if (onClose) onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition duration-150 group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-800 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-800 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                            isActive
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : item.badge === 'New'
                              ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 font-semibold text-[10px] px-2.5'
                              : item.badge === 'Interactive'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px] rounded-md px-2'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
