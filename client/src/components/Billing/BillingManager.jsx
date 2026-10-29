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
  CheckCircle2,
  Zap,
  Pill,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag,
  Tag,
  Layers,
  Minus,
  List,
  LayoutGrid
} from 'lucide-react';

export const getInvoiceTime = (inv) => {
  if (!inv) return '';
  if (inv.time) return inv.time;
  if (inv.createdAt) {
    try {
      const d = new Date(inv.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch (e) {}
  }
  return '11:24 AM';
};

export default function BillingManager({
  patients = [],
  selectedPatient,
  doctors = [],
  clinicProfile = {},
  treatmentCatalog = [],
  pharmacyCatalog = [],
  authToken = '',
  activeTenant = null,
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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [printDocFormat, setPrintDocFormat] = useState('combined'); // 'combined' | 'bill_only'
  const [selectedRxId, setSelectedRxId] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState(null);

  // Invoice creation form state
  const [invoicePatientId, setInvoicePatientId] = useState(selectedPatient?.id || patients[0]?.id || '');
  const [invoiceDoctorId, setInvoiceDoctorId] = useState(doctors[0]?.id || '');
  const [items, setItems] = useState([
    { description: 'Comprehensive Dental Examination', tooth: 'General', qty: 1, unitPrice: 500, total: 500, paidAmount: 500, remainingAmount: 0 }
  ]);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('Fonepay QR');
  const [settlementOption, setSettlementOption] = useState('full'); // 'full' | 'partial' | 'unpaid'

  const updatePaidForNewItems = (newItems, currentOpt = settlementOption) => {
    const newSub = newItems.reduce((s, it) => s + (Number(it.total !== undefined ? it.total : it.unitPrice) || 0), 0);
    const dVal = Number(discount) || 0;
    const tPct = Number(taxPercent) || 0;
    const tAmt = (newSub - dVal) * (tPct / 100);
    const newGrand = Math.max(0, newSub - dVal + tAmt);

    const sumItemsPaid = newItems.reduce((s, it) => {
      const tot = Number(it.total !== undefined ? it.total : (it.unitPrice || 0)) || 0;
      const p = it.paidAmount !== undefined ? (it.paidAmount === '' ? 0 : Number(it.paidAmount) || 0) : tot;
      return s + p;
    }, 0);

    if (currentOpt === 'unpaid') {
      setPaidAmount(0);
    } else {
      setPaidAmount(Math.min(newGrand, sumItemsPaid));
    }
  };

  const handleDiscountChange = (val) => {
    setDiscount(val);
    const d = Number(val) || 0;
    const t = Number(taxPercent) || 0;
    const tax = ((subtotal - d) * t) / 100;
    const newGrand = Math.max(0, subtotal - d + tax);
    if (settlementOption === 'full') {
      setPaidAmount(newGrand);
    } else if (settlementOption === 'partial') {
      setPaidAmount(prev => Math.min(newGrand, Math.max(0, Number(prev) || 0)));
    }
  };

  const handleTaxChange = (val) => {
    setTaxPercent(val);
    const d = Number(discount) || 0;
    const t = Number(val) || 0;
    const tax = ((subtotal - d) * t) / 100;
    const newGrand = Math.max(0, subtotal - d + tax);
    if (settlementOption === 'full') {
      setPaidAmount(newGrand);
    } else if (settlementOption === 'partial') {
      setPaidAmount(prev => Math.min(newGrand, Math.max(0, Number(prev) || 0)));
    }
  };

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

  // Pharmacy sales loaded for linking patient bills
  const [pharmacySales, setPharmacySales] = useState([]);
  const [linkDrawerCategory, setLinkDrawerCategory] = useState(null); // null | 'all' | 'ticket' | 'pharmacy' | 'orders' | 'plans' | 'catalog'
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [linkingToast, setLinkingToast] = useState(null);

  const showToast = (msg) => {
    setLinkingToast(msg);
    setTimeout(() => setLinkingToast(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchPharmacySales = async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
          'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
        };
        const res = await fetch('/api/pharmacy/sales', { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) setPharmacySales(data);
        }
      } catch (err) {
        console.warn('Could not load pharmacy sales for billing link:', err);
      }
    };
    fetchPharmacySales();
    return () => { isMounted = false; };
  }, [authToken, activeTenant]);

  const currentPatient = patients.find(p => p.id === invoicePatientId) || patients[0];
  const ticketAssessment = assessTicketValidity(currentPatient, clinicProfile);

  // Dental Lab Orders for this patient
  const patientOrders = useMemo(() => {
    return currentPatient?.orders || [];
  }, [currentPatient]);

  // Prescriptions for this patient
  const patientPrescriptions = useMemo(() => {
    return currentPatient?.prescriptions || [];
  }, [currentPatient]);

  // Active / Planned treatment plans
  const patientTreatmentPlans = useMemo(() => {
    return currentPatient?.treatmentPlans || [];
  }, [currentPatient]);

  // Pharmacy Sales matching this patient's ID or phone
  const patientPharmacySales = useMemo(() => {
    if (!currentPatient) return [];
    return pharmacySales.filter(s =>
      (s.patientId && s.patientId === currentPatient.id) ||
      (currentPatient.phone && s.patientPhone && s.patientPhone.replace(/\D/g, '') === currentPatient.phone.replace(/\D/g, ''))
    );
  }, [pharmacySales, currentPatient]);

  // Check linking status in items array
  const isTicketLinked = items.some(i => i.isTicket === true || i.itemType === 'TICKET');
  const isOrderLinked = (orderId) => items.some(i => i.sourceId === orderId || (i.itemType === 'ORDER' && i.orderId === orderId));
  const isPharmacySaleLinked = (saleId) => items.some(i => i.sourceId === saleId || i.saleId === saleId);
  const isPrescriptionMedLinked = (rxId, medName) => items.some(i => i.sourceId === `${rxId}_${medName}`);
  const isPlanLinked = (planId) => items.some(i => i.sourceId === planId);

  // 1. Link / Toggle OPD Ticket
  const handleToggleTicket = () => {
    if (isTicketLinked) {
      const updated = items.filter(i => !i.isTicket && i.itemType !== 'TICKET');
      setItems(updated);
      updatePaidForNewItems(updated);
      showToast('OPD Ticket removed from line items.');
    } else {
      if (!ticketAssessment.enabled) return;
      const ticketItem = createTicketInvoiceItem(ticketAssessment, clinicProfile);
      ticketItem.itemType = 'TICKET';
      ticketItem.paidAmount = ticketItem.total || ticketItem.unitPrice || 0;
      ticketItem.remainingAmount = 0;
      const nonTicket = items.filter(i => !i.isTicket && i.itemType !== 'TICKET');
      const updated = [ticketItem, ...nonTicket];
      setItems(updated);
      updatePaidForNewItems(updated);
      showToast(ticketAssessment.status === 'VALID_REVISIT' ? '✨ Free Revisit ($0.00) linked to bill!' : `🎟️ OPD Ticket (${currency} ${ticketAssessment.fee}) linked to bill!`);
    }
  };

  // 2. Link / Toggle Dental Lab Order
  const handleLinkOrder = (order) => {
    if (isOrderLinked(order.id)) {
      const updated = items.filter(i => i.sourceId !== order.id && i.orderId !== order.id);
      setItems(updated);
      updatePaidForNewItems(updated);
      showToast(`Removed Dental Order "${order.orderType}" from bill.`);
      return;
    }
    const cost = Number(order.cost || 0);
    const paid = Number(order.paidAmount || (order.paymentStatus === 'Paid' ? cost : 0));
    const due = order.balanceDue !== undefined ? Number(order.balanceDue) : (order.paymentStatus === 'Paid' ? 0 : Math.max(0, cost - paid));

    const desc = order.paymentStatus === 'Partial' && order.paidAmount > 0
      ? `Dental Lab Order: ${order.orderType || 'Crown'} (Partial - Paid: ${currency} ${paid.toLocaleString()})`
      : order.paymentStatus === 'Paid'
      ? `Dental Lab Order: ${order.orderType || 'Crown'} (Fully Settled)`
      : `Dental Lab Order: ${order.orderType || 'Crown'} - ${order.materials || order.clinicalSpecifications || 'Lab Prosthetic'}`;

    const orderItem = {
      description: desc,
      tooth: order.toothOrImplantDetails || 'General',
      qty: 1,
      unitPrice: cost,
      total: cost,
      paidAmount: paid,
      remainingAmount: due,
      itemType: 'ORDER',
      sourceId: order.id,
      orderId: order.id
    };
    const updated = [...items, orderItem];
    setItems(updated);
    updatePaidForNewItems(updated);
    showToast(`🧪 Dental Order "${order.orderType}" linked (Cost: ${currency} ${cost.toLocaleString()} | Paid: ${currency} ${paid.toLocaleString()} | Due: ${currency} ${due.toLocaleString()})`);
  };

  // 3. Link / Toggle Pharmacy Sale
  const handleLinkPharmacySale = (sale) => {
    if (isPharmacySaleLinked(sale.id)) {
      const updated = items.filter(i => i.sourceId !== sale.id && i.saleId !== sale.id);
      setItems(updated);
      updatePaidForNewItems(updated);
      showToast(`Removed Pharmacy Bill #${sale.receiptNumber} from bill.`);
      return;
    }
    const medNames = (sale.items || []).map(i => `${i.medicineName} (x${i.quantity})`).join(', ');
    const saleTot = Number(sale.totalAmount || 0);
    const saleItem = {
      description: `Pharmacy Bill #${sale.receiptNumber}: ${medNames || 'Dispensed Medications'}`,
      tooth: 'General',
      qty: 1,
      unitPrice: saleTot,
      total: saleTot,
      paidAmount: saleTot,
      remainingAmount: 0,
      itemType: 'PHARMACY',
      sourceId: sale.id,
      saleId: sale.id
    };
    const updated = [...items, saleItem];
    setItems(updated);
    updatePaidForNewItems(updated);
    showToast(`💊 Pharmacy Bill #${sale.receiptNumber} linked (+${currency} ${saleTot.toLocaleString()})`);
  };

  // 4. Link / Toggle Prescribed Medicine
  const handleLinkPrescriptionMed = (rx, med) => {
    const sId = `${rx.id}_${med.name}`;
    if (items.some(i => i.sourceId === sId)) {
      const updated = items.filter(i => i.sourceId !== sId);
      setItems(updated);
      updatePaidForNewItems(updated);
      showToast(`Removed prescribed medicine "${med.name}" from bill.`);
      return;
    }
    const catMatch = (pharmacyCatalog || []).find(c => 
      c.name?.toLowerCase().includes(med.name.toLowerCase()) || 
      med.name.toLowerCase().includes(c.name?.toLowerCase()) ||
      (c.genericName && med.genericName && c.genericName.toLowerCase().includes(med.genericName.toLowerCase()))
    );
    const estPrice = catMatch ? (catMatch.sellingPrice || 35) : 35;
    const rxItem = {
      description: `Prescribed Rx: ${med.name} ${med.dosage || ''} (${med.frequency || 'Daily'})`,
      tooth: 'General',
      qty: 1,
      unitPrice: estPrice,
      total: estPrice,
      paidAmount: estPrice,
      remainingAmount: 0,
      itemType: 'PHARMACY',
      sourceId: sId
    };
    const updated = [...items, rxItem];
    setItems(updated);
    updatePaidForNewItems(updated);
    showToast(`💊 Prescribed Medicine "${med.name}" linked (+${currency} ${estPrice})`);
  };

  // 5. Link / Toggle Treatment Plan
  const handleLinkPlan = (plan) => {
    if (isPlanLinked(plan.id)) {
      const updated = items.filter(i => i.sourceId !== plan.id);
      setItems(updated);
      updatePaidForNewItems(updated);
      showToast(`Removed Treatment Plan "${plan.title}" from bill.`);
      return;
    }
    const planCost = Number(plan.estimatedCost || 0);
    const planPaid = Number(plan.paidAmount || 0);
    const planDue = Math.max(0, planCost - planPaid);
    const planItem = {
      description: `Treatment Plan: ${plan.title}`,
      tooth: 'General',
      qty: 1,
      unitPrice: planCost,
      total: planCost,
      paidAmount: planPaid,
      remainingAmount: planDue,
      itemType: 'PLAN',
      sourceId: plan.id
    };
    const updated = [...items, planItem];
    setItems(updated);
    updatePaidForNewItems(updated);
    showToast(`🦷 Treatment Plan "${plan.title}" linked (+${currency} ${planCost.toLocaleString()})`);
  };

  // 6. Link Procedure from Treatment Catalog
  const handleAddCatalogTreatment = (trt) => {
    const trtCost = Number(trt.defaultCost || 500);
    const trtItem = {
      description: trt.name,
      tooth: trt.category === 'Orthodontics' ? 'Full Arch' : 'General',
      qty: 1,
      unitPrice: trtCost,
      total: trtCost,
      paidAmount: trtCost,
      remainingAmount: 0,
      itemType: 'PROCEDURE',
      sourceId: `CAT-${Date.now()}`
    };
    const updated = [...items, trtItem];
    setItems(updated);
    updatePaidForNewItems(updated);
    showToast(`🦷 Procedure "${trt.name}" added (+${currency} ${trtCost.toLocaleString()})`);
  };

  // 7. Master Action: ⚡ Link All Available Charges for this patient!
  const handleLinkAllAvailableCharges = () => {
    let newItems = [...items];
    let addedCount = 0;

    // A. OPD Ticket
    if (!isTicketLinked && ticketAssessment.enabled) {
      const ticketItem = createTicketInvoiceItem(ticketAssessment, clinicProfile);
      ticketItem.itemType = 'TICKET';
      ticketItem.paidAmount = ticketItem.total || 0;
      ticketItem.remainingAmount = 0;
      newItems.unshift(ticketItem);
      addedCount++;
    }

    // B. Unlinked Pharmacy Sales
    patientPharmacySales.forEach(sale => {
      if (!newItems.some(i => i.sourceId === sale.id || i.saleId === sale.id)) {
        const medNames = (sale.items || []).map(i => `${i.medicineName} (x${i.quantity})`).join(', ');
        const saleTot = Number(sale.totalAmount || 0);
        newItems.push({
          description: `Pharmacy Bill #${sale.receiptNumber}: ${medNames || 'Dispensed Medications'}`,
          tooth: 'General',
          qty: 1,
          unitPrice: saleTot,
          total: saleTot,
          paidAmount: saleTot,
          remainingAmount: 0,
          itemType: 'PHARMACY',
          sourceId: sale.id,
          saleId: sale.id
        });
        addedCount++;
      }
    });

    // C. Unlinked Dental Lab Orders
    patientOrders.forEach(order => {
      if (!newItems.some(i => i.sourceId === order.id || i.orderId === order.id)) {
        const cost = Number(order.cost || 0);
        const paid = Number(order.paidAmount || (order.paymentStatus === 'Paid' ? cost : 0));
        const due = order.balanceDue !== undefined ? Number(order.balanceDue) : (order.paymentStatus === 'Paid' ? 0 : Math.max(0, cost - paid));

        const desc = order.paymentStatus === 'Partial' && order.paidAmount > 0
          ? `Dental Lab Order: ${order.orderType || 'Crown'} (Partial - Paid: ${currency} ${paid.toLocaleString()})`
          : order.paymentStatus === 'Paid'
          ? `Dental Lab Order: ${order.orderType || 'Crown'} (Fully Settled)`
          : `Dental Lab Order: ${order.orderType || 'Crown'} - ${order.materials || order.clinicalSpecifications || 'Custom Work'}`;

        newItems.push({
          description: desc,
          tooth: order.toothOrImplantDetails || 'General',
          qty: 1,
          unitPrice: cost,
          total: cost,
          paidAmount: paid,
          remainingAmount: due,
          itemType: 'ORDER',
          sourceId: order.id,
          orderId: order.id
        });
        addedCount++;
      }
    });

    // D. Active Treatment Plans
    patientTreatmentPlans.forEach(plan => {
      if (!newItems.some(i => i.sourceId === plan.id)) {
        const planCost = Number(plan.estimatedCost || 0);
        const planPaid = Number(plan.paidAmount || 0);
        newItems.push({
          description: `Treatment Plan: ${plan.title}`,
          tooth: 'General',
          qty: 1,
          unitPrice: planCost,
          total: planCost,
          paidAmount: planPaid,
          remainingAmount: Math.max(0, planCost - planPaid),
          itemType: 'PLAN',
          sourceId: plan.id
        });
        addedCount++;
      }
    });

    setItems(newItems);
    updatePaidForNewItems(newItems);
    if (addedCount > 0) {
      showToast(`⚡ Successfully linked ${addedCount} pending patient charge(s)!`);
    } else {
      showToast('ℹ️ All available patient charges are already linked.');
    }
  };

  const handleOpenCreateModal = (targetPatientOverride = null) => {
    const target = targetPatientOverride || currentPatient;
    if (target?.id) {
      setInvoicePatientId(target.id);
    }
    const assessment = assessTicketValidity(target, clinicProfile);
    let initialItems = [];
    if (assessment.enabled) {
      const ticketItem = createTicketInvoiceItem(assessment, clinicProfile);
      ticketItem.itemType = 'TICKET';
      ticketItem.paidAmount = ticketItem.total || 0;
      ticketItem.remainingAmount = 0;
      initialItems.push(ticketItem);
    }
    initialItems.push({
      description: 'Comprehensive Dental Examination',
      tooth: 'General',
      qty: 1,
      unitPrice: 500,
      total: 500,
      paidAmount: 500,
      remainingAmount: 0,
      itemType: 'PROCEDURE'
    });
    setItems(initialItems);
    const initialSubtotal = initialItems.reduce((s, it) => s + (it.total || 0), 0);
    setDiscount(0);
    setTaxPercent(0);
    setSettlementOption('full');
    setPaidAmount(initialSubtotal);
    setLinkDrawerCategory(null);
    setModalOpen(true);
  };

  const handlePatientSelectChange = (newPatId) => {
    setInvoicePatientId(newPatId);
    const target = patients.find(p => p.id === newPatId);
    if (!target) return;
    const assessment = assessTicketValidity(target, clinicProfile);
    if (assessment.enabled) {
      const ticketItem = createTicketInvoiceItem(assessment, clinicProfile);
      ticketItem.itemType = 'TICKET';
      ticketItem.paidAmount = ticketItem.total || 0;
      ticketItem.remainingAmount = 0;
      const otherItems = items.filter(i => !i.isTicket && i.itemType !== 'TICKET');
      const newItems = [ticketItem, ...otherItems];
      setItems(newItems);
      updatePaidForNewItems(newItems);
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
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total !== undefined ? item.total : (item.unitPrice || 0)) || 0), 0);
  const taxAmount = ((subtotal - discount) * (taxPercent || 0)) / 100;
  const grandTotal = Math.max(0, subtotal - discount + taxAmount);
  const balance = Math.max(0, grandTotal - (paidAmount || 0));

  const handleAddItem = () => {
    const updated = [
      ...items,
      {
        description: 'Dental Procedure',
        tooth: 'General',
        qty: 1,
        unitPrice: 1000,
        total: 1000,
        paidAmount: 1000,
        remainingAmount: 0,
        itemType: 'CUSTOM'
      }
    ];
    setItems(updated);
    updatePaidForNewItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const prevItem = { ...updated[index] };
    updated[index][field] = value;

    if (field === 'total') {
      const newTot = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      updated[index].total = newTot;
      updated[index].unitPrice = newTot === '' ? 0 : newTot;
      updated[index].qty = 1;
      const numNewTot = newTot === '' ? 0 : newTot;
      const prevTot = parseFloat(prevItem.total) || 0;
      const prevPaid = parseFloat(prevItem.paidAmount !== undefined ? prevItem.paidAmount : prevTot) || 0;
      if (prevItem.paidAmount === undefined || prevPaid === prevTot || prevPaid === 0) {
        updated[index].paidAmount = newTot;
        updated[index].remainingAmount = 0;
      } else {
        const clampedPaid = Math.min(numNewTot, prevPaid);
        updated[index].paidAmount = clampedPaid;
        updated[index].remainingAmount = Math.max(0, numNewTot - clampedPaid);
      }
    } else if (field === 'paidAmount') {
      const tot = parseFloat(updated[index].total !== undefined ? updated[index].total : (updated[index].unitPrice || 0)) || 0;
      const paid = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
      updated[index].paidAmount = paid;
      const numPaid = paid === '' ? 0 : paid;
      updated[index].remainingAmount = Math.max(0, tot - numPaid);
    }

    setItems(updated);
    updatePaidForNewItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    updatePaidForNewItems(updated);
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const status = balance === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
    const assignedDoc = doctors.find(d => d.id === invoiceDoctorId) || doctors[0];

    const sanitizedItems = items.map(it => {
      const tot = Number(it.total !== undefined ? it.total : (it.unitPrice || 0)) || 0;
      const p = it.paidAmount !== undefined ? (it.paidAmount === '' ? 0 : Number(it.paidAmount) || 0) : tot;
      const rem = Math.max(0, tot - p);
      return {
        ...it,
        qty: 1,
        unitPrice: tot,
        total: tot,
        paidAmount: p,
        remainingAmount: rem
      };
    });

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    onAddInvoice(invoicePatientId, {
      items: sanitizedItems,
      subtotal,
      discount: Number(discount) || 0,
      taxPercent: Number(taxPercent) || 0,
      taxAmount,
      total: grandTotal,
      paid: Number(paidAmount) || 0,
      balance,
      status,
      paymentMethod,
      date: now.toISOString().split('T')[0],
      time: formattedTime,
      createdAt: now.toISOString(),
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
      text = `Dear *${patient.name}*,\n\nHere is your official *Dental Treatment Tax Invoice & Receipt* from *${clinicProfile.name || 'Apex Dental'}*:\n\n📄 *Invoice No:* #${targetInv.invoiceNumber}\n📅 *Billing Date & Time:* ${targetInv.date}${getInvoiceTime(targetInv) ? ` (${getInvoiceTime(targetInv)})` : ''}\n\n🦷 *Treatments / Procedures:*\n${itemsSummary}\n\n💰 *Total Amount:* ${currency} ${(targetInv.total || 0).toLocaleString()}\n✅ *Amount Paid:* ${currency} ${(targetInv.paid || 0).toLocaleString()} (${targetInv.status})\n${targetInv.balance > 0 ? `⚠️ *Balance Due:* ${currency} ${targetInv.balance.toLocaleString()}\n` : ''}💳 *Payment Method:* ${targetInv.paymentMethod || 'Fonepay / Cash'}${doctorInfo}\n\n🔗 *Online Invoice Auto Link:*\n${clientAutoLink}\n\n📎 *Note:* Your official A4 Invoice PDF has been downloaded as *${filename}*. Please find the attached document.\n\nThank you for trusting ${clinicProfile.name || 'Apex Dental'} with your smile! For queries, call ${clinicProfile.phone || '+977 98012 34567'}.`;
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

  const printPatientPrescriptions = activePrintPatient?.prescriptions || [];
  const activeRx = printPatientPrescriptions.find(r => r.id === selectedRxId) || printPatientPrescriptions[0] || null;

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

          {/* View Mode Toggle: List View (Default) vs Grid View */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Display: List View vs Grid View */}
      <div className="no-print">
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                {/* Card Top: Invoice #, Status & Receipt */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg text-center flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-mono font-bold">{inv.invoiceNumber}</span>
                      </div>
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
                    </div>

                    {inv.receiptNumber && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono truncate max-w-[130px]">
                        #{inv.receiptNumber}
                      </span>
                    )}
                  </div>

                  {/* Patient Info & Ticket Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900">{inv.patientName}</h4>
                    <span className="text-xs text-slate-500 font-mono">({inv.patientId})</span>
                    {inv.items?.some(i => i.isTicket && Number(i.unitPrice || 0) > 0) && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        OPD Ticket
                      </span>
                    )}
                    {inv.items?.some(i => i.isTicket && Number(i.unitPrice || 0) === 0) && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Waived Revisit
                      </span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="text-xs text-slate-600 mt-2 line-clamp-2" title={inv.items?.map(i => i.description?.trim()).filter(Boolean).join(', ')}>
                    <span className="text-slate-400">Items: </span>
                    <strong className="text-slate-800 font-semibold">
                      {inv.items?.map(i => i.description?.trim()).filter(Boolean).join(', ') || 'General Dental Treatment'}
                    </strong>
                  </div>

                  {/* Metadata: Date, Generated Time, Method, Doctor */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span>Date: {inv.date}</span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        Time: {getInvoiceTime(inv)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span>Method: {inv.paymentMethod}</span>
                      {inv.doctorName && (
                        <span className="text-blue-700 font-semibold flex items-center gap-1 truncate max-w-[150px]">
                          <Stethoscope className="w-3 h-3" />
                          Dr: {inv.doctorName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Financials & Action Buttons */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl mb-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Billed</div>
                      <div className="text-base font-black text-slate-900">{currency} {inv.total?.toLocaleString()}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div>
                        Paid: <span className="text-emerald-600 font-bold">{currency} {inv.paid?.toLocaleString()}</span>
                      </div>
                      {inv.balance > 0 ? (
                        <div className="text-red-600 font-bold">
                          Due: {currency} {inv.balance?.toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-emerald-700 font-semibold text-[10px]">
                          Fully Settled
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenPrintPreview(inv)}
                      className="flex items-center justify-center space-x-1 px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition cursor-pointer"
                      title="Print single patient A4 invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print A4</span>
                    </button>

                    <button
                      onClick={() => handleCardWhatsAppPdf(inv)}
                      className="flex items-center justify-center space-x-1 px-2 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition shadow-xs cursor-pointer truncate"
                      title="Generate PDF, download to device, and launch WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {allInvoices.map((inv) => (
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
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Time: {getInvoiceTime(inv)}
                      </span>
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
            ))}
          </div>
        )}
      </div>

      {/* A4 PRINT PREVIEW MODAL */}
      {printInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto invoice-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden invoice-modal-dialog">
            {/* Modal Controls Bar (Hidden in Print) */}
            <div className="bg-slate-900 px-6 py-3 text-white no-print border-b border-slate-800 space-y-2.5">
              {/* Header Title & Top-Right Close Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-sm tracking-wide">Printable A4 Patient Tax Invoice</span>
                </div>

                {/* Close Button Shifted to Right Top Side */}
                <button
                  type="button"
                  onClick={() => setPrintInvoice(null)}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700 shadow-sm"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Format Toggle & Attending Doctor Selector & Print/WhatsApp actions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/60">
                <div className="flex flex-wrap items-center gap-2">
                  {/* 1-Page Combined vs Bill Only Toggle */}
                  <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPrintDocFormat('combined')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
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
                      className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
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
                  {printDocFormat === 'combined' && printPatientPrescriptions.length > 1 && (
                    <div className="flex items-center space-x-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700">
                      <span className="text-[10px] text-slate-300 font-medium">Rx:</span>
                      <select
                        value={selectedRxId}
                        onChange={(e) => setSelectedRxId(e.target.value)}
                        className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer max-w-[130px] truncate"
                      >
                        {printPatientPrescriptions.map(rx => (
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
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerPrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5 transition cursor-pointer"
                    title="Print to printer or PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print A4</span>
                  </button>

                  {/* WhatsApp Button near Print */}
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppPdf(printInvoice)}
                    disabled={downloadingPdf}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-md flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer"
                    title="Export PDF, download to PC, and launch WhatsApp chat with patient"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-950" />
                    <span>{downloadingPdf ? 'Exporting PDF...' : 'Send PDF via WhatsApp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition flex items-center space-x-1 cursor-pointer"
                    title="Download A4 PDF file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
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
                          {getInvoiceTime(printInvoice) && (
                            <span className="ml-1.5 text-slate-500 font-sans font-normal">
                              ({getInvoiceTime(printInvoice)})
                            </span>
                          )}
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
                            <th className="p-1.5 w-24 text-right border-r border-slate-200">Total ({currency})</th>
                            <th className="p-1.5 w-24 text-right border-r border-slate-200">Paid ({currency})</th>
                            <th className="p-1.5 w-24 text-right">Remaining ({currency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {printInvoice.items?.map((item, idx) => {
                            const tot = Number(item.total !== undefined ? item.total : (item.unitPrice || 0)) || 0;
                            const paid = item.paidAmount !== undefined ? (item.paidAmount === '' ? 0 : Number(item.paidAmount) || 0) : (item.paid !== undefined ? Number(item.paid) || 0 : tot);
                            const rem = item.remainingAmount !== undefined ? Number(item.remainingAmount) || 0 : Math.max(0, tot - paid);

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-1.5 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                                <td className="p-1.5 font-bold text-slate-900 border-r border-slate-200">{item.description}</td>
                                <td className="p-1.5 text-center font-mono text-slate-600 border-r border-slate-200">{item.tooth || 'General'}</td>
                                <td className="p-1.5 text-right font-mono text-slate-700 border-r border-slate-200">{tot.toLocaleString()}</td>
                                <td className="p-1.5 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">{paid.toLocaleString()}</td>
                                <td className="p-1.5 text-right font-mono font-bold text-slate-900">{rem > 0 ? rem.toLocaleString() : '0 (Settled)'}</td>
                              </tr>
                            );
                          })}
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
                        {getInvoiceTime(printInvoice) && (
                          <span className="ml-1.5 text-slate-500 font-sans font-normal">
                            ({getInvoiceTime(printInvoice)})
                          </span>
                        )}
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
                          <th className="p-2.5 w-28 text-right border-r border-slate-200">Total ({currency})</th>
                          <th className="p-2.5 w-28 text-right border-r border-slate-200">Paid Amount ({currency})</th>
                          <th className="p-2.5 w-28 text-right">Remaining Due ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {printInvoice.items?.map((item, idx) => {
                          const tot = Number(item.total !== undefined ? item.total : (item.unitPrice || 0)) || 0;
                          const paid = item.paidAmount !== undefined ? (item.paidAmount === '' ? 0 : Number(item.paidAmount) || 0) : (item.paid !== undefined ? Number(item.paid) || 0 : tot);
                          const rem = item.remainingAmount !== undefined ? Number(item.remainingAmount) || 0 : Math.max(0, tot - paid);

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2.5 text-center font-bold text-slate-400 border-r border-slate-200">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{item.description}</td>
                              <td className="p-2.5 text-center font-mono text-slate-600 border-r border-slate-200">{item.tooth || 'General'}</td>
                              <td className="p-2.5 text-right font-mono text-slate-700 border-r border-slate-200">
                                {tot.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                                {paid.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                {rem > 0 ? rem.toLocaleString() : '0 (Settled)'}
                              </td>
                            </tr>
                          );
                        })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-xs my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Generate Patient Dental Bill & Invoice</span>
                    {currentPatient && (
                      <span className="text-[11px] font-mono bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20 font-normal">
                        MRN: {currentPatient.id}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Link OPD tickets, pharmacy dispenses, dental lab orders & clinical procedures into a single itemized bill
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Linking Toast Alert */}
            {linkingToast && (
              <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-between animate-fadeIn shadow-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{linkingToast}</span>
                </div>
                <button type="button" onClick={() => setLinkingToast(null)} className="text-white/80 hover:text-white">✕</button>
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Row 1: Patient & Attending Doctor Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Select Patient *
                  </label>
                  <select
                    value={invoicePatientId}
                    onChange={(e) => handlePatientSelectChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id}) — {p.phone || 'No phone'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Attending Dental Surgeon *
                  </label>
                  <select
                    value={invoiceDoctorId}
                    onChange={(e) => setInvoiceDoctorId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty || d.qualification || 'Dental Surgeon'}) — Reg: {d.regNumber || 'NMC'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient Insight Metadata Strip */}
              {currentPatient && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium">
                    <span>Patient: <strong className="text-slate-900 font-bold">{currentPatient.name}</strong></span>
                    <span>•</span>
                    <span>MRN: <strong className="font-mono text-slate-900">{currentPatient.id}</strong></span>
                    <span>•</span>
                    <span>Age/Gender: <strong className="text-slate-900">{currentPatient.age || '--'} yrs / {currentPatient.gender || '--'}</strong></span>
                    <span>•</span>
                    <span>Phone: <strong className="font-mono text-slate-900">{currentPatient.phone || 'N/A'}</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {ticketAssessment.enabled && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        ticketAssessment.status === 'VALID_REVISIT'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : ticketAssessment.status === 'EXPIRED'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        🎟️ {ticketAssessment.badgeText}
                      </span>
                    )}
                    {patientOrders.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
                        🧪 {patientOrders.length} Lab Order{patientOrders.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {(patientPharmacySales.length > 0 || patientPrescriptions.length > 0) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-800 border border-purple-300">
                        💊 {patientPharmacySales.length} Pharm Sale{patientPharmacySales.length > 1 ? 's' : ''} & {patientPrescriptions.length} Rx
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ---------------------------------------------------------------------- */}
              {/* INTERACTIVE BILL LINKING COMMAND CENTER                                */}
              {/* ---------------------------------------------------------------------- */}
              <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-blue-50/60 border border-emerald-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs tracking-tight flex items-center gap-2">
                        <span>Link Patient Bills & Services to this Invoice</span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-200 text-emerald-900">
                          {currentPatient?.name}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Import OPD registration tickets, pharmacy bills, dental lab orders, or planned treatments with 1 click
                      </p>
                    </div>
                  </div>

                  {/* ⚡ Master Action: Link All Available Charges */}
                  <button
                    type="button"
                    onClick={handleLinkAllAvailableCharges}
                    className="px-3.5 py-1.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
                    title="Import all unbilled patient records into line items"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    <span>Link All Available Charges</span>
                  </button>
                </div>

                {/* Quick Category Action Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60">
                  {/* 1. OPD Ticket Link Pill */}
                  {ticketAssessment.enabled && (
                    <button
                      type="button"
                      onClick={handleToggleTicket}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                        isTicketLinked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>
                        {isTicketLinked ? '✓ Ticket Linked' : `+ Link OPD Ticket (${ticketAssessment.status === 'VALID_REVISIT' ? 'Free $0' : `${currency} ${ticketAssessment.fee}`})`}
                      </span>
                    </button>
                  )}

                  {/* 2. Pharmacy Bills & Prescriptions Pill */}
                  <button
                    type="button"
                    onClick={() => setLinkDrawerCategory(linkDrawerCategory === 'pharmacy' ? null : 'pharmacy')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      linkDrawerCategory === 'pharmacy'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : patientPharmacySales.length > 0 || patientPrescriptions.length > 0
                        ? 'bg-white hover:bg-purple-50 text-purple-900 border-purple-300'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      Pharmacy & Rx ({patientPharmacySales.length + patientPrescriptions.length})
                    </span>
                    {linkDrawerCategory === 'pharmacy' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* 3. Dental Lab Orders Pill */}
                  <button
                    type="button"
                    onClick={() => setLinkDrawerCategory(linkDrawerCategory === 'orders' ? null : 'orders')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      linkDrawerCategory === 'orders'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : patientOrders.length > 0
                        ? 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Dental Lab Orders ({patientOrders.length})
                    </span>
                    {linkDrawerCategory === 'orders' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* 4. Treatment Plans Pill */}
                  <button
                    type="button"
                    onClick={() => setLinkDrawerCategory(linkDrawerCategory === 'plans' ? null : 'plans')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      linkDrawerCategory === 'plans'
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : patientTreatmentPlans.length > 0
                        ? 'bg-white hover:bg-teal-50 text-teal-900 border-teal-300'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      Treatment Plans ({patientTreatmentPlans.length})
                    </span>
                    {linkDrawerCategory === 'plans' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* 5. Treatment Catalog Picker Pill */}
                  <button
                    type="button"
                    onClick={() => setLinkDrawerCategory(linkDrawerCategory === 'catalog' ? null : 'catalog')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      linkDrawerCategory === 'catalog'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white hover:bg-blue-50 text-blue-900 border-blue-300'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ From Treatment Catalog</span>
                    {linkDrawerCategory === 'catalog' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* EXPANDABLE CATEGORY LINKING DRAWER                            */}
                {/* ------------------------------------------------------------- */}
                {linkDrawerCategory && (
                  <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm space-y-3 animate-fadeIn">
                    {/* DRAWER: PHARMACY BILLS & PRESCRIPTIONS */}
                    {linkDrawerCategory === 'pharmacy' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Pill className="w-4 h-4 text-purple-600" />
                            <span>Pharmacy Sales & Prescribed Medications for {currentPatient?.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setLinkDrawerCategory(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                          >
                            Close Drawer ✕
                          </button>
                        </div>

                        {/* Pharmacy Sales Section */}
                        {patientPharmacySales.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Pharmacy Dispense Receipts ({patientPharmacySales.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {patientPharmacySales.map((sale) => {
                                const linked = isPharmacySaleLinked(sale.id);
                                return (
                                  <div
                                    key={sale.id}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                      linked ? 'bg-purple-50/70 border-purple-300' : 'bg-slate-50 border-slate-200 hover:border-purple-200'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-slate-900 truncate">
                                        Receipt #{sale.receiptNumber}
                                      </div>
                                      <div className="text-[11px] text-slate-500 truncate">
                                        {(sale.items || []).map(i => `${i.medicineName} (x${i.quantity})`).join(', ') || 'Medications'}
                                      </div>
                                      <div className="text-[11px] font-mono font-bold text-purple-700 mt-0.5">
                                        {currency} {(sale.totalAmount || 0).toLocaleString()}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleLinkPharmacySale(sale)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                        linked
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
                                      }`}
                                    >
                                      {linked ? '✓ Linked' : '+ Link Sale'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            No recorded pharmacy sales for this patient ID/phone.
                          </div>
                        )}

                        {/* Prescribed Medicines Section */}
                        {patientPrescriptions.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Prescribed Medications (Rx)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {patientPrescriptions.flatMap(rx => (rx.medicines || []).map((med, mIdx) => {
                                const sId = `${rx.id}_${med.name}`;
                                const linked = items.some(i => i.sourceId === sId);
                                return (
                                  <div
                                    key={`${rx.id}-${mIdx}`}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                      linked ? 'bg-purple-50/70 border-purple-300' : 'bg-slate-50 border-slate-200 hover:border-purple-200'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-slate-900 truncate">{med.name}</div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {med.dosage || ''} • {med.frequency || 'Daily'} • {med.duration || ''}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleLinkPrescriptionMed(rx, med)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                        linked
                                          ? 'bg-purple-600 text-white'
                                          : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
                                      }`}
                                    >
                                      {linked ? '✓ Linked' : '+ Link Med'}
                                    </button>
                                  </div>
                                );
                              }))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRAWER: DENTAL LAB ORDERS */}
                    {linkDrawerCategory === 'orders' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <FlaskConical className="w-4 h-4 text-amber-600" />
                            <span>Dental Lab Orders for {currentPatient?.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setLinkDrawerCategory(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                          >
                            Close Drawer ✕
                          </button>
                        </div>

                        {patientOrders.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {patientOrders.map((order) => {
                              const linked = isOrderLinked(order.id);
                              return (
                                <div
                                  key={order.id}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                    linked ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200 hover:border-amber-200'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-slate-900 truncate">
                                      {order.orderType} — {order.toothOrImplantDetails || 'General'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate">
                                      {order.materials || order.clinicalSpecifications || 'Custom Work'}
                                    </div>
                                    <div className="text-[11px] font-mono font-bold text-amber-800 mt-0.5 flex flex-wrap items-center gap-1.5">
                                      <span>{currency} {(order.cost || 0).toLocaleString()} • Status: {order.paymentStatus || 'Pending'}</span>
                                      {Number(order.paidAmount) > 0 && (
                                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                                          Paid: {currency} {Number(order.paidAmount).toLocaleString()}
                                        </span>
                                      )}
                                      {order.balanceDue !== undefined && Number(order.balanceDue) < Number(order.cost) && (
                                        <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-bold">
                                          Due: {currency} {Number(order.balanceDue).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleLinkOrder(order)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                      linked
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                                    }`}
                                  >
                                    {linked ? '✓ Linked' : '+ Link Order'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            No active dental lab orders recorded for this patient.
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRAWER: TREATMENT PLANS */}
                    {linkDrawerCategory === 'plans' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-teal-600" />
                            <span>Treatment Plans for {currentPatient?.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setLinkDrawerCategory(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                          >
                            Close Drawer ✕
                          </button>
                        </div>

                        {patientTreatmentPlans.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {patientTreatmentPlans.map((plan) => {
                              const linked = isPlanLinked(plan.id);
                              return (
                                <div
                                  key={plan.id}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                    linked ? 'bg-teal-50/70 border-teal-300' : 'bg-slate-50 border-slate-200 hover:border-teal-200'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-slate-900 truncate">
                                      {plan.title}
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                      Status: {plan.status || 'In Progress'}
                                    </div>
                                    <div className="text-[11px] font-mono font-bold text-teal-800 mt-0.5">
                                      Estimated: {currency} {(plan.estimatedCost || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleLinkPlan(plan)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                                      linked
                                        ? 'bg-teal-600 text-white'
                                        : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
                                    }`}
                                  >
                                    {linked ? '✓ Linked' : '+ Link Plan'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            No active treatment plans recorded for this patient.
                          </div>
                        )}
                      </div>
                    )}

                    {/* DRAWER: TREATMENT CATALOG PICKER */}
                    {linkDrawerCategory === 'catalog' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-blue-600" />
                            <span>Clinic Treatment Catalog (Quick Import)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setLinkDrawerCategory(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                          >
                            Close Drawer ✕
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search treatment catalog (e.g. Scaling, Root Canal, Crown, Filling)..."
                              value={catalogSearch}
                              onChange={(e) => setCatalogSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                          {(treatmentCatalog || [])
                            .filter(t => !catalogSearch.trim() || t.name?.toLowerCase().includes(catalogSearch.toLowerCase()) || t.category?.toLowerCase().includes(catalogSearch.toLowerCase()))
                            .map(trt => (
                              <button
                                key={trt.id}
                                type="button"
                                onClick={() => handleAddCatalogTreatment(trt)}
                                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition flex items-center justify-between gap-1.5 group"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 truncate group-hover:text-blue-900">{trt.name}</div>
                                  <div className="text-[10px] text-slate-500">{trt.category || 'Clinical'}</div>
                                </div>
                                <div className="text-[11px] font-mono font-bold text-blue-700 whitespace-nowrap">
                                  {currency} {(trt.defaultCost || 0).toLocaleString()}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------------------------- */}
              {/* RE-ARRANGED PROCEDURES & LINE ITEMS TABLE                              */}
              {/* ---------------------------------------------------------------------- */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="font-extrabold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Procedures & Billed Line Items ({items.length})</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Custom Line</span>
                    </button>
                  </div>
                </div>

                {/* Structured Table Container */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      {/* Table Header */}
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider select-none">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center text-slate-400">#</th>
                          <th className="py-2.5 px-3 min-w-[200px]">Procedure / Service Description</th>
                          <th className="py-2.5 px-2 w-28 text-center">Type / Source</th>
                          <th className="py-2.5 px-2 w-20 text-center">Tooth / Site</th>
                          <th className="py-2.5 px-3 w-28 text-right">Total Amount ({currency})</th>
                          <th className="py-2.5 px-3 w-28 text-right">Paid Amount ({currency})</th>
                          <th className="py-2.5 px-3 w-28 text-right">Remaining Due ({currency})</th>
                          <th className="py-2.5 px-2 w-8 text-center"></th>
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-8 text-center text-slate-400 italic">
                              No procedures added yet. Click "+ Add Custom Line" or use the linking buttons above.
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => {
                            const isTicket = item.isTicket || item.itemType === 'TICKET';
                            const isPharm = item.itemType === 'PHARMACY';
                            const isOrder = item.itemType === 'ORDER';
                            const isPlan = item.itemType === 'PLAN';
                            const itemTot = Number(item.total !== undefined ? item.total : (item.unitPrice || 0)) || 0;
                            const itemPaid = item.paidAmount !== undefined ? (item.paidAmount === '' ? 0 : Number(item.paidAmount) || 0) : itemTot;
                            const itemRem = Math.max(0, itemTot - itemPaid);

                            return (
                              <tr
                                key={idx}
                                className={`transition-colors ${
                                  isTicket
                                    ? item.isWaived
                                      ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                                      : 'bg-blue-50/40 hover:bg-blue-50/60'
                                    : isPharm
                                    ? 'bg-purple-50/30 hover:bg-purple-50/50'
                                    : isOrder
                                    ? 'bg-amber-50/30 hover:bg-amber-50/50'
                                    : isPlan
                                    ? 'bg-teal-50/30 hover:bg-teal-50/50'
                                    : 'hover:bg-slate-50/70'
                                }`}
                              >
                                {/* # Column */}
                                <td className="py-2.5 px-3 text-center text-slate-400 font-bold font-mono">
                                  {idx + 1}
                                </td>

                                {/* Description Column */}
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    placeholder="Procedure / service description"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-2xs"
                                  />
                                </td>

                                {/* Type / Source Badge Column */}
                                <td className="py-2 px-2 text-center whitespace-nowrap">
                                  {isTicket ? (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                      item.isWaived
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-blue-100 text-blue-800 border-blue-300'
                                    }`}>
                                      {item.isWaived ? '✨ Free Revisit' : '🎟️ OPD Ticket'}
                                    </span>
                                  ) : isPharm ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                                      💊 Pharmacy
                                    </span>
                                  ) : isOrder ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                      🧪 Dental Order
                                    </span>
                                  ) : isPlan ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                                      📋 Treatment Plan
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                      🦷 Clinical
                                    </span>
                                  )}
                                </td>

                                {/* Tooth / Site Column */}
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    placeholder="e.g. #16"
                                    value={item.tooth}
                                    onChange={(e) => handleItemChange(idx, 'tooth', e.target.value)}
                                    className="w-full px-2 py-1.5 text-center rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-2xs"
                                  />
                                </td>

                                {/* Total Amount Column */}
                                <td className="py-2 px-2.5">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="0"
                                    value={item.total !== undefined ? item.total : (item.unitPrice || 0)}
                                    onChange={(e) => handleItemChange(idx, 'total', e.target.value)}
                                    className="w-full px-2 py-1.5 text-right rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-2xs"
                                  />
                                </td>

                                {/* Paid Amount Column */}
                                <td className="py-2 px-2.5">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="0"
                                    value={item.paidAmount !== undefined ? item.paidAmount : itemTot}
                                    onChange={(e) => handleItemChange(idx, 'paidAmount', e.target.value)}
                                    className="w-full px-2 py-1.5 text-right rounded-lg border-2 border-emerald-300 bg-white font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-2xs"
                                  />
                                </td>

                                {/* Remaining Due Column */}
                                <td className="py-2 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className={`font-mono font-black text-xs ${itemRem > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                      {itemRem > 0 ? `${currency} ${itemRem.toLocaleString()}` : '✓ Nil (0)'}
                                    </span>
                                    {itemRem > 0 && (
                                      <button
                                        type="button"
                                        title="Pay full for this procedure"
                                        onClick={() => handleItemChange(idx, 'paidAmount', itemTot)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition shadow-2xs"
                                      >
                                        Pay
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Action Column */}
                                <td className="py-2 px-2 text-center">
                                  {items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(idx)}
                                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition"
                                      title="Remove item"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------------------------- */}
              {/* RE-ARRANGED FINANCIAL CALCULATIONS & PAYMENT SECTION                   */}
              {/* ---------------------------------------------------------------------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
                {/* Left Side: Payment Method & Collection */}
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Payment Collection & Settlement
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Gateway / Method:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 text-xs"
                    >
                      <option value="Fonepay QR / eSewa">Fonepay QR / eSewa (Instant)</option>
                      <option value="Fonepay QR">Fonepay QR (Direct Merchant)</option>
                      <option value="eSewa">eSewa Mobile Wallet</option>
                      <option value="Khalti">Khalti Digital Wallet</option>
                      <option value="IME Pay">IME Pay</option>
                      <option value="ConnectIPS">ConnectIPS / NPI</option>
                      <option value="Cash">Cash at Counter</option>
                      <option value="Mobile Banking">Mobile Banking / Bank Transfer</option>
                      <option value="Debit / Credit Card">Debit / Credit / POS Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Amount Paid Now ({currency}):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="flex-1 p-2 rounded-xl border-2 border-emerald-400 bg-white font-mono font-black text-emerald-800 text-sm shadow-2xs focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSettlementOption('full');
                          setPaidAmount(grandTotal);
                          setItems(items.map(it => {
                            const tot = Number(it.total !== undefined ? it.total : (it.unitPrice || 0)) || 0;
                            return { ...it, paidAmount: tot, remainingAmount: 0 };
                          }));
                        }}
                        className="px-2.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] transition whitespace-nowrap shadow-2xs"
                      >
                        Pay Full
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSettlementOption('unpaid');
                          setPaidAmount(0);
                          setItems(items.map(it => {
                            const tot = Number(it.total !== undefined ? it.total : (it.unitPrice || 0)) || 0;
                            return { ...it, paidAmount: 0, remainingAmount: tot };
                          }));
                        }}
                        className="px-2.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] transition whitespace-nowrap shadow-2xs"
                      >
                        Unpaid
                      </button>
                    </div>
                  </div>

                  {/* Payment Status Pill */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">Payment Settlement Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                      balance === 0
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : Number(paidAmount) > 0
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-red-100 text-red-900 border-red-300'
                    }`}>
                      {balance === 0 ? '✓ PAID IN FULL' : Number(paidAmount) > 0 ? '⚠️ PARTIAL PAYMENT' : '✕ UNPAID / DUE'}
                    </span>
                  </div>
                </div>

                {/* Right Side: Totals, Discounts, VAT & Balance Due with Subtraction */}
                <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex justify-between font-semibold text-slate-600 text-xs">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-900 font-bold">{currency} {subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Discount ({currency}):</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={discount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="w-28 p-1.5 text-right rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Tax / VAT (%):</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={taxPercent}
                      onChange={(e) => handleTaxChange(e.target.value)}
                      className="w-28 p-1.5 text-right rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 shadow-2xs"
                    />
                  </div>

                  {taxAmount > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Calculated VAT:</span>
                      <span className="font-mono">{currency} {taxAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                    <span className="font-black text-slate-900 text-xs uppercase">Final Settlement Amount:</span>
                    <span className="font-mono font-black text-emerald-800 text-base">
                      {currency} {grandTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-slate-600 font-medium">Amount Paid Now:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      - {currency} {Number(paidAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-slate-600 text-xs">Remaining Balance Due:</span>
                    <span className={`font-mono text-sm font-black ${balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {balance > 0 ? `${currency} ${balance.toLocaleString()}` : '✓ Nil (Settled)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Generate Invoice & Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
