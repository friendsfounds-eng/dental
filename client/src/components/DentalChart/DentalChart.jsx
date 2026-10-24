import React, { useState } from 'react';
import ToothAnatomical from './ToothAnatomical';
import ToothModal from './ToothModal';
import PatientOrders from '../Patients/PatientOrders';
import {
  Sparkles,
  RotateCcw,
  Printer,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Baby,
  MessageSquare,
  Package,
  Plus
} from 'lucide-react';

// Adult Dentition Definition
const ADULT_UPPER_RIGHT = [
  { fdi: '18', uni: '1', type: 'molar', name: 'Maxillary Right 3rd Molar (Wisdom)' },
  { fdi: '17', uni: '2', type: 'molar', name: 'Maxillary Right 2nd Molar' },
  { fdi: '16', uni: '3', type: 'molar', name: 'Maxillary Right 1st Molar' },
  { fdi: '15', uni: '4', type: 'premolar', name: 'Maxillary Right 2nd Premolar' },
  { fdi: '14', uni: '5', type: 'premolar', name: 'Maxillary Right 1st Premolar' },
  { fdi: '13', uni: '6', type: 'canine', name: 'Maxillary Right Canine / Cuspid' },
  { fdi: '12', uni: '7', type: 'incisor', name: 'Maxillary Right Lateral Incisor' },
  { fdi: '11', uni: '8', type: 'incisor', name: 'Maxillary Right Central Incisor' }
];

const ADULT_UPPER_LEFT = [
  { fdi: '21', uni: '9', type: 'incisor', name: 'Maxillary Left Central Incisor' },
  { fdi: '22', uni: '10', type: 'incisor', name: 'Maxillary Left Lateral Incisor' },
  { fdi: '23', uni: '11', type: 'canine', name: 'Maxillary Left Canine / Cuspid' },
  { fdi: '24', uni: '12', type: 'premolar', name: 'Maxillary Left 1st Premolar' },
  { fdi: '25', uni: '13', type: 'premolar', name: 'Maxillary Left 2nd Premolar' },
  { fdi: '26', uni: '14', type: 'molar', name: 'Maxillary Left 1st Molar' },
  { fdi: '27', uni: '15', type: 'molar', name: 'Maxillary Left 2nd Molar' },
  { fdi: '28', uni: '16', type: 'molar', name: 'Maxillary Left 3rd Molar (Wisdom)' }
];

const ADULT_LOWER_RIGHT = [
  { fdi: '48', uni: '32', type: 'molar', name: 'Mandibular Right 3rd Molar (Wisdom)' },
  { fdi: '47', uni: '31', type: 'molar', name: 'Mandibular Right 2nd Molar' },
  { fdi: '46', uni: '30', type: 'molar', name: 'Mandibular Right 1st Molar' },
  { fdi: '45', uni: '29', type: 'premolar', name: 'Mandibular Right 2nd Premolar' },
  { fdi: '44', uni: '28', type: 'premolar', name: 'Mandibular Right 1st Premolar' },
  { fdi: '43', uni: '27', type: 'canine', name: 'Mandibular Right Canine / Cuspid' },
  { fdi: '42', uni: '26', type: 'incisor', name: 'Mandibular Right Lateral Incisor' },
  { fdi: '41', uni: '25', type: 'incisor', name: 'Mandibular Right Central Incisor' }
];

const ADULT_LOWER_LEFT = [
  { fdi: '31', uni: '24', type: 'incisor', name: 'Mandibular Left Central Incisor' },
  { fdi: '32', uni: '23', type: 'incisor', name: 'Mandibular Left Lateral Incisor' },
  { fdi: '33', uni: '22', type: 'canine', name: 'Mandibular Left Canine / Cuspid' },
  { fdi: '34', uni: '21', type: 'premolar', name: 'Mandibular Left 1st Premolar' },
  { fdi: '35', uni: '20', type: 'premolar', name: 'Mandibular Left 2nd Premolar' },
  { fdi: '36', uni: '19', type: 'molar', name: 'Mandibular Left 1st Molar' },
  { fdi: '37', uni: '18', type: 'molar', name: 'Mandibular Left 2nd Molar' },
  { fdi: '38', uni: '17', type: 'molar', name: 'Mandibular Left 3rd Molar (Wisdom)' }
];

// Pediatric Dentition Definition
const PED_UPPER_RIGHT = [
  { fdi: '55', uni: 'A', type: 'molar', name: 'Primary Maxillary Right 2nd Molar' },
  { fdi: '54', uni: 'B', type: 'molar', name: 'Primary Maxillary Right 1st Molar' },
  { fdi: '53', uni: 'C', type: 'canine', name: 'Primary Maxillary Right Canine' },
  { fdi: '52', uni: 'D', type: 'incisor', name: 'Primary Maxillary Right Lateral' },
  { fdi: '51', uni: 'E', type: 'incisor', name: 'Primary Maxillary Right Central' }
];

const PED_UPPER_LEFT = [
  { fdi: '61', uni: 'F', type: 'incisor', name: 'Primary Maxillary Left Central' },
  { fdi: '62', uni: 'G', type: 'incisor', name: 'Primary Maxillary Left Lateral' },
  { fdi: '63', uni: 'H', type: 'canine', name: 'Primary Maxillary Left Canine' },
  { fdi: '64', uni: 'I', type: 'molar', name: 'Primary Maxillary Left 1st Molar' },
  { fdi: '65', uni: 'J', type: 'molar', name: 'Primary Maxillary Left 2nd Molar' }
];

const PED_LOWER_RIGHT = [
  { fdi: '85', uni: 'T', type: 'molar', name: 'Primary Mandibular Right 2nd Molar' },
  { fdi: '84', uni: 'S', type: 'molar', name: 'Primary Mandibular Right 1st Molar' },
  { fdi: '83', uni: 'R', type: 'canine', name: 'Primary Mandibular Right Canine' },
  { fdi: '82', uni: 'Q', type: 'incisor', name: 'Primary Mandibular Right Lateral' },
  { fdi: '81', uni: 'P', type: 'incisor', name: 'Primary Mandibular Right Central' }
];

const PED_LOWER_LEFT = [
  { fdi: '71', uni: 'O', type: 'incisor', name: 'Primary Mandibular Left Central' },
  { fdi: '72', uni: 'N', type: 'incisor', name: 'Primary Mandibular Left Lateral' },
  { fdi: '73', uni: 'M', type: 'canine', name: 'Primary Mandibular Left Canine' },
  { fdi: '74', uni: 'L', type: 'molar', name: 'Primary Mandibular Left 1st Molar' },
  { fdi: '75', uni: 'K', type: 'molar', name: 'Primary Mandibular Left 2nd Molar' }
];

export default function DentalChart({
  patient,
  patients = [],
  treatmentCatalog = [],
  onUpdateTooth,
  onAddTreatmentPlan,
  onUpdateTreatmentPlanStatus,
  onOpenWhatsApp,
  clinicProfile = {},
  currentUser,
  activeTenant,
  authToken
}) {
  const [numberingSystem, setNumberingSystem] = useState('fdi'); // 'fdi' | 'universal'
  const [isPediatric, setIsPediatric] = useState(patient?.age && patient.age < 12 ? true : false);
  const [selectedToothId, setSelectedToothId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCondition, setFilterCondition] = useState('all');
  const [chartSubTab, setChartSubTab] = useState('treatment'); // 'treatment' | 'orders'

  const chartData = patient?.dentalChart || {};
  const treatmentPlans = patient?.treatmentPlans || [];

  const handleSendWhatsAppChart = () => {
    if (!onOpenWhatsApp || !patient?.phone) return;

    // Collect dental conditions
    const flaggedTeeth = Object.entries(chartData).filter(([_, data]) => data?.condition && data.condition !== 'healthy');
    const conditionSummary = flaggedTeeth.length > 0
      ? flaggedTeeth.map(([tooth, data]) => `• Tooth #${tooth}: ${data.condition?.replace('_', ' ').toUpperCase()}`).join('\n')
      : 'All charted teeth currently appear healthy/restored.';

    const planSummary = treatmentPlans.length > 0
      ? treatmentPlans.map(tp => `• Tooth #${tp.tooth}: ${tp.procedure} (Status: ${tp.status})`).join('\n')
      : 'No active pending treatment procedures.';

    const chartAutoLink = `${window.location.origin}/?patientId=${patient.id}`;

    const message = `Dear *${patient.name}*,\n\nHere is your Digital Dental Examination & Odontogram Summary from *${clinicProfile.name || 'Apex Dental'}*:\n\n🦷 *Charted Findings:*\n${conditionSummary}\n\n📋 *Treatment Plan:*\n${planSummary}\n\n🔗 *Patient Digital Chart Auto Link:*\n${chartAutoLink}\n\nFor questions or appointment bookings, please call ${clinicProfile.phone || '+977 98012 34567'}.\n\nWarm regards,\n*${clinicProfile.name || 'Apex Dentocare'} Team*`;

    onOpenWhatsApp(patient.phone, message);
  };

  // Find tooth metadata
  const allTeethList = isPediatric
    ? [...PED_UPPER_RIGHT, ...PED_UPPER_LEFT, ...PED_LOWER_RIGHT, ...PED_LOWER_LEFT]
    : [...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT, ...ADULT_LOWER_RIGHT, ...ADULT_LOWER_LEFT];

  const currentToothMeta = allTeethList.find(t => t.fdi === selectedToothId) || {
    fdi: selectedToothId || '11',
    uni: '8',
    name: 'Tooth ' + selectedToothId,
    type: 'incisor'
  };

  const handleSelectTooth = (toothId) => {
    setSelectedToothId(toothId);
    setModalOpen(true);
  };

  // Surface quick toggle directly from the chart
  const handleSurfaceClick = (toothId, surface) => {
    const existing = chartData[toothId] || {
      toothId,
      condition: 'healthy',
      surfaces: { occlusal: 'healthy', mesial: 'healthy', distal: 'healthy', buccal: 'healthy', lingual: 'healthy' }
    };
    const currentSurf = existing.surfaces?.[surface] || 'healthy';
    const nextSurf = currentSurf === 'healthy' ? 'decay' : currentSurf === 'decay' ? 'filling_composite' : 'healthy';

    const updated = {
      ...existing,
      surfaces: {
        ...(existing.surfaces || {}),
        [surface]: nextSurf
      }
    };
    onUpdateTooth && onUpdateTooth(toothId, updated);
  };

  // Legend Items
  const legends = [
    { id: 'all', label: 'All Teeth', color: 'bg-slate-200 border-slate-300' },
    { id: 'decay', label: 'Caries (Decay)', color: 'bg-red-500 text-white' },
    { id: 'filling_composite', label: 'Composite Fill', color: 'bg-sky-400 text-white' },
    { id: 'filling_amalgam', label: 'Amalgam Fill', color: 'bg-slate-600 text-white' },
    { id: 'crown', label: 'Full Crown', color: 'bg-amber-400 text-slate-900' },
    { id: 'rct', label: 'Root Canal (RCT)', color: 'bg-rose-500 text-white' },
    { id: 'implant', label: 'Dental Implant', color: 'bg-slate-800 text-white' },
    { id: 'veneer', label: 'Veneer', color: 'bg-emerald-500 text-white' },
    { id: 'missing', label: 'Extracted / Missing', color: 'bg-gray-300 text-slate-700' }
  ];

  const upperRight = isPediatric ? PED_UPPER_RIGHT : ADULT_UPPER_RIGHT;
  const upperLeft = isPediatric ? PED_UPPER_LEFT : ADULT_UPPER_LEFT;
  const lowerRight = isPediatric ? PED_LOWER_RIGHT : ADULT_LOWER_RIGHT;
  const lowerLeft = isPediatric ? PED_LOWER_LEFT : ADULT_LOWER_LEFT;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 sm:p-6 space-y-4 sm:space-y-6">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
              <span>Interactive Human Dental Chart (Odontogram)</span>
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {isPediatric ? 'Pediatric Dentition (20 Teeth)' : 'Adult Permanent Dentition (32 Teeth)'}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Anatomical human tooth crowns & roots with 5-surface interactive charting. Click tooth for full clinical planner, or click surfaces for quick caries/filling marking.
          </p>
        </div>

        {/* Toggles & Options */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pediatric / Adult toggle */}
          <button
            onClick={() => setIsPediatric(!isPediatric)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
              isPediatric
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>{isPediatric ? 'Deciduous (Pediatric)' : 'Switch to Pediatric'}</span>
          </button>

          {/* FDI vs Universal Numbering */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setNumberingSystem('fdi')}
              className={`px-2.5 py-1 rounded-md transition ${
                numberingSystem === 'fdi'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              FDI (11-48)
            </button>
            <button
              onClick={() => setNumberingSystem('universal')}
              className={`px-2.5 py-1 rounded-md transition ${
                numberingSystem === 'universal'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Universal (1-32)
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Chart</span>
          </button>

          {patient?.phone && (
            <button
              onClick={handleSendWhatsAppChart}
              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              title="Share dental findings & treatment plan to patient via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share via WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Legend */}
      <div className="flex flex-wrap items-center gap-1.5 py-2 px-3 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2">
          Color Key:
        </span>
        {legends.map((leg) => (
          <button
            key={leg.id}
            onClick={() => setFilterCondition(leg.id)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition flex items-center space-x-1 ${leg.color} ${
              filterCondition === leg.id ? 'ring-2 ring-blue-500 shadow-sm' : 'opacity-85 hover:opacity-100'
            }`}
          >
            <span>{leg.label}</span>
          </button>
        ))}
      </div>

      {/* THE ODONTOGRAM CONTAINER */}
      <div className="overflow-x-auto p-4 bg-gradient-to-b from-slate-50/50 to-white rounded-2xl border-2 border-slate-200 shadow-inner">
        <div className="min-w-[780px]">
          {/* UPPER ARCH (MAXILLARY) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
              Maxillary Right (Quadrant 1)
            </span>
            <span className="text-xs font-bold text-blue-700 tracking-wider">
              ▲ UPPER MAXILLARY ARCH ▲
            </span>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
              Maxillary Left (Quadrant 2)
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Q1 Upper Right */}
            <div className="flex gap-1 sm:gap-2 justify-end">
              {upperRight.map((t) => (
                <ToothAnatomical
                  key={t.fdi}
                  toothNumber={t.fdi}
                  universalNumber={t.uni}
                  numberingSystem={numberingSystem}
                  toothType={t.type}
                  isUpper={true}
                  isPediatric={isPediatric}
                  data={chartData[t.fdi] || {}}
                  isSelected={selectedToothId === t.fdi}
                  onSelectTooth={handleSelectTooth}
                  onSurfaceClick={handleSurfaceClick}
                />
              ))}
            </div>

            {/* Anatomical Midline */}
            <div className="flex flex-col items-center justify-center px-1 text-slate-400 select-none">
              <div className="w-0.5 h-36 bg-blue-400/80 rounded-full"></div>
              <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500 py-1">MIDLINE</span>
              <div className="w-0.5 h-36 bg-blue-400/80 rounded-full"></div>
            </div>

            {/* Q2 Upper Left */}
            <div className="flex gap-1 sm:gap-2 justify-start">
              {upperLeft.map((t) => (
                <ToothAnatomical
                  key={t.fdi}
                  toothNumber={t.fdi}
                  universalNumber={t.uni}
                  numberingSystem={numberingSystem}
                  toothType={t.type}
                  isUpper={true}
                  isPediatric={isPediatric}
                  data={chartData[t.fdi] || {}}
                  isSelected={selectedToothId === t.fdi}
                  onSelectTooth={handleSelectTooth}
                  onSurfaceClick={handleSurfaceClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ARCH SEPARATION DIVIDER */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-slate-300"></div>
          </div>
          <span className="relative bg-white px-4 py-1 text-xs font-black uppercase text-slate-500 tracking-widest rounded-full border border-slate-300 shadow-sm">
            OCCLUSAL PLANE
          </span>
        </div>

        {/* LOWER ARCH (MANDIBULAR) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
              Mandibular Right (Quadrant 4)
            </span>
            <span className="text-xs font-bold text-blue-700 tracking-wider">
              ▼ LOWER MANDIBULAR ARCH ▼
            </span>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
              Mandibular Left (Quadrant 3)
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {/* Q4 Lower Right */}
            <div className="flex gap-1 sm:gap-2 justify-end">
              {lowerRight.map((t) => (
                <ToothAnatomical
                  key={t.fdi}
                  toothNumber={t.fdi}
                  universalNumber={t.uni}
                  numberingSystem={numberingSystem}
                  toothType={t.type}
                  isUpper={false}
                  isPediatric={isPediatric}
                  data={chartData[t.fdi] || {}}
                  isSelected={selectedToothId === t.fdi}
                  onSelectTooth={handleSelectTooth}
                  onSurfaceClick={handleSurfaceClick}
                />
              ))}
            </div>

            {/* Anatomical Midline */}
            <div className="flex flex-col items-center justify-center px-1 text-slate-400 select-none">
              <div className="w-0.5 h-36 bg-blue-400/80 rounded-full"></div>
              <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500 py-1">MIDLINE</span>
              <div className="w-0.5 h-36 bg-blue-400/80 rounded-full"></div>
            </div>

            {/* Q3 Lower Left */}
            <div className="flex gap-1 sm:gap-2 justify-start">
              {lowerLeft.map((t) => (
                <ToothAnatomical
                  key={t.fdi}
                  toothNumber={t.fdi}
                  universalNumber={t.uni}
                  numberingSystem={numberingSystem}
                  toothType={t.type}
                  isUpper={false}
                  isPediatric={isPediatric}
                  data={chartData[t.fdi] || {}}
                  isSelected={selectedToothId === t.fdi}
                  onSelectTooth={handleSelectTooth}
                  onSurfaceClick={handleSurfaceClick}
                />
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* LOWER TAB BAR: TREATMENT PLANS vs PATIENT LAB & CUSTOM ORDERS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-slate-200 bg-slate-50/80 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChartSubTab('treatment')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs transition ${
                chartSubTab === 'treatment'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Linked Treatment Plans ({treatmentPlans.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setChartSubTab('orders')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs transition ${
                chartSubTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-indigo-700 border border-slate-200'
              }`}
            >
              <Package className="w-4 h-4 text-indigo-500" />
              <span>Lab & Custom Orders (Patient ID: {patient?.id})</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                {patient?.orders?.length || 0}
              </span>
            </button>
          </div>

          {chartSubTab === 'treatment' ? (
            <span className="text-xs font-semibold text-slate-500">
              Total Estimated: ₹{treatmentPlans.reduce((sum, p) => sum + (p.cost || 0), 0).toLocaleString()}
            </span>
          ) : (
            <span className="text-xs font-semibold text-indigo-600">
              Directly linked to patient ID [{patient?.id}]
            </span>
          )}
        </div>

        {/* Tab 1: Treatment Plans */}
        {chartSubTab === 'treatment' && (
          <div className="p-5">
            {treatmentPlans.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No treatment procedures planned yet. Click on any tooth above to add procedures.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-200/70 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2 px-3 rounded-l-lg">Tooth</th>
                      <th className="py-2 px-3">Procedure & Code</th>
                      <th className="py-2 px-3">Surface / Site</th>
                      <th className="py-2 px-3">Est. Cost</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 rounded-r-lg text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {treatmentPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-blue-600">
                          Tooth #{plan.tooth}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{plan.procedureName}</span>
                          {plan.code && (
                            <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                              {plan.code}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">
                          {plan.surface || 'All'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          ₹{plan.cost?.toLocaleString() || 0}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              plan.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : plan.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {plan.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {plan.status !== 'Completed' && (
                            <button
                              type="button"
                              onClick={() => onUpdateTreatmentPlanStatus && onUpdateTreatmentPlanStatus(plan.id, 'Completed')}
                              className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded transition"
                            >
                              Mark Completed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Custom Orders & Lab Work Directly Linked to Patient ID */}
        {chartSubTab === 'orders' && (
          <div className="p-5">
            <PatientOrders
              patient={patient}
              patients={patients}
              currentUser={currentUser}
              activeTenant={activeTenant}
              clinicProfile={clinicProfile}
              authToken={authToken}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* TOOTH MODAL */}
      {modalOpen && (
        <ToothModal
          toothNumber={selectedToothId}
          universalNumber={currentToothMeta.uni}
          toothName={currentToothMeta.name}
          data={chartData[selectedToothId] || {}}
          treatmentCatalog={treatmentCatalog}
          onClose={() => setModalOpen(false)}
          onSaveTooth={onUpdateTooth}
          onAddTreatmentPlan={onAddTreatmentPlan}
        />
      )}
    </div>
  );
}
