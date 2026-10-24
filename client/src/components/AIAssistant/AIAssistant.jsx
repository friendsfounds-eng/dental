import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Stethoscope,
  FileText,
  MessageCircle,
  Copy,
  Check,
  Send,
  AlertTriangle,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function AIAssistant({
  patient,
  doctors = [],
  onSaveSoapNote,
  onOpenWhatsApp
}) {
  const [activeTab, setActiveTab] = useState('diagnose'); // 'diagnose' | 'soap' | 'explainer'

  // Diagnostic State
  const [symptoms, setSymptoms] = useState('');
  const [toothNumber, setToothNumber] = useState(patient?.treatmentPlans?.[0]?.tooth || '16');
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [diagResult, setDiagResult] = useState(null);

  // SOAP State
  const [chiefComplaint, setChiefComplaint] = useState('Severe pain and cold sensitivity in tooth area for 3 days');
  const [procedureDone, setProcedureDone] = useState('Access cavity preparation, pulp extirpation, working length determination under 2% Lignocaine');
  const [prescriptionGiven, setPrescriptionGiven] = useState('Zerodol-SP 1-0-1 for 3 days, Augmentin 625mg 1-0-1 for 5 days');
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.name || 'Dr. Yugal Sharma');
  const [soapResult, setSoapResult] = useState(null);
  const [loadingSoap, setLoadingSoap] = useState(false);
  const [soapSaved, setSoapSaved] = useState(false);

  // Explainer State
  const [procedureToExplain, setProcedureToExplain] = useState('Root Canal Treatment');
  const [explainResult, setExplainResult] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [copiedLang, setCopiedLang] = useState(null);

  // Handlers
  const handleRunDiagnosis = async () => {
    if (!symptoms.trim()) return;
    setLoadingDiag(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          toothNumber,
          patientAge: patient?.age,
          medicalHistory: patient?.medicalHistory
        })
      });
      const data = await res.json();
      setDiagResult(data);
    } catch (err) {
      console.error('Diagnosis error:', err);
    } finally {
      setLoadingDiag(false);
    }
  };

  const handleGenerateSoap = async () => {
    setLoadingSoap(true);
    setSoapSaved(false);
    try {
      const res = await fetch('/api/ai/soap-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName: selectedDoctor,
          patientName: patient?.name,
          toothNumber,
          chiefComplaint,
          procedureDone,
          prescriptionGiven
        })
      });
      const data = await res.json();
      setSoapResult(data);
    } catch (err) {
      console.error('SOAP error:', err);
    } finally {
      setLoadingSoap(false);
    }
  };

  const handleSaveSoapToPatient = () => {
    if (!soapResult || !onSaveSoapNote) return;
    const content = `SUBJECTIVE: ${soapResult.subjective}\nOBJECTIVE: ${soapResult.objective}\nASSESSMENT: ${soapResult.assessment}\nPLAN: ${soapResult.plan}`;
    onSaveSoapNote({
      doctor: selectedDoctor,
      type: 'SOAP',
      content
    });
    setSoapSaved(true);
  };

  const handleExplainProcedure = async () => {
    setLoadingExplain(true);
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procedureName: procedureToExplain })
      });
      const data = await res.json();
      setExplainResult(data);
    } catch (err) {
      console.error('Explain error:', err);
    } finally {
      setLoadingExplain(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedLang(type);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>AI Dental Clinical Assistant</span>
              <span className="text-[11px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                AI Clinical Diagnostic Engine
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              AI-driven diagnostic suggestions, automated SOAP clinical documentation, and patient-friendly multi-lingual communication.
            </p>
          </div>
        </div>

        {patient && (
          <div className="text-right bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
            <span className="text-[11px] text-purple-600 font-semibold block">Active Patient</span>
            <span className="text-xs font-bold text-slate-900">{patient.name} ({patient.id})</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('diagnose')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'diagnose'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Symptom Diagnostic & CDT Suggestions</span>
        </button>

        <button
          onClick={() => setActiveTab('soap')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'soap'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>AI SOAP Clinical Notes</span>
        </button>

        <button
          onClick={() => setActiveTab('explainer')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'explainer'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Patient Explainer (EN & Hindi)</span>
        </button>
      </div>

      {/* TAB 1: DIAGNOSTIC ASSISTANT */}
      {activeTab === 'diagnose' && (
        <div className="space-y-5">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Symptoms & Clinical Presentation
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Sharp throbbing pain at night, lingers with hot and cold, tender to bite..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tooth # Involved
                </label>
                <input
                  type="text"
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  placeholder="e.g. 16, 36, 48"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500">Quick Presets:</span>
              {[
                'Severe throbbing night pain, lingering cold sensitivity',
                'Bleeding gums during brushing, bad breath, plaque buildup',
                'Pain around lower jaw wisdom tooth, difficulty opening mouth',
                'Broken chipped front tooth from sports injury'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSymptoms(preset)}
                  className="text-[10px] bg-white border border-slate-300 hover:border-purple-400 text-slate-700 px-2.5 py-1 rounded-full transition"
                >
                  {preset.slice(0, 32)}...
                </button>
              ))}
            </div>

            <button
              onClick={handleRunDiagnosis}
              disabled={loadingDiag || !symptoms.trim()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loadingDiag ? 'Analyzing Clinical Findings...' : 'Generate AI Diagnosis & Plan'}</span>
            </button>
          </div>

          {/* DIAGNOSTIC OUTPUT */}
          {diagResult && (
            <div className="p-5 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30 rounded-2xl border border-purple-200 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                    Primary Clinical Impression
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{diagResult.primaryDiagnosis}</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    diagResult.urgency === 'Urgent'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {diagResult.urgency} Case
                </span>
              </div>

              {/* Differential Diagnoses */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">Differential Diagnoses:</span>
                <div className="flex flex-wrap gap-2">
                  {diagResult.differentialDiagnoses?.map((dd, idx) => (
                    <span key={idx} className="bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-medium">
                      {dd}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Treatments & CDT Codes */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">Recommended Clinical Procedures:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {diagResult.suggestedTreatments?.map((t, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-purple-100 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{t.name}</span>
                        <span className="text-[10px] text-purple-600 font-mono font-bold">{t.code}</span>
                      </div>
                      <span className="text-xs font-black text-slate-800">₹{t.cost?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Protocol Advice */}
              <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-1.5 mb-1 text-purple-900 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>Clinical Chairside Protocol & Precautions:</span>
                </div>
                <p className="text-xs text-purple-950 leading-relaxed font-medium">
                  {diagResult.clinicalAdvice}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI SOAP NOTE GENERATOR */}
      {activeTab === 'soap' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor in Attendance
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>{d.name} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tooth #
                </label>
                <input
                  type="text"
                  value={toothNumber}
                  onChange={(e) => setToothNumber(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Chief Complaint / Patient Statement
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Procedure Rendered
              </label>
              <input
                type="text"
                value={procedureDone}
                onChange={(e) => setProcedureDone(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prescription Given
              </label>
              <input
                type="text"
                value={prescriptionGiven}
                onChange={(e) => setPrescriptionGiven(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <button
              onClick={handleGenerateSoap}
              disabled={loadingSoap}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loadingSoap ? 'Generating SOAP Documentation...' : 'Generate Full SOAP Note'}</span>
            </button>
          </div>

          {soapResult && (
            <div className="p-5 bg-white rounded-2xl border-2 border-purple-200 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Medicolegal Clinical Record (SOAP Format)
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveSoapToPatient}
                    disabled={soapSaved}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition shadow-sm"
                  >
                    {soapSaved ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>{soapSaved ? 'Saved to Patient EHR' : 'Save to Patient EHR'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-800">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <strong className="text-purple-700 font-bold block mb-0.5">S (Subjective):</strong>
                  <p>{soapResult.subjective}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <strong className="text-purple-700 font-bold block mb-0.5">O (Objective):</strong>
                  <p>{soapResult.objective}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <strong className="text-purple-700 font-bold block mb-0.5">A (Assessment):</strong>
                  <p>{soapResult.assessment}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <strong className="text-purple-700 font-bold block mb-0.5">P (Plan):</strong>
                  <p>{soapResult.plan}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PATIENT EXPLAINER & TRANSLATOR */}
      {activeTab === 'explainer' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select or Type Dental Procedure to Explain:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={procedureToExplain}
                onChange={(e) => setProcedureToExplain(e.target.value)}
                placeholder="e.g. Root Canal Treatment, Dental Implant, Zirconia Crown, Composite Filling"
                className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300"
              />
              <button
                onClick={handleExplainProcedure}
                disabled={loadingExplain || !procedureToExplain.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loadingExplain ? 'Explaining...' : 'Explain for Patient'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {['Root Canal Treatment', 'Dental Implant', 'Zirconia Crown', 'Composite Filling'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setProcedureToExplain(p);
                  }}
                  className="text-xs bg-white border border-slate-300 hover:border-purple-400 text-slate-700 px-3 py-1 rounded-full transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {explainResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              {/* English Explanation */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      English (Patient-Friendly)
                    </span>
                    <button
                      onClick={() => copyToClipboard(explainResult.english, 'en')}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                    >
                      {copiedLang === 'en' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'en' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {explainResult.english}
                  </p>
                </div>
                {patient?.phone && (
                  <button
                    onClick={() => onOpenWhatsApp && onOpenWhatsApp(patient.phone, explainResult.english)}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </button>
                )}
              </div>

              {/* Hindi Explanation */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      Hindi (Simplified Explanation)
                    </span>
                    <button
                      onClick={() => copyToClipboard(explainResult.hindi, 'hi')}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                    >
                      {copiedLang === 'hi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLang === 'hi' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {explainResult.hindi}
                  </p>
                </div>
                {patient?.phone && (
                  <button
                    onClick={() => onOpenWhatsApp && onOpenWhatsApp(patient.phone, explainResult.hindi)}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
