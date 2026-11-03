import React, { useState, useEffect } from 'react';
import {
  Building,
  Users,
  CreditCard,
  Calendar,
  Clock,
  Shield,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  Receipt,
  Lock,
  UserPlus,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function TenantProfileModal({
  isOpen,
  tenantId,
  onClose,
  authToken,
  plans = [],
  onSwitchTenant,
  onTenantUpdated
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'subscription' | 'payments' | 'users' | 'danger'
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Subscription Edit / Extension Form State
  const [subForm, setSubForm] = useState({
    planId: 'plan-professional',
    billingCycle: 'Yearly',
    status: 'Active',
    expiryDate: '',
    totalAmountDue: '',
    notes: ''
  });

  // Software Payment Form State
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'FonePay QR',
    transactionRef: '',
    invoiceNo: '',
    billingPeriod: '',
    notes: ''
  });

  // User Accounts Form State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: 'DOCTOR'
  });

  // Delete Tenant Confirmation State
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  // Plan Pricing Auto-calculation helper
  const getPlanPricing = (planId, cycle) => {
    const selectedPlan = (plans || []).find(p => p.id === planId);
    if (!selectedPlan) {
      if (planId === 'plan-starter') return cycle === 'Monthly' ? 3500 : 35000;
      if (planId === 'plan-professional') return cycle === 'Monthly' ? 7500 : 75000;
      if (planId === 'plan-enterprise') return cycle === 'Monthly' ? 18000 : 180000;
      return cycle === 'Monthly' ? 7500 : 75000;
    }
    if (cycle === 'Monthly') {
      return Number(selectedPlan.priceMonthly) || 3500;
    }
    return Number(selectedPlan.priceYearly) || ((Number(selectedPlan.priceMonthly) || 3500) * 10);
  };

  const handleSubPlanChange = (planId) => {
    const autoFee = getPlanPricing(planId, subForm.billingCycle);
    setSubForm(prev => ({
      ...prev,
      planId,
      totalAmountDue: autoFee
    }));
  };

  const handleSubBillingCycleChange = (billingCycle) => {
    const autoFee = getPlanPricing(subForm.planId, billingCycle);
    setSubForm(prev => ({
      ...prev,
      billingCycle,
      totalAmountDue: autoFee
    }));
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : ''
  };

  // Fetch full tenant profile
  const fetchTenantProfile = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch tenant profile');

      setProfile(data);
      const sub = data.tenant.subscription || {};
      setSubForm({
        planId: sub.planId || data.tenant.planId || 'plan-professional',
        billingCycle: sub.billingCycle || 'Yearly',
        status: sub.status || data.tenant.status || 'Active',
        expiryDate: sub.expiryDate ? sub.expiryDate.split('T')[0] : '',
        totalAmountDue: sub.totalAmountDue !== undefined ? sub.totalAmountDue : '',
        notes: ''
      });
    } catch (err) {
      console.error('Error fetching tenant profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchTenantProfile();
      setActiveTab('overview');
      setShowPaymentForm(false);
      setShowUserModal(false);
      setEditingUser(null);
      setDeleteConfirmInput('');
    }
  }, [isOpen, tenantId]);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // -------------------------------------------------------------
  // Subscription Actions
  // -------------------------------------------------------------
  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/subscription/extend`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: subForm.planId,
          billingCycle: subForm.billingCycle,
          status: subForm.status,
          expiryDate: subForm.expiryDate ? new Date(subForm.expiryDate).toISOString() : undefined,
          totalAmountDue: subForm.totalAmountDue !== '' ? Number(subForm.totalAmountDue) : undefined,
          notes: subForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      showToastMsg('✅ Subscription details updated successfully!');
      fetchTenantProfile();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`Subscription update error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickExtend = async (months) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/subscription/extend`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          months,
          status: 'Active',
          notes: `Quick extension by ${months} month(s)`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      showToastMsg(`✅ Subscription extended by ${months} month(s)!`);
      fetchTenantProfile();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`Extension error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // Software Payment Actions
  // -------------------------------------------------------------
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          date: paymentForm.date,
          method: paymentForm.method,
          transactionRef: paymentForm.transactionRef || undefined,
          invoiceNo: paymentForm.invoiceNo || undefined,
          billingPeriod: paymentForm.billingPeriod || undefined,
          notes: paymentForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      showToastMsg('✅ Software payment recorded and balance updated!');
      setShowPaymentForm(false);
      setPaymentForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'FonePay QR',
        transactionRef: '',
        invoiceNo: '',
        billingPeriod: '',
        notes: ''
      });
      fetchTenantProfile();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`Payment recording error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This will adjust the paid total.')) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/payments/${paymentId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      showToastMsg('🗑️ Payment record removed.');
      fetchTenantProfile();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`Delete payment error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // User Account Actions
  // -------------------------------------------------------------
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (editingUser) {
        // Update user
        const res = await fetch(`/api/platform/tenants/${tenantId}/users/${editingUser.userId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            username: userForm.username,
            phone: userForm.phone,
            role: userForm.role,
            password: userForm.password ? userForm.password : undefined
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error);
        showToastMsg(`✅ User "${userForm.name}" updated!`);
      } else {
        // Create user
        if (!userForm.name || (!userForm.email && !userForm.username)) {
          alert('Full name and email or username are required.');
          setProcessing(false);
          return;
        }
        const res = await fetch(`/api/platform/tenants/${tenantId}/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            username: userForm.username,
            password: userForm.password || 'Admin@123',
            phone: userForm.phone,
            role: userForm.role
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error);
        showToastMsg(`✅ User account "${userForm.name}" created!`);
      }

      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        role: 'DOCTOR'
      });
      fetchTenantProfile();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`User account error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditUserClick = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name || '',
      email: u.email || '',
      username: u.username || '',
      password: '',
      phone: u.phone || '',
      role: u.role || 'DOCTOR'
    });
    setShowUserModal(true);
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove user "${userName}" from this tenant?`)) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/users/${userId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      showToastMsg(`🗑️ User account "${userName}" removed from tenant.`);
      fetchTenantProfile();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`Remove user error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------------------------
  // Delete Clinic Action
  // -------------------------------------------------------------
  const handleDeleteTenant = async () => {
    if (!profile) return;
    if (tenantId === 'tenant-nepal-dental') {
      alert('The primary system clinic cannot be deleted.');
      return;
    }
    if (deleteConfirmInput !== profile.tenant.name) {
      alert(`Please type the exact clinic name "${profile.tenant.name}" to confirm deletion.`);
      return;
    }
    if (!window.confirm(`⚠️ FINAL WARNING: Permanently delete clinic "${profile.tenant.name}"? This action cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      alert(`Clinic "${profile.tenant.name}" has been permanently removed.`);
      onClose();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Toggle Module
  const handleToggleModule = async (moduleName) => {
    if (!profile) return;
    const currentVal = profile.tenant.modules ? profile.tenant.modules[moduleName] : true;
    setProcessing(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenantId}/toggle-module`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ module: moduleName, enabled: !currentVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      showToastMsg(`Feature "${moduleName}" ${!currentVal ? 'Allocated' : 'Disabled'}!`);
      fetchTenantProfile();
      if (onTenantUpdated) onTenantUpdated();
    } catch (err) {
      alert(`Module toggle error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  const tenant = profile?.tenant;
  const subscription = tenant?.subscription || {};
  const payments = profile?.payments || [];
  const users = profile?.users || [];
  const clinicProfile = tenant?.clinicProfile || {};

  const totalDue = Number(subscription.totalAmountDue || 0);
  const totalPaid = Number(subscription.amountPaid || 0);
  const remainingBal = Number(subscription.remainingBalance || 0);

  const daysRemaining = subscription.daysRemaining !== undefined
    ? subscription.daysRemaining
    : Math.ceil((new Date(subscription.expiryDate || Date.now()) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {toast && (
          <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 animate-fadeIn border border-slate-700">
            <span>{toast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 relative select-none">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 text-white font-black text-xl">
                🦷
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h3 className="text-lg font-black tracking-tight text-white truncate max-w-[320px] sm:max-w-md" title={tenant?.name}>
                    {loading ? 'Loading Clinic Profile...' : tenant?.name}
                  </h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    tenant?.status === 'Active'
                      ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  }`}>
                    {tenant?.status || 'Active'}
                  </span>
                  <span className="text-[10px] bg-blue-400/20 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-full font-bold">
                    {subscription.planName || tenant?.plan?.name || 'Professional'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mt-1 text-xs text-blue-200 font-mono">
                  <span>ID: {tenantId}</span>
                  <span>•</span>
                  <a
                    href={`https://${tenant?.slug}.anacraft.com`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1 text-cyan-300"
                  >
                    <span>{tenant?.slug}.anacraft.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition flex-shrink-0"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Balance & Expiry KPI Banner */}
          {!loading && profile && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-white/15 text-xs">
              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <div className="text-[10px] text-blue-200 uppercase font-semibold">Total Amount Due</div>
                <div className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                  Rs. {totalDue.toLocaleString()}
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                <div className="text-[10px] text-emerald-200 uppercase font-semibold">Amount Paid</div>
                <div className="text-sm sm:text-base font-black text-emerald-300 font-mono mt-0.5">
                  Rs. {totalPaid.toLocaleString()}
                </div>
              </div>

              <div className={`rounded-xl p-2.5 backdrop-blur-xs ${
                remainingBal > 0 ? 'bg-amber-500/20 border border-amber-400/30' : 'bg-emerald-500/20 border border-emerald-400/30'
              }`}>
                <div className="text-[10px] uppercase font-semibold text-white/90">Remaining Balance</div>
                <div className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                  remainingBal > 0 ? 'text-amber-300' : 'text-emerald-300'
                }`}>
                  Rs. {remainingBal.toLocaleString()}
                </div>
              </div>

              <div className={`rounded-xl p-2.5 backdrop-blur-xs ${
                isExpired ? 'bg-rose-500/20 border border-rose-400/30' : 'bg-white/10'
              }`}>
                <div className="text-[10px] uppercase font-semibold text-blue-200">Subscription Expiry</div>
                <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5 truncate">
                  {subscription.expiryDate ? subscription.expiryDate.split('T')[0] : 'N/A'}
                  <span className={`ml-1 text-[10px] font-normal ${isExpired ? 'text-rose-300 font-bold' : 'text-blue-200'}`}>
                    ({isExpired ? `${Math.abs(daysRemaining)}d ago` : `${daysRemaining}d left`})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tab Bar */}
          <div className="flex items-center space-x-1 sm:space-x-2 mt-4 pt-2 overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Clinic Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition whitespace-nowrap ${
                activeTab === 'subscription'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Subscription & Expiry</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition whitespace-nowrap ${
                activeTab === 'payments'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Payment History ({payments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-white text-blue-900 shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Accounts ({users.length})</span>
            </button>

            {tenantId !== 'tenant-nepal-dental' && (
              <button
                type="button"
                onClick={() => setActiveTab('danger')}
                className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition whitespace-nowrap ${
                  activeTab === 'danger'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Tenant</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading tenant profile and payment records...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs">
              <strong>Error:</strong> {error}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & CLINIC DETAILS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Demographics Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                      Clinic Demographics & Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Full Registered Name</span>
                        <strong className="text-slate-900 dark:text-slate-100">{tenant?.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Doctor In-Charge</span>
                        <strong className="text-slate-900 dark:text-slate-100">{clinicProfile.doctorInCharge || 'Dr. Mukesh Kushwaha'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Clinic Phone</span>
                        <strong className="text-slate-900 dark:text-slate-100">{clinicProfile.phone || tenant?.phone || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Clinic Address</span>
                        <strong className="text-slate-900 dark:text-slate-100">{clinicProfile.address || 'Gaushala-12, Mahottari, Nepal'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Currency & Timezone</span>
                        <strong className="text-slate-900 dark:text-slate-100">{tenant?.currency || 'Rs.'} ({tenant?.timeZone || 'Asia/Kathmandu'})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Created Date</span>
                        <strong className="text-slate-900 dark:text-slate-100">{tenant?.createdAt ? tenant.createdAt.split('T')[0] : '2026-01-15'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Active Feature Module Allocations */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Allocated Feature Modules
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">Click to toggle module access</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { key: 'charting', label: 'Dental Chart', icon: '🦷' },
                        { key: 'appointments', label: 'Appointments', icon: '📅' },
                        { key: 'billing', label: 'Billing & POS', icon: '🧾' },
                        { key: 'prescriptions', label: 'Prescription Rx', icon: '💊' },
                        { key: 'pharmacy', label: 'Pharmacy & Stock', icon: '📦' },
                        { key: 'finance', label: 'Finance & Ledger', icon: '💰' },
                        { key: 'aiAssistant', label: 'AI Diagnostics', icon: '✨' },
                        { key: 'whatsapp', label: 'WhatsApp Automation', icon: '💬' }
                      ].map((mod) => {
                        const isAllocated = tenant?.modules ? tenant.modules[mod.key] !== false : true;
                        return (
                          <button
                            key={mod.key}
                            type="button"
                            onClick={() => handleToggleModule(mod.key)}
                            disabled={processing}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                              isAllocated
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <span className="flex items-center space-x-1.5 text-xs font-bold truncate">
                              <span>{mod.icon}</span>
                              <span className="truncate">{mod.label}</span>
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              isAllocated ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                            }`}>
                              {isAllocated ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SUBSCRIPTION & EXPIRY MANAGEMENT */}
              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Quick Extension Buttons */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-900">
                    <h4 className="text-xs font-black uppercase text-blue-900 dark:text-blue-300 tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>One-Click Subscription Extension</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                      Instantly extend this clinic's subscription expiry date and ensure continuous clinic operations:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: '+1 Month', months: 1 },
                        { label: '+3 Months', months: 3 },
                        { label: '+6 Months', months: 6 },
                        { label: '+1 Year (12 Mo)', months: 12 },
                        { label: '+2 Years (24 Mo)', months: 24 }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleQuickExtend(item.months)}
                          disabled={processing}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-2xs active:scale-95 flex items-center space-x-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subscription Settings Form */}
                  <form onSubmit={handleSaveSubscription} className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                      Subscription Parameters & Exact Expiry Date
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Subscription Plan Tier *
                          </label>
                          <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded">
                            Auto-calculates Fee
                          </span>
                        </div>
                        <select
                          value={subForm.planId}
                          onChange={(e) => handleSubPlanChange(e.target.value)}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Rs. {Number(p.priceMonthly || 0).toLocaleString()}/mo • Rs. {Number(p.priceYearly || ((p.priceMonthly || 0) * 10)).toLocaleString()}/yr)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Billing Cycle
                          </label>
                          <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                            {subForm.billingCycle}
                          </span>
                        </div>
                        <select
                          value={subForm.billingCycle}
                          onChange={(e) => handleSubBillingCycleChange(e.target.value)}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                        >
                          <option value="Yearly">Yearly (Annual Plan)</option>
                          <option value="Monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Subscription Status
                        </label>
                        <select
                          value={subForm.status}
                          onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                        >
                          <option value="Active">Active</option>
                          <option value="Trial">Trial</option>
                          <option value="Expired">Expired</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Exact Expiry Date (YYYY-MM-DD) *
                        </label>
                        <input
                          type="date"
                          value={subForm.expiryDate}
                          onChange={(e) => setSubForm({ ...subForm, expiryDate: e.target.value })}
                          required
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Total Software Fee Due (Rs.) *
                          </label>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span>✓</span> Auto from Plan
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={subForm.totalAmountDue}
                            onChange={(e) => setSubForm({ ...subForm, totalAmountDue: e.target.value })}
                            placeholder="e.g. 75000"
                            className="w-full bg-emerald-50/30 dark:bg-slate-700 border-2 border-emerald-400 dark:border-emerald-600 rounded-xl px-3 py-2 pr-16 text-xs font-bold text-emerald-950 dark:text-emerald-200 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setSubForm(prev => ({ ...prev, totalAmountDue: getPlanPricing(prev.planId, prev.billingCycle) }))}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md border border-slate-300 dark:border-slate-600"
                            title="Reset to default plan rate"
                          >
                            ↺ Auto
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Standard rate: <strong>Rs. {getPlanPricing(subForm.planId, subForm.billingCycle).toLocaleString()}</strong>
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Notes / Memo
                        </label>
                        <input
                          type="text"
                          value={subForm.notes}
                          onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                          placeholder="e.g. Annual renewal agreed with Dr. Mukesh"
                          className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={processing}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center space-x-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Subscription Changes</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: SOFTWARE PAYMENT HISTORY */}
              {activeTab === 'payments' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Software & Subscription Payment Ledger
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Total Due: <strong>Rs. {totalDue.toLocaleString()}</strong> • Paid: <strong className="text-emerald-600">Rs. {totalPaid.toLocaleString()}</strong> • Balance: <strong className={remainingBal > 0 ? 'text-amber-600' : 'text-emerald-600'}>Rs. {remainingBal.toLocaleString()}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPaymentForm((prev) => !prev)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center space-x-1.5 self-start sm:self-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showPaymentForm ? 'Cancel Payment' : 'Record Payment'}</span>
                    </button>
                  </div>

                  {/* Record Payment Form Modal / Collapse */}
                  {showPaymentForm && (
                    <form onSubmit={handleRecordPayment} className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3 animate-fadeIn">
                      <h5 className="text-xs font-black uppercase text-blue-900 dark:text-blue-300 tracking-wider">
                        Record New Software Payment
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Amount (Rs.) *
                          </label>
                          <input
                            type="number"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            placeholder="e.g. 75000"
                            required
                            min="1"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Payment Date *
                          </label>
                          <input
                            type="date"
                            value={paymentForm.date}
                            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                            required
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Payment Method
                          </label>
                          <select
                            value={paymentForm.method}
                            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                          >
                            <option value="FonePay QR">FonePay QR</option>
                            <option value="Bank Transfer">Bank Transfer (NABIL / NICA)</option>
                            <option value="eSewa">eSewa Mobile Wallet</option>
                            <option value="Khalti">Khalti</option>
                            <option value="Card POS">Debit / Credit Card</option>
                            <option value="Cash">Cash in Hand</option>
                            <option value="Cheque">Bank Cheque</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Transaction Reference
                          </label>
                          <input
                            type="text"
                            value={paymentForm.transactionRef}
                            onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                            placeholder="e.g. NABIL-998822"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Billing Period / Description
                          </label>
                          <input
                            type="text"
                            value={paymentForm.billingPeriod}
                            onChange={(e) => setPaymentForm({ ...paymentForm, billingPeriod: e.target.value })}
                            placeholder="e.g. 2026-2027 Annual Cloud Software Subscription"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Notes / Memo
                          </label>
                          <input
                            type="text"
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            placeholder="e.g. Paid via mobile banking confirmation"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={processing}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Payment Record</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Payments Table */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Invoice / Ref #</th>
                            <th className="px-4 py-3">Payment Method</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-6 text-center text-xs text-slate-400 font-medium">
                                No software payments recorded yet for this clinic.
                              </td>
                            </tr>
                          ) : (
                            payments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                                <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                                  {p.date}
                                </td>
                                <td className="px-4 py-3 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400">
                                  {p.transactionRef || p.invoiceNo || p.id}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                                  {p.method || 'Bank Transfer'}
                                </td>
                                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={p.notes || p.billingPeriod}>
                                  {p.billingPeriod || p.notes || 'Subscription payment'}
                                </td>
                                <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-slate-100">
                                  Rs. {Number(p.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    PAID
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {p.id.startsWith('spay-') && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePayment(p.id)}
                                      className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                      title="Delete payment record"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TENANT USER ACCOUNTS */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                        Authorized Clinic Staff Accounts
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Super Admins can add, edit roles, reset passwords, or remove user access for this clinic:
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(null);
                        setUserForm({
                          name: '',
                          email: '',
                          username: '',
                          password: '',
                          phone: '',
                          role: 'DOCTOR'
                        });
                        setShowUserModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-2xs flex items-center space-x-1.5 self-start sm:self-center"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add User Account</span>
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3">Full Name & Username</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Email Address</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-6 text-center text-xs text-slate-400 font-medium">
                                No staff accounts found for this clinic.
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.userId} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                                <td className="px-4 py-3 align-middle">
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                                </td>
                                <td className="px-4 py-3 align-middle">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    u.role === 'CLINIC_ADMIN'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                      : u.role === 'DOCTOR'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 align-middle font-medium text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                  {u.email || '-'}
                                </td>
                                <td className="px-4 py-3 align-middle font-medium text-slate-600 dark:text-slate-400">
                                  {u.phone || '-'}
                                </td>
                                <td className="px-4 py-3 align-middle">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    u.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                  }`}>
                                    {u.status || 'active'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                                  <div className="inline-flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleEditUserClick(u)}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 text-blue-600 transition"
                                      title="Edit user details or reset password"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveUser(u.userId, u.name)}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-red-950/40 text-red-500 transition"
                                      title="Remove user account from clinic"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DANGER ZONE (REMOVE TENANT) */}
              {activeTab === 'danger' && tenantId !== 'tenant-nepal-dental' && (
                <div className="p-5 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900 space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Permanently Delete Tenant Clinic</span>
                    </h4>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                      Deleting clinic <strong>"{tenant?.name}"</strong> will remove all its clinical patient data, domain bindings, staff memberships, and subscription records.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Type <strong>{tenant?.name}</strong> to confirm deletion:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      placeholder={tenant?.name}
                      className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl px-3 py-2 text-xs font-bold text-red-700 dark:text-red-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteTenant}
                    disabled={processing || deleteConfirmInput !== tenant?.name}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Permanently Delete This Tenant</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>Tenant Clinic ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{tenantId}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition"
          >
            Close Profile
          </button>
        </div>

        {/* Sub-Modal: Add / Edit User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>{editingUser ? 'Edit User Account' : 'Add New Staff User Account'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kumar"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Role *
                    </label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <option value="CLINIC_ADMIN">Super Admin (Clinic Owner)</option>
                      <option value="DOCTOR">Doctor (BDS/MDS)</option>
                      <option value="RECEPTIONIST">Receptionist (Front Desk)</option>
                      <option value="STAFF">General Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="e.g. rajesh"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="e.g. rajesh@clinic.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="e.g. +977 98012 34567"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : 'Enter login password'}
                    required={!editingUser}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingUser ? 'Update User' : 'Create User'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
