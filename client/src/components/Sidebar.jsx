import React, { useState, useEffect, useCallback } from 'react';
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
  Server,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  onTabChange,
  currentUser,
  activeTenant,
  patientCount = 0,
  appointmentCount = 0,
  isOpen = false,
  onClose,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalCollapsed;

  const handleToggleCollapse = useCallback(() => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', String(next));
        } catch (_) {}
        return next;
      });
    }
  }, [externalOnToggleCollapse]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleCollapse]);

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
          fixed top-14 sm:top-16 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between select-none no-print overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out
          lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:relative
          ${isCollapsed ? 'lg:w-20 lg:p-2.5' : 'lg:w-64 lg:p-3'}
          w-72 sm:w-80 max-w-[85vw]
          ${isOpen ? 'translate-x-0 shadow-2xl p-3 pointer-events-auto' : '-translate-x-full pointer-events-none lg:pointer-events-auto p-0 lg:p-3'}
        `}
      >
        <div className="space-y-3">
          {/* Mobile Drawer Header */}
          <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <span className="text-2xl select-none">🦷</span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white block leading-tight truncate">
                {activeTenant?.name || 'Nepal Dental ERP'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Navigation Menu</span>
            </div>
          </div>

          {/* Desktop Sidebar Header with Toggle Button */}
          {!isCollapsed ? (
            <div className="hidden lg:flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-base select-none">🦷</span>
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block leading-tight truncate">
                    Clinical Menu
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider block leading-none">
                    {currentUser?.role ? currentUser.role.replace('_', ' ') : 'PORTAL'}
                  </span>
                </div>
              </div>

              {/* Header Toggle Button */}
              <button
                type="button"
                onClick={handleToggleCollapse}
                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition flex items-center justify-center group"
                title="Collapse sidebar (Ctrl+B)"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            /* Desktop Collapsed Header with Toggle Button */
            <div className="hidden lg:flex flex-col items-center justify-center pb-2 mb-1 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleToggleCollapse}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition flex items-center justify-center group shadow-2xs"
                title="Expand sidebar (Ctrl+B)"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="w-5 h-5 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          )}

          {/* Categorized Sections */}
          {menuSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className={sIdx > 0 ? (isCollapsed ? 'pt-2 border-t border-slate-100 dark:border-slate-800/80' : 'pt-2.5 border-t border-slate-100 dark:border-slate-800/80') : ''}>
              {section.title && !isCollapsed && (
                <div className="px-3 pb-1.5 pt-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">
                    {section.title}
                  </span>
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  if (isCollapsed) {
                    return (
                      <div key={item.id} className="relative group flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            onTabChange(item.id);
                            if (onClose) onClose();
                          }}
                          className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                              : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                          }`}
                          aria-label={item.label}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />

                          {/* Collapsed Badge Pill */}
                          {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                              {typeof item.badge === 'number' || (typeof item.badge === 'string' && item.badge.length <= 2)
                                ? item.badge
                                : '●'}
                            </span>
                          )}
                        </button>

                        {/* Floating Tooltip Hover Popover */}
                        <div className="hidden lg:group-hover:flex absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-2xl whitespace-nowrap z-50 items-center gap-2 pointer-events-none animate-fadeIn border border-slate-700">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded-md font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

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

        {/* Bottom Footer Collapse Action */}
        <div className="hidden lg:block pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <button
            type="button"
            onClick={handleToggleCollapse}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
            } rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition group`}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="flex items-center space-x-2.5">
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-blue-600 transition-colors">Collapse Sidebar</span>
                </>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                Ctrl+B
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
