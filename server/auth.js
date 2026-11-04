import { multiTenantDb } from './multiTenantDb.js';

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX
// ============================================================================
export const ROLE_PERMISSIONS = {
  PLATFORM_ADMIN: [
    'manage:platform',
    'manage:tenants',
    'manage:domains',
    'manage:subscriptions',
    'manage:global_settings',
    'view:all_audit_logs',
    'grant:support_access',
    'view:patients',
    'view:patient_orders',
    'manage:clinic_settings'
  ],
  CLINIC_ADMIN: [
    // Clinical & Dental Charting Operations (Clinic Owner can perform all clinical procedures)
    'view:patients',
    'create:clinical_record',
    'edit:clinical_record',
    'edit:dental_chart',
    'create:treatment_plan',
    'create:prescription',
    'sign:prescription',
    'add:soap_note',
    'view:clinical_reports',
    // Patient Management
    'register:patient',
    'edit:patient_demographics',
    'delete:patient',
    'manage:appointments',
    'patient:checkin',
    'manage:queue',
    'send:whatsapp_reminders',
    // Dental Lab Orders
    'view:patient_orders',
    'create:patient_order',
    'update:patient_order',
    'update:patient_order_status',
    'delete:patient_order',
    // Billing & Financial Policies
    'create:invoice',
    'collect:payment',
    'request:refund',
    'approve:refund',
    'manage:billing_policy',
    // Pharmacy POS & Stock Management
    'view:pharmacy_catalog',
    'view:pharmacy_stock',
    'manage:pharmacy_catalog',
    'manage:pharmacy_stock',
    'process:pharmacy_sale',
    'manage:pharmacy_purchases',
    'manage:pharmacy_adjustments',
    'view:pharmacy_reports',
    // Finance, Ledger & Payouts
    'view:finance',
    'view:patient_transactions',
    'manage:finance_account',
    'manage:transactions',
    'manage:patient_transactions',
    'manage:staff_payments',
    'manage:payouts',
    'export:finance_reports',
    // Practice Governance & Clinic Administration
    'manage:clinic_settings',
    'manage:staff',
    'manage:chairs',
    'manage:treatment_catalog',
    'view:audit_logs',
    'view:reports',
    'review:duplicates',
    'revoke:staff_session'
  ],
  ACCOUNTANT: [
    'view:patients',
    'view:reports',
    'create:invoice',
    'collect:payment',
    'view:finance',
    'view:patient_transactions',
    'manage:finance_account',
    'manage:transactions',
    'manage:patient_transactions',
    'manage:staff_payments',
    'manage:payouts',
    'export:finance_reports'
  ],
  PHARMACIST: [
    'view:patients',
    'manage:pharmacy_catalog',
    'manage:pharmacy_stock',
    'process:pharmacy_sale',
    'manage:pharmacy_purchases',
    'manage:pharmacy_adjustments',
    'view:pharmacy_reports'
  ],
  DOCTOR: [
    'view:patients',
    'view:patient_orders',
    'create:patient_order',
    'update:patient_order',
    'manage:appointments',
    'create:clinical_record',
    'edit:clinical_record',
    'edit:dental_chart',
    'create:treatment_plan',
    'create:prescription',
    'sign:prescription',
    'add:soap_note',
    'view:clinical_reports',
    'view:pharmacy_catalog',
    'view:pharmacy_stock',
    'view:patient_transactions'
  ],
  RECEPTIONIST: [
    'view:patients',
    'view:patient_orders',
    'update:patient_order_status',
    'register:patient',
    'edit:patient_demographics',
    'manage:appointments',
    'patient:checkin',
    'manage:queue',
    'create:invoice',
    'collect:payment',
    'request:refund',
    'send:whatsapp_reminders',
    'process:pharmacy_sale',
    'view:pharmacy_catalog',
    'view:pharmacy_stock',
    'view:patient_transactions',
    'manage:patient_transactions'
  ],
  NURSE: [
    'view:patients',
    'manage:appointments',
    'patient:checkin',
    'manage:queue',
    'view:pharmacy_catalog',
    'view:pharmacy_stock'
  ]
};

// Check if a role possesses a specific permission
export function hasPermission(role, globalRole, permission, userRoles = []) {
  if (globalRole === 'PLATFORM_ADMIN') return true;
  // Clinic Owner / Super Admin (CLINIC_ADMIN) possesses all operational permissions within their clinic
  if (role === 'CLINIC_ADMIN') return true;
  if (Array.isArray(userRoles) && userRoles.includes('CLINIC_ADMIN')) return true;

  const permissions = new Set(ROLE_PERMISSIONS[role] || []);
  if (Array.isArray(userRoles)) {
    for (const r of userRoles) {
      const rPerms = ROLE_PERMISSIONS[r] || [];
      for (const p of rPerms) {
        permissions.add(p);
      }
    }
  }

  return permissions.has(permission);
}

// Module Entitlement Middleware (Checks if tenant is allocated this software module)
export function requireModule(moduleName) {
  return (req, res, next) => {
    if (req.user && req.user.globalRole === 'PLATFORM_ADMIN') return next();
    const tenantId = req.tenantId || req.headers['x-tenant-id'];
    if (!tenantId) return next();
    if (!multiTenantDb.isModuleEnabled(tenantId, moduleName)) {
      return res.status(403).json({
        error: 'MODULE_NOT_ENABLED',
        message: `The [${moduleName}] module has not been allocated to this clinic by the Platform Administrator.`
      });
    }
    next();
  };
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
export function authenticate(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  // Support direct development / test user headers if present
  const explicitUserId = req.headers['x-user-id'];
  if (!token && explicitUserId) {
    const user = multiTenantDb.platform.users.find(u => u.id === explicitUserId);
    if (user) {
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'ACCOUNT_SUSPENDED', message: 'This user account is suspended.' });
      }
      const tenantId = req.headers['x-tenant-id'] || 'tenant-nepal-dental';
      const membership = multiTenantDb.platform.memberships.find(m => m.userId === user.id && m.tenantId === tenantId);
      req.user = {
        id: user.id,
        username: user.username || (user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : user.id),
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        role: membership ? membership.role : (user.globalRole || 'GUEST'),
        roles: membership?.roles || (membership?.role ? [membership.role] : []),
        allowedModules: membership?.allowedModules || null,
        tenantId
      };
      return next();
    }
  }

  if (!token) {
    // If no credentials supplied on protected route
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' });
  }

  const result = multiTenantDb.verifySessionToken(token);
  if (!result) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Your session has expired or is invalid.' });
  }

  if (result.error === 'ACCOUNT_SUSPENDED') {
    return res.status(403).json({ error: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended by the administrator.' });
  }

  if (result.error === 'SESSION_REVOKED') {
    return res.status(401).json({ error: 'SESSION_REVOKED', message: 'Your session was revoked. Please log in again.' });
  }

  const { payload, user } = result;
  const tenantId = payload.tenantId || req.headers['x-tenant-id'] || 'tenant-nepal-dental';
  const membership = multiTenantDb.platform.memberships.find(m => m.userId === user.id && m.tenantId === tenantId);
  const currentAllowedModules = membership?.allowedModules || payload.allowedModules || null;

  req.user = {
    id: user.id,
    username: user.username || payload.username || (user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : user.id),
    email: user.email,
    name: user.name,
    globalRole: user.globalRole,
    role: membership?.role || payload.role,
    roles: membership?.roles || payload.roles || (payload.role ? [payload.role] : []),
    allowedModules: currentAllowedModules,
    tenantId
  };

  next();
}

// Optional Auth (for public or hybrid routes)
export function optionalAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  } else if (req.headers['x-user-id']) {
    const explicitUserId = req.headers['x-user-id'];
    const user = multiTenantDb.platform.users.find(u => u.id === explicitUserId);
    if (user && user.status !== 'suspended') {
      const tenantId = req.headers['x-tenant-id'] || 'tenant-nepal-dental';
      const membership = multiTenantDb.platform.memberships.find(m => m.userId === user.id && m.tenantId === tenantId);
      req.user = {
        id: user.id,
        username: user.username || (user.email ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : user.id),
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        role: membership ? membership.role : (user.globalRole || 'GUEST'),
        roles: membership?.roles || (membership?.role ? [membership.role] : []),
        tenantId
      };
      return next();
    }
  }

  if (token) {
    const result = multiTenantDb.verifySessionToken(token);
    if (result) {
      if (result.error === 'ACCOUNT_SUSPENDED') {
        return res.status(403).json({ error: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended by the administrator.' });
      }
      if (result.error === 'SESSION_REVOKED') {
        return res.status(401).json({ error: 'SESSION_REVOKED', message: 'Your session was revoked. Please log in again.' });
      }
      req.user = {
        id: result.user.id,
        username: result.user.username || result.payload.username || (result.user.email ? result.user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : result.user.id),
        email: result.user.email,
        name: result.user.name,
        globalRole: result.user.globalRole,
        role: result.payload.role,
        roles: result.payload.roles || (result.payload.role ? [result.payload.role] : []),
        tenantId: result.payload.tenantId
      };
    }
  }
  next();
}

// ============================================================================
// TENANT RESOLUTION & ISOLATION ENFORCEMENT
// ============================================================================
export function resolveTenant(req, res, next) {
  let requestedTenantId = req.headers['x-tenant-id'] || (req.user ? req.user.tenantId : null);

  // If host indicates a tenant subdomain (e.g. nepal-dental.anacraft.com)
  const host = req.headers['host'] || '';
  if (host.includes('.anacraft.com')) {
    const subdomain = host.split('.')[0];
    const match = multiTenantDb.getTenantBySlug(subdomain);
    if (match) requestedTenantId = match.id;
  }

  // Default fallback if not specified
  if (!requestedTenantId) {
    requestedTenantId = 'tenant-nepal-dental';
  }

  const tenant = multiTenantDb.getTenantById(requestedTenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'TENANT_NOT_FOUND', message: `Clinic tenant [${requestedTenantId}] not found.` });
  }

  // Check if tenant is suspended
  if (tenant.status === 'Suspended') {
    // If not a platform admin, block operations
    if (!req.user || req.user.globalRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json({
        error: 'TENANT_SUSPENDED',
        message: 'This clinic account is currently suspended. Please contact technical support.'
      });
    }
  }

  // Security Check: If authenticated user belongs to Clinic A, they cannot access Clinic B
  if (req.user && req.user.globalRole !== 'PLATFORM_ADMIN') {
    const isMember = multiTenantDb.platform.memberships.some(
      m => m.userId === req.user.id && m.tenantId === requestedTenantId && m.isActive
    );

    // Check if active support grant exists for this user and tenant
    const hasActiveSupportGrant = multiTenantDb.platform.supportGrants.some(
      g => g.adminId === req.user.id && g.tenantId === requestedTenantId && g.status === 'ACTIVE' && new Date(g.expiresAt) > new Date()
    );

    if (!isMember && !hasActiveSupportGrant) {
      multiTenantDb.logPlatformAudit({
        tenantId: requestedTenantId,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'CROSS_TENANT_ACCESS_BLOCKED',
        resource: 'tenant',
        resourceId: requestedTenantId,
        status: 'DENIED',
        details: { attemptedTenantId: requestedTenantId, userActualTenant: req.user.tenantId }
      });
      return res.status(403).json({
        error: 'CROSS_TENANT_ACCESS_DENIED',
        message: 'Access denied: You are not authorized to view or modify records belonging to this clinic.'
      });
    }
  }

  req.tenantId = requestedTenantId;
  req.tenant = tenant;
  next();
}

// ============================================================================
// PERMISSION TO MODULE MAPPING (Enforces Super Admin explicit module grants)
// ============================================================================
export const PERMISSION_MODULE_MAP = {
  'view:patients': 'patients',
  'register:patient': 'patients',
  'edit:patient_demographics': 'patients',
  'delete:patient': 'patients',
  'add:soap_note': 'patients',

  'manage:appointments': 'appointments',
  'patient:checkin': 'appointments',
  'manage:queue': 'appointments',
  'send:whatsapp_reminders': 'appointments',

  'edit:dental_chart': 'chart',
  'create:clinical_record': 'chart',
  'edit:clinical_record': 'chart',
  'create:treatment_plan': 'chart',

  'create:prescription': 'prescriptions',
  'sign:prescription': 'prescriptions',

  'view:patient_orders': 'orders',
  'create:patient_order': 'orders',
  'update:patient_order': 'orders',
  'update:patient_order_status': 'orders',
  'delete:patient_order': 'orders',

  'create:invoice': 'billing',
  'collect:payment': 'billing',
  'request:refund': 'billing',
  'approve:refund': 'billing',
  'manage:billing_policy': 'billing',

  'view:pharmacy_catalog': 'pharmacy',
  'view:pharmacy_stock': 'pharmacy',
  'manage:pharmacy_catalog': 'pharmacy',
  'manage:pharmacy_stock': 'pharmacy',
  'process:pharmacy_sale': 'pharmacy',
  'manage:pharmacy_purchases': 'pharmacy',
  'manage:pharmacy_adjustments': 'pharmacy',
  'view:pharmacy_reports': 'pharmacy',

  'view:finance': 'finance',
  'view:patient_transactions': 'finance',
  'manage:finance_account': 'finance',
  'manage:transactions': 'finance',
  'manage:patient_transactions': 'finance',
  'manage:staff_payments': 'finance',
  'manage:payouts': 'finance',
  'export:finance_reports': 'finance',

  'manage:clinic_settings': 'settings',
  'manage:staff': 'settings',
  'manage:chairs': 'settings',
  'manage:treatment_catalog': 'settings',
  'view:audit_logs': 'settings',
  'view:reports': 'settings',
  'review:duplicates': 'settings',
  'revoke:staff_session': 'settings'
};

// ============================================================================
// PERMISSION ENFORCEMENT MIDDLEWARE
// ============================================================================
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : (req.user.role ? [req.user.role] : []);
    const isSuperAdmin = req.user.globalRole === 'PLATFORM_ADMIN' || req.user.role === 'CLINIC_ADMIN' || userRoles.includes('CLINIC_ADMIN');

    // 1. Enforce explicit module grants configured by the Super Admin
    if (!isSuperAdmin) {
      const requiredModule = PERMISSION_MODULE_MAP[permission];
      if (requiredModule && Array.isArray(req.user.allowedModules) && !req.user.allowedModules.includes(requiredModule)) {
        multiTenantDb.logPlatformAudit({
          tenantId: req.tenantId || null,
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          action: 'MODULE_PERMISSION_DENIED',
          resource: permission,
          status: 'DENIED',
          details: {
            requiredPermission: permission,
            requiredModule,
            userRole: req.user.role,
            userAllowedModules: req.user.allowedModules
          }
        });

        return res.status(403).json({
          error: 'MODULE_NOT_PERMITTED',
          message: `Action prohibited: Your staff account has not been granted permission from the Clinic Administrator to access the [${requiredModule}] module.`
        });
      }
    }

    // 2. Enforce RBAC permission matrix
    const authorized = hasPermission(req.user.role, req.user.globalRole, permission, userRoles);
    if (!authorized) {
      multiTenantDb.logPlatformAudit({
        tenantId: req.tenantId || null,
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'PERMISSION_DENIED',
        resource: permission,
        status: 'DENIED',
        details: { requiredPermission: permission, userRole: req.user.role, userRoles }
      });

      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Action prohibited: Role [${req.user.role}] does not possess [${permission}] permission.`
      });
    }

    next();
  };
}

// Role Requirement Middleware
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : (req.user.role ? [req.user.role] : []);

    // Platform Admins and Clinic Owners (CLINIC_ADMIN) have full access to all operations
    if (req.user.globalRole === 'PLATFORM_ADMIN' || userRoles.includes('CLINIC_ADMIN') || req.user.role === 'CLINIC_ADMIN') {
      return next();
    }

    const hasAllowed = allowedRoles.some(r => userRoles.includes(r));
    if (!hasAllowed) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access denied: Role [${userRoles.join(', ')}] is not allowed for this action. Required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}
