import React, { useState } from 'react';
import { Ruler, Shield, Zap, Droplet, Wind } from 'lucide-react';

interface CrossSectionCalloutProps {
  onClose?: () => void;
  isEmbedded?: boolean; // When rendered inside the map canvas as an engineering inset
}

export const CrossSectionCallout: React.FC<CrossSectionCalloutProps> = ({
  onClose,
  isEmbedded = false,
}) => {
  const [driveWidth, setDriveWidth] = useState(4.5);
  const [driveHeight, setDriveHeight] = useState(4.5);
  const [rockBolts, setRockBolts] = useState(true);
  const [supportClass, setSupportClass] = useState<'Class 1 (Good)' | 'Class 2 (Fair)' | 'Class 3 (Poor)'>('Class 2 (Fair)');

  // SVG dimensions for the cross-section
  const width = 360;
  const height = 360;
  const centerX = 180;
  const floorY = 270;
  const roofY = floorY - 180 * (driveHeight / 4.5);
  const halfSpan = 90 * (driveWidth / 4.5);
  const shoulderY = floorY - 100 * (driveHeight / 4.5);

  // Arched drive profile SVG path
  const drivePath = `
    M ${centerX - halfSpan} ${floorY}
    L ${centerX - halfSpan} ${shoulderY}
    Q ${centerX - halfSpan} ${roofY} ${centerX} ${roofY}
    Q ${centerX + halfSpan} ${roofY} ${centerX + halfSpan} ${shoulderY}
    L ${centerX + halfSpan} ${floorY}
    Z
  `;

  // Outer fractured rock envelope path
  const rockEnvelope = `
    M ${centerX - halfSpan - 30} ${floorY + 25}
    L ${centerX - halfSpan - 35} ${shoulderY}
    L ${centerX - halfSpan - 20} ${roofY - 20}
    L ${centerX} ${roofY - 35}
    L ${centerX + halfSpan + 20} ${roofY - 20}
    L ${centerX + halfSpan + 35} ${shoulderY}
    L ${centerX + halfSpan + 30} ${floorY + 25}
    Z
  `;

  // Rock bolt patterns radiating outwards
  const bolts = [
    { x1: centerX - halfSpan + 10, y1: shoulderY + 20, x2: centerX - halfSpan - 35, y2: shoulderY + 30 },
    { x1: centerX - halfSpan + 8, y1: shoulderY - 15, x2: centerX - halfSpan - 40, y2: shoulderY - 25 },
    { x1: centerX - 55, y1: roofY + 18, x2: centerX - 85, y2: roofY - 25 },
    { x1: centerX - 20, y1: roofY + 8, x2: centerX - 30, y2: roofY - 45 },
    { x1: centerX + 20, y1: roofY + 8, x2: centerX + 30, y2: roofY - 45 },
    { x1: centerX + 55, y1: roofY + 18, x2: centerX + 85, y2: roofY - 25 },
    { x1: centerX + halfSpan - 8, y1: shoulderY - 15, x2: centerX + halfSpan + 40, y2: shoulderY - 25 },
    { x1: centerX + halfSpan - 10, y1: shoulderY + 20, x2: centerX + halfSpan + 35, y2: shoulderY + 30 },
  ];

  const content = (
    <div className="flex flex-col items-center">
      <div className="text-center mb-2">
        <h3 className="font-bold text-slate-100 text-xs tracking-tight">
          Typical Drive Section A – A'
        </h3>
        <p className="text-[11px] text-slate-400">
          (Standard Development Drive Profile: {driveWidth.toFixed(1)}m × {driveHeight.toFixed(1)}m)
        </p>
      </div>

      <div className="relative border border-slate-700/80 rounded-lg p-2 bg-slate-950/70 shadow-inner">
        <svg
          viewBox="0 0 360 340"
          className="w-72 h-68 select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rock mass stipple pattern */}
            <pattern id="rock_stipple" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="0.8" fill="#64748b" opacity="0.6" />
              <circle cx="12" cy="10" r="1.0" fill="#475569" opacity="0.7" />
              <circle cx="8" cy="14" r="0.6" fill="#64748b" opacity="0.5" />
            </pattern>
            {/* Dimension marker */}
            <marker id="dim_arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Surrounding Host Rock Mass */}
          <path d={rockEnvelope} fill="url(#rock_stipple)" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Rock Bolts & Face Plates */}
          {rockBolts &&
            bolts.map((b, idx) => (
              <g key={idx}>
                {/* Bolt tendon */}
                <line
                  x1={b.x1}
                  y1={b.y1}
                  x2={b.x2}
                  y2={b.y2}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Bearing plate on excavation surface */}
                <circle cx={b.x1} cy={b.y1} r="3" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
              </g>
            ))}

          {/* Excavated Drive Opening */}
          <path
            d={drivePath}
            fill="#0f172a"
            stroke="#f1f5f9"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Roadway Sill / Ballast Floor */}
          <rect
            x={centerX - halfSpan + 5}
            y={floorY - 10}
            width={halfSpan * 2 - 10}
            height="10"
            fill="#334155"
            opacity="0.8"
          />
          {/* Drainage ditch */}
          <rect
            x={centerX - halfSpan + 5}
            y={floorY - 8}
            width="14"
            height="12"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Overhead Mining Services on Right Sidewall & Crown */}
          {/* Electrical Cable Tray (Yellow) */}
          <rect
            x={centerX + halfSpan - 26}
            y={shoulderY - 25}
            width="18"
            height="7"
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth="1"
            rx="2"
          />
          <text
            x={centerX + halfSpan - 24}
            y={shoulderY - 30}
            fontSize="8"
            fontFamily="monospace"
            fill="#facc15"
          >
            11 kV
          </text>

          {/* Water Dewatering Header (Blue) */}
          <circle
            cx={centerX + halfSpan - 14}
            cy={shoulderY}
            r="5"
            fill="#2563eb"
            stroke="#1d4ed8"
            strokeWidth="1"
          />
          <text
            x={centerX + halfSpan - 8}
            y={shoulderY + 3}
            fontSize="8"
            fontFamily="monospace"
            fill="#60a5fa"
          >
            DN150
          </text>

          {/* Compressed Air Header (Green) */}
          <circle
            cx={centerX + halfSpan - 14}
            cy={shoulderY + 16}
            r="4.5"
            fill="#16a34a"
            stroke="#15803d"
            strokeWidth="1"
          />
          <text
            x={centerX + halfSpan - 8}
            y={shoulderY + 19}
            fontSize="8"
            fontFamily="monospace"
            fill="#4ade80"
          >
            AIR
          </text>

          {/* Horizontal Width Dimension (4.5 m) */}
          <line
            x1={centerX - halfSpan}
            y1={roofY - 22}
            x2={centerX + halfSpan}
            y2={roofY - 22}
            stroke="#94a3b8"
            strokeWidth="1.2"
            markerStart="url(#dim_arrow)"
            markerEnd="url(#dim_arrow)"
          />
          <line x1={centerX - halfSpan} y1={shoulderY} x2={centerX - halfSpan} y2={roofY - 28} stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1={centerX + halfSpan} y1={shoulderY} x2={centerX + halfSpan} y2={roofY - 28} stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 2" />
          <text
            x={centerX}
            y={roofY - 26}
            textAnchor="middle"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#e2e8f0"
          >
            {driveWidth.toFixed(1)} m
          </text>

          {/* Vertical Height Dimension (4.5 m) */}
          <line
            x1={centerX - halfSpan - 20}
            y1={roofY}
            x2={centerX - halfSpan - 20}
            y2={floorY}
            stroke="#94a3b8"
            strokeWidth="1.2"
            markerStart="url(#dim_arrow)"
            markerEnd="url(#dim_arrow)"
          />
          <line x1={centerX - halfSpan} y1={floorY} x2={centerX - halfSpan - 25} y2={floorY} stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1={centerX} y1={roofY} x2={centerX - halfSpan - 25} y2={roofY} stroke="#64748b" strokeWidth="0.8" strokeDasharray="2 2" />
          <text
            x={centerX - halfSpan - 28}
            y={(roofY + floorY) / 2}
            textAnchor="middle"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#e2e8f0"
            transform={`rotate(-90 ${centerX - halfSpan - 28} ${(roofY + floorY) / 2})`}
          >
            {driveHeight.toFixed(1)} m
          </text>
        </svg>
      </div>

      {/* Legend & Ground Support Spec */}
      <div className="w-full mt-3 p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Ground Support:</span>
          <span className="font-semibold text-slate-200">{supportClass}</span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          2.4 m resin-grouted friction bolts @ 1.2 m × 1.2 m ring spacing + 5.6 mm galvanised mesh.
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
          <span className="flex items-center gap-1 text-yellow-400">
            <Zap className="w-3 h-3" /> 11kV Tray
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <Droplet className="w-3 h-3" /> DN150 Dewatering
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Wind className="w-3 h-3" /> Air Reticulation
          </span>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-200">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Typical Excavation Cross-Section A – A'
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Engineering profile standards for development drives, services, and ground support.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Return to Plan View
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visual Callout */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col items-center">
            {content}
          </div>

          {/* Interactive Parameters */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4 text-xs">
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4 text-cyan-400" />
              <span>Section Dimensions & Specifications</span>
            </h3>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Excavation Width</span>
                <span className="font-mono text-cyan-400 font-bold">{driveWidth.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="6.0"
                step="0.1"
                value={driveWidth}
                onChange={(e) => setDriveWidth(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Excavation Height</span>
                <span className="font-mono text-cyan-400 font-bold">{driveHeight.toFixed(1)} m</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="6.0"
                step="0.1"
                value={driveHeight}
                onChange={(e) => setDriveHeight(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Ground Support Standard</label>
              <select
                value={supportClass}
                onChange={(e) => setSupportClass(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded p-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="Class 1 (Good)">Class 1 (Good Rock) - Spot bolting only</option>
                <option value="Class 2 (Fair)">Class 2 (Fair Rock) - 2.4m bolts @ 1.2m mesh</option>
                <option value="Class 3 (Poor)">Class 3 (Poor Rock) - Cable bolts + 75mm shotcrete</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300">Show Rock Bolt Reinforcement</span>
              <button
                onClick={() => setRockBolts(!rockBolts)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  rockBolts
                    ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rockBolts ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">Engineering Clearance Note:</div>
              <div>• Minimum clearance above 50-tonne haul truck: 0.85 m</div>
              <div>• Services mounted on high-wall side away from driver cab</div>
              <div>• Roadway crossfall 2% draining into invert ditch</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
