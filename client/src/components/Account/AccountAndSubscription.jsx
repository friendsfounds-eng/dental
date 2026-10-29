import React, { useState, useEffect, useRef } from 'react';
import AnayaCraftLogo from '../Common/AnayaCraftLogo';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  FileText,
  Copy,
  Check,
  Building,
  User,
  ShieldCheck,
  Calendar,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  X,
  QrCode,
  DollarSign,
  ArrowRight,
  Info
} from 'lucide-react';

export default function AccountAndSubscription({
  currentUser,
  activeTenant,
  clinicProfile = {},
  authToken,
  onNavigate
}) {
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [receiptToView, setReceiptToView] = useState(null);

  // Renew Form States
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState('Yearly');
  const [payerName, setPayerName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');

  // UI Feedback States
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const fileInputRef = useRef(null);

  const getHeaders = () => ({
    'Authorization': `Bearer ${authToken || localStorage.getItem('dental_auth_token')}`,
    'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental',
    'Content-Type': 'application/json'
  });

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription/current', {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to load subscription details');
      const data = await res.json();
      setSubData(data);
      if (data.subscription?.planId) {
        setSelectedPlanId(data.subscription.planId);
      }
      if (currentUser?.name && !payerName) {
        setPayerName(currentUser.name);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [activeTenant]);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setFormError('Please upload an image receipt (PNG, JPG, JPEG, WEBP) or PDF document.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setFormError('Receipt file exceeds 12MB limit. Please upload a smaller file.');
      return;
    }

    setFormError(null);
    setReceiptFile(file);
    setReceiptFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenRenewModal = (presetPlanId = null) => {
    if (presetPlanId) {
      setSelectedPlanId(presetPlanId);
    } else if (subData?.subscription?.planId) {
      setSelectedPlanId(subData.subscription.planId);
    }
    setFormError(null);
    setRenewModalOpen(true);
  };

  const handleSubmitRenewal = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!payerName || !payerName.trim()) {
      setFormError("Payer's Name is required. Please enter the account name or payer name.");
      return;
    }

    if (!receiptBase64) {
      setFormError('Please upload your transaction receipt / payment screenshot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/subscription/renew', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          payerName: payerName.trim(),
          planId: selectedPlanId || subData?.subscription?.planId || 'plan-professional',
          billingCycle,
          transactionRef: transactionRef.trim(),
          receiptUrl: receiptBase64,
          receiptFileName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to submit renewal request.');
      }

      setSuccessMessage(data.message || 'Receipt uploaded successfully! Payment is awaiting verification.');
      setRenewModalOpen(false);
      // Reset form
      setReceiptFile(null);
      setReceiptBase64('');
      setReceiptFileName('');
      setTransactionRef('');

      // Refresh current subscription
      await fetchSubscription();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper date calculations
  const calculateDaysRemaining = (expiryDateStr) => {
    if (!expiryDateStr) return 0;
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expiry - now;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const currentPlan = subData?.currentPlan;
  const subscription = subData?.subscription;
  const paymentConfig = subData?.paymentConfig;
  const pendingRenewal = subData?.pendingRenewal;
  const lastRejection = subData?.lastRejection;
  const availablePlans = subData?.availablePlans || [];

  const daysRemaining = calculateDaysRemaining(subscription?.expiryDate);
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = subscription?.status === 'Expired' || daysRemaining === 0;
  const isPendingVerification = subscription?.status === 'Payment Awaiting Verification' || Boolean(pendingRenewal);

  const selectedPlan = availablePlans.find(p => p.id === selectedPlanId) || currentPlan || availablePlans[0];
  const renewalAmount = selectedPlan
    ? (billingCycle === 'Monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly)
    : 0;

  if (loading && !subData) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">Loading subscription & account details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Clinic Account & SaaS Licensing</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Account & Subscription Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your clinic plan, monitor renewal dates, and submit official payment receipts.
          </p>
        </div>

        {/* Global Renew Button in Header */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => handleOpenRenewModal()}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>Renew Subscription</span>
          </button>
        </div>
      </div>

      {/* Success Confirmation Toast Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-start justify-between gap-3 text-emerald-900 shadow-md animate-fadeIn">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Receipt Uploaded Successfully!</h4>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">{successMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-sm font-bold p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PENDING VERIFICATION ALERT BANNER */}
      {isPendingVerification && pendingRenewal && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-orange-500/10 border-2 border-amber-400 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    Awaiting Verification
                  </span>
                  <span className="text-xs text-amber-900 font-semibold">
                    Submitted: {new Date(pendingRenewal.submittedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-amber-950 mt-1">
                  Payment Verification In Progress by Software Owner
                </h3>
                <p className="text-xs text-amber-900 mt-1 max-w-2xl font-medium">
                  Your renewal receipt for <strong>{pendingRenewal.planName}</strong> ({pendingRenewal.currency} {pendingRenewal.amount.toLocaleString()}) was successfully uploaded by <strong>{pendingRenewal.payerName}</strong>. The developer admin is verifying the bank credit. Your services continue uninterrupted.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {pendingRenewal.receiptUrl && (
                <button
                  onClick={() => {
                    setReceiptToView({
                      url: pendingRenewal.receiptUrl,
                      name: pendingRenewal.receiptFileName,
                      payer: pendingRenewal.payerName,
                      amount: `${pendingRenewal.currency} ${pendingRenewal.amount}`,
                      ref: pendingRenewal.transactionRef,
                      date: pendingRenewal.submittedAt
                    });
                    setReceiptViewerOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-700" />
                  <span>View Submitted Receipt</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION ALERT & INSTRUCTIONS BANNER */}
      {lastRejection && !isPendingVerification && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                    Payment Verification Rejected
                  </span>
                  <span className="text-xs text-rose-800 font-semibold">
                    Reviewed: {new Date(lastRejection.rejectedAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-rose-950 mt-1">
                  Rejection Reason: "{lastRejection.reason}"
                </h3>
                <div className="mt-2 bg-white/80 p-3 rounded-xl border border-rose-200">
                  <p className="text-xs font-bold text-slate-800 mb-0.5">Instructions for Resubmitting Receipt:</p>
                  <p className="text-xs text-slate-700 font-medium">{lastRejection.instructions}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenRenewModal()}
              className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex-shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Resubmit Fresh Receipt Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: User Profile Account & Current Plan Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User & Clinic Account Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-inner">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 leading-tight">
                  {currentUser?.name || 'Dr. Mukesh Kushwaha'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {currentUser?.username ? `@${currentUser.username}` : (currentUser?.email || 'admin@nepaldental.com.np')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 uppercase font-mono">
                    {currentUser?.role || 'CLINIC_ADMIN'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">User Account</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Clinic Entity:</span>
                <span className="font-bold text-slate-800 text-right truncate max-w-[180px]">
                  {clinicProfile.name || activeTenant?.name || 'Nepal Dental Centre'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="font-bold text-slate-800 text-right">
                  {clinicProfile.address || 'Gaushala-12 Mahaottari Nepal'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Registration No:</span>
                <span className="font-mono font-bold text-slate-800">
                  {clinicProfile.regNo || 'NMC-67890'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Default Currency:</span>
                <span className="font-bold text-blue-600">
                  {clinicProfile.currency || activeTenant?.currency || 'Rs.'} (NPR)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 font-medium">Tenant Slug ID:</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {activeTenant?.id || 'tenant-nepal-dental'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-2xl">
            <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>To update your clinic address, doctor credentials, or logo, navigate to <strong>Clinic Configuration</strong>.</span>
            </div>
          </div>
        </div>

        {/* Current Plan & Subscription Status Card (2 Columns Wide) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div>
            {/* Top row: Plan Name & Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Plan</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase font-mono">
                      {subscription?.billingCycle || 'Yearly'} Billing
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {subscription?.planName || currentPlan?.name || 'Professional Practice'}
                  </h2>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                {isPendingVerification ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Payment Awaiting Verification</span>
                  </span>
                ) : isExpired ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Subscription Expired</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active & Fully Licensed</span>
                  </span>
                )}
              </div>
            </div>

            {/* Key Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {/* Start Date */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Start Date
                </span>
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{formatDate(subscription?.startDate)}</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Account initialization</span>
              </div>

              {/* Expiry Date */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Expiry Date
                </span>
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span className={isExpired ? 'text-rose-600 font-black' : isExpiringSoon ? 'text-amber-600 font-black' : ''}>
                    {formatDate(subscription?.expiryDate)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Subject to renewal receipt</span>
              </div>

              {/* Countdown / Days Remaining */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Time Remaining
                </span>
                <div className="flex items-center space-x-2 font-black text-sm">
                  <Clock className={`w-4 h-4 ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-500' : 'text-emerald-600'}`} />
                  <span className={isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-700'}>
                    {daysRemaining} Days
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isExpired ? 'Expired — Renew immediately' : isExpiringSoon ? 'Expiring soon' : 'Good standing'}
                </span>
              </div>
            </div>

            {/* Plan Entitlements & Features Grid */}
            <div className="mt-6 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Plan Inclusions & Capacity
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">Branches</span>
                  <span className="text-sm font-black text-slate-800">
                    {currentPlan?.maxBranches || 3} Included
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">Staff Accounts</span>
                  <span className="text-sm font-black text-slate-800">
                    Up to {currentPlan?.maxStaff || 15} Users
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">Patient EHR</span>
                  <span className="text-sm font-black text-slate-800">
                    Up to {currentPlan?.maxPatients?.toLocaleString() || '5,000'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">Pharmacy Module</span>
                  <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Active POS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer: Renew Subscription Button */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Payment verification is audited and approved by the software owner (Developer Admin).
            </div>
            <button
              onClick={() => handleOpenRenewModal()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Renew Subscription</span>
            </button>
          </div>
        </div>
      </div>

      {/* Available Plans & Upgrades Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Available Subscription Tiers</h3>
            <p className="text-xs text-slate-500 mt-0.5">Choose your plan tier to upgrade capacity or renew for 1 year with discounted pricing.</p>
          </div>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full w-fit">
            🎁 2 Months Free on Yearly Billing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan) => {
            const isCurrent = (subscription?.planId || currentPlan?.id) === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 border transition flex flex-col justify-between relative ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/20 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                    Current Active Plan
                  </span>
                )}

                <div>
                  <h4 className="text-base font-black text-slate-900">{plan.name}</h4>
                  <div className="mt-3 flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-slate-900">
                      Rs. {plan.priceYearly?.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ year</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    or Rs. {plan.priceMonthly?.toLocaleString()} / month
                  </span>

                  <ul className="mt-5 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span><strong>{plan.maxBranches}</strong> Clinic Branch(es)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Up to <strong>{plan.maxStaff}</strong> Doctor & Staff Seats</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Up to <strong>{plan.maxPatients?.toLocaleString()}</strong> Patient Charts</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Digital Prescriptions & Invoicing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Pharmacy POS & Inventory Stock</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenRenewModal(plan.id)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-1.5 ${
                      isCurrent
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{isCurrent ? 'Renew Current Plan' : 'Select Plan & Pay'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* POPUP: RENEW SUBSCRIPTION MODAL (SOFTWARE OWNER PAYMENT INFO) */}
      {/* ============================================================ */}
      {renewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-lg border border-blue-400/30">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <span>Renew Subscription</span>
                      <span className="text-[10px] bg-blue-500/40 text-blue-200 px-2 py-0.5 rounded-full font-mono uppercase">
                        Official Payment Gateway
                      </span>
                    </h3>
                    <p className="text-xs text-blue-200 mt-0.5">
                      Transfer fees to the software owner's bank account or scan QR, then upload your receipt voucher.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRenewModalOpen(false)}
                  className="text-white/70 hover:text-white p-1 rounded-lg text-lg font-bold"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitRenewal} className="p-6 overflow-y-auto space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Software Owner Payment Details Box */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-5 border border-blue-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200/80 gap-2">
                  <AnayaCraftLogo variant="horizontal" size="sm" />
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full self-start sm:self-auto">
                    Official Beneficiary
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Bank Account Details */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Beneficiary Account Name:</span>
                      <strong className="text-slate-900 font-bold block text-sm">
                        {paymentConfig?.accountName || 'Anaya Craft IT Solutions Pvt. Ltd.'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Bank / Payment Provider:</span>
                      <strong className="text-slate-900 font-bold block">
                        {paymentConfig?.bankName || 'Nabil Bank Limited'} ({paymentConfig?.branch || 'New Baneshwor Branch'})
                      </strong>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Account Number:</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <strong className="font-mono text-sm font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {paymentConfig?.accountNumber || '01201017500982'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentConfig?.accountNumber || '01201017500982', 'acc')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                        >
                          {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Digital Identifier (eSewa / Khalti):</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {paymentConfig?.paymentIdentifier || 'anacraft@nabil'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(paymentConfig?.paymentIdentifier || 'anacraft@nabil', 'id')}
                          className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-bold transition"
                        >
                          {copiedField === 'id' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: QR Code Display */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                    <span className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-red-600" />
                      <span>Scan & Pay (Fonepay / Nabil)</span>
                    </span>
                    <img
                      src={paymentConfig?.qrCodeUrl || '/qr-fonepay-nabil.svg'}
                      alt="Software Owner Payment QR"
                      className="w-36 h-36 object-contain rounded-lg border border-slate-100"
                    />
                    <span className="text-[10px] text-slate-500 font-medium mt-1.5">
                      Accepts eSewa, Khalti, Mobile Banking & Fonepay
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Select Plan & Billing Cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Plan Tier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-slate-800 bg-white"
                  >
                    {availablePlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - (Rs. {p.priceYearly?.toLocaleString()}/yr)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Billing Cycle
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('Yearly')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        billingCycle === 'Yearly'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Yearly (Save 16%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('Monthly')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        billingCycle === 'Monthly'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
              </div>

              {/* Amount to Pay Highlight */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Total Renewal Amount Payable:</span>
                <span className="text-lg font-black text-emerald-400">
                  Rs. {renewalAmount.toLocaleString()} NPR
                </span>
              </div>

              {/* 3. Payer's Name & Transaction Reference (Required validation) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Payer's Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Mukesh Kushwaha"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Name printed on your bank statement or wallet.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Transaction ID / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NABIL-TXN-984128"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Helps speed up bank credit reconciliation.
                  </span>
                </div>
              </div>

              {/* 4. Upload Transaction Receipt (Required validation) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Upload Payment Receipt / Voucher <span className="text-red-500">*</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  className="hidden"
                />

                {!receiptBase64 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition group"
                  >
                    <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-blue-600 transition mb-2" />
                    <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                      Click to upload or drag & drop payment voucher screenshot
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Supports PNG, JPG, JPEG, WEBP or PDF (Max 12MB)
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      {receiptBase64.startsWith('data:image/') ? (
                        <img
                          src={receiptBase64}
                          alt="Receipt Preview"
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate block">
                          {receiptFileName || 'Receipt Voucher Attached'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for verification
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptBase64('');
                          setReceiptFileName('');
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRenewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Receipt...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Submit Renewal & Upload Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POPUP: RECEIPT INSPECTOR MODAL */}
      {/* ============================================================ */}
      {receiptViewerOpen && receiptToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">{receiptToView.name || 'Submitted Payment Receipt'}</h4>
                <p className="text-[11px] text-slate-400">Payer: {receiptToView.payer} • {receiptToView.amount}</p>
              </div>
              <button
                onClick={() => setReceiptViewerOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-100 max-h-[70vh]">
              {receiptToView.url?.startsWith('data:image/') || receiptToView.url?.startsWith('http') ? (
                <img
                  src={receiptToView.url}
                  alt="Receipt Full View"
                  className="max-h-[60vh] max-w-full rounded-xl shadow-md object-contain"
                />
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold">PDF Document Receipt</p>
                  <a
                    href={receiptToView.url}
                    download={receiptToView.name}
                    className="mt-2 inline-flex items-center space-x-1 text-blue-600 font-bold text-xs"
                  >
                    <span>Download File</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 text-right">
              <button
                onClick={() => setReceiptViewerOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
