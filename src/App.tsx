/**
 * Underground Mine Mapping CAD Application
 * Complete 2D mine plan drafting, surveying calibration, and digital twin layout.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from './types/mine';
import { DEMO_MINE_PLAN } from './data/demoMinePlan';
import {
  TopBar,
  Toolbar,
  MineCanvas,
  LayerPanel,
  SurveyPanel,
  CrossSectionCallout,
  PropertyInspector,
  ExportModal,
  HostEmbedDemo,
} from './components';

// Augment window object for external AI agent integration
declare global {
  interface Window {
    loadMinePlan?: (plan: MinePlan | string) => void;
    getCurrentMinePlan?: () => MinePlan;
    resetToDemoPlan?: () => void;
    exportMinePlanSVG?: () => string;
  }
}

export default function App() {
  // Main mine plan state
  const [plan, setPlan] = useState<MinePlan>(DEMO_MINE_PLAN);

  // Undo / Redo history
  const [history, setHistory] = useState<MinePlan[]>([DEMO_MINE_PLAN]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Active top-level view: 'map' | 'host_embed' | 'survey' | 'cross_section'
  const [activeView, setActiveView] = useState<'map' | 'host_embed' | 'survey' | 'cross_section'>('map');

  // Active CAD tool
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');

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

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    'tunnel' | 'geology' | 'utility' | 'symbol' | 'annotation' | null
  >(null);

  // Panels visibility
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Canvas viewport navigation (zoom & pan)
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [panOffset, setPanOffset] = useState<Point2D>({ x: 20, y: 10 });

  // Expose global API on window so other AI agents can communicate with the app
  useEffect(() => {
    window.loadMinePlan = (newPlan: MinePlan | string) => {
      try {
        const parsed = typeof newPlan === 'string' ? JSON.parse(newPlan) : newPlan;
        setPlan(parsed);
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), parsed]);
        setHistoryIndex((prev) => prev + 1);
        console.log('✅ AI Agent loaded new Mine Plan:', parsed.metadata?.mineName);
      } catch (err) {
        console.error('❌ Failed to load mine plan:', err);
      }
    };

    window.getCurrentMinePlan = () => plan;
    window.resetToDemoPlan = () => {
      setPlan(DEMO_MINE_PLAN);
      setHistory([DEMO_MINE_PLAN]);
      setHistoryIndex(0);
    };
    window.exportMinePlanSVG = () => {
      const svg = document.querySelector('svg');
      return svg ? new XMLSerializer().serializeToString(svg) : '';
    };

    return () => {
      delete window.loadMinePlan;
      delete window.getCurrentMinePlan;
      delete window.resetToDemoPlan;
      delete window.exportMinePlanSVG;
    };
  }, [plan, historyIndex]);

  // Record history on plan modification (debounced slightly to avoid cluttering history on every slider tick)
  const updatePlanWithHistory = useCallback(
    (newPlanAction: React.SetStateAction<MinePlan>) => {
      setPlan((prevPlan) => {
        const nextPlan = typeof newPlanAction === 'function' ? newPlanAction(prevPlan) : newPlanAction;

        if (!isUndoRedoAction.current) {
          const nextHistory = history.slice(0, historyIndex + 1);
          setHistory([...nextHistory, nextPlan]);
          setHistoryIndex(nextHistory.length);
        }
        isUndoRedoAction.current = false;
        return nextPlan;
      });
    },
    [history, historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setPlan(history[targetIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setPlan(history[targetIndex]);
    }
  };

  // Selection handler
  const handleSelect = (
    id: string | null,
    type: 'tunnel' | 'geology' | 'utility' | 'symbol' | 'annotation' | null
  ) => {
    setSelectedId(id);
    setSelectedType(type);
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

  // Reset to demonstration map
  const handleResetToDemo = () => {
    setPlan(DEMO_MINE_PLAN);
    setHistory([DEMO_MINE_PLAN]);
    setHistoryIndex(0);
    setSelectedId(null);
    setSelectedType(null);
  };

  // Create a brand new blank plan
  const handleNewPlan = () => {
    const blankPlan: MinePlan = {
      ...DEMO_MINE_PLAN,
      metadata: {
        ...DEMO_MINE_PLAN.metadata,
        title: 'New Underground Development Plan',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        revision: '0',
      },
      tunnels: [],
      geologicalFeatures: [],
      ventilationUtilities: [],
      symbols: [],
      annotations: [],
    };
    setPlan(blankPlan);
    setHistory([blankPlan]);
    setHistoryIndex(0);
    setSelectedId(null);
    setSelectedType(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* Top Application Bar (conforming to Top Bar Contract) */}
      <div className="no-print">
        <TopBar
          metadata={plan.metadata}
          activeView={activeView}
          setActiveView={setActiveView}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
          onResetZoom={handleResetZoom}
          onOpenExport={() => setIsExportModalOpen(true)}
          onToggleLayerPanel={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
          isLayerPanelOpen={isLayerPanelOpen}
          onResetToDemo={handleResetToDemo}
          onNewPlan={handleNewPlan}
        />
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeView === 'map' && (
          <>
            {/* Left CAD Toolbar */}
            <div className="no-print">
              <Toolbar
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                onUndo={handleUndo}
                onRedo={handleRedo}
                snapSettings={snapSettings}
                setSnapSettings={setSnapSettings}
                tunnelConfig={tunnelConfig}
                setTunnelConfig={setTunnelConfig}
                geologyConfig={geologyConfig}
                setGeologyConfig={setGeologyConfig}
                utilityConfig={utilityConfig}
                setUtilityConfig={setUtilityConfig}
                symbolConfig={symbolConfig}
                setSymbolConfig={setSymbolConfig}
              />
            </div>

            {/* Central Interactive Drawing Canvas */}
            <main className="flex-1 h-full w-full relative overflow-hidden print-sheet">
              <MineCanvas
                plan={plan}
                setPlan={updatePlanWithHistory}
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
            </main>

            {/* Contextual Property Inspector (when an element is selected) */}
            {selectedId && selectedType && (
              <div className="no-print">
                <PropertyInspector
                  selectedId={selectedId}
                  selectedType={selectedType}
                  plan={plan}
                  setPlan={updatePlanWithHistory}
                  onClose={() => handleSelect(null, null)}
                />
              </div>
            )}

            {/* Layer Management Sidebar */}
            {isLayerPanelOpen && (
              <div className="no-print">
                <LayerPanel
                  layers={plan.layers}
                  setLayers={(layersAction) => {
                    setPlan((prev) => ({
                      ...prev,
                      layers: typeof layersAction === 'function' ? layersAction(prev.layers) : layersAction,
                    }));
                  }}
                  onClose={() => setIsLayerPanelOpen(false)}
                  counts={{
                    tunnels: plan.tunnels.length,
                    geology: plan.geologicalFeatures.length,
                    utilities: plan.ventilationUtilities.length,
                    symbols: plan.symbols.length,
                    annotations: plan.annotations.length,
                    stations: plan.surveyStations.length,
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Host App Embed Widget Preview & Sandbox */}
        {activeView === 'host_embed' && (
          <HostEmbedDemo
            plan={plan}
            onPlanChange={updatePlanWithHistory}
          />
        )}

        {/* Survey Ledger & Calibration View */}
        {activeView === 'survey' && (
          <SurveyPanel
            plan={plan}
            setPlan={updatePlanWithHistory}
            onClose={() => setActiveView('map')}
          />
        )}

        {/* Typical Drive Profile Cross-Section View */}
        {activeView === 'cross_section' && (
          <CrossSectionCallout onClose={() => setActiveView('map')} />
        )}
      </div>

      {/* Export / AI Agent JSON interchange modal */}
      {isExportModalOpen && (
        <ExportModal
          plan={plan}
          setPlan={updatePlanWithHistory}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
