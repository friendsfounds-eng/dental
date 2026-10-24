import React, { useState, useEffect, useRef } from 'react';
import {
  Boxes,
  Plus,
  Search,
  ShoppingCart,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  Package,
  Calendar,
  User,
  Trash2,
  Printer,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Building,
  RefreshCw,
  QrCode,
  Tag,
  Truck,
  RotateCcw
} from 'lucide-react';
import { openWhatsAppAutoLink } from '../../utils/whatsapp';

export default function PharmacyManager({
  clinicProfile = {},
  patients = [],
  authToken,
  activeTenant,
  currentUser,
  onOpenWhatsApp
}) {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'catalog' | 'inventory' | 'purchasing' | 'adjustments' | 'reports'
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Pharmacy State
  const [overview, setOverview] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Modals
  const [addMedModal, setAddMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [addBatchModal, setAddBatchModal] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);

  // Filters
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'NEAR_EXPIRY' | 'EXPIRED' | 'LOW_STOCK'
  const [batchSearch, setBatchSearch] = useState('');

  // POS State
  const [posSearch, setPosSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [posNotes, setPosNotes] = useState('');

  // Forms
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    brand: '',
    category: 'Antibiotic',
    strength: '',
    dosageForm: 'Tablet',
    barcode: '',
    supplier: '',
    purchasePrice: 0,
    sellingPrice: 0,
    reorderThreshold: 20,
    storageLocation: 'Shelf A-1'
  });

  const [batchForm, setBatchForm] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: 50,
    purchasePrice: 0,
    sellingPrice: 0,
    expiryDate: '',
    storageLocation: 'Main Rack',
    supplierInvoice: ''
  });

  const [purchaseForm, setPurchaseForm] = useState({
    supplier: '',
    supplierInvoice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    items: [
      {
        medicineId: '',
        batchNumber: '',
        expiryDate: '',
        quantity: 50,
        purchasePrice: 0,
        sellingPrice: 0,
        storageLocation: 'Shelf A-1'
      }
    ]
  });

  const [adjForm, setAdjForm] = useState({
    batchId: '',
    type: 'DAMAGED',
    quantity: -1,
    reason: ''
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : '',
    'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
  };

  const currency = clinicProfile.currency || 'Rs.';

  const fetchPharmacyData = async () => {
    try {
      setLoading(true);
      const [resOver, resCat, resBatches, resSales, resPurch, resAdj, resSupp] = await Promise.all([
        fetch('/api/pharmacy/overview', { headers }).then(r => r.json()),
        fetch('/api/pharmacy/catalog', { headers }).then(r => r.json()),
        fetch('/api/pharmacy/batches', { headers }).then(r => r.json()),
        fetch('/api/pharmacy/sales', { headers }).then(r => r.json()),
        fetch('/api/pharmacy/purchases', { headers }).then(r => r.json()),
        fetch('/api/pharmacy/adjustments', { headers }).then(r => r.json()),
        fetch('/api/pharmacy/suppliers', { headers }).then(r => r.json())
      ]);

      setOverview(resOver);
      setCatalog(Array.isArray(resCat) ? resCat : []);
      setBatches(Array.isArray(resBatches) ? resBatches : []);
      setSales(Array.isArray(resSales) ? resSales : []);
      setPurchases(Array.isArray(resPurch) ? resPurch : []);
      setAdjustments(Array.isArray(resAdj) ? resAdj : []);
      setSuppliers(Array.isArray(resSupp) ? resSupp : []);
    } catch (err) {
      console.error('Error fetching pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, [authToken, activeTenant?.id]);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  // ==========================================
  // POS ACTIONS & SAFEGUARDS
  // ==========================================

  // Add Item to POS Cart (Recommending FEFO)
  const handleAddToCart = (medicine, preferredBatch = null) => {
    const activeBatches = (medicine.batches || []).filter(b => b.status !== 'EXPIRED' && b.quantity > 0);

    if (activeBatches.length === 0) {
      alert(`⚠️ No sellable stock available for [${medicine.name}]. Active batches are depleted or expired.`);
      return;
    }

    // Default to earliest expiring batch (FEFO)
    const targetBatch = preferredBatch || activeBatches[0];

    // Check if batch is expired
    if (new Date(targetBatch.expiryDate) < new Date()) {
      alert(`⛔ SAFETY BLOCK: Batch ${targetBatch.batchNumber} has expired on ${targetBatch.expiryDate}. Expired stock cannot be sold.`);
      return;
    }

    // Check if already in cart
    const existingIndex = cart.findIndex(c => c.batchId === targetBatch.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > targetBatch.quantity) {
        alert(`Maximum stock reached for batch ${targetBatch.batchNumber} (${targetBatch.quantity} available).`);
        return;
      }
      setCart(cart.map((c, i) => i === existingIndex ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([
        ...cart,
        {
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          brand: medicine.brand,
          strength: medicine.strength,
          dosageForm: medicine.dosageForm,
          batchId: targetBatch.id,
          batchNumber: targetBatch.batchNumber,
          expiryDate: targetBatch.expiryDate,
          maxQuantity: targetBatch.quantity,
          quantity: 1,
          unitPrice: targetBatch.sellingPrice || medicine.sellingPrice
        }
      ]);
    }
  };

  const handleUpdateCartQty = (batchId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.batchId === batchId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.maxQuantity) {
          alert(`Cannot exceed available batch stock of ${item.maxQuantity}.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveCartItem = (batchId) => {
    setCart(prev => prev.filter(c => c.batchId !== batchId));
  };

  // Calculate POS totals
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const discountAmount = Math.round(cartSubtotal * (discountPercent / 100) * 100) / 100;
  const cartTotal = Math.round((cartSubtotal - discountAmount) * 100) / 100;

  // Process POS Sale
  const handleCheckoutSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty.');
      return;
    }

    let patientName = walkinName || 'Walk-in Customer';
    let patientPhone = walkinPhone || '';

    if (selectedPatientId) {
      const p = patients.find(pt => pt.id === selectedPatientId);
      if (p) {
        patientName = p.name;
        patientPhone = p.phone || '';
      }
    }

    try {
      const res = await fetch('/api/pharmacy/sales', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patientId: selectedPatientId || null,
          patientName,
          patientPhone,
          items: cart.map(c => ({
            medicineId: c.medicineId,
            medicineName: c.medicineName,
            batchId: c.batchId,
            quantity: c.quantity,
            unitPrice: c.unitPrice
          })),
          discountPercent,
          paymentMethod,
          notes: posNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Sale failed');
      }

      showToastMsg(`✅ Sale completed! Receipt #${data.receiptNumber} issued for ${currency} ${data.totalAmount}`);
      setReceiptModal(data);
      setCart([]);
      setDiscountPercent(0);
      setPosNotes('');
      setWalkinName('');
      setWalkinPhone('');
      setSelectedPatientId('');
      fetchPharmacyData();
    } catch (err) {
      alert(`[POS Sale Error] ${err.message}`);
    }
  };

  // ==========================================
  // CATALOG ACTIONS
  // ==========================================
  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    try {
      const url = editingMed ? `/api/pharmacy/catalog/${editingMed.id}` : '/api/pharmacy/catalog';
      const method = editingMed ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(medForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save medicine');

      showToastMsg(`✅ Medicine [${data.name}] saved successfully!`);
      setAddMedModal(false);
      setEditingMed(null);
      setMedForm({
        name: '', genericName: '', brand: '', category: 'Antibiotic',
        strength: '', dosageForm: 'Tablet', barcode: '', supplier: '',
        purchasePrice: 0, sellingPrice: 0, reorderThreshold: 20, storageLocation: 'Shelf A-1'
      });
      fetchPharmacyData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // PURCHASING INWARD DELIVERY
  // ==========================================
  const handleAddPurchaseLine = () => {
    setPurchaseForm({
      ...purchaseForm,
      items: [
        ...purchaseForm.items,
        {
          medicineId: catalog[0]?.id || '',
          batchNumber: '',
          expiryDate: '',
          quantity: 50,
          purchasePrice: 0,
          sellingPrice: 0,
          storageLocation: 'Shelf A-1'
        }
      ]
    });
  };

  const handleReceiveDelivery = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplier || purchaseForm.items.length === 0) {
      alert('Supplier and items required.');
      return;
    }

    try {
      const res = await fetch('/api/pharmacy/purchases', {
        method: 'POST',
        headers,
        body: JSON.stringify(purchaseForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delivery inward failed');

      showToastMsg(`✅ Delivery inward receipt #${data.supplierInvoice} recorded! Stock incremented.`);
      setPurchaseModal(false);
      fetchPharmacyData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // STOCK ADJUSTMENTS / RETURNS
  // ==========================================
  const handleRecordAdjustment = async (e) => {
    e.preventDefault();
    if (!adjForm.batchId || !adjForm.reason) {
      alert('Batch and documented clinical reason required.');
      return;
    }

    try {
      const res = await fetch('/api/pharmacy/adjustments', {
        method: 'POST',
        headers,
        body: JSON.stringify(adjForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Adjustment failed');

      showToastMsg(`✅ Stock adjusted: ${data.quantity > 0 ? '+' : ''}${data.quantity} units for [${data.medicineName}]. New Qty: ${data.newQty}`);
      setAdjustmentModal(false);
      setAdjForm({ batchId: '', type: 'DAMAGED', quantity: -1, reason: '' });
      fetchPharmacyData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredCatalog = catalog.filter(m => {
    const matchesSearch =
      (m.name && m.name.toLowerCase().includes(catalogSearch.toLowerCase())) ||
      (m.genericName && m.genericName.toLowerCase().includes(catalogSearch.toLowerCase())) ||
      (m.brand && m.brand.toLowerCase().includes(catalogSearch.toLowerCase())) ||
      (m.barcode && m.barcode.includes(catalogSearch));
    const matchesCat = catalogCategory === 'ALL' || m.category === catalogCategory;
    return matchesSearch && matchesCat;
  });

  const filteredBatches = batches.filter(b => {
    const matchesSearch =
      (b.batchNumber && b.batchNumber.toLowerCase().includes(batchSearch.toLowerCase())) ||
      (b.medicineName && b.medicineName.toLowerCase().includes(batchSearch.toLowerCase())) ||
      (b.brand && b.brand.toLowerCase().includes(batchSearch.toLowerCase()));

    if (batchFilter === 'ACTIVE') return matchesSearch && b.status === 'ACTIVE';
    if (batchFilter === 'NEAR_EXPIRY') return matchesSearch && b.status === 'NEAR_EXPIRY';
    if (batchFilter === 'EXPIRED') return matchesSearch && b.status === 'EXPIRED';
    if (batchFilter === 'LOW_STOCK') {
      const med = catalog.find(m => m.id === b.medicineId);
      return matchesSearch && med && med.isLowStock;
    }
    return matchesSearch;
  });

  const categories = ['ALL', ...new Set(catalog.map(m => m.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="p-3.5 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-fadeIn border border-emerald-400/40">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500 text-slate-950 uppercase tracking-wider">
              Pharmacy & Stock Management
            </span>
            <span className="text-teal-300 font-mono text-xs font-semibold flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              {clinicProfile.name || 'Nepal Dental Wellness Centre'}
            </span>
            <span className="bg-white/10 text-teal-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Batch Tracking • Expiry Guard • FEFO
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-1.5 flex items-center gap-2">
            <span>Clinical Pharmacy Operations</span>
            <span className="text-base text-teal-400 font-mono">({catalog.length} Formularies)</span>
          </h2>
          <p className="text-xs text-teal-100/80 mt-1 max-w-2xl leading-relaxed">
            Dispense prescriptions, maintain medicine batches, track low stock, enforce strict expiry safeguards, and receive supplier deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setMedForm({
                name: '', genericName: '', brand: '', category: 'Antibiotic',
                strength: '', dosageForm: 'Tablet', barcode: '', supplier: '',
                purchasePrice: 0, sellingPrice: 0, reorderThreshold: 20, storageLocation: 'Shelf A-1'
              });
              setEditingMed(null);
              setAddMedModal(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </button>

          <button
            onClick={() => setPurchaseModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20"
          >
            <Truck className="w-3.5 h-3.5 text-teal-300" />
            <span>Receive Delivery</span>
          </button>

          <button
            onClick={() => setAdjustmentModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-white/20"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Real-time Valuation & Alert Metrics Bar */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock Units</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{overview.totalStockUnits.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-medium">{overview.totalBatches} Active Batches</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Value (Cost)</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{currency} {overview.inventoryValuationCost.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-medium">Retail: {currency} {overview.inventoryValuationRetail.toLocaleString()}</span>
          </div>

          {/* Low Stock Indicator Pill */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setBatchFilter('LOW_STOCK');
            }}
            className="p-3.5 bg-white hover:bg-amber-50/50 rounded-2xl border border-amber-200 shadow-2xs cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Low Stock Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-700 mt-0.5">{overview.lowStockCount}</div>
            <span className="text-[10px] text-amber-600 font-semibold group-hover:underline">Needs Replenishing →</span>
          </div>

          {/* Near Expiry Indicator Pill */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setBatchFilter('NEAR_EXPIRY');
            }}
            className="p-3.5 bg-white hover:bg-yellow-50/50 rounded-2xl border border-yellow-200 shadow-2xs cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Near Expiry (&lt;60d)</span>
              <Clock className="w-3.5 h-3.5 text-yellow-600" />
            </div>
            <div className="text-xl font-black text-yellow-700 mt-0.5">{overview.nearExpiryCount}</div>
            <span className="text-[10px] text-yellow-700 font-semibold group-hover:underline">Dispense Soon →</span>
          </div>

          {/* Expired Stock Safeguard Indicator */}
          <div
            onClick={() => {
              setActiveTab('inventory');
              setBatchFilter('EXPIRED');
            }}
            className="p-3.5 bg-red-50 hover:bg-red-100/70 rounded-2xl border border-red-300 shadow-2xs cursor-pointer transition group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Expired Stock</span>
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-xl font-black text-red-700 mt-0.5">{overview.expiredCount}</div>
            <span className="text-[10px] text-red-700 font-bold group-hover:underline">⛔ Quarantined / Blocked</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Today's Revenue</span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">{currency} {overview.todayRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-medium">{overview.todaySalesCount} Prescriptions</span>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto no-print">
        {[
          { id: 'pos', label: 'Pharmacy POS (Dispense & Sale)', icon: ShoppingCart, highlight: true },
          { id: 'catalog', label: `Medicine Catalog (${catalog.length})`, icon: Package },
          { id: 'inventory', label: `Inventory & Expiry Tracker (${batches.length})`, icon: Boxes },
          { id: 'purchasing', label: `Supplier Inward (${purchases.length})`, icon: Truck },
          { id: 'adjustments', label: `Adjustments & Returns (${adjustments.length})`, icon: RotateCcw },
          { id: 'reports', label: 'Valuation & Audit Reports', icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PHARMACY POS (DISPENSE & SALES) */}
      {/* ========================================================================= */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Product Search & Medicine Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-teal-600" />
                  <span>Medicine Search & Barcode Lookup</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">FEFO Batch Prioritized</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Scan barcode or type medicine name (e.g. Augmentin, Zerodol, Ketorol)..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 text-xs font-semibold"
                />
              </div>

              {/* Medicine Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                {catalog
                  .filter(m =>
                    (m.name && m.name.toLowerCase().includes(posSearch.toLowerCase())) ||
                    (m.genericName && m.genericName.toLowerCase().includes(posSearch.toLowerCase())) ||
                    (m.brand && m.brand.toLowerCase().includes(posSearch.toLowerCase())) ||
                    (m.barcode && m.barcode.includes(posSearch))
                  )
                  .map(med => {
                    const activeBatches = (med.batches || []).filter(b => b.status !== 'EXPIRED' && b.quantity > 0);
                    const expiredBatches = (med.batches || []).filter(b => b.status === 'EXPIRED');
                    const hasStock = activeBatches.length > 0;
                    const primaryBatch = activeBatches[0]; // Earliest expiry (FEFO)

                    return (
                      <div
                        key={med.id}
                        className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                          hasStock
                            ? 'bg-slate-50 hover:bg-white hover:border-teal-400 border-slate-200 shadow-2xs'
                            : 'bg-slate-100 border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.2 rounded font-mono">
                                {med.dosageForm} • {med.strength}
                              </span>
                              <h4 className="text-xs font-black text-slate-900 mt-1 leading-snug">{med.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium truncate">{med.genericName}</p>
                            </div>
                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              {currency} {med.sellingPrice}
                            </span>
                          </div>

                          {/* Batch Expiry Tag */}
                          <div className="mt-2 text-[10px] space-y-0.5">
                            {primaryBatch ? (
                              <div className="flex items-center justify-between text-slate-600">
                                <span>Batch: <strong className="font-mono">{primaryBatch.batchNumber}</strong></span>
                                <span className={`font-bold ${primaryBatch.status === 'NEAR_EXPIRY' ? 'text-yellow-700' : 'text-emerald-700'}`}>
                                  Exp: {primaryBatch.expiryDate}
                                </span>
                              </div>
                            ) : expiredBatches.length > 0 ? (
                              <div className="text-red-600 font-bold flex items-center space-x-1">
                                <ShieldAlert className="w-3 h-3" />
                                <span>All batches expired ({expiredBatches[0].batchNumber})</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold">Out of Stock</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500">
                            Available: <strong>{med.totalStock}</strong> units
                          </span>

                          <button
                            type="button"
                            disabled={!hasStock}
                            onClick={() => handleAddToCart(med, primaryBatch)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-black transition flex items-center space-x-1 ${
                              hasStock
                                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-2xs'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Dispense</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right: POS Dispense Order & Receipt Checkout (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Dispense Cart</h3>
                    <p className="text-[10px] text-slate-500">{cart.length} Prescription Items</p>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-red-600 hover:text-red-700 font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Patient Selection */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Patient / Customer</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    if (e.target.value) {
                      const p = patients.find(pt => pt.id === e.target.value);
                      if (p) {
                        setWalkinName(p.name);
                        setWalkinPhone(p.phone || '');
                      }
                    } else {
                      setWalkinName('');
                      setWalkinPhone('');
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                >
                  <option value="">-- Walk-in Customer (Manual Name) --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone} • {p.id})
                    </option>
                  ))}
                </select>

                {!selectedPatientId && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="Walk-in Customer Name"
                      value={walkinName}
                      onChange={(e) => setWalkinName(e.target.value)}
                      className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Phone / WhatsApp"
                      value={walkinPhone}
                      onChange={(e) => setWalkinPhone(e.target.value)}
                      className="p-1.5 rounded-lg border border-slate-300 text-xs bg-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                    <Package className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                    <p className="font-semibold">No items added to dispense cart.</p>
                    <p className="text-[10px]">Select medicines from the left to prepare sale.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.batchId} className="pt-2 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{item.medicineName}</div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1.5">
                          <span>Batch: <strong>{item.batchNumber}</strong></span>
                          <span>•</span>
                          <span className="text-teal-700">Exp: {item.expiryDate}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold mt-0.5">
                          {currency} {item.unitPrice} × {item.quantity} = <strong>{currency} {(item.quantity * item.unitPrice).toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.batchId, -1)}
                            className="px-2 py-0.5 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono font-bold text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.batchId, 1)}
                            className="px-2 py-0.5 hover:bg-slate-200 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(item.batchId)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Totals & Checkout Panel */}
              {cart.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">{currency} {cartSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Discount (%):</span>
                    <div className="flex items-center space-x-1">
                      {[0, 5, 10, 15].map(pct => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPercent(pct)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            discountPercent === pct
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 font-bold">
                      <span>Discount Saved:</span>
                      <span className="font-mono">-{currency} {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-700">
                    <span>Payment Method:</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="p-1 rounded border border-slate-300 text-xs font-semibold bg-white"
                    >
                      <option value="Cash">Cash (Counter)</option>
                      <option value="Fonepay QR">Fonepay QR Code</option>
                      <option value="eSewa">eSewa Mobile Wallet</option>
                      <option value="Khalti">Khalti Digital Wallet</option>
                      <option value="Card">Debit / Credit Card</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                      <span className="text-lg font-black font-mono text-emerald-400">
                        {currency} {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCheckoutSale}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center space-x-1"
                    >
                      <span>Complete Sale</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEDICINE CATALOG & PRICING */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Prescription Formularies & Stock Catalog
              </h3>
              <p className="text-xs text-slate-500">
                Formulations, generic composition, barcode mapping, purchase/sale pricing, and reorder triggers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMedForm({
                    name: '', genericName: '', brand: '', category: 'Antibiotic',
                    strength: '', dosageForm: 'Tablet', barcode: '', supplier: '',
                    purchasePrice: 0, sellingPrice: 0, reorderThreshold: 20, storageLocation: 'Shelf A-1'
                  });
                  setEditingMed(null);
                  setAddMedModal(true);
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search generic, brand, or barcode..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatalogCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    catalogCategory === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Medicine & Generic</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Strength & Form</th>
                  <th className="p-3">Barcode</th>
                  <th className="p-3">Purchase Price</th>
                  <th className="p-3">Selling Price</th>
                  <th className="p-3">Margin</th>
                  <th className="p-3">Active Stock</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCatalog.map(m => {
                  const marginPct = m.sellingPrice > 0 ? Math.round(((m.sellingPrice - m.purchasePrice) / m.sellingPrice) * 100) : 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate max-w-xs">{m.genericName || '—'}</div>
                        <div className="text-[10px] text-teal-700 font-bold">{m.brand || 'Generic'}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{m.strength || '—'}</div>
                        <div className="text-[10px] text-slate-500">{m.dosageForm}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-500 text-[10px]">
                        {m.barcode || '—'}
                      </td>
                      <td className="p-3 font-mono text-slate-700 font-semibold">
                        {currency} {Number(m.purchasePrice).toFixed(2)}
                      </td>
                      <td className="p-3 font-mono text-slate-900 font-bold">
                        {currency} {Number(m.sellingPrice).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.2 rounded font-bold text-[10px] ${
                          marginPct >= 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {marginPct}%
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-black text-sm ${m.isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                            {m.totalStock}
                          </span>
                          <span className="text-[10px] text-slate-400">/ min {m.reorderThreshold}</span>
                        </div>
                        {m.isLowStock && (
                          <span className="inline-block bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5">
                            ⚠️ Low Stock
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditingMed(m);
                            setMedForm({ ...m });
                            setAddMedModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVENTORY & EXPIRY TRACKER */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Batch Inventory & Expiry Watch
              </h3>
              <p className="text-xs text-slate-500">
                Track exact lot numbers, locations, shelf life, and automated expiry quarantines.
              </p>
            </div>

            <button
              onClick={() => setAddBatchModal(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Batch</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: `All Batches (${batches.length})` },
              { id: 'ACTIVE', label: '🟢 Healthy (>60d)' },
              { id: 'NEAR_EXPIRY', label: `🟡 Near Expiry (${overview?.nearExpiryCount || 0})` },
              { id: 'EXPIRED', label: `⛔ Expired Quarantined (${overview?.expiredCount || 0})` },
              { id: 'LOW_STOCK', label: `⚠️ Below Reorder Level (${overview?.lowStockCount || 0})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setBatchFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  batchFilter === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Batches Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Batch / Lot #</th>
                  <th className="p-3">Medicine Name</th>
                  <th className="p-3">Available Stock</th>
                  <th className="p-3">Storage Location</th>
                  <th className="p-3">Cost Price</th>
                  <th className="p-3">Retail Price</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredBatches.map(b => (
                  <tr key={b.id} className={`hover:bg-slate-50/70 ${b.status === 'EXPIRED' ? 'bg-red-50/40' : ''}`}>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {b.batchNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{b.medicineName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.dosageForm} • {b.strength}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-black text-sm text-slate-900">{b.quantity}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">init: {b.initialQuantity}</span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 font-medium">
                      {b.storageLocation || 'General Rack'}
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {currency} {Number(b.purchasePrice).toFixed(2)}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {currency} {Number(b.sellingPrice).toFixed(2)}
                    </td>
                    <td className="p-3 font-mono font-bold">
                      <div className={b.status === 'EXPIRED' ? 'text-red-700' : b.status === 'NEAR_EXPIRY' ? 'text-yellow-700' : 'text-slate-800'}>
                        {b.expiryDate}
                      </div>
                      <div className="text-[10px] font-normal text-slate-400">
                        {b.daysToExpiry < 0 ? `${Math.abs(b.daysToExpiry)} days ago` : `in ${b.daysToExpiry} days`}
                      </div>
                    </td>
                    <td className="p-3">
                      {b.status === 'EXPIRED' ? (
                        <span className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg text-[10px] uppercase shadow-2xs">
                          ⛔ Expired
                        </span>
                      ) : b.status === 'NEAR_EXPIRY' ? (
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-900 border border-yellow-300 font-bold rounded-lg text-[10px] uppercase">
                          ⚠️ Near Expiry
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-[10px] uppercase">
                          🟢 Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPLIER INWARD PURCHASING */}
      {/* ========================================================================= */}
      {activeTab === 'purchasing' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Supplier Delivery Orders & Stock Inward
              </h3>
              <p className="text-xs text-slate-500">
                Track supplier invoices, incoming pharmaceutical stock, and automatically increment batches.
              </p>
            </div>

            <button
              onClick={() => setPurchaseModal(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Receive New Delivery</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Items Count</th>
                  <th className="p-3">Total Inward Cost</th>
                  <th className="p-3">Received By</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-400">
                      No supplier inward receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  purchases.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-slate-800">{p.purchaseDate}</td>
                      <td className="p-3 font-bold text-slate-900">{p.supplier}</td>
                      <td className="p-3 font-mono text-blue-600 font-bold">{p.supplierInvoice}</td>
                      <td className="p-3 font-bold">{p.items?.length || 0} Batches</td>
                      <td className="p-3 font-mono font-black text-slate-900">
                        {currency} {Number(p.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-slate-600">{p.receivedBy || 'Staff'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: RETURNS & STOCK ADJUSTMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Stock Adjustments, Returns & Write-Offs
              </h3>
              <p className="text-xs text-slate-500">
                Audited ledger for damaged items, expired write-offs, physical count adjustments, and customer returns.
              </p>
            </div>

            <button
              onClick={() => setAdjustmentModal(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Adjustment</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Medicine & Batch</th>
                  <th className="p-3">Adjustment Type</th>
                  <th className="p-3">Quantity Delta</th>
                  <th className="p-3">Previous Qty</th>
                  <th className="p-3">New Qty</th>
                  <th className="p-3">Documented Reason</th>
                  <th className="p-3">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-400">
                      No stock adjustments or write-offs on record.
                    </td>
                  </tr>
                ) : (
                  adjustments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {new Date(a.date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{a.medicineName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Batch: {a.batchNumber}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.type === 'DAMAGED' ? 'bg-red-100 text-red-800' :
                          a.type === 'EXPIRED_WRITE_OFF' ? 'bg-purple-100 text-purple-800' :
                          a.type === 'PATIENT_RETURN' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {a.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-black text-sm">
                        <span className={a.quantity < 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {a.quantity > 0 ? `+${a.quantity}` : a.quantity}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{a.previousQty}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{a.newQty}</td>
                      <td className="p-3 text-slate-700 italic max-w-xs">{a.reason}</td>
                      <td className="p-3 font-medium text-slate-700">{a.adjustedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: REPORTS & VALUATION AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Valuation (Cost)</span>
              <div className="text-2xl font-black text-slate-900">{currency} {overview.inventoryValuationCost.toLocaleString()}</div>
              <p className="text-[11px] text-slate-500">Based on active stock unit purchase prices.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Retail Valuation</span>
              <div className="text-2xl font-black text-teal-700">{currency} {overview.inventoryValuationRetail.toLocaleString()}</div>
              <p className="text-[11px] text-emerald-600 font-bold">Projected Gross Margin: {currency} {overview.potentialMargin.toLocaleString()}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Invoiced</span>
              <div className="text-2xl font-black text-blue-700">{overview.totalSalesCount} Transactions</div>
              <p className="text-[11px] text-slate-500">Today: {overview.todaySalesCount} sales ({currency} {overview.todayRevenue.toLocaleString()})</p>
            </div>
          </div>

          {/* Low Stock Replenishment Schedule */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Urgent Stock Replenishment Order Required</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Medicine</th>
                    <th className="p-2.5">Current Stock</th>
                    <th className="p-2.5">Reorder Level</th>
                    <th className="p-2.5">Deficit</th>
                    <th className="p-2.5">Preferred Supplier</th>
                    <th className="p-2.5">Estimated PO Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalog.filter(m => m.isLowStock).map(m => {
                    const deficit = Math.max(0, m.reorderThreshold - m.totalStock);
                    return (
                      <tr key={m.id}>
                        <td className="p-2.5 font-bold text-slate-900">{m.name} ({m.strength})</td>
                        <td className="p-2.5 font-black text-amber-700">{m.totalStock} units</td>
                        <td className="p-2.5 font-mono text-slate-600">{m.reorderThreshold}</td>
                        <td className="p-2.5 font-bold text-red-600">-{deficit}</td>
                        <td className="p-2.5 text-slate-600">{m.supplier || 'Omni Healthcare Logistics'}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          {currency} {(deficit * m.purchasePrice).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT MEDICINE */}
      {/* ========================================================================= */}
      {addMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {editingMed ? 'Edit Medicine Formulation' : 'Add New Medicine to Catalog'}
              </h3>
              <button onClick={() => setAddMedModal(false)} className="text-white/70 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveMedicine} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Medicine Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg"
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Generic Composition</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin 500mg + Clavulanate 125mg"
                    value={medForm.genericName}
                    onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Manufacturer / Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. GSK, Sun Pharma, Ipca"
                    value={medForm.brand}
                    onChange={(e) => setMedForm({ ...medForm, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Therapeutic Category *</label>
                  <select
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Analgesic & Anti-inflammatory">Analgesic & Anti-inflammatory</option>
                    <option value="NSAID / Severe Dental Pain">NSAID / Severe Dental Pain</option>
                    <option value="Antacid / PPI">Antacid / PPI</option>
                    <option value="Antiseptic Oral Rinse">Antiseptic Oral Rinse</option>
                    <option value="Topical Corticosteroid">Topical Corticosteroid</option>
                    <option value="Local Anaesthesia">Local Anaesthesia</option>
                    <option value="Haemostatic Agent">Haemostatic Agent</option>
                    <option value="Other Dental Medicine">Other Dental Medicine</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Dosage Form *</label>
                  <select
                    value={medForm.dosageForm}
                    onChange={(e) => setMedForm({ ...medForm, dosageForm: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Dispersible Tablet">Dispersible Tablet</option>
                    <option value="Liquid Mouthwash">Liquid Mouthwash</option>
                    <option value="Oral Paste">Oral Paste</option>
                    <option value="Injection Cartridge">Injection Cartridge</option>
                    <option value="Gel">Gel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Strength / Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 625 mg, 160ml, 5g tube"
                    value={medForm.strength}
                    onChange={(e) => setMedForm({ ...medForm, strength: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Barcode / SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. 8901083001234"
                    value={medForm.barcode}
                    onChange={(e) => setMedForm({ ...medForm, barcode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Purchase Cost ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={medForm.purchasePrice}
                    onChange={(e) => setMedForm({ ...medForm, purchasePrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Selling Retail Price ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={medForm.sellingPrice}
                    onChange={(e) => setMedForm({ ...medForm, sellingPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-teal-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reorder Alert Threshold</label>
                  <input
                    type="number"
                    value={medForm.reorderThreshold}
                    onChange={(e) => setMedForm({ ...medForm, reorderThreshold: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A-1, Cold Box"
                    value={medForm.storageLocation}
                    onChange={(e) => setMedForm({ ...medForm, storageLocation: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddMedModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-md"
                >
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECEIVE SUPPLIER DELIVERY (PURCHASE INWARD) */}
      {/* ========================================================================= */}
      {purchaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-300" />
                <span>Receive Supplier Inward Delivery</span>
              </h3>
              <button onClick={() => setPurchaseModal(false)} className="text-white/70 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleReceiveDelivery} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Supplier Distributor *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Omni Healthcare, Nepal Pharma"
                    value={purchaseForm.supplier}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Supplier Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-90412"
                    value={purchaseForm.supplierInvoice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierInvoice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Delivery Received Date</label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.purchaseDate}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Items Line Entries */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 uppercase tracking-wider">Inward Medicine Batches</span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseLine}
                    className="text-xs text-teal-600 font-bold hover:underline"
                  >
                    + Add Another Item
                  </button>
                </div>

                {purchaseForm.items.map((line, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Medicine</label>
                      <select
                        value={line.medicineId}
                        onChange={(e) => {
                          const items = [...purchaseForm.items];
                          items[idx].medicineId = e.target.value;
                          const med = catalog.find(m => m.id === e.target.value);
                          if (med) {
                            items[idx].purchasePrice = med.purchasePrice;
                            items[idx].sellingPrice = med.sellingPrice;
                          }
                          setPurchaseForm({ ...purchaseForm, items });
                        }}
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                      >
                        <option value="">-- Select Medicine --</option>
                        {catalog.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Batch #</label>
                      <input
                        type="text"
                        required
                        placeholder="LOT-26A"
                        value={line.batchNumber}
                        onChange={(e) => {
                          const items = [...purchaseForm.items];
                          items[idx].batchNumber = e.target.value;
                          setPurchaseForm({ ...purchaseForm, items });
                        }}
                        className="w-full p-1.5 rounded-lg border border-slate-300 font-mono uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={line.expiryDate}
                        onChange={(e) => {
                          const items = [...purchaseForm.items];
                          items[idx].expiryDate = e.target.value;
                          setPurchaseForm({ ...purchaseForm, items });
                        }}
                        className="w-full p-1.5 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Qty Recv</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={line.quantity}
                        onChange={(e) => {
                          const items = [...purchaseForm.items];
                          items[idx].quantity = e.target.value;
                          setPurchaseForm({ ...purchaseForm, items });
                        }}
                        className="w-full p-1.5 rounded-lg border border-slate-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit Cost ({currency})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.purchasePrice}
                        onChange={(e) => {
                          const items = [...purchaseForm.items];
                          items[idx].purchasePrice = e.target.value;
                          setPurchaseForm({ ...purchaseForm, items });
                        }}
                        className="w-full p-1.5 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black shadow-md"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STOCK ADJUSTMENT / RETURN */}
      {/* ========================================================================= */}
      {adjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-amber-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-300" />
                <span>Record Stock Adjustment or Return</span>
              </h3>
              <button onClick={() => setAdjustmentModal(false)} className="text-white/70 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleRecordAdjustment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Batch to Adjust *</label>
                <select
                  required
                  value={adjForm.batchId}
                  onChange={(e) => setAdjForm({ ...adjForm, batchId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="">-- Select Batch & Medicine --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.medicineName} • Batch: {b.batchNumber} (Current Qty: {b.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Reason Category *</label>
                  <select
                    value={adjForm.type}
                    onChange={(e) => setAdjForm({ ...adjForm, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="DAMAGED">Damaged / Broken Packaging</option>
                    <option value="EXPIRED_WRITE_OFF">Expired Stock Write-Off</option>
                    <option value="INVENTORY_VARIANCE">Physical Count Variance</option>
                    <option value="PATIENT_RETURN">Patient Return (Unopened)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Quantity Change (+/-) *</label>
                  <input
                    type="number"
                    required
                    placeholder="-5 or +10"
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Use negative for write-off, positive for return.</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Documented Reason & Clinical Explanation *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Broken vial during storage rearrangement, audited by pharmacist..."
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustmentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md"
                >
                  Confirm & Write to Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PHARMACY POS RECEIPT & PRINTABLE INVOICE */}
      {/* ========================================================================= */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <span className="text-xs font-black uppercase tracking-wider">Pharmacy Tax Invoice & Receipt</span>
              <button onClick={() => setReceiptModal(null)} className="text-white/70 hover:text-white font-bold">✕</button>
            </div>

            {/* Printable Receipt Body */}
            <div id="pharmacy-receipt-print" className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-0.5">
                <h3 className="font-black text-sm text-slate-900 uppercase">
                  {clinicProfile.name || 'Nepal Dental Wellness Centre'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Department of Clinical Pharmacy & Formulary</p>
                <p className="text-[10px] text-slate-500 font-mono">PAN/VAT: {clinicProfile.panVat || '601987654'}</p>
                <p className="text-[10px] text-slate-500">{clinicProfile.address || 'Kathmandu, Nepal'}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                <span>Receipt: <strong>{receiptModal.receiptNumber}</strong></span>
                <span>{new Date(receiptModal.date).toLocaleDateString()}</span>
              </div>

              <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>Patient: <strong>{receiptModal.patientName}</strong></div>
                {receiptModal.patientPhone && <div>Phone: {receiptModal.patientPhone}</div>}
                <div>Dispensed By: <strong>{receiptModal.staffName}</strong></div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 divide-y divide-slate-100">
                {receiptModal.items.map((item, i) => (
                  <div key={i} className="pt-1.5 flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{item.medicineName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Batch: {item.batchNumber} | Exp: {item.expiryDate}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        {currency} {item.unitPrice} × {item.quantity}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {currency} {item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-dashed border-slate-300 space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{currency} {receiptModal.subtotal.toFixed(2)}</span>
                </div>
                {receiptModal.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>Discount ({receiptModal.discountPercent}%):</span>
                    <span>-{currency} {receiptModal.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Paid ({receiptModal.paymentMethod}):</span>
                  <span className="text-teal-700">{currency} {receiptModal.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-200">
                Thank you! Please store medicines below 25°C in a dry place. Complete full antibiotic course as advised.
              </div>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 no-print">
              {receiptModal.patientPhone && (
                <button
                  onClick={() => {
                    const text = `Namaste *${receiptModal.patientName}*,\n\nHere is your digital Pharmacy Receipt from *${clinicProfile.name || 'Nepal Dental Wellness Centre'}*:\n📄 Receipt #: *${receiptModal.receiptNumber}*\n💰 Total Paid: *${currency} ${receiptModal.totalAmount}*\n💳 Payment Method: *${receiptModal.paymentMethod}*\n\nItems Dispensed:\n${receiptModal.items.map(it => `• ${it.medicineName} (${it.quantity} units, Batch: ${it.batchNumber})`).join('\n')}\n\nWishing you good health!`;
                    openWhatsAppAutoLink(receiptModal.patientPhone, text);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition ml-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
