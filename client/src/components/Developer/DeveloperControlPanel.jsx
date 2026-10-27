import React, { useState, useEffect } from 'react';
import AnayaCraftLogo, { AnayaCraftEmblem } from '../Common/AnayaCraftLogo';
import {
  Building,
  Users,
  Shield,
  Globe,
  Plus,
  CheckCircle,
  AlertTriangle,
  Server,
  Key,
  CreditCard,
  Activity,
  Search,
  ExternalLink,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Edit,
  Check,
  X,
  Eye,
  Receipt,
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  Filter,
  ChevronDown,
  Trash2
} from 'lucide-react';

export default function DeveloperControlPanel({ authToken, onTenantUpdated }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tenants' | 'domains' | 'plans' | 'audit' | 'support'
  const [overview, setOverview] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [domains, setDomains] = useState([]);
  const [plans, setPlans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [renewalFilter, setRenewalFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [receiptToInspect, setReceiptToInspect] = useState(null);
  const [approveConfirmTarget, setApproveConfirmTarget] = useState(null);
  const [rejectModalTarget, setRejectModalTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionInstructions, setRejectionInstructions] = useState('');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Form for New Clinic Wizard
  const [newClinic, setNewClinic] = useState({
    name: '',
    slug: '',
    country: 'Nepal',
    currency: 'Rs.',
    timeZone: 'Asia/Kathmandu',
    planId: 'plan-professional',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    doctorName: '',
    enablePharmacy: true,
    enableFinance: true
  });

  // Form for Support Access Grant
  const [supportForm, setSupportForm] = useState({
    tenantId: 'tenant-nepal-dental',
    reason: '',
    durationMinutes: 60
  });

  // State for Edit Clinic Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    planId: 'plan-professional',
    country: 'Nepal',
    currency: 'Rs.',
    timeZone: 'Asia/Kathmandu',
    status: 'Active',
    address: '',
    phone: '',
    doctorInCharge: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    enablePharmacy: true,
    enableFinance: true,
    subscriptionStatus: 'Active',
    subscriptionBillingCycle: 'Yearly',
    subscriptionExpiryDate: ''
  });

  // State for Plan Edit / Create Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    priceMonthly: 3500,
    priceYearly: 35000,
    maxBranches: 1,
    maxStaff: 5,
    maxPatients: 1000,
    storageQuotaGb: 5,
    modules: {
      charting: true,
      appointments: true,
      billing: true,
      prescriptions: true,
      whatsapp: true,
      aiAssistant: false,
      pharmacy: false,
      finance: false,
      multiBranch: false,
      advancedAnalytics: false
    }
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : ''
  };

  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      const [resOver, resTenants, resDomains, resPlans, resAudit, resRenewals] = await Promise.all([
        fetch('/api/platform/overview', { headers }).then(r => r.json()),
        fetch('/api/platform/tenants', { headers }).then(r => r.json()),
        fetch('/api/platform/domains', { headers }).then(r => r.json()),
        fetch('/api/platform/subscriptions', { headers }).then(r => r.json()),
        fetch('/api/platform/audit-logs', { headers }).then(r => r.json()),
        fetch('/api/platform/renewals', { headers }).then(r => r.json()).catch(() => [])
      ]);

      setOverview(resOver);
      setTenants(Array.isArray(resTenants) ? resTenants : []);
      setDomains(Array.isArray(resDomains) ? resDomains : []);
      setPlans(resPlans?.plans || []);
      setAuditLogs(Array.isArray(resAudit) ? resAudit : []);
      setRenewals(Array.isArray(resRenewals) ? resRenewals : []);
    } catch (err) {
      console.error('Error fetching platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRenewal = async (renewal) => {
    setActionProcessing(true);
    try {
      const res = await fetch(`/api/platform/renewals/${renewal.id}/approve`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setToast(`✅ Subscription renewal approved! Tenant "${renewal.tenantName}" status updated to Active and expiry date extended.`);
      setTimeout(() => setToast(null), 5000);
      setApproveConfirmTarget(null);
      fetchPlatformData();
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleRejectRenewal = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting the renewal.');
      return;
    }
    setActionProcessing(true);
    try {
      const res = await fetch(`/api/platform/renewals/${rejectModalTarget.id}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reason: rejectionReason.trim(),
          instructions: rejectionInstructions.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setToast(`⛔ Renewal rejected for "${rejectModalTarget.tenantName}". User notified with resubmission instructions.`);
      setTimeout(() => setToast(null), 5000);
      setRejectModalTarget(null);
      setRejectionReason('');
      setRejectionInstructions('');
      fetchPlatformData();
    } catch (err) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setActionProcessing(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, [authToken]);

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/platform/tenants', {
        method: 'POST',
        headers,
        body: JSON.stringify(newClinic)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setToast(`✅ Clinic "${newClinic.name}" provisioned successfully with isolated database store!`);
      setTimeout(() => setToast(null), 5000);
      setCreateModalOpen(false);
      setNewClinic({
        name: '',
        slug: '',
        country: 'Nepal',
        currency: 'Rs.',
        timeZone: 'Asia/Kathmandu',
        planId: 'plan-professional',
        adminEmail: '',
        adminName: '',
        adminPassword: '',
        doctorName: '',
        enablePharmacy: true,
        enableFinance: true
      });
      fetchPlatformData();
    } catch (err) {
      alert(`Error creating clinic: ${err.message}`);
    }
  };

  const handleToggleTenantStatus = async (tenantId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      setToast(`Tenant status updated to ${newStatus}`);
      setTimeout(() => setToast(null), 3000);
      fetchPlatformData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTenant = async (tenantId, tenantName) => {
    if (tenantId === 'tenant-nepal-dental') {
      alert('The primary system clinic (Nepal Dental) cannot be deleted.');
      return;
    }

    const confirmDelete = window.confirm(
      `⚠️ PERMANENT CLINIC DELETION\n\nAre you sure you want to delete "${tenantName}" (${tenantId})?\n\nThis will permanently delete the clinic, its databases, domains, and staff records. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setActionProcessing(true);
      const res = await fetch(`/api/platform/tenants/${tenantId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete clinic');

      setToast(`🗑️ Clinic "${tenantName}" has been permanently deleted.`);
      setTimeout(() => setToast(null), 4000);
      fetchPlatformData();
    } catch (err) {
      alert(`Deletion Failed: ${err.message}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleToggleModule = async (tenantId, moduleName) => {
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/toggle-module`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ module: moduleName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setToast(`✅ Module [${moduleName}] updated for clinic! State: ${data.enabled ? 'ENABLED' : 'DISABLED'}`);
      setTimeout(() => setToast(null), 4000);
      fetchPlatformData();
      if (onTenantUpdated && data.tenant) {
        onTenantUpdated(data.tenant);
      }
    } catch (err) {
      alert(`Error toggling module: ${err.message}`);
    }
  };

  const handleQuickChangeTenantPlan = async (tenantId, newPlanId) => {
    const selectedPlan = plans.find(p => p.id === newPlanId);
    setActionProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ planId: newPlanId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update plan');

      setToast(`✅ Tenant subscription plan changed to "${selectedPlan?.name || newPlanId}"!`);
      setTimeout(() => setToast(null), 4000);
      fetchPlatformData();
      if (onTenantUpdated && data.tenant) {
        onTenantUpdated(data.tenant);
      }
    } catch (err) {
      alert(`Error updating plan: ${err.message}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleOpenEditModal = (t) => {
    setEditingTenant(t);
    const tSub = t.subscription || {};
    setEditForm({
      name: t.name || '',
      slug: t.slug || '',
      planId: t.planId || t.plan?.id || 'plan-starter',
      country: t.country || 'Nepal',
      currency: t.currency || t.clinicProfile?.currency || 'Rs.',
      timeZone: t.timeZone || 'Asia/Kathmandu',
      status: t.status || 'Active',
      address: t.clinicProfile?.address || '',
      phone: t.clinicProfile?.phone || '',
      doctorInCharge: t.clinicProfile?.doctorInCharge || '',
      adminName: t.adminUser?.name || '',
      adminEmail: t.adminUser?.email || '',
      adminPassword: '',
      enablePharmacy: t.modules?.pharmacy !== false,
      enableFinance: t.modules?.finance !== false,
      subscriptionStatus: tSub.status || 'Active',
      subscriptionBillingCycle: tSub.billingCycle || 'Yearly',
      subscriptionExpiryDate: tSub.expiryDate ? tSub.expiryDate.split('T')[0] : ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const payload = {
        ...editForm,
        subscription: {
          status: editForm.subscriptionStatus,
          billingCycle: editForm.subscriptionBillingCycle,
          ...(editForm.subscriptionExpiryDate ? { expiryDate: new Date(editForm.subscriptionExpiryDate).toISOString() } : {})
        }
      };
      const res = await fetch(`/api/platform/tenants/${editingTenant.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to update clinic');

      setToast(`✅ Clinic "${editForm.name}" updated successfully!`);
      setTimeout(() => setToast(null), 4000);
      setEditModalOpen(false);
      setEditingTenant(null);
      fetchPlatformData();
      if (onTenantUpdated && data.tenant) {
        onTenantUpdated(data.tenant);
      }
    } catch (err) {
      alert(`Error updating clinic: ${err.message}`);
    }
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      id: plan.id,
      name: plan.name || '',
      priceMonthly: plan.priceMonthly || 0,
      priceYearly: plan.priceYearly || 0,
      maxBranches: plan.maxBranches || 1,
      maxStaff: plan.maxStaff || 5,
      maxPatients: plan.maxPatients || 1000,
      storageQuotaGb: Math.round((plan.storageQuotaMb || 5120) / 1024),
      modules: {
        charting: plan.modules?.charting !== false,
        appointments: plan.modules?.appointments !== false,
        billing: plan.modules?.billing !== false,
        prescriptions: plan.modules?.prescriptions !== false,
        whatsapp: plan.modules?.whatsapp !== false,
        aiAssistant: Boolean(plan.modules?.aiAssistant),
        pharmacy: Boolean(plan.modules?.pharmacy),
        finance: Boolean(plan.modules?.finance),
        multiBranch: Boolean(plan.modules?.multiBranch),
        advancedAnalytics: Boolean(plan.modules?.advancedAnalytics)
      }
    });
    setPlanModalOpen(true);
  };

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      id: '',
      name: '',
      priceMonthly: 5000,
      priceYearly: 50000,
      maxBranches: 2,
      maxStaff: 10,
      maxPatients: 2500,
      storageQuotaGb: 10,
      modules: {
        charting: true,
        appointments: true,
        billing: true,
        prescriptions: true,
        whatsapp: true,
        aiAssistant: false,
        pharmacy: true,
        finance: true,
        multiBranch: false,
        advancedAnalytics: false
      }
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setActionProcessing(true);
    try {
      const url = editingPlan ? `/api/platform/plans/${editingPlan.id}` : '/api/platform/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      const body = {
        name: planForm.name,
        priceMonthly: Number(planForm.priceMonthly),
        priceYearly: Number(planForm.priceYearly),
        maxBranches: Number(planForm.maxBranches),
        maxStaff: Number(planForm.maxStaff),
        maxPatients: Number(planForm.maxPatients),
        storageQuotaMb: Number(planForm.storageQuotaGb) * 1024,
        modules: planForm.modules
      };
      if (!editingPlan && planForm.id) {
        body.id = planForm.id;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to save plan');

      setToast(`✅ Subscription Plan "${data.plan?.name || planForm.name}" ${editingPlan ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setToast(null), 4000);
      setPlanModalOpen(false);
      setEditingPlan(null);
      fetchPlatformData();
    } catch (err) {
      alert(`[Error Saving Plan] ${err.message}`);
    } finally {
      setActionProcessing(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      const res = await fetch('/api/platform/domains/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ domainId })
      });
      if (!res.ok) throw new Error('Verification failed');
      setToast('Domain verified and SSL provisioned!');
      setTimeout(() => setToast(null), 3000);
      fetchPlatformData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSupportGrant = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/platform/support-grant', {
        method: 'POST',
        headers,
        body: JSON.stringify(supportForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setToast(`🔐 Support access grant authorized for ${supportForm.durationMinutes} mins (Audited)`);
      setTimeout(() => setToast(null), 5000);
      setSupportModalOpen(false);
      setSupportForm({ tenantId: 'tenant-nepal-dental', reason: '', durationMinutes: 60 });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <AnayaCraftEmblem size={52} />
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500 text-white uppercase tracking-wider">
                Platform Owner Control Panel
              </span>
              <span className="text-emerald-400 font-mono text-xs flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Multi-Tenant Architecture Active
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-1">Anaya Craft Cloud Console</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              All Kinds of IT Solutions • Multi-Tenant Healthcare & Practice Management Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSupportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Support Access Grant</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Clinic</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview Dashboard', icon: Activity },
          { id: 'tenants', label: `Tenants / Clinics (${tenants.length})`, icon: Building },
          { id: 'domains', label: `Domains & SSL (${domains.length})`, icon: Globe },
          { id: 'plans', label: 'Subscription Plans', icon: CreditCard },
          {
            id: 'renewals',
            label: `Subscription Renewals (${renewals.filter(r => r.status === 'PENDING_VERIFICATION').length} Pending)`,
            icon: Receipt,
            hasPending: renewals.some(r => r.status === 'PENDING_VERIFICATION')
          },
          { id: 'audit', label: `Platform Security Logs (${auditLogs.length})`, icon: Shield }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : t.hasPending
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.hasPending && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute -top-1 -right-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Clinics</span>
              <div className="text-2xl font-black text-slate-900">{overview?.totalTenants || tenants.length}</div>
              <div className="text-[11px] text-emerald-600 font-bold">{overview?.activeTenants || 2} Active & Isolated</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Patients</span>
              <div className="text-2xl font-black text-blue-600">{overview?.totalPatients || 0}</div>
              <div className="text-[11px] text-slate-500 font-medium">Across all clinic stores</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Staff Accounts</span>
              <div className="text-2xl font-black text-purple-600">{overview?.totalUsers || 7}</div>
              <div className="text-[11px] text-slate-500 font-medium">Doctors, Admins, Receptionists</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Infrastructure</span>
              <div className="text-2xl font-black text-emerald-600">100% OK</div>
              <div className="text-[11px] text-emerald-700 font-medium">Strict RLS & Data Isolation</div>
            </div>
          </div>

          {/* Featured First Clinic Highlight */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-mono text-[10px] font-bold rounded-md">
                  Primary Client Tenant
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono">tenant-nepal-dental</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.
              </h3>
              <p className="text-xs text-slate-600">
                Named Doctor: <strong>Dr. Mukesh Kushwaha</strong> (BDS, MDS, NMC-67890) | Subdomain: <strong>nepal-dental.anacraft.com</strong>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300">
                Active & Operational
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TENANTS LIST */}
      {activeTab === 'tenants' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Tenant Clinics Directory & Subscriptions</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Manage clinic accounts, live domain bindings, assign subscription plans, and toggle module allocations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('plans')}
                className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-2xs"
                title="Switch to Subscription Plans & Pricing Tiers editor"
              >
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                <span>Manage Plan Tiers</span>
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tenant</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 min-w-[220px]">Clinic & Tenant Identity</th>
                  <th className="px-4 py-3 min-w-[190px]">Subscription Plan</th>
                  <th className="px-4 py-3 min-w-[160px]">Domains</th>
                  <th className="px-4 py-3 min-w-[190px]">Modules Allocated</th>
                  <th className="px-4 py-3 text-right min-w-[130px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 mb-1">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">{t.name}</span>
                        {t.id === 'tenant-nepal-dental' && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 font-bold tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono">
                        <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 select-all font-medium">
                          {t.id}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[170px]" title={`${t.slug}.anacraft.com`}>
                          {t.slug}.anacraft.com
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="space-y-1.5">
                        <div className="relative inline-block w-full">
                          <select
                            value={t.planId || t.plan?.id || 'plan-starter'}
                            onChange={(e) => handleQuickChangeTenantPlan(t.id, e.target.value)}
                            disabled={actionProcessing}
                            className="w-full appearance-none bg-purple-50 hover:bg-purple-100/90 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 font-semibold text-xs rounded-xl px-2.5 py-1.5 pr-7 outline-none cursor-pointer transition shadow-2xs focus:ring-2 focus:ring-purple-400"
                            title="Quick switch: Change this clinic's assigned subscription plan"
                          >
                            {plans.map(p => (
                              <option key={p.id} value={p.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-slate-100">
                                {p.name} (Rs. {Number(p.priceMonthly || 0).toLocaleString()}/mo)
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-600 dark:text-purple-400">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between px-0.5">
                          <span>Billing Status:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                            (t.subscription?.status || 'Active') === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : t.subscription?.status === 'Payment Awaiting Verification'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {t.subscription?.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="space-y-1">
                        {(t.domains && t.domains.length > 0) ? (
                          t.domains.map((d, i) => (
                            <div key={i} className="text-[11px] text-slate-700 dark:text-slate-300 font-mono flex items-center space-x-1.5">
                              <span className="truncate max-w-[170px]" title={d.domain}>{d.domain}</span>
                              {d.isPrimary && (
                                <span className="text-amber-500 text-xs flex-shrink-0" title="Primary Domain">★</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400 font-mono italic">Default Subdomain</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleModule(t.id, 'pharmacy')}
                        className={`w-full px-2 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center justify-between ${
                          t.modules?.pharmacy !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
                        }`}
                        title="Developer Admin: Toggle Pharmacy feature allocation for this tenant"
                      >
                        <span className="flex items-center space-x-1 truncate">
                          <span>💊</span>
                          <span>Pharmacy</span>
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 flex-shrink-0 ${
                          t.modules?.pharmacy !== false
                            ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {t.modules?.pharmacy !== false ? 'Allocated' : 'Disabled'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleModule(t.id, 'finance')}
                        className={`w-full px-2 py-1 rounded-lg text-[11px] font-semibold border transition flex items-center justify-between ${
                          t.modules?.finance !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700'
                        }`}
                        title="Developer Admin: Toggle Finance & Revenue feature allocation for this tenant"
                      >
                        <span className="flex items-center space-x-1 truncate">
                          <span>💰</span>
                          <span>Finance & Revenue</span>
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 flex-shrink-0 ${
                          t.modules?.finance !== false
                            ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {t.modules?.finance !== false ? 'Allocated' : 'Disabled'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5 justify-end">
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition inline-flex items-center space-x-1 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shadow-2xs"
                          title="Edit clinic name, change password, and configure settings"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleTenantStatus(t.id, t.status)}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition inline-flex items-center space-x-1 shadow-2xs ${
                            t.status === 'Active'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                          title={t.status === 'Active' ? 'Suspend clinic operations' : 'Activate clinic operations'}
                        >
                          <span>{t.status === 'Active' ? 'Suspend' : 'Activate'}</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DOMAINS & SSL */}
      {activeTab === 'domains' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Custom Domains & SSL Certificates
              </h3>
              <p className="text-xs text-slate-500">
                Map custom domains (`portal.nepaldental.com.np`) and manage HTTPS certificate provisioning.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {domains.map(d => (
              <div key={d.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{d.domain}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] uppercase font-bold">
                      {d.type}
                    </span>
                    {d.isPrimary && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Mapped Tenant: <strong>{d.tenantId}</strong> | SSL: <strong>{d.sslStatus}</strong>
                  </div>
                </div>

                <div>
                  {d.verified ? (
                    <span className="flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified & SSL Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleVerifyDomain(d.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Verify DNS & Issue SSL
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION PLANS & ENTITLEMENTS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Subscription Plans & Pricing Tiers</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Software Owner configuration: customize monthly/yearly billing rates, usage quotas, and module entitlements.
              </p>
            </div>
            <button
              onClick={handleOpenCreatePlan}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Plan Tier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:border-blue-300 transition group">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition">{p.name}</h4>
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      Tier
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-black text-blue-600">
                    Rs. {Number(p.priceMonthly || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ month</span>
                  </div>
                  {p.priceYearly && (
                    <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                      Rs. {Number(p.priceYearly).toLocaleString()} / year (Billed annually)
                    </div>
                  )}
                  <div className="text-xs text-slate-500 mt-2.5 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>• Max Branches: <strong>{p.maxBranches}</strong></div>
                    <div>• Max Staff Accounts: <strong>{p.maxStaff}</strong></div>
                    <div>• Max Patients Quota: <strong>{Number(p.maxPatients || 0).toLocaleString()}</strong></div>
                    <div>• Cloud Storage: <strong>{Math.round((p.storageQuotaMb || 0) / 1024)} GB</strong></div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <span className="font-bold text-slate-800 block text-xs">Enabled Modules:</span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(p.modules || {}).map(([k, v]) => (
                        <span key={k} className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                          v ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {k}: {v ? 'YES' : 'NO'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* EDIT BUTTON ON EACH PLAN CARD */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">{p.id}</span>
                    <button
                      onClick={() => handleOpenEditPlan(p)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs border border-blue-200 hover:border-blue-600 transition flex items-center space-x-1.5 shadow-2xs"
                      title={`Edit pricing and entitlements for ${p.name}`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Plan</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM SECURITY AUDIT LOGS */}
      {activeTab === 'renewals' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pending Verifications
              </span>
              <div className="text-2xl font-black text-amber-600 flex items-center gap-2">
                <span>{renewals.filter(r => r.status === 'PENDING_VERIFICATION').length}</span>
                {renewals.some(r => r.status === 'PENDING_VERIFICATION') && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div className="text-[11px] text-amber-700 font-bold">Action Required by Software Owner</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Approved Renewals
              </span>
              <div className="text-2xl font-black text-emerald-600">
                {renewals.filter(r => r.status === 'APPROVED').length}
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">Active Licenses Extended</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Rejected Submissions
              </span>
              <div className="text-2xl font-black text-rose-600">
                {renewals.filter(r => r.status === 'REJECTED').length}
              </div>
              <div className="text-[11px] text-rose-700 font-bold">Feedback Sent to Clinic</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Renewal Revenue
              </span>
              <div className="text-2xl font-black text-indigo-700">
                Rs. {renewals.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-600 font-bold">Nabil Bank Verified Credit</div>
            </div>
          </div>

          {/* Renewals Table & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>Renewal Requests & Bank Receipt Review</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect uploaded receipts, verify credit in Nabil Bank, and approve or reject subscription renewals.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 text-xs font-bold">
                {[
                  { id: 'all', label: `All (${renewals.length})` },
                  { id: 'pending', label: `Pending (${renewals.filter(r => r.status === 'PENDING_VERIFICATION').length})` },
                  { id: 'approved', label: `Approved (${renewals.filter(r => r.status === 'APPROVED').length})` },
                  { id: 'rejected', label: `Rejected (${renewals.filter(r => r.status === 'REJECTED').length})` }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setRenewalFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      renewalFilter === f.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
              {renewals
                .filter(r => {
                  if (renewalFilter === 'pending') return r.status === 'PENDING_VERIFICATION';
                  if (renewalFilter === 'approved') return r.status === 'APPROVED';
                  if (renewalFilter === 'rejected') return r.status === 'REJECTED';
                  return true;
                })
                .length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                  No renewal requests found in this filter category.
                </div>
              ) : (
                renewals
                  .filter(r => {
                    if (renewalFilter === 'pending') return r.status === 'PENDING_VERIFICATION';
                    if (renewalFilter === 'approved') return r.status === 'APPROVED';
                    if (renewalFilter === 'rejected') return r.status === 'REJECTED';
                    return true;
                  })
                  .map((r) => {
                    const isPending = r.status === 'PENDING_VERIFICATION';
                    const isApproved = r.status === 'APPROVED';
                    const isRejected = r.status === 'REJECTED';

                    return (
                      <div key={r.id} className="p-4 hover:bg-slate-50 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left Details */}
                        <div className="flex items-start space-x-3.5 min-w-0">
                          {/* Receipt Thumbnail */}
                          <div
                            onClick={() => setReceiptToInspect(r)}
                            className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex-shrink-0 cursor-pointer group relative shadow-2xs hover:border-blue-500 transition"
                            title="Click to view full receipt"
                          >
                            {r.receiptUrl?.startsWith('data:image/') || r.receiptUrl?.startsWith('http') ? (
                              <img
                                src={r.receiptUrl}
                                alt="Receipt thumbnail"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-black text-slate-900 text-sm">{r.tenantName}</span>
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                                {r.tenantId}
                              </span>
                              {isPending ? (
                                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Verification</span>
                                </span>
                              ) : isApproved ? (
                                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Approved</span>
                                </span>
                              ) : (
                                <span className="bg-rose-100 text-rose-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-600 flex items-center space-x-3 flex-wrap">
                              <span>Payer: <strong className="text-slate-900">{r.payerName}</strong></span>
                              <span>•</span>
                              <span>Plan: <strong className="text-blue-700">{r.planName}</strong> ({r.billingCycle})</span>
                              <span>•</span>
                              <span>Amount: <strong className="text-emerald-700">{r.currency} {Number(r.amount).toLocaleString()}</strong></span>
                            </div>

                            <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-2 flex-wrap">
                              <span>Ref: <strong className="text-slate-700">{r.transactionRef || 'N/A'}</strong></span>
                              <span>•</span>
                              <span>Submitted: {new Date(r.submittedAt).toLocaleString()} by {r.userName} ({r.userEmail})</span>
                            </div>

                            {/* Rejection feedback */}
                            {isRejected && r.rejectionReason && (
                              <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg mt-1 font-medium">
                                <strong>Rejection Reason:</strong> {r.rejectionReason}
                              </div>
                            )}

                            {/* Approval notice */}
                            {isApproved && (
                              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg mt-1 font-medium">
                                Approved by {r.reviewedBy || 'Developer Admin'} on {new Date(r.reviewedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex items-center space-x-2 flex-shrink-0 self-end lg:self-center">
                          <button
                            onClick={() => setReceiptToInspect(r)}
                            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Inspect Receipt</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => setApproveConfirmTarget(r)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve Renewal</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectModalTarget(r);
                                  setRejectionReason('Payment voucher reference not found in Nabil Bank credit report.');
                                  setRejectionInstructions('Please check that the bank account number, exact billing amount, and transaction reference match the payment details shown, and upload a clear, uncropped payment receipt.');
                                }}
                                className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM SECURITY AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Immutable Platform Security Audit Trail
            </h3>
            <span className="text-xs text-slate-500 font-mono">Real-time Append-Only Log</span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {auditLogs.map((log, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-800">{log.userEmail} ({log.userRole})</span>
                    {log.tenantId && <span className="text-slate-500">[{log.tenantId}]</span>}
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-600 mt-1">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE NEW CLINIC WIZARD MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Create New Clinic (Tenant Provisioning)</h3>
                <p className="text-xs text-blue-100">Provisions isolated clinic database store and initial Super Admin</p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateClinic} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Clinic Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu Dental Care Pvt. Ltd."
                    value={newClinic.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                      setNewClinic({ ...newClinic, name, slug });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Unique URL Slug *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kathmandu-dental"
                    value={newClinic.slug}
                    onChange={(e) => setNewClinic({ ...newClinic, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Subscription Plan</label>
                  <select
                    value={newClinic.planId}
                    onChange={(e) => setNewClinic({ ...newClinic, planId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    {plans.length > 0 ? (
                      plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rs. {Number(p.priceMonthly || 0).toLocaleString()}/mo)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="plan-starter">Starter Clinic</option>
                        <option value="plan-professional">Professional Practice</option>
                        <option value="plan-enterprise">Hospital Enterprise</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2 p-3 bg-purple-50 rounded-2xl border border-purple-200">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newClinic.enablePharmacy}
                      onChange={(e) => setNewClinic({ ...newClinic, enablePharmacy: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-black text-purple-900 block">Allocate Pharmacy Operations & Stock Management</span>
                      <span className="text-[11px] text-purple-700 block">Enable medicine catalog, batch inventory, expiry alerts, supplier purchasing & pharmacy POS</span>
                    </div>
                  </label>
                </div>

                <div className="sm:col-span-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newClinic.enableFinance}
                      onChange={(e) => setNewClinic({ ...newClinic, enableFinance: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-black text-emerald-900 block">Allocate Finance & Revenue Module</span>
                      <span className="text-[11px] text-emerald-700 block">Enable centralized transaction ledger, FonePay QR accounts, patient receivables, P&L analysis, staff payment sheets and payouts</span>
                    </div>
                  </label>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 block mb-2">Initial Clinic Super Admin & Doctor</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@clinic.com"
                    value={newClinic.adminEmail}
                    onChange={(e) => setNewClinic({ ...newClinic, adminEmail: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Admin Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newClinic.adminPassword}
                    onChange={(e) => setNewClinic({ ...newClinic, adminPassword: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Primary Attending Doctor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Mukesh Kushwaha"
                    value={newClinic.doctorName}
                    onChange={(e) => setNewClinic({ ...newClinic, doctorName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md"
                >
                  Provision Isolated Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLINIC & CREDENTIALS MODAL */}
      {editModalOpen && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center space-x-2">
                  <Edit className="w-4 h-4 text-blue-300" />
                  <span>Edit Clinic & Credentials</span>
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Update clinic name, reset owner password, and configure tenant settings
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Tenant ID Badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tenant ID:</span>
                  <span className="font-mono font-bold text-slate-800 ml-2">{editingTenant.id}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {editingTenant.slug}.anacraft.com
                </span>
              </div>

              {/* 1. Clinic Name & URL Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Nepal Dental and Healthcare"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Subdomain Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. nepal-dental"
                  />
                </div>
              </div>

              {/* 2. Owner & Password Change Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-amber-900 flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>Clinic Owner & Password Change</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                    Authentication Credentials
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={editForm.adminName}
                      onChange={(e) => setEditForm({ ...editForm, adminName: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 font-medium bg-white outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. Dr. Mukesh Kushwaha"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Owner Login Email
                    </label>
                    <input
                      type="email"
                      value={editForm.adminEmail}
                      onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 font-medium bg-white outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="e.g. admin@nepaldental.com.np"
                    />
                  </div>
                </div>

                {/* Change Password Input */}
                <div>
                  <label className="block font-bold text-amber-900 uppercase mb-1 flex items-center justify-between">
                    <span>Change / Reset Password</span>
                    <span className="text-[10px] text-slate-500 font-normal">Leave blank to keep current password</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600" />
                    <input
                      type="text"
                      value={editForm.adminPassword}
                      onChange={(e) => setEditForm({ ...editForm, adminPassword: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-amber-300 font-mono text-slate-900 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter new password to change (e.g. NewPass@123)"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Subscription Plan & Feature Module Allocations */}
              <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-800 flex items-center space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>Plan Licensing, Subscription & Feature Allocations</span>
                  </label>
                  <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                    Software Owner Managed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={editForm.planId}
                      onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-purple-300 bg-purple-50/60 font-bold text-purple-950 outline-none text-xs focus:ring-2 focus:ring-purple-500"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Rs. {Number(p.priceMonthly || 0).toLocaleString()}/mo)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Subscription Status
                    </label>
                    <select
                      value={editForm.subscriptionStatus}
                      onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Payment Awaiting Verification">Payment Awaiting Verification</option>
                      <option value="Expired">Expired</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={editForm.subscriptionBillingCycle}
                      onChange={(e) => setEditForm({ ...editForm, subscriptionBillingCycle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none text-xs focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly (Annual)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editForm.subscriptionExpiryDate}
                      onChange={(e) => setEditForm({ ...editForm, subscriptionExpiryDate: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 outline-none text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Pharmacy & Stock Module
                    </label>
                    <select
                      value={editForm.enablePharmacy ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, enablePharmacy: e.target.value === 'true' })}
                      className={`w-full p-2.5 rounded-xl border font-bold text-xs outline-none transition ${
                        editForm.enablePharmacy ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900' : 'border-rose-300 bg-rose-50/70 text-rose-900'
                      }`}
                    >
                      <option value="true">✅ Allocated (Active)</option>
                      <option value="false">⛔ Disabled (Restricted)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Finance & Revenue Module
                    </label>
                    <select
                      value={editForm.enableFinance ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, enableFinance: e.target.value === 'true' })}
                      className={`w-full p-2.5 rounded-xl border font-bold text-xs outline-none transition ${
                        editForm.enableFinance ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900' : 'border-rose-300 bg-rose-50/70 text-rose-900'
                      }`}
                    >
                      <option value="true">✅ Allocated (Active)</option>
                      <option value="false">⛔ Disabled (Restricted)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Clinic Address & Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Physical Address (Below Title)
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Gaushala-12 Mahaottari Nepal"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. +977 98012 34567"
                  />
                </div>
              </div>

              {/* 5. Doctor In Charge & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Doctor In Charge
                  </label>
                  <input
                    type="text"
                    value={editForm.doctorInCharge}
                    onChange={(e) => setEditForm({ ...editForm, doctorInCharge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Dr. Mukesh Kushwaha, BDS"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Clinic Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition"
                >
                  Save Clinic Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / CREATE SUBSCRIPTION PLAN MODAL */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-200" />
                  <span>{editingPlan ? `Edit Subscription Plan: ${editingPlan.name}` : 'Create New Subscription Plan'}</span>
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Update plan tier pricing, usage capacity limits, and default module entitlements
                </p>
              </div>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Plan Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Starter Clinic"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Plan Identifier ID {editingPlan ? '(Read-only)' : '*'}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPlan)}
                    value={planForm.id}
                    onChange={(e) => setPlanForm({ ...planForm, id: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none ${
                      editingPlan ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                    }`}
                    placeholder="e.g. plan-starter"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Monthly Price (₹ / NPR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.priceMonthly}
                    onChange={(e) => setPlanForm({ ...planForm, priceMonthly: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-blue-700 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 3500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Yearly Price (₹ / NPR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.priceYearly}
                    onChange={(e) => setPlanForm({ ...planForm, priceYearly: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-blue-700 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. 35000"
                  />
                </div>
              </div>

              {/* Capacity Quotas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Max Branches
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.maxBranches}
                    onChange={(e) => setPlanForm({ ...planForm, maxBranches: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Max Staff
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.maxStaff}
                    onChange={(e) => setPlanForm({ ...planForm, maxStaff: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Patients Quota
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={planForm.maxPatients}
                    onChange={(e) => setPlanForm({ ...planForm, maxPatients: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                    Storage (GB)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.storageQuotaGb}
                    onChange={(e) => setPlanForm({ ...planForm, storageQuotaGb: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Module Entitlements Checkboxes */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Default Module Entitlements for this Tier
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'charting', label: 'Dental Charting (Odontogram)' },
                    { key: 'appointments', label: 'Appointments & Chair Schedule' },
                    { key: 'billing', label: 'Billing, Invoices & Collections' },
                    { key: 'prescriptions', label: 'Prescriptions Pad (Rx)' },
                    { key: 'whatsapp', label: 'WhatsApp Patient Automation' },
                    { key: 'aiAssistant', label: 'AI Clinical Assistant' },
                    { key: 'pharmacy', label: 'Pharmacy & Stock POS' },
                    { key: 'finance', label: 'Finance & Revenue Ledger' },
                    { key: 'multiBranch', label: 'Multi-Branch Management' },
                    { key: 'advancedAnalytics', label: 'Advanced Analytics & Exports' }
                  ].map(({ key, label }) => {
                    const isChecked = Boolean(planForm.modules?.[key]);
                    return (
                      <label
                        key={key}
                        className={`flex items-center space-x-2.5 p-2 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-500 font-medium hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => setPlanForm({
                            ...planForm,
                            modules: {
                              ...planForm.modules,
                              [key]: e.target.checked
                            }
                          })}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-[11px] flex-1">{label}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          isChecked ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isChecked ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionProcessing ? 'Saving...' : editingPlan ? 'Save Plan Changes' : 'Create Plan Tier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPORT ACCESS GRANT MODAL */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-indigo-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Time-Limited Support Access Grant</h3>
                <p className="text-xs text-indigo-200">No backdoor access: All sessions are time-limited and audited</p>
              </div>
              <button onClick={() => setSupportModalOpen(false)} className="text-white text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSupportGrant} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Clinic Tenant *</label>
                <select
                  value={supportForm.tenantId}
                  onChange={(e) => setSupportForm({ ...supportForm, tenantId: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Documented Reason / Ticket # *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Ticket #9201: Diagnosis of database synchronization mismatch"
                  value={supportForm.reason}
                  onChange={(e) => setSupportForm({ ...supportForm, reason: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Grant Duration (Minutes)</label>
                <select
                  value={supportForm.durationMinutes}
                  onChange={(e) => setSupportForm({ ...supportForm, durationMinutes: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value={15}>15 Minutes (Emergency Quick Look)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour (Standard)</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md"
                >
                  Authorize Grant & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {approveConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Renewal Approval</h3>
                <p className="text-xs text-slate-500">Extend clinic subscription license</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Clinic Name:</span>
                <strong className="text-slate-900">{approveConfirmTarget.tenantName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payer:</span>
                <strong className="text-slate-900">{approveConfirmTarget.payerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Plan & Cycle:</span>
                <strong className="text-blue-700">{approveConfirmTarget.planName} ({approveConfirmTarget.billingCycle})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Verified Amount:</span>
                <strong className="text-emerald-700">{approveConfirmTarget.currency} {Number(approveConfirmTarget.amount).toLocaleString()}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Approving will update the tenant subscription status to <strong>Active</strong> and extend the clinic's expiry date by <strong>{approveConfirmTarget.billingCycle === 'Monthly' ? '1 Month (+30 days)' : '1 Year (+365 days)'}</strong>.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setApproveConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionProcessing}
                onClick={() => handleApproveRenewal(approveConfirmTarget)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {actionProcessing ? 'Approving...' : 'Confirm Approval & Extend Expiry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reject Renewal Request</h3>
                <p className="text-xs text-slate-500">Provide rejection reason and instructions for the clinic</p>
              </div>
            </div>

            <form onSubmit={handleRejectRenewal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Transaction reference NABIL-TXN-883921 not found in bank statement."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Transaction reference not found on bank statement',
                  'Receipt screenshot is blurry or unreadable',
                  'Paid amount does not match the plan fee'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Resubmission Instructions for User *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionInstructions}
                  onChange={(e) => setRejectionInstructions(e.target.value)}
                  placeholder="Explain what the clinic should do to correct and re-upload the receipt."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectModalTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionProcessing}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {actionProcessing ? 'Rejecting...' : 'Reject Renewal & Notify User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT INSPECTOR MODAL */}
      {receiptToInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{receiptToInspect.tenantName} - Receipt Inspection</h4>
                <p className="text-[11px] text-slate-400">
                  Payer: {receiptToInspect.payerName} • Ref: {receiptToInspect.transactionRef || 'N/A'} • {receiptToInspect.currency} {Number(receiptToInspect.amount).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setReceiptToInspect(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 max-h-[70vh]">
              {receiptToInspect.receiptUrl?.startsWith('data:image/') || receiptToInspect.receiptUrl?.startsWith('http') ? (
                <img
                  src={receiptToInspect.receiptUrl}
                  alt="Receipt Full View"
                  className="max-h-[60vh] max-w-full rounded-xl shadow-md object-contain"
                />
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold">PDF Document Receipt: {receiptToInspect.receiptFileName}</p>
                  <a
                    href={receiptToInspect.receiptUrl}
                    download={receiptToInspect.receiptFileName}
                    className="mt-2 inline-flex items-center space-x-1 text-blue-600 font-bold text-xs"
                  >
                    <span>Download Voucher</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Submitted on {new Date(receiptToInspect.submittedAt).toLocaleString()}
              </span>
              <button
                onClick={() => setReceiptToInspect(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
