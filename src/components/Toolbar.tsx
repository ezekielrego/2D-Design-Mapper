import React from 'react';
import {
  MousePointer,
  Hand,
  TrendingDown,
  Layers as GeologyIcon,
  Wind,
  ShieldAlert,
  Type,
  Undo2,
  Redo2,
  Magnet,
  Grid,
  Radio,
  Target,
  Ruler,
} from 'lucide-react';
import {
  ActiveTool,
  SnapSettings,
  TunnelType,
  GeologyType,
  HatchPattern,
  UtilityType,
  SymbolType,
} from '../types/mine';

interface ToolbarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  snapSettings: SnapSettings;
  setSnapSettings: React.Dispatch<React.SetStateAction<SnapSettings>>;
  // Active drafting configuration
  tunnelConfig: {
    type: TunnelType;
    width: number;
  };
  setTunnelConfig: React.Dispatch<React.SetStateAction<{ type: TunnelType; width: number }>>;
  geologyConfig: {
    type: GeologyType;
    pattern: HatchPattern;
  };
  setGeologyConfig: React.Dispatch<React.SetStateAction<{ type: GeologyType; pattern: HatchPattern }>>;
  utilityConfig: {
    type: UtilityType;
  };
  setUtilityConfig: React.Dispatch<React.SetStateAction<{ type: UtilityType }>>;
  symbolConfig: {
    type: SymbolType;
  };
  setSymbolConfig: React.Dispatch<React.SetStateAction<{ type: SymbolType }>>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  snapSettings,
  setSnapSettings,
  tunnelConfig,
  setTunnelConfig,
  geologyConfig,
  setGeologyConfig,
  utilityConfig,
  setUtilityConfig,
  symbolConfig,
  setSymbolConfig,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none z-20 text-xs overflow-y-auto">
      {/* Undo / Redo & Snap Bar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-1 bg-slate-950/40">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Snap quick toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setSnapSettings((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))
            }
            title={`Snap to Grid (${snapSettings.snapToGrid ? 'ON' : 'OFF'})`}
            className={`p-1.5 rounded transition-colors ${
              snapSettings.snapToGrid
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              setSnapSettings((prev) => ({ ...prev, snapToStations: !prev.snapToStations }))
            }
            title={`Snap to Survey Stations (${snapSettings.snapToStations ? 'ON' : 'OFF'})`}
            className={`p-1.5 rounded transition-colors ${
              snapSettings.snapToStations
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              setSnapSettings((prev) => ({ ...prev, snapToEndpoints: !prev.snapToEndpoints }))
            }
            title={`Snap to Vertices (${snapSettings.snapToEndpoints ? 'ON' : 'OFF'})`}
            className={`p-1.5 rounded transition-colors ${
              snapSettings.snapToEndpoints
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              setSnapSettings((prev) => ({ ...prev, orthoConstraint: !prev.orthoConstraint }))
            }
            title={`Ortho 45° Lock (${snapSettings.orthoConstraint ? 'ON' : 'OFF'})`}
            className={`p-1.5 rounded transition-colors ${
              snapSettings.orthoConstraint
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary CAD Tool Selection */}
      <div className="p-3 space-y-1.5 border-b border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          CAD Tools
        </div>

        <button
          onClick={() => setActiveTool('select')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
            activeTool === 'select'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <MousePointer className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Select & Edit Nodes</span>
        </button>

        <button
          onClick={() => setActiveTool('draw_tunnel')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
            activeTool === 'draw_tunnel'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Draw Tunnel / Drive</span>
        </button>

        <button
          onClick={() => setActiveTool('draw_geology')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
            activeTool === 'draw_geology'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <GeologyIcon className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Draw Geology / Stope</span>
        </button>

        <button
          onClick={() => setActiveTool('draw_utility')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
            activeTool === 'draw_utility'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <Wind className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Ventilation & Services</span>
        </button>

        <button
          onClick={() => setActiveTool('place_symbol')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
            activeTool === 'place_symbol'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Place Symbols</span>
        </button>

        <button
          onClick={() => setActiveTool('add_annotation')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
            activeTool === 'add_annotation'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <Type className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Label & Callouts</span>
        </button>

        <button
          onClick={() => setActiveTool('pan')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors text-left ${
            activeTool === 'pan'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <Hand className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Pan Viewport</span>
        </button>
      </div>

      {/* Sub-tool Options Context Section */}
      <div className="p-3 space-y-3 flex-1 bg-slate-950/20">
        {activeTool === 'draw_tunnel' && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tunnel Parameters
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Tunnel Excavation Type</label>
              <select
                value={tunnelConfig.type}
                onChange={(e) =>
                  setTunnelConfig((prev) => ({ ...prev, type: e.target.value as TunnelType }))
                }
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

            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span>Drive Width</span>
                <span className="font-mono text-cyan-400 font-semibold">{tunnelConfig.width} m</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[3.5, 4.0, 4.5, 5.0].map((w) => (
                  <button
                    key={w}
                    onClick={() => setTunnelConfig((prev) => ({ ...prev, width: w }))}
                    className={`py-1 text-center font-mono rounded border transition-colors ${
                      tunnelConfig.width === w
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {w}m
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Drafting Instructions:</div>
              <div>• Click on canvas to add vertices</div>
              <div>• Hold Shift for 45° angle lock</div>
              <div>• Double-click to complete tunnel</div>
            </div>
          </div>
        )}

        {activeTool === 'draw_geology' && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Geological Feature
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Feature Class</label>
              <select
                value={geologyConfig.type}
                onChange={(e) => {
                  const t = e.target.value as GeologyType;
                  let p: HatchPattern = 'none';
                  if (t === 'stope_mined') p = 'diagonal_red';
                  else if (t === 'stope_planned') p = 'diagonal_dense';
                  else if (t === 'ore_body') p = 'stipple_ore';
                  else if (t === 'backfill') p = 'triangles_gravel';
                  setGeologyConfig({ type: t, pattern: p });
                }}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded p-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="stope_mined">Stope S2 (Mined-out)</option>
                <option value="stope_planned">Planned Stope (S3–S5)</option>
                <option value="ore_body">Ore Body / Zone</option>
                <option value="fault">Geological Fault / Shear</option>
                <option value="backfill">Waste / CRF Backfill</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Hatching Pattern</label>
              <select
                value={geologyConfig.pattern}
                onChange={(e) =>
                  setGeologyConfig((prev) => ({
                    ...prev,
                    pattern: e.target.value as HatchPattern,
                  }))
                }
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded p-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="diagonal_red">Red Diagonal Hatch (Mined)</option>
                <option value="diagonal_dense">Dense Hatch (Planned Stope)</option>
                <option value="stipple_ore">Stipple Dot Rock (Ore Zone)</option>
                <option value="triangles_gravel">Triangular Backfill</option>
                <option value="crosshatch">Cross-Hatch Grid</option>
                <option value="solid_tint">Translucent Fill</option>
              </select>
            </div>

            <div className="p-2.5 rounded bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Polygon Drafting:</div>
              <div>• Click consecutive boundary points</div>
              <div>• Click first vertex or double-click to close polygon</div>
            </div>
          </div>
        )}

        {activeTool === 'draw_utility' && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ventilation & Services
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Service Type</label>
              <select
                value={utilityConfig.type}
                onChange={(e) =>
                  setUtilityConfig({ type: e.target.value as UtilityType })
                }
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded p-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="fresh_air">Ventilation (Fresh Air) - Solid Cyan</option>
                <option value="return_air">Ventilation (Return Air) - Dashed Red</option>
                <option value="electrical_cable">Electrical Cable Route (11kV) - Solid Yellow</option>
                <option value="water_pipe">Water Pipeline - Dashed Blue</option>
                <option value="compressed_air">Compressed Air Line - Dashed Green</option>
              </select>
            </div>
          </div>
        )}

        {activeTool === 'place_symbol' && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Symbols & Equipment
            </div>

            <div className="space-y-1">
              {[
                { type: 'refuge_chamber', label: 'Refuge Chamber (Safety)' },
                { type: 'pump_station', label: 'Pump Station' },
                { type: 'sump', label: 'Sump (Water Basin)' },
                { type: 'ore_pass', label: 'Ore Pass (Ø 2.0 m)' },
                { type: 'hazard', label: 'Hazard / Warning Triangle' },
                { type: 'poi_circle', label: 'POI Circle / Gas Sensor' },
                { type: 'survey_peg', label: 'Survey Benchmark Peg' },
              ].map((sym) => (
                <button
                  key={sym.type}
                  onClick={() => setSymbolConfig({ type: sym.type as SymbolType })}
                  className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                    symbolConfig.type === sym.type
                      ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-semibold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {sym.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 p-2 rounded bg-slate-800/40">
              Click anywhere on the map to place this symbol.
            </div>
          </div>
        )}

        {activeTool === 'select' && (
          <div className="space-y-2 text-slate-400 text-[11px]">
            <div className="font-semibold text-slate-300">Selection Mode</div>
            <div>• Click any tunnel, stope, symbol, or text to select it</div>
            <div>• Drag vertices to adjust tunnel curves or geology boundaries</div>
            <div>• Press <kbd className="px-1 bg-slate-800 rounded font-mono">Delete</kbd> or <kbd className="px-1 bg-slate-800 rounded font-mono">Backspace</kbd> to delete selected object</div>
          </div>
        )}

        {activeTool === 'add_annotation' && (
          <div className="space-y-2 text-slate-400 text-[11px]">
            <div className="font-semibold text-slate-300">Annotation Tool</div>
            <div>• Click on the map to place a text callout</div>
            <div>• Click an object and drag to add a leader line pointer</div>
          </div>
        )}
      </div>

      {/* Snap Settings Footer Details */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span>Grid Interval</span>
          <span className="font-mono text-slate-200">200 m</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Snap Radius</span>
          <span className="font-mono text-slate-200">15 m</span>
        </div>
      </div>
    </aside>
  );
};
