import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Sun,
  Contrast,
  Ruler,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Tag,
  Info,
  Calendar,
  User,
  Activity,
  Save,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';

export default function XRayViewerModal({
  xray,
  isOpen,
  onClose,
  onSaveFindings,
  currentUser,
  authToken
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100); // 50% - 200%
  const [contrast, setContrast] = useState(100); // 50% - 250%
  const [inverted, setInverted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showDicomModal, setShowDicomModal] = useState(false);
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState([]);
  const [measuredDistanceMm, setMeasuredDistanceMm] = useState(null);

  // Diagnostic findings state
  const [findingsText, setFindingsText] = useState('');
  const [isSavingFindings, setIsSavingFindings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (xray) {
      setFindingsText(xray.diagnosticImpression || xray.clinicalNotes || '');
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setBrightness(100);
      setContrast(100);
      setInverted(false);
      setMeasurementPoints([]);
      setMeasuredDistanceMm(null);
    }
  }, [xray]);

  if (!isOpen || !xray) return null;

  // Handle Zoom In / Out
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setInverted(false);
    setMeasurementPoints([]);
    setMeasuredDistanceMm(null);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.15, 4));
    } else {
      setZoom((prev) => Math.max(prev - 0.15, 0.4));
    }
  };

  // Pan controls
  const handleMouseDown = (e) => {
    if (showMeasurement) {
      // Measurement tool click
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (measurementPoints.length === 0 || measurementPoints.length === 2) {
        setMeasurementPoints([{ x: clickX, y: clickY }]);
        setMeasuredDistanceMm(null);
      } else if (measurementPoints.length === 1) {
        const pt1 = measurementPoints[0];
        const pt2 = { x: clickX, y: clickY };
        setMeasurementPoints([pt1, pt2]);

        // Calculate distance in pixels
        const dx = pt2.x - pt1.x;
        const dy = pt2.y - pt1.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);

        // Standard digital dental radiograph pixel spacing (~0.08 to 0.12 mm/pixel calibrated at 1.0 zoom)
        const calibratedMmPerPx = 0.1 / zoom;
        const distMm = (distPx * calibratedMmPerPx).toFixed(1);
        setMeasuredDistanceMm(distMm);
      }
      return;
    }

    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning || showMeasurement) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Save diagnostic findings
  const handleSaveNotes = async () => {
    try {
      setIsSavingFindings(true);
      if (onSaveFindings) {
        await onSaveFindings(xray.id, { diagnosticImpression: findingsText });
      } else {
        await fetch(`/api/xray/${xray.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify({ diagnosticImpression: findingsText })
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(`Error saving findings: ${err.message}`);
    } finally {
      setIsSavingFindings(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const imageUrl = xray.preSignedUrl || `/api/xray/stream/${xray.id}`;
  const dicomMeta = xray.dicomMetadata;
  const isDicom = xray.format === 'dcm' || !!dicomMeta;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn ${
      fullscreen ? 'p-0' : ''
    }`}>
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full ${
        fullscreen ? 'h-screen rounded-none border-none' : 'max-w-6xl max-h-[96vh]'
      }`}>
        {/* TOP DIAGNOSTIC HEADER */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3 border-b border-slate-800/80 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold flex-shrink-0 shadow-inner">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {xray.title || 'Dental Radiograph'}
                </h3>
                <span className="font-mono text-[10px] font-bold bg-slate-800 text-blue-300 px-2 py-0.5 rounded border border-slate-700">
                  {xray.id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDicom ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700/60' : 'bg-emerald-900/50 text-emerald-300 border-emerald-700/60'
                }`}>
                  {isDicom ? 'DICOM Part 10' : xray.format?.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 truncate">
                <span className="font-semibold text-slate-200">Patient: {xray.patientName} ({xray.patientId})</span>
                <span>•</span>
                <span>Type: <strong className="text-blue-300">{xray.radiographType}</strong></span>
                {xray.encounterId && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">Encounter: <strong>{xray.encounterId}</strong></span>
                  </>
                )}
                <span>•</span>
                <span className="text-emerald-400 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> AES-256 Encrypted
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Tools */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {isDicom && (
              <button
                type="button"
                onClick={() => setShowDicomModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center space-x-1"
                title="Inspect extracted DICOM Part 10 tags & exposure metadata"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">DICOM Tags</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Print Radiograph with Diagnostic Header"
            >
              <Printer className="w-4 h-4" />
            </button>

            <a
              href={imageUrl}
              download={xray.fileName || `${xray.id}.${xray.format || 'png'}`}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Download Original Decrypted File"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => setFullscreen((prev) => !prev)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={fullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DIAGNOSTIC WORKSPACE CONTROLS TOOLBAR */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 text-xs flex-wrap select-none flex-shrink-0">
          {/* Zoom & Pan Group */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Zoom In (or scroll wheel)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] font-bold text-slate-300 px-2 min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Zoom Out (or scroll wheel)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-800 mx-1"></div>
            <button
              type="button"
              onClick={handleResetView}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1"
              title="Reset Zoom, Pan & Adjustments"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold hidden md:inline">Reset</span>
            </button>
          </div>

          {/* Window Leveling: Brightness & Contrast Sliders */}
          <div className="flex items-center space-x-4 bg-slate-950 p-1.5 px-3 rounded-xl border border-slate-800 text-[11px]">
            {/* Brightness */}
            <div className="flex items-center space-x-2">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="range"
                min="40"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                title={`Brightness: ${brightness}%`}
              />
              <span className="font-mono text-[10px] text-slate-400 w-8">{brightness}%</span>
            </div>

            {/* Contrast */}
            <div className="flex items-center space-x-2">
              <Contrast className="w-3.5 h-3.5 text-blue-400" />
              <input
                type="range"
                min="50"
                max="250"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                title={`Contrast: ${contrast}%`}
              />
              <span className="font-mono text-[10px] text-slate-400 w-8">{contrast}%</span>
            </div>

            {/* Invert Colors (Negative Film vs Positive Radiograph) */}
            <button
              type="button"
              onClick={() => setInverted((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 ${
                inverted
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Invert negative radiograph into positive view"
            >
              <Sliders className="w-3 h-3" />
              <span>Invert Film</span>
            </button>
          </div>

          {/* Caliper / Measurement Tool */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowMeasurement((prev) => !prev);
                setMeasurementPoints([]);
                setMeasuredDistanceMm(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                showMeasurement
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Click two points on the radiograph to measure distance in millimeters"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>{showMeasurement ? 'Caliper Active' : 'Measure (mm)'}</span>
            </button>

            {measuredDistanceMm && (
              <span className="font-mono text-xs font-black bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-lg border border-sky-400/40">
                📏 {measuredDistanceMm} mm
              </span>
            )}
          </div>
        </div>

        {/* RADIOGRAPH CANVAS / INTERACTIVE IMAGE STAGE */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 overflow-hidden relative flex items-center justify-center bg-black cursor-${
            showMeasurement ? 'crosshair' : isPanning ? 'grabbing' : 'grab'
          }`}
          style={{ minHeight: '380px' }}
        >
          {/* Main X-ray Image with Dynamic WebGL/CSS Filters */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out'
            }}
            className="relative select-none pointer-events-none"
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={xray.title || 'Dental Radiograph'}
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                  inverted ? 'invert(1)' : ''
                }`,
                maxHeight: fullscreen ? '86vh' : '62vh',
                maxWidth: '92vw',
                objectFit: 'contain'
              }}
              className="rounded-lg shadow-2xl block border border-slate-800/60"
              draggable={false}
            />
          </div>

          {/* Caliper Measurement Drawing Overlay */}
          {showMeasurement && measurementPoints.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              {measurementPoints.map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
              ))}
              {measurementPoints.length === 2 && (
                <>
                  <line
                    x1={measurementPoints[0].x}
                    y1={measurementPoints[0].y}
                    x2={measurementPoints[1].x}
                    y2={measurementPoints[1].y}
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                  />
                  <g
                    transform={`translate(${
                      (measurementPoints[0].x + measurementPoints[1].x) / 2
                    }, ${
                      (measurementPoints[0].y + measurementPoints[1].y) / 2 - 12
                    })`}
                  >
                    <rect x="-35" y="-14" width="70" height="20" rx="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                    <text x="0" y="0" fill="#ffffff" fontFamily="monospace" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {measuredDistanceMm} mm
                    </text>
                  </g>
                </>
              )}
            </svg>
          )}

          {/* Scale Overlay on Bottom Left */}
          <div className="absolute bottom-3 left-4 pointer-events-none z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-300">
            <div>Zoom: <strong className="text-white">{Math.round(zoom * 100)}%</strong></div>
            <div className="text-[10px] text-slate-400">
              {xray.dicomMetadata?.exposure?.kvp || '70 kVp'} • {xray.dicomMetadata?.exposure?.tubeCurrent || '7 mA'}
            </div>
          </div>
        </div>

        {/* DIAGNOSTIC FINDINGS & DOCTOR CLINICAL IMPRESSION FOOTER */}
        <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Radiological Impression & Diagnostic Notes</span>
              </span>
              {saveSuccess && (
                <span className="text-emerald-400 font-bold flex items-center text-[11px] animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Findings saved to Patient EHR!
                </span>
              )}
            </div>

            <input
              type="text"
              value={findingsText}
              onChange={(e) => setFindingsText(e.target.value)}
              placeholder="e.g. Periapical radiolucency #16, 2.5mm bone loss, rule out apical periodontitis..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 self-end md:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isSavingFindings}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingFindings ? 'Saving...' : 'Save Findings'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* DICOM TAGS INSPECTOR MODAL */}
      {showDicomModal && dicomMeta && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-white shadow-2xl">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-sm">DICOM Part 10 Header Tags</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowDicomModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div><span className="text-slate-500">Modality:</span> <strong>{dicomMeta.modality} ({dicomMeta.modalityDescription})</strong></div>
                <div><span className="text-slate-500">Patient ID:</span> <strong>{dicomMeta.patientID || xray.patientId}</strong></div>
                <div><span className="text-slate-500">Patient Name:</span> <strong>{dicomMeta.patientName || xray.patientName}</strong></div>
                <div><span className="text-slate-500">Study Date:</span> <strong>{dicomMeta.studyDate || 'N/A'}</strong></div>
                <div><span className="text-slate-500">Manufacturer:</span> <strong>{dicomMeta.manufacturer}</strong></div>
                <div><span className="text-slate-500">Model:</span> <strong>{dicomMeta.manufacturerModel || 'Standard'}</strong></div>
                <div><span className="text-slate-500">Dimensions:</span> <strong>{dicomMeta.dimensions?.rows} x {dicomMeta.dimensions?.columns} px</strong></div>
                <div><span className="text-slate-500">Bits Stored:</span> <strong>{dicomMeta.dimensions?.bitsStored} bits ({dicomMeta.dimensions?.bitsAllocated} alloc)</strong></div>
                <div><span className="text-slate-500">KVP:</span> <strong>{dicomMeta.exposure?.kvp}</strong></div>
                <div><span className="text-slate-500">Tube Current:</span> <strong>{dicomMeta.exposure?.tubeCurrent}</strong></div>
                <div><span className="text-slate-500">Exposure Time:</span> <strong>{dicomMeta.exposure?.exposureTime}</strong></div>
                <div><span className="text-slate-500">Window Center/Width:</span> <strong>{dicomMeta.windowing?.windowCenter} / {dicomMeta.windowing?.windowWidth}</strong></div>
              </div>

              {dicomMeta.rawTags && Object.keys(dicomMeta.rawTags).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Raw DICOM Tag Dump:</span>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-56 overflow-y-auto space-y-1 text-[11px]">
                    {Object.entries(dicomMeta.rawTags).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-slate-900 pb-0.5">
                        <span className="text-indigo-300">{k}:</span>
                        <span className="text-slate-300 font-semibold truncate max-w-xs">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDicomModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
