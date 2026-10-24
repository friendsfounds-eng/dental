import React, { useState, useEffect, useMemo } from 'react';
import { exportToA4Pdf } from '../../utils/pdfExport';
import { assessTicketValidity, createTicketInvoiceItem } from '../../utils/ticketValidity';
import {
  Receipt,
  Plus,
  Printer,
  MessageSquare,
  QrCode,
  CheckCircle,
  CreditCard,
  DollarSign,
  Download,
  Trash2,
  X,
  User,
  Calendar,
  MapPin,
  Phone,
  FileText,
  ShieldCheck,
  Stethoscope,
  Ticket,
  Clock,
  AlertCircle,
  Search,
  ArrowUpDown,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function BillingManager({
  patients = [],
  selectedPatient,
  doctors = [],
  clinicProfile = {},
  treatmentCatalog = [],
  onAddInvoice,
  onOpenWhatsApp
}) {
  const currency = clinicProfile.currency || 'Rs.';
  const [modalOpen, setModalOpen] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [printDoctorId, setPrintDoctorId] = useState('');

  // Patient Search & Invoice Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Paid' | 'Partial' | 'Unpaid'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (most recent on top) | 'asc'
  const [printDocFormat, setPrintDocFormat] = useState('combined'); // 'combined' | 'bill_only'
  const [selectedRxId, setSelectedRxId] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState(null);

  // Invoice creation form state
  const [invoicePatientId, setInvoicePatientId] = useState(selectedPatient?.id || patients[0]?.id || '');
  const [invoiceDoctorId, setInvoiceDoctorId] = useState(doctors[0]?.id || '');
  const [items, setItems] = useState([
    { description: 'Comprehensive Dental Examination', tooth: 'General', qty: 1, unitPrice: 500, total: 500 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('Fonepay QR');

  useEffect(() => {
    if (selectedPatient?.id) {
      setInvoicePatientId(selectedPatient.id);
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (doctors.length > 0 && !invoiceDoctorId) {
      setInvoiceDoctorId(doctors[0].id);
    }
  }, [doctors, invoiceDoctorId]);

  const currentPatient = patients.find(p => p.id === invoicePatientId) || patients[0];
  const ticketAssessment = assessTicketValidity(currentPatient, clinicProfile);
  const hasTicketInItems = items.some(i => i.isTicket === true);

  const handleApplyTicketItem = () => {
    if (!ticketAssessment.enabled) return;
    const ticketItem = createTicketInvoiceItem(ticketAssessment, clinicProfile);
    const nonTicket = items.filter(i => !i.isTicket);
    const updated = [ticketItem, ...nonTicket];
    setItems(updated);
    const newSub = updated.reduce((s, it) => s + (it.total || 0), 0);
    setPaidAmount(newSub);
  };

  const handleRemoveTicketItem = () => {
    const updated = items.filter(i => !i.isTicket);
    setItems(updated);
    const newSub = updated.reduce((s, it) => s + (it.total || 0), 0);
    setPaidAmount(newSub);
  };

  const handleOpenCreateModal = (targetPatientOverride = null) => {
    const target = targetPatientOverride || currentPatient;
    if (target?.id) {
      setInvoicePatientId(target.id);
    }
    const assessment = assessTicketValidity(target, clinicProfile);
    let initialItems = [];
    if (assessment.enabled) {
      initialItems.push(createTicketInvoiceItem(assessment, clinicProfile));
    }
    initialItems.push({
      description: 'Comprehensive Dental Examination',
      tooth: 'General',
      qty: 1,
      unitPrice: 500,
      total: 500
    });
    setItems(initialItems);
    const initialSubtotal = initialItems.reduce((s, it) => s + (it.total || 0), 0);
    setDiscount(0);
    setTaxPercent(0);
    setPaidAmount(initialSubtotal);
    setModalOpen(true);
  };

  const handlePatientSelectChange = (newPatId) => {
    setInvoicePatientId(newPatId);
    const target = patients.find(p => p.id === newPatId);
    if (!target) return;
    const assessment = assessTicketValidity(target, clinicProfile);
    if (assessment.enabled) {
      const ticketItem = createTicketInvoiceItem(assessment, clinicProfile);
      const otherItems = items.filter(i => !i.isTicket);
      const newItems = [ticketItem, ...otherItems];
      setItems(newItems);
      const newSub = newItems.reduce((s, it) => s + (it.total || 0), 0);
      setPaidAmount(newSub);
    }
  };

  // Collect all invoices across all patients with patient metadata
  const rawInvoices = useMemo(() => {
    return patients.flatMap(p =>
      (p.invoices || []).map((inv, originalIndex) => ({
        ...inv,
        patientName: p.name,
        patientPhone: p.phone,
        patientId: p.id,
        patientAge: p.age,
        patientGender: p.gender,
        patientAddress: p.address,
        _patientSequence: originalIndex
      }))
    );
  }, [patients]);

  // Sequence sorting: Most recently generated / newest date on top (descending)
  const sortedInvoices = useMemo(() => {
    return [...rawInvoices].sort((a, b) => {
      // 1. Exact createdAt ISO timestamp if present
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) {
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      if (timeA && !timeB) return sortOrder === 'desc' ? -1 : 1;
      if (!timeA && timeB) return sortOrder === 'desc' ? 1 : -1;

      // 2. Invoice Date (YYYY-MM-DD or date string)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) {
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }

      // 3. Sequential numeric extraction from invoiceNumber or ID (e.g. INV-2026-6941 vs INV-2026-1012)
      const numA = parseInt(String(a.invoiceNumber || a.id || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.invoiceNumber || b.id || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) {
        return sortOrder === 'desc' ? numB - numA : numA - numB;
      }

      // 4. Stable patient array sequence fallback
      return sortOrder === 'desc' ? (a._patientSequence - b._patientSequence) : (b._patientSequence - a._patientSequence);
    });
  }, [rawInvoices, sortOrder]);

  // Filtered Invoices based on Patient Search and Status
  const allInvoices = useMemo(() => {
    return sortedInvoices.filter(inv => {
      // Status filter
      if (statusFilter !== 'All' && inv.status !== statusFilter) {
        return false;
      }

      // Search Query (matches patient name, patient ID/MRN, phone, invoice number, treatments, or doctor)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPatient = inv.patientName?.toLowerCase().includes(q);
        const matchId = inv.patientId?.toLowerCase().includes(q);
        const matchPhone = inv.patientPhone?.includes(q);
        const matchInvoiceNum = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchDoctor = inv.doctorName?.toLowerCase().includes(q);
        const matchItems = (inv.items || []).some(item =>
          item.description?.toLowerCase().includes(q) ||
          item.tooth?.toLowerCase().includes(q)
        );

        if (!matchPatient && !matchId && !matchPhone && !matchInvoiceNum && !matchDoctor && !matchItems) {
          return false;
        }
      }

      return true;
    });
  }, [sortedInvoices, statusFilter, searchQuery]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxAmount = ((subtotal - discount) * (taxPercent || 0)) / 100;
  const grandTotal = Math.max(0, subtotal - discount + taxAmount);
  const balance = Math.max(0, grandTotal - (paidAmount || 0));

  const handleAddItem = () => {
    setItems([...items, { description: 'Dental Procedure', tooth: 'General', qty: 1, unitPrice: 1000, total: 1000 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'qty' || field === 'unitPrice') {
      const q = parseFloat(updated[index].qty) || 1;
      const u = parseFloat(updated[index].unitPrice) || 0;
      updated[index].total = q * u;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const status = balance === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
    const assignedDoc = doctors.find(d => d.id === invoiceDoctorId) || doctors[0];

    onAddInvoice(invoicePatientId, {
      items,
      subtotal,
      discount: Number(discount) || 0,
      taxPercent: Number(taxPercent) || 0,
      taxAmount,
      total: grandTotal,
      paid: Number(paidAmount) || 0,
      balance,
      status,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      doctorId: assignedDoc?.id || '',
      doctorName: assignedDoc?.name || clinicProfile.doctorInCharge || 'Dr. Yugal Sharma',
      doctorQualification: assignedDoc?.qualification || 'BDS, MDS',
      doctorSpecialty: assignedDoc?.specialty || 'Dental Surgeon',
      doctorReg: assignedDoc?.regNumber || clinicProfile.regNo || 'NMC-84920',
      doctorPhone: assignedDoc?.phone || clinicProfile.phone || '+977 98012 34567'
    });
    setModalOpen(false);
  };

  const handleOpenPrintPreview = (inv) => {
    setPrintInvoice(inv);

    const patient = patients.find(p => p.id === inv.patientId);
    if (patient?.prescriptions && patient.prescriptions.length > 0) {
      setSelectedRxId(patient.prescriptions[0].id);
    } else {
      setSelectedRxId('');
    }

    // Resolve assigned doctor
    let defaultDocId = inv.doctorId;
    if (!defaultDocId && inv.doctorName) {
      const match = doctors.find(d => d.name === inv.doctorName);
      if (match) defaultDocId = match.id;
    }
    if (!defaultDocId) {
      const rxDoc = patient?.prescriptions?.[0]?.doctor;
      if (rxDoc) {
        const match = doctors.find(d => d.name === rxDoc);
        if (match) defaultDocId = match.id;
      }
    }
    if (!defaultDocId && doctors.length > 0) {
      defaultDocId = doctors[0].id;
    }
    setPrintDoctorId(defaultDocId || '');
  };

  const handleTriggerPrint = () => {
    document.body.classList.add('printing-single-invoice');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-single-invoice');
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    if (!printInvoice) return;
    setDownloadingPdf(true);
    const cleanPatientName = (activePrintPatient.name || printInvoice.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const docTypeLabel = printDocFormat === 'combined' ? 'Combined_Rx_and_Bill' : 'Invoice';
    const filename = `ApexDental_${docTypeLabel}_${printInvoice.invoiceNumber}_${cleanPatientName}.pdf`;

    await exportToA4Pdf('printable-single-invoice', filename);
    setDownloadingPdf(false);
    setPdfToast(`✅ ${printDocFormat === 'combined' ? 'Combined Rx & Bill' : 'Invoice'} PDF (${filename}) downloaded!`);
    setTimeout(() => setPdfToast(null), 6000);
  };

  const handleSendWhatsAppPdf = async (inv) => {
    const targetInv = inv || printInvoice;
    if (!targetInv) return;

    const patient = patients.find(p => p.id === targetInv.patientId) || activePrintPatient;
    const doctor = doctors.find(d => d.id === printDoctorId) || activePrintDoctor;

    setDownloadingPdf(true);
    const cleanPatientName = (patient.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const docTypeLabel = printDocFormat === 'combined' ? 'Combined_Rx_and_Bill' : 'Invoice';
    const filename = `ApexDental_${docTypeLabel}_${targetInv.invoiceNumber}_${cleanPatientName}.pdf`;

    // 1. Generate & download the PDF from the A4 printable element
    await exportToA4Pdf('printable-single-invoice', filename);
    setDownloadingPdf(false);

    // 2. Prepare comprehensive WhatsApp message
    const itemsSummary = (targetInv.items || [])
      .map(i => `• ${i.description} (${i.tooth || 'General'}): ${currency} ${(i.total || i.unitPrice || 0).toLocaleString()}`)
      .join('\n');
    const doctorInfo = doctor?.name
      ? `\n👨‍⚕️ *Attending Doctor:* ${doctor.name} (NMC: ${doctor.regNumber || clinicProfile.regNo || 'NMC-84920'})`
      : '';

    const clientAutoLink = `${window.location.origin}/?patientId=${patient.id}`;

    let text = '';
    if (printDocFormat === 'combined' && activeRx) {
      const rxMeds = (activeRx.medicines || [])
        .map((m, i) => `${i + 1}. *${m.name}* - ${m.frequency} for ${m.duration} (${m.instructions})`)
        .join('\n');
      text = `Dear *${patient.name}*,\n\nHere is your official *Digital Dental Prescription & Tax Invoice* from *${clinicProfile.name || 'Apex Dental'}*:\n\n🩺 *Diagnosis:* ${activeRx.diagnosis || 'Dental Evaluation & Therapy'}\n\n💊 *Prescribed Medications (Rx):*\n${rxMeds || 'No systemic medications prescribed.'}\n${activeRx.instructions ? `⚠️ *Advice:* ${activeRx.instructions}\n` : ''}\n🦷 *Dental Procedures & Billing:*\n${itemsSummary}\n\n💰 *Total Bill:* ${currency} ${(targetInv.total || 0).toLocaleString()}\n✅ *Amount Paid:* ${currency} ${(targetInv.paid || 0).toLocaleString()} (${targetInv.status})\n${targetInv.balance > 0 ? `⚠️ *Balance Due:* ${currency} ${targetInv.balance.toLocaleString()}\n` : ''}💳 *Payment Method:* ${targetInv.paymentMethod || 'Fonepay / Cash'}${doctorInfo}\n\n🔗 *Online View & Download Auto Link:*\n${clientAutoLink}\n\n📎 *Note:* Your 1-Page Combined Prescription & Bill PDF has been downloaded as *${filename}*. Please find the attached document.\n\nThank you for trusting ${clinicProfile.name || 'Apex Dental'} with your smile! For queries, call ${clinicProfile.phone || '+977 98012 34567'}.`;
    } else {
      text = `Dear *${patient.name}*,\n\nHere is your official *Dental Treatment Tax Invoice & Receipt* from *${clinicProfile.name || 'Apex Dental'}*:\n\n📄 *Invoice No:* #${targetInv.invoiceNumber}\n📅 *Billing Date:* ${targetInv.date}\n\n🦷 *Treatments / Procedures:*\n${itemsSummary}\n\n💰 *Total Amount:* ${currency} ${(targetInv.total || 0).toLocaleString()}\n✅ *Amount Paid:* ${currency} ${(targetInv.paid || 0).toLocaleString()} (${targetInv.status})\n${targetInv.balance > 0 ? `⚠️ *Balance Due:* ${currency} ${targetInv.balance.toLocaleString()}\n` : ''}💳 *Payment Method:* ${targetInv.paymentMethod || 'Fonepay / Cash'}${doctorInfo}\n\n🔗 *Online Invoice Auto Link:*\n${clientAutoLink}\n\n📎 *Note:* Your official A4 Invoice PDF has been downloaded as *${filename}*. Please find the attached document.\n\nThank you for trusting ${clinicProfile.name || 'Apex Dental'} with your smile! For queries, call ${clinicProfile.phone || '+977 98012 34567'}.`;
    }

    // 3. Open WhatsApp
    if (onOpenWhatsApp && patient.phone) {
      onOpenWhatsApp(patient.phone, text);
    }

    // 4. Show helpful toast
    setPdfToast(`📄 PDF downloaded as ${filename}! In WhatsApp, click 📎 to attach the PDF document.`);
    setTimeout(() => setPdfToast(null), 8000);
  };

  const handleCardWhatsAppPdf = (inv) => {
    handleOpenPrintPreview(inv);
    setTimeout(() => {
      handleSendWhatsAppPdf(inv);
    }, 400);
  };

  // Find active print patient, doctor, and prescription
  const activePrintPatient = patients.find(p => p.id === printInvoice?.patientId) || {
    name: printInvoice?.patientName,
    phone: printInvoice?.patientPhone,
    id: printInvoice?.patientId,
    age: printInvoice?.patientAge,
    gender: printInvoice?.patientGender,
    address: printInvoice?.patientAddress,
    prescriptions: []
  };

  const patientPrescriptions = activePrintPatient?.prescriptions || [];
  const activeRx = patientPrescriptions.find(r => r.id === selectedRxId) || patientPrescriptions[0] || null;

  const activePrintDoctor = doctors.find(d => d.id === printDoctorId) || {
    name: printInvoice?.doctorName || clinicProfile.doctorInCharge || 'Dr. Yugal Sharma',
    qualification: printInvoice?.doctorQualification || 'BDS, MDS',
    specialty: printInvoice?.doctorSpecialty || 'Prosthodontics & Implantology',
    regNumber: printInvoice?.doctorReg || clinicProfile.regNo || 'NMC-84920',
    phone: printInvoice?.doctorPhone || clinicProfile.phone || '+977 98012 34567'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 no-print">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Billing, Invoices & Financial Tracking</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              {rawInvoices.length} Invoices Generated
            </span>
            {(searchQuery.trim() || statusFilter !== 'All') && (
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                {allInvoices.length} Matching
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Itemized procedure receipts, tax invoices, PAN/VAT billing, and instant WhatsApp payment receipts.
          </p>
        </div>

        <button
          onClick={() => handleOpenCreateModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Patient Search Bar & Filter Options */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 no-print">
        {/* Search Input for Patient Name, Patient ID/MRN, Phone, Invoice #, etc. */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, ID (e.g. DKJ-1011), invoice #, phone, or treatment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-2xs font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters & Sequence Ordering */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            {['All', 'Paid', 'Partial', 'Unpaid'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sequence Sort Toggle: Most Recent First (default) / Oldest First */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              sortOrder === 'desc'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle invoice sequence sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>{sortOrder === 'desc' ? 'Most Recent Top' : 'Oldest Top'}</span>
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3 no-print">
        {allInvoices.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2">
            {searchQuery.trim() || statusFilter !== 'All' ? (
              <>
                <p className="font-semibold text-slate-600">
                  No invoices found matching your filters: "{searchQuery.trim() || statusFilter}"
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('All'); }}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Clear Filters
                </button>
              </>
            ) : (
              <p>No invoices recorded yet. Click "Create New Invoice" to generate a bill.</p>
            )}
          </div>
        ) : (
          allInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl text-center min-w-[80px] flex flex-col items-center justify-center">
                  {clinicProfile.logo ? (
                    <img src={clinicProfile.logo} alt="Logo" className="w-8 h-8 object-contain mb-1 rounded" />
                  ) : (
                    <Receipt className="w-5 h-5 mx-auto text-emerald-600 mb-0.5" />
                  )}
                  <span className="text-[10px] font-mono font-bold block">{inv.invoiceNumber}</span>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">{inv.patientName}</h4>
                    <span className="text-xs text-slate-500 font-mono">({inv.patientId})</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'Partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inv.status}
                    </span>

                    {/* Patient Ticket Assessment Badge on Invoice */}
                    {inv.items?.some(i => i.isTicket && Number(i.unitPrice || 0) > 0) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        OPD Ticket Billed
                      </span>
                    )}
                    {inv.items?.some(i => i.isTicket && Number(i.unitPrice || 0) === 0) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Free Revisit (Waived)
                      </span>
                    )}
                    {inv.receiptNumber && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                        Receipt #{inv.receiptNumber}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    <span>Items: </span>
                    <strong className="text-slate-800">
                      {inv.items?.map(i => i.description?.trim()).filter(Boolean).join(', ') || 'General Dental Treatment'}
                    </strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                    <span>Date: {inv.date}</span>
                    <span>Method: {inv.paymentMethod}</span>
                    {inv.doctorName && (
                      <span className="text-blue-700 font-semibold flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        Dr: {inv.doctorName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Amounts & Actions */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-3 sm:space-x-4 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                <div className="text-left md:text-right">
                  <div className="text-sm font-black text-slate-900">{currency} {inv.total?.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-500">
                    Paid: <span className="text-emerald-600 font-bold">{currency} {inv.paid?.toLocaleString()}</span>
                    {inv.balance > 0 && (
                      <span className="text-red-600 font-bold ml-1.5">Due: {currency} {inv.balance?.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenPrintPreview(inv)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition"
                    title="Print single patient A4 invoice"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print A4</span>
                  </button>

                  <button
                    onClick={() => handleCardWhatsAppPdf(inv)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition shadow-xs"
                    title="Generate PDF, download to device, and launch WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send PDF (WhatsApp)</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* A4 PRINT PREVIEW MODAL */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto invoice-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden invoice-modal-dialog">
            {/* Modal Controls Bar (Hidden in Print) */}
            <div className="bg-slate-900 px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Printable A4 Patient Tax Invoice</span>
              </div>

              {/* Format Toggle & Attending Doctor Selector & Print/WhatsApp actions */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Page Combined vs Bill Only Toggle */}
                <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPrintDocFormat('combined')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 ${
                      printDocFormat === 'combined'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Combined (Rx + Bill 1-Page)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintDocFormat('bill_only')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 ${
                      printDocFormat === 'bill_only'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Bill Only</span>
                  </button>
                </div>

                {/* Prescription Switcher if multiple exist and combined mode */}
                {printDocFormat === 'combined' && patientPrescriptions.length > 1 && (
                  <div className="flex items-center space-x-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700">
                    <span className="text-[10px] text-slate-300 font-medium">Rx:</span>
                    <select
                      value={selectedRxId}
                      onChange={(e) => setSelectedRxId(e.target.value)}
                      className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer max-w-[130px] truncate"
                    >
                      {patientPrescriptions.map(rx => (
                        <option key={rx.id} value={rx.id} className="text-slate-900">
                          {rx.date} - {rx.diagnosis?.slice(0, 16) || 'Rx'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-[11px] text-slate-300 font-medium">Doctor:</span>
                  <select
                    value={printDoctorId}
                    onChange={(e) => setPrintDoctorId(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id} className="text-slate-900">
                        {d.name} ({d.specialty || d.qualification}) - {d.regNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleTriggerPrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-md flex items-center space-x-1.5 transition"
                  title="Print to printer or PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print A4</span>
                </button>

                {/* WhatsApp Button near Print */}
                <button
                  onClick={() => handleSendWhatsAppPdf(printInvoice)}
                  disabled={downloadingPdf}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-lg shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
                  title="Export PDF, download to PC, and launch WhatsApp chat with patient"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-950" />
                  <span>{downloadingPdf ? 'Exporting PDF...' : 'Send PDF via WhatsApp'}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2 rounded-lg border border-slate-700 transition flex items-center space-x-1"
                  title="Download A4 PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => setPrintInvoice(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification / Toast Banner */}
            {pdfToast && (
              <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between no-print animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>{pdfToast}</span>
                </div>
                <button onClick={() => setPdfToast(null)} className="text-white/80 hover:text-white text-sm font-bold">✕</button>
              </div>
            )}

            {/* PREVIEW CONTAINER */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-200/60 flex-1 flex justify-center">
              {/* THE EXACT A4 PRINTABLE DOCUMENT */}
              {printDocFormat === 'combined' ? (
                /* COMBINED PRESCRIPTION & BILLING (EXACT 1-PAGE A4) */
                <div
                  id="printable-single-invoice"
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-6 sm:p-7 shadow-xl border border-slate-300 rounded-lg flex flex-col justify-between"
                  style={{ boxSizing: 'border-box' }}
                >
                  <div>
                    {/* 1. Official Letterhead */}
                    <div className="flex items-start justify-between pb-3 border-b-2 border-slate-900 gap-4">
                      <div className="flex items-start space-x-3">
                        {clinicProfile.logo ? (
                          <img
                            src={clinicProfile.logo}
                            alt="Clinic Logo"
                            className="w-14 h-14 object-contain rounded border border-slate-200 p-0.5"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                            🦷
                          </div>
                        )}
                        <div>
                          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                            {clinicProfile.name || 'Apex Dentocare & Implant Center'}
                          </h1>
                          <p className="text-[11px] font-semibold text-blue-800 mt-0.5">
                            {clinicProfile.tagline || 'Advanced Digital Dentistry & Micro-Endodontics'}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                            {clinicProfile.address || 'Metro Healthcare Towers, New Baneshwor, Ward 10, Kathmandu, Nepal'}
                          </p>
                          <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                            Phone: <strong className="text-slate-800">{clinicProfile.phone || '+977 98012 34567'}</strong>
                            {clinicProfile.email && ` | Email: ${clinicProfile.email}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="inline-block bg-slate-900 text-white font-black text-[10px] px-2.5 py-1 rounded tracking-wider uppercase mb-1">
                          PRESCRIPTION & TAX INVOICE
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-900">
                          PAN / VAT: <span className="text-blue-900">{clinicProfile.panVat || clinicProfile.gstin || '601234567'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-700">
                          NMC Reg: <strong>{clinicProfile.regNo || 'NMC-84920'}</strong>
                        </div>
                        <div className="text-[9px] text-slate-500 italic mt-0.5">
                          (Prescription & Tax Invoice)
                        </div>
                      </div>
                    </div>

                    {/* 2. Patient & Invoice Ribbon */}
                    <div className="mt-2.5 border border-slate-300 rounded-lg p-2.5 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
                          Patient Details:
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          {activePrintPatient.name || printInvoice.patientName}
                        </div>
                        <div className="text-slate-700 text-[11px] mt-0.5">
                          <span className="font-semibold">Patient ID:</span>{' '}
                          <span className="font-mono font-bold text-blue-900">{activePrintPatient.id || printInvoice.patientId}</span>
                          {activePrintPatient.age && ` • Age: ${activePrintPatient.age} Yrs`}
                          {activePrintPatient.gender && ` • Gender: ${activePrintPatient.gender}`}
                        </div>
                        <div className="text-slate-700 text-[11px] mt-0.5">
                          <span className="font-semibold">Phone:</span>{' '}
                          <span className="font-mono">{activePrintPatient.phone || printInvoice.patientPhone}</span>
                        </div>
                        {activePrintPatient.address && (
                          <div className="text-slate-700 text-[10px] leading-tight truncate">
                            <span className="font-semibold">Address:</span> {activePrintPatient.address}
                          </div>
                        )}
                      </div>

                      <div className="sm:text-right">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
                          Invoice Details:
                        </div>
                        <div className="text-sm font-mono font-black text-emerald-800">
                          Invoice No: {printInvoice.invoiceNumber}
                        </div>
                        <div className="text-slate-700 text-[11px] mt-0.5">
                          <span className="font-semibold">Billing Date:</span>{' '}
                          <span className="font-mono font-bold">{printInvoice.date}</span>
                        </div>
                        <div className="text-slate-700 text-[11px] mt-0.5">
                          <span className="font-semibold">Method:</span>{' '}
                          <strong className="text-slate-900">{printInvoice.paymentMethod || 'Fonepay QR / eSewa'}</strong>
                        </div>
                        <div className="mt-0.5">
                          <span
                            className={`inline-block px-2 py-0.2 rounded text-[9px] font-black uppercase border ${
                              printInvoice.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            Status: {printInvoice.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. SECTION A: DIGITAL PRESCRIPTION (Rx) */}
                    <div className="mt-2.5 border border-purple-300 rounded-lg overflow-hidden bg-white">
                      <div className="bg-purple-50 px-3 py-1.5 border-b border-purple-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-purple-950 font-black">
                          <span className="text-sm font-serif font-black text-purple-800">℞</span>
                          <span className="uppercase tracking-wider text-[11px]">Digital Dental Prescription</span>
                        </div>
                        <div className="text-[11px] text-purple-900 font-bold">
                          Diagnosis: <span className="font-semibold text-slate-800">{activeRx?.diagnosis || 'Comprehensive Dental Evaluation & Therapy'}</span>
                        </div>
                      </div>

                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-purple-100 text-slate-600 font-bold uppercase text-[9px]">
                          <tr>
                            <th className="p-1.5 w-8 text-center border-r border-slate-200">#</th>
                            <th className="p-1.5 border-r border-slate-200">Medicine Name & Formulation</th>
                            <th className="p-1.5 w-36 border-r border-slate-200">Dosage & Frequency</th>
                            <th className="p-1.5 w-20 border-r border-slate-200">Duration</th>
                            <th className="p-1.5">Special Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(activeRx?.medicines && activeRx.medicines.length > 0) ? (
                            activeRx.medicines.map((med, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-1.5 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                                <td className="p-1.5 font-bold text-slate-900 border-r border-slate-200">{med.name}</td>
                                <td className="p-1.5 text-blue-900 font-semibold border-r border-slate-200">{med.frequency}</td>
                                <td className="p-1.5 text-slate-700 border-r border-slate-200">{med.duration}</td>
                                <td className="p-1.5 text-slate-600 italic">{med.instructions}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="p-2 text-center text-slate-400 italic text-[10px]">
                                No systemic antibiotics/analgesics prescribed for this visit. Maintain routine oral hygiene.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {activeRx?.instructions && (
                        <div className="px-3 py-1 bg-purple-50/40 border-t border-purple-100 text-[10px] text-slate-700">
                          <strong className="text-purple-900">Advice & Post-Op:</strong> {activeRx.instructions}
                        </div>
                      )}
                    </div>

                    {/* 4. SECTION B: DENTAL PROCEDURES & BILLING RECEIPT */}
                    <div className="mt-2.5 border border-emerald-300 rounded-lg overflow-hidden bg-white">
                      <div className="bg-emerald-50 px-3 py-1.5 border-b border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-emerald-950 font-black">
                          <span className="text-[11px] uppercase tracking-wider">Dental Procedures & Treatment Bill</span>
                        </div>
                        <div className="text-[10px] text-emerald-800 font-bold font-mono">
                          Tax Invoice #{printInvoice.invoiceNumber}
                        </div>
                      </div>

                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 border-b border-emerald-100 text-slate-600 font-bold uppercase text-[9px]">
                          <tr>
                            <th className="p-1.5 w-8 text-center border-r border-slate-200">#</th>
                            <th className="p-1.5 border-r border-slate-200">Treatment / Clinical Procedure Description</th>
                            <th className="p-1.5 w-24 text-center border-r border-slate-200">Tooth/Site</th>
                            <th className="p-1.5 w-24 text-right border-r border-slate-200">Unit Price ({currency})</th>
                            <th className="p-1.5 w-12 text-center border-r border-slate-200">Qty</th>
                            <th className="p-1.5 w-24 text-right">Amount ({currency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {printInvoice.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-1.5 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                              <td className="p-1.5 font-bold text-slate-900 border-r border-slate-200">{item.description}</td>
                              <td className="p-1.5 text-center font-mono text-slate-600 border-r border-slate-200">{item.tooth || 'General'}</td>
                              <td className="p-1.5 text-right font-mono text-slate-700 border-r border-slate-200">{(item.unitPrice || 0).toLocaleString()}</td>
                              <td className="p-1.5 text-center font-bold text-slate-800 border-r border-slate-200">{item.qty || 1}</td>
                              <td className="p-1.5 text-right font-mono font-bold text-slate-900">{(item.total || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Financial Summary Bar */}
                      <div className="bg-slate-50 p-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px]">
                        <div className="text-[10px] text-slate-500">
                          Payment Method: <strong className="text-slate-800">{printInvoice.paymentMethod || 'Fonepay QR / Cash'}</strong>
                        </div>
                        <div className="flex items-center space-x-3.5">
                          <span className="text-slate-600">Subtotal: <strong className="font-mono text-slate-800">{currency} {(printInvoice.subtotal || printInvoice.total || 0).toLocaleString()}</strong></span>
                          {printInvoice.discount > 0 && (
                            <span className="text-emerald-700">Disc: <strong className="font-mono">-{currency} {printInvoice.discount.toLocaleString()}</strong></span>
                          )}
                          {printInvoice.taxAmount > 0 && (
                            <span className="text-slate-600">VAT: <strong className="font-mono">{currency} {printInvoice.taxAmount.toLocaleString()}</strong></span>
                          )}
                          <span className="font-black text-slate-950 text-xs">Total: <span className="font-mono">{currency} {(printInvoice.total || 0).toLocaleString()}</span></span>
                          <span className="font-bold text-emerald-800">Paid: <span className="font-mono">{currency} {(printInvoice.paid || 0).toLocaleString()}</span></span>
                          {printInvoice.balance > 0 ? (
                            <span className="font-black text-red-600">Due: <span className="font-mono">{currency} {printInvoice.balance.toLocaleString()}</span></span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">✓ Paid Full</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. BOTTOM SECTION WITH DOCTOR DETAILS BELOW RIGHT SIDE */}
                  <div className="mt-3 pt-3 border-t-2 border-slate-900 grid grid-cols-2 gap-4 items-end text-[11px]">
                    <div className="text-slate-600 space-y-1">
                      <div className="font-bold uppercase tracking-wider text-slate-800 text-[10px]">
                        Clinical Notes & Warranty:
                      </div>
                      <p className="leading-tight text-[10px]">
                        • Retain this official combined prescription & tax invoice for clinical recall, warranty, and follow-up.
                      </p>
                      <p className="leading-tight text-[10px]">
                        • Reception & appointments: <strong>{clinicProfile.phone || '+977 98012 34567'}</strong>.
                      </p>
                      <p className="text-[9px] text-slate-500 italic">
                        Thank you for trusting {clinicProfile.name || 'Apex Dental'} with your smile!
                      </p>
                    </div>

                    {/* RIGHT BOTTOM: ATTENDING DOCTOR DETAILS (BELOW RIGHT SIDE) */}
                    <div className="text-right">
                      <div className="text-[9px] uppercase font-bold text-slate-500">
                        Attending Dental Surgeon / Checked By:
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {activePrintDoctor.name}
                      </div>
                      <div className="text-[11px] font-semibold text-blue-900">
                        {activePrintDoctor.qualification} {activePrintDoctor.specialty ? `• ${activePrintDoctor.specialty}` : ''}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-slate-800">
                        Nepal Medical Council Reg: <span className="text-blue-900">{activePrintDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'}</span>
                      </div>
                      {activePrintDoctor.phone && (
                        <div className="text-[10px] font-mono text-slate-600">
                          Tel: {activePrintDoctor.phone}
                        </div>
                      )}

                      {/* Signature & Clinic Seal Line */}
                      <div className="mt-3 pt-1.5 border-t-2 border-dashed border-slate-400 inline-block min-w-[200px] text-center">
                        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                          Doctor Signature & Clinic Seal
                        </div>
                        <div className="text-[8px] text-slate-400 italic">
                          (Doctor's Signature & Seal)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* BILL ONLY VIEW */
                <div
                  id="printable-single-invoice"
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-10 shadow-xl border border-slate-300 rounded-lg flex flex-col justify-between"
                  style={{ boxSizing: 'border-box' }}
                >
                <div>
                  {/* Clinic Header / Letterhead */}
                  <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 gap-4">
                    <div className="flex items-start space-x-3.5">
                      {clinicProfile.logo ? (
                        <img
                          src={clinicProfile.logo}
                          alt="Clinic Logo"
                          className="w-16 h-16 object-contain rounded border border-slate-200 p-0.5"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-blue-700 text-white flex items-center justify-center text-3xl font-bold shadow-sm">
                          🦷
                        </div>
                      )}
                      <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                          {clinicProfile.name || 'Apex Dentocare & Implant Center'}
                        </h1>
                        <p className="text-xs font-semibold text-blue-800 mt-1">
                          {clinicProfile.tagline || 'Advanced Digital Dentistry & Micro-Endodontics'}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                          {clinicProfile.address || 'Metro Healthcare Towers, New Baneshwor, Ward 10, Kathmandu, Nepal'}
                        </p>
                        <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                          Phone: <strong className="text-slate-800">{clinicProfile.phone || '+977 98012 34567'}</strong>
                          {clinicProfile.email && ` | Email: ${clinicProfile.email}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded tracking-wider uppercase mb-1.5">
                        PATIENT TAX INVOICE
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-900">
                        PAN / VAT NO: <span className="text-blue-900">{clinicProfile.panVat || clinicProfile.gstin || '601234567'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-700">
                        NMC Reg. No: <strong>{clinicProfile.regNo || 'NMC-84920'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        (Tax & Health Authority Registration)
                      </div>
                    </div>
                  </div>

                  {/* Single Patient Details & Invoice Meta (Clean 2-Column Box) */}
                  <div className="mt-4 border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Patient Information (Single Patient Only) */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 border-b border-slate-200 pb-0.5">
                        Patient Information:
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {activePrintPatient.name || printInvoice.patientName}
                      </div>
                      <div className="text-slate-700 mt-1">
                        <span className="font-semibold">Patient ID:</span>{' '}
                        <span className="font-mono font-bold text-blue-900">{activePrintPatient.id || printInvoice.patientId}</span>
                        {activePrintPatient.age && ` • Age: ${activePrintPatient.age} Yrs`}
                        {activePrintPatient.gender && ` • Gender: ${activePrintPatient.gender}`}
                      </div>
                      <div className="text-slate-700 mt-0.5">
                        <span className="font-semibold">Phone:</span>{' '}
                        <span className="font-mono">{activePrintPatient.phone || printInvoice.patientPhone}</span>
                      </div>
                      {activePrintPatient.address && (
                        <div className="text-slate-700 mt-0.5 leading-snug">
                          <span className="font-semibold">Address:</span> {activePrintPatient.address}
                        </div>
                      )}
                    </div>

                    {/* Invoice Metadata */}
                    <div className="sm:text-right">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 border-b border-slate-200 pb-0.5">
                        Billing Details:
                      </div>
                      <div className="text-sm font-mono font-black text-emerald-800">
                        Invoice No: {printInvoice.invoiceNumber}
                      </div>
                      <div className="text-slate-700 mt-1">
                        <span className="font-semibold">Billing Date:</span>{' '}
                        <span className="font-mono font-bold">{printInvoice.date}</span>
                      </div>
                      <div className="text-slate-700 mt-0.5">
                        <span className="font-semibold">Payment Method:</span>{' '}
                        <strong className="text-slate-900">{printInvoice.paymentMethod || 'Fonepay QR / eSewa'}</strong>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                            printInvoice.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : printInvoice.status === 'Partial'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-red-100 text-red-900 border-red-300'
                          }`}
                        >
                          Payment Status: {printInvoice.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Procedures & Line Items Table */}
                  <div className="mt-5">
                    <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5 w-10 text-center border-r border-slate-200">#</th>
                          <th className="p-2.5 border-r border-slate-200">Treatment / Clinical Procedure Description</th>
                          <th className="p-2.5 w-24 text-center border-r border-slate-200">Tooth / Site</th>
                          <th className="p-2.5 w-24 text-right border-r border-slate-200">Unit Price ({currency})</th>
                          <th className="p-2.5 w-14 text-center border-r border-slate-200">Qty</th>
                          <th className="p-2.5 w-28 text-right">Amount ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {printInvoice.items?.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{item.description}</td>
                            <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-200">{item.tooth || 'General'}</td>
                            <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-200">
                              {(item.unitPrice || 0).toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-800 border-r border-slate-200">{item.qty || 1}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                              {(item.total || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Calculations Box */}
                  <div className="mt-4 flex justify-end">
                    <div className="w-72 bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-mono font-semibold">{currency} {(printInvoice.subtotal || printInvoice.total || 0).toLocaleString()}</span>
                      </div>
                      {printInvoice.discount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Discount:</span>
                          <span className="font-mono text-emerald-700">- {currency} {printInvoice.discount.toLocaleString()}</span>
                        </div>
                      )}
                      {printInvoice.taxAmount > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Tax / VAT ({printInvoice.taxPercent || 0}%):</span>
                          <span className="font-mono">{currency} {printInvoice.taxAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-sm text-slate-900 pt-1.5 border-t border-slate-300">
                        <span>Grand Total:</span>
                        <span className="font-mono">{currency} {(printInvoice.total || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 pt-1">
                        <span>Amount Paid:</span>
                        <span className="font-mono">{currency} {(printInvoice.paid || 0).toLocaleString()}</span>
                      </div>
                      {printInvoice.balance > 0 ? (
                        <div className="flex justify-between font-black text-red-600 pt-1 border-t border-dashed border-slate-300">
                          <span>Balance Due:</span>
                          <span className="font-mono">{currency} {printInvoice.balance.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between font-bold text-emerald-700 text-[11px] pt-1">
                          <span>Balance:</span>
                          <span>{currency} 0 (Paid in Full)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM SECTION WITH DOCTOR DETAILS BELOW RIGHT SIDE */}
                <div className="mt-8 pt-6 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                  {/* Left Bottom: Care Notes & Terms */}
                  <div className="text-[11px] text-slate-600 space-y-1.5">
                    <div className="font-bold uppercase tracking-wider text-slate-800 text-[10px]">
                      Patient Instructions & Treatment Warranty:
                    </div>
                    <p className="leading-snug">
                      • Please retain this official invoice for clinical recall, review visits, and treatment warranty.
                    </p>
                    <p className="leading-snug">
                      • For clinical emergencies or rescheduling, please contact clinic reception at{' '}
                      <strong>{clinicProfile.phone || '+977 98012 34567'}</strong>.
                    </p>
                    <p className="text-[10px] text-slate-500 italic mt-2">
                      Thank you for trusting {clinicProfile.name || 'Apex Dental'} with your smile!
                    </p>
                  </div>

                  {/* RIGHT BOTTOM: ATTENDING DOCTOR DETAILS (BELOW RIGHT SIDE) */}
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Attending / Assigned Dental Surgeon:
                    </div>
                    <div className="text-base font-black text-slate-900 tracking-tight">
                      {activePrintDoctor.name}
                    </div>
                    <div className="text-xs font-semibold text-blue-900 mt-0.5">
                      {activePrintDoctor.qualification} {activePrintDoctor.specialty ? `• ${activePrintDoctor.specialty}` : ''}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                      Nepal Medical Council Reg: <span className="text-blue-900">{activePrintDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'}</span>
                    </div>
                    {activePrintDoctor.phone && (
                      <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                        Tel: {activePrintDoctor.phone}
                      </div>
                    )}

                    {/* Official Stamp & Signature line */}
                    <div className="mt-8 pt-2 border-t-2 border-dashed border-slate-400 inline-block min-w-[220px] text-center">
                      <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        Doctor Signature & Clinic Seal
                      </div>
                      <div className="text-[9px] text-slate-400 italic">
                        (Doctor's Signature & Seal)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
            <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <span>Generate Patient Dental Bill & Invoice</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient *</label>
                  <select
                    value={invoicePatientId}
                    onChange={(e) => handlePatientSelectChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id}) - {p.phone}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Attending Doctor *
                  </label>
                  <select
                    value={invoiceDoctorId}
                    onChange={(e) => setInvoiceDoctorId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty || d.qualification}) - {d.regNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PATIENT TICKET CHARGE & REVISIT VALIDITY ASSESSMENT BANNER */}
              {ticketAssessment.enabled && (
                <div className={`p-3.5 rounded-xl border transition-all ${
                  ticketAssessment.status === 'VALID_REVISIT'
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : ticketAssessment.status === 'EXPIRED'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-blue-50/90 border-blue-300 text-blue-950'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start space-x-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 shadow-xs ${
                        ticketAssessment.status === 'VALID_REVISIT' ? 'bg-emerald-600' : ticketAssessment.status === 'EXPIRED' ? 'bg-amber-600' : 'bg-blue-600'
                      }`}>
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-black text-xs uppercase tracking-wide">
                            {ticketAssessment.status === 'VALID_REVISIT' && `Revisit within Validity Window (≤ ${ticketAssessment.validityDays} Days)`}
                            {ticketAssessment.status === 'FIRST_VISIT' && `First Visit: Registration & OPD Ticket`}
                            {ticketAssessment.status === 'EXPIRED' && `Ticket Expired: Validity Window Elapsed (> ${ticketAssessment.validityDays} Days)`}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            ticketAssessment.status === 'VALID_REVISIT'
                              ? 'bg-emerald-200 text-emerald-900 border border-emerald-400'
                              : ticketAssessment.status === 'EXPIRED'
                              ? 'bg-amber-200 text-amber-900 border border-amber-400'
                              : 'bg-blue-200 text-blue-900 border border-blue-400'
                          }`}>
                            {ticketAssessment.badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5 text-slate-600 font-medium leading-snug">
                          {ticketAssessment.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      {hasTicketInItems ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-1 rounded-md border border-emerald-300 shadow-2xs flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ticket Included ({currency} {items.find(i => i.isTicket)?.unitPrice || 0})</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveTicketItem}
                            className="text-[10px] text-red-600 hover:text-red-700 font-bold underline px-1"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyTicketItem}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition flex items-center space-x-1 ${
                            ticketAssessment.status === 'VALID_REVISIT'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            {ticketAssessment.status === 'VALID_REVISIT'
                              ? 'Include Free Revisit ($0.00)'
                              : `Include Ticket Fee (+${currency} ${ticketAssessment.fee})`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 uppercase">Procedures & Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="overflow-x-auto pb-1">
                  <div className="min-w-[500px] space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${
                        item.isTicket
                          ? item.isWaived
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-blue-50/60 border-blue-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex-1 flex items-center gap-1.5 min-w-0">
                          <input
                            type="text"
                            placeholder="Procedure description"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="flex-1 p-2 rounded border border-slate-300 bg-white text-xs font-medium"
                          />
                          {item.isTicket && (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap border ${
                              item.isWaived
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            }`}>
                              {item.isWaived ? 'Free Revisit ($0.00)' : 'OPD Ticket'}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Tooth #"
                          value={item.tooth}
                          onChange={(e) => handleItemChange(idx, 'tooth', e.target.value)}
                          className="w-16 p-2 text-center rounded border border-slate-300 bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                          className="w-14 p-2 text-center rounded border border-slate-300 bg-white"
                        />
                        <input
                          type="number"
                          placeholder={`Price ${currency}`}
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-24 p-2 text-right rounded border border-slate-300 bg-white font-semibold"
                        />
                        <span className="w-20 font-bold text-right text-slate-800">
                          {currency} {item.total || 0}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial Calculations */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Subtotal:</span>
                  <span>{currency} {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Discount ({currency}):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-28 p-1.5 text-right rounded border border-slate-300 bg-white font-semibold"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span>Tax / VAT (%):</span>
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="w-28 p-1.5 text-right rounded border border-slate-300 bg-white font-semibold"
                  />
                </div>

                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>{currency} {grandTotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span>Amount Paid ({currency}):</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-28 p-1.5 text-right rounded border border-emerald-400 bg-white font-bold text-emerald-700"
                  />
                </div>

                <div className="flex justify-between font-bold text-red-600">
                  <span>Balance Due:</span>
                  <span>{currency} {balance.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span>Payment Method:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                  >
                    <option value="Fonepay QR / eSewa">Fonepay QR / eSewa</option>
                    <option value="eSewa">eSewa Wallet</option>
                    <option value="Khalti">Khalti Wallet</option>
                    <option value="Fonepay QR">Fonepay QR</option>
                    <option value="IME Pay">IME Pay</option>
                    <option value="ConnectIPS">ConnectIPS</option>
                    <option value="Cash">Cash</option>
                    <option value="Mobile Banking">Mobile Banking / Bank Transfer</option>
                    <option value="Debit / Credit Card">Debit / Credit / POS Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg shadow-sm"
                >
                  Generate Invoice & Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
