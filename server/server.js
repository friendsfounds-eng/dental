import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { multiTenantDb, hashPassword } from './multiTenantDb.js';
import { storageService } from './storageService.js';
import { parseDicomBuffer, parseImageMetadata } from './dicomParser.js';
import {
  authenticate,
  optionalAuth,
  resolveTenant,
  requirePermission,
  requireRole,
  requireModule,
  hasPermission
} from './auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// 60MB limit to accommodate high-resolution 50MB radiograph scans (.dcm, .png, .jpeg, .tiff)
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} (Tenant: ${req.headers['x-tenant-id'] || 'default'})`);
  next();
});

// Health check endpoint for Render / cloud deployment monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ============================================================================
// 1. AUTHENTICATION & SESSION APIS
// ============================================================================

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password, tenantSlug } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const session = multiTenantDb.authenticate(email, password, tenantSlug);
    if (!session) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    multiTenantDb.logPlatformAudit({
      tenantId: session.activeTenant ? session.activeTenant.id : null,
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: 'USER_LOGIN_SUCCESS',
      resource: 'auth',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      ...session
    });
  } catch (err) {
    if (err.code === 'ACCOUNT_SUSPENDED') {
      return res.status(403).json({ error: 'ACCOUNT_SUSPENDED', message: err.message });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred during login.' });
  }
});

// POST /api/auth/register (Create new User ID / Clinic Account)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, role = 'DOCTOR', clinicName, specialty, qualification } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email/User ID, and password are required.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = multiTenantDb.platform.users.find(u => u.email.toLowerCase() === trimmedEmail);
  if (existingUser) {
    return res.status(409).json({ error: 'USER_EXISTS', message: 'An account with this User ID / Email already exists. Please sign in.' });
  }

  // Determine clinic
  let tenantId = 'tenant-nepal-dental'; // default primary clinic
  let activeTenant = multiTenantDb.getTenantById(tenantId) || multiTenantDb.platform.tenants[0];

  if (clinicName && clinicName.trim()) {
    try {
      const slug = clinicName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const uniqueSlug = `${slug}-${Date.now().toString().slice(-4)}`;
      const newTenant = multiTenantDb.createTenant({
        name: clinicName.trim(),
        slug: uniqueSlug,
        country: 'Nepal',
        currency: 'Rs.',
        adminEmail: trimmedEmail,
        adminName: name.trim(),
        adminPassword: password,
        doctorName: role === 'DOCTOR' ? name.trim() : null
      });
      tenantId = newTenant.id;
      activeTenant = newTenant;
    } catch (err) {
      console.warn('Could not create new tenant, defaulting to primary:', err.message);
    }
  }

  // Create User
  const newUser = {
    id: `user-${Date.now().toString().slice(-6)}`,
    email: trimmedEmail,
    name: name.trim(),
    phone: phone ? phone.trim() : '',
    passwordHash: hashPassword(password),
    globalRole: null,
    status: 'active',
    tokenVersion: 1,
    createdAt: new Date().toISOString()
  };
  multiTenantDb.platform.users.push(newUser);

  // Create Membership
  const userRole = role === 'CLINIC_ADMIN' ? 'CLINIC_ADMIN' : (role === 'RECEPTIONIST' ? 'RECEPTIONIST' : 'DOCTOR');
  const allowedModules = userRole === 'CLINIC_ADMIN'
    ? ['chart', 'prescriptions', 'pharmacy', 'finance', 'patients', 'xray', 'orders', 'appointments', 'billing', 'ai', 'settings']
    : (userRole === 'RECEPTIONIST'
        ? ['patients', 'appointments', 'billing', 'whatsapp', 'orders']
        : ['chart', 'prescriptions', 'patients', 'xray', 'orders', 'appointments', 'ai']);

  const newMembership = {
    id: `mem-${Date.now()}`,
    tenantId,
    userId: newUser.id,
    role: userRole,
    roles: [userRole],
    allowedModules,
    isActive: true
  };
  multiTenantDb.platform.memberships.push(newMembership);

  // If Doctor, also add to clinic's doctors list so they appear in schedules & queues
  if (userRole === 'DOCTOR') {
    const tData = multiTenantDb.getTenantData(tenantId);
    if (tData) {
      if (!Array.isArray(tData.doctors)) tData.doctors = [];
      const docExists = tData.doctors.some(d => d.name?.toLowerCase() === name.trim().toLowerCase());
      if (!docExists) {
        tData.doctors.push({
          id: `doc-${Date.now().toString().slice(-4)}`,
          name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
          specialty: specialty || 'General Dentistry',
          qualification: qualification || 'BDS',
          phone: phone ? phone.trim() : '',
          color: '#2563eb'
        });
        multiTenantDb.saveTenantData(tenantId, tData);
      }
    }
  }

  multiTenantDb.savePlatform();

  // Generate authenticated session
  const session = multiTenantDb.authenticate(trimmedEmail, password);

  multiTenantDb.logPlatformAudit({
    tenantId,
    userId: newUser.id,
    userEmail: newUser.email,
    userRole,
    action: 'USER_REGISTERED',
    resource: 'auth',
    details: { name: newUser.name, role: userRole }
  });

  res.status(201).json({
    success: true,
    message: 'User ID created successfully!',
    ...session
  });
});

// GET /api/auth/me (Returns active user & tenant session)
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = multiTenantDb.platform.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'USER_NOT_FOUND' });
  }

  const userMemberships = multiTenantDb.platform.memberships.filter(m => m.userId === user.id && m.isActive);
  const activeTenant = req.user.tenantId ? multiTenantDb.getTenantById(req.user.tenantId) : null;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      globalRole: user.globalRole,
      role: req.user.role
    },
    activeTenant,
    memberships: userMemberships.map(m => {
      const t = multiTenantDb.getTenantById(m.tenantId);
      return {
        tenantId: m.tenantId,
        tenantName: t ? t.name : 'Unknown Clinic',
        tenantSlug: t ? t.slug : 'clinic',
        role: m.role
      };
    })
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', authenticate, (req, res) => {
  multiTenantDb.logPlatformAudit({
    tenantId: req.user.tenantId || null,
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'USER_LOGOUT',
    resource: 'auth'
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/my-tenants (Returns all clinics accessible to current user)
app.get('/api/auth/my-tenants', authenticate, (req, res) => {
  if (req.user.globalRole === 'PLATFORM_ADMIN') {
    return res.json(multiTenantDb.getAllTenants());
  }
  const userMemberships = multiTenantDb.platform.memberships.filter(m => m.userId === req.user.id && m.isActive);
  const tenants = userMemberships.map(m => {
    const t = multiTenantDb.getTenantById(m.tenantId);
    return t ? { ...t, userRole: m.role } : null;
  }).filter(Boolean);
  res.json(tenants);
});

// POST /api/auth/switch-tenant (Switches active clinic for unified Super Admin)
app.post('/api/auth/switch-tenant', authenticate, (req, res) => {
  const { tenantId } = req.body;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required.' });
  }

  const isPlatformAdmin = req.user.globalRole === 'PLATFORM_ADMIN';
  const membership = multiTenantDb.platform.memberships.find(
    m => m.userId === req.user.id && m.tenantId === tenantId && m.isActive
  );

  if (!membership && !isPlatformAdmin) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have administrative access to this clinic.' });
  }

  const tenant = multiTenantDb.getTenantById(tenantId);
  if (!tenant) {
    return res.status(404).json({ error: 'TENANT_NOT_FOUND', message: 'Clinic tenant not found.' });
  }

  const user = multiTenantDb.platform.users.find(u => u.id === req.user.id);
  const newRole = membership ? membership.role : req.user.role;

  const newToken = Buffer.from(JSON.stringify({
    userId: req.user.id,
    email: req.user.email,
    globalRole: req.user.globalRole,
    role: newRole,
    tenantId: tenant.id,
    tokenVersion: user ? (user.tokenVersion || 1) : 1,
    exp: Date.now() + 24 * 60 * 60 * 1000
  })).toString('base64');

  multiTenantDb.logTenantAudit(tenant.id, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: newRole,
    action: 'TENANT_SWITCHED',
    resource: 'auth',
    details: { switchedTo: tenant.name }
  });

  res.json({
    success: true,
    token: newToken,
    activeTenant: tenant,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      role: newRole
    }
  });
});

// ============================================================================
// 2. DEVELOPER CONTROL PANEL (PLATFORM OWNER) APIS
// ============================================================================

// Overview Dashboard
app.get('/api/platform/overview', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  res.json(multiTenantDb.getPlatformOverview());
});

// Tenant List
app.get('/api/platform/tenants', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  res.json(multiTenantDb.getAllTenants());
});

// Create New Clinic Wizard
app.post('/api/platform/tenants', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  try {
    const { name, slug, country, currency, timeZone, planId, adminEmail, adminName, adminPassword, doctorName, enablePharmacy, enableFinance } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Clinic name and unique URL slug are required.' });
    }

    const created = multiTenantDb.createTenant({
      name,
      slug,
      country: country || 'Nepal',
      currency: currency || 'Rs.',
      timeZone: timeZone || 'Asia/Kathmandu',
      planId: planId || 'plan-starter',
      adminEmail,
      adminName,
      adminPassword,
      doctorName,
      enablePharmacy: enablePharmacy !== undefined ? Boolean(enablePharmacy) : true,
      enableFinance: enableFinance !== undefined ? Boolean(enableFinance) : true
    });

    res.status(201).json({ success: true, ...created });
  } catch (err) {
    res.status(400).json({ error: 'CREATION_FAILED', message: err.message });
  }
});

// Edit Tenant Clinic Details & Owner Credentials - Developer Admin
app.put('/api/platform/tenants/:id', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      planId,
      country,
      currency,
      timeZone,
      status,
      address,
      phone,
      doctorInCharge,
      adminName,
      adminEmail,
      adminPassword,
      enablePharmacy,
      enableFinance,
      subscription
    } = req.body;

    const tenant = multiTenantDb.getTenantById(id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });

    const modulesUpdate = {};
    if (enablePharmacy !== undefined) modulesUpdate.pharmacy = Boolean(enablePharmacy);
    if (enableFinance !== undefined) modulesUpdate.finance = Boolean(enableFinance);

    const updated = multiTenantDb.updateTenant(id, {
      name,
      slug,
      planId,
      country,
      currency,
      timeZone,
      status,
      address,
      phone,
      doctorInCharge,
      adminName,
      adminEmail,
      adminPassword,
      subscription,
      modules: Object.keys(modulesUpdate).length > 0 ? modulesUpdate : undefined
    });

    multiTenantDb.logPlatformAudit({
      tenantId: id,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'TENANT_UPDATED',
      resource: 'tenant',
      resourceId: id,
      details: {
        name: updated.name,
        slug: updated.slug,
        planId: updated.planId,
        passwordChanged: Boolean(adminPassword)
      }
    });

    res.json({
      success: true,
      tenant: updated,
      message: 'Clinic details and credentials updated successfully.'
    });
  } catch (err) {
    res.status(500).json({ error: 'UPDATE_FAILED', message: err.message });
  }
});

// Update Tenant Status (Activate / Suspend / Deactivate)
app.put('/api/platform/tenants/:id/status', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Suspended', 'Offboarding'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be Active, Suspended, or Offboarding.' });
  }

  const updated = multiTenantDb.updateTenantStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Tenant not found.' });
  res.json({ success: true, tenant: updated });
});

// Toggle Feature Module Allocation (Pharmacy, AI, etc.) - Developer Admin Controlled
app.post('/api/platform/tenants/:id/toggle-module', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  const { id } = req.params;
  const { module, enabled } = req.body;
  if (!module) return res.status(400).json({ error: 'Module name is required.' });

  const tenant = multiTenantDb.getTenantById(id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });

  const newState = multiTenantDb.toggleTenantModule(id, module, enabled !== undefined ? enabled : null);

  multiTenantDb.logPlatformAudit({
    tenantId: id,
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'TENANT_MODULE_TOGGLED',
    resource: 'module',
    details: { module, enabled: newState }
  });

  res.json({
    success: true,
    tenantId: id,
    module,
    enabled: newState,
    tenant: multiTenantDb.getTenantById(id)
  });
});

// Domain Manager
app.get('/api/platform/domains', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  res.json(multiTenantDb.platform.domains);
});

// Verify Domain
app.post('/api/platform/domains/verify', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  const { domainId } = req.body;
  const domain = multiTenantDb.platform.domains.find(d => d.id === domainId);
  if (!domain) return res.status(404).json({ error: 'Domain not found.' });

  domain.verified = true;
  domain.sslStatus = 'active';
  multiTenantDb.savePlatform();

  multiTenantDb.logPlatformAudit({
    tenantId: domain.tenantId,
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'DOMAIN_VERIFIED',
    resource: 'domain',
    resourceId: domain.domain
  });

  res.json({ success: true, domain });
});

// Subscription Plans
app.get('/api/platform/subscriptions', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  res.json({
    plans: multiTenantDb.platform.plans,
    tenants: multiTenantDb.getAllTenants()
  });
});

// Update Subscription Plan Tier - Platform Admin
app.put('/api/platform/plans/:id', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  try {
    const updated = multiTenantDb.updatePlan(req.params.id, req.body);
    res.json({ success: true, plan: updated, message: `Plan "${updated.name}" updated successfully.` });
  } catch (err) {
    res.status(400).json({ error: 'PLAN_UPDATE_FAILED', message: err.message });
  }
});

// Create New Subscription Plan Tier - Platform Admin
app.post('/api/platform/plans', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  try {
    const created = multiTenantDb.createPlan(req.body);
    res.status(201).json({ success: true, plan: created, message: `Plan "${created.name}" created successfully.` });
  } catch (err) {
    res.status(400).json({ error: 'PLAN_CREATION_FAILED', message: err.message });
  }
});

// ============================================================================
// SUBSCRIPTION RENEWAL & SOFTWARE OWNER PAYMENT GATEWAY APIS
// ============================================================================

// GET /api/subscription/current - Current clinic subscription, payment details & status
app.get('/api/subscription/current', authenticate, resolveTenant, (req, res) => {
  try {
    const data = multiTenantDb.getTenantSubscription(req.tenantId);
    if (!data) {
      return res.status(404).json({ error: 'Tenant subscription not found.' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subscription/renew - Submit renewal with payer name & receipt upload
app.post('/api/subscription/renew', authenticate, resolveTenant, (req, res) => {
  try {
    const { payerName, planId, billingCycle, transactionRef, receiptUrl, receiptFileName } = req.body;

    if (!payerName || !payerName.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Payer's name is required. Please provide the account holder or payer name."
      });
    }

    if (!receiptUrl) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Transaction receipt is required. Please upload your payment voucher screenshot.'
      });
    }

    const result = multiTenantDb.submitRenewalRequest(req.tenantId, req.user, {
      payerName,
      planId,
      billingCycle,
      transactionRef,
      receiptUrl,
      receiptFileName
    });

    res.status(201).json({
      success: true,
      message: 'Receipt uploaded successfully. Your payment is awaiting verification by the software owner.',
      renewal: result.renewal,
      subscription: result.subscription
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/platform/renewals - List all renewal requests (Platform Admin)
app.get('/api/platform/renewals', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  const { status } = req.query;
  const renewals = multiTenantDb.getAllRenewals(status);
  res.json(renewals);
});

// POST /api/platform/renewals/:id/approve - Approve renewal, set status to Active, extend expiry
app.post('/api/platform/renewals/:id/approve', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const result = multiTenantDb.approveRenewalRequest(id, req.user);
    res.json({
      success: true,
      message: 'Subscription renewal approved successfully! Tenant subscription status updated to Active and expiry date extended.',
      renewal: result.renewal,
      subscription: result.subscription
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/platform/renewals/:id/reject - Reject renewal with reason & instructions
app.post('/api/platform/renewals/:id/reject', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { reason, instructions } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Rejection reason is required to notify user.' });
    }

    const result = multiTenantDb.rejectRenewalRequest(id, reason, instructions, req.user);
    res.json({
      success: true,
      message: 'Subscription renewal rejected. User has been notified with resubmission instructions.',
      renewal: result.renewal,
      subscription: result.subscription
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/platform/payment-config - Get software owner bank / QR details
app.get('/api/platform/payment-config', authenticate, (req, res) => {
  res.json(multiTenantDb.getPaymentConfig());
});

// PUT /api/platform/payment-config - Update software owner payment details (Platform Admin)
app.put('/api/platform/payment-config', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  try {
    const updated = multiTenantDb.updatePaymentConfig(req.body);
    res.json({ success: true, paymentConfig: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/platform/notifications - Get developer notifications
app.get('/api/platform/notifications', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  res.json(multiTenantDb.getPlatformNotifications());
});

// POST /api/platform/notifications/:id/read - Mark notification as read
app.post('/api/platform/notifications/:id/read', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  const success = multiTenantDb.markNotificationRead(req.params.id);
  res.json({ success });
});

// Platform Audit Logs
app.get('/api/platform/audit-logs', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  res.json(multiTenantDb.platform.auditLogs || []);
});

// Issue Time-Limited Audited Support Access Grant
app.post('/api/platform/support-grant', authenticate, requireRole('PLATFORM_ADMIN'), (req, res) => {
  const { tenantId, reason, durationMinutes = 60 } = req.body;
  if (!tenantId || !reason) {
    return res.status(400).json({ error: 'Tenant ID and documented support reason are required.' });
  }

  const grant = {
    id: `grant-${Date.now()}`,
    tenantId,
    adminId: req.user.id,
    adminEmail: req.user.email,
    reason,
    durationMinutes: Number(durationMinutes),
    expiresAt: new Date(Date.now() + Number(durationMinutes) * 60 * 1000).toISOString(),
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  if (!multiTenantDb.platform.supportGrants) multiTenantDb.platform.supportGrants = [];
  multiTenantDb.platform.supportGrants.unshift(grant);
  multiTenantDb.savePlatform();

  multiTenantDb.logPlatformAudit({
    tenantId,
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'SUPPORT_ACCESS_GRANTED',
    resource: 'tenant',
    resourceId: tenantId,
    details: { reason, durationMinutes, expiresAt: grant.expiresAt }
  });

  res.status(201).json({ success: true, grant });
});

// ============================================================================
// 3. CLINIC SUPER ADMIN APIS (Staff, Security, Financial Policies, Reports)
// ============================================================================

const ALL_SYSTEM_MODULES = [
  'chart',
  'prescriptions',
  'pharmacy',
  'finance',
  'patients',
  'xray',
  'orders',
  'appointments',
  'billing',
  'ai',
  'settings'
];

function getDefaultModulesForRoles(roles = []) {
  const roleList = Array.isArray(roles) && roles.length > 0 ? roles : ['DOCTOR'];
  if (roleList.includes('CLINIC_ADMIN')) {
    return [...ALL_SYSTEM_MODULES];
  }
  const set = new Set();
  roleList.forEach(r => {
    switch (r) {
      case 'DOCTOR':
        ['chart', 'prescriptions', 'pharmacy', 'finance', 'patients', 'xray', 'orders', 'appointments', 'ai', 'settings'].forEach(m => set.add(m));
        break;
      case 'RECEPTIONIST':
        ['patients', 'appointments', 'billing', 'orders', 'pharmacy', 'finance', 'settings'].forEach(m => set.add(m));
        break;
      case 'PHARMACIST':
        ['pharmacy', 'patients', 'billing', 'orders', 'settings'].forEach(m => set.add(m));
        break;
      case 'NURSE':
        ['patients', 'appointments', 'chart', 'xray', 'orders', 'settings'].forEach(m => set.add(m));
        break;
      case 'ACCOUNTANT':
        ['finance', 'billing', 'patients', 'orders', 'pharmacy', 'settings'].forEach(m => set.add(m));
        break;
      default:
        ['patients', 'appointments'].forEach(m => set.add(m));
        break;
    }
  });
  return Array.from(set);
}

// List Clinic Staff
app.get('/api/admin/staff', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const tenantMemberships = multiTenantDb.platform.memberships.filter(m => m.tenantId === req.tenantId);
  const staffList = tenantMemberships.map(m => {
    const user = multiTenantDb.platform.users.find(u => u.id === m.userId);
    const assignedRoles = Array.isArray(m.roles) && m.roles.length > 0 ? m.roles : [m.role];
    const userModules = Array.isArray(m.allowedModules) && m.allowedModules.length > 0
      ? m.allowedModules
      : getDefaultModulesForRoles(assignedRoles);
    return {
      id: user ? user.id : m.userId,
      email: user ? user.email : 'unknown',
      name: user ? user.name : 'Unknown User',
      phone: user ? user.phone : '',
      role: m.role,
      roles: assignedRoles,
      allowedModules: userModules,
      status: user ? user.status : 'active',
      createdAt: user ? user.createdAt : ''
    };
  });
  res.json(staffList);
});

// Provision Staff Account (Supports Multiple Roles: Doctor, Receptionist, Pharmacist, Nurse, Admin)
app.post('/api/admin/staff', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const { email, name, phone, role, roles, allowedModules, password } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required.' });
  }

  // Support multiple selected roles
  const selectedRoles = Array.isArray(roles) && roles.length > 0
    ? roles
    : (role ? (Array.isArray(role) ? role : [role]) : ['DOCTOR']);

  if (selectedRoles.length === 0) {
    return res.status(400).json({ error: 'At least one role must be selected.' });
  }

  // Security Check: Clinic Admin cannot grant PLATFORM_ADMIN
  if (selectedRoles.includes('PLATFORM_ADMIN') || role === 'PLATFORM_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Clinic Super Admins cannot grant Platform Admin privileges.' });
  }

  const primaryRole = selectedRoles.includes('CLINIC_ADMIN')
    ? 'CLINIC_ADMIN'
    : selectedRoles.includes('DOCTOR')
    ? 'DOCTOR'
    : selectedRoles[0];

  let user = multiTenantDb.platform.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    user = {
      id: `user-${Date.now().toString().slice(-6)}`,
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password || 'Staff@123'),
      name: name.trim(),
      phone: phone || '',
      globalRole: null,
      status: 'active',
      tokenVersion: 1,
      createdAt: new Date().toISOString()
    };
    multiTenantDb.platform.users.push(user);
  }

  // Check if already a member
  let membership = multiTenantDb.platform.memberships.find(m => m.tenantId === req.tenantId && m.userId === user.id);
  const computedModules = Array.isArray(allowedModules) && allowedModules.length > 0
    ? allowedModules
    : getDefaultModulesForRoles(selectedRoles);

  if (membership) {
    membership.role = primaryRole;
    membership.roles = selectedRoles;
    membership.allowedModules = computedModules;
    membership.isActive = true;
  } else {
    membership = {
      id: `mem-${Date.now()}`,
      tenantId: req.tenantId,
      userId: user.id,
      role: primaryRole,
      roles: selectedRoles,
      allowedModules: computedModules,
      isActive: true
    };
    multiTenantDb.platform.memberships.push(membership);
  }

  // If role includes DOCTOR, synchronize with clinic's doctor roster
  if (selectedRoles.includes('DOCTOR')) {
    const tData = multiTenantDb.getTenantData(req.tenantId);
    if (tData) {
      tData.doctors = tData.doctors || [];
      const alreadyInDocs = tData.doctors.some(d => d.email?.toLowerCase() === user.email.toLowerCase());
      if (!alreadyInDocs) {
        tData.doctors.push({
          id: `doc-${Date.now().toString().slice(-4)}`,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          specialization: req.body.specialization || 'Dental Surgeon',
          status: 'Active'
        });
        multiTenantDb.saveTenantData(req.tenantId, tData);
      }
    }
  }

  multiTenantDb.savePlatform();

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'STAFF_ACCOUNT_PROVISIONED',
    resource: 'staff',
    resourceId: user.id,
    details: { name, email, role }
  });

  res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: membership.role, status: user.status }
  });
});

// Update Staff Member Role or Details (Supports Multiple Roles)
app.put('/api/admin/staff/:id/role', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const staffUserId = req.params.id;
  const { role, roles, allowedModules } = req.body;

  const selectedRoles = Array.isArray(roles) && roles.length > 0
    ? roles
    : (role ? (Array.isArray(role) ? role : [role]) : []);

  if (selectedRoles.length === 0) {
    return res.status(400).json({ error: 'At least one role is required.' });
  }

  if (selectedRoles.includes('PLATFORM_ADMIN') || role === 'PLATFORM_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Clinic administrators cannot grant Platform Admin privileges.' });
  }

  const membership = multiTenantDb.platform.memberships.find(
    m => m.tenantId === req.tenantId && m.userId === staffUserId
  );

  if (!membership) {
    return res.status(404).json({ error: 'STAFF_NOT_FOUND', message: 'Staff member not found in this clinic.' });
  }

  const oldRoles = membership.roles || [membership.role];
  const primaryRole = selectedRoles.includes('CLINIC_ADMIN')
    ? 'CLINIC_ADMIN'
    : selectedRoles.includes('DOCTOR')
    ? 'DOCTOR'
    : selectedRoles[0];

  membership.role = primaryRole;
  membership.roles = selectedRoles;
  if (Array.isArray(allowedModules)) {
    membership.allowedModules = allowedModules;
  } else if (!membership.allowedModules) {
    membership.allowedModules = getDefaultModulesForRoles(selectedRoles);
  }

  // If Doctor role was added, sync with doctors roster
  if (selectedRoles.includes('DOCTOR')) {
    const tData = multiTenantDb.getTenantData(req.tenantId);
    if (tData) {
      tData.doctors = tData.doctors || [];
      const user = multiTenantDb.platform.users.find(u => u.id === staffUserId);
      if (user && !tData.doctors.some(d => d.email?.toLowerCase() === user.email?.toLowerCase())) {
        tData.doctors.push({
          id: `doc-${Date.now().toString().slice(-4)}`,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          specialization: 'Dental Surgeon',
          status: 'Active'
        });
        multiTenantDb.saveTenantData(req.tenantId, tData);
      }
    }
  }

  multiTenantDb.savePlatform();

  // Revoke active sessions to enforce new role permissions
  multiTenantDb.revokeUserSessions(staffUserId);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'STAFF_ROLE_UPDATED',
    resource: 'staff',
    resourceId: staffUserId,
    details: { oldRoles, newRoles: selectedRoles }
  });

  res.json({
    success: true,
    message: `Staff roles & module permissions updated.`,
    roles: selectedRoles,
    allowedModules: membership.allowedModules
  });
});

// Remove / Delete Staff Member from Clinic
app.delete('/api/admin/staff/:id', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const staffUserId = req.params.id;

  // Safeguard: Cannot remove yourself
  if (req.user.id === staffUserId) {
    return res.status(400).json({ error: 'CANNOT_REMOVE_SELF', message: 'You cannot remove your own active administrator account.' });
  }

  // Find membership in this tenant
  const memIndex = multiTenantDb.platform.memberships.findIndex(
    m => m.tenantId === req.tenantId && m.userId === staffUserId
  );

  if (memIndex === -1) {
    return res.status(404).json({ error: 'STAFF_NOT_FOUND', message: 'Staff member not found in this clinic.' });
  }

  const removedMem = multiTenantDb.platform.memberships.splice(memIndex, 1)[0];
  multiTenantDb.savePlatform();

  // If Doctor, also remove from tenant doctors list if present
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const user = multiTenantDb.platform.users.find(u => u.id === staffUserId);
  if (tData && Array.isArray(tData.doctors) && user) {
    tData.doctors = tData.doctors.filter(d => 
      d.email?.toLowerCase() !== user.email.toLowerCase() && 
      d.name?.toLowerCase() !== user.name.toLowerCase()
    );
    multiTenantDb.saveTenantData(req.tenantId, tData);
  }

  // Revoke any active sessions
  multiTenantDb.revokeUserSessions(staffUserId);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'STAFF_ACCOUNT_REMOVED',
    resource: 'staff',
    resourceId: staffUserId,
    details: { removedUserId: staffUserId, previousRole: removedMem.role }
  });

  res.json({ success: true, message: 'Staff account successfully removed from clinic.' });
});

// Suspend / Reactivate Staff Account
app.put('/api/admin/staff/:id/status', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or suspended.' });
  }

  const success = multiTenantDb.setUserStatus(req.params.id, status);
  if (!success) return res.status(404).json({ error: 'Staff user not found.' });

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: `STAFF_STATUS_${status.toUpperCase()}`,
    resource: 'staff',
    resourceId: req.params.id,
    details: { status }
  });

  res.json({ success: true, status });
});

// Revoke Staff Sessions
app.post('/api/admin/staff/:id/revoke', authenticate, resolveTenant, requirePermission('revoke:staff_session'), (req, res) => {
  const success = multiTenantDb.revokeUserSessions(req.params.id);
  if (!success) return res.status(404).json({ error: 'User not found.' });

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'STAFF_SESSIONS_REVOKED',
    resource: 'staff',
    resourceId: req.params.id
  });

  res.json({ success: true, message: 'All active sessions for this staff member have been revoked.' });
});

// Clinic Audit Logs
app.get('/api/admin/audit-logs', authenticate, resolveTenant, requirePermission('view:audit_logs'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.auditLogs || [] : []);
});

// Duplicate Patient Detection (Checked by both mobile number and name: if both same, it is an exact duplicate)
app.get('/api/admin/duplicates', authenticate, resolveTenant, requirePermission('review:duplicates'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patients = tData ? tData.patients || [] : [];

  const possibleDuplicates = [];
  const exactDuplicateMap = new Map();
  const phoneOnlyMap = new Map();

  for (const p of patients) {
    const normName = (p.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const rawPhone = (p.phone || '').replace(/\D/g, '');
    const normPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;

    if (normName && normPhone) {
      // 1. Group by BOTH name and phone (Exact duplicate)
      const exactKey = `${normName}:::${normPhone}`;
      if (!exactDuplicateMap.has(exactKey)) exactDuplicateMap.set(exactKey, []);
      exactDuplicateMap.get(exactKey).push(p);

      // 2. Track phone numbers for shared family contacts
      if (!phoneOnlyMap.has(normPhone)) phoneOnlyMap.set(normPhone, []);
      phoneOnlyMap.get(normPhone).push(p);
    }
  }

  // Collect Exact Duplicates (Both mobile number AND name match)
  const exactIds = new Set();
  for (const [, group] of exactDuplicateMap.entries()) {
    if (group.length > 1) {
      group.forEach(pt => exactIds.add(pt.id));
      possibleDuplicates.push({
        type: 'MATCHING_NAME_AND_PHONE',
        isExactDuplicate: true,
        key: `${group[0].name} • ${group[0].phone}`,
        patients: group
      });
    }
  }

  // Also surface shared phone numbers (different names, e.g. family sharing a phone)
  for (const [phone, group] of phoneOnlyMap.entries()) {
    const uncaptured = group.filter(p => !exactIds.has(p.id));
    if (uncaptured.length > 1) {
      possibleDuplicates.push({
        type: 'SHARED_PHONE_FAMILY',
        isExactDuplicate: false,
        key: group[0].phone || phone,
        patients: uncaptured
      });
    }
  }

  res.json(possibleDuplicates);
});

// Financial Summary Report
app.get('/api/admin/financial-summary', authenticate, resolveTenant, requirePermission('view:reports'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patients = tData ? tData.patients || [] : [];

  let totalBilled = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let invoicesCount = 0;

  for (const p of patients) {
    for (const inv of (p.invoices || [])) {
      invoicesCount++;
      totalBilled += Number(inv.total) || 0;
      totalCollected += Number(inv.paid) || 0;
      totalOutstanding += Number(inv.balance) || 0;
    }
  }

  res.json({
    totalBilled,
    totalCollected,
    totalOutstanding,
    invoicesCount,
    currency: tData ? tData.clinicProfile.currency : 'Rs.'
  });
});

// Update Billing Policy
app.put('/api/admin/billing-policy', authenticate, resolveTenant, requirePermission('manage:billing_policy'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'Tenant data not found.' });

  tData.billingPolicy = {
    ...tData.billingPolicy,
    ...req.body
  };
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json({ success: true, billingPolicy: tData.billingPolicy });
});

// ============================================================================
// 4. TENANT-SCOPED CLINICAL & FRONT-DESK APIS (Protected by RBAC)
// ============================================================================

// Clinic Profile
app.get('/api/clinic', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.clinicProfile : {});
});

app.put('/api/clinic', authenticate, resolveTenant, requirePermission('manage:clinic_settings'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'Tenant data not found.' });

  tData.clinicProfile = { ...tData.clinicProfile, ...req.body };
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'CLINIC_PROFILE_UPDATED',
    resource: 'clinicProfile',
    details: req.body
  });

  res.json(tData.clinicProfile);
});

// Doctors
app.get('/api/doctors', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.doctors || [] : []);
});

app.post('/api/doctors', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const newDoc = {
    id: `DOC-${Date.now().toString().slice(-4)}`,
    name: req.body.name,
    specialty: req.body.specialty || 'Dental Surgeon',
    qualification: req.body.qualification || 'BDS',
    regNumber: req.body.regNumber || 'NMC-84920',
    phone: req.body.phone || '',
    email: req.body.email || '',
    color: req.body.color || '#2563eb'
  };
  tData.doctors.push(newDoc);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.status(201).json(newDoc);
});

app.put('/api/doctors/:id', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const doc = (tData.doctors || []).find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Doctor not found.' });
  Object.assign(doc, req.body);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json(doc);
});

app.delete('/api/doctors/:id', authenticate, resolveTenant, requirePermission('manage:staff'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const index = (tData.doctors || []).findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Doctor not found.' });
  tData.doctors.splice(index, 1);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json({ success: true });
});

// Chairs
app.get('/api/chairs', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.chairs || [] : []);
});

app.post('/api/chairs', authenticate, resolveTenant, requirePermission('manage:chairs'), (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Chair name is required.' });
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData.chairs) tData.chairs = [];
  tData.chairs.push(name.trim());
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.status(201).json(tData.chairs);
});

app.delete('/api/chairs', authenticate, resolveTenant, requirePermission('manage:chairs'), (req, res) => {
  const { name } = req.body;
  const tData = multiTenantDb.getTenantData(req.tenantId);
  tData.chairs = (tData.chairs || []).filter(c => c !== name);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json({ success: true, chairs: tData.chairs });
});

// Treatment Catalog
app.get('/api/treatment-catalog', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.treatmentCatalog || [] : []);
});

app.post('/api/treatment-catalog', authenticate, resolveTenant, requirePermission('manage:treatment_catalog'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const newTreatment = {
    id: `TRT-${Date.now().toString().slice(-4)}`,
    code: req.body.code || 'D9999',
    name: req.body.name,
    category: req.body.category || 'General',
    defaultCost: Number(req.body.defaultCost) || 0
  };
  tData.treatmentCatalog.push(newTreatment);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.status(201).json(newTreatment);
});

app.put('/api/treatment-catalog/:id', authenticate, resolveTenant, requirePermission('manage:treatment_catalog'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const item = (tData.treatmentCatalog || []).find(t => t.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Treatment not found.' });
  Object.assign(item, req.body);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json(item);
});

app.delete('/api/treatment-catalog/:id', authenticate, resolveTenant, requirePermission('manage:treatment_catalog'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  tData.treatmentCatalog = (tData.treatmentCatalog || []).filter(t => t.id !== req.params.id);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json({ success: true });
});

// Medicine Formulary & WhatsApp Templates
app.get('/api/medicine-formulary', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.medicineFormulary || [] : []);
});

// GET /api/pharmacy/available-medicines - Live pharmacy stock & catalog for prescription integration
app.get('/api/pharmacy/available-medicines', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.json([]);

  const catalog = tData.pharmacyCatalog || [];
  const batches = tData.pharmacyBatches || [];
  const now = new Date();

  const available = catalog.map((med) => {
    const medBatches = batches.filter((b) => b.medicineId === med.id);
    const activeBatches = medBatches.filter((b) => new Date(b.expiryDate) >= now);
    const totalStock = activeBatches.reduce((acc, b) => acc + Number(b.quantity || 0), 0);
    const isLowStock = totalStock <= Number(med.reorderThreshold || 20);

    return {
      id: med.id,
      name: med.name,
      genericName: med.genericName,
      brand: med.brand,
      category: med.category,
      strength: med.strength,
      dosageForm: med.dosageForm,
      sellingPrice: med.sellingPrice,
      totalStock,
      isLowStock,
      inStock: totalStock > 0,
      storageLocation: med.storageLocation
    };
  });

  res.json(available);
});

app.get('/api/whatsapp-templates', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.whatsappTemplates || [] : []);
});

app.get('/api/suggestions', optionalAuth, resolveTenant, (req, res) => {
  res.json({
    allergies: ['Penicillin', 'Amoxicillin', 'Sulfa Drugs', 'NSAIDs / Ibuprofen', 'Aspirin', 'Latex'],
    medicalHistory: ['Hypertension (High BP)', 'Type 2 Diabetes', 'Asthma', 'Cardiac Condition', 'Thyroid Disorder']
  });
});

// -------------------------------------------------------------
// PATIENTS DIRECTORY (Scoped by Tenant)
// -------------------------------------------------------------
app.get('/api/patients', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.patients || [] : []);
});

app.get('/api/patients/:id', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData || !tData.patients) return res.status(404).json({ error: 'Patient not found' });
  const patient = tData.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

app.post('/api/patients', authenticate, resolveTenant, requirePermission('register:patient'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'Tenant not found.' });
  if (!tData.patients) tData.patients = [];

  // Duplication rule: Checked by mobile number and name. If BOTH are same, you CANNOT save!
  const normName = (req.body.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const rawPhone = (req.body.phone || '').replace(/\D/g, '');
  const normPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;

  if (normName && normPhone) {
    const existing = tData.patients.find(p => {
      const pName = (p.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const pRaw = (p.phone || '').replace(/\D/g, '');
      const pPhone = pRaw.length >= 10 ? pRaw.slice(-10) : pRaw;
      return pName === normName && pPhone === normPhone;
    });

    if (existing) {
      return res.status(409).json({
        error: `Duplicate Patient Detected: A patient with the name "${existing.name}" and mobile number "${existing.phone}" already exists in this clinic (${existing.id}). You cannot save duplicate patient records.`,
        message: `Duplicate Patient Detected: A patient with the name "${existing.name}" and mobile number "${existing.phone}" already exists in this clinic (${existing.id}). You cannot save duplicate patient records.`,
        duplicateId: existing.id,
        isDuplicate: true
      });
    }
  }

  // Helper to generate unique patient ID using name letters and number
  const generateServerPatientId = (patientName, existingList = []) => {
    const existingIds = new Set(existingList.map(p => (p.id || '').toUpperCase()));
    const words = (patientName || '').trim().replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
    let prefix = '';
    if (words.length >= 2) {
      prefix = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
    } else if (words.length === 1) {
      prefix = words[0].slice(0, Math.min(3, Math.max(2, words[0].length))).toUpperCase();
    } else {
      prefix = 'PT';
    }

    let nextSeq = (existingList.length || 0) + 1001;
    let candidate = `${prefix}-${nextSeq}`;
    while (existingIds.has(candidate)) {
      nextSeq++;
      candidate = `${prefix}-${nextSeq}`;
    }
    return candidate;
  };

  const patientName = (req.body.name || '').trim();
  const patientPhone = (req.body.phone || '').trim();

  let assignedId = (req.body.id && String(req.body.id).trim())
    ? String(req.body.id).trim().toUpperCase()
    : generateServerPatientId(patientName, tData.patients);

  // Guarantee uniqueness within clinic tenant
  let finalId = assignedId;
  let counter = 1;
  while (tData.patients.some(p => (p.id || '').toUpperCase() === finalId)) {
    finalId = `${assignedId}-${counter}`;
    counter++;
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toISOString().split('T')[0];

  const newPatient = {
    dentalChart: {},
    treatmentPlans: [],
    notes: [],
    prescriptions: [],
    invoices: [],
    createdAt: now.toISOString(),
    registrationDate: req.body.registrationDate || dateStr,
    registrationTime: req.body.registrationTime || timeStr,
    ...req.body,
    id: finalId,
    name: patientName,
    phone: patientPhone
  };

  // Patient Ticket Charge & Revisit Validity Window: First Visit Assessment
  const clinicProfile = tData.clinicProfile || {};
  const enableTicketCharge = clinicProfile.enableTicketCharge !== false;
  const autoBillTicket = req.body.autoBillTicket !== false;
  const ticketFee = Number(clinicProfile.ticketFee !== undefined ? clinicProfile.ticketFee : 200);
  const validityDays = Number(clinicProfile.visitValidityDays !== undefined ? clinicProfile.visitValidityDays : 7);
  const ticketName = clinicProfile.ticketName || 'Registration & OPD Consultation Fee';

  if (enableTicketCharge && autoBillTicket) {
    const todayStr = new Date().toISOString().split('T')[0];
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);
    const validUntilStr = validUntilDate.toISOString().split('T')[0];

    const initialTicketInvoice = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      date: todayStr,
      isFinalized: true,
      items: [
        {
          description: ticketName,
          tooth: 'General Consultation',
          qty: 1,
          unitPrice: ticketFee,
          total: ticketFee,
          isTicket: true,
          ticketStatus: 'FIRST_VISIT'
        }
      ],
      subtotal: ticketFee,
      discount: 0,
      taxPercent: 0,
      taxAmount: 0,
      total: ticketFee,
      paid: ticketFee,
      balance: 0,
      status: 'Paid',
      paymentMethod: req.body.ticketPaymentMethod || 'Fonepay QR',
      doctorName: req.body.assignedDoctorName || clinicProfile.doctorInCharge || 'Attending Doctor',
      doctorId: req.body.assignedDoctorId || ''
    };

    newPatient.invoices = [initialTicketInvoice];
    newPatient.lastTicketDate = todayStr;
    newPatient.ticketValidUntil = validUntilStr;
    newPatient.ticketStatus = 'ACTIVE';
  }

  tData.patients.unshift(newPatient);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PATIENT_REGISTERED',
    resource: 'patient',
    resourceId: newPatient.id,
    details: { name: newPatient.name, phone: newPatient.phone }
  });

  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', authenticate, resolveTenant, requirePermission('edit:patient_demographics'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found in this clinic.' });

  // Duplication rule: If updating name/phone, ensure another patient does not already have BOTH the same name and mobile number!
  const nextName = (req.body.name !== undefined ? req.body.name : patient.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const nextRawPhone = (req.body.phone !== undefined ? req.body.phone : patient.phone || '').replace(/\D/g, '');
  const nextNormPhone = nextRawPhone.length >= 10 ? nextRawPhone.slice(-10) : nextRawPhone;

  if (nextName && nextNormPhone) {
    const existing = tData.patients.find(p => {
      if (p.id === req.params.id) return false;
      const pName = (p.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
      const pRaw = (p.phone || '').replace(/\D/g, '');
      const pPhone = pRaw.length >= 10 ? pRaw.slice(-10) : pRaw;
      return pName === nextName && pPhone === nextNormPhone;
    });

    if (existing) {
      return res.status(409).json({
        error: `Duplicate Patient Detected: Another patient with the name "${existing.name}" and mobile number "${existing.phone}" already exists (${existing.id}). You cannot save duplicate patient records.`,
        message: `Duplicate Patient Detected: Another patient with the name "${existing.name}" and mobile number "${existing.phone}" already exists (${existing.id}). You cannot save duplicate patient records.`,
        duplicateId: existing.id,
        isDuplicate: true
      });
    }
  }

  // Do not allow overwriting clinical records through demographic update
  const { dentalChart, treatmentPlans, notes, prescriptions, invoices, ...demographics } = req.body;
  Object.assign(patient, demographics);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json(patient);
});

// -------------------------------------------------------------
// DENTAL CHART (Doctor & Clinic Owner / Admin)
// -------------------------------------------------------------
app.put(['/api/patients/:id/teeth/:toothNumber', '/api/patients/:id/chart/:toothNumber'], authenticate, resolveTenant, requirePermission('edit:dental_chart'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  if (!patient.dentalChart) patient.dentalChart = {};
  patient.dentalChart[req.params.toothNumber] = req.body;
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'DENTAL_CHART_UPDATED',
    resource: 'patient',
    resourceId: patient.id,
    details: { tooth: req.params.toothNumber, condition: req.body.condition }
  });

  res.json(patient.dentalChart);
});

// Treatment Plans (Doctor Only)
app.post('/api/patients/:id/treatment-plans', authenticate, resolveTenant, requirePermission('create:treatment_plan'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  const newPlan = {
    id: `TP-${Date.now().toString().slice(-4)}`,
    status: 'Proposed',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  if (!patient.treatmentPlans) patient.treatmentPlans = [];
  patient.treatmentPlans.push(newPlan);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.status(201).json(newPlan);
});

app.patch('/api/patients/:id/treatment-plans/:planId', authenticate, resolveTenant, requirePermission('create:treatment_plan'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  const plan = (patient.treatmentPlans || []).find(p => p.id === req.params.planId);
  if (!plan) return res.status(404).json({ error: 'Treatment plan not found.' });

  plan.status = req.body.status;
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json(plan);
});

// Clinical Notes SOAP (Doctor Only)
app.post('/api/patients/:id/notes', authenticate, resolveTenant, requirePermission('add:soap_note'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  const newNote = {
    id: `NOTE-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    doctor: req.user ? req.user.name : 'Attending Doctor',
    ...req.body
  };
  if (!patient.notes) patient.notes = [];
  patient.notes.unshift(newNote);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.status(201).json(newNote);
});

// Prescriptions (Doctor Only - Receptionist is strictly forbidden!)
app.post('/api/patients/:id/prescriptions', authenticate, resolveTenant, requirePermission('create:prescription'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  const newRx = {
    id: `RX-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    doctor: req.body.doctor || req.user.name,
    isFinalized: true, // Signed by doctor
    ...req.body
  };
  if (!patient.prescriptions) patient.prescriptions = [];
  patient.prescriptions.unshift(newRx);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PRESCRIPTION_FINALIZED_AND_SIGNED',
    resource: 'prescription',
    resourceId: newRx.id,
    details: { patientId: patient.id, diagnosis: newRx.diagnosis, medicinesCount: (newRx.medicines || []).length }
  });

  res.status(201).json(newRx);
});

// Invoices & Billing (Receptionist or Super Admin)
app.post('/api/patients/:id/invoices', authenticate, resolveTenant, requirePermission('create:invoice'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  const invoiceDate = req.body.date || new Date().toISOString().split('T')[0];
  const invoiceCreatedAt = req.body.createdAt || new Date().toISOString();
  const newInvoiceId = `INV-${Date.now().toString().slice(-4)}`;
  const newInvoiceNumber = req.body.invoiceNumber || `INV-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
  const totalAmount = Number(req.body.total || 0);
  const paidAmount = Number(req.body.paid || 0);
  const discountAmount = Number(req.body.discount || 0);
  const paymentMethod = req.body.paymentMethod || 'Fonepay QR';

  const newInvoice = {
    id: newInvoiceId,
    invoiceNumber: newInvoiceNumber,
    date: invoiceDate,
    createdAt: invoiceCreatedAt,
    isFinalized: paidAmount > 0,
    ...req.body
  };

  // Unique receipt generation if payment is collected
  let receiptRecord = null;
  if (paidAmount > 0) {
    const receiptNumber = `RCP-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;
    newInvoice.receiptNumber = receiptNumber;

    receiptRecord = multiTenantDb.createReceipt(req.tenantId, {
      receiptNumber,
      patientId: patient.id,
      patientName: patient.name,
      invoiceId: newInvoice.invoiceNumber,
      date: invoiceDate,
      amount: paidAmount,
      paymentMethod,
      paymentType: 'INVOICE_PAYMENT',
      refNumber: `REC-${newInvoice.invoiceNumber}`,
      notes: `Payment collected for invoice #${newInvoice.invoiceNumber}`
    }, req.user);

    // Also record in central finance transactions ledger
    multiTenantDb.createFinanceTransaction(req.tenantId, {
      date: invoiceDate,
      refNumber: receiptNumber,
      payerOrRecipient: patient.name,
      type: 'INCOME',
      category: 'Patient Treatment',
      amount: paidAmount,
      paymentMethod,
      status: 'Completed',
      relatedPatientId: patient.id,
      notes: `Invoice payment for #${newInvoice.invoiceNumber}`
    }, req.user);
  }

  // Double-Entry Journal Entry Posting
  try {
    const lines = [];
    // 1. Invoiced Treatment Charge
    const netBilled = totalAmount;
    if (netBilled > 0) {
      lines.push({ accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: netBilled, credit: 0 });
      if (discountAmount > 0) {
        lines.push({ accountCode: '5700', accountName: 'Approved Patient Discounts & Adjustments', debit: discountAmount, credit: 0 });
        lines.push({ accountCode: '4010', accountName: 'Dental Treatment & Procedure Revenue', debit: 0, credit: netBilled + discountAmount });
      } else {
        lines.push({ accountCode: '4010', accountName: 'Dental Treatment & Procedure Revenue', debit: 0, credit: netBilled });
      }
    }

    if (lines.length >= 2) {
      multiTenantDb.createJournalEntry(req.tenantId, {
        date: invoiceDate,
        reference: newInvoice.invoiceNumber,
        source: 'INVOICE',
        memo: `Treatment billing for ${patient.name} (Inv #${newInvoice.invoiceNumber})`,
        lines
      }, req.user);
    }

    // 2. Immediate Payment collection JE
    if (paidAmount > 0) {
      const pmLower = paymentMethod.toLowerCase();
      const debitAccount = pmLower.includes('cash') ? '1010' : pmLower.includes('fonepay') || pmLower.includes('qr') || pmLower.includes('card') ? '1030' : '1020';

      multiTenantDb.createJournalEntry(req.tenantId, {
        date: invoiceDate,
        reference: newInvoice.receiptNumber || newInvoice.invoiceNumber,
        source: 'RECEIPT',
        memo: `Payment collection from ${patient.name} for invoice #${newInvoice.invoiceNumber}`,
        lines: [
          { accountCode: debitAccount, debit: paidAmount, credit: 0 },
          { accountCode: '1100', accountName: 'Accounts Receivable (AR) - Patients', debit: 0, credit: paidAmount }
        ]
      }, req.user);
    }
  } catch (jeErr) {
    console.warn('[Accounting Auto-Posting Warning]:', jeErr.message);
  }

  // Automated Ticket Validity Evaluation & Expiry Reset
  const clinicProfile = tData.clinicProfile || {};
  const validityDays = Number(clinicProfile.visitValidityDays !== undefined ? clinicProfile.visitValidityDays : 7);

  const ticketItem = (newInvoice.items || []).find(item =>
    item.isTicket === true ||
    (item.description && item.description.toLowerCase().includes('ticket')) ||
    (item.description && item.description.toLowerCase().includes('registration & opd'))
  );

  if (ticketItem) {
    const fee = Number(ticketItem.unitPrice || 0);
    if (fee > 0) {
      // Standard or renewed ticket charge paid/billed: resets validity cycle for N days
      patient.lastTicketDate = invoiceDate;
      const validUntilDate = new Date(invoiceDate);
      validUntilDate.setDate(validUntilDate.getDate() + validityDays);
      patient.ticketValidUntil = validUntilDate.toISOString().split('T')[0];
      patient.ticketStatus = 'ACTIVE';
    } else if (ticketItem.isWaived || fee === 0) {
      // Free revisit within existing validity window: preserve window
      if (!patient.lastTicketDate) {
        patient.lastTicketDate = invoiceDate;
        const validUntilDate = new Date(invoiceDate);
        validUntilDate.setDate(validUntilDate.getDate() + validityDays);
        patient.ticketValidUntil = validUntilDate.toISOString().split('T')[0];
      }
      patient.lastRevisitDate = invoiceDate;
    }
  }

  if (!patient.invoices) patient.invoices = [];
  patient.invoices.unshift(newInvoice);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'INVOICE_GENERATED',
    resource: 'invoice',
    resourceId: newInvoice.id,
    details: { invoiceNumber: newInvoice.invoiceNumber, total: newInvoice.total, paid: newInvoice.paid, receiptNumber: newInvoice.receiptNumber }
  });

  res.status(201).json({
    ...newInvoice,
    receipt: receiptRecord,
    patientTicket: {
      lastTicketDate: patient.lastTicketDate,
      ticketValidUntil: patient.ticketValidUntil,
      ticketStatus: patient.ticketStatus,
      lastRevisitDate: patient.lastRevisitDate
    }
  });
});

// GET /api/patients/:id/ticket-status - Assess patient OPD Ticket charge and revisit validity
app.get('/api/patients/:id/ticket-status', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'Tenant not found.' });
  const patient = (tData.patients || []).find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found.' });

  const clinicProfile = tData.clinicProfile || {};
  const enabled = clinicProfile.enableTicketCharge !== false;
  const ticketFee = Number(clinicProfile.ticketFee !== undefined ? clinicProfile.ticketFee : 200);
  const validityDays = Number(clinicProfile.visitValidityDays !== undefined ? clinicProfile.visitValidityDays : 7);
  const ticketName = clinicProfile.ticketName || 'Registration & OPD Consultation Fee';
  const currency = clinicProfile.currency || 'Rs.';

  if (!enabled) {
    return res.json({
      enabled: false,
      status: 'DISABLED',
      fee: 0,
      standardFee: 0,
      isWaived: false,
      validityDays,
      ticketName,
      message: 'Ticket charge is disabled in clinic settings.'
    });
  }

  let lastTicketDateStr = patient.lastTicketDate || null;
  if (!lastTicketDateStr && Array.isArray(patient.invoices)) {
    for (const inv of patient.invoices) {
      if (inv.status === 'Cancelled') continue;
      const hasTicket = (inv.items || []).some(item =>
        item.isTicket === true ||
        (item.description && item.description.toLowerCase().includes('ticket')) ||
        (item.description && item.description.toLowerCase().includes('registration & opd'))
      );
      if (hasTicket && inv.date) {
        if (!lastTicketDateStr || new Date(inv.date) > new Date(lastTicketDateStr)) {
          lastTicketDateStr = inv.date;
        }
      }
    }
  }

  const currentDate = new Date();
  if (!lastTicketDateStr) {
    const validUntilDate = new Date(currentDate);
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);
    return res.json({
      enabled: true,
      status: 'FIRST_VISIT',
      fee: ticketFee,
      standardFee: ticketFee,
      isWaived: false,
      lastTicketDate: null,
      validUntil: validUntilDate.toISOString().split('T')[0],
      validityDays,
      daysRemaining: validityDays,
      ticketName,
      message: `First Visit: Standard ticket charge of ${currency} ${ticketFee} applies (valid for ${validityDays} days).`
    });
  }

  const lastTicket = new Date(lastTicketDateStr);
  const utc1 = Date.UTC(lastTicket.getFullYear(), lastTicket.getMonth(), lastTicket.getDate());
  const utc2 = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const diffDays = Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));

  const validUntilDate = new Date(lastTicket);
  validUntilDate.setDate(validUntilDate.getDate() + validityDays);
  const validUntilStr = validUntilDate.toISOString().split('T')[0];

  if (diffDays <= validityDays) {
    const daysRemaining = Math.max(0, validityDays - diffDays);
    return res.json({
      enabled: true,
      status: 'VALID_REVISIT',
      fee: 0,
      standardFee: ticketFee,
      isWaived: true,
      lastTicketDate: lastTicketDateStr,
      validUntil: validUntilStr,
      validityDays,
      daysElapsed: diffDays,
      daysRemaining,
      ticketName,
      message: `Revisit within validity window (${daysRemaining} days remaining): Ticket fee waived (${currency} 0.00 / Free Revisit).`
    });
  }

  const expiredDaysAgo = diffDays - validityDays;
  const nextValidUntilDate = new Date(currentDate);
  nextValidUntilDate.setDate(nextValidUntilDate.getDate() + validityDays);
  return res.json({
    enabled: true,
    status: 'EXPIRED',
    fee: ticketFee,
    standardFee: ticketFee,
    isWaived: false,
    lastTicketDate: lastTicketDateStr,
    validUntil: nextValidUntilDate.toISOString().split('T')[0],
    previousValidUntil: validUntilStr,
    validityDays,
    daysElapsed: diffDays,
    expiredDaysAgo,
    ticketName,
    message: `Ticket expired ${expiredDaysAgo} day(s) ago (> ${validityDays} days). New ticket charge of ${currency} ${ticketFee} applies (resets validity).`
  });
});

// ============================================================================
// PATIENT CUSTOM LAB & TREATMENT PROCEDURE ORDERS APIS
// ============================================================================

// GET /api/patients/:id/orders - List all orders for a specific patient
app.get('/api/patients/:id/orders', authenticate, resolveTenant, requirePermission('view:patient_orders'), (req, res) => {
  try {
    const orders = multiTenantDb.getPatientOrders(req.tenantId, req.params.id, req.query);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patients/:id/orders - Create custom lab/procedure order directly linked to patient
app.post('/api/patients/:id/orders', authenticate, resolveTenant, requirePermission('create:patient_order'), (req, res) => {
  try {
    const order = multiTenantDb.createPatientOrder(req.tenantId, req.params.id, req.body, req.user);
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/patients/:id/orders/:orderId - Update order specifications, materials, lab, or due date
app.put('/api/patients/:id/orders/:orderId', authenticate, resolveTenant, requirePermission('update:patient_order'), (req, res) => {
  try {
    const order = multiTenantDb.updatePatientOrder(req.tenantId, req.params.id, req.params.orderId, req.body, req.user);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/patients/:id/orders/:orderId/status - Transition stage (Requested, In Progress, Ready, Completed, Cancelled)
app.patch('/api/patients/:id/orders/:orderId/status', authenticate, resolveTenant, (req, res) => {
  const allowed = hasPermission(req.user.role, req.user.globalRole, 'update:patient_order') || 
                  hasPermission(req.user.role, req.user.globalRole, 'update:patient_order_status');
  if (!allowed) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have permission to update patient order status.' });
  }

  try {
    const { status, note } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });
    const order = multiTenantDb.updateOrderStatus(req.tenantId, req.params.id, req.params.orderId, status, note, req.user);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/patients/:id/orders/:orderId/notes - Add clinical/lab communication note
app.post('/api/patients/:id/orders/:orderId/notes', authenticate, resolveTenant, requirePermission('view:patient_orders'), (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Note text is required.' });
    const order = multiTenantDb.addOrderNote(req.tenantId, req.params.id, req.params.orderId, text, req.user);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/patients/:id/orders/:orderId/attachments - Attach file or photo to order
app.post('/api/patients/:id/orders/:orderId/attachments', authenticate, resolveTenant, requirePermission('update:patient_order'), (req, res) => {
  try {
    const order = multiTenantDb.addOrderAttachment(req.tenantId, req.params.id, req.params.orderId, req.body, req.user);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/patients/:id/orders/:orderId - Remove / cancel patient order
app.delete('/api/patients/:id/orders/:orderId', authenticate, resolveTenant, requirePermission('delete:patient_order'), (req, res) => {
  try {
    multiTenantDb.deletePatientOrder(req.tenantId, req.params.id, req.params.orderId, req.user);
    res.json({ success: true, message: 'Order deleted successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders - Centralized lab & procedure orders view across clinic
app.get('/api/orders', authenticate, resolveTenant, requirePermission('view:patient_orders'), (req, res) => {
  try {
    const orders = multiTenantDb.getAllTenantOrders(req.tenantId, req.query);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// DENTAL X-RAY & DIAGNOSTIC IMAGING (AES-256 Cloud Vault & EHR Sync)
// Accepted Formats: .dcm (DICOM), .png, .jpeg, .tiff | Max File Size: 50 MB
// ============================================================================

const uploadXray = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max per user request
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.dcm', '.png', '.jpeg', '.jpg', '.tiff', '.tif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) {
      return cb(new Error(`File format "${ext}" is not accepted. Accepted formats: .dcm (DICOM), .png, .jpeg, .tiff`));
    }
    cb(null, true);
  }
});

// 1. Generate Pre-Signed Upload Ticket / URL (valid 15 minutes, up to 50MB)
app.post('/api/xray/presigned-upload-url', optionalAuth, resolveTenant, (req, res) => {
  try {
    const { patientId, fileName, mimeType, radiographType } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required to generate a pre-signed upload URL.' });
    }

    const tData = multiTenantDb.getTenantData(req.tenantId);
    const patient = (tData?.patients || []).find(p => p.id === patientId);
    if (!patient) {
      return res.status(404).json({ error: `Patient with ID ${patientId} not found in active clinic.` });
    }

    const ticket = storageService.generatePreSignedUploadTicket(
      req.tenantId,
      patientId,
      fileName || 'radiograph.dcm',
      mimeType || 'application/dicom',
      900 // 15 mins
    );

    res.json({
      success: true,
      ticket,
      patient: { id: patient.id, name: patient.name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Upload Dental X-Ray Image (Supports .dcm, .png, .jpeg, .tiff up to 50MB with AES-256 SSE)
app.post('/api/xray/upload', optionalAuth, resolveTenant, (req, res) => {
  uploadXray.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 50 MB limit. Please compress or optimize the radiograph.' });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file payload provided. Please select a valid radiograph image.' });
      }

      const {
        patientId,
        encounterId,
        radiographType,
        toothNumbers,
        title,
        clinicalNotes,
        diagnosticImpression
      } = req.body;

      if (!patientId) {
        return res.status(400).json({ error: 'Every X-ray upload must be linked to a valid Patient ID / MRN.' });
      }

      const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
      const isDicomExt = ext === 'dcm';

      let dicomMeta = null;
      let imgMeta = null;

      if (isDicomExt || req.file.mimetype === 'application/dicom') {
        dicomMeta = parseDicomBuffer(req.file.buffer);
      } else {
        imgMeta = parseImageMetadata(req.file.buffer, req.file.originalname, req.file.mimetype);
      }

      // Generate unique record ID
      const timestamp = Date.now();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const recordId = `XRAY-2026-${timestamp.toString().slice(-4)}-${rand}`;

      // Save encrypted file with AES-256-GCM server-side encryption
      const storageManifest = await storageService.saveFile(
        req.tenantId,
        recordId,
        req.file.buffer,
        req.file.mimetype
      );

      // Assemble teeth array
      let parsedTeeth = [];
      if (Array.isArray(toothNumbers)) {
        parsedTeeth = toothNumbers;
      } else if (toothNumbers) {
        try {
          parsedTeeth = JSON.parse(toothNumbers);
        } catch {
          parsedTeeth = String(toothNumbers).split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      // Record in database and sync to Patient EHR
      const xrayRecord = multiTenantDb.addXray(
        req.tenantId,
        {
          id: recordId,
          patientId,
          encounterId: encounterId || null,
          title: title || `${radiographType || 'Radiograph'} (${ext.toUpperCase()})`,
          radiographType: radiographType || (isDicomExt ? 'Panoramic (OPG)' : 'Periapical (IOPA)'),
          toothNumbers: parsedTeeth,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          format: ext,
          mimeType: req.file.mimetype,
          storage: storageManifest,
          dicomMetadata: dicomMeta,
          imageMetadata: imgMeta,
          clinicalNotes: clinicalNotes || '',
          diagnosticImpression: diagnosticImpression || ''
        },
        req.user
      );

      // Generate pre-signed streaming URL (valid 30 mins)
      const preSignedUrl = storageService.generatePreSignedViewUrl(req.tenantId, recordId, 1800);

      res.status(201).json({
        success: true,
        message: 'Dental radiograph encrypted via AES-256 and securely linked to Patient EHR.',
        xray: {
          ...xrayRecord,
          preSignedUrl
        }
      });
    } catch (uploadErr) {
      console.error('[X-Ray Upload Error]', uploadErr);
      res.status(500).json({ error: uploadErr.message });
    }
  });
});

// 3. GET /api/xray/patient/:patientId - Get all radiographs for a specific patient EHR
app.get('/api/xray/patient/:patientId', optionalAuth, resolveTenant, (req, res) => {
  try {
    const list = multiTenantDb.getXraysByPatient(req.tenantId, req.params.patientId);
    const enriched = list.map(item => ({
      ...item,
      preSignedUrl: storageService.generatePreSignedViewUrl(req.tenantId, item.id, 1800)
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/xray - Centralized clinic-wide radiographs
app.get('/api/xray', optionalAuth, resolveTenant, (req, res) => {
  try {
    const list = multiTenantDb.getAllXrays(req.tenantId, req.query);
    const enriched = list.map(item => ({
      ...item,
      preSignedUrl: storageService.generatePreSignedViewUrl(req.tenantId, item.id, 1800)
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/xray/:imageId - Single radiograph record
app.get('/api/xray/:imageId', optionalAuth, resolveTenant, (req, res) => {
  try {
    const item = multiTenantDb.getXrayById(req.tenantId, req.params.imageId);
    if (!item) return res.status(404).json({ error: 'Radiograph record not found.' });

    res.json({
      ...item,
      preSignedUrl: storageService.generatePreSignedViewUrl(req.tenantId, item.id, 1800)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/xray/stream/:imageId - Secure Pre-Signed View Stream (Decrypts AES-256 on the fly)
app.get('/api/xray/stream/:imageId', async (req, res) => {
  try {
    const { token } = req.query;
    const { imageId } = req.params;

    if (!token) {
      return res.status(403).json({ error: 'Forbidden. Time-limited pre-signed access token is required.' });
    }

    const verification = storageService.verifyPreSignedViewToken(token, imageId);
    if (!verification.valid) {
      return res.status(403).json({ error: `Unauthorized view request: ${verification.reason}` });
    }

    const tenantId = verification.tenantId;
    const xray = multiTenantDb.getXrayById(tenantId, imageId);
    if (!xray) {
      return res.status(404).json({ error: 'Radiograph image not found.' });
    }

    // Read and decrypt ciphertext from private AES-256 vault
    const decryptedBuffer = await storageService.readFile(tenantId, imageId);

    res.set({
      'Content-Type': xray.mimeType || 'image/png',
      'Content-Length': decryptedBuffer.length,
      'Content-Disposition': `inline; filename="${xray.fileName || `${imageId}.png`}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    });

    res.send(decryptedBuffer);
  } catch (err) {
    console.error('[X-Ray Stream Error]', err);
    res.status(500).json({ error: `Decryption or streaming failed: ${err.message}` });
  }
});

// 7. PUT /api/xray/:imageId - Update radiograph diagnosis & clinical findings
app.put('/api/xray/:imageId', optionalAuth, resolveTenant, (req, res) => {
  try {
    const updated = multiTenantDb.updateXray(req.tenantId, req.params.imageId, req.body, req.user);
    res.json({
      success: true,
      xray: {
        ...updated,
        preSignedUrl: storageService.generatePreSignedViewUrl(req.tenantId, updated.id, 1800)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 8. DELETE /api/xray/:imageId - Delete radiograph from vault and EHR
app.delete('/api/xray/:imageId', optionalAuth, resolveTenant, async (req, res) => {
  try {
    await storageService.deleteFile(req.tenantId, req.params.imageId);
    multiTenantDb.deleteXray(req.tenantId, req.params.imageId, req.user);
    res.json({ success: true, message: 'Radiograph permanently deleted from private vault and patient EHR.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// APPOINTMENTS & QUEUE (Tenant Scoped)
// -------------------------------------------------------------
app.get('/api/appointments', optionalAuth, resolveTenant, (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  res.json(tData ? tData.appointments || [] : []);
});

app.post('/api/appointments', authenticate, resolveTenant, requirePermission('manage:appointments'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const newApt = {
    id: `APT-${Date.now().toString().slice(-4)}`,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
    ...req.body
  };
  if (!tData.appointments) tData.appointments = [];
  tData.appointments.unshift(newApt);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.status(201).json(newApt);
});

app.put('/api/appointments/:id', authenticate, resolveTenant, requirePermission('manage:appointments'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const apt = (tData.appointments || []).find(a => a.id === req.params.id);
  if (!apt) return res.status(404).json({ error: 'Appointment not found.' });

  Object.assign(apt, req.body);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json(apt);
});

app.delete('/api/appointments/:id', authenticate, resolveTenant, requirePermission('manage:appointments'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  const index = (tData.appointments || []).findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Appointment not found.' });

  tData.appointments.splice(index, 1);
  multiTenantDb.saveTenantData(req.tenantId, tData);
  res.json({ success: true });
});

// -------------------------------------------------------------
// AI CLINICAL DIAGNOSTIC ENGINE (Preserved)
// -------------------------------------------------------------
app.post('/api/ai/diagnose', optionalAuth, resolveTenant, (req, res) => {
  const { symptoms, toothNumber } = req.body;
  const symLower = (symptoms || '').toLowerCase();

  let diagnosis = 'General Dental Evaluation';
  let urgency = 'Routine';
  let suggestedTreatments = [];
  let suggestedMeds = [];
  let differentialDiagnoses = [];
  let clinicalAdvice = '';

  if (symLower.includes('night') || symLower.includes('throbbing') || symLower.includes('lingering') || symLower.includes('cold') || symLower.includes('hot')) {
    diagnosis = 'Acute Irreversible Pulpitis';
    urgency = 'Urgent';
    differentialDiagnoses = ['Symptomatic Irreversible Pulpitis', 'Symptomatic Apical Periodontitis'];
    suggestedTreatments = [
      { code: 'D3330', name: 'Root Canal Treatment (Rotary RCT)', cost: 6500 },
      { code: 'D2740', name: 'Zirconia Crown Restoration', cost: 10000 }
    ];
    suggestedMeds = ['Zerodol-SP (1 tablet twice daily for 3 days)', 'Augmentin 625mg (if swelling present)'];
    clinicalAdvice = 'Perform cold pulp vitality test and periapical radiograph (IOPA). Administer local anesthesia and extirpate necrotic/inflamed coronal pulp.';
  } else if (symLower.includes('bleeding') || symLower.includes('gum') || symLower.includes('swollen')) {
    diagnosis = 'Chronic Marginal Gingivitis / Early Periodontitis';
    urgency = 'Moderate';
    differentialDiagnoses = ['Plaque-Induced Gingivitis', 'Early Periodontitis'];
    suggestedTreatments = [{ code: 'D1110', name: 'Ultrasonic Scaling and Polishing', cost: 1500 }];
    suggestedMeds = ['Hexidine 0.2% Chlorhexidine Mouthwash (10ml twice daily)'];
    clinicalAdvice = 'Measure probing depths and plaque score. Educate patient on Modified Bass brushing technique.';
  } else {
    diagnosis = 'Dental Caries (Enamel/Dentin)';
    urgency = 'Routine';
    suggestedTreatments = [{ code: 'D2330', name: 'Aesthetic Composite Restoration', cost: 1800 }];
    suggestedMeds = ['No systemic medications required'];
    clinicalAdvice = 'Excavate carious dentin and restore with light-cured composite resin.';
  }

  res.json({ diagnosis, urgency, differentialDiagnoses, suggestedTreatments, suggestedMeds, clinicalAdvice });
});

// Translation Explainer
app.post('/api/ai/explain', (req, res) => {
  const { procedureName, toothNumber } = req.body;
  res.json({
    english: `Hello. Your treatment for tooth #${toothNumber || '16'} is ${procedureName || 'Dental Procedure'}. This restores your tooth structure and eliminates pain.`,
    hindi: `Hello. Your treatment for tooth #${toothNumber || '16'} is ${procedureName || 'Dental Procedure'}. This restores your tooth structure and eliminates pain.`,
    nepali: `Hello. Your treatment for tooth #${toothNumber || '16'} is ${procedureName || 'Dental Procedure'}. This restores your tooth structure and eliminates pain.`
  });
});

// ============================================================================
// 10. PHARMACY OPERATIONS & STOCK MANAGEMENT APIS
// ============================================================================

// GET /api/pharmacy/overview - Real-time valuation, alerts, and metrics
app.get('/api/pharmacy/overview', authenticate, resolveTenant, requireModule('pharmacy'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const catalog = tData.pharmacyCatalog || [];
  const batches = tData.pharmacyBatches || [];
  const sales = tData.pharmacySales || [];
  const purchases = tData.pharmacyPurchases || [];
  const adjustments = tData.pharmacyAdjustments || [];

  const now = new Date();
  const nearExpiryThreshold = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

  let totalStockUnits = 0;
  let inventoryValuationCost = 0;
  let inventoryValuationRetail = 0;
  let expiredCount = 0;
  let nearExpiryCount = 0;

  batches.forEach(b => {
    const qty = Number(b.quantity || 0);
    const expDate = new Date(b.expiryDate);
    const isExpired = expDate < now;
    const isNearExpiry = !isExpired && expDate <= nearExpiryThreshold;

    if (isExpired) {
      expiredCount++;
    } else {
      totalStockUnits += qty;
      inventoryValuationCost += qty * Number(b.purchasePrice || 0);
      inventoryValuationRetail += qty * Number(b.sellingPrice || 0);
      if (isNearExpiry) nearExpiryCount++;
    }
  });

  // Calculate low stock items (sum of active stock <= reorderThreshold)
  let lowStockCount = 0;
  catalog.forEach(med => {
    const medBatches = batches.filter(b => b.medicineId === med.id && new Date(b.expiryDate) >= now);
    const currentStock = medBatches.reduce((acc, b) => acc + Number(b.quantity || 0), 0);
    if (currentStock <= Number(med.reorderThreshold || 20)) {
      lowStockCount++;
    }
  });

  // Today's Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date && s.date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0);

  res.json({
    totalMedicines: catalog.length,
    totalBatches: batches.length,
    totalStockUnits,
    inventoryValuationCost: Math.round(inventoryValuationCost * 100) / 100,
    inventoryValuationRetail: Math.round(inventoryValuationRetail * 100) / 100,
    potentialMargin: Math.round((inventoryValuationRetail - inventoryValuationCost) * 100) / 100,
    lowStockCount,
    nearExpiryCount,
    expiredCount,
    totalSalesCount: sales.length,
    todaySalesCount: todaySales.length,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    currency: tData.clinicProfile?.currency || 'Rs.'
  });
});

// GET /api/pharmacy/catalog - Get all medicines with batch breakdown & status
app.get('/api/pharmacy/catalog', authenticate, resolveTenant, requireModule('pharmacy'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const catalog = tData.pharmacyCatalog || [];
  const batches = tData.pharmacyBatches || [];
  const now = new Date();
  const nearExpiryThreshold = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const enriched = catalog.map(med => {
    const medBatches = batches.filter(b => b.medicineId === med.id);
    const activeBatches = medBatches.filter(b => new Date(b.expiryDate) >= now);
    const expiredBatches = medBatches.filter(b => new Date(b.expiryDate) < now);
    const nearExpiryBatches = medBatches.filter(b => {
      const exp = new Date(b.expiryDate);
      return exp >= now && exp <= nearExpiryThreshold;
    });

    const totalStock = activeBatches.reduce((acc, b) => acc + Number(b.quantity || 0), 0);
    const isLowStock = totalStock <= Number(med.reorderThreshold || 20);

    return {
      ...med,
      totalStock,
      isLowStock,
      batchesCount: medBatches.length,
      activeBatchesCount: activeBatches.length,
      expiredBatchesCount: expiredBatches.length,
      nearExpiryBatchesCount: nearExpiryBatches.length,
      batches: medBatches.map(b => ({
        ...b,
        status: new Date(b.expiryDate) < now
          ? 'EXPIRED'
          : new Date(b.expiryDate) <= nearExpiryThreshold
          ? 'NEAR_EXPIRY'
          : 'ACTIVE'
      }))
    };
  });

  res.json(enriched);
});

// POST /api/pharmacy/catalog - Add medicine to catalog
app.post('/api/pharmacy/catalog', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_catalog'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const {
    name,
    genericName,
    brand,
    category,
    strength,
    dosageForm,
    barcode,
    supplier,
    purchasePrice,
    sellingPrice,
    reorderThreshold,
    storageLocation
  } = req.body;

  if (!name || !category || !dosageForm) {
    return res.status(400).json({ error: 'Name, category, and dosage form are required.' });
  }

  const newMedicine = {
    id: `PHARM-MED-${Date.now().toString().slice(-6)}`,
    name: name.trim(),
    genericName: (genericName || '').trim(),
    brand: (brand || '').trim(),
    category: category.trim(),
    strength: (strength || '').trim(),
    dosageForm: dosageForm.trim(),
    barcode: (barcode || '').trim(),
    supplier: (supplier || '').trim(),
    purchasePrice: Number(purchasePrice || 0),
    sellingPrice: Number(sellingPrice || 0),
    reorderThreshold: Number(reorderThreshold || 20),
    storageLocation: (storageLocation || 'General Rack').trim(),
    createdAt: new Date().toISOString()
  };

  if (!tData.pharmacyCatalog) tData.pharmacyCatalog = [];
  tData.pharmacyCatalog.unshift(newMedicine);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PHARMACY_MEDICINE_CREATED',
    resource: 'pharmacy_catalog',
    resourceId: newMedicine.id,
    details: { name: newMedicine.name, brand: newMedicine.brand, sellingPrice: newMedicine.sellingPrice }
  });

  res.status(201).json(newMedicine);
});

// PUT /api/pharmacy/catalog/:id - Update medicine details & pricing
app.put('/api/pharmacy/catalog/:id', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_catalog'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const { id } = req.params;
  const index = (tData.pharmacyCatalog || []).findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Medicine not found.' });

  const oldMed = tData.pharmacyCatalog[index];
  const updatedMed = {
    ...oldMed,
    ...req.body,
    id: oldMed.id,
    purchasePrice: Number(req.body.purchasePrice !== undefined ? req.body.purchasePrice : oldMed.purchasePrice),
    sellingPrice: Number(req.body.sellingPrice !== undefined ? req.body.sellingPrice : oldMed.sellingPrice),
    reorderThreshold: Number(req.body.reorderThreshold !== undefined ? req.body.reorderThreshold : oldMed.reorderThreshold),
    updatedAt: new Date().toISOString()
  };

  tData.pharmacyCatalog[index] = updatedMed;
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PHARMACY_MEDICINE_UPDATED',
    resource: 'pharmacy_catalog',
    resourceId: id,
    details: {
      name: updatedMed.name,
      oldSellingPrice: oldMed.sellingPrice,
      newSellingPrice: updatedMed.sellingPrice
    }
  });

  res.json(updatedMed);
});

// DELETE /api/pharmacy/catalog/:id - Archive medicine (prevent if stock exists)
app.delete('/api/pharmacy/catalog/:id', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_catalog'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const { id } = req.params;
  const batches = (tData.pharmacyBatches || []).filter(b => b.medicineId === id);
  const totalStock = batches.reduce((acc, b) => acc + Number(b.quantity || 0), 0);

  if (totalStock > 0) {
    return res.status(400).json({
      error: 'CANNOT_DELETE_ACTIVE_STOCK',
      message: `Cannot delete medicine because ${totalStock} units remain in inventory. Adjust or dispense stock first.`
    });
  }

  tData.pharmacyCatalog = (tData.pharmacyCatalog || []).filter(m => m.id !== id);
  tData.pharmacyBatches = (tData.pharmacyBatches || []).filter(b => b.medicineId !== id);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PHARMACY_MEDICINE_DELETED',
    resource: 'pharmacy_catalog',
    resourceId: id
  });

  res.json({ success: true, message: 'Medicine catalog record archived.' });
});

// GET /api/pharmacy/batches - All inventory batches with expiry status
app.get('/api/pharmacy/batches', authenticate, resolveTenant, requireModule('pharmacy'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const batches = tData.pharmacyBatches || [];
  const catalog = tData.pharmacyCatalog || [];
  const now = new Date();
  const nearExpiryThreshold = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const enriched = batches.map(b => {
    const med = catalog.find(m => m.id === b.medicineId) || {};
    const expDate = new Date(b.expiryDate);
    const isExpired = expDate < now;
    const isNearExpiry = !isExpired && expDate <= nearExpiryThreshold;
    const status = isExpired ? 'EXPIRED' : isNearExpiry ? 'NEAR_EXPIRY' : 'ACTIVE';

    return {
      ...b,
      medicineName: med.name || 'Unknown Medicine',
      genericName: med.genericName || '',
      brand: med.brand || '',
      dosageForm: med.dosageForm || 'Tablet',
      strength: med.strength || '',
      status,
      daysToExpiry: Math.ceil((expDate - now) / (1000 * 60 * 60 * 24))
    };
  });

  // Sort: First Expired First Out (FEFO) recommendation
  enriched.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  res.json(enriched);
});

// POST /api/pharmacy/batches - Add batch manually
app.post('/api/pharmacy/batches', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_stock'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const { medicineId, batchNumber, quantity, purchasePrice, sellingPrice, expiryDate, storageLocation, supplierInvoice } = req.body;
  if (!medicineId || !batchNumber || !expiryDate || quantity === undefined) {
    return res.status(400).json({ error: 'Medicine, batch number, expiry date, and quantity are required.' });
  }

  const newBatch = {
    id: `BATCH-${Date.now().toString().slice(-6)}`,
    medicineId,
    batchNumber: batchNumber.trim().toUpperCase(),
    quantity: Number(quantity),
    initialQuantity: Number(quantity),
    purchasePrice: Number(purchasePrice || 0),
    sellingPrice: Number(sellingPrice || 0),
    expiryDate,
    storageLocation: (storageLocation || 'General Shelf').trim(),
    supplierInvoice: (supplierInvoice || '').trim(),
    receivedDate: new Date().toISOString().split('T')[0]
  };

  if (!tData.pharmacyBatches) tData.pharmacyBatches = [];
  tData.pharmacyBatches.unshift(newBatch);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PHARMACY_BATCH_ADDED',
    resource: 'pharmacy_batches',
    resourceId: newBatch.id,
    details: { medicineId, batchNumber: newBatch.batchNumber, quantity: newBatch.quantity, expiryDate }
  });

  res.status(201).json(newBatch);
});

// POST /api/pharmacy/sales - Process Pharmacy POS Sale with Strict Expiry Safeguard
app.post('/api/pharmacy/sales', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('process:pharmacy_sale'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const {
    patientId,
    patientName,
    patientPhone,
    items = [],
    discountPercent = 0,
    paymentMethod = 'Cash',
    notes = ''
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'At least one medicine item is required for sale.' });
  }

  const catalog = tData.pharmacyCatalog || [];
  const batches = tData.pharmacyBatches || [];
  const now = new Date();

  // 1. Validation & Expiry Safeguards Check
  for (const item of items) {
    const batch = batches.find(b => b.id === item.batchId);
    if (!batch) {
      return res.status(400).json({ error: 'BATCH_NOT_FOUND', message: `Batch ${item.batchId} not found.` });
    }

    const expDate = new Date(batch.expiryDate);
    // STRICT MEDICAL SAFEGUARD: Expired drugs must NEVER be dispensed
    if (expDate < now) {
      const med = catalog.find(m => m.id === batch.medicineId) || { name: 'Medicine' };
      return res.status(400).json({
        error: 'EXPIRED_MEDICINE_BLOCKED',
        message: `⛔ SAFETY ALERT: Batch [${batch.batchNumber}] of [${med.name}] expired on ${batch.expiryDate} and is strictly prohibited from being sold. Expired stock must be quarantined.`
      });
    }

    if (Number(batch.quantity || 0) < Number(item.quantity)) {
      const med = catalog.find(m => m.id === batch.medicineId) || { name: 'Medicine' };
      return res.status(400).json({
        error: 'INSUFFICIENT_STOCK',
        message: `Insufficient stock for [${med.name}] in batch [${batch.batchNumber}]. Available: ${batch.quantity}, requested: ${item.quantity}.`
      });
    }
  }

  // 2. Decrement batch inventory & compute totals
  let subtotal = 0;
  const processedItems = items.map(item => {
    const batch = batches.find(b => b.id === item.batchId);
    const med = catalog.find(m => m.id === batch.medicineId) || {};
    const qty = Number(item.quantity);
    const unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : batch.sellingPrice);
    const itemTotal = qty * unitPrice;
    subtotal += itemTotal;

    // Deduct stock from batch
    batch.quantity = Number(batch.quantity) - qty;

    return {
      medicineId: batch.medicineId,
      medicineName: med.name || 'Medicine',
      genericName: med.genericName || '',
      brand: med.brand || '',
      strength: med.strength || '',
      dosageForm: med.dosageForm || 'Tablet',
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: qty,
      unitPrice,
      total: Math.round(itemTotal * 100) / 100
    };
  });

  const discPct = Math.min(Math.max(Number(discountPercent || 0), 0), 100);
  const discountAmount = Math.round(subtotal * (discPct / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;

  const receiptNumber = `PHARM-INV-${Date.now().toString().slice(-6)}`;
  const saleRecord = {
    id: `PSALE-${Date.now()}`,
    receiptNumber,
    date: new Date().toISOString(),
    patientId: patientId || null,
    patientName: (patientName || 'Walk-in Customer').trim(),
    patientPhone: (patientPhone || '').trim(),
    items: processedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discountPercent: discPct,
    discountAmount,
    totalAmount,
    paidAmount: totalAmount,
    paymentMethod: paymentMethod || 'Cash',
    servedBy: req.user.id,
    staffName: req.user.name,
    notes: (notes || '').trim(),
    status: 'COMPLETED'
  };

  if (!tData.pharmacySales) tData.pharmacySales = [];
  tData.pharmacySales.unshift(saleRecord);

  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PHARMACY_SALE_PROCESSED',
    resource: 'pharmacy_sales',
    resourceId: saleRecord.id,
    details: {
      receiptNumber,
      patientName: saleRecord.patientName,
      itemsCount: processedItems.length,
      totalAmount,
      paymentMethod
    }
  });

  res.status(201).json(saleRecord);
});

// GET /api/pharmacy/sales - Get sales history
app.get('/api/pharmacy/sales', authenticate, resolveTenant, requireModule('pharmacy'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });
  res.json(tData.pharmacySales || []);
});

// GET /api/pharmacy/purchases - Inward purchase delivery receipts
app.get('/api/pharmacy/purchases', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_purchases'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });
  res.json(tData.pharmacyPurchases || []);
});

// POST /api/pharmacy/purchases - Receive Supplier Inward Delivery
app.post('/api/pharmacy/purchases', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_purchases'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const { supplier, supplierInvoice, purchaseDate, items = [] } = req.body;
  if (!supplier || !items || items.length === 0) {
    return res.status(400).json({ error: 'Supplier and at least one inward medicine item are required.' });
  }

  if (!tData.pharmacyBatches) tData.pharmacyBatches = [];
  if (!tData.pharmacyCatalog) tData.pharmacyCatalog = [];
  if (!tData.pharmacyPurchases) tData.pharmacyPurchases = [];

  let totalCost = 0;
  const processedItems = items.map(item => {
    const qty = Number(item.quantity || 0);
    const purchasePrice = Number(item.purchasePrice || 0);
    const sellingPrice = Number(item.sellingPrice || 0);
    const lineTotal = qty * purchasePrice;
    totalCost += lineTotal;

    // Check if batch already exists in this tenant
    const existingBatch = tData.pharmacyBatches.find(
      b => b.medicineId === item.medicineId && b.batchNumber.toUpperCase() === item.batchNumber.trim().toUpperCase()
    );

    if (existingBatch) {
      existingBatch.quantity = Number(existingBatch.quantity || 0) + qty;
      existingBatch.purchasePrice = purchasePrice || existingBatch.purchasePrice;
      existingBatch.sellingPrice = sellingPrice || existingBatch.sellingPrice;
      existingBatch.expiryDate = item.expiryDate || existingBatch.expiryDate;
    } else {
      const newBatch = {
        id: `BATCH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        medicineId: item.medicineId,
        batchNumber: item.batchNumber.trim().toUpperCase(),
        quantity: qty,
        initialQuantity: qty,
        purchasePrice,
        sellingPrice,
        expiryDate: item.expiryDate,
        storageLocation: (item.storageLocation || 'Main Pharmacy Rack').trim(),
        supplierInvoice: (supplierInvoice || '').trim(),
        receivedDate: purchaseDate || new Date().toISOString().split('T')[0]
      };
      tData.pharmacyBatches.unshift(newBatch);
    }

    // Update catalog prices
    const catalogItem = tData.pharmacyCatalog.find(m => m.id === item.medicineId);
    if (catalogItem) {
      if (purchasePrice > 0) catalogItem.purchasePrice = purchasePrice;
      if (sellingPrice > 0) catalogItem.sellingPrice = sellingPrice;
    }

    return {
      medicineId: item.medicineId,
      medicineName: item.medicineName || (catalogItem ? catalogItem.name : 'Medicine'),
      batchNumber: item.batchNumber.trim().toUpperCase(),
      expiryDate: item.expiryDate,
      quantity: qty,
      purchasePrice,
      sellingPrice,
      total: lineTotal
    };
  });

  const purchaseRecord = {
    id: `PO-${Date.now()}`,
    supplier: supplier.trim(),
    supplierInvoice: (supplierInvoice || `INV-SUP-${Date.now().toString().slice(-4)}`).trim(),
    purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
    receivedBy: req.user.name,
    totalCost: Math.round(totalCost * 100) / 100,
    items: processedItems,
    status: 'RECEIVED',
    createdAt: new Date().toISOString()
  };

  tData.pharmacyPurchases.unshift(purchaseRecord);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PHARMACY_STOCK_RECEIVED',
    resource: 'pharmacy_purchases',
    resourceId: purchaseRecord.id,
    details: { supplier, invoice: purchaseRecord.supplierInvoice, totalCost, itemsCount: processedItems.length }
  });

  res.status(201).json(purchaseRecord);
});

// GET /api/pharmacy/adjustments - Stock adjustment & return history
app.get('/api/pharmacy/adjustments', authenticate, resolveTenant, requireModule('pharmacy'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });
  res.json(tData.pharmacyAdjustments || []);
});

// POST /api/pharmacy/adjustments - Record Stock Adjustment or Return with Reason
app.post('/api/pharmacy/adjustments', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_adjustments'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const { batchId, quantity, type, reason } = req.body;
  if (!batchId || quantity === undefined || !type || !reason) {
    return res.status(400).json({ error: 'Batch ID, quantity change, adjustment type, and reason are required.' });
  }

  const batch = (tData.pharmacyBatches || []).find(b => b.id === batchId);
  if (!batch) return res.status(404).json({ error: 'Batch not found.' });

  const catalogItem = (tData.pharmacyCatalog || []).find(m => m.id === batch.medicineId) || {};
  const previousQty = Number(batch.quantity || 0);
  const changeQty = Number(quantity); // can be negative (damaged/write-off) or positive (return)
  const newQty = Math.max(0, previousQty + changeQty);

  batch.quantity = newQty;

  const adjustmentRecord = {
    id: `ADJ-${Date.now()}`,
    date: new Date().toISOString(),
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    medicineId: batch.medicineId,
    medicineName: catalogItem.name || 'Medicine',
    type, // 'DAMAGED' | 'EXPIRED_WRITE_OFF' | 'INVENTORY_VARIANCE' | 'PATIENT_RETURN'
    quantity: changeQty,
    previousQty,
    newQty,
    reason: reason.trim(),
    adjustedBy: req.user.name,
    staffId: req.user.id
  };

  if (!tData.pharmacyAdjustments) tData.pharmacyAdjustments = [];
  tData.pharmacyAdjustments.unshift(adjustmentRecord);

  multiTenantDb.saveTenantData(req.tenantId, tData);

  multiTenantDb.logTenantAudit(req.tenantId, {
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'PHARMACY_STOCK_ADJUSTMENT',
    resource: 'pharmacy_adjustments',
    resourceId: adjustmentRecord.id,
    details: {
      medicineName: catalogItem.name,
      batchNumber: batch.batchNumber,
      type,
      changeQty,
      previousQty,
      newQty,
      reason
    }
  });

  res.status(201).json(adjustmentRecord);
});

// GET /api/pharmacy/suppliers - Supplier Directory
app.get('/api/pharmacy/suppliers', authenticate, resolveTenant, requireModule('pharmacy'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });
  res.json(tData.pharmacySuppliers || []);
});

// POST /api/pharmacy/suppliers - Add Supplier
app.post('/api/pharmacy/suppliers', authenticate, resolveTenant, requireModule('pharmacy'), requirePermission('manage:pharmacy_catalog'), (req, res) => {
  const tData = multiTenantDb.getTenantData(req.tenantId);
  if (!tData) return res.status(404).json({ error: 'TENANT_DATA_NOT_FOUND' });

  const { name, contactPerson, phone, email, address, drugLicenseNo } = req.body;
  if (!name) return res.status(400).json({ error: 'Supplier company name is required.' });

  const newSupplier = {
    id: `SUP-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    contactPerson: (contactPerson || '').trim(),
    phone: (phone || '').trim(),
    email: (email || '').trim(),
    address: (address || '').trim(),
    drugLicenseNo: (drugLicenseNo || '').trim(),
    createdAt: new Date().toISOString()
  };

  if (!tData.pharmacySuppliers) tData.pharmacySuppliers = [];
  tData.pharmacySuppliers.unshift(newSupplier);
  multiTenantDb.saveTenantData(req.tenantId, tData);

  res.status(201).json(newSupplier);
});

// ============================================================================
// 11. FINANCE MANAGEMENT MODULE APIS
// ============================================================================

// GET /api/finance/account - Retrieve clinic organization receiving account & QR
app.get('/api/finance/account', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const account = multiTenantDb.getFinanceAccount(req.tenantId);
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/finance/account - Update clinic payment details and QR code
app.put('/api/finance/account', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:finance_account'), (req, res) => {
  try {
    const updated = multiTenantDb.updateFinanceAccount(req.tenantId, req.body, req.user);
    res.json({ success: true, account: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/transactions - Centralized transaction ledger with search, filters, pagination
app.get('/api/finance/transactions', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const result = multiTenantDb.getFinanceTransactions(req.tenantId, req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/transactions - Record new financial transaction
app.post('/api/finance/transactions', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const txn = multiTenantDb.createFinanceTransaction(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, transaction: txn });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/patient-transactions - Patient payment activity, total received, outstanding balances, refunds
app.get('/api/finance/patient-transactions', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:patient_transactions'), (req, res) => {
  try {
    const patientReports = multiTenantDb.getPatientTransactions(req.tenantId, req.query);
    res.json(patientReports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/patient-transactions/:patientId/refund - Issue patient refund
app.post('/api/finance/patient-transactions/:patientId/refund', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:patient_transactions'), (req, res) => {
  try {
    const result = multiTenantDb.issuePatientRefund(req.tenantId, req.params.patientId, req.body, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/staff-payments - Staff payment sheet records
app.get('/api/finance/staff-payments', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const sheet = multiTenantDb.getStaffPayments(req.tenantId, req.query);
    res.json(sheet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/staff-payments - Create / record staff payment
app.post('/api/finance/staff-payments', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:staff_payments'), (req, res) => {
  try {
    const payment = multiTenantDb.createStaffPayment(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/finance/staff-payments/:id/status - Update staff payment status (Paid, Pending, Processing)
app.patch('/api/finance/staff-payments/:id/status', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:staff_payments'), (req, res) => {
  try {
    const { status, refNumber } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });
    const updated = multiTenantDb.updateStaffPaymentStatus(req.tenantId, req.params.id, status, refNumber, req.user);
    res.json({ success: true, payment: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/staff-advances - List all staff salary advances and loan balances
app.get('/api/finance/staff-advances', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const advances = multiTenantDb.getStaffAdvances(req.tenantId, req.query);
    res.json(advances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/staff-advances - Disburse / request new staff salary advance
app.post('/api/finance/staff-advances', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:staff_payments'), (req, res) => {
  try {
    const advance = multiTenantDb.createStaffAdvance(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, advance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/finance/staff-advances/:id/status - Approve, reject, or update advance status
app.patch('/api/finance/staff-advances/:id/status', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:staff_payments'), (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });
    const updated = multiTenantDb.updateStaffAdvanceStatus(req.tenantId, req.params.id, status, req.user);
    res.json({ success: true, advance: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/finance/staff-advances/:id/repay - Record manual cash/bank repayment against advance
app.post('/api/finance/staff-advances/:id/repay', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:staff_payments'), (req, res) => {
  try {
    const result = multiTenantDb.recordAdvanceRepayment(req.tenantId, req.params.id, req.body, req.user);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/payouts - Payouts to staff, laboratories, suppliers, consultants
app.get('/api/finance/payouts', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const payouts = multiTenantDb.getPayouts(req.tenantId, req.query);
    res.json(payouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/finance/payouts - Record / request payout
app.post('/api/finance/payouts', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:payouts'), (req, res) => {
  try {
    const payout = multiTenantDb.createPayout(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, payout });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/finance/payouts/:id/status - Approve, reject, or mark paid
app.patch('/api/finance/payouts/:id/status', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:payouts'), (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });
    const updated = multiTenantDb.updatePayoutStatus(req.tenantId, req.params.id, status, req.user, notes);
    res.json({ success: true, payout: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/finance/summary - Total financial activity dashboard metrics & period comparisons
app.get('/api/finance/summary', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const summary = multiTenantDb.getFinanceSummary(req.tenantId, req.query);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/finance/export - Export reports (CSV format)
app.get('/api/finance/export', authenticate, resolveTenant, requireModule('finance'), requirePermission('export:finance_reports'), (req, res) => {
  try {
    const { type = 'transactions' } = req.query;
    const csvData = multiTenantDb.exportFinanceData(req.tenantId, type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="finance_${type}_${Date.now()}.csv"`);
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 12. ACCOUNTING & DOUBLE-ENTRY ENTERPRISE MODULE APIS
// ============================================================================

// GET /api/accounting/chart-of-accounts - List all accounts with balances
app.get('/api/accounting/chart-of-accounts', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const coa = multiTenantDb.getChartOfAccounts(req.tenantId);
    res.json(coa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/chart-of-accounts - Create new account
app.post('/api/accounting/chart-of-accounts', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const account = multiTenantDb.createAccount(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, account });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/accounting/chart-of-accounts/:code - Update account details
app.put('/api/accounting/chart-of-accounts/:code', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const account = multiTenantDb.updateAccount(req.tenantId, req.params.code, req.body, req.user);
    res.json({ success: true, account });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/journal-entries - List double-entry journal entries with filters
app.get('/api/accounting/journal-entries', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const entries = multiTenantDb.getJournalEntries(req.tenantId, req.query);
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/journal-entries - Create balanced manual journal entry
app.post('/api/accounting/journal-entries', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const entry = multiTenantDb.createJournalEntry(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, entry });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/accounting/journal-entries/:id/reverse - Authorized reversal of posted journal entry
app.post('/api/accounting/journal-entries/:id/reverse', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Authorized audit reason is required to reverse a journal entry.' });
    }
    const result = multiTenantDb.reverseJournalEntry(req.tenantId, req.params.id, reason, req.user);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/general-ledger - Account movement ledger with running balances
app.get('/api/accounting/general-ledger', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const gl = multiTenantDb.getGeneralLedger(req.tenantId, req.query);
    res.json(gl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounting/trial-balance - Debits vs Credits verification sheet
app.get('/api/accounting/trial-balance', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const tb = multiTenantDb.getTrialBalance(req.tenantId);
    res.json(tb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounting/expenses - List all expense vouchers and supplier bills
app.get('/api/accounting/expenses', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const expenses = multiTenantDb.getExpenseVouchers(req.tenantId, req.query);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/expenses - Record new expense voucher
app.post('/api/accounting/expenses', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const voucher = multiTenantDb.createExpenseVoucher(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, voucher });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/accounting/expenses/:id/status - Update payment or approval status
app.patch('/api/accounting/expenses/:id/status', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const updated = multiTenantDb.updateExpenseVoucherStatus(req.tenantId, req.params.id, req.body, req.user);
    res.json({ success: true, voucher: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/advance-deposits - List patient advance deposits
app.get('/api/accounting/advance-deposits', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const deposits = multiTenantDb.getAdvanceDeposits(req.tenantId, req.query);
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/advance-deposits - Record new patient advance deposit
app.post('/api/accounting/advance-deposits', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:patient_transactions'), (req, res) => {
  try {
    const deposit = multiTenantDb.createAdvanceDeposit(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, deposit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/accounting/advance-deposits/:id/apply - Apply advance deposit credit to an invoice
app.post('/api/accounting/advance-deposits/:id/apply', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:patient_transactions'), (req, res) => {
  try {
    const { invoiceId, amount } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json({ error: 'Invoice ID and applied amount are required.' });
    }
    const result = multiTenantDb.applyAdvanceDeposit(req.tenantId, req.params.id, invoiceId, amount, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/credit-notes - List patient credit notes & adjustments
app.get('/api/accounting/credit-notes', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const cns = multiTenantDb.getCreditNotes(req.tenantId, req.query);
    res.json(cns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/credit-notes - Issue approved credit note
app.post('/api/accounting/credit-notes', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:patient_transactions'), (req, res) => {
  try {
    const cn = multiTenantDb.createCreditNote(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, creditNote: cn });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/receipts - List payment receipts
app.get('/api/accounting/receipts', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const receipts = multiTenantDb.getReceipts(req.tenantId, req.query);
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/receipts - Generate official receipt
app.post('/api/accounting/receipts', authenticate, resolveTenant, requireModule('finance'), requirePermission('collect:payment'), (req, res) => {
  try {
    const receipt = multiTenantDb.createReceipt(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, receipt });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/reconciliations - List bank reconciliation sessions
app.get('/api/accounting/reconciliations', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const recs = multiTenantDb.getBankReconciliations(req.tenantId);
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounting/reconciliations - Record bank reconciliation session
app.post('/api/accounting/reconciliations', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:transactions'), (req, res) => {
  try {
    const rec = multiTenantDb.createBankReconciliation(req.tenantId, req.body, req.user);
    res.status(201).json({ success: true, reconciliation: rec });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/tax-config - Get tax configuration
app.get('/api/accounting/tax-config', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const config = multiTenantDb.getTaxConfig(req.tenantId);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounting/tax-config - Update tax configuration
app.put('/api/accounting/tax-config', authenticate, resolveTenant, requireModule('finance'), requirePermission('manage:finance_account'), (req, res) => {
  try {
    const updated = multiTenantDb.updateTaxConfig(req.tenantId, req.body, req.user);
    res.json({ success: true, taxConfig: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/accounting/reports/:reportType - Generate any of the 7 accounting reports
app.get('/api/accounting/reports/:reportType', authenticate, resolveTenant, requireModule('finance'), requirePermission('view:finance'), (req, res) => {
  try {
    const report = multiTenantDb.getAccountingReportFull(req.tenantId, req.params.reportType, req.query);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounting/export/:reportType - Export report or data to CSV
app.get('/api/accounting/export/:reportType', authenticate, resolveTenant, requireModule('finance'), requirePermission('export:finance_reports'), (req, res) => {
  try {
    const { reportType } = req.params;
    const csvData = multiTenantDb.exportAccountingReportCsv(req.tenantId, reportType, req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="accounting_${reportType}_${Date.now()}.csv"`);
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Production Static Frontend Assets
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// START SERVER
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Anaya Craft Multi-Tenant Dental SaaS API Server`);
  console.log(`Primary Clinic: Nepal Dental and Healthcare Wellness Centre`);
  console.log(`Named Doctor: Dr. Mukesh Kushwaha`);
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

export default app;
