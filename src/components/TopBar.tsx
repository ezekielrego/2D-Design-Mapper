import React from 'react';
import {
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layers,
  Compass,
  FileSpreadsheet,
  SplitSquareVertical,
  Laptop,
} from 'lucide-react';
import { PlanMetadata } from '../types/mine';

interface TopBarProps {
  metadata: PlanMetadata;
  activeView: 'map' | 'host_embed' | 'survey' | 'cross_section';
  setActiveView: (view: 'map' | 'host_embed' | 'survey' | 'cross_section') => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onResetZoom: () => void;
  onOpenExport: () => void;
  onToggleLayerPanel: () => void;
  isLayerPanelOpen: boolean;
  onResetToDemo: () => void;
  onNewPlan: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  metadata,
  activeView,
  setActiveView,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onResetZoom,
  onOpenExport,
  onToggleLayerPanel,
  isLayerPanelOpen,
  onResetToDemo,
  onNewPlan,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0 z-30 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-4 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('map');
          }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 bg-cyan-400 rotate-45 inline-block" />
          <span>{metadata.mineName}</span>
          <span className="text-xs font-medium text-slate-400 font-mono">CAD 2.0</span>
        </a>

        {/* Level & Survey Calibration Status Tag */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-700 text-xs text-slate-400">
          <span className="font-mono text-slate-300 font-semibold">{metadata.level}</span>
          <span>·</span>
          <span>{metadata.planType}</span>
          <span>·</span>
          <span className="font-mono">{metadata.scaleText}</span>
          <span>·</span>
          {metadata.isSurveyCalibrated ? (
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              SURVEY CALIBRATED
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 font-mono text-[11px] bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              ILLUSTRATIVE DRAFT
            </span>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation Links (Single-line, tab switches) */}
      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveView('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'map'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Mine Plan View</span>
        </button>

        <button
          onClick={() => setActiveView('host_embed')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'host_embed'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Preview Standalone MinePlanViewer embedded in a host app with zero sidebars"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Host App Embed Widget</span>
        </button>

        <button
          onClick={() => setActiveView('survey')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'survey'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Survey Ledger</span>
        </button>

        <button
          onClick={() => setActiveView('cross_section')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeView === 'cross_section'
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span>Typical Drive Profile A-A'</span>
        </button>
      </nav>

      {/* Zone 3: Zoom HUD, Layers, and Primary Export Action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Zoom Controls */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-slate-300">
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            title="Reset Zoom to 100%"
            className="px-2 py-0.5 text-[11px] font-mono hover:bg-slate-800 rounded transition-colors text-slate-300"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomFit}
            title="Zoom to Fit Plan"
            className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors ml-0.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layer Panel Toggle */}
        <button
          onClick={onToggleLayerPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            isLayerPanelOpen
              ? 'bg-slate-800 text-cyan-300 border-cyan-800/60'
              : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        {/* Demo reset / New map menu */}
        <button
          onClick={onResetToDemo}
          title="Reload reference demo map"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-900/40"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Plan</span>
        </button>
      </div>
    </header>
  );
};
