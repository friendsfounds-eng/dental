import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

// Popular dental medicines for rapid writing suggestions
const DENTAL_COMMON_MEDICINES = [
  { name: 'Augmentin 625mg (Amoxicillin + Clavulanate)', dosage: '625 mg', frequency: '1 tablet twice daily (1-0-1)', duration: '5 days', instructions: 'Take after meals. Complete full course.' },
  { name: 'Amoxicillin 500mg', dosage: '500 mg', frequency: '1 capsule thrice daily (1-1-1)', duration: '5 days', instructions: 'Take after food. Stop if rash appears.' },
  { name: 'Metrogyl 400mg (Metronidazole)', dosage: '400 mg', frequency: '1 tablet thrice daily (1-1-1)', duration: '5 days', instructions: 'Take strictly after food. Avoid alcohol.' },
  { name: 'Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)', dosage: '100/325/15 mg', frequency: '1 tablet twice daily (1-0-1)', duration: '3 days', instructions: 'Take after food for pain/swelling.' },
  { name: 'Ketorol DT 10mg (Ketorolac)', dosage: '10 mg Dispersible', frequency: '1 tablet SOS (when pain is severe)', duration: '2 days', instructions: 'Disperse in 1/2 glass of water.' },
  { name: 'Brufen 400mg (Ibuprofen)', dosage: '400 mg', frequency: '1 tablet thrice daily (1-1-1)', duration: '3 days', instructions: 'Take with food or milk.' },
  { name: 'Dolo 650mg (Paracetamol)', dosage: '650 mg', frequency: '1 tablet SOS / every 6 hours', duration: '3 days', instructions: 'For pain or fever.' },
  { name: 'Pantocid 40mg (Pantoprazole)', dosage: '40 mg', frequency: '1 tablet once daily morning (1-0-0)', duration: '5 days', instructions: 'Take 30 mins before breakfast on empty stomach.' },
  { name: 'Hexidine 0.2% Mouthwash (Chlorhexidine)', dosage: '10 ml', frequency: 'Twice daily morning and night', duration: '10 days', instructions: 'Rinse vigorously for 1 minute then spit. Do not swallow.' },
  { name: 'Kenacort 0.1% Oral Paste (Triamcinolone)', dosage: 'Small dab', frequency: '2-3 times daily after food', duration: '5 days', instructions: 'Apply gently on ulcer/aphthae. Do not rub.' }
];

export default function PrescriptionPad({
  patients = [],
  selectedPatient,
  doctors = [],
  clinicProfile = {},
  medicineFormulary = [],
  onAddPrescription,
  onOpenWhatsApp
}) {
  const [patientId, setPatientId] = useState(selectedPatient?.id || patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || 'DOC-1');
  const [diagnosis, setDiagnosis] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState(null);
  const [padMode, setPadMode] = useState('digital'); // 'digital' | 'blank-paper'
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'bank'
  const [medicines, setMedicines] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [reviewTimeline, setReviewTimeline] = useState('In 5 days or SOS');
  const [bankSearch, setBankSearch] = useState('');

  // Form state for writing custom medicine
  const [customMed, setCustomMed] = useState({
    name: '',
    dosage: '1 tablet',
    frequency: '1 tablet twice daily (1-0-1)',
    duration: '5 days',
    instructions: 'Take after meals'
  });

  const activePatient = patients.find(p => p.id === patientId) || patients[0];
  const activeDoctor = doctors.find(d => d.id === doctorId) || doctors[0];

  // Combine formulary with common medicines
  const allBankMedicines = medicineFormulary.length > 0 ? medicineFormulary : DENTAL_COMMON_MEDICINES;

  // 1. Action: Clear to Blank Page
  const handleClearToBlankPage = () => {
    setMedicines([]);
    setDiagnosis('');
    setInstructions('');
    setPadMode('digital');
    setPdfToast('📄 New Blank Prescription Page ready. Write or select medicines below.');
    setTimeout(() => setPdfToast(null), 4000);
  };

  // 2. Action: Load Standard Sample Template
  const handleLoadSampleTemplate = () => {
    setMedicines([
      {
        name: 'Augmentin 625mg (Amoxicillin + Clavulanate)',
        dosage: '625 mg',
        frequency: '1 tablet twice daily (1-0-1)',
        duration: '5 days',
        instructions: 'Take after food. Complete full course.'
      },
      {
        name: 'Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)',
        dosage: '100/325/15 mg',
        frequency: '1 tablet twice daily (1-0-1)',
        duration: '3 days',
        instructions: 'Take after meals for pain & swelling.'
      },
      {
        name: 'Pantocid 40mg (Pantoprazole)',
        dosage: '40 mg',
        frequency: '1 tablet once daily morning (1-0-0)',
        duration: '5 days',
        instructions: 'Take 30 mins before breakfast.'
      }
    ]);
    setDiagnosis('Deep Dental Caries with Irreversible Pulpitis #16');
    setInstructions('Warm saline gargles 3-4 times daily from tomorrow. Avoid hard or hot food on affected side.');
    setPadMode('digital');
    setPdfToast('📋 Standard Dental Rx Template loaded!');
    setTimeout(() => setPdfToast(null), 3000);
  };

  // 3. Action: Add custom medicine
  const handleAddCustomMedicine = (e) => {
    if (e) e.preventDefault();
    if (!customMed.name.trim()) return;

    setMedicines([
      ...medicines,
      {
        name: customMed.name.trim(),
        dosage: customMed.dosage || '1 tablet',
        frequency: customMed.frequency,
        duration: customMed.duration,
        instructions: customMed.instructions
      }
    ]);

    // Reset form for next medicine
    setCustomMed({
      name: '',
      dosage: '1 tablet',
      frequency: '1 tablet twice daily (1-0-1)',
      duration: '5 days',
      instructions: 'Take after meals'
    });

    setPdfToast(`✅ Added ${customMed.name} to prescription!`);
    setTimeout(() => setPdfToast(null), 2500);
  };

  // 4. Action: Add from Medicine Bank
  const handleAddMedicineFromBank = (med) => {
    setMedicines([
      ...medicines,
      {
        name: med.name,
        dosage: med.dosage || '1 unit',
        frequency: med.frequency || '1 tablet twice daily (1-0-1)',
        duration: med.duration || '5 days',
        instructions: med.instructions || 'Take after meals'
      }
    ]);
    setPdfToast(`✅ Added ${med.name.split('(')[0]} to prescription!`);
    setTimeout(() => setPdfToast(null), 2500);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleSaveRx = () => {
    if (onAddPrescription) {
      onAddPrescription(patientId, {
        doctor: activeDoctor.name,
        diagnosis,
        medicines,
        instructions,
        reviewTimeline
      });
      setPdfToast('💾 Prescription successfully saved to patient records!');
      setTimeout(() => setPdfToast(null), 4000);
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

    // 1. Generate & download the PDF
    await exportToA4Pdf('printable-prescription-pad', filename);
    setDownloadingPdf(false);

    // 2. Prepare message with Auto Link
    const rxAutoLink = `${window.location.origin}/?patientId=${activePatient.id}`;
    const medList = medicines.length > 0
      ? medicines.map((m, i) => `${i + 1}. *${m.name}*\n   Dosage: ${m.frequency} for ${m.duration} (${m.instructions})`).join('\n\n')
      : '• Blank handwritten prescription issued during clinic visit.';

    const msg = `Dear *${activePatient.name}*,\n\nHere is your Digital Dental Prescription from *${clinicProfile.name || 'Apex Dental'}*:\n👨‍⚕️ *Doctor:* ${activeDoctor.name} (${activeDoctor.specialty || 'Dental Surgeon'}, NMC: ${activeDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'})\n\n🩺 *Diagnosis:* ${diagnosis || 'Dental Examination & Therapy'}\n\n💊 *Prescribed Medications:*\n${medList}\n\n⚠️ *Special Advice:* ${instructions || 'Maintain good oral hygiene. Contact clinic if pain persists.'}\n\n📅 *Review Date:* ${reviewTimeline}\n\n🔗 *Digital Rx Auto Link:*\n${rxAutoLink}\n\n📎 *Note:* Your official Prescription PDF has been downloaded as *${filename}*. Please find the attached document.\n\nGet well soon! For queries call ${clinicProfile.phone || '+977 98012 34567'}.`;

    // 3. Open WhatsApp
    onOpenWhatsApp(activePatient.phone, msg);

    // 4. Show toast
    setPdfToast(`📄 Prescription PDF downloaded as ${filename}! In WhatsApp, click 📎 to attach it.`);
    setTimeout(() => setPdfToast(null), 8000);
  };

  const filteredBank = allBankMedicines.filter(m =>
    m.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    (m.dosage && m.dosage.toLowerCase().includes(bankSearch.toLowerCase())) ||
    (m.instructions && m.instructions.toLowerCase().includes(bankSearch.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {pdfToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between no-print animate-fadeIn shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-200" />
            <span>{pdfToast}</span>
          </div>
          <button onClick={() => setPdfToast(null)} className="text-white/80 hover:text-white text-sm font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 no-print">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Dental Prescription (Rx) Pad</span>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                  Medicine Bank Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Start with a blank prescription page, write custom medicines, or pick from dental formulary bank.
              </p>
            </div>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BLANK PAGE BUTTON */}
          <button
            type="button"
            onClick={handleClearToBlankPage}
            className="flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl shadow-2xs transition"
            title="Clear all medicines and start a fresh blank prescription page"
          >
            <FilePlus className="w-4 h-4 text-amber-700" />
            <span>Blank Page (New Rx)</span>
          </button>

          {/* Blank Letterhead Pad Print Mode Toggle */}
          <button
            type="button"
            onClick={() => setPadMode(padMode === 'digital' ? 'blank-paper' : 'digital')}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition shadow-2xs ${
              padMode === 'blank-paper'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
            }`}
            title="Toggle between digital typed prescription and blank ruled pad for handwriting"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{padMode === 'blank-paper' ? 'Mode: Blank Paper Pad' : 'Print Blank Pad (Handwritten)'}</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleTemplate}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
            title="Load sample dental prescription template"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample Rx</span>
          </button>

          <button
            onClick={handleTriggerPrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            title="Print Rx pad"
          >
            <Printer className="w-4 h-4" />
            <span>Print Rx</span>
          </button>

          <button
            onClick={handleSendWhatsAppRx}
            disabled={downloadingPdf}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            title="Download PDF and launch WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{downloadingPdf ? 'Exporting...' : 'Send via WhatsApp'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
            title="Download Rx PDF file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs no-print">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Select Patient</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name} - {p.phone} ({p.id})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Prescribing Doctor</label>
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.specialty || 'Dental Surgeon'}, NMC: {d.regNumber})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Clinical Diagnosis</label>
          <input
            type="text"
            placeholder="e.g. Chronic Generalized Gingivitis, Pulpitis #36..."
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* WRITE OR SELECT NEW MEDICINE SECTION (No-Print) */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-4 space-y-4 no-print">
        {/* Sub-header with Tabs: Write New Medicine vs Select from Bank */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'write'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>✍️ Write New Medicine</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'bank'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              <span>💊 Select from Medicine Bank ({allBankMedicines.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Medicines in current prescription: <strong className="text-blue-900 font-bold">{medicines.length}</strong>
          </div>
        </div>

        {/* TAB 1: WRITE NEW MEDICINE FORM */}
        {activeTab === 'write' && (
          <form onSubmit={handleAddCustomMedicine} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Medicine Name with Suggestions */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Medicine Name & Strength *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="dental-med-suggestions"
                    placeholder="e.g. Amoxicillin 500mg, Ketorol DT, Metrogyl..."
                    value={customMed.name}
                    onChange={(e) => setCustomMed({ ...customMed, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <datalist id="dental-med-suggestions">
                    {DENTAL_COMMON_MEDICINES.map((m, i) => (
                      <option key={i} value={m.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Dosage / Strength */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Dosage Form
                </label>
                <select
                  value={customMed.dosage}
                  onChange={(e) => setCustomMed({ ...customMed, dosage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="1 tablet">1 Tablet</option>
                  <option value="1 capsule">1 Capsule</option>
                  <option value="10 ml">10 ml (Mouthwash)</option>
                  <option value="Small dab">Small Dab (Gel/Paste)</option>
                  <option value="5 ml">5 ml (Syrup)</option>
                  <option value="1 sachet">1 Sachet</option>
                  <option value="1 ampoule">1 Injection</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 days, 3 days..."
                  value={customMed.duration}
                  onChange={(e) => setCustomMed({ ...customMed, duration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Frequency & Instructions Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase">Frequency / Timing</label>
                  <span className="text-[10px] text-slate-400">Click to choose:</span>
                </div>
                <input
                  type="text"
                  value={customMed.frequency}
                  onChange={(e) => setCustomMed({ ...customMed, frequency: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium mb-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1">
                  {['1 tablet twice daily (1-0-1)', '1 tablet thrice daily (1-1-1)', '1 tablet once daily (1-0-0)', '1 tablet night (0-0-1)', '1 tablet SOS (as needed)'].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setCustomMed({ ...customMed, frequency: freq })}
                      className="text-[10px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                    >
                      {freq.split('(')[1]?.replace(')', '') || freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 uppercase">Special Instructions / Route</label>
                  <span className="text-[10px] text-slate-400">Click to choose:</span>
                </div>
                <input
                  type="text"
                  value={customMed.instructions}
                  onChange={(e) => setCustomMed({ ...customMed, instructions: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium mb-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1">
                  {['Take after meals', 'Take before food on empty stomach', 'With plenty of water', 'Swish vigorously 1 min & spit', 'Apply on gums gently'].map((inst) => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => setCustomMed({ ...customMed, instructions: inst })}
                      className="text-[10px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 px-2 py-0.5 rounded font-medium transition"
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm flex items-center space-x-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine to Prescription</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SELECT FROM MEDICINE BANK */}
        {activeTab === 'bank' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search medicine bank by drug name, active ingredient or dosage..."
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* Medicine Bank Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
              {filteredBank.map((med, i) => (
                <div
                  key={med.id || i}
                  className="p-3 bg-white rounded-xl border border-purple-200/80 hover:border-purple-400 text-xs flex flex-col justify-between shadow-2xs transition"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 leading-snug">{med.name}</h4>
                    <p className="text-[11px] text-purple-700 font-semibold mt-0.5">{med.frequency}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Duration: {med.duration} | {med.instructions}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddMedicineFromBank(med)}
                    className="mt-2 w-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[11px] py-1 px-2 rounded-lg flex items-center justify-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Prescription</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PREVIEW OF THE PRESCRIPTION PAD (Print Ready) */}
      <div
        id="printable-prescription-pad"
        className="p-4 sm:p-8 bg-white rounded-2xl border-2 border-slate-300 shadow-md max-w-3xl mx-auto space-y-6 print-container text-slate-800"
      >
        {/* Clinic Letterhead */}
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
              <h3 className="text-xl font-black text-blue-900 tracking-tight">{clinicProfile.name || 'Apex Dentocare & Implant Center'}</h3>
              <p className="text-xs text-blue-700 font-semibold">{clinicProfile.tagline || 'Excellence in Advanced Dental Care'}</p>
              <p className="text-xs text-slate-500 mt-1">{clinicProfile.address || 'Kathmandu, Nepal'}</p>
              <p className="text-xs text-slate-600">📞 {clinicProfile.phone || '+977 98012 34567'} | ✉️ {clinicProfile.email || 'contact@apexdental.com.np'}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <h4 className="text-sm font-bold text-slate-900">{activeDoctor.name}</h4>
            <p className="text-xs text-slate-600">{activeDoctor.qualification || 'BDS, MDS'}</p>
            <p className="text-xs text-slate-500">{activeDoctor.specialty || 'Dental Surgeon'}</p>
            <p className="text-xs font-mono text-slate-500 font-bold">NMC Reg: {activeDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'}</p>
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-200">
          <div><strong>Patient:</strong> {activePatient?.name || 'Walk-in Patient'}</div>
          <div><strong>Age/Sex:</strong> {activePatient?.age || 30} / {activePatient?.gender || 'M'}</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          <div><strong>Rx ID:</strong> RX-{Date.now().toString().slice(-4)}</div>
        </div>

        {activePatient?.allergies?.length > 0 && (
          <div className="text-xs bg-red-100 text-red-800 font-bold px-3 py-1 rounded-md flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
            <span>⚠️ Known Drug Allergies: {Array.isArray(activePatient.allergies) ? activePatient.allergies.join(', ') : activePatient.allergies}</span>
          </div>
        )}

        {/* Diagnosis Row */}
        {diagnosis && (
          <div className="text-xs bg-blue-50/60 text-blue-950 font-bold px-3 py-1.5 rounded-md border border-blue-200">
            <strong>Diagnosis / Clinical Impression:</strong> {diagnosis}
          </div>
        )}

        {/* Rx Symbol & Medication List OR Blank Handwriting Pad */}
        <div className="space-y-4">
          <div className="text-2xl font-serif font-black text-blue-900 italic">℞</div>

          {/* MODE 1: BLANK PAPER PAD FOR HANDWRITING */}
          {padMode === 'blank-paper' ? (
            <div className="space-y-4 py-2">
              <div className="text-xs font-mono text-slate-400 italic text-center pb-1 no-print">
                -- Blank Prescription Pad (Ruled for Doctor's Pen Handwriting) --
              </div>
              <div className="space-y-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((line) => (
                  <div key={line} className="border-b border-dashed border-slate-300 h-6"></div>
                ))}
              </div>
            </div>
          ) : (
            /* MODE 2: DIGITAL TYPED RX TABLE */
            <>
              {medicines.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                  <FilePlus className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">Blank Prescription Page</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No medications added yet. Type a medicine in the <strong>"Write New Medicine"</strong> form above, or click <strong>"Select from Medicine Bank"</strong> to pick medications.
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
                          <td className="p-2 font-bold text-slate-900">{med.name}</td>
                          <td className="p-2 font-semibold text-blue-700">{med.frequency}</td>
                          <td className="p-2 text-slate-600 font-medium">{med.duration}</td>
                          <td className="p-2 text-slate-600 italic">{med.instructions}</td>
                          <td className="p-2 no-print text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove medicine"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
          <div className="flex items-center justify-between">
            <strong className="block text-slate-700 uppercase">Special Advice & Post-Op Guidelines:</strong>
            <div className="flex items-center gap-1 no-print">
              <span className="text-[10px] text-slate-400 font-medium">Quick Advice:</span>
              <button
                type="button"
                onClick={() => setInstructions((prev) => (prev ? prev + ' • Warm saline rinse 3-4x daily.' : 'Warm saline rinse 3-4x daily.'))}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium"
              >
                + Warm Saline
              </button>
              <button
                type="button"
                onClick={() => setInstructions((prev) => (prev ? prev + ' • Soft diet. Avoid hot & spicy foods.' : 'Soft diet. Avoid hot & spicy foods.'))}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium"
              >
                + Soft Diet
              </button>
              <button
                type="button"
                onClick={() => setInstructions((prev) => (prev ? prev + ' • Complete the full antibiotic course without skipping.' : 'Complete full antibiotic course.'))}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium"
              >
                + Full Course
              </button>
            </div>
          </div>
          <textarea
            rows="2"
            placeholder="Type special instructions, oral hygiene advice, or dietary restrictions..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Signature Line & Review Date */}
        <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div className="font-semibold text-slate-700">
              Next Review / Follow-Up:
            </div>
            <input
              type="text"
              value={reviewTimeline}
              onChange={(e) => setReviewTimeline(e.target.value)}
              className="mt-0.5 text-xs text-blue-800 font-bold bg-transparent border-b border-slate-300 focus:outline-none"
            />
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-1"></div>
            <strong className="text-slate-900 block">{activeDoctor.name}</strong>
            <div className="text-[10px] text-slate-500">NMC Reg: {activeDoctor.regNumber || clinicProfile.regNo || 'NMC-84920'}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Authorized Signature & Seal</div>
          </div>
        </div>
      </div>

      {/* Save Button Footer */}
      <div className="flex justify-end no-print pt-2">
        <button
          onClick={handleSaveRx}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5"
        >
          <FileCheck className="w-4 h-4" />
          <span>Save Prescription to Patient Record</span>
        </button>
      </div>
    </div>
  );
}
