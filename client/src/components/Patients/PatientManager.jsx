import React, { useState, useEffect } from 'react';
import { assessTicketValidity } from '../../utils/ticketValidity';
import { getRegistrationTime, formatRecordDate } from '../../utils/timeFormat';
import {
  UserPlus,
  Search,
  Phone,
  AlertTriangle,
  HeartPulse,
  ChevronRight,
  MapPin,
  Edit2,
  Sparkles,
  Check,
  Plus,
  MessageSquare,
  Link2,
  Package,
  RotateCw,
  Ticket,
  Eye,
  List,
  LayoutGrid,
  Calendar,
  Receipt,
  Activity,
  ShieldCheck,
  CreditCard,
  Clock,
  Filter,
  DollarSign
} from 'lucide-react';
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  NEPAL_MUNICIPALITIES,
  NEPAL_WARDS
} from '../../data/nepalLocationData';
import PatientOrders from './PatientOrders';
import PatientViewModal from './PatientViewModal';

/**
 * Generates a Unique Patient ID using letters from the patient's name and numbers.
 * E.g. "Rupendra Sah" -> "RS-1006"
 * E.g. "Sunita Thapa" -> "ST-1007"
 * E.g. "Binod Kumar Chaudhary" -> "BKC-1008"
 */
export function generatePatientId(name = '', existingPatients = [], randomize = false) {
  const existingIds = new Set((existingPatients || []).map(p => (p.id || '').toUpperCase()));
  const words = (name || '').trim().replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  let prefix = '';
  if (words.length >= 2) {
    prefix = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
  } else if (words.length === 1) {
    prefix = words[0].slice(0, Math.min(3, Math.max(2, words[0].length))).toUpperCase();
  } else {
    prefix = 'PT';
  }

  let num;
  if (randomize) {
    num = Math.floor(1000 + Math.random() * 9000);
  } else {
    num = (existingPatients.length || 0) + 1001;
  }

  let candidate = `${prefix}-${num}`;
  while (existingIds.has(candidate)) {
    num++;
    candidate = `${prefix}-${num}`;
  }
  return candidate;
}

export default function PatientManager({
  patients = [],
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onUpdatePatient,
  onDeletePatient,
  onOpenWhatsApp,
  clinicProfile = {},
  authToken,
  currentUser,
  activeTenant,
  appointments = [],
  onNavigateTab
}) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'allergies' | 'medical' | 'due' | 'orders' | 'valid_ticket'
  const [viewingPatient, setViewingPatient] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ordersModalPatient, setOrdersModalPatient] = useState(null);
  const [editingPatientId, setEditingPatientId] = useState(null);

  const initialFormState = {
    id: '',
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'B+',
    emergencyContact: '',
    allergies: '',
    medicalHistory: '',
    province: '',
    district: '',
    municipality: '',
    ward: '',
    tole: '',
    autoBillTicket: true,
    ticketPaymentMethod: 'Fonepay QR'
  };

  const [formData, setFormData] = useState(initialFormState);

  // Suggestion Bank for Allergies & Medical History (Remembers for next patients)
  const [suggestionBank, setSuggestionBank] = useState({
    allergies: [
      "Penicillin",
      "Amoxicillin",
      "Sulfa Drugs",
      "NSAIDs / Ibuprofen",
      "Aspirin",
      "Latex",
      "Local Anesthesia (Lignocaine)",
      "Erythromycin",
      "Metronidazole",
      "Codeine"
    ],
    medicalHistory: [
      "Hypertension (High BP)",
      "Type 2 Diabetes",
      "Asthma / Respiratory Issues",
      "Cardiac Condition / Pacemaker",
      "Bleeding Tendency / On Blood Thinners",
      "Thyroid Disorder",
      "Pregnancy / Lactating",
      "Hepatitis B / C",
      "Gastric Acidity / Ulcer",
      "Kidney / Renal Disease",
      "Epilepsy / Seizures"
    ]
  });

  // Load suggestions from API on mount
  useEffect(() => {
    fetch('/api/suggestions')
      .then(r => r.json())
      .then(data => {
        if (data && data.allergies && data.medicalHistory) {
          setSuggestionBank(data);
        }
      })
      .catch(err => console.error('Error fetching suggestions:', err));
  }, []);

  // Helper to check if allergy is in current form input
  const isAllergySelected = (item) => {
    const list = formData.allergies ? formData.allergies.split(',').map(s => s.trim().toLowerCase()) : [];
    return list.includes(item.toLowerCase());
  };

  // 1-Click Toggle for Allergy chip
  const handleToggleAllergy = (item) => {
    const current = formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [];
    const exists = current.some(s => s.toLowerCase() === item.toLowerCase());
    let updated;
    if (exists) {
      updated = current.filter(s => s.toLowerCase() !== item.toLowerCase());
    } else {
      updated = [...current, item];
    }
    setFormData(prev => ({ ...prev, allergies: updated.join(', ') }));
  };

  // Helper to check if medical condition is in current form input
  const isMedicalSelected = (item) => {
    const list = formData.medicalHistory ? formData.medicalHistory.split(',').map(s => s.trim().toLowerCase()) : [];
    return list.includes(item.toLowerCase());
  };

  // 1-Click Toggle for Medical Condition chip
  const handleToggleMedical = (item) => {
    const current = formData.medicalHistory ? formData.medicalHistory.split(',').map(s => s.trim()).filter(Boolean) : [];
    const exists = current.some(s => s.toLowerCase() === item.toLowerCase());
    let updated;
    if (exists) {
      updated = current.filter(s => s.toLowerCase() !== item.toLowerCase());
    } else {
      updated = [...current, item];
    }
    setFormData(prev => ({ ...prev, medicalHistory: updated.join(', ') }));
  };

  // Available districts based on selected province
  const availableDistricts = formData.province
    ? (NEPAL_DISTRICTS[formData.province] || [])
    : [];

  // Available municipalities based on selected district
  const availableMunicipalities = formData.district
    ? (NEPAL_MUNICIPALITIES[formData.district] || [])
    : [];

  const countAllergies = patients.filter(p => p.allergies && (Array.isArray(p.allergies) ? p.allergies.length > 0 : String(p.allergies).trim().length > 0)).length;
  const countMedical = patients.filter(p => p.medicalHistory && (Array.isArray(p.medicalHistory) ? p.medicalHistory.length > 0 : String(p.medicalHistory).trim().length > 0)).length;
  const countDue = patients.filter(p => (p.invoices || []).reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0) > 0).length;
  const countOrders = patients.filter(p => p.orders && p.orders.length > 0).length;

  const filtered = patients.filter(p => {
    const s = search.toLowerCase();
    const matchesSearch =
      !s ||
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.phone && p.phone.includes(search)) ||
      (p.id && p.id.toLowerCase().includes(s)) ||
      (p.address && p.address.toLowerCase().includes(s));
    if (!matchesSearch) return false;

    if (filterType === 'allergies') {
      return p.allergies && (Array.isArray(p.allergies) ? p.allergies.length > 0 : String(p.allergies).trim().length > 0);
    }
    if (filterType === 'medical') {
      return p.medicalHistory && (Array.isArray(p.medicalHistory) ? p.medicalHistory.length > 0 : String(p.medicalHistory).trim().length > 0);
    }
    if (filterType === 'due') {
      const balance = (p.invoices || []).reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
      return balance > 0;
    }
    if (filterType === 'orders') {
      return p.orders && p.orders.length > 0;
    }
    if (filterType === 'valid_ticket') {
      const ticketInfo = assessTicketValidity(p, clinicProfile);
      return ticketInfo?.status === 'VALID_REVISIT';
    }
    return true;
  });

  const handleOpenNewModal = () => {
    setEditingPatientId(null);
    const newId = generatePatientId('', patients);
    setFormData({
      ...initialFormState,
      id: newId
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (patient, e) => {
    e.stopPropagation();
    setEditingPatientId(patient.id);
    setFormData({
      id: patient.id || '',
      name: patient.name || '',
      phone: patient.phone || '',
      age: patient.age ? String(patient.age) : '',
      gender: patient.gender || 'Male',
      bloodGroup: patient.bloodGroup || 'B+',
      emergencyContact: patient.emergencyContact || '',
      allergies: Array.isArray(patient.allergies) ? patient.allergies.join(', ') : (patient.allergies || ''),
      medicalHistory: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : (patient.medicalHistory || ''),
      province: patient.province || '',
      district: patient.district || '',
      municipality: patient.municipality || '',
      ward: patient.ward || '',
      tole: patient.tole || '',
      autoBillTicket: false
    });
    setModalOpen(true);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => {
      const updatedId = !editingPatientId ? generatePatientId(newName, patients) : prev.id;
      return {
        ...prev,
        name: newName,
        id: updatedId
      };
    });
  };

  const handleRegenerateId = () => {
    const refreshedId = generatePatientId(formData.name, patients, true);
    setFormData(prev => ({
      ...prev,
      id: refreshedId
    }));
  };

  const handleProvinceChange = (e) => {
    const prov = e.target.value;
    setFormData(prev => ({
      ...prev,
      province: prov,
      district: '',
      municipality: '',
      ward: '',
      tole: ''
    }));
  };

  const handleDistrictChange = (e) => {
    const dist = e.target.value;
    setFormData(prev => ({
      ...prev,
      district: dist,
      municipality: '',
      ward: '',
      tole: ''
    }));
  };

  const handleMunicipalityChange = (e) => {
    const mun = e.target.value;
    setFormData(prev => ({
      ...prev,
      municipality: mun,
      ward: '',
      tole: ''
    }));
  };

  const handleWardChange = (e) => {
    const w = e.target.value;
    setFormData(prev => ({
      ...prev,
      ward: w,
      tole: ''
    }));
  };

  const handleToleChange = (e) => {
    const t = e.target.value;
    setFormData(prev => ({
      ...prev,
      tole: t
    }));
  };

  // Helper to normalize phone numbers (extract last 10 digits for standard Nepal mobile matching)
  const normalizePhone = (p) => {
    if (!p) return '';
    const digits = String(p).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  // Helper to normalize names (case-insensitive & whitespace trimmed)
  const normalizeName = (n) => {
    if (!n) return '';
    return String(n).toLowerCase().replace(/\s+/g, ' ').trim();
  };

  // Duplicate Check: BOTH mobile number and name must match an existing patient in the clinic
  const existingDuplicate = (() => {
    const normName = normalizeName(formData.name);
    const normPhone = normalizePhone(formData.phone);
    if (!normName || !normPhone) return null;

    return patients.find(p => {
      if (editingPatientId && p.id === editingPatientId) return false;
      const pName = normalizeName(p.name);
      const pPhone = normalizePhone(p.phone);
      return pName === normName && pPhone === normPhone;
    });
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (existingDuplicate) {
      alert(`[Duplicate Patient Blocked]\nA patient with the exact same name "${existingDuplicate.name}" and mobile number "${existingDuplicate.phone}" already exists in this clinic (${existingDuplicate.id}).\n\nYou cannot save duplicate patient records.`);
      return;
    }

    const allergiesArr = formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [];
    const medHistoryArr = formData.medicalHistory ? formData.medicalHistory.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Assemble Nepal Address
    const addressParts = [];
    if (formData.tole && formData.tole.trim()) {
      addressParts.push(formData.tole.trim());
    }
    if (formData.ward) {
      addressParts.push(formData.ward);
    }
    if (formData.municipality) {
      addressParts.push(formData.municipality);
    }
    if (formData.district) {
      addressParts.push(formData.district);
    }
    if (formData.province) {
      addressParts.push(formData.province);
    }

    const formattedAddress = addressParts.join(', ');

    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const payload = {
      id: (formData.id && formData.id.trim()) ? formData.id.trim().toUpperCase() : generatePatientId(formData.name, patients),
      name: formData.name,
      phone: formData.phone,
      age: parseInt(formData.age) || 30,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      emergencyContact: formData.emergencyContact,
      allergies: allergiesArr,
      medicalHistory: medHistoryArr,
      address: formattedAddress,
      province: formData.province,
      district: formData.district,
      municipality: formData.municipality,
      ward: formData.ward,
      tole: formData.tole,
      createdAt: editingPatientId ? undefined : now.toISOString(),
      registrationDate: editingPatientId ? undefined : currentDateStr,
      registrationTime: editingPatientId ? undefined : currentTimeStr,
      autoBillTicket: !editingPatientId ? (formData.autoBillTicket !== false) : false,
      ticketPaymentMethod: formData.ticketPaymentMethod || 'Fonepay QR'
    };

    if (editingPatientId && onUpdatePatient) {
      onUpdatePatient(editingPatientId, payload);
    } else {
      onAddPatient(payload);
    }

    // Automatically remember and save any newly entered allergies & medical conditions for future patients
    if (allergiesArr.length > 0 || medHistoryArr.length > 0) {
      fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allergies: allergiesArr,
          medicalHistory: medHistoryArr
        })
      })
      .then(r => r.json())
      .then(newBank => {
        if (newBank && newBank.allergies && newBank.medicalHistory) {
          setSuggestionBank(newBank);
        }
      })
      .catch(() => {});
    }

    setModalOpen(false);
    setFormData(initialFormState);
    setEditingPatientId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Patients EHR & Records</span>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
              {patients.length} Registered Patients
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete digital electronic health records, Nepal administrative addresses, medical alerts, and charting histories.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar, Filters & View Toggle */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient by name, phone (e.g. 9801197710), or Patient ID (e.g. AS-1012)..."
                className="w-full text-xs pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition flex-shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>

          {/* View Mode Toggle: List View (Default) vs Grid View */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table / List View with action buttons"
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs select-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center mr-1">
            <Filter className="w-3 h-3 mr-1" /> Filter:
          </span>

          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Patients</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {patients.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('allergies')}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
              filterType === 'allergies'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>With Allergies</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'allergies' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-800'}`}>
              {countAllergies}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('medical')}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
              filterType === 'medical'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <HeartPulse className="w-3 h-3" />
            <span>Medical History</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'medical' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'}`}>
              {countMedical}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('due')}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
              filterType === 'due'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3 h-3" />
            <span>Balance Due</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'due' ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {countDue}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('orders')}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
              filterType === 'orders'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>Lab Orders</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === 'orders' ? 'bg-indigo-700 text-white' : 'bg-indigo-200 text-indigo-800'}`}>
              {countOrders}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('valid_ticket')}
            className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
              filterType === 'valid_ticket'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Valid Revisit</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. LIST VIEW (STRUCTURED HIGH-DENSITY TABLE WITH ACTION BUTTONS) */}
      {/* ========================================================================= */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <UserPlus className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-600">No patients match the active search/filter criteria</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the filter or registering a new patient record.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-3 px-4">Patient ID</th>
                    <th className="py-3 px-4">Name & Demographics</th>
                    <th className="py-3 px-4">Contact & Address</th>
                    <th className="py-3 px-4">Medical Alerts</th>
                    <th className="py-3 px-4">EHR Summary</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    const ticketInfo = assessTicketValidity(patient, clinicProfile);
                    const hasAllergies = patient.allergies && (Array.isArray(patient.allergies) ? patient.allergies.length > 0 : String(patient.allergies).trim().length > 0);
                    const hasMedical = patient.medicalHistory && (Array.isArray(patient.medicalHistory) ? patient.medicalHistory.length > 0 : String(patient.medicalHistory).trim().length > 0);

                    const aptCount = appointments.filter(
                      (a) => a.patientId === patient.id || (a.patientPhone && a.patientPhone === patient.phone)
                    ).length;
                    const orderCount = (patient.orders || []).length;
                    const invoices = patient.invoices || [];
                    const balance = invoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
                    const advanceCredit = Number(patient.advanceCreditBalance) || 0;

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => {
                          if (onSelectPatient) onSelectPatient(patient);
                          setViewingPatient(patient);
                        }}
                        className={`hover:bg-blue-50/50 transition cursor-pointer ${
                          isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        {/* Patient ID & Ticket Validity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-black bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg shadow-2xs">
                              {patient.id}
                            </span>
                          </div>
                          {ticketInfo?.enabled && (
                            <div className="mt-1">
                              <span
                                className={`text-[9px] font-bold px-2 py-0.2 rounded-full border shadow-2xs ${
                                  ticketInfo.status === 'VALID_REVISIT'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : ticketInfo.status === 'EXPIRED'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-blue-100 text-blue-800 border-blue-300'
                                }`}
                                title={ticketInfo.message}
                              >
                                {ticketInfo.badgeText}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Name & Demographics */}
                        <td className="py-3.5 px-4">
                          <div
                            className="cursor-pointer group"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectPatient) onSelectPatient(patient);
                              setViewingPatient(patient);
                            }}
                          >
                            <div className="min-w-0">
                              <span className="font-black text-slate-900 text-xs block leading-tight group-hover:text-blue-600 transition truncate max-w-[170px] sm:max-w-xs">
                                {patient.name}
                              </span>
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                                <span>{patient.gender || 'Patient'}</span>
                                <span>•</span>
                                <span>{patient.age ? `${patient.age} yrs` : 'Age N/A'}</span>
                                <span>•</span>
                                <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1 rounded">
                                  {patient.bloodGroup || 'Blood N/A'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-1">
                                <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span>Reg: {formatRecordDate(patient.createdAt || patient.registrationDate)}</span>
                                <span className="text-slate-300">•</span>
                                <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="font-mono text-blue-600 font-semibold">{getRegistrationTime(patient)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact & Nepal Administrative Address */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-mono font-bold text-emerald-700 text-xs">{patient.phone}</span>
                            {patient.phone && onOpenWhatsApp && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenWhatsApp(
                                    patient.phone,
                                    `Namaste ${patient.name},\nGreetings from ${clinicProfile.name || 'our dental clinic'}. How may we assist with your dental care today?`
                                  );
                                }}
                                className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition flex items-center shadow-2xs"
                                title="Open instant WhatsApp chat"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                              </button>
                            )}
                          </div>
                          {patient.address && (
                            <div className="flex items-start space-x-1 text-[11px] text-slate-500 mt-1 truncate max-w-[200px] sm:max-w-xs" title={patient.address}>
                              <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0 mt-0.5" />
                              <span className="truncate">{patient.address}</span>
                            </div>
                          )}
                        </td>

                        {/* Medical Alerts */}
                        <td className="py-3.5 px-4 max-w-[180px]">
                          <div className="flex flex-col gap-1">
                            {hasAllergies ? (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 flex items-center space-x-1 w-max shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                                <span className="truncate max-w-[130px]">
                                  {Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}
                                </span>
                              </span>
                            ) : null}

                            {hasMedical ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center space-x-1 w-max shadow-2xs">
                                <HeartPulse className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                <span className="truncate max-w-[130px]">
                                  {Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : patient.medicalHistory}
                                </span>
                              </span>
                            ) : null}

                            {!hasAllergies && !hasMedical && (
                              <span className="text-[11px] text-slate-400 italic">No medical alerts</span>
                            )}
                          </div>
                        </td>

                        {/* EHR Summary */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <span
                              className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg border border-blue-200"
                              title="Total Appointments"
                            >
                              📅 {aptCount} Apts
                            </span>
                            <span
                              className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-lg border border-indigo-200"
                              title="Dental Lab Orders"
                            >
                              📦 {orderCount} Orders
                            </span>
                          </div>
                          <div className="text-[11px] font-bold mt-1">
                            {balance > 0 ? (
                              <span className="text-rose-600 font-mono">
                                Due: {clinicProfile?.currency || 'Rs.'} {balance.toLocaleString()}
                              </span>
                            ) : advanceCredit > 0 ? (
                              <span className="text-emerald-600 font-mono">
                                Credit: +{clinicProfile?.currency || 'Rs.'} {advanceCredit.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400">Balance: 0</span>
                            )}
                          </div>
                        </td>

                        {/* Actions Column: View, Edit, Chart, Orders */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* ACTION BUTTON: VIEW */}
                            <button
                              type="button"
                              onClick={() => setViewingPatient(patient)}
                              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                              title="View Complete Patient EHR Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {/* ACTION BUTTON: EDIT */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(patient, e)}
                              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition"
                              title="Edit Patient Demographics"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Edit</span>
                            </button>

                            {/* ACTION BUTTON: CHART */}
                            {onNavigateTab && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectPatient) onSelectPatient(patient);
                                  onNavigateTab('chart', patient);
                                }}
                                className="p-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-700 border border-slate-200 transition"
                                title="Open Dental Odontogram Chart"
                              >
                                <Activity className="w-4 h-4 text-blue-600" />
                              </button>
                            )}

                            {/* ACTION BUTTON: ORDERS */}
                            <button
                              type="button"
                              onClick={() => setOrdersModalPatient(patient)}
                              className="p-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-700 border border-slate-200 transition relative"
                              title={`View Dental Lab Orders (${orderCount})`}
                            >
                              <Package className="w-4 h-4 text-indigo-600" />
                              {orderCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                                  {orderCount}
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. GRID VIEW (CARDS WITH EXPLICIT VIEW & EDIT ACTION BUTTONS) */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((patient) => {
            const isSelected = selectedPatient?.id === patient.id;
            const hasAllergies = patient.allergies && patient.allergies.length > 0;
            const hasMedical = patient.medicalHistory && patient.medicalHistory.length > 0;

            return (
              <div
                key={patient.id}
                onClick={() => {
                  if (onSelectPatient) onSelectPatient(patient);
                  setViewingPatient(patient);
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-400/50'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  {/* Top Row with ID & Ticket Validity Badge */}
                  {(() => {
                    const ticketInfo = assessTicketValidity(patient, clinicProfile);
                    return (
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {patient.id}
                          </span>
                          {ticketInfo?.enabled && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              ticketInfo.status === 'VALID_REVISIT'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : ticketInfo.status === 'EXPIRED'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`} title={ticketInfo.message}>
                              {ticketInfo.badgeText}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-slate-500">
                            {patient.gender}, {patient.age} yrs
                          </span>
                          <button
                            onClick={(e) => handleOpenEditModal(patient, e)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Patient Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Name */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{patient.name}</h3>

                  {/* Registration Date & Time */}
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>Reg: {formatRecordDate(patient.createdAt || patient.registrationDate)}</span>
                    <span className="text-slate-300">•</span>
                    <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="font-mono text-blue-600 font-semibold">{getRegistrationTime(patient)}</span>
                  </div>

                  {/* Contact & Address with Instant WhatsApp Auto Link */}
                  <div className="text-xs text-slate-600 mt-1.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-mono text-emerald-700 font-semibold">{patient.phone}</span>
                      </div>
                      {patient.phone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenWhatsApp) {
                              onOpenWhatsApp(
                                patient.phone,
                                `Namaste ${patient.name},\nGreetings from ${clinicProfile.name || 'Apex Dentocare & Implant Center'}! How can we assist you with your dental care today?`
                              );
                            }
                          }}
                          className="flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] transition shadow-xs flex-shrink-0"
                          title="Open WhatsApp chat with client using auto link"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>
                    {patient.address && (
                      <div className="flex items-start space-x-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight font-medium line-clamp-2">
                          {patient.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Critical Medical Flags */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {hasAllergies && (
                      <div className="flex items-center space-x-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Allergy: {Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}</span>
                      </div>
                    )}
                    {hasMedical && (
                      <div className="flex items-center space-x-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <HeartPulse className="w-3 h-3 text-amber-600" />
                        <span>{Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(', ') : patient.medicalHistory}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Quick Stats & Explicit VIEW and EDIT Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingPatient(patient)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
                      title="View Complete EHR Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(patient, e)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition"
                      title="Edit Patient Details"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrdersModalPatient(patient)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200/70 transition shadow-xs text-xs"
                    title="View custom dental lab orders directly linked to this Patient ID"
                  >
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Orders ({patient.orders?.length || 0})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTRATION / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl lg:max-w-6xl max-h-[94vh] flex flex-col overflow-hidden">
            <div className="bg-blue-600 px-6 py-3.5 text-white flex items-center justify-between shadow-sm">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <span>{editingPatientId ? 'Edit Patient Information' : 'New Patient Registration'}</span>
              </h3>
              {formData.id && (
                <div className="flex items-center space-x-1.5 bg-blue-700 px-3 py-1 rounded-xl border border-blue-400/50 text-xs font-mono shadow-2xs">
                  <span className="text-blue-200 text-[10px] uppercase font-bold tracking-wider">Patient ID:</span>
                  <span className="font-black text-white">{formData.id}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-blue-700 w-7 h-7 rounded-lg flex items-center justify-center text-lg font-bold leading-none transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* LEFT COLUMN: DEMOGRAPHICS & MEDICAL */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <span className="font-black text-slate-800 uppercase tracking-wider text-xs">
                      Patient Demographics & Profile
                    </span>
                  </div>

                  {/* DUPLICATE PATIENT WARNING BANNER */}
                  {existingDuplicate && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-300 text-rose-950 text-xs flex items-start space-x-2.5 shadow-sm animate-fadeIn">
                      <div className="w-6 h-6 rounded-lg bg-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-black text-rose-950 text-xs uppercase tracking-wide">
                            Duplicate Patient Detected — Save Blocked
                          </span>
                          <span className="font-mono text-[10px] bg-rose-200 text-rose-950 px-1.5 py-0.2 rounded-full font-bold">
                            {existingDuplicate.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-900 leading-tight">
                          A patient with the exact same name (<strong className="capitalize text-rose-950 font-black">{existingDuplicate.name}</strong>) and mobile (<strong className="font-mono text-rose-950 font-black">{existingDuplicate.phone}</strong>) is already registered in this clinic.
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setModalOpen(false);
                              if (onSelectPatient) onSelectPatient(existingDuplicate);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1"
                          >
                            <span>Open Existing Patient Chart ({existingDuplicate.id})</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UNIQUE PATIENT ID CARD (GENERATED USING NAME LETTERS + NUMBER) */}
                  <div className="p-2.5 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 rounded-xl border border-blue-200/90 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px] flex-shrink-0 shadow-xs">
                        ID
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-black uppercase text-blue-900 tracking-wider leading-none">
                          Unique Patient ID (Linked to Record)
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold leading-tight mt-0.5 block">
                          Auto-generated from name letters & number
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <input
                        type="text"
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                        placeholder="e.g. RS-1006"
                        className="font-mono text-xs font-black text-blue-950 bg-white px-2.5 py-1.5 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-none w-28 text-center uppercase shadow-2xs"
                        title="Unique Patient Identifier automatically generated using name letters and number"
                      />
                      {!editingPatientId && (
                        <button
                          type="button"
                          onClick={handleRegenerateId}
                          className="px-2 py-1.5 text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 transition shadow-2xs flex items-center gap-1"
                          title="Generate fresh unique number with same name initials"
                        >
                          <RotateCw className="w-3 h-3 text-blue-600" />
                          <span>New</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1. Full Name */}
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      placeholder="e.g. Rupendra Sah"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                    />
                  </div>

                  {/* 2 & 3. Mobile & Emergency Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                        Mobile Number (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="9801197710"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="e.g. 9841234567 (Family)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  {/* 4, 5, 6. Age, Gender, Blood Group */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="e.g. 32"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1 text-[11px]">
                        Blood Group
                      </label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 7. Known Drug Allergies */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-red-600 uppercase text-[11px]">
                        Known Drug Allergies
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Click badges or type
                      </span>
                    </div>
                    <input
                      type="text"
                      list="allergies-datalist"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="e.g. Penicillin, NSAIDs, Sulfa, Latex"
                      className="w-full px-3 py-1.5 rounded-lg border border-red-300 bg-red-50/20 focus:ring-2 focus:ring-red-400 focus:outline-none text-xs"
                    />
                    <datalist id="allergies-datalist">
                      {(suggestionBank.allergies || []).map(a => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>

                    <div className="flex flex-wrap gap-1 items-center pt-0.5">
                      <span className="text-[10px] font-bold text-red-700 mr-0.5 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-red-500" />
                        <span>Quick:</span>
                      </span>
                      {(suggestionBank.allergies || []).map((allergy) => {
                        const selected = isAllergySelected(allergy);
                        return (
                          <button
                            key={allergy}
                            type="button"
                            onClick={() => handleToggleAllergy(allergy)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center space-x-0.5 ${
                              selected
                                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                                : 'bg-white text-slate-700 border-red-200 hover:bg-red-50 hover:text-red-700'
                            }`}
                          >
                            <span>{selected ? '✓' : '+'}</span>
                            <span>{allergy}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 8. Medical Conditions / History */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700 uppercase text-[11px]">
                        Medical Conditions / History
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Click badges or type
                      </span>
                    </div>
                    <input
                      type="text"
                      list="medical-datalist"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                      placeholder="e.g. Hypertension, Diabetes, Asthma"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                    />
                    <datalist id="medical-datalist">
                      {(suggestionBank.medicalHistory || []).map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>

                    <div className="flex flex-wrap gap-1 items-center pt-0.5">
                      <span className="text-[10px] font-bold text-blue-700 mr-0.5 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-blue-500" />
                        <span>Quick:</span>
                      </span>
                      {(suggestionBank.medicalHistory || []).map((condition) => {
                        const selected = isMedicalSelected(condition);
                        return (
                          <button
                            key={condition}
                            type="button"
                            onClick={() => handleToggleMedical(condition)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all flex items-center space-x-0.5 ${
                              selected
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <span>{selected ? '✓' : '+'}</span>
                            <span>{condition}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: NEPAL ADMINISTRATIVE ADDRESS */}
                <div className="lg:col-span-6 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-1.5 pb-1 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-black text-slate-800 uppercase tracking-wider text-xs">
                            Address Details
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {formData.ward
                          ? 'Address Units Complete'
                          : formData.municipality
                          ? 'Step 3 of 4: Ward'
                          : formData.district
                          ? 'Step 2 of 4: Local Govt'
                          : formData.province
                          ? 'Step 1 of 4: District'
                          : 'Initial View: Select Province'}
                      </span>
                    </div>

                    {/* Context Breadcrumb */}
                    {formData.province && (
                      <div className="p-2 bg-blue-50/80 rounded-xl border border-blue-200/80 text-[11px] flex items-center flex-wrap gap-1 animate-fadeIn">
                        <span className="font-bold text-blue-900 flex items-center gap-1 mr-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                          Context:
                        </span>
                        <span className="font-semibold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200 shadow-2xs">
                          {formData.province}
                        </span>
                        {formData.district && (
                          <>
                            <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <span className="font-semibold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200 shadow-2xs">
                              {formData.district} District
                            </span>
                          </>
                        )}
                        {formData.municipality && (
                          <>
                            <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <span className="font-semibold text-blue-900 bg-white px-1.5 py-0.5 rounded border border-blue-200 shadow-2xs">
                              {formData.municipality}
                            </span>
                          </>
                        )}
                        {formData.ward && (
                          <>
                            <ChevronRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs">
                              {formData.ward}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Cascading Address Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* TIER 1: PROVINCE (Always visible) */}
                      <div className={formData.province ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                        <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                          1. Select Province *
                        </label>
                        <select
                          required
                          value={formData.province}
                          onChange={handleProvinceChange}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs shadow-2xs"
                        >
                          <option value="">-- Select Province --</option>
                          {NEPAL_PROVINCES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* TIER 2: DISTRICT (Revealed ONLY after Province selected) */}
                      {formData.province && (
                        <div className="col-span-1 animate-fadeIn">
                          <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                            2. Select District *
                          </label>
                          <select
                            required
                            value={formData.district}
                            onChange={handleDistrictChange}
                            className="w-full px-2.5 py-2 rounded-xl border border-blue-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs shadow-2xs"
                          >
                            <option value="">-- Select District in {formData.province} --</option>
                            {availableDistricts.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* TIER 3: LOCAL GOVERNMENT (Revealed ONLY after District selected) */}
                      {formData.district && (
                        <div className={`animate-fadeIn ${formData.ward ? 'col-span-1' : 'col-span-1 sm:col-span-2'}`}>
                          <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                            3. Select Local Government (Municipality / Rural Municipality) *
                          </label>
                          <select
                            required
                            value={formData.municipality}
                            onChange={handleMunicipalityChange}
                            className="w-full px-2.5 py-2 rounded-xl border border-blue-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs shadow-2xs"
                          >
                            <option value="">-- Select Municipality / Rural Municipality in {formData.district} --</option>
                            {availableMunicipalities.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* TIER 4: WARD NO. (Revealed ONLY after Municipality selected) */}
                      {formData.municipality && (
                        <div className="col-span-1 sm:col-span-2 animate-fadeIn">
                          <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                            4. Select Ward No. *
                          </label>
                          <select
                            required
                            value={formData.ward}
                            onChange={handleWardChange}
                            className="w-full px-2.5 py-2 rounded-xl border border-blue-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs shadow-2xs"
                          >
                            <option value="">-- Select Ward in {formData.municipality} --</option>
                            {NEPAL_WARDS.map(w => (
                              <option key={w} value={w}>{w}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* OPTIONAL TOLE / LOCALITY (Captured ONLY AFTER Ward) */}
                      {formData.ward && (
                        <div className="col-span-1 sm:col-span-2 animate-fadeIn p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <label className="block font-bold text-slate-800 uppercase text-[11px]">
                              Tole / Street / Locality
                            </label>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Optional
                            </span>
                          </div>
                          <input
                            type="text"
                            value={formData.tole}
                            onChange={handleToleChange}
                            placeholder="e.g. New Road, Traffic Chowk, Maitighar, Lakeside, Hospital Chowk..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 text-xs shadow-2xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Address Preview */}
                  {formData.province && (
                    <div className="pt-2 border-t border-slate-200 text-xs animate-fadeIn">
                      <span className="text-slate-500 font-bold block mb-1 text-[11px]">Address Preview:</span>
                      <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-800 font-semibold flex items-center space-x-2 shadow-2xs">
                        <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="leading-snug text-xs">
                          {[
                            formData.tole ? formData.tole.trim() : '',
                            formData.ward,
                            formData.municipality,
                            formData.district,
                            formData.province
                          ].filter(Boolean).join(', ') || 'Select location'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PATIENT TICKET CHARGE & FIRST VISIT BILLING */}
              {!editingPatientId && clinicProfile?.enableTicketCharge !== false && (
                <div className="pt-3 mt-3 border-t border-slate-200">
                  <div className="p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-slate-50 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                        <Ticket className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                            First Visit Registration & OPD Ticket Fee
                          </span>
                          <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px]">
                            {clinicProfile?.currency || 'Rs.'} {clinicProfile?.ticketFee !== undefined ? clinicProfile.ticketFee : 200}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Applies standard OPD consultation fee on first visit. Grants free revisits for {clinicProfile?.visitValidityDays !== undefined ? clinicProfile.visitValidityDays : 7} days.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center flex-shrink-0">
                      <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={formData.autoBillTicket !== false}
                          onChange={(e) => setFormData({ ...formData, autoBillTicket: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span>Bill Ticket on Save</span>
                      </label>
                      {formData.autoBillTicket !== false && (
                        <select
                          value={formData.ticketPaymentMethod || 'Fonepay QR'}
                          onChange={(e) => setFormData({ ...formData, ticketPaymentMethod: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs"
                        >
                          <option value="Fonepay QR">Fonepay QR</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="eSewa">eSewa</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!existingDuplicate}
                  className={`font-bold px-6 py-2 rounded-lg shadow-sm transition text-xs ${
                    existingDuplicate
                      ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed opacity-90'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  title={existingDuplicate ? 'Cannot save: Both name and mobile number match an existing patient.' : ''}
                >
                  {existingDuplicate
                    ? 'Cannot Save: Duplicate Patient'
                    : editingPatientId
                    ? 'Update Patient'
                    : 'Save & Open Chart'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT ORDERS MODAL (DIRECTLY LINKED TO PATIENT ID) */}
      {ordersModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <PatientOrders
                patient={ordersModalPatient}
                patients={patients}
                currentUser={currentUser}
                activeTenant={activeTenant}
                clinicProfile={clinicProfile}
                authToken={authToken}
                onClose={() => setOrdersModalPatient(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE PATIENT VIEW (EHR) MODAL */}
      <PatientViewModal
        patient={viewingPatient ? (patients.find(p => p.id === viewingPatient.id) || viewingPatient) : null}
        isOpen={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        onEdit={(p) => handleOpenEditModal(p, { stopPropagation: () => {} })}
        appointments={appointments}
        clinicProfile={clinicProfile}
        currentUser={currentUser}
        activeTenant={activeTenant}
        authToken={authToken}
        onOpenWhatsApp={onOpenWhatsApp}
        onNavigateTab={onNavigateTab}
        onOpenLabOrders={(p) => setOrdersModalPatient(p)}
      />
    </div>
  );
}
