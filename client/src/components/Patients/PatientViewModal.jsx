import React, { useState, useEffect } from 'react';
import { assessTicketValidity } from '../../utils/ticketValidity';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  HeartPulse,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  Package,
  Activity,
  FileText,
  Pill,
  Printer,
  Edit2,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Plus,
  CreditCard,
  Stethoscope,
  Sparkles,
  Layers,
  ArrowUpRight,
  Download,
  Eye,
  Tag
} from 'lucide-react';
import XRayViewerModal from '../XRay/XRayViewerModal';
import XRayUploadModal from '../XRay/XRayUploadModal';

export default function PatientViewModal({
  patient,
  isOpen,
  onClose,
  onEdit,
  appointments = [],
  clinicProfile = {},
  currentUser,
  activeTenant,
  authToken,
  onOpenWhatsApp,
  onNavigateTab,
  onOpenLabOrders
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'billing' | 'appointments' | 'orders' | 'imaging' | 'chart' | 'prescriptions'
  const [patientXrays, setPatientXrays] = useState([]);
  const [selectedXrayForViewer, setSelectedXrayForViewer] = useState(null);
  const [xrayUploadModalOpen, setXrayUploadModalOpen] = useState(false);
  const [imagingFilter, setImagingFilter] = useState('all');

  // Fetch patient X-rays / Diagnostic Imaging
  const fetchPatientXrays = () => {
    if (patient?.id) {
      fetch(`/api/xray/patient/${patient.id}`, {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
        }
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPatientXrays(data);
          }
        })
        .catch((err) => console.warn('Could not fetch patient xrays:', err));
    }
  };

  useEffect(() => {
    fetchPatientXrays();
  }, [patient?.id, activeTenant?.id]);

  if (!isOpen || !patient) return null;

  const currency = clinicProfile?.currency || 'Rs.';

  // Filter appointments specifically for this patient
  const patientAppointments = appointments.filter(
    (apt) => apt.patientId === patient.id || (apt.patientPhone && apt.patientPhone === patient.phone)
  );

  const completedApts = patientAppointments.filter((a) => a.status === 'Completed').length;
  const upcomingApts = patientAppointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'In Chair').length;
  const cancelledApts = patientAppointments.filter((a) => a.status === 'Cancelled' || a.status === 'No Show').length;

  // Invoices & Billing Stats
  const invoices = patient.invoices || [];
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paid) || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
  const advanceCredit = Number(patient.advanceCreditBalance) || 0;

  // Dental Lab Orders
  const orders = patient.orders || [];
  const inProgressOrders = orders.filter((o) => o.progressStatus === 'In Progress' || o.progressStatus === 'Sent to Lab').length;
  const readyOrders = orders.filter((o) => o.progressStatus === 'Ready' || o.progressStatus === 'Delivered').length;
  const completedOrders = orders.filter((o) => o.progressStatus === 'Completed').length;

  // Prescriptions
  const prescriptions = patient.prescriptions || [];

  // Dental Chart Findings
  const chartKeys = Object.keys(patient.dentalChart || {});
  const chartedTeethCount = chartKeys.length;

  // Treatment Plans
  const treatmentPlans = patient.treatmentPlans || [];

  // Ticket Validity
  const ticketInfo = assessTicketValidity(patient, clinicProfile);

  // Allergies & Medical History
  const allergiesList = Array.isArray(patient.allergies)
    ? patient.allergies
    : (patient.allergies ? String(patient.allergies).split(',').map((s) => s.trim()).filter(Boolean) : []);

  const medicalList = Array.isArray(patient.medicalHistory)
    ? patient.medicalHistory
    : (patient.medicalHistory ? String(patient.medicalHistory).split(',').map((s) => s.trim()).filter(Boolean) : []);

  // Format Date Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handlePrintEHR = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden">
        {/* HEADER SECTION */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-6 flex-shrink-0 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Patient Identity */}
            <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg ring-4 ring-white/10 flex-shrink-0">
                {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white truncate">
                    {patient.name}
                  </h2>
                  <span className="font-mono text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-lg shadow-xs">
                    {patient.id}
                  </span>
                  {ticketInfo?.enabled && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                        ticketInfo.status === 'VALID_REVISIT'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : ticketInfo.status === 'EXPIRED'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                      }`}
                      title={ticketInfo.message}
                    >
                      {ticketInfo.badgeText}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs text-blue-200/90 mt-1 flex-wrap gap-y-1">
                  <span className="font-semibold text-white/90">
                    {patient.gender || 'Patient'} • {patient.age ? `${patient.age} yrs` : 'Age N/A'}
                  </span>
                  <span>•</span>
                  <span className="font-mono font-bold text-rose-300 bg-rose-950/50 px-2 py-0.2 rounded border border-rose-800/60">
                    Blood: {patient.bloodGroup || 'N/A'}
                  </span>
                  <span>•</span>
                  <span className="text-slate-300">
                    Registered: {formatDate(patient.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(patient);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition shadow-xs"
                title="Edit Patient Demographics & Profile"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Edit</span>
              </button>

              {patient.phone && onOpenWhatsApp && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenWhatsApp(
                      patient.phone,
                      `Namaste ${patient.name},\nGreetings from ${clinicProfile.name || 'our dental clinic'}. We are following up regarding your dental appointment and care.`
                    )
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
                  title="Send instant WhatsApp message"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              )}

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateTab('chart', patient);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-xs"
                  title="Open Dental Chart / Odontogram"
                >
                  <Activity className="w-3.5 h-3.5 text-white" />
                  <span>Chart</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrintEHR}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 transition"
                title="Print EHR Record"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition"
                title="Close EHR Window"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* VITAL KPI SUMMARY STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-white/10">
            {/* Financial Balance */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Billing & Balance
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-white">
                  {currency} {totalBalance > 0 ? totalBalance.toLocaleString() : '0'}
                </span>
                {totalBalance > 0 ? (
                  <span className="text-[10px] font-bold text-rose-300">Due</span>
                ) : advanceCredit > 0 ? (
                  <span className="text-[10px] font-bold text-emerald-300">
                    +{currency}{advanceCredit} Credit
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-300">Cleared</span>
                )}
              </div>
            </div>

            {/* Total Appointments */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Appointments
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-white">
                  {patientAppointments.length}
                </span>
                <span className="text-[10px] font-medium text-slate-300">
                  ({completedApts} done{upcomingApts > 0 ? `, ${upcomingApts} next` : ''})
                </span>
              </div>
            </div>

            {/* Lab Orders */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Lab Orders
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-white">
                  {orders.length}
                </span>
                <span className="text-[10px] font-medium text-slate-300">
                  ({inProgressOrders} active, {readyOrders + completedOrders} ready)
                </span>
              </div>
            </div>

            {/* Dental X-Rays / Imaging */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Imaging & X-Rays
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-white">
                  {patientXrays.length} Scans
                </span>
                <span className="text-[10px] font-medium text-emerald-300">
                  AES-256 Vault
                </span>
              </div>
            </div>

            {/* Charted Teeth & Rx */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Chart & Rx
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-white">
                  {chartedTeethCount} Teeth
                </span>
                <span className="text-[10px] font-medium text-slate-300">
                  ({prescriptions.length} Prescriptions)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center space-x-2 sm:space-x-3 overflow-x-auto flex-shrink-0 select-none no-print">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition flex-shrink-0 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Overview & Demographics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition flex-shrink-0 ${
              activeTab === 'billing'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Payment History & Invoices</span>
            <span className="ml-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full">
              {invoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition flex-shrink-0 ${
              activeTab === 'appointments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Appointments & Visits</span>
            <span className="ml-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full">
              {patientAppointments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition flex-shrink-0 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Dental Lab Orders</span>
            <span className="ml-1 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('imaging')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition flex-shrink-0 ${
              activeTab === 'imaging'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-500" />
            <span>Imaging & Diagnostics</span>
            <span className="ml-1 text-[10px] font-mono font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
              {patientXrays.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition flex-shrink-0 ${
              activeTab === 'chart'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dental Chart & Treatments</span>
            <span className="ml-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full">
              {chartedTeethCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prescriptions')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center space-x-2 transition flex-shrink-0 ${
              activeTab === 'prescriptions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Prescriptions</span>
            <span className="ml-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full">
              {prescriptions.length}
            </span>
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE BODY) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & DEMOGRAPHICS */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* MEDICAL ALERTS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Allergies Card */}
                <div className={`p-4 rounded-2xl border ${
                  allergiesList.length > 0
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      allergiesList.length > 0 ? 'bg-rose-200 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                      Known Allergies & Drug Reactions
                    </span>
                  </div>

                  {allergiesList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {allergiesList.map((allg, idx) => (
                        <span
                          key={idx}
                          className="bg-rose-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs flex items-center space-x-1"
                        >
                          <span>⚠️ {allg}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium italic mt-2">
                      No known allergies recorded for this patient.
                    </p>
                  )}
                </div>

                {/* Medical History Card */}
                <div className={`p-4 rounded-2xl border ${
                  medicalList.length > 0
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      medicalList.length > 0 ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                      Systemic Health & Medical History
                    </span>
                  </div>

                  {medicalList.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {medicalList.map((med, idx) => (
                        <span
                          key={idx}
                          className="bg-amber-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs"
                        >
                          {med}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-medium italic mt-2">
                      No chronic conditions or systemic illnesses recorded.
                    </p>
                  )}
                </div>
              </div>

              {/* DEMOGRAPHICS & CONTACT DETAILS */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Patient Contact & Administrative Demographics</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onEdit) onEdit(patient);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Mobile Phone</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-mono font-bold text-slate-900 text-sm">{patient.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Emergency Contact</span>
                    <span className="font-semibold text-slate-800 mt-1 block">
                      {patient.emergencyContact || 'None provided'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Gender & Age</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {patient.gender || 'N/A'}, {patient.age ? `${patient.age} years old` : 'Age N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Blood Group</span>
                    <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block mt-1">
                      {patient.bloodGroup || 'Not specified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Unique Patient ID</span>
                    <span className="font-mono font-black text-blue-700 mt-1 block">
                      {patient.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Registration Date</span>
                    <span className="font-medium text-slate-700 mt-1 block">
                      {formatDate(patient.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Nepal Administrative Address */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Administrative Address (Nepal Hierarchy)
                  </span>
                  <div className="flex items-start space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block">
                        {patient.address || 'Address not recorded'}
                      </span>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-1">
                        {patient.tole && <span>Tole: <strong>{patient.tole}</strong></span>}
                        {patient.ward && <span>• Ward: <strong>{patient.ward}</strong></span>}
                        {patient.municipality && <span>• Municipality: <strong>{patient.municipality}</strong></span>}
                        {patient.district && <span>• District: <strong>{patient.district}</strong></span>}
                        {patient.province && <span>• Province: <strong>{patient.province}</strong></span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* OPD TICKET & REVISIT VALIDITY */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>OPD Consultation Ticket & Revisit Policy</span>
                  </h3>
                  {ticketInfo && (
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      ticketInfo.status === 'VALID_REVISIT'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : ticketInfo.status === 'EXPIRED'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {ticketInfo.badgeText}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Status Message</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {ticketInfo?.message || 'Standard OPD Consultation applies'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Revisit Window</span>
                    <span className="font-bold text-slate-800 mt-1 block">
                      {clinicProfile?.visitValidityDays !== undefined ? clinicProfile.visitValidityDays : 7} Days Free Revisit
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Ticket Consultation Fee</span>
                    <span className="font-bold text-blue-700 mt-1 block">
                      {currency} {clinicProfile?.ticketFee !== undefined ? clinicProfile.ticketFee : 200}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PAYMENT HISTORY & INVOICES */}
          {/* ========================================================================= */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Billed</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {currency} {totalBilled.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">All treatments & fees</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Paid</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block">
                    {currency} {totalPaid.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Collected via cash/QR/card</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Balance Due</span>
                  <span className={`text-xl font-black mt-1 block ${
                    totalBalance > 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {currency} {totalBalance.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {totalBalance > 0 ? 'Outstanding receivable' : 'Fully settled'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Advance Credit</span>
                  <span className="text-xl font-black text-blue-600 mt-1 block">
                    {currency} {advanceCredit.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-blue-700 font-medium">Unallocated deposit</span>
                </div>
              </div>

              {/* Invoices List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <span>Invoices & Patient Billing Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Detailed record of all clinical charges, consultations, ticket fees, and payments.
                    </p>
                  </div>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('billing', patient);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Invoice</span>
                    </button>
                  )}
                </div>

                {invoices.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">No invoices generated yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Billing records and receipts will automatically appear here once treatments or tickets are invoiced.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Invoice #</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Treatment / Items</th>
                          <th className="py-3 px-4">Method</th>
                          <th className="py-3 px-4 text-right">Total</th>
                          <th className="py-3 px-4 text-right">Paid</th>
                          <th className="py-3 px-4 text-right">Balance</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv, idx) => {
                          const itemsCount = (inv.items || []).length;
                          const itemsSummary = (inv.items || []).map((it) => it.name).join(', ') || 'Dental Treatment';
                          const isFullyPaid = (Number(inv.balance) || 0) <= 0;

                          return (
                            <tr key={inv.id || idx} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-mono font-bold text-blue-700">
                                {inv.invoiceNumber || inv.id || `INV-${idx + 1}`}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-medium">
                                <div>{formatDate(inv.date)}</div>
                                {(inv.time || inv.createdAt) && (
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {inv.time || (inv.createdAt ? new Date(inv.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '')}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 max-w-xs truncate text-slate-800" title={itemsSummary}>
                                <div className="font-semibold truncate">{itemsSummary}</div>
                                {itemsCount > 1 && (
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {itemsCount} procedures billed
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  {inv.paymentMethod || 'Fonepay QR'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-slate-900">
                                {currency} {(Number(inv.total) || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                {currency} {(Number(inv.paid) || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-bold">
                                {(Number(inv.balance) || 0) > 0 ? (
                                  <span className="text-rose-600 font-black">
                                    {currency} {(Number(inv.balance) || 0).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                                  isFullyPaid
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : (Number(inv.paid) || 0) > 0
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}>
                                  {isFullyPaid ? 'Paid' : (Number(inv.paid) || 0) > 0 ? 'Partial' : 'Unpaid'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: APPOINTMENTS & VISITS */}
          {/* ========================================================================= */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              {/* Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Appointments</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {patientAppointments.length}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">All visits on record</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Completed</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block">
                    {completedApts}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Finished clinical visits</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Upcoming / Scheduled</span>
                  <span className="text-xl font-black text-blue-600 mt-1 block">
                    {upcomingApts}
                  </span>
                  <span className="text-[10px] text-blue-700 font-medium">Active queue</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Cancelled / No Show</span>
                  <span className="text-xl font-black text-slate-600 mt-1 block">
                    {cancelledApts}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Missed bookings</span>
                </div>
              </div>

              {/* Appointments List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Appointment History & Visit Log</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All chair appointments, treatment types, allocated durations, and doctor notes.
                    </p>
                  </div>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('appointments', patient);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule New Appointment</span>
                    </button>
                  )}
                </div>

                {patientAppointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">No appointments recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Use the Schedule button to book this patient into the doctor's appointment calendar.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Doctor & Chair</th>
                          <th className="py-3 px-4">Treatment / Reason</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Clinical Visit Notes</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {patientAppointments.map((apt, idx) => (
                          <tr key={apt.id || idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{formatDate(apt.date)}</div>
                              <span className="font-mono text-[11px] text-blue-600 flex items-center space-x-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>{apt.time || '10:00 AM'}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{apt.doctorName || 'Dr. Mukesh Kushwaha'}</div>
                              <span className="text-[10px] text-slate-500 font-medium block">
                                {apt.chair || 'Chair 1 (Main Operatory)'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                              {apt.treatmentType || 'General Dental Consultation'}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {apt.durationMinutes ? `${apt.durationMinutes} mins` : '30 mins'}
                            </td>
                            <td className="py-3 px-4 max-w-xs text-slate-600 italic">
                              {apt.notes || 'Routine follow-up visit.'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                                apt.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : apt.status === 'Scheduled' || apt.status === 'Confirmed'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : apt.status === 'In Chair'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {apt.status || 'Scheduled'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DENTAL LAB ORDERS */}
          {/* ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Lab Orders</span>
                  <span className="text-xl font-black text-slate-900 mt-1 block">
                    {orders.length}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Custom prosthetics</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">In Production</span>
                  <span className="text-xl font-black text-indigo-600 mt-1 block">
                    {inProgressOrders}
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium">At laboratory / fabrication</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Ready / Trial</span>
                  <span className="text-xl font-black text-amber-600 mt-1 block">
                    {readyOrders}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">Delivered to clinic</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Delivered / Cemented</span>
                  <span className="text-xl font-black text-emerald-600 mt-1 block">
                    {completedOrders}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Completed treatments</span>
                </div>
              </div>

              {/* Lab Orders List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Package className="w-4 h-4 text-indigo-600" />
                      <span>Custom Dental Laboratory Orders</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prosthetic orders, crowns, bridges, dentures, custom abutments, and shade specifications.
                    </p>
                  </div>

                  {onOpenLabOrders && (
                    <button
                      type="button"
                      onClick={() => onOpenLabOrders(patient)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Lab Order</span>
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">No laboratory orders recorded</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Crowns, bridges, clear aligners, and dentures ordered for this patient will be tracked here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.map((order, idx) => (
                      <div key={order.id || idx} className="p-4 sm:p-5 hover:bg-slate-50/80 transition space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                              {order.id}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {order.orderType}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              • {order.toothOrImplantDetails || 'Details not specified'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                              order.progressStatus === 'Completed' || order.progressStatus === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : order.progressStatus === 'Ready'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            }`}>
                              {order.progressStatus || 'In Progress'}
                            </span>
                            <span className="font-black text-xs text-slate-900">
                              {currency} {(Number(order.cost) || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Specs & Laboratory */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Lab</span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {order.assignedStaffOrLab || 'In-House Dental Milling'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Material & Shade</span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {order.materials || 'Zirconia'} • {order.clinicalSpecifications?.split('.')[0] || 'VITA Shade'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Expected Date</span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {formatDate(order.expectedCompletionDate)}
                            </span>
                          </div>
                        </div>

                        {order.clinicalSpecifications && (
                          <p className="text-xs text-slate-600 italic">
                            "{order.clinicalSpecifications}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: IMAGING & DIAGNOSTICS (DENTAL X-RAY & DICOM PACS) */}
          {/* ========================================================================= */}
          {activeTab === 'imaging' && (
            <div className="space-y-6">
              {/* Imaging Header & Upload Button */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span>Imaging & Diagnostics (Dental X-Ray & PACS)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Encrypted radiograph studies linked to {patient.name} ({patient.id}) with DICOM Part 10 metadata and AES-256 vault storage.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setXrayUploadModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Radiograph</span>
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs select-none">
                  {['all', 'Panoramic (OPG)', 'Periapical (IOPA)', 'Bitewing (BWR)', 'Cephalometric (Lateral / PA)', 'Cone Beam 3D (CBCT Slice)'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setImagingFilter(t)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex-shrink-0 ${
                        imagingFilter === t
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{t === 'all' ? `All Scans (${patientXrays.length})` : t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Radiographs Grid for this Patient */}
              {patientXrays.filter((x) => imagingFilter === 'all' || x.radiographType === imagingFilter).length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 space-y-2">
                  <Activity className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No radiographs uploaded for this patient yet</p>
                  <p className="text-xs text-slate-400">
                    Upload panoramic (OPG), periapical (IOPA), bitewing, or cephalometric scans (.dcm, .png, .jpeg, .tiff up to 50MB).
                  </p>
                  <button
                    type="button"
                    onClick={() => setXrayUploadModalOpen(true)}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload First Radiograph</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patientXrays
                    .filter((x) => imagingFilter === 'all' || x.radiographType === imagingFilter)
                    .map((xray) => {
                      const isDicom = xray.format === 'dcm' || !!xray.dicomMetadata;
                      const teethStr = Array.isArray(xray.toothNumbers) ? xray.toothNumbers.join(', ') : xray.toothNumbers;

                      return (
                        <div
                          key={xray.id}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm overflow-hidden flex flex-col justify-between group"
                        >
                          <div>
                            {/* Preview */}
                            <div
                              onClick={() => setSelectedXrayForViewer(xray)}
                              className="relative bg-slate-950 h-40 flex items-center justify-center cursor-pointer overflow-hidden group-hover:brightness-105 transition"
                            >
                              <img
                                src={xray.preSignedUrl || `/api/xray/stream/${xray.id}`}
                                alt={xray.title}
                                className="max-h-full max-w-full object-contain select-none"
                              />

                              <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                                <span className="font-mono text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm">
                                  {xray.id}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded shadow-sm ${
                                  isDicom ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'
                                }`}>
                                  {isDicom ? 'DICOM' : xray.format?.toUpperCase()}
                                </span>
                              </div>

                              <div className="absolute top-2.5 right-2.5">
                                <span className="text-[10px] font-bold bg-slate-900/90 text-slate-200 border border-slate-700 px-2 py-0.5 rounded shadow-sm">
                                  {xray.radiographType}
                                </span>
                              </div>

                              <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white font-bold text-xs">
                                <Eye className="w-4 h-4" />
                                <span>Open Viewer</span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="p-3.5 space-y-2">
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                                  {xray.title}
                                </h4>
                                <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                                  <span>{xray.uploadedAt ? new Date(xray.uploadedAt).toLocaleDateString() : 'Today'}</span>
                                  {teethStr && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600 font-semibold">Teeth: #{teethStr}</span>
                                    </>
                                  )}
                                  {xray.encounterId && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-500">Visit: {xray.encounterId}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {xray.dicomMetadata && (
                                <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 p-2 rounded-lg border border-indigo-100/80">
                                  <div>Modality: <strong>{xray.dicomMetadata.modality} ({xray.dicomMetadata.modalityDescription})</strong></div>
                                  <div>Exposure: <strong>{xray.dicomMetadata.exposure?.kvp || '70 kVp'} • {xray.dicomMetadata.exposure?.tubeCurrent || '7 mA'}</strong></div>
                                </div>
                              )}

                              {xray.diagnosticImpression && (
                                <p className="text-[11px] text-slate-600 italic line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                                  "{xray.diagnosticImpression}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => setSelectedXrayForViewer(xray)}
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Diagnostic</span>
                            </button>

                            <a
                              href={xray.preSignedUrl || `/api/xray/stream/${xray.id}`}
                              download={xray.fileName || `${xray.id}.${xray.format || 'png'}`}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                              title="Download Decrypted File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: DENTAL CHART & TREATMENTS */}
          {/* ========================================================================= */}
          {activeTab === 'chart' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span>Odontogram Dental Chart Findings</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Per-tooth conditions, pocket depth assessments, restorations, and dental findings.
                    </p>
                  </div>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('chart', patient);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Full Interactive 3D Chart</span>
                    </button>
                  )}
                </div>

                {chartKeys.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Activity className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">No dental chart records yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click 'Open Full Interactive 3D Chart' to map cavities, restorations, crowns, and root canals.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {chartKeys.map((toothId) => {
                      const tooth = patient.dentalChart[toothId] || {};
                      const condition = tooth.condition || 'healthy';
                      const surfaces = tooth.surfaces || {};
                      const surfaceEntries = Object.entries(surfaces).filter(
                        ([, v]) => v && v !== 'healthy'
                      );

                      return (
                        <div
                          key={toothId}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                #{toothId}
                              </span>
                              <span className="font-bold text-xs uppercase text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {condition.replace('_', ' ')}
                              </span>
                            </div>

                            {surfaceEntries.length > 0 && (
                              <div className="text-[11px] text-slate-600 space-y-0.5 mt-2">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block">Surfaces:</span>
                                {surfaceEntries.map(([surf, val]) => (
                                  <div key={surf} className="capitalize flex justify-between">
                                    <span>{surf}:</span>
                                    <strong className="text-slate-800">{String(val).replace('_', ' ')}</strong>
                                  </div>
                                ))}
                              </div>
                            )}

                            {tooth.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-2">
                                "{tooth.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Treatment Plans */}
              {treatmentPlans.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Active Treatment Plans
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {treatmentPlans.map((tp, idx) => (
                      <div key={tp.id || idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{tp.title || tp.procedure || 'Treatment Step'}</span>
                          {tp.tooth && <span className="text-slate-500 ml-1.5">(Tooth #{tp.tooth})</span>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900">
                            {currency} {(Number(tp.estimatedCost) || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                            {tp.status || 'Planned'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: PRESCRIPTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                      <Pill className="w-4 h-4 text-blue-600" />
                      <span>Prescriptions & Formulary Orders</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Medication history, dosages, dosage frequencies, and special instructions.
                    </p>
                  </div>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('prescriptions', patient);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Write New Prescription</span>
                    </button>
                  )}
                </div>

                {prescriptions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Pill className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">No prescriptions issued yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Prescriptions written on the digital Prescription Pad will be archived here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {prescriptions.map((rx, idx) => (
                      <div key={rx.id || idx} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/80 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {rx.id || `RX-${idx + 1}`}
                            </span>
                            <span className="font-bold text-xs text-slate-900">
                              {formatDate(rx.date)}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              • By {rx.doctor || 'Dr. Mukesh Kushwaha'}
                            </span>
                          </div>

                          {rx.diagnosis && (
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                              Diagnosis: {rx.diagnosis}
                            </span>
                          )}
                        </div>

                        {/* Medicines Table */}
                        {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3">Medicine</th>
                                  <th className="py-2 px-3">Dosage</th>
                                  <th className="py-2 px-3">Frequency</th>
                                  <th className="py-2 px-3">Duration</th>
                                  <th className="py-2 px-3">Instructions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rx.medicines.map((m, mIdx) => (
                                  <tr key={mIdx}>
                                    <td className="py-2 px-3 font-bold text-slate-800">{m.name}</td>
                                    <td className="py-2 px-3 font-mono text-slate-600">{m.dosage || '-'}</td>
                                    <td className="py-2 px-3 text-slate-700 font-medium">{m.frequency || 'BD'}</td>
                                    <td className="py-2 px-3 text-slate-700">{m.duration || '5 days'}</td>
                                    <td className="py-2 px-3 text-slate-500 italic">{m.instructions || 'After meals'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {rx.instructions && (
                          <p className="text-xs text-slate-600 italic">
                            Special Instructions: "{rx.instructions}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Electronic Health Record (EHR) Active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      {/* Diagnostic X-Ray Viewer Modal */}
      {selectedXrayForViewer && (
        <XRayViewerModal
          isOpen={!!selectedXrayForViewer}
          xray={selectedXrayForViewer}
          onClose={() => setSelectedXrayForViewer(null)}
          onSaveFindings={(updatedXray) => {
            setPatientXrays((prev) =>
              prev.map((x) => (x.id === updatedXray.id ? updatedXray : x))
            );
          }}
        />
      )}

      {/* Radiograph Upload Modal */}
      {xrayUploadModalOpen && (
        <XRayUploadModal
          isOpen={xrayUploadModalOpen}
          onClose={() => setXrayUploadModalOpen(false)}
          initialPatientId={patient.id}
          currentUser={currentUser}
          activeTenant={activeTenant}
          authToken={authToken}
          onUploadSuccess={(newXray) => {
            setPatientXrays((prev) => [newXray, ...prev]);
          }}
        />
      )}
    </div>
  </div>
);
}