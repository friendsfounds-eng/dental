import React, { useState, useEffect } from 'react';
import { exportToA4Pdf } from '../../utils/pdfExport';
import {
  Pill,
  Plus,
  Printer,
  MessageSquare,
  Sparkles,
  Trash2,
  FileCheck,
  Download,
  CheckCircle,
  FileText,
  FilePlus,
  RefreshCw,
  Search,
  Check,
  PenTool,
  Clock,
  Calendar,
  AlertCircle,
  Building,
  Settings,
  Boxes,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Store,
  Layers,
  HelpCircle,
  Edit2,
  X,
  Eye,
  Layout,
  Zap,
  User,
  HeartPulse,
  Tag,
  Stethoscope,
  ChevronDown
} from 'lucide-react';

// Popular dental medicines for rapid writing suggestions & fallback
const DENTAL_COMMON_MEDICINES = [
  {
    name: 'Augmentin 625mg',
    genericName: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
    category: 'Antibiotic',
    dosage: '625 mg',
    dosageForm: 'Tablet',
    frequency: '1 tablet twice daily (1-0-1)',
    duration: '5 days',
    instructions: 'Take after meals. Complete full course.'
  },
  {
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotic',
    dosage: '500 mg',
    dosageForm: 'Capsule',
    frequency: '1 capsule thrice daily (1-1-1)',
    duration: '5 days',
    instructions: 'Take after food. Stop if allergic rash appears.'
  },
  {
    name: 'Metrogyl 400mg',
    genericName: 'Metronidazole',
    category: 'Antibiotic',
    dosage: '400 mg',
    dosageForm: 'Tablet',
    frequency: '1 tablet thrice daily (1-1-1)',
    duration: '5 days',
    instructions: 'Take strictly after food. Avoid alcohol strictly.'
  },
  {
    name: 'Zerodol-SP',
    genericName: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg',
    category: 'Analgesic',
    dosage: '100/325/15 mg',
    dosageForm: 'Tablet',
    frequency: '1 tablet twice daily (1-0-1)',
    duration: '3 days',
    instructions: 'Take after food for dental pain & swelling.'
  },
  {
    name: 'Ketorol DT 10mg',
    genericName: 'Ketorolac Tromethamine',
    category: 'Analgesic',
    dosage: '10 mg Dispersible',
    dosageForm: 'Dispersible Tablet',
    frequency: '1 tablet SOS (when pain is severe)',
    duration: '2-3 days',
    instructions: 'Disperse in 1/2 glass of water. Take after meals.'
  },
  {
    name: 'Brufen 400mg',
    genericName: 'Ibuprofen',
    category: 'Analgesic',
    dosage: '400 mg',
    dosageForm: 'Tablet',
    frequency: '1 tablet thrice daily (1-1-1)',
    duration: '3 days',
    instructions: 'Take with food or milk to avoid acidity.'
  },
  {
    name: 'Dolo 650mg',
    genericName: 'Paracetamol',
    category: 'Analgesic',
    dosage: '650 mg',
    dosageForm: 'Tablet',
    frequency: '1 tablet every 6 hours SOS',
    duration: '3 days',
    instructions: 'For pain or fever after procedure.'
  },
  {
    name: 'Pantocid 40mg',
    genericName: 'Pantoprazole Sodium',
    category: 'Gastro',
    dosage: '40 mg',
    dosageForm: 'Tablet',
    frequency: '1 tablet once daily morning (1-0-0)',
    duration: '5 days',
    instructions: 'Take 30 mins before breakfast on empty stomach.'
  },
  {
    name: 'Hexidine Mouthwash 160ml',
    genericName: 'Chlorhexidine Gluconate 0.2% w/v',
    category: 'Mouthwash',
    dosage: '10 ml',
    dosageForm: 'Liquid Mouthwash',
    frequency: 'Twice daily morning & night',
    duration: '10 days',
    instructions: 'Rinse vigorously for 1 minute then spit. Do not swallow.'
  },
  {
    name: 'Kenacort 0.1% Oral Paste',
    genericName: 'Triamcinolone Acetonide',
    category: 'Topical',
    dosage: 'Small dab',
    dosageForm: 'Oral Paste',
    frequency: '2-3 times daily after food',
    duration: '5 days',
    instructions: 'Apply gently on ulcer/aphthae. Do not rub.'
  }
];

// Quick diagnosis presets for dentists
const DENTAL_DIAGNOSIS_PRESETS = [
  'Acute Irreversible Pulpitis #16',
  'Chronic Generalized Periodontitis',
  'Periapical Abscess with Swelling',
  'Symptomatic Impacted 3rd Molar #38',
  'Post-Extraction Surgical Care',
  'Aphthous Ulceration & Stomatitis',
  'Deep Dentinal Caries #46'
];

// Intelligent defaults based on drug name, dosageForm, and category
const mapDosageDefaults = (med) => {
  const form = (med.dosageForm || '').toLowerCase();
  const name = (med.name || '').toLowerCase();
  const cat = (med.category || '').toLowerCase();

  let frequency = '1 tablet twice daily (1-0-1)';
  let duration = '5 days';
  let instructions = 'Take strictly after meals';
  let dosage = med.strength || '1 unit';

  if (form.includes('mouthwash') || form.includes('rinse')) {
    dosage = '10 ml';
    frequency = 'Twice daily morning & night';
    duration = '10 days';
    instructions = 'Rinse vigorously for 1 minute then spit. Do not swallow or eat for 20 mins.';
  } else if (form.includes('paste') || form.includes('gel') || form.includes('topical')) {
    dosage = 'Small dab';
    frequency = '2-3 times daily after food';
    duration = '5 days';
    instructions = 'Apply gently over affected area. Avoid eating or drinking for 30 mins.';
  } else if (name.includes('ketorol') || name.includes('pain') || cat.includes('nsaid') || cat.includes('severe')) {
    frequency = '1 tablet SOS (when pain is severe)';
    duration = '2-3 days';
    instructions = form.includes('dispersible')
      ? 'Disperse in 1/2 glass of water. Maximum 40mg daily.'
      : 'Take immediately after food with plenty of water.';
  } else if (name.includes('pantocid') || name.includes('panto') || name.includes('omap') || cat.includes('gastro') || cat.includes('antacid') || cat.includes('ppi')) {
    frequency = '1 tablet once daily morning (1-0-0)';
    duration = '5 days';
    instructions = 'Take 30 mins before breakfast on empty stomach.';
  } else if (cat.includes('antibiotic') || name.includes('augmentin') || name.includes('amox') || name.includes('cefixime')) {
    frequency = '1 tablet twice daily (1-0-1)';
    duration = '5 days';
    instructions = 'Take after meals. Complete the full prescribed course without skipping.';
  } else if (name.includes('metrogyl') || name.includes('metro')) {
    frequency = '1 tablet thrice daily (1-1-1)';
    duration = '5 days';
    instructions = 'Take strictly after food. Strictly avoid alcohol.';
  } else if (name.includes('dolo') || name.includes('paracetamol')) {
    frequency = '1 tablet every 6 hours SOS';
    duration = '3 days';
    instructions = 'Take after food for post-op discomfort or mild fever.';
  } else if (form.includes('capsule')) {
    frequency = '1 capsule twice daily (1-0-1)';
    duration = '5 days';
    instructions = 'Swallow whole with a full glass of water after meals.';
  } else if (form.includes('syrup')) {
    dosage = '5 ml';
    frequency = 'Twice daily (1-0-1)';
    duration = '5 days';
    instructions = 'Shake bottle well before measuring dose.';
  }

  return { dosage, frequency, duration, instructions };
};

export default function PrescriptionPad({
  patients = [],
  selectedPatient,
  doctors = [],
  clinicProfile = {},
  medicineFormulary = [],
  pharmacyCatalog = [],
  onRefreshPharmacyCatalog,
  onUpdateClinicProfile,
  onAddPrescription,
  onOpenWhatsApp
}) {
  const [patientId, setPatientId] = useState(selectedPatient?.id || patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || 'DOC-1');
  const [diagnosis, setDiagnosis] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState(null);
  const [padMode, setPadMode] = useState('digital'); // 'digital' | 'blank-paper'
  const [viewMode, setViewMode] = useState('workstation'); // 'workstation' | 'letterhead'
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'rx-sheet' (mobile responsiveness)
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' | 'write'
  const [medicines, setMedicines] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [reviewTimeline, setReviewTimeline] = useState('In 5 days or SOS');

  // Live Pharmacy Medicines State
  const [localPharmacyMeds, setLocalPharmacyMeds] = useState(pharmacyCatalog || []);
  const [refreshingStock, setRefreshingStock] = useState(false);

  // Settings Modal State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [outOfStockModal, setOutOfStockModal] = useState({ open: false, medicine: null });

  // Edit Medicine Modal State
  const [editingMedIndex, setEditingMedIndex] = useState(null);
  const [editingMedData, setEditingMedData] = useState({
    name: '',
    dosage: '1 tablet',
    frequency: '1 tablet twice daily (1-0-1)',
    duration: '5 days',
    instructions: 'Take after meals'
  });

  // Save State: allow only one-time click & show white-shaded saved state
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Read configuration from clinic profile or default
  const rxSettings = {
    syncPharmacyStock: true,
    defaultRxBankView: 'pharmacy-in-stock',
    outOfStockWarning: true,
    hideOutOfStock: false,
    autoFillDosage: true,
    showStockBadges: true,
    allowExternalMedicines: true,
    ...(clinicProfile?.prescriptionSettings || {})
  };

  // Medicine Bank Filters
  const [bankSource, setBankSource] = useState(rxSettings.defaultRxBankView || 'pharmacy-in-stock');
  const [bankCategory, setBankCategory] = useState('all');
  const [bankSearch, setBankSearch] = useState('');

  // Form state for writing / customizing medicine
  const [customMed, setCustomMed] = useState({
    name: '',
    dosage: '1 tablet',
    frequency: '1 tablet twice daily (1-0-1)',
    duration: '5 days',
    instructions: 'Take after meals',
    pharmacyMedId: null,
    totalStock: null,
    inStock: true
  });

  const activePatient = patients.find((p) => p.id === patientId) || patients[0];
  const activeDoctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  // Keep patientId in sync if selectedPatient changes from Navbar/Sidebar
  useEffect(() => {
    if (selectedPatient?.id && selectedPatient.id !== patientId) {
      setPatientId(selectedPatient.id);
      setIsSaved(false);
    }
  }, [selectedPatient]);

  // Keep local pharmacy medicines in sync with incoming props
  useEffect(() => {
    if (pharmacyCatalog && pharmacyCatalog.length > 0) {
      setLocalPharmacyMeds(pharmacyCatalog);
    }
  }, [pharmacyCatalog]);

  // Auto-fetch pharmacy catalog if not provided via props
  useEffect(() => {
    if ((!pharmacyCatalog || pharmacyCatalog.length === 0) && rxSettings.syncPharmacyStock) {
      fetch('/api/pharmacy/available-medicines')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setLocalPharmacyMeds(data);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Refresh live stock handler
  const handleRefreshLiveStock = async () => {
    setRefreshingStock(true);
    try {
      if (onRefreshPharmacyCatalog) {
        const refreshed = await onRefreshPharmacyCatalog();
        if (Array.isArray(refreshed)) setLocalPharmacyMeds(refreshed);
      } else {
        const res = await fetch('/api/pharmacy/available-medicines');
        const data = await res.json();
        if (Array.isArray(data)) setLocalPharmacyMeds(data);
      }
      setPdfToast('🔄 Live Pharmacy Stock & Inventory refreshed successfully!');
      setTimeout(() => setPdfToast(null), 3000);
    } catch (e) {
      console.warn('Error refreshing pharmacy stock:', e);
    } finally {
      setRefreshingStock(false);
    }
  };

  // Quick settings update handler
  const handleSavePrescriptionSettings = (updatedSettings) => {
    const updatedProfile = {
      ...clinicProfile,
      prescriptionSettings: {
        ...rxSettings,
        ...updatedSettings
      }
    };
    if (onUpdateClinicProfile) {
      onUpdateClinicProfile(updatedProfile);
    }
    setPdfToast('⚙️ Prescription & Pharmacy Settings updated!');
    setTimeout(() => setPdfToast(null), 3000);
    setSettingsModalOpen(false);
  };

  // Standard Sample Template
  const handleLoadSampleTemplate = () => {
    setIsSaved(false);
    setMedicines([
      {
        name: 'Augmentin 625mg',
        genericName: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
        dosage: '625 mg',
        frequency: '1 tablet twice daily (1-0-1)',
        duration: '5 days',
        instructions: 'Take strictly after food. Complete full course.',
        inPharmacyStock: true,
        stockCount: 120
      },
      {
        name: 'Zerodol-SP',
        genericName: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg',
        dosage: '100/325/15 mg',
        frequency: '1 tablet twice daily (1-0-1)',
        duration: '3 days',
        instructions: 'Take after meals for pain & inflammation.',
        inPharmacyStock: true,
        stockCount: 85
      },
      {
        name: 'Pantocid 40mg',
        genericName: 'Pantoprazole Sodium',
        dosage: '40 mg',
        frequency: '1 tablet once daily morning (1-0-0)',
        duration: '5 days',
        instructions: 'Take 30 mins before breakfast on empty stomach.',
        inPharmacyStock: true,
        stockCount: 60
      }
    ]);
    setDiagnosis('Deep Dental Caries with Irreversible Pulpitis #16');
    setInstructions('Warm saline gargles 3-4 times daily from tomorrow. Soft diet. Avoid hard or hot food on upper right quadrant.');
    setPadMode('digital');
    setPdfToast('📋 Standard Dental Rx Template loaded with live pharmacy items!');
    setTimeout(() => setPdfToast(null), 3000);
  };

  // Clear to Blank Page
  const handleClearToBlankPage = () => {
    setIsSaved(false);
    setMedicines([]);
    setDiagnosis('');
    setInstructions('');
    setPadMode('digital');
    setPdfToast('📄 New Blank Prescription Page ready. Write or pick medicines below.');
    setTimeout(() => setPdfToast(null), 3000);
  };

  // Add custom typed medicine
  const handleAddCustomMedicine = (e) => {
    if (e) e.preventDefault();
    if (!customMed.name.trim()) return;

    // Check if matched with pharmacy inventory
    const matchedPharm = localPharmacyMeds.find(
      (m) => m.name.toLowerCase() === customMed.name.trim().toLowerCase()
    );

    setMedicines([
      ...medicines,
      {
        name: customMed.name.trim(),
        genericName: matchedPharm?.genericName || '',
        dosage: customMed.dosage || '1 unit',
        frequency: customMed.frequency || '1 tablet twice daily (1-0-1)',
        duration: customMed.duration || '5 days',
        instructions: customMed.instructions || 'Take after meals',
        inPharmacyStock: matchedPharm ? matchedPharm.totalStock > 0 : false,
        stockCount: matchedPharm ? matchedPharm.totalStock : 0,
        pharmacyMedId: matchedPharm?.id || null
      }
    ]);
    setIsSaved(false);

    setPdfToast(`Added ${customMed.name.trim()} to prescription!`);
    setTimeout(() => setPdfToast(null), 3000);

    // Reset form
    setCustomMed({
      name: '',
      dosage: '1 tablet',
      frequency: '1 tablet twice daily (1-0-1)',
      duration: '5 days',
      instructions: 'Take after meals',
      pharmacyMedId: null,
      totalStock: null,
      inStock: true
    });
  };

  // Add medicine directly from Pharmacy Bank or Dental Formulary
  const handleAddMedicineFromBank = (med, force = false) => {
    const isOutOfStock = med.totalStock !== undefined && med.totalStock <= 0;

    // Check out-of-stock warning
    if (isOutOfStock && rxSettings.outOfStockWarning && !force) {
      setOutOfStockModal({ open: true, medicine: med });
      return;
    }

    const defaults = mapDosageDefaults(med);

    const fullTitle = med.genericName && !med.name.includes(med.genericName)
      ? `${med.name} (${med.genericName.split('+')[0].trim()})`
      : med.name;

    setMedicines([
      ...medicines,
      {
        name: fullTitle,
        genericName: med.genericName || '',
        dosage: defaults.dosage,
        frequency: med.frequency || defaults.frequency,
        duration: med.duration || defaults.duration,
        instructions: med.instructions || defaults.instructions,
        inPharmacyStock: med.totalStock !== undefined ? med.totalStock > 0 : true,
        stockCount: med.totalStock !== undefined ? med.totalStock : null,
        pharmacyMedId: med.id || null,
        sellingPrice: med.sellingPrice || null
      }
    ]);
    setIsSaved(false);

    setPdfToast(`Added ${med.name} to prescription!`);
    setTimeout(() => setPdfToast(null), 3000);
  };

  // Quick frequency updater on prescribed item
  const handleUpdateMedicineFrequency = (idx, newFrequency) => {
    setMedicines((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, frequency: newFrequency } : item))
    );
    setIsSaved(false);
  };

  // Load into custom writing form for customization
  const handleCustomizeMedicine = (med) => {
    const defaults = mapDosageDefaults(med);
    setCustomMed({
      name: med.name,
      dosage: defaults.dosage,
      frequency: med.frequency || defaults.frequency,
      duration: med.duration || defaults.duration,
      instructions: med.instructions || defaults.instructions,
      pharmacyMedId: med.id || null,
      totalStock: med.totalStock,
      inStock: med.totalStock > 0
    });
    setActiveTab('write');
  };

  // Open modal to edit already prescribed medicine
  const handleOpenEditMedicine = (med, idx) => {
    setEditingMedIndex(idx);
    setEditingMedData({
      name: med.name || '',
      dosage: med.dosage || '1 tablet',
      frequency: med.frequency || '1 tablet twice daily (1-0-1)',
      duration: med.duration || '5 days',
      instructions: med.instructions || 'Take after meals',
      inPharmacyStock: med.inPharmacyStock,
      stockCount: med.stockCount,
      genericName: med.genericName || ''
    });
  };

  // Save changes to prescribed medicine
  const handleSaveEditMedicine = (e) => {
    if (e) e.preventDefault();
    if (editingMedIndex === null) return;

    setMedicines((prev) =>
      prev.map((item, idx) => {
        if (idx === editingMedIndex) {
          return {
            ...item,
            ...editingMedData
          };
        }
        return item;
      })
    );
    setIsSaved(false);

    setPdfToast(`Updated ${editingMedData.name} in prescription!`);
    setTimeout(() => setPdfToast(null), 3000);
    setEditingMedIndex(null);
  };

  const handleRemoveMedicine = (idx) => {
    const medToRemove = medicines[idx];
    setMedicines(medicines.filter((_, i) => i !== idx));
    setIsSaved(false);
    if (medToRemove?.name) {
      setPdfToast(`Removed ${medToRemove.name} from prescription`);
      setTimeout(() => setPdfToast(null), 3000);
    }
  };

  const handleSaveRx = async () => {
    if (isSaving || isSaved) return; // Prevent multiple clicks!
    if (!patientId) {
      setPdfToast('⚠️ Please select a patient first.');
      setTimeout(() => setPdfToast(null), 3000);
      return;
    }
    if (medicines.length === 0 && !diagnosis.trim() && !instructions.trim()) {
      setPdfToast('⚠️ Prescription is empty. Please add medications or diagnosis before saving.');
      setTimeout(() => setPdfToast(null), 3000);
      return;
    }

    try {
      setIsSaving(true);
      if (onAddPrescription) {
        await onAddPrescription(patientId, {
          doctor: activeDoctor.name,
          diagnosis,
          medicines,
          instructions,
          reviewTimeline
        });
      }
      setIsSaved(true);
      setPdfToast('💾 Prescription successfully saved to patient EHR record!');
      setTimeout(() => setPdfToast(null), 4000);
    } catch (err) {
      console.error('Error saving prescription:', err);
      setPdfToast('❌ Failed to save prescription. Please try again.');
      setTimeout(() => setPdfToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerPrint = () => {
    document.body.classList.add('printing-prescription');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-prescription');
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    if (!activePatient) return;
    setDownloadingPdf(true);
    const cleanPatientName = (activePatient.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Rx_${cleanPatientName}_${new Date().toISOString().split('T')[0]}.pdf`;

    await exportToA4Pdf('printable-prescription-pad', filename);
    setDownloadingPdf(false);
    setPdfToast(`✅ Prescription PDF (${filename}) downloaded successfully!`);
    setTimeout(() => setPdfToast(null), 6000);
  };

  const handleSendWhatsAppRx = async () => {
    if (!activePatient?.phone) return;
    setDownloadingPdf(true);
    const cleanPatientName = (activePatient.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Rx_${cleanPatientName}_${new Date().toISOString().split('T')[0]}.pdf`;

    await exportToA4Pdf('printable-prescription-pad', filename);
    setDownloadingPdf(false);

    const rxAutoLink = `${window.location.origin}/?patientId=${activePatient.id}`;
    const medList = medicines.length > 0
      ? medicines
          .map(
            (m, i) =>
              `${i + 1}. *${m.name}*\n   Dosage: ${m.frequency} for ${m.duration} (${m.instructions})`
          )
          .join('\n\n')
      : '• Blank handwritten prescription issued during clinic visit.';

    const msg = `Dear *${activePatient.name}*,\n\nHere is your Digital Dental Prescription from *${clinicProfile.name || 'Apex Dental'}*:\n👨‍⚕️ *Doctor:* ${activeDoctor.name} (${activeDoctor.specialty || 'Dental Surgeon'}, NMC: ${activeDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'})\n\n🩺 *Diagnosis:* ${diagnosis || 'Dental Examination & Therapy'}\n\n💊 *Prescribed Medications:*\n${medList}\n\n⚠️ *Special Advice:* ${instructions || 'Maintain good oral hygiene. Contact clinic if pain persists.'}\n\n📅 *Review Date:* ${reviewTimeline}\n\n🔗 *Digital Rx Auto Link:*\n${rxAutoLink}\n\n📎 *Note:* Your official Prescription PDF has been downloaded as *${filename}*. Please find the attached document.\n\nGet well soon! For queries call ${clinicProfile.phone || '+977 98012 34567'}.`;

    onOpenWhatsApp(activePatient.phone, msg);
    setPdfToast(`📄 Prescription PDF downloaded as ${filename}! In WhatsApp, click 📎 to attach it.`);
    setTimeout(() => setPdfToast(null), 8000);
  };

  // Compile active medicine list based on selected bank source
  let baseBankList = [];
  if (bankSource === 'pharmacy-in-stock') {
    baseBankList = localPharmacyMeds.filter((m) => m.totalStock > 0);
  } else if (bankSource === 'pharmacy-all') {
    baseBankList = localPharmacyMeds;
  } else {
    baseBankList = medicineFormulary.length > 0 ? medicineFormulary : DENTAL_COMMON_MEDICINES;
  }

  // Filter out of stock if configured in settings
  if (rxSettings.hideOutOfStock && bankSource !== 'standard-dental') {
    baseBankList = baseBankList.filter((m) => m.totalStock > 0);
  }

  // Filter by Category
  const categoryFiltered = baseBankList.filter((m) => {
    if (bankCategory === 'all') return true;
    const cat = (m.category || '').toLowerCase();
    const name = (m.name || '').toLowerCase();
    if (bankCategory === 'antibiotic') return cat.includes('antibiotic') || name.includes('amox') || name.includes('augmentin');
    if (bankCategory === 'analgesic') return cat.includes('analgesic') || cat.includes('nsaid') || cat.includes('pain') || name.includes('zerodol') || name.includes('ketorol') || name.includes('dolo');
    if (bankCategory === 'mouthwash') return cat.includes('mouthwash') || cat.includes('rinse') || name.includes('hexidine');
    if (bankCategory === 'topical') return cat.includes('topical') || cat.includes('paste') || cat.includes('gel') || name.includes('kenacort');
    if (bankCategory === 'gastro') return cat.includes('gastro') || cat.includes('ppi') || cat.includes('antacid') || name.includes('pantocid');
    if (bankCategory === 'anesthesia') return cat.includes('anaesthesia') || cat.includes('anesthesia') || name.includes('lignox');
    return true;
  });

  // Filter by Search Query
  const filteredBank = categoryFiltered.filter((m) => {
    if (!bankSearch.trim()) return true;
    const q = bankSearch.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.genericName && m.genericName.toLowerCase().includes(q)) ||
      (m.brand && m.brand.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.strength && m.strength.toLowerCase().includes(q)) ||
      (m.dosageForm && m.dosageForm.toLowerCase().includes(q))
    );
  });

  const inStockPharmacyCount = localPharmacyMeds.filter((m) => m.totalStock > 0).length;
  const totalPharmacyCount = localPharmacyMeds.length;

  // Toast parsing
  const isToastError = typeof pdfToast === 'string' && (pdfToast.includes('⚠️') || pdfToast.includes('❌') || pdfToast.toLowerCase().includes('failed'));
  const rawToastString = typeof pdfToast === 'string' ? pdfToast : '';
  const cleanToastText = rawToastString.replace(/^([✅⚠️❌💾🔄📋📄⚙️]\s*)+/, '').trim();

  // Check known allergies
  const hasAllergies = activePatient?.allergies && (
    Array.isArray(activePatient.allergies) ? activePatient.allergies.length > 0 : String(activePatient.allergies).trim().length > 0
  );
  const allergiesList = Array.isArray(activePatient?.allergies)
    ? activePatient.allergies.join(', ')
    : activePatient?.allergies;

  return (
    <div className="space-y-5">
      {/* Toast Notification Banner */}
      {pdfToast && (
        <div className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[100] no-print pointer-events-auto animate-fadeIn drop-shadow-2xl max-w-[92vw] sm:max-w-md">
          <div
            className={`px-4 py-2.5 rounded-full shadow-2xl flex items-center justify-between space-x-3 text-xs font-bold backdrop-blur-md transition-all border select-none ${
              isToastError
                ? 'bg-rose-600/95 text-white border-rose-400/50'
                : 'bg-emerald-600/95 text-white border-emerald-400/50'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {isToastError ? (
                <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-200 flex-shrink-0" />
              )}
              <span className="truncate leading-none">{cleanToastText || rawToastString}</span>
            </div>
            <button
              type="button"
              onClick={() => setPdfToast(null)}
              className="text-white/80 hover:text-white hover:bg-white/20 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition flex-shrink-0 ml-1.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* REARRANGED UNIFIED HEADER TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 sm:p-5 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Branding & Status */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 sm:p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20 flex-shrink-0">
              <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Dental Prescription (Rx) Pad
                </h1>
                {rxSettings.syncPharmacyStock && (
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Pharmacy Sync ({inStockPharmacyCount} in stock)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clinical digital prescription builder integrated with real-time dental pharmacy stock.
              </p>
            </div>
          </div>

          {/* Right: Clean Grouped Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            {/* View Mode Segmented Switch: Workstation vs Official Letterhead */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('workstation')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'workstation'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Interactive 2-column clinical workstation builder"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Workstation</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('letterhead')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'letterhead'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Full A4 Letterhead sheet print preview"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Preview</span>
              </button>
            </div>

            {/* Quick Template Actions */}
            <button
              type="button"
              onClick={handleLoadSampleTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition"
              title="Preload standard dental antibiotic & analgesic regimen"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sample Rx</span>
            </button>

            <button
              type="button"
              onClick={handleClearToBlankPage}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition"
              title="Reset to blank prescription"
            >
              <FilePlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Blank Page</span>
            </button>

            {/* Ruled Pad Mode Toggle */}
            <button
              type="button"
              onClick={() => setPadMode(padMode === 'digital' ? 'blank-paper' : 'digital')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                padMode === 'blank-paper'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Switch to blank ruled lines for handwritten prescriptions"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{padMode === 'blank-paper' ? 'Ruled Pad Active' : 'Ruled Pad'}</span>
            </button>

            {/* Pharmacy Refresh & Settings Icons */}
            {rxSettings.syncPharmacyStock && (
              <button
                type="button"
                onClick={handleRefreshLiveStock}
                disabled={refreshingStock}
                className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl transition"
                title="Refresh real-time pharmacy inventory quantity"
              >
                <RefreshCw className={`w-4 h-4 ${refreshingStock ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition"
              title="Configure prescription settings & pharmacy stock integration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (when on mobile/tablet) */}
        <div className="flex lg:hidden items-center border-t border-slate-100 dark:border-slate-800 mt-3 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl text-center transition ${
              mobileTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            🔍 Medication Finder
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('rx-sheet')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition ${
              mobileTab === 'rx-sheet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span>📋 Current Rx</span>
            <span className="font-mono bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {medicines.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: MODERN DUAL-PANE CLINICAL WORKSTATION */}
      {viewMode === 'workstation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 no-print items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN (COL-SPAN-7): PATIENT CONTEXT + MEDICINE FINDER & CATALOG     */}
          {/* ========================================================================= */}
          <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'rx-sheet' ? 'hidden lg:block' : 'block'}`}>
            {/* 1. Patient & Doctor Clinical Context Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Patient Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center space-x-1.5 text-[11px]">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Patient</span>
                    </label>
                    {activePatient && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {activePatient.age || 30}y • {activePatient.gender || 'M'}
                      </span>
                    )}
                  </div>
                  <select
                    value={patientId}
                    onChange={(e) => {
                      setPatientId(e.target.value);
                      setIsSaved(false);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.phone} • {p.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prescribing Doctor Selector */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center space-x-1.5 text-[11px]">
                    <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                    <span>Prescribing Doctor</span>
                  </label>
                  <select
                    value={doctorId}
                    onChange={(e) => {
                      setDoctorId(e.target.value);
                      if (isSaved) setIsSaved(false);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty || 'Dental Surgeon'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Patient Allergies Alert Pill (Crucial Clinical Safety) */}
              {hasAllergies && (
                <div className="flex items-center space-x-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <div className="truncate">
                    <strong className="font-bold">Drug Allergy Alert:</strong>{' '}
                    <span className="font-semibold underline decoration-rose-400">{allergiesList}</span>
                  </div>
                </div>
              )}

              {/* Diagnosis Input & Quick Dental Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px] flex items-center space-x-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    <span>Clinical Diagnosis</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Quick click to fill:</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Acute Irreversible Pulpitis #16, Periapical Abscess..."
                  value={diagnosis}
                  onChange={(e) => {
                    setDiagnosis(e.target.value);
                    if (isSaved) setIsSaved(false);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {/* Quick Dental Diagnosis Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                  {DENTAL_DIAGNOSIS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDiagnosis(preset);
                        if (isSaved) setIsSaved(false);
                      }}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg whitespace-nowrap transition font-medium border border-slate-200/60 dark:border-slate-700"
                    >
                      + {preset.split(' ')[0]} {preset.split(' ')[1] || ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Medicine Catalog & Formulary Hub */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              {/* Tab Switcher: Available Pharmacy Bank vs Custom Medicine Form */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('bank')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'bank'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Pharmacy & Formulary</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'write'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>✍️ Custom Write</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 font-semibold hidden sm:block">
                  Showing {filteredBank.length} available drugs
                </div>
              </div>

              {/* TAB 1: PHARMACY BANK & FORMULARY */}
              {activeTab === 'bank' && (
                <div className="space-y-3">
                  {/* Source Switcher Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                      <button
                        type="button"
                        onClick={() => setBankSource('pharmacy-in-stock')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                          bankSource === 'pharmacy-in-stock'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                        <span>In-Stock ({inStockPharmacyCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBankSource('pharmacy-all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                          bankSource === 'pharmacy-all'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <Boxes className="w-3.5 h-3.5" />
                        <span>All Catalog ({totalPharmacyCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBankSource('standard-dental')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                          bankSource === 'standard-dental'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Dental Bank ({DENTAL_COMMON_MEDICINES.length})</span>
                      </button>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'antibiotic', label: 'Antibiotics' },
                        { id: 'analgesic', label: 'Pain/NSAIDs' },
                        { id: 'mouthwash', label: 'Mouthwash' },
                        { id: 'topical', label: 'Gels/Pastes' },
                        { id: 'gastro', label: 'Antacid' },
                        { id: 'anesthesia', label: 'Anaesthesia' }
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setBankCategory(c.id)}
                          className={`px-2 py-0.5 rounded-md font-semibold transition ${
                            bankCategory === c.id
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fast Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by brand name, generic formula (e.g. Amoxicillin, Ketorolac)..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    {bankSearch && (
                      <button
                        type="button"
                        onClick={() => setBankSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Medicine List Cards (High-Density & Clean) */}
                  {filteredBank.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                      <Store className="w-8 h-8 text-slate-300 mx-auto" />
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No matching medications found</h4>
                      <p className="text-xs text-slate-500">
                        Try clearing search keywords or switch to the <strong>"Custom Write"</strong> tab.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {filteredBank.map((med, i) => {
                        const defaults = mapDosageDefaults(med);
                        const hasStockInfo = med.totalStock !== undefined;
                        const inStock = hasStockInfo ? med.totalStock > 0 : true;
                        const isLow = hasStockInfo ? med.isLowStock && inStock : false;

                        return (
                          <div
                            key={med.id || i}
                            className={`p-3 bg-white dark:bg-slate-800/90 rounded-xl border text-xs flex flex-col justify-between shadow-2xs transition hover:shadow-xs ${
                              !inStock
                                ? 'border-slate-200 dark:border-slate-700 opacity-75'
                                : isLow
                                ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                                : 'border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600'
                            }`}
                          >
                            <div className="space-y-1">
                              {/* Title and Stock Indicator */}
                              <div className="flex items-start justify-between gap-1.5">
                                <h4 className="font-bold text-slate-900 dark:text-white leading-snug text-xs">
                                  {med.name}
                                </h4>

                                {rxSettings.showStockBadges && hasStockInfo && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border flex-shrink-0 flex items-center gap-1 ${
                                      inStock
                                        ? isLow
                                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300'
                                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        inStock ? (isLow ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-rose-500'
                                      }`}
                                    ></span>
                                    <span>{inStock ? `${med.totalStock} in stock` : 'Out'}</span>
                                  </span>
                                )}
                              </div>

                              {/* Generic Formula */}
                              {med.genericName && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-1" title={med.genericName}>
                                  {med.genericName}
                                </p>
                              )}

                              {/* Form, Location & Price */}
                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium">
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">
                                  {med.dosageForm || 'Tablet'}
                                </span>
                                {med.storageLocation && (
                                  <span className="text-slate-400 truncate max-w-[90px]">
                                    📍 {med.storageLocation}
                                  </span>
                                )}
                                {med.sellingPrice && (
                                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold ml-auto">
                                    Rs. {med.sellingPrice}
                                  </span>
                                )}
                              </div>

                              {/* Standard Regimen */}
                              <div className="p-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] space-y-0.5">
                                <div className="text-purple-700 dark:text-purple-300 font-bold flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                  <span>{med.frequency || defaults.frequency}</span>
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 truncate" title={med.instructions || defaults.instructions}>
                                  {med.duration || defaults.duration} • {med.instructions || defaults.instructions}
                                </div>
                              </div>
                            </div>

                            {/* 1-Click Action Buttons */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAddMedicineFromBank(med)}
                                className={`flex-1 font-bold text-xs py-1.5 px-2.5 rounded-lg flex items-center justify-center space-x-1 transition shadow-2xs ${
                                  inStock
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white active:scale-98'
                                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{inStock ? '+ Add to Rx' : '+ Prescribe (External)'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCustomizeMedicine(med)}
                                className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition"
                                title="Customize dosage, frequency, or duration before adding"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: WRITE CUSTOM MEDICINE FORM */}
              {activeTab === 'write' && (
                <form onSubmit={handleAddCustomMedicine} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                          Medicine Name & Strength *
                        </label>
                        <span className="text-[10px] text-purple-700 dark:text-purple-400 font-semibold">
                          Pharmacy Autocomplete
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        list="pharmacy-med-suggestions"
                        placeholder="e.g. Augmentin 625mg, Zerodol-SP, Ketorol DT..."
                        value={customMed.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = localPharmacyMeds.find(
                            (m) => m.name.toLowerCase() === val.trim().toLowerCase()
                          );
                          if (matched && rxSettings.autoFillDosage) {
                            const def = mapDosageDefaults(matched);
                            setCustomMed({
                              name: matched.name,
                              dosage: def.dosage,
                              frequency: def.frequency,
                              duration: def.duration,
                              instructions: def.instructions,
                              pharmacyMedId: matched.id,
                              totalStock: matched.totalStock,
                              inStock: matched.totalStock > 0
                            });
                          } else {
                            setCustomMed((prev) => ({ ...prev, name: val }));
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <datalist id="pharmacy-med-suggestions">
                        {localPharmacyMeds.map((m) => (
                          <option
                            key={m.id}
                            value={m.name}
                            label={`${m.genericName || m.category} (Stock: ${m.totalStock || 0})`}
                          />
                        ))}
                        {DENTAL_COMMON_MEDICINES.map((m, i) => (
                          <option key={`common-${i}`} value={m.name} label="Dental Formulary" />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 text-[11px]">
                        Dosage Form
                      </label>
                      <select
                        value={customMed.dosage}
                        onChange={(e) => setCustomMed({ ...customMed, dosage: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="1 tablet">1 Tablet</option>
                        <option value="1 capsule">1 Capsule</option>
                        <option value="10 ml">10 ml (Mouthwash)</option>
                        <option value="Small dab">Small Dab (Paste/Gel)</option>
                        <option value="5 ml">5 ml (Syrup)</option>
                        <option value="1 sachet">1 Sachet (Dispersible)</option>
                      </select>
                    </div>
                  </div>

                  {/* Frequency & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 text-[11px]">
                        Duration
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 days, 3 days, 10 days..."
                        value={customMed.duration}
                        onChange={(e) => setCustomMed({ ...customMed, duration: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 text-[11px]">
                        Frequency / Timing
                      </label>
                      <input
                        type="text"
                        value={customMed.frequency}
                        onChange={(e) => setCustomMed({ ...customMed, frequency: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Frequency Quick Options */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {[
                      '1 tablet twice daily (1-0-1)',
                      '1 tablet thrice daily (1-1-1)',
                      '1 tablet once daily morning (1-0-0)',
                      '1 tablet night (0-0-1)',
                      '1 tablet SOS (when pain is severe)',
                      '10 ml twice daily rinse'
                    ].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setCustomMed({ ...customMed, frequency: freq })}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium transition"
                      >
                        {freq.split('(')[1]?.replace(')', '') || freq}
                      </button>
                    ))}
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 text-[11px]">
                      Special Instructions / Route
                    </label>
                    <input
                      type="text"
                      value={customMed.instructions}
                      onChange={(e) => setCustomMed({ ...customMed, instructions: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                      {[
                        'Take strictly after meals',
                        'Take before food on empty stomach',
                        'Rinse vigorously 1 min then spit',
                        'Apply gently over affected area',
                        'Avoid chewing on treated side'
                      ].map((inst) => (
                        <button
                          key={inst}
                          type="button"
                          onClick={() => setCustomMed({ ...customMed, instructions: inst })}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium transition"
                        >
                          {inst}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Medicine to Prescription</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN (COL-SPAN-5): LIVE PRESCRIPTION PAD DRAFT + INSTANT ACTIONS  */}
          {/* ========================================================================= */}
          <div className={`lg:col-span-5 space-y-4 lg:sticky lg:top-4 ${mobileTab === 'catalog' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border-2 border-blue-500/30 dark:border-blue-900/40 p-4 sm:p-5 space-y-4">
              {/* Prescription Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl font-serif font-black text-blue-600 italic">℞</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {activePatient?.name || 'Walk-in Patient'}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Prescribed by {activeDoctor?.name} • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full">
                  {medicines.length} {medicines.length === 1 ? 'drug' : 'drugs'}
                </span>
              </div>

              {/* Prescribed Medications List */}
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {medicines.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <FilePlus className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Prescription is currently empty
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Click <strong>"+ Add to Rx"</strong> from the catalog on the left, or click{' '}
                      <button
                        type="button"
                        onClick={handleLoadSampleTemplate}
                        className="text-blue-600 font-bold underline"
                      >
                        Sample Rx
                      </button>{' '}
                      to load a template.
                    </p>
                  </div>
                ) : (
                  medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs transition hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start space-x-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 dark:text-white truncate">
                              {med.name}
                            </h5>
                            {med.genericName && (
                              <p className="text-[10px] text-slate-500 italic truncate">
                                {med.genericName}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions: Edit & Remove */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditMedicine(med, idx)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition"
                            title="Edit dosage"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicine(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition"
                            title="Remove medication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Dosage, Duration & Route Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md">
                          ⏰ {med.frequency}
                        </span>
                        <span className="font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                          📅 {med.duration}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 italic">
                          • {med.instructions}
                        </span>
                      </div>

                      {/* Inline Timing Quick-Adjust Chips */}
                      <div className="flex items-center space-x-1 pt-1 border-t border-slate-200/60 dark:border-slate-700 text-[9px]">
                        <span className="text-slate-400 font-bold uppercase">Timing:</span>
                        {['1-0-1', '1-1-1', '1-0-0', '0-0-1', 'SOS'].map((freqShort) => {
                          const fullFreq =
                            freqShort === '1-0-1'
                              ? '1 tablet twice daily (1-0-1)'
                              : freqShort === '1-1-1'
                              ? '1 tablet thrice daily (1-1-1)'
                              : freqShort === '1-0-0'
                              ? '1 tablet once daily morning (1-0-0)'
                              : freqShort === '0-0-1'
                              ? '1 tablet night (0-0-1)'
                              : '1 tablet SOS (when pain is severe)';
                          const isCurrent = med.frequency?.includes(freqShort);

                          return (
                            <button
                              key={freqShort}
                              type="button"
                              onClick={() => handleUpdateMedicineFrequency(idx, fullFreq)}
                              className={`px-1.5 py-0.2 rounded font-bold transition ${
                                isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {freqShort}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Special Advice / Post-Op Notes */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[11px]">
                    Doctor's Advice & Post-Op Guidelines
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setInstructions((prev) =>
                        prev ? `${prev} • Warm saline rinse 3-4x daily.` : 'Warm saline rinse 3-4x daily.'
                      );
                      if (isSaved) setIsSaved(false);
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    + Warm Saline
                  </button>
                </div>
                <textarea
                  rows="2"
                  placeholder="e.g. Warm saline rinse 3-4 times daily. Soft diet. Avoid chewing on treated side..."
                  value={instructions}
                  onChange={(e) => {
                    setInstructions(e.target.value);
                    if (isSaved) setIsSaved(false);
                  }}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Next Review Timeline */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">Next Review:</span>
                <input
                  type="text"
                  value={reviewTimeline}
                  onChange={(e) => {
                    setReviewTimeline(e.target.value);
                    if (isSaved) setIsSaved(false);
                  }}
                  className="text-xs text-blue-700 dark:text-blue-400 font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-right focus:outline-none"
                />
              </div>

              {/* PROMINENT ACTION DOCK */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {/* Save to Patient EHR Button */}
                <button
                  type="button"
                  onClick={handleSaveRx}
                  disabled={isSaved || isSaving}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition shadow-sm ${
                    isSaved
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      : isSaving
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Saving to Patient EHR...</span>
                    </>
                  ) : isSaved ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Prescription Saved to EHR</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Save Prescription to EHR Record</span>
                    </>
                  )}
                </button>

                {/* Print, PDF, WhatsApp Action Row */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerPrint}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-xs active:scale-98"
                    title="Print Prescription Letterhead"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingPdf}
                    onClick={handleDownloadPdf}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-xs active:scale-98 disabled:opacity-50"
                    title="Download A4 High-Res PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingPdf ? 'Export...' : 'PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsAppRx}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-xs active:scale-98"
                    title="Send prescription details & link via WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2 (OR FOR PRINT / PDF EXPORT): OFFICIAL A4 LETTERHEAD SHEET */}
      <div className={viewMode === 'workstation' ? 'block' : 'block'}>
        {viewMode === 'letterhead' && (
          <div className="text-center py-2 text-xs font-semibold text-slate-500 no-print flex items-center justify-center space-x-3">
            <span>Official A4 Letterhead Layout Preview</span>
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold"
            >
              Print Now
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              Download PDF
            </button>
          </div>
        )}

        {/* PRINTABLE OFFICIAL PRESCRIPTION LETTERHEAD SHEET */}
        <div
          id="printable-prescription-pad"
          className="p-6 sm:p-10 bg-white rounded-2xl border-2 border-slate-300 shadow-md max-w-3xl mx-auto space-y-6 print-container text-slate-800"
        >
          {/* Clinic Letterhead Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b-2 border-blue-600 gap-3">
            <div className="flex items-start space-x-3.5">
              {clinicProfile.logo && (
                <img
                  src={clinicProfile.logo}
                  alt="Clinic Logo"
                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white p-1 shadow-xs flex-shrink-0"
                />
              )}
              <div>
                <h3 className="text-xl font-black bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent tracking-tight">
                  {clinicProfile.name || 'Nepal Dental and Healthcare Wellness Centre Pvt. Ltd.'}
                </h3>
                <p className="text-xs text-blue-700 font-semibold">
                  {clinicProfile.tagline || 'Excellence in Advanced Dental Care'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {clinicProfile.address || 'Kathmandu, Nepal'}
                </p>
                <p className="text-xs text-slate-600">
                  📞 {clinicProfile.phone || '+977 98012 34567'} | ✉️ {clinicProfile.email || 'contact@apexdental.com.np'}
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <h4 className="text-sm font-bold text-slate-900">{activeDoctor.name}</h4>
              <p className="text-xs text-slate-600">{activeDoctor.qualification || 'BDS, MDS'}</p>
              <p className="text-xs text-slate-500">{activeDoctor.specialty || 'Dental Surgeon'}</p>
              <p className="text-xs font-mono text-slate-500 font-bold">
                NMC Reg: {activeDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'}
              </p>
            </div>
          </div>

          {/* Patient Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <strong>Patient:</strong> {activePatient?.name || 'Walk-in Patient'}
            </div>
            <div>
              <strong>Age/Sex:</strong> {activePatient?.age || 30} / {activePatient?.gender || 'M'}
            </div>
            <div>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </div>
            <div>
              <strong>Rx ID:</strong> RX-{Date.now().toString().slice(-4)}
            </div>
          </div>

          {/* Drug Allergy Warning */}
          {activePatient?.allergies?.length > 0 && (
            <div className="text-xs bg-red-100 text-red-800 font-bold px-3 py-1 rounded-md flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
              <span>
                ⚠️ Known Drug Allergies: {Array.isArray(activePatient.allergies) ? activePatient.allergies.join(', ') : activePatient.allergies}
              </span>
            </div>
          )}

          {/* Diagnosis Row */}
          {diagnosis && (
            <div className="text-xs bg-blue-50/60 text-blue-950 font-bold px-3 py-1.5 rounded-md border border-blue-200">
              <strong>Diagnosis / Clinical Impression:</strong> {diagnosis}
            </div>
          )}

          {/* Rx Symbol & Medication List OR Blank Ruled Pad */}
          <div className="space-y-4">
            <div className="text-2xl font-serif font-black text-blue-900 italic">℞</div>

            {padMode === 'blank-paper' ? (
              <div className="space-y-4 py-2">
                <div className="text-xs font-mono text-slate-400 italic text-center pb-1 no-print">
                  -- Blank Prescription Pad (Ruled for Doctor's Handwriting) --
                </div>
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((line) => (
                    <div key={line} className="border-b border-dashed border-slate-300 h-6"></div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {medicines.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                    <FilePlus className="w-8 h-8 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700">Blank Prescription Page</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No medications added yet. Pick from the <strong>"Available Pharmacy Medicines"</strong> catalog above, or write custom medicines.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[500px] sm:min-w-0">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Medicine Name & Strength</th>
                          <th className="p-2">Dosage / Frequency</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2">Instructions / Route</th>
                          <th className="p-2 no-print text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {medicines.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2">
                              <span className="font-bold text-slate-900 block">{med.name}</span>
                              {med.inPharmacyStock !== undefined && (
                                <span className="no-print inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-50 text-emerald-800 border-emerald-200">
                                  🏥 In Pharmacy Stock
                                </span>
                              )}
                            </td>
                            <td className="p-2 font-semibold text-blue-700">{med.frequency}</td>
                            <td className="p-2 text-slate-600 font-medium">{med.duration}</td>
                            <td className="p-2 text-slate-600 italic">{med.instructions}</td>
                            <td className="p-2 no-print text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMedicine(med, idx)}
                                  className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                                  title="Edit prescribed medicine"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedicine(idx)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                                  title="Remove medicine"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Doctor Advice & Post-Op Guidelines */}
          <div className="pt-4 border-t border-slate-200 text-xs space-y-2">
            <strong className="block text-slate-700 uppercase">Special Advice & Post-Op Guidelines:</strong>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {instructions || '• Maintain good oral hygiene. Warm saline gargles if required. Take medications as prescribed.'}
            </p>
          </div>

          {/* Signature Line & Review Date */}
          <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
            <div>
              <div className="font-semibold text-slate-700">Next Review / Follow-Up:</div>
              <div className="mt-0.5 text-xs text-blue-800 font-bold">
                {reviewTimeline}
              </div>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-400 mb-1"></div>
              <strong className="text-slate-900 block">{activeDoctor.name}</strong>
              <div className="text-[10px] text-slate-500">
                NMC Reg: {activeDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                Authorized Signature & Seal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: OUT OF STOCK ALERT MODAL */}
      {outOfStockModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="bg-rose-600 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold">Out of Stock Notice</h3>
              </div>
              <button
                type="button"
                onClick={() => setOutOfStockModal({ open: false, medicine: null })}
                className="text-white/80 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-slate-700 leading-relaxed">
                <strong>{outOfStockModal.medicine?.name}</strong> currently has <strong>0 units</strong> in the clinic pharmacy inventory.
              </p>
              <p className="text-slate-500">
                Would you like to prescribe it anyway for the patient to purchase at an outside pharmacy?
              </p>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setOutOfStockModal({ open: false, medicine: null })}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const med = outOfStockModal.medicine;
                    setOutOfStockModal({ open: false, medicine: null });
                    handleAddMedicineFromBank(med, true);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl shadow-xs"
                >
                  Prescribe for External Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK RX & PHARMACY SETTINGS MODAL */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-xs">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Settings className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold">Prescription Pad & Pharmacy Integration Settings</h3>
                  <p className="text-[10px] text-slate-400">Configure live inventory sync & prescribing behavior</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="text-white/80 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Sync Pharmacy Stock to Rx Pad</strong>
                  <span className="text-[11px] text-slate-500">
                    Display real-time clinic inventory quantities on prescription medicine list.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rxSettings.syncPharmacyStock}
                  onChange={(e) => handleSavePrescriptionSettings({ syncPharmacyStock: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-1 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <strong className="block text-slate-800">Default Medicine Bank View</strong>
                <select
                  value={rxSettings.defaultRxBankView}
                  onChange={(e) => {
                    handleSavePrescriptionSettings({ defaultRxBankView: e.target.value });
                    setBankSource(e.target.value);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                >
                  <option value="pharmacy-in-stock">🏥 Live In-Stock Pharmacy Inventory (Recommended)</option>
                  <option value="pharmacy-all">📋 Full Clinic Pharmacy Catalog (All items)</option>
                  <option value="standard-dental">📚 Standard Dental Formulary Bank</option>
                </select>
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Out-of-Stock Warning</strong>
                  <span className="text-[11px] text-slate-500">
                    Warn the prescribing doctor if a selected medicine is currently depleted.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rxSettings.outOfStockWarning}
                  onChange={(e) => handleSavePrescriptionSettings({ outOfStockWarning: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Hide Out-of-Stock Medicines</strong>
                  <span className="text-[11px] text-slate-500">
                    Only display medicines that have active, unexpired inventory in stock.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rxSettings.hideOutOfStock}
                  onChange={(e) => handleSavePrescriptionSettings({ hideOutOfStock: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Intelligent Dental Dosage Auto-Fill</strong>
                  <span className="text-[11px] text-slate-500">
                    Auto-fill standard frequency & instructions based on medicine category and form.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rxSettings.autoFillDosage}
                  onChange={(e) => handleSavePrescriptionSettings({ autoFillDosage: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-1 cursor-pointer"
                />
              </div>

              <div className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="block text-slate-800">Show Real-Time Stock Count Badges</strong>
                  <span className="text-[11px] text-slate-500">
                    Display stock quantity indicators (🟢 In Stock / 🟡 Low / 🔴 Out) on medicine cards.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={rxSettings.showStockBadges}
                  onChange={(e) => handleSavePrescriptionSettings({ showStockBadges: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PRESCRIBED MEDICINE MODAL */}
      {editingMedIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-xs">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold">Edit Prescribed Medicine (#{editingMedIndex + 1})</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMedIndex(null)}
                className="text-white/80 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditMedicine} className="p-5 space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Medicine Name & Strength *
                </label>
                <input
                  type="text"
                  required
                  value={editingMedData.name}
                  onChange={(e) => setEditingMedData({ ...editingMedData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Dosage Form</label>
                  <input
                    type="text"
                    value={editingMedData.dosage}
                    onChange={(e) => setEditingMedData({ ...editingMedData, dosage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingMedData.duration}
                    onChange={(e) => setEditingMedData({ ...editingMedData, duration: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase">Frequency / Timing</label>
                  <span className="text-[10px] text-slate-400">Quick options:</span>
                </div>
                <input
                  type="text"
                  value={editingMedData.frequency}
                  onChange={(e) => setEditingMedData({ ...editingMedData, frequency: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-medium mb-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1">
                  {[
                    '1 tablet twice daily (1-0-1)',
                    '1 tablet thrice daily (1-1-1)',
                    '1 tablet once daily morning (1-0-0)',
                    '1 tablet night (0-0-1)',
                    '1 tablet SOS (when pain is severe)',
                    '10 ml twice daily rinse'
                  ].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setEditingMedData({ ...editingMedData, frequency: freq })}
                      className="text-[10px] bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                    >
                      {freq.split('(')[1]?.replace(')', '') || freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase">Special Instructions / Route</label>
                  <span className="text-[10px] text-slate-400">Quick options:</span>
                </div>
                <input
                  type="text"
                  value={editingMedData.instructions}
                  onChange={(e) => setEditingMedData({ ...editingMedData, instructions: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 font-medium mb-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1">
                  {[
                    'Take strictly after meals',
                    'Take before food on empty stomach',
                    'Rinse vigorously 1 min then spit',
                    'Apply gently over affected area',
                    'Take with plenty of water',
                    'Avoid chewing on treated side'
                  ].map((inst) => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => setEditingMedData({ ...editingMedData, instructions: inst })}
                      className="text-[10px] bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingMedIndex(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl shadow-xs flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Medicine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
