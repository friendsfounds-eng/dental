import React from 'react';

/**
 * ToothAnatomical:
 * High-definition, bold, anatomical SVG representation of a human tooth.
 * Renders realistic crown silhouettes, anatomical roots, pulp chambers,
 * and visual states: Healthy, Decay, Composite, Amalgam, Crown, RCT, Missing, Implant, Veneer, Fracture.
 * Includes interactive 5-surface mapping (Occlusal, Mesial, Distal, Buccal, Lingual).
 */
export default function ToothAnatomical({
  toothNumber,
  universalNumber,
  numberingSystem = 'fdi', // 'fdi' or 'universal'
  data = {},
  isUpper = true,
  toothType = 'molar', // 'molar' | 'premolar' | 'canine' | 'incisor'
  isPediatric = false,
  isSelected = false,
  onSelectTooth,
  onSurfaceClick,
  compact = false
}) {
  const displayNumber = numberingSystem === 'universal' ? universalNumber : toothNumber;
  const condition = data.condition || 'healthy';
  const surfaces = data.surfaces || {
    occlusal: 'healthy',
    mesial: 'healthy',
    distal: 'healthy',
    buccal: 'healthy',
    lingual: 'healthy'
  };

  const isDecayed = condition === 'decay' || Object.values(surfaces).some(s => s === 'decay');
  const isComposite = condition === 'filling_composite' || Object.values(surfaces).some(s => s === 'filling_composite');
  const isAmalgam = condition === 'filling_amalgam' || Object.values(surfaces).some(s => s === 'filling_amalgam');
  const isCrown = condition === 'crown';
  const isRCT = condition === 'rct';
  const isMissing = condition === 'missing';
  const isImplant = condition === 'implant';
  const isVeneer = condition === 'veneer';
  const isFracture = condition === 'fracture';

  // Surface fill colors
  const getSurfaceColor = (surfaceName) => {
    const status = surfaces[surfaceName] || 'healthy';
    if (status === 'decay') return '#dc2626'; // Red
    if (status === 'filling_composite') return '#38bdf8'; // Sky blue
    if (status === 'filling_amalgam') return '#64748b'; // Slate silver
    return '#f8fafc'; // Clean enamel
  };

  // Dimensions
  const width = compact ? 52 : 72;
  const height = compact ? 100 : 138;

  // Crowns & roots shapes depending on tooth type & upper/lower
  const renderToothVisual = () => {
    if (isMissing) {
      return (
        <g opacity="0.35">
          {/* Faded ghost outline */}
          <rect x="10" y="10" width="52" height="70" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="8" y1="8" x2="64" y2="76" stroke="#ef4444" strokeWidth="3" />
          <line x1="64" y1="8" x2="8" y2="76" stroke="#ef4444" strokeWidth="3" />
          <text x="36" y="48" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="bold">EXTRACTED</text>
        </g>
      );
    }

    if (isImplant) {
      return (
        <g>
          {/* Titanium screw fixture */}
          <defs>
            <linearGradient id={`implantGrad-${toothNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          {/* Implant Root Screw */}
          <rect x="26" y={isUpper ? "10" : "42"} width="20" height="36" rx="4" fill={`url(#implantGrad-${toothNumber})`} stroke="#0f172a" strokeWidth="2" />
          {/* Screw Threads */}
          <line x1="24" y1={isUpper ? "18" : "50"} x2="48" y2={isUpper ? "18" : "50"} stroke="#e2e8f0" strokeWidth="2" />
          <line x1="24" y1={isUpper ? "26" : "58"} x2="48" y2={isUpper ? "26" : "58"} stroke="#e2e8f0" strokeWidth="2" />
          <line x1="24" y1={isUpper ? "34" : "66"} x2="48" y2={isUpper ? "34" : "66"} stroke="#e2e8f0" strokeWidth="2" />
          
          {/* Abutment & Crown */}
          <path
            d={isUpper
              ? "M 16 46 Q 14 62 18 72 Q 36 76 54 72 Q 58 62 56 46 Z"
              : "M 16 38 Q 14 22 18 12 Q 36 8 54 12 Q 58 22 56 38 Z"}
            fill="#f8fafc"
            stroke="#0284c7"
            strokeWidth="2.5"
          />
          <text x="36" y={isUpper ? "64" : "28"} textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="bold">IMPLANT</text>
        </g>
      );
    }

    // Standard Anatomical Render with Root + Crown
    const rootFill = "#fef9c3"; // Dentin pale yellowish
    const crownFill = isCrown
      ? "#fef08a" // Gold / Zirconia yellow
      : isVeneer
      ? "#d1fae5" // Aesthetic Mint
      : "url(#enamelGrad)";

    return (
      <g>
        <defs>
          <linearGradient id="enamelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="rctGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <filter id="toothShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* 1. ANATOMICAL ROOTS */}
        {isUpper ? (
          // Upper Teeth (Roots point UP)
          <g>
            {toothType === 'molar' ? (
              // 3 ROOTS: Mesiobuccal, Distobuccal, Palatal
              <g stroke="#334155" strokeWidth="2" fill={rootFill}>
                {/* Palatal Root (Center) */}
                <path d="M 32 44 Q 36 8 36 4 Q 40 8 40 44 Z" />
                {/* Mesial Root */}
                <path d="M 18 44 Q 14 14 20 6 Q 26 14 28 44 Z" />
                {/* Distal Root */}
                <path d="M 44 44 Q 46 14 52 6 Q 58 14 54 44 Z" />
                {/* RCT Gutta-Percha lines */}
                {isRCT && (
                  <g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M 20 8 Q 17 22 23 44" fill="none" />
                    <path d="M 36 6 Q 36 24 36 44" fill="none" />
                    <path d="M 52 8 Q 50 22 49 44" fill="none" />
                  </g>
                )}
              </g>
            ) : toothType === 'premolar' ? (
              // 2 ROOTS
              <g stroke="#334155" strokeWidth="2" fill={rootFill}>
                <path d="M 22 44 Q 22 10 28 6 Q 32 12 34 44 Z" />
                <path d="M 38 44 Q 40 12 44 6 Q 50 10 50 44 Z" />
                {isRCT && (
                  <g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M 28 8 Q 28 24 30 44" fill="none" />
                    <path d="M 44 8 Q 43 24 42 44" fill="none" />
                  </g>
                )}
              </g>
            ) : (
              // CANINE & INCISOR (1 Single Long Strong Root)
              <g stroke="#334155" strokeWidth="2" fill={rootFill}>
                <path d={toothType === 'canine'
                  ? "M 22 44 Q 30 4 36 2 Q 42 4 50 44 Z"
                  : "M 24 44 Q 32 8 36 6 Q 40 8 48 44 Z"} />
                {isRCT && (
                  <path d="M 36 4 L 36 44" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
                )}
              </g>
            )}
          </g>
        ) : (
          // Lower Teeth (Roots point DOWN)
          <g>
            {toothType === 'molar' ? (
              // 2 ROOTS: Mesial & Distal curved
              <g stroke="#334155" strokeWidth="2" fill={rootFill}>
                {/* Mesial Root */}
                <path d="M 18 36 Q 16 68 22 76 Q 28 68 30 36 Z" />
                {/* Distal Root */}
                <path d="M 42 36 Q 44 68 50 76 Q 56 68 54 36 Z" />
                {isRCT && (
                  <g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M 22 74 Q 20 54 24 36" fill="none" />
                    <path d="M 50 74 Q 49 54 48 36" fill="none" />
                  </g>
                )}
              </g>
            ) : toothType === 'premolar' ? (
              // 1 Single Tapered Root
              <g stroke="#334155" strokeWidth="2" fill={rootFill}>
                <path d="M 26 36 Q 32 68 36 74 Q 40 68 46 36 Z" />
                {isRCT && (
                  <path d="M 36 72 L 36 36" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
                )}
              </g>
            ) : (
              // CANINE & INCISOR
              <g stroke="#334155" strokeWidth="2" fill={rootFill}>
                <path d="M 26 36 Q 32 70 36 76 Q 40 70 46 36 Z" />
                {isRCT && (
                  <path d="M 36 74 L 36 36" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
                )}
              </g>
            )}
          </g>
        )}

        {/* 2. ANATOMICAL CROWN */}
        {isUpper ? (
          // Upper Crown (bottom portion)
          <g filter="url(#toothShadow)">
            {toothType === 'molar' ? (
              // Multi-cusp broad molar crown
              <path
                d="M 14 44 C 12 56 14 74 24 76 C 30 78 42 78 48 76 C 58 74 60 56 58 44 C 54 41 50 42 36 42 C 22 42 18 41 14 44 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            ) : toothType === 'premolar' ? (
              // Bicuspid crown
              <path
                d="M 18 44 C 16 54 18 72 28 75 C 36 77 44 75 54 72 C 56 54 56 44 36 43 C 24 43 20 44 18 44 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            ) : toothType === 'canine' ? (
              // Pointed cusp canine crown
              <path
                d="M 20 44 C 18 56 22 70 36 78 C 50 70 54 56 52 44 C 42 42 30 42 20 44 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            ) : (
              // Incisor spatulate crown
              <path
                d="M 18 44 C 16 56 16 72 18 75 C 30 76 42 76 54 75 C 56 72 56 56 54 44 C 42 43 30 43 18 44 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            )}

            {/* Specular enamel highlight */}
            {!isCrown && (
              <path d="M 24 48 Q 28 58 26 66" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
            )}
          </g>
        ) : (
          // Lower Crown (top portion)
          <g filter="url(#toothShadow)">
            {toothType === 'molar' ? (
              // Broad lower molar
              <path
                d="M 14 36 C 12 24 14 6 24 4 C 30 2 42 2 48 4 C 58 6 60 24 58 36 C 54 39 50 38 36 38 C 22 38 18 39 14 36 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            ) : toothType === 'premolar' ? (
              <path
                d="M 18 36 C 16 26 18 8 28 5 C 36 3 44 5 54 8 C 56 26 56 36 36 37 C 24 37 20 36 18 36 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            ) : toothType === 'canine' ? (
              // Pointed cusp lower canine
              <path
                d="M 20 36 C 18 24 22 10 36 2 C 50 10 54 24 52 36 C 42 38 30 38 20 36 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            ) : (
              // Lower incisor narrow chisel crown
              <path
                d="M 20 36 C 18 24 18 8 20 5 C 30 4 42 4 52 5 C 54 8 54 24 52 36 C 42 37 30 37 20 36 Z"
                fill={crownFill}
                stroke={isCrown ? "#d97706" : "#334155"}
                strokeWidth={isCrown ? "3" : "2"}
              />
            )}

            {!isCrown && (
              <path d="M 24 32 Q 28 22 26 14" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
            )}
          </g>
        )}

        {/* 3. FRACTURE OVERLAY */}
        {isFracture && (
          <path
            d="M 18 52 L 28 58 L 38 52 L 48 60 L 56 55"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* 4. CROWN BADGE */}
        {isCrown && (
          <text x="36" y={isUpper ? "64" : "22"} textAnchor="middle" fill="#b45309" fontSize="9" fontWeight="900">
            CROWN
          </text>
        )}
      </g>
    );
  };

  // 5-Surface Interactive Chart (Geometric Odontogram polygon)
  // Center: Occlusal/Incisal (O)
  // Top: Buccal/Facial (B) or Lingual (L) depending on arch
  // Bottom: Lingual/Palatal (L/P)
  // Left: Mesial (M)
  // Right: Distal (D)
  const renderSurfaceDiagram = () => {
    return (
      <svg
        viewBox="0 0 40 40"
        className="w-8 h-8 mx-auto my-1 rounded-sm border border-slate-300 shadow-inner bg-slate-100 hover:scale-110 transition-transform cursor-pointer"
        title={`Surface map for tooth ${toothNumber}`}
      >
        {/* Buccal (Top) */}
        <polygon
          points="0,0 40,0 30,10 10,10"
          fill={getSurfaceColor('buccal')}
          stroke="#475569"
          strokeWidth="1.2"
          onClick={(e) => {
            e.stopPropagation();
            onSurfaceClick && onSurfaceClick(toothNumber, 'buccal');
          }}
          className="hover:opacity-80 transition-opacity"
        />
        {/* Lingual (Bottom) */}
        <polygon
          points="10,30 30,30 40,40 0,40"
          fill={getSurfaceColor('lingual')}
          stroke="#475569"
          strokeWidth="1.2"
          onClick={(e) => {
            e.stopPropagation();
            onSurfaceClick && onSurfaceClick(toothNumber, 'lingual');
          }}
          className="hover:opacity-80 transition-opacity"
        />
        {/* Mesial (Left) */}
        <polygon
          points="0,0 10,10 10,30 0,40"
          fill={getSurfaceColor('mesial')}
          stroke="#475569"
          strokeWidth="1.2"
          onClick={(e) => {
            e.stopPropagation();
            onSurfaceClick && onSurfaceClick(toothNumber, 'mesial');
          }}
          className="hover:opacity-80 transition-opacity"
        />
        {/* Distal (Right) */}
        <polygon
          points="40,0 40,40 30,30 30,10"
          fill={getSurfaceColor('distal')}
          stroke="#475569"
          strokeWidth="1.2"
          onClick={(e) => {
            e.stopPropagation();
            onSurfaceClick && onSurfaceClick(toothNumber, 'distal');
          }}
          className="hover:opacity-80 transition-opacity"
        />
        {/* Occlusal / Incisal (Center) */}
        <polygon
          points="10,10 30,10 30,30 10,30"
          fill={getSurfaceColor('occlusal')}
          stroke="#475569"
          strokeWidth="1.2"
          onClick={(e) => {
            e.stopPropagation();
            onSurfaceClick && onSurfaceClick(toothNumber, 'occlusal');
          }}
          className="hover:opacity-80 transition-opacity"
        />
      </svg>
    );
  };

  return (
    <div
      onClick={() => onSelectTooth && onSelectTooth(toothNumber)}
      className={`relative flex flex-col items-center justify-between p-1 rounded-xl transition-all select-none cursor-pointer group ${
        isSelected
          ? 'bg-blue-100 ring-4 ring-blue-500 shadow-lg scale-105 z-20'
          : 'bg-white hover:bg-blue-50/70 hover:shadow-md border border-slate-200'
      }`}
      style={{ minWidth: compact ? '48px' : '62px' }}
    >
      {/* Upper arch: Tooth Number at Top */}
      {isUpper && (
        <div className="flex flex-col items-center mb-0.5">
          <span className="text-xs font-black text-slate-800 tracking-tight leading-none">
            {displayNumber}
          </span>
          {numberingSystem === 'fdi' && (
            <span className="text-[9px] text-slate-500 font-semibold leading-none">
              #{universalNumber}
            </span>
          )}
        </div>
      )}

      {/* For Upper: 5-Surface Diagram above anatomical root */}
      {isUpper && renderSurfaceDiagram()}

      {/* Anatomical SVG Graphic */}
      <div className="relative">
        <svg
          viewBox="0 0 72 82"
          width={width}
          height={height * 0.65}
          className="overflow-visible filter drop-shadow-sm group-hover:scale-105 transition-transform"
        >
          {renderToothVisual()}
        </svg>

        {/* Condition Indicator Pill */}
        {condition !== 'healthy' && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shadow-sm ${
                isDecayed
                  ? 'bg-red-600 text-white animate-pulse'
                  : isRCT
                  ? 'bg-rose-500 text-white'
                  : isCrown
                  ? 'bg-amber-500 text-white'
                  : isImplant
                  ? 'bg-slate-700 text-white'
                  : isVeneer
                  ? 'bg-emerald-600 text-white'
                  : isComposite
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-600 text-white'
              }`}
            >
              {condition.replace('filling_', '').toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* For Lower: 5-Surface Diagram below anatomical crown */}
      {!isUpper && renderSurfaceDiagram()}

      {/* Lower arch: Tooth Number at Bottom */}
      {!isUpper && (
        <div className="flex flex-col items-center mt-0.5">
          <span className="text-xs font-black text-slate-800 tracking-tight leading-none">
            {displayNumber}
          </span>
          {numberingSystem === 'fdi' && (
            <span className="text-[9px] text-slate-500 font-semibold leading-none">
              #{universalNumber}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
