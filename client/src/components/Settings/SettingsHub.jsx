import React from 'react';
import {
  Settings,
  Building,
  UserCog,
  MessageSquare,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import ClinicSettings from './ClinicSettings';
import StaffManagement from './StaffManagement';
import WhatsAppCRM from './WhatsAppAutomation';
import AccountAndSubscription from './SubscriptionPlan';
import { getDefaultLandingTab } from '../../utils/rbac';

export default function SettingsHub({
  activeTab = 'settings',
  onTabChange,
  currentUser,
  activeTenant,
  authToken,
  clinicProfile = {},
  doctors = [],
  chairs = [],
  treatmentCatalog = [],
  pharmacyCatalog = [],
  patients = [],
  appointments = [],
  whatsappTemplates = [],
  onUpdateClinicProfile,
  onAddDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  onAddChair,
  onDeleteChair,
  onAddTreatment,
  onUpdateTreatment,
  onDeleteTreatment
}) {
  const role = currentUser?.role || 'DOCTOR';
  const isPlatformAdmin = currentUser?.globalRole === 'PLATFORM_ADMIN';
  const isSuperAdmin = role === 'CLINIC_ADMIN' || isPlatformAdmin;
  const hasSettingsModule = isSuperAdmin || (Array.isArray(currentUser?.allowedModules) && currentUser.allowedModules.includes('settings'));

  // Define setting tabs available based on RBAC (Strictly Super Admin / Approved settings permissions)
  const allTabs = [
    {
      id: 'settings',
      label: 'Clinic Configuration',
      shortLabel: 'Clinic Setup',
      icon: Building,
      description: 'Identity, Doctors, Chairs, Catalog & Ticket Rules',
      visible: isSuperAdmin || hasSettingsModule
    },
    {
      id: 'staff',
      label: 'Staff Management',
      shortLabel: 'Staff & Roles',
      icon: UserCog,
      description: 'User Accounts, RBAC Roles, Access Permissions & Wages',
      visible: isSuperAdmin
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Automation',
      shortLabel: 'WhatsApp CRM',
      icon: MessageSquare,
      description: 'Automated Reminders, CRM Templates & Patient Outreach',
      visible: isSuperAdmin || hasSettingsModule
    },
    {
      id: 'subscription',
      label: 'Subscription & Plan',
      shortLabel: 'Billing & Plan',
      icon: CreditCard,
      description: 'Clinic License Tier, Module Add-ons & Plan Validity',
      visible: isSuperAdmin // Strictly Super Admin only
    }
  ];

  const visibleTabs = allTabs.filter(t => t.visible);

  // If user does not have permission for settings hub at all
  if (!hasSettingsModule && !isSuperAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 max-w-lg mx-auto my-12 text-center shadow-lg animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900 mb-1">Access Restricted by Super Admin</h2>
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Your staff account <strong>({currentUser?.name})</strong> with role <strong>{currentUser?.role}</strong> has not been granted administrative privileges by the Clinic Administrator to configure clinic settings.
        </p>
        <button
          onClick={() => onTabChange && onTabChange(getDefaultLandingTab(currentUser))}
          className="inline-flex items-center space-x-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Permitted Home</span>
        </button>
      </div>
    );
  }

  const currentTabObj = visibleTabs.find(t => t.id === activeTab) || visibleTabs[0] || allTabs[0];

  return (
    <div className="space-y-4">
      {/* Top Settings Navigation Hub Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        {/* Header Title & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                <span className="font-bold text-slate-700">Settings</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-blue-600 font-semibold">{currentTabObj.label}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Practice Settings & Configuration
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{isPlatformAdmin ? 'Platform Admin' : `${role} Access`}</span>
            </span>
          </div>
        </div>

        {/* Tab Pills Bar */}
        <div className="pt-3.5">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
            {visibleTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80'
                  }`}
                  title={tab.description}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            {currentTabObj.description}
          </p>
        </div>
      </div>

      {/* Render Selected View */}
      <div className="settings-content-wrapper">
        {activeTab === 'settings' && (
          <ClinicSettings
            clinicProfile={clinicProfile}
            doctors={doctors}
            chairs={chairs}
            treatmentCatalog={treatmentCatalog}
            pharmacyCatalog={pharmacyCatalog}
            onUpdateClinicProfile={onUpdateClinicProfile}
            onAddDoctor={onAddDoctor}
            onUpdateDoctor={onUpdateDoctor}
            onDeleteDoctor={onDeleteDoctor}
            onAddChair={onAddChair}
            onDeleteChair={onDeleteChair}
            onAddTreatment={onAddTreatment}
            onUpdateTreatment={onUpdateTreatment}
            onDeleteTreatment={onDeleteTreatment}
          />
        )}

        {activeTab === 'staff' && (
          <StaffManagement
            authToken={authToken}
            activeTenant={activeTenant}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppCRM
            patients={patients}
            appointments={appointments}
            templates={whatsappTemplates}
            clinicProfile={clinicProfile}
          />
        )}

        {activeTab === 'subscription' && (
          <AccountAndSubscription
            currentUser={currentUser}
            activeTenant={activeTenant}
            clinicProfile={clinicProfile}
            authToken={authToken}
            onNavigate={onTabChange}
          />
        )}
      </div>
    </div>
  );
}
