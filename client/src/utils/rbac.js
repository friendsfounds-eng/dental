import {
  Activity,
  Pill,
  Boxes,
  DollarSign,
  Users,
  Scan,
  Package,
  Calendar,
  Receipt,
  Sparkles,
  Settings
} from 'lucide-react';

export const SYSTEM_MODULES = [
  {
    id: 'chart',
    label: 'Dental Chart (Odontogram)',
    badgeText: 'Interactive',
    description: 'Tooth surface charting, restorative procedures & perio diagnosis',
    icon: Activity,
    color: 'emerald',
    defaultRoles: ['DOCTOR', 'CLINIC_ADMIN']
  },
  {
    id: 'prescriptions',
    label: 'Prescription Pad (Rx)',
    badgeText: 'Digital Rx',
    description: 'Medication formulary, dosage calculators & prescription printing',
    icon: Pill,
    color: 'blue',
    defaultRoles: ['DOCTOR', 'CLINIC_ADMIN']
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy & Stock POS',
    badgeText: 'Inventory',
    description: 'Drug inventory, POS dispensing, batch numbers & stock alerts',
    icon: Boxes,
    color: 'purple',
    defaultRoles: ['PHARMACIST', 'CLINIC_ADMIN']
  },
  {
    id: 'finance',
    label: 'Finance & Revenue',
    badgeText: 'Accounts',
    description: 'Financial ledger, revenue analysis, staff payroll & expenses',
    icon: DollarSign,
    color: 'emerald',
    defaultRoles: ['ACCOUNTANT', 'CLINIC_ADMIN']
  },
  {
    id: 'patients',
    label: 'Patients (EHR)',
    badgeText: 'Records',
    description: 'Electronic health records, patient registration & medical tags',
    icon: Users,
    color: 'indigo',
    defaultRoles: ['DOCTOR', 'RECEPTIONIST', 'NURSE', 'ACCOUNTANT', 'CLINIC_ADMIN']
  },
  {
    id: 'xray',
    label: 'Dental X-Ray & PACS',
    badgeText: 'DICOM',
    description: 'Digital radiograph viewer, contrast enhancement & imaging',
    icon: Scan,
    color: 'cyan',
    defaultRoles: ['DOCTOR', 'NURSE', 'CLINIC_ADMIN']
  },
  {
    id: 'orders',
    label: 'Dental Lab Orders',
    badgeText: 'Prosthetics',
    description: 'Crown, bridge & denture orders, shade tracking & delivery',
    icon: Package,
    color: 'amber',
    defaultRoles: ['DOCTOR', 'RECEPTIONIST', 'CLINIC_ADMIN']
  },
  {
    id: 'appointments',
    label: 'Appointments & Chairs',
    badgeText: 'Scheduler',
    description: 'Multi-chair calendar, doctor schedules & patient queue',
    icon: Calendar,
    color: 'rose',
    defaultRoles: ['DOCTOR', 'RECEPTIONIST', 'NURSE', 'CLINIC_ADMIN']
  },
  {
    id: 'billing',
    label: 'Billing & Invoices',
    badgeText: 'Invoicing',
    description: 'Invoice generation, itemized fee billing & payment collection',
    icon: Receipt,
    color: 'teal',
    defaultRoles: ['RECEPTIONIST', 'ACCOUNTANT', 'CLINIC_ADMIN']
  },
  {
    id: 'ai',
    label: 'AI Clinical Assistant',
    badgeText: 'AI Diagnostics',
    description: 'Smart clinical diagnostic insights & radiographic analysis',
    icon: Sparkles,
    color: 'violet',
    defaultRoles: ['DOCTOR', 'CLINIC_ADMIN']
  },
  {
    id: 'settings',
    label: 'Clinic Settings',
    badgeText: 'Owner Only',
    description: 'Clinic configuration & governance (Owner & Software Owner only)',
    icon: Settings,
    color: 'slate',
    defaultRoles: ['CLINIC_ADMIN']
  }
];

export const ALL_MODULE_IDS = SYSTEM_MODULES.map(m => m.id);

/**
 * Returns default permitted modules for given user roles.
 */
export function getDefaultModulesForRoles(roles = []) {
  const roleList = Array.isArray(roles) && roles.length > 0 ? roles : ['DOCTOR'];
  if (roleList.includes('CLINIC_ADMIN')) {
    return [...ALL_MODULE_IDS];
  }
  const set = new Set();
  roleList.forEach(r => {
    switch (r) {
      case 'DOCTOR':
        ['chart', 'prescriptions', 'patients', 'xray', 'orders', 'appointments', 'ai'].forEach(m => set.add(m));
        break;
      case 'RECEPTIONIST':
        ['patients', 'appointments', 'orders', 'billing'].forEach(m => set.add(m));
        break;
      case 'PHARMACIST':
        ['pharmacy', 'patients', 'billing'].forEach(m => set.add(m));
        break;
      case 'NURSE':
        ['patients', 'appointments', 'xray'].forEach(m => set.add(m));
        break;
      case 'ACCOUNTANT':
        ['finance', 'billing', 'patients'].forEach(m => set.add(m));
        break;
      default:
        ['patients', 'appointments'].forEach(m => set.add(m));
        break;
    }
  });
  return Array.from(set);
}

/**
 * Get active permitted module list for a user.
 */
export function getUserAllowedModules(user) {
  if (!user) return [];
  if (user.globalRole === 'PLATFORM_ADMIN') return [...ALL_MODULE_IDS];
  if (user.role === 'CLINIC_ADMIN') return [...ALL_MODULE_IDS];
  if (Array.isArray(user.roles) && user.roles.includes('CLINIC_ADMIN')) return [...ALL_MODULE_IDS];

  if (Array.isArray(user.allowedModules) && user.allowedModules.length > 0) {
    return user.allowedModules;
  }

  const assignedRoles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [user.role || 'DOCTOR'];
  return getDefaultModulesForRoles(assignedRoles);
}

/**
 * Checks whether user has permission to access a specific module.
 */
export function isModuleAllowed(moduleId, user) {
  if (!user) return false;
  if (user.globalRole === 'PLATFORM_ADMIN') return true;
  if (user.role === 'CLINIC_ADMIN') return true;
  if (Array.isArray(user.roles) && user.roles.includes('CLINIC_ADMIN')) return true;

  const allowed = getUserAllowedModules(user);
  return allowed.includes(moduleId);
}

/**
 * Checks whether user has permission to navigate to a specific tab.
 */
export function isTabAllowed(tabId, user) {
  if (!user) return false;
  if (user.globalRole === 'PLATFORM_ADMIN') return true;

  // Platform Console is strictly for PLATFORM_ADMIN
  if (tabId === 'platform') return false;

  // Super Admin Overview is strictly for CLINIC_ADMIN and PLATFORM_ADMIN
  if (tabId === 'dashboard') {
    return user.role === 'CLINIC_ADMIN' || (Array.isArray(user.roles) && user.roles.includes('CLINIC_ADMIN'));
  }

  // Dashboards
  if (tabId === 'doctor-dashboard') {
    return user.role === 'DOCTOR' || user.role === 'CLINIC_ADMIN' || isModuleAllowed('chart', user) || isModuleAllowed('appointments', user);
  }
  if (tabId === 'reception-dashboard') {
    return user.role === 'RECEPTIONIST' || user.role === 'CLINIC_ADMIN' || isModuleAllowed('appointments', user) || isModuleAllowed('billing', user);
  }

  // Settings subtabs
  const isClinicOwner = user.role === 'CLINIC_ADMIN' || (Array.isArray(user.roles) && user.roles.includes('CLINIC_ADMIN'));
  const isSoftwareOwner = user.globalRole === 'PLATFORM_ADMIN';
  const isOwnerOrPlatformAdmin = isClinicOwner || isSoftwareOwner;

  // Clinic Configuration, Staff Management & Subscription are strictly for Clinic Owner and Software Owner only!
  if (tabId === 'settings' || tabId === 'staff' || tabId === 'subscription') {
    return isOwnerOrPlatformAdmin;
  }
  if (tabId === 'whatsapp') {
    return isOwnerOrPlatformAdmin || isModuleAllowed('settings', user);
  }

  // Direct modules
  const tabToModuleMap = {
    chart: 'chart',
    prescriptions: 'prescriptions',
    pharmacy: 'pharmacy',
    finance: 'finance',
    patients: 'patients',
    xray: 'xray',
    imaging: 'xray',
    orders: 'orders',
    appointments: 'appointments',
    billing: 'billing',
    ai: 'ai'
  };

  const moduleId = tabToModuleMap[tabId];
  if (moduleId) {
    return isModuleAllowed(moduleId, user);
  }

  return true;
}

/**
 * Default safe landing tab for the user based on active permissions.
 */
export function getDefaultLandingTab(user) {
  if (!user) return 'doctor-dashboard';
  if (user.globalRole === 'PLATFORM_ADMIN') return 'platform';
  if (user.role === 'CLINIC_ADMIN') return 'dashboard';
  if (user.role === 'DOCTOR') return 'doctor-dashboard';
  if (user.role === 'RECEPTIONIST') return 'reception-dashboard';

  const allowed = getUserAllowedModules(user);
  if (allowed.includes('appointments')) return 'appointments';
  if (allowed.includes('patients')) return 'patients';
  if (allowed.includes('billing')) return 'billing';
  if (allowed.includes('pharmacy')) return 'pharmacy';
  if (allowed.includes('finance')) return 'finance';
  return 'doctor-dashboard';
}

/**
 * Granular action permissions within components (e.g. Delete, Edit, Create records).
 */
export function hasActionPermission(action, user) {
  if (!user) return false;
  if (user.globalRole === 'PLATFORM_ADMIN') return true;
  if (user.role === 'CLINIC_ADMIN') return true;
  if (Array.isArray(user.roles) && user.roles.includes('CLINIC_ADMIN')) return true;

  const role = user.role;
  const userRoles = Array.isArray(user.roles) ? user.roles : [role];

  switch (action) {
    // Permanent Deletions (Strictly Admin Only)
    case 'delete:patient':
    case 'delete:order':
    case 'delete:invoice':
    case 'delete:doctor':
    case 'delete:chair':
    case 'delete:treatment':
    case 'manage:staff':
    case 'view:audit_logs':
    case 'view:subscription':
      return false;

    // Clinical Procedures & Diagnostic Charting
    case 'edit:dental_chart':
    case 'create:treatment_plan':
    case 'create:prescription':
    case 'sign:prescription':
      return (userRoles.includes('DOCTOR')) && isModuleAllowed('chart', user);

    // Patient Lab Orders
    case 'create:order':
    case 'edit:order':
      return (userRoles.includes('DOCTOR')) && isModuleAllowed('orders', user);
    case 'update:order_status':
      return isModuleAllowed('orders', user);

    // Patients & Demographics
    case 'create:patient':
    case 'edit:patient_demographics':
      return isModuleAllowed('patients', user);

    // Appointments & Booking
    case 'manage:appointments':
      return isModuleAllowed('appointments', user);

    // Billing & Payments
    case 'create:invoice':
    case 'collect:payment':
      return isModuleAllowed('billing', user);

    // Pharmacy Stock
    case 'manage:stock':
      return userRoles.includes('PHARMACIST') && isModuleAllowed('pharmacy', user);

    // Finance & Payouts
    case 'manage:finance':
      return userRoles.includes('ACCOUNTANT') && isModuleAllowed('finance', user);

    default:
      return false;
  }
}

/**
 * Checks whether the currently logged-in user is the assigned attending doctor for an appointment.
 * Only the assigned attending doctor should receive real-time doctor allocation popup alerts.
 */
export function isCurrentUserAssignedDoctor(appointment, currentUser, doctors = []) {
  if (!currentUser || !appointment) return false;

  const nonDoctorRoles = ['RECEPTIONIST', 'PHARMACIST', 'ACCOUNTANT', 'NURSE'];
  const userRole = currentUser.role || '';
  const userRoles = Array.isArray(currentUser.roles) ? currentUser.roles : [userRole];

  // If user does not have DOCTOR or CLINIC_ADMIN role, they are never the attending doctor
  const isDoctorOrAdmin = userRoles.includes('DOCTOR') || userRoles.includes('CLINIC_ADMIN');
  if (!isDoctorOrAdmin && nonDoctorRoles.includes(userRole)) {
    return false;
  }

  const appointmentDoctorName = appointment.doctorName || '';
  if (!appointmentDoctorName) return false;

  const normalizeName = (name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/^dr\.?\s+/i, '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const docNorm = normalizeName(appointmentDoctorName);
  const userNorm = normalizeName(currentUser.name);

  // Match normalized name
  if (docNorm && userNorm && (docNorm === userNorm || docNorm.includes(userNorm) || userNorm.includes(docNorm))) {
    return true;
  }

  // Match email or phone via clinic doctors directory
  const docObj = (doctors || []).find(d => {
    const dNorm = normalizeName(d.name);
    return (dNorm && dNorm === docNorm) || (d.name && d.name.toLowerCase() === appointmentDoctorName.toLowerCase());
  });

  if (docObj) {
    if (docObj.email && currentUser.email && docObj.email.toLowerCase() === currentUser.email.toLowerCase()) {
      return true;
    }
    if (docObj.phone && currentUser.phone && docObj.phone.replace(/[^0-9]/g, '') === currentUser.phone.replace(/[^0-9]/g, '')) {
      return true;
    }
  }

  // Match username / email directly if present
  if (currentUser.email && appointment.doctorEmail && currentUser.email.toLowerCase() === appointment.doctorEmail.toLowerCase()) {
    return true;
  }

  return false;
}
