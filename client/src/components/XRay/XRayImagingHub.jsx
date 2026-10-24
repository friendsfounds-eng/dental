import React, { useState, useEffect } from 'react';
import {
  Activity,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Tag,
  Download,
  Calendar,
  User,
  ShieldCheck,
  Sparkles,
  Layers,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import XRayViewerModal from './XRayViewerModal';
import XRayUploadModal from './XRayUploadModal';

const TYPE_FILTERS = [
  { id: 'all', label: 'All Radiographs' },
  { id: 'Panoramic (OPG)', label: 'Panoramic (OPG)' },
  { id: 'Periapical (IOPA)', label: 'Periapical (IOPA)' },
  { id: 'Bitewing (BWR)', label: 'Bitewing (BWR)' },
  { id: 'Cephalometric (Lateral / PA)', label: 'Cephalometric' },
  { id: 'Cone Beam 3D (CBCT Slice)', label: '3D CBCT' }
];

export default function XRayImagingHub({
  patients = [],
  appointments = [],
  currentUser,
  activeTenant,
  authToken,
  onNavigateTab
}) {
  const [xrays, setXrays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all'); // 'all' | 'dcm' | 'png' | 'jpeg' | 'tiff'

  // Modal states
  const [viewingXray, setViewingXray] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch all radiographs for clinic tenant
  const fetchXrays = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/xray', {
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          'x-tenant-id': activeTenant?.id || 'tenant-nepal-dental'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setXrays(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch radiographs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchXrays();
  }, [activeTenant?.id]);

  // Filtered X-rays
  const filteredXrays = xrays.filter((x) => {
    const s = search.toLowerCase();
    const matchesSearch =
      !s ||
      (x.title && x.title.toLowerCase().includes(s)) ||
      (x.patientName && x.patientName.toLowerCase().includes(s)) ||
      (x.patientId && x.patientId.toLowerCase().includes(s)) ||
      (x.diagnosticImpression && x.diagnosticImpression.toLowerCase().includes(s)) ||
      (x.fileName && x.fileName.toLowerCase().includes(s));

    if (!matchesSearch) return false;

    if (selectedType !== 'all' && x.radiographType !== selectedType) {
      return false;
    }

    if (selectedFormat !== 'all') {
      const ext = (x.format || '').toLowerCase();
      if (selectedFormat === 'dcm' && ext !== 'dcm') return false;
      if (selectedFormat === 'png' && ext !== 'png') return false;
      if (selectedFormat === 'jpeg' && ext !== 'jpeg' && ext !== 'jpg') return false;
      if (selectedFormat === 'tiff' && ext !== 'tiff' && ext !== 'tif') return false;
    }

    return true;
  });

  // Calculate stats
  const totalCount = xrays.length;
  const opgCount = xrays.filter((x) => x.radiographType === 'Panoramic (OPG)').length;
  const iopaCount = xrays.filter((x) => x.radiographType === 'Periapical (IOPA)').length;
  const bitewingCount = xrays.filter((x) => x.radiographType === 'Bitewing (BWR)').length;
  const cephOrCbctCount = xrays.filter(
    (x) => x.radiographType?.includes('Ceph') || x.radiographType?.includes('CBCT')
  ).length;

  const totalBytes = xrays.reduce((sum, x) => sum + (Number(x.fileSize) || 0), 0);
  const totalMbFormatted = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Dental Radiography & Diagnostic Imaging
              </h2>
              <p className="text-xs text-blue-200/90 font-medium">
                PACS-compatible digital imaging vault with DICOM (.dcm), PNG, JPEG, TIFF support (Up to 50 MB per scan).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-300 pt-1 flex-wrap gap-y-1">
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Private Cloud Vault • AES-256-GCM Server-Side Encryption
            </span>
            <span>•</span>
            <span className="text-slate-400">Time-limited pre-signed URLs for zero data leakage</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={fetchXrays}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            title="Refresh Radiographs List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Radiograph</span>
          </button>
        </div>
      </div>

      {/* VITAL KPI RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Radiographs</span>
          <span className="text-xl font-black text-slate-900 mt-0.5 block">{totalCount}</span>
          <span className="text-[10px] text-slate-500">All clinical studies</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-blue-500 block">Panoramic (OPG)</span>
          <span className="text-xl font-black text-blue-700 mt-0.5 block">{opgCount}</span>
          <span className="text-[10px] text-slate-500">Full arch surveys</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-indigo-500 block">Periapical (IOPA)</span>
          <span className="text-xl font-black text-indigo-700 mt-0.5 block">{iopaCount}</span>
          <span className="text-[10px] text-slate-500">Root & apex scans</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">Bitewing (BWR)</span>
          <span className="text-xl font-black text-amber-600 mt-0.5 block">{bitewingCount}</span>
          <span className="text-[10px] text-slate-500">Interproximal checks</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-purple-500 block">Ceph & 3D CBCT</span>
          <span className="text-xl font-black text-purple-700 mt-0.5 block">{cephOrCbctCount}</span>
          <span className="text-[10px] text-slate-500">Orthodontic & 3D</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Encrypted Storage</span>
          <span className="text-xl font-black text-emerald-700 mt-0.5 block">{totalMbFormatted} MB</span>
          <span className="text-[10px] text-slate-500">AES-256 Vault</span>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Patient Name, Patient ID (e.g. AS-1012), Study Title, or Findings..."
              className="w-full text-xs pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Format Filter Dropdown */}
          <div className="flex items-center space-x-2 flex-shrink-0 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Format:</span>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700"
            >
              <option value="all">All Formats</option>
              <option value="dcm">.dcm (DICOM)</option>
              <option value="png">.png</option>
              <option value="jpeg">.jpeg</option>
              <option value="tiff">.tiff</option>
            </select>
          </div>
        </div>

        {/* Type Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs select-none">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 flex-shrink-0 ${
                selectedType === t.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RADIOGRAPHS GALLERY / GRID */}
      {filteredXrays.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-400 space-y-3">
          <Activity className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Dental Radiographs Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload panoramic, periapical, bitewing, or cephalometric scans (.dcm, .png, .jpeg, .tiff up to 50MB) to link them securely to Patient EHRs.
          </p>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload First Radiograph</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredXrays.map((xray) => {
            const isDicom = xray.format === 'dcm' || !!xray.dicomMetadata;
            const teethStr = Array.isArray(xray.toothNumbers) ? xray.toothNumbers.join(', ') : xray.toothNumbers;

            return (
              <div
                key={xray.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Top Image Preview Card (Click to View) */}
                  <div
                    onClick={() => setViewingXray(xray)}
                    className="relative bg-slate-950 h-44 flex items-center justify-center cursor-pointer overflow-hidden group-hover:brightness-105 transition"
                  >
                    <img
                      src={xray.preSignedUrl || `/api/xray/stream/${xray.id}`}
                      alt={xray.title}
                      className="max-h-full max-w-full object-contain select-none"
                    />

                    {/* Top Badges Overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
                      <span className="font-mono text-[9px] font-black bg-blue-600/90 text-white px-2 py-0.5 rounded shadow-sm">
                        {xray.id}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded shadow-sm ${
                        isDicom ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'
                      }`}>
                        {isDicom ? 'DICOM' : xray.format?.toUpperCase()}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-bold bg-slate-900/90 text-slate-200 border border-slate-700/80 px-2 py-0.5 rounded shadow-sm">
                        {xray.radiographType}
                      </span>
                    </div>

                    {/* Hover Overlay Hint */}
                    <div className="absolute inset-0 bg-blue-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white font-bold text-xs">
                      <Eye className="w-4 h-4" />
                      <span>Open in Diagnostic Viewer</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    {/* Patient Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {xray.patientName?.charAt(0) || 'P'}
                        </div>
                        <span className="font-black text-xs text-slate-900 truncate">
                          {xray.patientName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 rounded">
                          {xray.patientId}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-medium">
                        {xray.uploadedAt ? new Date(xray.uploadedAt).toLocaleDateString() : 'Today'}
                      </span>
                    </div>

                    {/* Title & Teeth */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
                        {xray.title}
                      </h4>
                      {teethStr && (
                        <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                          Teeth: #{teethStr}
                        </span>
                      )}
                    </div>

                    {/* Diagnostic Impression */}
                    {xray.diagnosticImpression && (
                      <p className="text-[11px] text-slate-600 italic line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                        "{xray.diagnosticImpression}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setViewingXray(xray)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Radiograph</span>
                  </button>

                  <a
                    href={xray.preSignedUrl || `/api/xray/stream/${xray.id}`}
                    download={xray.fileName || `${xray.id}.${xray.format || 'png'}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                    title="Download Decrypted File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DIAGNOSTIC VIEWER MODAL */}
      <XRayViewerModal
        xray={viewingXray}
        isOpen={!!viewingXray}
        onClose={() => setViewingXray(null)}
        onSaveFindings={async (id, updates) => {
          await fetch(`/api/xray/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
            },
            body: JSON.stringify(updates)
          });
          fetchXrays();
        }}
        currentUser={currentUser}
        authToken={authToken}
      />

      {/* UPLOAD MODAL */}
      <XRayUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        patients={patients}
        appointments={appointments}
        onUploaded={(newXray) => {
          setXrays((prev) => [newXray, ...prev]);
          setViewingXray(newXray);
        }}
        authToken={authToken}
        activeTenant={activeTenant}
      />
    </div>
  );
}
