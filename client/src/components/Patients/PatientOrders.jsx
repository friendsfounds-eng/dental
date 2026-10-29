import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  FileText,
  Paperclip,
  Trash2,
  Edit2,
  Printer,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  X,
  Send,
  MessageSquare,
  Sparkles,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  Eye,
  RefreshCw,
  UploadCloud,
  CreditCard
} from 'lucide-react';

const ORDER_TYPES = [
  'Crown',
  'Bridge',
  'Complete Denture',
  'Partial / Flexible Denture',
  'Implant Custom Work',
  'Clear Aligners & Orthodontic',
  'Ceramic Veneer & Esthetic',
  'Night Guard & Occlusal Splint',
  'Other Custom Lab Work'
];

const SHADE_OPTIONS = [
  'VITA A1', 'VITA A2', 'VITA A3', 'VITA A3.5', 'VITA A4',
  'VITA B1', 'VITA B2', 'VITA B3',
  'VITA C1', 'VITA C2',
  'VITA D2', 'VITA D3',
  'Bleach 0M1', 'Bleach 0M2', 'Bleach 0M3'
];

const MATERIAL_OPTIONS = [
  'High Translucency Multilayer Zirconia (3D Pro)',
  'Monolithic High-Strength Zirconia',
  'Lithium Disilicate (IPS e.max CAD / Press)',
  'Porcelain Fused to Metal (PFM - Cobalt Chromium Ni-Free)',
  'Titanium Grade 5 (Gold-Hue Anodized Custom Abutment) + Zirconia',
  'Valplast Flexible Polyamide Resin',
  'High-Impact Heat-Cure Acrylic with Cross-Linked Teeth',
  'Cast Partial Denture (Co-Cr Framework + Acrylic)',
  'Medical-Grade Biocompatible Polyurethane (Aligner)',
  'Custom Composite / Polycarbonate Temporary'
];

const LAB_OPTIONS = [
  'Kathmandu Dental Ceramics & Milling Lab',
  'Apex CAD/CAM Digital Milling Facility',
  'Himalayan Orthodontic & Aligners Lab',
  'Nepal Bio-Dental Prosthetics Center',
  'In-House Chairside Milling Operatory'
];

const STAGES = [
  { key: 'Requested', label: 'Requested', color: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  { key: 'In Progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  { key: 'Ready', label: 'Ready for Patient', color: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
  { key: 'Completed', label: 'Completed & Seated', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  { key: 'Cancelled', label: 'Cancelled', color: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' }
];

export default function PatientOrders({
  patient,
  patients = [],
  currentUser,
  activeTenant,
  clinicProfile = {},
  authToken,
  onClose,
  onSelectPatient,
  compact = false
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [activeNoteOrderId, setActiveNoteOrderId] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [printOrder, setPrintOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // New Order Form State
  const initialNewOrderState = {
    orderType: 'Crown',
    toothOrImplantDetails: '',
    shade: 'VITA A2',
    marginType: 'Deep Chamfer 360°',
    occlusalClearance: '1.5mm standard',
    clinicalSpecifications: 'Shade: VITA A2. Margin: Deep Chamfer 360°. Occlusal clearance: 1.5mm.',
    materials: 'High Translucency Multilayer Zirconia (3D Pro)',
    assignedStaffOrLab: 'Kathmandu Dental Ceramics & Milling Lab',
    cost: 4500,
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    paymentMethod: 'Cash',
    progressStatus: 'Requested',
    expectedCompletionDays: 5,
    notes: ''
  };
  const [formData, setFormData] = useState(initialNewOrderState);

  // Patient Search & Link State
  const [allPatientsList, setAllPatientsList] = useState(patients || []);
  const [selectedOrderPatient, setSelectedOrderPatient] = useState(patient || null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Auth & Tenant headers helper
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
  });

  // Sync patients list
  useEffect(() => {
    if (patients && patients.length > 0) {
      setAllPatientsList(patients);
    } else {
      fetch('/api/patients', { headers: getHeaders() })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setAllPatientsList(data);
        })
        .catch(() => {});
    }
  }, [patients, activeTenant?.id]);

  // Sync currently selected patient
  useEffect(() => {
    if (patient) {
      setSelectedOrderPatient(patient);
    }
  }, [patient?.id]);

  const currentActivePatient = selectedOrderPatient || patient || allPatientsList[0] || null;
  const patientId = currentActivePatient?.id;

  // Filtered patient list for search
  const filteredSearchPatients = allPatientsList.filter(p => {
    if (!patientSearchTerm.trim()) return true;
    const term = patientSearchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.id && p.id.toLowerCase().includes(term)) ||
      (p.phone && p.phone.toLowerCase().includes(term)) ||
      (p.bloodGroup && p.bloodGroup.toLowerCase().includes(term))
    );
  });

  // Load orders for this patient
  const fetchOrders = async () => {
    if (!patientId) {
      setOrders([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/patients/${patientId}/orders`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch patient orders');
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [patientId, activeTenant?.id]);

  // Handle Create Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const targetPatient = selectedOrderPatient || patient || allPatientsList[0];
    if (!targetPatient || !targetPatient.id) {
      alert('Please search and select a patient to link with this order.');
      return;
    }
    const targetPatientId = targetPatient.id;

    if (!formData.toothOrImplantDetails.trim()) {
      alert('Please specify the Tooth or Implant details (e.g. Tooth #16 or Tooth #46 Implant).');
      return;
    }

    try {
      setLoading(true);
      const expectedDate = new Date(Date.now() + (parseInt(formData.expectedCompletionDays) || 5) * 24 * 60 * 60 * 1000).toISOString();
      const compiledSpecs = `${formData.clinicalSpecifications.trim()} | Shade: ${formData.shade} | Margin: ${formData.marginType} | Clearance: ${formData.occlusalClearance}`;

      const numCost = Math.max(0, Number(formData.cost) || 0);
      let numPaid = 0;
      if (formData.paymentStatus === 'Paid') {
        numPaid = numCost;
      } else if (formData.paymentStatus === 'Partial') {
        numPaid = Math.min(numCost, Math.max(0, Number(formData.paidAmount) || 0));
      } else {
        numPaid = 0;
      }
      const numBalanceDue = Math.max(0, numCost - numPaid);

      const payload = {
        orderType: formData.orderType,
        toothOrImplantDetails: formData.toothOrImplantDetails.trim(),
        clinicalSpecifications: compiledSpecs,
        materials: formData.materials,
        assignedStaffOrLab: formData.assignedStaffOrLab,
        expectedCompletionDate: expectedDate,
        cost: numCost,
        paidAmount: numPaid,
        balanceDue: numBalanceDue,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod || 'Cash',
        progressStatus: formData.progressStatus,
        notes: formData.notes.trim() || `New ${formData.orderType} order initialized for ${targetPatient?.name}.`
      };

      const res = await fetch(`/api/patients/${targetPatientId}/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to create order');
      }

      const resJson = await res.json();
      if (targetPatientId === patient?.id) {
        if (resJson.order) {
          setOrders(prev => [resJson.order, ...prev]);
        } else {
          await fetchOrders();
        }
      } else {
        if (onSelectPatient) {
          onSelectPatient(targetPatient);
        } else {
          setSelectedOrderPatient(targetPatient);
          if (resJson.order) setOrders(prev => [resJson.order, ...prev]);
        }
      }
      setCreateModalOpen(false);
      setFormData(initialNewOrderState);
    } catch (err) {
      alert(`[Error Creating Order] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit / Update Order
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editOrder) return;

    try {
      setLoading(true);
      const numCost = Math.max(0, Number(editOrder.cost) || 0);
      let numPaid = 0;
      if (editOrder.paymentStatus === 'Paid') {
        numPaid = numCost;
      } else if (editOrder.paymentStatus === 'Partial') {
        numPaid = Math.min(numCost, Math.max(0, Number(editOrder.paidAmount) || 0));
      } else {
        numPaid = 0;
      }
      const numBalanceDue = Math.max(0, numCost - numPaid);

      const payload = {
        ...editOrder,
        cost: numCost,
        paidAmount: numPaid,
        balanceDue: numBalanceDue,
        paymentStatus: editOrder.paymentStatus,
        paymentMethod: editOrder.paymentMethod || 'Cash'
      };

      const res = await fetch(`/api/patients/${patientId}/orders/${editOrder.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to update order');
      }

      const resJson = await res.json();
      setOrders(prev => prev.map(o => o.id === editOrder.id ? resJson.order : o));
      setEditOrder(null);
    } catch (err) {
      alert(`[Error Updating Order] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Stage Status Transition
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const notePrompt = window.prompt(
        `Transition Order [${orderId}] to "${newStatus}"?\n\nAdd an optional note (or press OK to proceed):`,
        `Stage progressed to ${newStatus}`
      );
      if (notePrompt === null) return; // User cancelled

      const res = await fetch(`/api/patients/${patientId}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          status: newStatus,
          note: notePrompt.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to transition order status');
      }

      const resJson = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? resJson.order : o));
    } catch (err) {
      alert(`[RBAC Notice / Error] ${err.message}`);
    }
  };

  // Handle Add Communication Note
  const handleAddNote = async (orderId) => {
    if (!newNoteText.trim()) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/orders/${orderId}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: newNoteText.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to add note');
      }

      const resJson = await res.json();
      setOrders(prev => prev.map(o => o.id === orderId ? resJson.order : o));
      setNewNoteText('');
      setActiveNoteOrderId(null);
    } catch (err) {
      alert(`[Note Error] ${err.message}`);
    }
  };

  // Handle Delete Order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete custom order [${orderId}]?`)) return;
    try {
      const res = await fetch(`/api/patients/${patientId}/orders/${orderId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to delete order');
      }

      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert(`[Delete Error] ${err.message}`);
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filterStatus !== 'all' && order.progressStatus?.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    // Type filter
    if (filterType !== 'all' && order.orderType?.toLowerCase() !== filterType.toLowerCase()) {
      return false;
    }
    // Payment filter
    if (filterPayment !== 'all' && order.paymentStatus?.toLowerCase() !== filterPayment.toLowerCase()) {
      return false;
    }
    // Keyword search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id?.toLowerCase().includes(q);
      const matchType = order.orderType?.toLowerCase().includes(q);
      const matchTooth = order.toothOrImplantDetails?.toLowerCase().includes(q);
      const matchSpecs = order.clinicalSpecifications?.toLowerCase().includes(q);
      const matchMat = order.materials?.toLowerCase().includes(q);
      const matchLab = order.assignedStaffOrLab?.toLowerCase().includes(q);
      const matchNotes = Array.isArray(order.notes) && order.notes.some(n => n.text?.toLowerCase().includes(q));
      if (!matchId && !matchType && !matchTooth && !matchSpecs && !matchMat && !matchLab && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  // KPI Calculations
  const totalOrders = orders.length;
  const inProgressCount = orders.filter(o => o.progressStatus === 'In Progress').length;
  const readyCount = orders.filter(o => o.progressStatus === 'Ready').length;
  const completedCount = orders.filter(o => o.progressStatus === 'Completed').length;
  const totalValue = orders.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);
  const totalPaidValue = orders.reduce((sum, o) => {
    const cost = Number(o.cost) || 0;
    if (o.paymentStatus === 'Paid') return sum + cost;
    if (o.paymentStatus === 'Partial') return sum + (Number(o.paidAmount) || 0);
    return sum;
  }, 0);
  const totalDueValue = Math.max(0, totalValue - totalPaidValue);

  if (!patient && allPatientsList.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
        <h3 className="font-bold text-slate-700">No Patient Selected</h3>
        <p className="text-xs text-slate-400 mt-1">
          Please select a patient from the patient records list to view and manage custom dental orders.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${compact ? '' : 'p-1'}`}>
      {/* PATIENT HEADER & ORDER TRACKER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-5 shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-lg shadow-md border border-white/20 flex-shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Dental Lab & Custom Orders</span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    ID: {currentActivePatient?.id || 'N/A'}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-blue-200/90 mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-bold text-white">{currentActivePatient?.name || 'No Patient Selected'}</span>
                {currentActivePatient?.gender && (
                  <>
                    <span>•</span>
                    <span>{currentActivePatient.gender}, {currentActivePatient.age} yrs</span>
                  </>
                )}
                {currentActivePatient?.phone && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-emerald-300">{currentActivePatient.phone}</span>
                  </>
                )}
                {currentActivePatient?.bloodGroup && (
                  <>
                    <span>•</span>
                    <span className="text-rose-300 font-bold">Blood: {currentActivePatient.bloodGroup}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold flex items-center space-x-1"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setSelectedOrderPatient(currentActivePatient);
                setPatientSearchOpen(true);
                setCreateModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center space-x-1.5 transition"
              title="Search patient and link custom dental order"
            >
              <Search className="w-3.5 h-3.5 text-blue-200" />
              <span>Link Order with Patient</span>
            </button>

            <button
              onClick={() => {
                setSelectedOrderPatient(currentActivePatient);
                setPatientSearchOpen(false);
                setCreateModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Lab Order</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition text-xs"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Quick KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-300 block text-[11px]">Total Lab Orders</span>
            <span className="text-lg font-black text-white mt-0.5 block">{totalOrders}</span>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-400/20">
            <span className="text-amber-300 block text-[11px] font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> In Progress (Milling)
            </span>
            <span className="text-lg font-black text-amber-300 mt-0.5 block">{inProgressCount}</span>
          </div>
          <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-400/20">
            <span className="text-purple-300 block text-[11px] font-semibold flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Ready for Delivery
            </span>
            <span className="text-lg font-black text-purple-200 mt-0.5 block">{readyCount}</span>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-400/20">
            <span className="text-emerald-300 block text-[11px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed & Seated
            </span>
            <span className="text-lg font-black text-emerald-300 mt-0.5 block">{completedCount}</span>
          </div>
        </div>

        {/* Orders Financial Revenue & Outstanding Due Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-white/10 text-xs">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-slate-300 text-[11px] font-medium">Total Orders Cost:</span>
            <span className="font-mono font-bold text-white text-sm">
              NPR {totalValue.toLocaleString()}
            </span>
          </div>
          <div className="bg-emerald-500/15 backdrop-blur-xs rounded-xl px-3.5 py-2.5 flex items-center justify-between border border-emerald-400/20">
            <span className="text-emerald-200 text-[11px] font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Collected / Paid:</span>
            </span>
            <span className="font-mono font-bold text-emerald-200 text-sm">
              NPR {totalPaidValue.toLocaleString()}
            </span>
          </div>
          <div className="bg-amber-500/15 backdrop-blur-xs rounded-xl px-3.5 py-2.5 flex items-center justify-between border border-amber-400/20">
            <span className="text-amber-200 text-[11px] font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Outstanding Due:</span>
            </span>
            <span className="font-mono font-black text-amber-300 text-sm">
              NPR {totalDueValue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tooth (#16, #46), material, lab, specs, or order ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Requested">Requested</option>
              <option value="In Progress">In Progress</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Order Types</option>
            {ORDER_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-2.5 py-2 font-medium focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Payments</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* ORDERS LIST */}
      {loading && orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading patient lab orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No Orders Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {orders.length === 0
              ? `No laboratory or custom treatment orders have been created yet for patient [${currentActivePatient?.id || 'selected'}].`
              : 'No orders match your selected search and filter criteria.'}
          </p>
          <button
            onClick={() => {
              setSelectedOrderPatient(currentActivePatient);
              setCreateModalOpen(true);
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Dental Order</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currentStageObj = STAGES.find(s => s.key === order.progressStatus) || STAGES[0];
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition overflow-hidden"
              >
                {/* Order Top Banner */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start sm:items-center space-x-3">
                    <span className="font-mono text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 flex-shrink-0">
                      {order.id}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-slate-900">
                          {order.orderType}: {order.toothOrImplantDetails}
                        </h3>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentStageObj.color}`}>
                          {order.progressStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Ordered: {new Date(order.orderDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-slate-700 font-semibold">
                          Expected Delivery: {new Date(order.expectedCompletionDate).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">{order.assignedStaffOrLab}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Cost */}
                  <div className="flex items-center space-x-2 justify-end">
                    <div className="text-right mr-2 space-y-0.5">
                      <div className="flex items-baseline justify-end space-x-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Total:</span>
                        <span className="text-xs font-black text-slate-900 font-mono">
                          NPR {(order.cost || 0).toLocaleString()}
                        </span>
                      </div>

                      {order.paymentStatus === 'Partial' && (
                        <div className="text-[10px] font-semibold text-emerald-700 font-mono">
                          Paid: NPR {(order.paidAmount || 0).toLocaleString()}
                        </div>
                      )}

                      <div className="flex items-center justify-end">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : order.paymentStatus === 'Partial'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {order.paymentStatus === 'Partial'
                            ? `Partial • Due: NPR ${(order.balanceDue !== undefined ? order.balanceDue : Math.max(0, (order.cost || 0) - (order.paidAmount || 0))).toLocaleString()}`
                            : order.paymentStatus === 'Paid'
                            ? 'Paid in Full'
                            : `Unpaid • Due: NPR ${(order.cost || 0).toLocaleString()}`
                          }
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPrintOrder(order)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition border border-slate-200"
                      title="Print / Export Lab Slip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditOrder(JSON.parse(JSON.stringify(order)))}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition border border-slate-200"
                      title="Edit Order Specifications"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
                      title="Delete Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-slate-200"
                      title={isExpanded ? 'Collapse' : 'Expand Details'}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* 5-STAGE PROGRESS STEPPER */}
                <div className="px-5 py-3.5 bg-white border-b border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                      Workflow Progress Stage
                    </span>
                    <span className="text-blue-600 font-bold text-[11px]">
                      Click any stage to advance order
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {STAGES.map((stage, idx) => {
                      const isActive = order.progressStatus === stage.key;
                      const stageIdx = STAGES.findIndex(s => s.key === order.progressStatus);
                      const isPast = stageIdx >= idx && order.progressStatus !== 'Cancelled';

                      return (
                        <button
                          key={stage.key}
                          type="button"
                          onClick={() => handleStatusChange(order.id, stage.key)}
                          className={`flex items-center justify-center space-x-1.5 py-2 px-1 rounded-xl text-[11px] font-bold transition border ${
                            isActive
                              ? `${stage.color} ring-2 ring-blue-500 shadow-sm`
                              : isPast
                              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isActive ? stage.dot : isPast ? 'bg-slate-500' : 'bg-slate-300'}`} />
                          <span className="truncate">{stage.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CLINICAL SPECIFICATIONS & MATERIALS GRID */}
                <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Material Specification
                    </span>
                    <p className="font-semibold text-slate-800 leading-snug">
                      {order.materials}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 md:col-span-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Clinical Specifications & Shade
                    </span>
                    <p className="text-slate-700 leading-snug font-medium">
                      {order.clinicalSpecifications || 'No special clinical instructions noted.'}
                    </p>
                  </div>
                </div>

                {/* EXPANDABLE SECTION: NOTES THREAD & ATTACHMENTS */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-4">
                    {/* Attachments Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lab Attachments & Digital Scans ({order.attachments?.length || 0})</span>
                        </span>
                      </div>

                      {order.attachments && order.attachments.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {order.attachments.map((att, attIdx) => (
                            <div
                              key={att.id || attIdx}
                              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="font-semibold text-slate-800 truncate">{att.name}</span>
                              </div>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-lg"
                              >
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No files or shade photos attached to this order.</p>
                      )}
                    </div>

                    {/* Timestamped Audit Notes & Communications */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Clinical & Lab Communication Notes</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setActiveNoteOrderId(activeNoteOrderId === order.id ? null : order.id)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Remark</span>
                        </button>
                      </div>

                      {/* Add Note Input */}
                      {activeNoteOrderId === order.id && (
                        <div className="mb-3 flex items-center space-x-2">
                          <input
                            type="text"
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            placeholder="Add remark (e.g. Received shade photo, margin checked on die, patient scheduled)..."
                            className="flex-1 text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddNote(order.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center space-x-1 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </button>
                        </div>
                      )}

                      {/* Notes list */}
                      <div className="space-y-2">
                        {order.notes && order.notes.length > 0 ? (
                          order.notes.map((note) => (
                            <div
                              key={note.id}
                              className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs shadow-xs"
                            >
                              <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                                <span className="font-bold text-slate-600">{note.author}</span>
                                <span>{new Date(note.timestamp).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-800 font-medium leading-relaxed">{note.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW DENTAL LAB ORDER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-200" />
                  <span>Create Custom Dental Order</span>
                </h3>
                <p className="text-xs text-blue-200">
                  Directly linked to Patient ID: <span className="font-bold text-white">{currentActivePatient?.id || 'Select Patient'}</span> ({currentActivePatient?.name || 'Search to select'})
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-blue-200 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* 1. LINKED PATIENT SELECTION & SEARCH BAR */}
              <div className="bg-gradient-to-br from-blue-50/95 to-indigo-50/80 border border-blue-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-300">
                          Linked Patient: {currentActivePatient?.id || 'None'}
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {currentActivePatient?.name || 'No Patient Linked'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {currentActivePatient ? (
                          <>
                            <span>{currentActivePatient.gender}, {currentActivePatient.age} yrs</span>
                            <span className="mx-1.5 text-slate-400">•</span>
                            <span className="font-mono text-blue-700 font-semibold">{currentActivePatient.phone}</span>
                            {currentActivePatient.bloodGroup && (
                              <>
                                <span className="mx-1.5 text-slate-400">•</span>
                                <span className="text-rose-600 font-bold">Blood: {currentActivePatient.bloodGroup}</span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-rose-600 font-semibold">Please search and select a patient to link with this dental order</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Button to Search and Link Patient */}
                  <button
                    type="button"
                    onClick={() => setPatientSearchOpen(prev => !prev)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 hover:border-blue-400 font-bold text-xs rounded-xl shadow-xs transition self-start sm:self-auto"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    <span>{patientSearchOpen ? 'Close Search' : 'Change / Search Patient'}</span>
                  </button>
                </div>

                {/* Searchable Patient Selection Drawer */}
                {patientSearchOpen && (
                  <div className="pt-2.5 border-t border-blue-200/80 space-y-2 animate-fadeIn">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                        placeholder="Search patient by name, phone number, or Patient ID (e.g. Pradeep, 98012, PT-0636)..."
                        className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder-slate-400"
                        autoFocus
                      />
                      {patientSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setPatientSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Patient Search Results */}
                    <div className="max-h-48 overflow-y-auto space-y-1 bg-white rounded-xl border border-blue-200 p-1.5 shadow-xs">
                      {filteredSearchPatients.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">
                          No patients found matching "{patientSearchTerm}".
                        </div>
                      ) : (
                        filteredSearchPatients.map(p => {
                          const isSelected = p.id === currentActivePatient?.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedOrderPatient(p);
                                setPatientSearchOpen(false);
                                setPatientSearchTerm('');
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                                isSelected
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] border border-blue-200">
                                  {p.id}
                                </span>
                                <span className="font-bold">{p.name}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500 text-[11px]">{p.gender}, {p.age}y</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-mono text-slate-600 text-[11px]">{p.phone}</span>
                              </div>
                              <button
                                type="button"
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                                }`}
                              >
                                {isSelected ? '✓ Linked' : 'Select Patient'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Order Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Order Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.orderType}
                    onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ORDER_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Tooth or Implant Details */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tooth or Implant Details <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.toothOrImplantDetails}
                    onChange={(e) => setFormData({ ...formData, toothOrImplantDetails: e.target.value })}
                    placeholder="e.g. Tooth #16 or Tooth #46 Implant Abutment"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Quick tooth chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['#11', '#21', '#16', '#26', '#36', '#46', 'Upper Arch', 'Lower Arch'].map(chip => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setFormData({ ...formData, toothOrImplantDetails: `Tooth ${chip}` })}
                        className="text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 px-1.5 py-0.5 rounded font-mono"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clinical Specifications & Shade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">VITA Shade</label>
                  <select
                    value={formData.shade}
                    onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SHADE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Margin Prep</label>
                  <select
                    value={formData.marginType}
                    onChange={(e) => setFormData({ ...formData, marginType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Deep Chamfer 360°">Deep Chamfer 360°</option>
                    <option value="Shoulder (Radial)">Shoulder (Radial)</option>
                    <option value="Knife-Edge / Feather">Knife-Edge / Feather</option>
                    <option value="Supragingival 0.5mm">Supragingival 0.5mm</option>
                    <option value="Equigingival Margin">Equigingival Margin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clearance</label>
                  <select
                    value={formData.occlusalClearance}
                    onChange={(e) => setFormData({ ...formData, occlusalClearance: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1.5mm standard">1.5mm standard</option>
                    <option value="2.0mm anatomic">2.0mm anatomic</option>
                    <option value="1.0mm conservative">1.0mm conservative</option>
                    <option value="Heavy clearance / bruxism">Heavy clearance / bruxism</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Clinical Specifications & Lab Instructions
                </label>
                <textarea
                  rows={2}
                  value={formData.clinicalSpecifications}
                  onChange={(e) => setFormData({ ...formData, clinicalSpecifications: e.target.value })}
                  placeholder="Shade, margin details, emergence profile, centric contacts, foil relief, etc."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Material Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Materials <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.materials}
                  onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MATERIAL_OPTIONS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Assigned Lab & Expected Completion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Assigned Laboratory / Staff <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.assignedStaffOrLab}
                    onChange={(e) => setFormData({ ...formData, assignedStaffOrLab: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LAB_OPTIONS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Expected Completion (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.expectedCompletionDays}
                    onChange={(e) => setFormData({ ...formData, expectedCompletionDays: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Financials & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost (₹ / NPR)</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      let newPaid = formData.paidAmount;
                      if (newStatus === 'Paid') {
                        newPaid = Number(formData.cost) || 0;
                      } else if (newStatus === 'Unpaid') {
                        newPaid = 0;
                      } else if (newStatus === 'Partial' && (!newPaid || Number(newPaid) === 0)) {
                        newPaid = Math.round((Number(formData.cost) || 0) / 2);
                      }
                      setFormData({
                        ...formData,
                        paymentStatus: newStatus,
                        paidAmount: newPaid
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Unpaid">Unpaid (Full Balance Due)</option>
                    <option value="Partial">Partial (Enter Amount Paid)</option>
                    <option value="Paid">Paid in Full</option>
                  </select>
                </div>
              </div>

              {/* If Partial Payment Selected in Create Modal */}
              {formData.paymentStatus === 'Partial' && (
                <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-3.5 shadow-2xs animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span>Partial Payment Breakdown & Subtraction</span>
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300">
                      Live Subtraction
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Amount Paid (₹ / NPR) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        max={Number(formData.cost) || 0}
                        value={formData.paidAmount}
                        onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                        placeholder="Enter paid advance amount"
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                      <select
                        value={formData.paymentMethod || 'Cash'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold shadow-2xs"
                      >
                        <option value="Cash">Cash Counter</option>
                        <option value="FonePay / QR">FonePay / QR Scan</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {/* Real-time Subtraction Calculation Box */}
                  <div className="bg-white rounded-xl p-3 border border-amber-200 divide-y divide-slate-100 text-xs shadow-2xs">
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="text-slate-600 font-semibold">Final Total Payment Amount:</span>
                      <span className="font-mono font-bold text-slate-900">
                        NPR {Number(formData.cost || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 text-emerald-700 font-semibold">
                      <span>Less Amount Paid:</span>
                      <span className="font-mono font-bold">
                        - NPR {Number(formData.paidAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-black text-rose-700 text-xs uppercase tracking-wide">
                        Remaining Payment Due:
                      </span>
                      <span className="font-mono font-black text-base text-rose-700">
                        NPR {Math.max(0, (Number(formData.cost) || 0) - (Number(formData.paidAmount) || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200/60">
                    <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      Payment linked to Patient ID: <b>{currentActivePatient?.id}</b> ({currentActivePatient?.name}) • Amount paid updates Clinic Revenue, and due balance is linked to Finance Outstanding.
                    </span>
                  </div>
                </div>
              )}

              {formData.paymentStatus === 'Paid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Full Payment Collected</span>
                    </span>
                    <span className="font-mono font-black">
                      NPR {Number(formData.cost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 text-[11px]">
                    <span>Remaining Balance Due:</span>
                    <span className="font-bold font-mono">NPR 0 (Fully Settled)</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-emerald-900 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <span>
                      Payment linked to Patient ID: <b>{currentActivePatient?.id}</b> ({currentActivePatient?.name}) • 100% recognized in Clinic Revenue.
                    </span>
                  </div>
                </div>
              )}

              {/* Initial Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Clinical / Lab Note</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Impression dispatched via courier. Urgently needed for wedding event."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{loading ? 'Creating...' : 'Create Lab Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ORDER MODAL */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black tracking-tight">Edit Order [{editOrder.id}]</h3>
                <p className="text-xs text-slate-400">Update materials, laboratory, cost, or clinical specifications</p>
              </div>
              <button onClick={() => setEditOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrder} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tooth / Implant Details</label>
                <input
                  type="text"
                  value={editOrder.toothOrImplantDetails}
                  onChange={(e) => setEditOrder({ ...editOrder, toothOrImplantDetails: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Specifications</label>
                <textarea
                  rows={3}
                  value={editOrder.clinicalSpecifications}
                  onChange={(e) => setEditOrder({ ...editOrder, clinicalSpecifications: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Materials</label>
                <input
                  type="text"
                  value={editOrder.materials}
                  onChange={(e) => setEditOrder({ ...editOrder, materials: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Lab / Staff</label>
                  <input
                    type="text"
                    value={editOrder.assignedStaffOrLab}
                    onChange={(e) => setEditOrder({ ...editOrder, assignedStaffOrLab: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={editOrder.cost}
                    onChange={(e) => setEditOrder({ ...editOrder, cost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={editOrder.paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      let newPaid = editOrder.paidAmount;
                      if (newStatus === 'Paid') {
                        newPaid = Number(editOrder.cost) || 0;
                      } else if (newStatus === 'Unpaid') {
                        newPaid = 0;
                      } else if (newStatus === 'Partial' && (!newPaid || Number(newPaid) === 0)) {
                        newPaid = Math.round((Number(editOrder.cost) || 0) / 2);
                      }
                      setEditOrder({
                        ...editOrder,
                        paymentStatus: newStatus,
                        paidAmount: newPaid
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Unpaid">Unpaid (Full Due)</option>
                    <option value="Partial">Partial (Enter Amount Paid)</option>
                    <option value="Paid">Paid in Full</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Progress Status</label>
                  <select
                    value={editOrder.progressStatus}
                    onChange={(e) => setEditOrder({ ...editOrder, progressStatus: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Requested">Requested</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready">Ready</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* If Partial Payment Selected in Edit Modal */}
              {editOrder.paymentStatus === 'Partial' && (
                <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-3.5 shadow-2xs animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                      <span>Partial Payment Breakdown & Subtraction</span>
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300">
                      Live Subtraction
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Amount Paid (₹ / NPR) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        max={Number(editOrder.cost) || 0}
                        value={editOrder.paidAmount !== undefined ? editOrder.paidAmount : ''}
                        onChange={(e) => setEditOrder({ ...editOrder, paidAmount: e.target.value })}
                        placeholder="Enter paid advance amount"
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                      <select
                        value={editOrder.paymentMethod || 'Cash'}
                        onChange={(e) => setEditOrder({ ...editOrder, paymentMethod: e.target.value })}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold shadow-2xs"
                      >
                        <option value="Cash">Cash Counter</option>
                        <option value="FonePay / QR">FonePay / QR Scan</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {/* Subtraction Calculation Box */}
                  <div className="bg-white rounded-xl p-3 border border-amber-200 divide-y divide-slate-100 text-xs shadow-2xs">
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="text-slate-600 font-semibold">Final Total Payment Amount:</span>
                      <span className="font-mono font-bold text-slate-900">
                        NPR {Number(editOrder.cost || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 text-emerald-700 font-semibold">
                      <span>Less Amount Paid:</span>
                      <span className="font-mono font-bold">
                        - NPR {Number(editOrder.paidAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-black text-rose-700 text-xs uppercase tracking-wide">
                        Remaining Payment Due:
                      </span>
                      <span className="font-mono font-black text-base text-rose-700">
                        NPR {Math.max(0, (Number(editOrder.cost) || 0) - (Number(editOrder.paidAmount) || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-[11px] text-amber-900 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200/60">
                    <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                      Payment linked to Patient ID: <b>{editOrder.patientId || currentActivePatient?.id}</b> ({editOrder.patientName || currentActivePatient?.name}) • Amount paid updates Clinic Revenue, and due balance is linked to Finance Outstanding.
                    </span>
                  </div>
                </div>
              )}

              {editOrder.paymentStatus === 'Paid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Full Payment Recognized</span>
                    </span>
                    <span className="font-mono font-black">
                      NPR {Number(editOrder.cost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 text-[11px]">
                    <span>Remaining Balance Due:</span>
                    <span className="font-bold font-mono">NPR 0 (Fully Settled)</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-emerald-900 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <span>
                      Payment linked to Patient ID: <b>{editOrder.patientId || currentActivePatient?.id}</b> ({editOrder.patientName || currentActivePatient?.name}) • 100% credited to Clinic Revenue.
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditOrder(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE DENTAL LAB PRESCRIPTION SLIP */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs uppercase tracking-wider">
                  Dental Laboratory Prescription Slip
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setPrintOrder(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Content */}
            <div className="flex-1 overflow-y-auto p-6 text-slate-800 space-y-4 font-sans bg-white print:p-0">
              {/* Slip Header */}
              <div className="text-center pb-3 border-b-2 border-slate-900">
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {clinicProfile.name || 'Nepal Dental and Healthcare Wellness Centre'}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {clinicProfile.address || 'Kathmandu, Nepal'} • Phone: {clinicProfile.phone || '+977 98419 87654'}
                </p>
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mt-1">
                  OFFICIAL DENTAL LABORATORY WORK ORDER & PRESCRIPTION
                </p>
              </div>

              {/* Order Meta Bar */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p><span className="text-slate-500 font-semibold">Order ID:</span> <strong className="font-mono text-blue-800">{printOrder.id}</strong></p>
                  <p><span className="text-slate-500 font-semibold">Date Dispatched:</span> <strong>{new Date(printOrder.orderDate).toLocaleDateString()}</strong></p>
                  <p><span className="text-slate-500 font-semibold">Required By:</span> <strong className="text-rose-700">{new Date(printOrder.expectedCompletionDate).toLocaleDateString()}</strong></p>
                </div>
                <div>
                  <p><span className="text-slate-500 font-semibold">Patient Name:</span> <strong>{printOrder.patientName || patient?.name || currentActivePatient?.name}</strong></p>
                  <p><span className="text-slate-500 font-semibold">Patient ID:</span> <strong className="font-mono">{printOrder.patientId || patient?.id || currentActivePatient?.id}</strong> ({printOrder.patientGender || patient?.gender || currentActivePatient?.gender || 'N/A'}, {printOrder.patientAge || patient?.age || currentActivePatient?.age || ''} yrs)</p>
                  <p><span className="text-slate-500 font-semibold">Assigned Lab:</span> <strong>{printOrder.assignedStaffOrLab}</strong></p>
                </div>
              </div>

              {/* Order Specs */}
              <div className="space-y-3 text-xs border border-slate-200 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Order Type</span>
                    <strong className="text-sm text-slate-900">{printOrder.orderType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Tooth / Site Reference</span>
                    <strong className="text-sm text-blue-700">{printOrder.toothOrImplantDetails}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Material Specifications</span>
                  <p className="font-semibold text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {printOrder.materials}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Clinical Specifications & Shade</span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                    {printOrder.clinicalSpecifications}
                  </p>
                </div>
              </div>

              {/* Financial & Payment Status Breakdown */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Cost</span>
                  <span className="font-mono font-bold text-slate-900">
                    NPR {Number(printOrder.cost || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Amount Paid ({printOrder.paymentStatus})</span>
                  <span className="font-mono font-bold text-emerald-700">
                    NPR {Number(printOrder.paidAmount || (printOrder.paymentStatus === 'Paid' ? printOrder.cost : 0)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Remaining Due</span>
                  <span className="font-mono font-black text-rose-700">
                    NPR {Number(printOrder.balanceDue !== undefined ? printOrder.balanceDue : (printOrder.paymentStatus === 'Paid' ? 0 : printOrder.cost || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Lab Technician & Doctor Sign-off */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-800">{clinicProfile.doctorInCharge || 'Dr. Mukesh Kushwaha'}</p>
                  <p className="text-[10px] text-slate-500">Prescribing Dental Surgeon (NMC Reg: Verified)</p>
                </div>
                <div className="border-t border-slate-400 pt-2">
                  <p className="font-bold text-slate-800">Master Dental Technician</p>
                  <p className="text-[10px] text-slate-500">QC Inspection & Final Dispatch Seal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
