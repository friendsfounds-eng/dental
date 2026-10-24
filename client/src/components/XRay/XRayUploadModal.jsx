import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Layers,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react';

const RADIOGRAPH_TYPES = [
  'Panoramic (OPG)',
  'Periapical (IOPA)',
  'Bitewing (BWR)',
  'Cephalometric (Lateral / PA)',
  'Cone Beam 3D (CBCT Slice)',
  'Occlusal View'
];

export default function XRayUploadModal({
  isOpen,
  onClose,
  patients = [],
  preSelectedPatient,
  appointments = [],
  onUploaded,
  authToken,
  activeTenant
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(preSelectedPatient?.id || (patients[0]?.id || ''));
  const [encounterId, setEncounterId] = useState('');
  const [radiographType, setRadiographType] = useState('Panoramic (OPG)');
  const [toothNumbers, setToothNumbers] = useState('');
  const [title, setTitle] = useState('');
  const [diagnosticImpression, setDiagnosticImpression] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Filter encounters (appointments) for selected patient
  const patientAppointments = appointments.filter((apt) => apt.patientId === selectedPatientId);

  // Validate File
  const handleFileChange = (file) => {
    setErrorMsg('');
    if (!file) return;

    const allowedExtensions = ['.dcm', '.png', '.jpeg', '.jpg', '.tiff', '.tif'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setErrorMsg(`Unsupported format (${ext}). Accepted formats: .dcm (DICOM), .png, .jpeg, .tiff`);
      return;
    }

    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSizeBytes) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of 50 MB.`);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(`${radiographType} - ${file.name.replace(/\.[^/.]+$/, '')}`);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Submit Upload Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a radiograph file (.dcm, .png, .jpeg, .tiff) to upload.');
      return;
    }
    if (!selectedPatientId) {
      setErrorMsg('Every X-ray must be strictly linked to a valid Patient ID/MRN.');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg('');
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patientId', selectedPatientId);
      if (encounterId) formData.append('encounterId', encounterId);
      formData.append('radiographType', radiographType);
      formData.append('toothNumbers', toothNumbers || (radiographType === 'Panoramic (OPG)' ? 'Full Arch' : ''));
      formData.append('title', title || `${radiographType} Radiograph`);
      formData.append('diagnosticImpression', diagnosticImpression);
      formData.append('clinicalNotes', clinicalNotes);

      setUploadProgress(60);

      const res = await fetch('/api/xray/upload', {
        method: 'POST',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
        },
        body: formData
      });

      setUploadProgress(90);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload X-ray image.');
      }

      setUploadProgress(100);

      if (onUploaded) {
        onUploaded(data.xray);
      }

      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while uploading radiograph.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Upload Dental Radiograph</h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                AES-256 encrypted server-side storage linked to Patient Electronic Health Record (EHR).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start space-x-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition select-none ${
              dragActive
                ? 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-100'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".dcm,.png,.jpeg,.jpg,.tiff,.tif,application/dicom,image/png,image/jpeg,image/tiff"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-1.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="font-black text-sm text-slate-900 truncate max-w-md mx-auto">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'DICOM/Image'}
                </div>
                <p className="text-[11px] text-emerald-700 font-bold">Click or drop another file to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>
                <div className="font-bold text-sm text-slate-800">
                  Drag and drop dental radiograph here, or <span className="text-blue-600 underline">browse</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepted Formats: <strong>.dcm (DICOM)</strong>, <strong>.png</strong>, <strong>.jpeg</strong>, <strong>.tiff</strong>
                </p>
                <div className="inline-block px-3 py-1 bg-slate-200/80 text-slate-700 rounded-full font-mono text-[10px] font-bold">
                  Max File Size: 50 MB
                </div>
              </div>
            )}
          </div>

          {/* Patient Linking (Mandatory) & Encounter Linking (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                Linked Patient ID / MRN *
              </label>
              {preSelectedPatient ? (
                <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-900 flex items-center justify-between">
                  <span>{preSelectedPatient.name} ({preSelectedPatient.id})</span>
                  <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Locked</span>
                </div>
              ) : (
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    setEncounterId('');
                  }}
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id}) - {p.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                Clinical Encounter / Visit (Optional)
              </label>
              <select
                value={encounterId}
                onChange={(e) => setEncounterId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No linked encounter (Standalone Diagnostic)</option>
                {patientAppointments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.date} - {apt.treatmentType || 'Visit'} ({apt.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Radiograph Type & Teeth Involved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                Radiograph Type *
              </label>
              <select
                value={radiographType}
                onChange={(e) => setRadiographType(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {RADIOGRAPH_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                Tooth / Anatomical Site
              </label>
              <input
                type="text"
                value={toothNumbers}
                onChange={(e) => setToothNumbers(e.target.value)}
                placeholder="e.g. 16, 17 or Full Arch or Quadrant 1"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Scan Title */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
              Study Title / Description
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pre-implant Panoramic OPG or Working Length IOPA #16"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Diagnostic Impression / Radiologist Notes */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
              Diagnostic Impression & Radiologist Findings
            </label>
            <textarea
              rows={2}
              value={diagnosticImpression}
              onChange={(e) => setDiagnosticImpression(e.target.value)}
              placeholder="e.g. Coronal radiolucency approaching pulp chamber #16, normal bone crest levels, periodontal ligament intact..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Encryption & Cloud Architecture Guarantee Strip */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center space-x-3 text-slate-600">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-[11px] leading-tight">
              <strong className="text-slate-900 block">Server-Side AES-256 Encryption & Private Cloud Bucket</strong>
              <span>Images and DICOM metadata are encrypted on ingest with private ACLs and synced to Patient EHR.</span>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                <span>Encrypting & Uploading to Private Vault...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md disabled:opacity-50 flex items-center space-x-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Encrypting & Saving...' : 'Save & Link to EHR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
