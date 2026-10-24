import React, { useState } from 'react';
import { X, Check, Plus, AlertCircle, Sparkles, Trash2 } from 'lucide-react';

export default function ToothModal({
  toothNumber,
  universalNumber,
  toothName,
  data = {},
  treatmentCatalog = [],
  onClose,
  onSaveTooth,
  onAddTreatmentPlan
}) {
  const [condition, setCondition] = useState(data.condition || 'healthy');
  const [surfaces, setSurfaces] = useState(data.surfaces || {
    occlusal: 'healthy',
    mesial: 'healthy',
    distal: 'healthy',
    buccal: 'healthy',
    lingual: 'healthy'
  });
  const [notes, setNotes] = useState(data.notes || '');
  const [pocketDepth, setPocketDepth] = useState(data.pocketDepth || { b: 2, l: 2, m: 2, d: 2 });
  const [mobility, setMobility] = useState(data.mobility || 0);

  // Quick procedure add
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [procedureCost, setProcedureCost] = useState('');

  const conditionOptions = [
    { id: 'healthy', label: 'Healthy / Intact', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'decay', label: 'Dental Caries / Decay', color: 'bg-red-100 text-red-800 border-red-300' },
    { id: 'filling_composite', label: 'Composite Filling', color: 'bg-sky-100 text-sky-800 border-sky-300' },
    { id: 'filling_amalgam', label: 'Amalgam Filling', color: 'bg-slate-200 text-slate-800 border-slate-400' },
    { id: 'crown', label: 'Full Crown / Cap', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: 'rct', label: 'Root Canal (RCT)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    { id: 'missing', label: 'Missing / Extracted', color: 'bg-gray-200 text-gray-800 border-gray-400' },
    { id: 'implant', label: 'Dental Implant', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { id: 'veneer', label: 'Ceramic Veneer', color: 'bg-teal-100 text-teal-800 border-teal-300' },
    { id: 'fracture', label: 'Fractured / Broken', color: 'bg-orange-100 text-orange-800 border-orange-300' }
  ];

  const surfaceNames = [
    { key: 'occlusal', label: 'Occlusal / Incisal (O)' },
    { key: 'mesial', label: 'Mesial (M)' },
    { key: 'distal', label: 'Distal (D)' },
    { key: 'buccal', label: 'Buccal / Facial (B)' },
    { key: 'lingual', label: 'Lingual / Palatal (L)' }
  ];

  const handleToggleSurfaceCondition = (surfKey, newStatus) => {
    setSurfaces(prev => ({
      ...prev,
      [surfKey]: prev[surfKey] === newStatus ? 'healthy' : newStatus
    }));
  };

  const handleSelectProcedureChange = (e) => {
    const val = e.target.value;
    setSelectedProcedure(val);
    const item = treatmentCatalog.find(t => t.id === val);
    if (item) {
      setProcedureCost(item.defaultCost);
    }
  };

  const handleAddPlanClick = () => {
    if (!selectedProcedure) return;
    const item = treatmentCatalog.find(t => t.id === selectedProcedure);
    if (!item) return;

    onAddTreatmentPlan({
      tooth: String(toothNumber),
      procedureName: item.name,
      code: item.code,
      cost: Number(procedureCost) || item.defaultCost,
      status: 'Planned',
      notes: notes || `Planned procedure for tooth ${toothNumber}`
    });

    setSelectedProcedure('');
    setProcedureCost('');
  };

  const handleSave = () => {
    onSaveTooth(toothNumber, {
      toothId: String(toothNumber),
      condition,
      surfaces,
      pocketDepth,
      mobility,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="bg-white/20 text-white font-mono px-2 py-0.5 rounded text-xs sm:text-sm font-black">
                FDI #{toothNumber}
              </span>
              <span className="bg-white/10 text-white/90 font-mono px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold">
                Universal #{universalNumber}
              </span>
              <h2 className="text-base sm:text-lg font-bold">{toothName}</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5">Clinical tooth evaluation, charting & treatment planning</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-slate-800">
          {/* 1. OVERALL TOOTH CONDITION */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              1. Overall Tooth Status / Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {conditionOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCondition(opt.id)}
                  className={`text-xs font-semibold py-2 px-3 rounded-lg border text-left transition flex items-center justify-between ${
                    condition === opt.id
                      ? `${opt.color} ring-2 ring-blue-500 shadow-sm font-bold`
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{opt.label}</span>
                  {condition === opt.id && <Check className="w-4 h-4 ml-1 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. FIVE-SURFACE RESTORATION & CARIES MAP */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Individual Surface Charting (5 Surfaces)
              </label>
              <span className="text-[11px] text-slate-500">Click button to toggle Decay or Composite</span>
            </div>
            <div className="space-y-2">
              {surfaceNames.map((surf) => {
                const currentStatus = surfaces[surf.key];
                return (
                  <div key={surf.key} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 gap-2">
                    <span className="text-xs font-semibold text-slate-800">{surf.label}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSurfaceCondition(surf.key, 'decay')}
                        className={`text-xs px-2.5 py-1 rounded font-medium border transition ${
                          currentStatus === 'decay'
                            ? 'bg-red-600 text-white border-red-700 shadow-sm font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        Caries (Decay)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSurfaceCondition(surf.key, 'filling_composite')}
                        className={`text-xs px-2.5 py-1 rounded font-medium border transition ${
                          currentStatus === 'filling_composite'
                            ? 'bg-sky-600 text-white border-sky-700 shadow-sm font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-600'
                        }`}
                      >
                        Composite
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSurfaceCondition(surf.key, 'filling_amalgam')}
                        className={`text-xs px-2.5 py-1 rounded font-medium border transition ${
                          currentStatus === 'filling_amalgam'
                            ? 'bg-slate-700 text-white border-slate-800 shadow-sm font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        Amalgam
                      </button>
                      {currentStatus !== 'healthy' && (
                        <button
                          type="button"
                          onClick={() => setSurfaces(prev => ({ ...prev, [surf.key]: 'healthy' }))}
                          className="text-xs text-slate-400 hover:text-slate-600 p-1"
                          title="Reset to healthy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. PERIODONTAL PROBING & MOBILITY */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Periodontal Probing Depths (mm) & Mobility
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
              {['b', 'l', 'm', 'd'].map((site) => {
                const label = site === 'b' ? 'Buccal' : site === 'l' ? 'Lingual' : site === 'm' ? 'Mesial' : 'Distal';
                const val = pocketDepth[site] || 2;
                const isDeep = val >= 5;
                return (
                  <div key={site} className="text-center bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">{label}</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={val}
                      onChange={(e) =>
                        setPocketDepth(prev => ({ ...prev, [site]: parseInt(e.target.value) || 1 }))
                      }
                      className={`w-14 text-center text-sm font-bold mt-1 py-1 rounded border ${
                        isDeep ? 'bg-red-50 border-red-400 text-red-600' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:space-x-3 bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-700">Mobility Degree:</span>
              <div className="flex space-x-2">
                {[0, 1, 2, 3].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMobility(m)}
                    className={`px-3 py-0.5 rounded text-xs font-bold border transition ${
                      mobility === m
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    Grade {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. ONE-CLICK ADD TO TREATMENT PLAN */}
          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <label className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                4. Add Treatment to Patient Plan
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProcedure}
                onChange={handleSelectProcedureChange}
                className="flex-1 text-xs py-2 px-3 rounded-lg border border-blue-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose Procedure for Tooth #{toothNumber} --</option>
                {treatmentCatalog.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) - ₹{t.defaultCost}
                  </option>
                ))}
              </select>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Cost ₹"
                  value={procedureCost}
                  onChange={(e) => setProcedureCost(e.target.value)}
                  className="w-24 text-xs py-2 px-2.5 rounded-lg border border-blue-300 bg-white font-semibold text-slate-800"
                />
                <button
                  type="button"
                  disabled={!selectedProcedure}
                  onClick={handleAddPlanClick}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. CLINICAL NOTES */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              5. Clinical Tooth Notes / Observations
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cold sensitivity lingering 5s, marginal ridge defect, periapical radiolucency..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition"
          >
            <Check className="w-4 h-4" />
            <span>Save Chart & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
