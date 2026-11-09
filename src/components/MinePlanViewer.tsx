/**
 * Standalone, Referable, and Responsive 2D Underground Mine Plan Viewer & CAD Engine.
 * 
 * Designed to be dropped into ANY existing host application or dashboard.
 * Supports:
 * - Dynamic container resizing (ResizeObserver)
 * - Expand / Fullscreen takeover
 * - In-place floating CAD drawing toolbar & node editor
 * - In-place floating element inspector (no external sidebars needed)
 * - Fully customizable element positions, scales, and visibility (legend, cross section, title blocks, grid)
 * - Survey calibration certification toggle
 * - SVG, PNG, PDF, and JSON export
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MinePlan,
  ActiveTool,
  SnapSettings,
  Point2D,
  TunnelType,
  GeologyType,
  HatchPattern,
  UtilityType,
  SymbolType,
  MapLayoutConfig,
} from '../types/mine';
import { MineCanvas } from './MineCanvas';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ShieldCheck,
  AlertTriangle,
  MousePointer,
  TrendingDown,
  Layers as GeologyIcon,
  Wind,
  ShieldAlert,
  Type,
  Hand,
  Undo2,
  Redo2,
  Grid,
  Radio,
  Target,
  Magnet,
  Download,
  Sliders,
  X,
  FileCode,
  Image as ImageIcon,
  Printer,
  FileJson,
  RotateCcw,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DEMO_MINE_PLAN } from '../data/demoMinePlan';

export interface MinePlanViewerProps {
  plan: MinePlan;
  onPlanChange?: (updatedPlan: MinePlan) => void;
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  mode?: 'full' | 'interactive' | 'viewer' | 'minimal';
  showToolbar?: boolean;
  showInspector?: boolean;
  showExpandButton?: boolean;
  showLayoutCustomizer?: boolean;
  showExportButton?: boolean;
  showSurveyBadge?: boolean;
  layoutConfig?: MapLayoutConfig;
  onLayoutConfigChange?: (config: MapLayoutConfig) => void;
  customHeaderControls?: React.ReactNode;
  onSelectElement?: (element: { id: string; type: string } | null) => void;
}

export const MinePlanViewer: React.FC<MinePlanViewerProps> = ({
  plan: initialPlan,
  onPlanChange,
  className = 'w-full h-full min-h-[500px]',
  style,
  readOnly = false,
  mode = 'full',
  showToolbar = true,
  showInspector = true,
  showExpandButton = true,
  showLayoutCustomizer = true,
  showExportButton = true,
  showSurveyBadge = true,
  layoutConfig: externalLayoutConfig,
  onLayoutConfigChange,
  customHeaderControls,
  onSelectElement,
}) => {
  // Container & responsiveness
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Mine Plan State
  const [currentPlan, setCurrentPlan] = useState<MinePlan>(initialPlan || DEMO_MINE_PLAN);

  // Sync with prop changes if external plan changes
  useEffect(() => {
    if (initialPlan) {
      setCurrentPlan(initialPlan);
    }
  }, [initialPlan]);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<MinePlan[]>([initialPlan || DEMO_MINE_PLAN]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Active CAD tool
  const [activeTool, setActiveTool] = useState<ActiveTool>(readOnly ? 'pan' : 'select');
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  // Snapping configuration
  const [snapSettings, setSnapSettings] = useState<SnapSettings>({
    snapToGrid: true,
    gridSnapSize: 20,
    snapToStations: true,
    snapToEndpoints: true,
    orthoConstraint: false,
  });

  // Active tool drafting parameters
  const [tunnelConfig, setTunnelConfig] = useState<{ type: TunnelType; width: number }>({
    type: 'drive',
    width: 4.5,
  });
  const [geologyConfig, setGeologyConfig] = useState<{ type: GeologyType; pattern: HatchPattern }>({
    type: 'stope_mined',
    pattern: 'diagonal_red',
  });
  const [utilityConfig, setUtilityConfig] = useState<{ type: UtilityType }>({
    type: 'fresh_air',
  });
  const [symbolConfig, setSymbolConfig] = useState<{ type: SymbolType }>({
    type: 'refuge_chamber',
  });

  // Selection & In-place Floating Inspector
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    'tunnel' | 'geology' | 'utility' | 'symbol' | 'annotation' | null
  >(null);

  // Popover menus
  const [showLayoutPopover, setShowLayoutPopover] = useState(false);
  const [showExportPopover, setShowExportPopover] = useState(false);

  // Canvas viewport navigation (zoom & pan)
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [panOffset, setPanOffset] = useState<Point2D>({ x: 20, y: 10 });

  // Update plan with history
  const updatePlan = useCallback(
    (action: React.SetStateAction<MinePlan>) => {
      setCurrentPlan((prevPlan) => {
        const nextPlan = typeof action === 'function' ? action(prevPlan) : action;

        if (!isUndoRedoAction.current) {
          const nextHistory = history.slice(0, historyIndex + 1);
          setHistory([...nextHistory, nextPlan]);
          setHistoryIndex(nextHistory.length);
        }
        isUndoRedoAction.current = false;

        if (onPlanChange) {
          onPlanChange(nextPlan);
        }
        return nextPlan;
      });
    },
    [history, historyIndex, onPlanChange]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setCurrentPlan(history[targetIndex]);
      if (onPlanChange) onPlanChange(history[targetIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setCurrentPlan(history[targetIndex]);
      if (onPlanChange) onPlanChange(history[targetIndex]);
    }
  };

  // Monitor container size with ResizeObserver for responsive adaptation
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Selection change
  const handleSelect = (
    id: string | null,
    type: 'tunnel' | 'geology' | 'utility' | 'symbol' | 'annotation' | null
  ) => {
    setSelectedId(id);
    setSelectedType(type);
    if (onSelectElement) {
      onSelectElement(id && type ? { id, type } : null);
    }
  };

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z * 1.2, 4.0));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z / 1.2, 0.4));
  const handleZoomFit = () => {
    setZoomLevel(0.85);
    setPanOffset({ x: 20, y: 10 });
  };
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Export helpers
  const handleExportSvg = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlan.metadata.mineName.replace(/\s+/g, '_')}_${currentPlan.metadata.level}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowExportPopover(false);
  };

  const handleExportPng = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 2800;
    canvas.height = 1960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${currentPlan.metadata.mineName.replace(/\s+/g, '_')}_${currentPlan.metadata.level}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    img.src = url;
    setShowExportPopover(false);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentPlan, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${currentPlan.metadata.mineName.replace(/\s+/g, '_')}_Plan.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShowExportPopover(false);
  };

  // Selected item reference for floating inspector
  const selectedTunnel = selectedType === 'tunnel' ? currentPlan.tunnels.find((t) => t.id === selectedId) : null;
  const selectedGeology = selectedType === 'geology' ? currentPlan.geologicalFeatures.find((g) => g.id === selectedId) : null;
  const selectedSymbol = selectedType === 'symbol' ? currentPlan.symbols.find((s) => s.id === selectedId) : null;
  const selectedAnnotation = selectedType === 'annotation' ? currentPlan.annotations.find((a) => a.id === selectedId) : null;

  // Active layout config merging
  const layout = {
    titleBlockTopLeft: { x: 24, y: 28, scale: 1, visible: true, ...currentPlan.layout?.titleBlockTopLeft },
    titleBlockBottomRight: { x: 1040, y: 892, scale: 1, visible: true, ...currentPlan.layout?.titleBlockBottomRight },
    legend: { x: 24, y: 275, scale: 1, visible: true, ...currentPlan.layout?.legend },
    crossSection: { x: 340, y: 420, scale: 1, visible: true, ...currentPlan.layout?.crossSection },
    northArrow: { x: 1300, y: 80, scale: 1, visible: true, ...currentPlan.layout?.northArrow },
    scaleBar: { x: 320, y: 870, scale: 1, visible: true, ...currentPlan.layout?.scaleBar },
    showCoordinateGrid: currentPlan.layout?.showCoordinateGrid ?? true,
    ...externalLayoutConfig,
  };

  const updateLayoutElement = (elementKey: keyof MapLayoutConfig, updates: any) => {
    updatePlan((prev) => {
      const updatedLayout: MapLayoutConfig = {
        ...prev.layout,
        [elementKey]: {
          ...(prev.layout as any)?.[elementKey],
          ...updates,
        },
      };
      if (onLayoutConfigChange) onLayoutConfigChange(updatedLayout);
      return { ...prev, layout: updatedLayout };
    });
  };

  return (
    <div
      ref={containerRef}
      style={style}
      className={`relative flex flex-col bg-[#0a0d14] text-slate-100 select-none overflow-hidden transition-all duration-300 ${
        isExpanded ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : className
      }`}
    >
      {/* ======================================================== */}
      {/* FLOATING TOP STATUS & NAV BAR (RESPONSIVE HUD) */}
      {/* ======================================================== */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: Mine info badge */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-bold text-white tracking-tight">{currentPlan.metadata.mineName}</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-cyan-300 font-semibold">{currentPlan.metadata.level}</span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-slate-400 hidden sm:inline">{currentPlan.metadata.planType}</span>

          {showSurveyBadge && (
            <button
              onClick={() => {
                if (readOnly) return;
                updatePlan((prev) => ({
                  ...prev,
                  metadata: {
                    ...prev.metadata,
                    isSurveyCalibrated: !prev.metadata.isSurveyCalibrated,
                  },
                }));
              }}
              title="Click to toggle survey calibration certification"
              className={`ml-1 flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                currentPlan.metadata.isSurveyCalibrated
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}
            >
              {currentPlan.metadata.isSurveyCalibrated ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SURVEYED</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>DRAFT</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Controls & Zoom HUD */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {customHeaderControls}

          {/* Quick Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur border border-slate-800 p-1 rounded-lg text-xs shadow-lg">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom to 100%"
              className="px-1.5 py-0.5 font-mono text-[11px] text-slate-300 hover:bg-slate-800 rounded transition-colors"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomFit}
              title="Fit Map to Viewport"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Layout Customizer Button */}
          {showLayoutCustomizer && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowLayoutPopover(!showLayoutPopover);
                  setShowExportPopover(false);
                }}
                title="Customize Scales & Sheet Elements"
                className={`p-2 rounded-lg border backdrop-blur text-xs transition-colors shadow-lg ${
                  showLayoutPopover
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {/* Layout Customization Popover Card */}
              {showLayoutPopover && (
                <div className="absolute right-0 top-10 w-72 bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-2xl text-xs space-y-3 z-50">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sheet Layout & Scales</span>
                    </span>
                    <button
                      onClick={() => setShowLayoutPopover(false)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Legend Toggle & Scale */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Map Legend Box</span>
                      <button
                        onClick={() => updateLayoutElement('legend', { visible: !layout.legend.visible })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          layout.legend.visible ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {layout.legend.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    {layout.legend.visible && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Scale: {layout.legend.scale}x</span>
                        <input
                          type="range"
                          min="0.6"
                          max="1.4"
                          step="0.1"
                          value={layout.legend.scale}
                          onChange={(e) => updateLayoutElement('legend', { scale: parseFloat(e.target.value) })}
                          className="w-full accent-cyan-400 h-1 bg-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Typical Drive Profile Inset */}
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Drive Section A-A'</span>
                      <button
                        onClick={() => updateLayoutElement('crossSection', { visible: !layout.crossSection.visible })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          layout.crossSection.visible ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {layout.crossSection.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </div>
                    {layout.crossSection.visible && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Scale: {layout.crossSection.scale}x</span>
                        <input
                          type="range"
                          min="0.6"
                          max="1.4"
                          step="0.1"
                          value={layout.crossSection.scale}
                          onChange={(e) => updateLayoutElement('crossSection', { scale: parseFloat(e.target.value) })}
                          className="w-full accent-cyan-400 h-1 bg-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  {/* Coordinate Grid Ticks */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-300">
                    <span>Coordinate Grid</span>
                    <button
                      onClick={() => updateLayoutElement('showCoordinateGrid' as any, !layout.showCoordinateGrid)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        layout.showCoordinateGrid ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {layout.showCoordinateGrid ? 'ON (200m)' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Export Menu */}
          {showExportButton && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowExportPopover(!showExportPopover);
                  setShowLayoutPopover(false);
                }}
                title="Export Vector / Raster / PDF"
                className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg backdrop-blur shadow-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {showExportPopover && (
                <div className="absolute right-0 top-10 w-48 bg-slate-900 border border-slate-700/80 rounded-xl p-2 shadow-2xl text-xs space-y-1 z-50">
                  <button
                    onClick={handleExportSvg}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-left text-slate-200"
                  >
                    <FileCode className="w-3.5 h-3.5 text-purple-400" />
                    <span>Download SVG (Vector)</span>
                  </button>
                  <button
                    onClick={handleExportPng}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-left text-slate-200"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download PNG (2800px)</span>
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-left text-slate-200"
                  >
                    <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    <span>Download JSON Model</span>
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      setShowExportPopover(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-800 text-left text-slate-200"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Print / Save as PDF</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fullscreen / Expand Toggle */}
          {showExpandButton && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restore Viewport' : 'Expand to Fullscreen'}
              className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg backdrop-blur shadow-lg transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* FLOATING CAD DRAWING TOOLBAR (LEFT DOCKED OR COLLAPSIBLE) */}
      {/* ======================================================== */}
      {!readOnly && showToolbar && mode !== 'minimal' && (
        <div className="absolute top-16 left-3 z-30 flex flex-col pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 text-xs">
            {/* Header / Collapse toggle */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>{isToolbarCollapsed ? 'CAD' : 'CAD Tools'}</span>
              <button
                onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
              >
                {isToolbarCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center justify-between px-1 py-0.5">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-300"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSnapSettings((s) => ({ ...s, snapToGrid: !s.snapToGrid }))}
                title={`Grid Snap (${snapSettings.snapToGrid ? 'ON' : 'OFF'})`}
                className={`p-1.5 rounded transition-colors ${
                  snapSettings.snapToGrid ? 'bg-cyan-950 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tool Selection Buttons */}
            {!isToolbarCollapsed && (
              <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
                <button
                  onClick={() => setActiveTool('select')}
                  title="Select & Edit Nodes"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTool === 'select' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Select / Edit</span>
                </button>

                <button
                  onClick={() => setActiveTool('draw_tunnel')}
                  title="Draw Tunnel / Heading"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTool === 'draw_tunnel' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Draw Tunnel</span>
                </button>

                <button
                  onClick={() => setActiveTool('draw_geology')}
                  title="Draw Geology / Stopes"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTool === 'draw_geology' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <GeologyIcon className="w-3.5 h-3.5 text-rose-400" />
                  <span>Draw Geology</span>
                </button>

                <button
                  onClick={() => setActiveTool('draw_utility')}
                  title="Draw Ventilation & Services"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTool === 'draw_utility' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5 text-blue-400" />
                  <span>Vent & Power</span>
                </button>

                <button
                  onClick={() => setActiveTool('place_symbol')}
                  title="Place Mining Symbols"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTool === 'place_symbol' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Place Symbol</span>
                </button>

                <button
                  onClick={() => setActiveTool('add_annotation')}
                  title="Place Text Callouts"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTool === 'add_annotation' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Type className="w-3.5 h-3.5 text-purple-400" />
                  <span>Add Label</span>
                </button>

                <button
                  onClick={() => setActiveTool('pan')}
                  title="Pan Viewport"
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    activeTool === 'pan' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Hand className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FLOATING IN-PLACE ELEMENT PROPERTY INSPECTOR */}
      {/* ======================================================== */}
      {showInspector && selectedId && (selectedTunnel || selectedGeology || selectedSymbol || selectedAnnotation) && (
        <div className="absolute top-16 right-3 z-30 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3.5 shadow-2xl text-xs space-y-3 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">{selectedType}</span>
              <h4 className="font-semibold text-slate-100 truncate max-w-[180px]">
                {selectedTunnel?.name || selectedGeology?.name || selectedSymbol?.name || selectedAnnotation?.text}
              </h4>
            </div>
            <button
              onClick={() => handleSelect(null, null)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tunnel editor */}
          {selectedTunnel && (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Tunnel Name</label>
                <input
                  type="text"
                  value={selectedTunnel.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    updatePlan((prev) => ({
                      ...prev,
                      tunnels: prev.tunnels.map((t) => (t.id === selectedTunnel.id ? { ...t, name: val } : t)),
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedTunnel.width}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 4.5;
                      updatePlan((prev) => ({
                        ...prev,
                        tunnels: prev.tunnels.map((t) => (t.id === selectedTunnel.id ? { ...t, width: val } : t)),
                      }));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Grade</label>
                  <input
                    type="text"
                    value={selectedTunnel.grade || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updatePlan((prev) => ({
                        ...prev,
                        tunnels: prev.tunnels.map((t) => (t.id === selectedTunnel.id ? { ...t, grade: val } : t)),
                      }));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Geology editor */}
          {selectedGeology && (
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Feature Name</label>
                <input
                  type="text"
                  value={selectedGeology.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    updatePlan((prev) => ({
                      ...prev,
                      geologicalFeatures: prev.geologicalFeatures.map((g) => (g.id === selectedGeology.id ? { ...g, name: val } : g)),
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Hatch Pattern</label>
                <select
                  value={selectedGeology.fillPattern}
                  onChange={(e) => {
                    const val = e.target.value as HatchPattern;
                    updatePlan((prev) => ({
                      ...prev,
                      geologicalFeatures: prev.geologicalFeatures.map((g) => (g.id === selectedGeology.id ? { ...g, fillPattern: val } : g)),
                    }));
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                >
                  <option value="diagonal_red">Red Diagonal (Mined)</option>
                  <option value="diagonal_dense">Dense Hatch (Planned)</option>
                  <option value="stipple_ore">Stipple Dot (Ore Zone)</option>
                  <option value="triangles_gravel">Triangular Backfill</option>
                  <option value="crosshatch">Cross-Hatch Grid</option>
                </select>
              </div>
            </div>
          )}

          {/* Actions: Delete & Certify */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                if (selectedTunnel) {
                  updatePlan((prev) => ({
                    ...prev,
                    tunnels: prev.tunnels.map((t) => (t.id === selectedTunnel.id ? { ...t, isSurveyed: !t.isSurveyed } : t)),
                  }));
                } else if (selectedGeology) {
                  updatePlan((prev) => ({
                    ...prev,
                    geologicalFeatures: prev.geologicalFeatures.map((g) => (g.id === selectedGeology.id ? { ...g, isSurveyed: !g.isSurveyed } : g)),
                  }));
                }
              }}
              className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300"
            >
              Toggle Surveyed
            </button>

            <button
              onClick={() => {
                if (selectedTunnel) {
                  updatePlan((prev) => ({ ...prev, tunnels: prev.tunnels.filter((t) => t.id !== selectedTunnel.id) }));
                } else if (selectedGeology) {
                  updatePlan((prev) => ({ ...prev, geologicalFeatures: prev.geologicalFeatures.filter((g) => g.id !== selectedGeology.id) }));
                }
                handleSelect(null, null);
              }}
              title="Delete Element"
              className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN MINE CANVAS (RENDERER STAGE) */}
      {/* ======================================================== */}
      <div className="flex-1 h-full w-full relative overflow-hidden">
        <MineCanvas
          plan={currentPlan}
          setPlan={updatePlan}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          snapSettings={snapSettings}
          selectedId={selectedId}
          selectedType={selectedType}
          onSelect={handleSelect}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
          tunnelConfig={tunnelConfig}
          geologyConfig={geologyConfig}
          utilityConfig={utilityConfig}
          symbolConfig={symbolConfig}
        />
      </div>
    </div>
  );
};
