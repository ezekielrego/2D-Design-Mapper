import React from 'react';
import {
  X,
  Trash2,
  Copy,
  ShieldCheck,
  AlertTriangle,
  Move,
  Check,
} from 'lucide-react';
import {
  MinePlan,
  Tunnel,
  GeologicalFeature,
  VentilationUtility,
  MapSymbol,
  MapAnnotation,
  HatchPattern,
  TunnelType,
} from '../types/mine';

interface PropertyInspectorProps {
  selectedId: string | null;
  selectedType: 'tunnel' | 'geology' | 'utility' | 'symbol' | 'annotation' | null;
  plan: MinePlan;
  setPlan: React.Dispatch<React.SetStateAction<MinePlan>>;
  onClose: () => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedId,
  selectedType,
  plan,
  setPlan,
  onClose,
}) => {
  if (!selectedId || !selectedType) return null;

  // Find the selected object
  let tunnel: Tunnel | undefined;
  let geology: GeologicalFeature | undefined;
  let utility: VentilationUtility | undefined;
  let symbol: MapSymbol | undefined;
  let annotation: MapAnnotation | undefined;

  if (selectedType === 'tunnel') tunnel = plan.tunnels.find((t) => t.id === selectedId);
  else if (selectedType === 'geology') geology = plan.geologicalFeatures.find((g) => g.id === selectedId);
  else if (selectedType === 'utility') utility = plan.ventilationUtilities.find((u) => u.id === selectedId);
  else if (selectedType === 'symbol') symbol = plan.symbols.find((s) => s.id === selectedId);
  else if (selectedType === 'annotation') annotation = plan.annotations.find((a) => a.id === selectedId);

  if (!tunnel && !geology && !utility && !symbol && !annotation) return null;

  const handleDelete = () => {
    if (selectedType === 'tunnel') {
      setPlan((prev) => ({ ...prev, tunnels: prev.tunnels.filter((t) => t.id !== selectedId) }));
    } else if (selectedType === 'geology') {
      setPlan((prev) => ({ ...prev, geologicalFeatures: prev.geologicalFeatures.filter((g) => g.id !== selectedId) }));
    } else if (selectedType === 'utility') {
      setPlan((prev) => ({ ...prev, ventilationUtilities: prev.ventilationUtilities.filter((u) => u.id !== selectedId) }));
    } else if (selectedType === 'symbol') {
      setPlan((prev) => ({ ...prev, symbols: prev.symbols.filter((s) => s.id !== selectedId) }));
    } else if (selectedType === 'annotation') {
      setPlan((prev) => ({ ...prev, annotations: prev.annotations.filter((a) => a.id !== selectedId) }));
    }
    onClose();
  };

  const handleDuplicate = () => {
    const offset = 20; // 20m offset
    if (tunnel) {
      const copy: Tunnel = {
        ...tunnel,
        id: `t-${Date.now()}`,
        name: `${tunnel.name} (Copy)`,
        points: tunnel.points.map((p) => ({ x: p.x + offset, y: p.y + offset })),
      };
      setPlan((prev) => ({ ...prev, tunnels: [...prev.tunnels, copy] }));
    } else if (geology) {
      const copy: GeologicalFeature = {
        ...geology,
        id: `geo-${Date.now()}`,
        name: `${geology.name} (Copy)`,
        points: geology.points.map((p) => ({ x: p.x + offset, y: p.y + offset })),
      };
      setPlan((prev) => ({ ...prev, geologicalFeatures: [...prev.geologicalFeatures, copy] }));
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none z-20 text-xs overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400">
            {selectedType}
          </span>
          <h2 className="font-semibold text-slate-100 text-sm truncate max-w-[200px]">
            {tunnel?.name || geology?.name || utility?.name || symbol?.name || annotation?.text || 'Properties'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Survey Certification Tag */}
        {(tunnel || geology || utility || symbol) && (
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-slate-400">Survey Certification</div>
              <div className="text-xs font-mono">
                {(tunnel?.isSurveyed || geology?.isSurveyed || utility?.isSurveyed || symbol?.isSurveyed)
                  ? 'Certified Survey Geometry'
                  : 'Illustrative Draft Geometry'}
              </div>
            </div>
            <button
              onClick={() => {
                if (tunnel) {
                  setPlan((prev) => ({
                    ...prev,
                    tunnels: prev.tunnels.map((t) =>
                      t.id === tunnel!.id ? { ...t, isSurveyed: !t.isSurveyed } : t
                    ),
                  }));
                } else if (geology) {
                  setPlan((prev) => ({
                    ...prev,
                    geologicalFeatures: prev.geologicalFeatures.map((g) =>
                      g.id === geology!.id ? { ...g, isSurveyed: !g.isSurveyed } : g
                    ),
                  }));
                }
              }}
              className={`p-1.5 rounded transition-colors ${
                (tunnel?.isSurveyed || geology?.isSurveyed)
                  ? 'text-emerald-400 hover:bg-emerald-950/60'
                  : 'text-amber-400 hover:bg-amber-950/60'
              }`}
            >
              {(tunnel?.isSurveyed || geology?.isSurveyed) ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Tunnel Specific Editor */}
        {tunnel && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Tunnel Name</label>
              <input
                type="text"
                value={tunnel.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlan((prev) => ({
                    ...prev,
                    tunnels: prev.tunnels.map((t) => (t.id === tunnel!.id ? { ...t, name: val } : t)),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Excavation Type</label>
              <select
                value={tunnel.type}
                onChange={(e) => {
                  const val = e.target.value as TunnelType;
                  setPlan((prev) => ({
                    ...prev,
                    tunnels: prev.tunnels.map((t) => (t.id === tunnel!.id ? { ...t, type: val } : t)),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded p-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="decline">Decline (Ramp 1:7)</option>
                <option value="drive">Development Drive</option>
                <option value="crosscut">Crosscut (Access)</option>
                <option value="haulage">Haulage Drive</option>
                <option value="raise">Raise (Up)</option>
                <option value="winze">Winze (Down)</option>
                <option value="shaft">Vertical Shaft</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Drive Width (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="12"
                  value={tunnel.width}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 4.5;
                    setPlan((prev) => ({
                      ...prev,
                      tunnels: prev.tunnels.map((t) => (t.id === tunnel!.id ? { ...t, width: val } : t)),
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Design Grade</label>
                <input
                  type="text"
                  placeholder="e.g. 1:7 (8.1°)"
                  value={tunnel.grade || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlan((prev) => ({
                      ...prev,
                      tunnels: prev.tunnels.map((t) => (t.id === tunnel!.id ? { ...t, grade: val } : t)),
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1.5 font-mono"
                />
              </div>
            </div>

            {/* Vertex Nodes Coordinates Table */}
            <div>
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Centerline Vertices ({tunnel.points.length})</span>
                <span className="text-[10px] text-slate-500 font-mono">Easting / Northing</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded border border-slate-800 p-1.5 bg-slate-950/60 font-mono text-[11px]">
                {tunnel.points.map((pt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300 px-1 py-0.5 hover:bg-slate-800/40 rounded">
                    <span className="text-slate-500">#{idx + 1}</span>
                    <span>{Math.round(pt.x)} E</span>
                    <span>{Math.round(pt.y)} N</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Geology Specific Editor */}
        {geology && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Feature Name</label>
              <input
                type="text"
                value={geology.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlan((prev) => ({
                    ...prev,
                    geologicalFeatures: prev.geologicalFeatures.map((g) =>
                      g.id === geology!.id ? { ...g, name: val } : g
                    ),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Hatching Pattern</label>
              <select
                value={geology.fillPattern}
                onChange={(e) => {
                  const val = e.target.value as HatchPattern;
                  setPlan((prev) => ({
                    ...prev,
                    geologicalFeatures: prev.geologicalFeatures.map((g) =>
                      g.id === geology!.id ? { ...g, fillPattern: val } : g
                    ),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded p-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="diagonal_red">Red Diagonal Hatch (Mined-out)</option>
                <option value="diagonal_dense">Dense Hatch (Planned Stope)</option>
                <option value="stipple_ore">Stipple Dot Rock (Ore Zone)</option>
                <option value="triangles_gravel">Triangular Backfill</option>
                <option value="crosshatch">Cross-Hatch Grid</option>
                <option value="solid_tint">Translucent Fill</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Fill Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={geology.opacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPlan((prev) => ({
                    ...prev,
                    geologicalFeatures: prev.geologicalFeatures.map((g) =>
                      g.id === geology!.id ? { ...g, opacity: val } : g
                    ),
                  }));
                }}
                className="w-full accent-cyan-400 bg-slate-800"
              />
            </div>
          </div>
        )}

        {/* Symbol Specific Editor */}
        {symbol && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Symbol Label</label>
              <input
                type="text"
                value={symbol.label || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlan((prev) => ({
                    ...prev,
                    symbols: prev.symbols.map((s) => (s.id === symbol!.id ? { ...s, label: val } : s)),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Description / Notes</label>
              <textarea
                rows={2}
                value={symbol.description || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlan((prev) => ({
                    ...prev,
                    symbols: prev.symbols.map((s) => (s.id === symbol!.id ? { ...s, description: val } : s)),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Easting</span>
                <span className="text-slate-200">{Math.round(symbol.position.x)} m E</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Northing</span>
                <span className="text-slate-200">{Math.round(symbol.position.y)} m N</span>
              </div>
            </div>
          </div>
        )}

        {/* Annotation Editor */}
        {annotation && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Annotation Text</label>
              <textarea
                rows={3}
                value={annotation.text}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlan((prev) => ({
                    ...prev,
                    annotations: prev.annotations.map((a) =>
                      a.id === annotation!.id ? { ...a, text: val } : a
                    ),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Font Size</label>
              <input
                type="number"
                min="8"
                max="24"
                value={annotation.fontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 12;
                  setPlan((prev) => ({
                    ...prev,
                    annotations: prev.annotations.map((a) =>
                      a.id === annotation!.id ? { ...a, fontSize: val } : a
                    ),
                  }));
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1.5 font-mono"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {tunnel && (
            <button
              onClick={handleDuplicate}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Duplicate Tunnel</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected Object</span>
          </button>
        </div>
      </div>
    </div>
  );
};
