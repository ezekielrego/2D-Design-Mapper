import React from 'react';
import { Eye, EyeOff, Lock, Unlock, X } from 'lucide-react';
import { MapLayers } from '../types/mine';

interface LayerPanelProps {
  layers: MapLayers;
  setLayers: React.Dispatch<React.SetStateAction<MapLayers>>;
  onClose: () => void;
  counts: {
    tunnels: number;
    geology: number;
    utilities: number;
    symbols: number;
    annotations: number;
    stations: number;
  };
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  setLayers,
  onClose,
  counts,
}) => {
  const layerItems: Array<{
    key: keyof MapLayers;
    title: string;
    description: string;
    count?: number;
    color: string;
  }> = [
    {
      key: 'excavations',
      title: 'Excavations & Tunnels',
      description: 'Declines, drives, crosscuts, shafts & raises',
      count: counts.tunnels,
      color: '#10b981',
    },
    {
      key: 'geology',
      title: 'Geology & Stopes',
      description: 'Mined-out stopes, planned blocks, ore body zone',
      count: counts.geology,
      color: '#ef4444',
    },
    {
      key: 'ventilationUtilities',
      title: 'Ventilation & Services',
      description: 'Fresh & return air, 11kV electrical, water & air pipes',
      count: counts.utilities,
      color: '#06b6d4',
    },
    {
      key: 'symbols',
      title: 'Mining Symbols & Equipment',
      description: 'Refuge chamber, pump station, sump, hazards, ore passes',
      count: counts.symbols,
      color: '#f59e0b',
    },
    {
      key: 'annotations',
      title: 'Annotations & Callouts',
      description: 'Technical labels, leader lines & dimensions',
      count: counts.annotations,
      color: '#a855f7',
    },
    {
      key: 'surveyGrid',
      title: 'Survey Grid & Border',
      description: 'Eastings, Northings, scale bar, legend, title block',
      count: counts.stations,
      color: '#64748b',
    },
    {
      key: 'crossSection',
      title: 'Typical Drive Profile A-A\'',
      description: '4.5m x 4.5m development drive cross-section inset',
      color: '#3b82f6',
    },
  ];

  const toggleVisibility = (key: keyof MapLayers) => {
    setLayers((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        visible: !prev[key].visible,
      },
    }));
  };

  const toggleLock = (key: keyof MapLayers) => {
    setLayers((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        locked: !prev[key].locked,
      },
    }));
  };

  const updateOpacity = (key: keyof MapLayers, opacity: number) => {
    setLayers((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        opacity,
      },
    }));
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none z-20 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/40">
        <div>
          <h2 className="font-semibold text-slate-100 text-sm">Layer Management</h2>
          <p className="text-[11px] text-slate-400">Independent visibility and lock control</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Layer List */}
      <div className="p-3 space-y-2 overflow-y-auto flex-1">
        {layerItems.map((layer) => {
          const state = layers[layer.key];
          return (
            <div
              key={layer.key}
              className={`p-2.5 rounded-lg border transition-all ${
                state.visible
                  ? 'bg-slate-950/40 border-slate-800'
                  : 'bg-slate-950/20 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="font-medium text-slate-200 truncate">{layer.title}</span>
                  {layer.count !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                      {layer.count}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleLock(layer.key)}
                    title={state.locked ? 'Unlock Layer' : 'Lock Layer'}
                    className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                      state.locked ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {state.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => toggleVisibility(layer.key)}
                    title={state.visible ? 'Hide Layer' : 'Show Layer'}
                    className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                      state.visible ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  >
                    {state.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mb-2 truncate">
                {layer.description}
              </div>

              {/* Opacity Slider */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>Opacity</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={state.opacity}
                  onChange={(e) => updateOpacity(layer.key, parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                />
                <span className="font-mono text-slate-400 w-8 text-right">
                  {Math.round(state.opacity * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
