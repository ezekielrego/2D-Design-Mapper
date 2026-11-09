import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  MinePlan,
  ActiveTool,
  SnapSettings,
  Point2D,
  Tunnel,
  GeologicalFeature,
  VentilationUtility,
  MapSymbol,
  MapAnnotation,
  TunnelType,
  GeologyType,
  HatchPattern,
  UtilityType,
  SymbolType,
} from '../types/mine';
import {
  mineToSvg,
  svgToMine,
  generateTunnelRibbon,
  pointsToSvgPath,
  snapPoint,
  calculateDistance,
  formatDistance,
  calculateBearing,
  formatBearing,
} from '../utils/geometry';

interface MineCanvasProps {
  plan: MinePlan;
  setPlan: React.Dispatch<React.SetStateAction<MinePlan>>;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  snapSettings: SnapSettings;
  selectedId: string | null;
  selectedType: 'tunnel' | 'geology' | 'utility' | 'symbol' | 'annotation' | null;
  onSelect: (
    id: string | null,
    type: 'tunnel' | 'geology' | 'utility' | 'symbol' | 'annotation' | null
  ) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  panOffset: Point2D;
  setPanOffset: React.Dispatch<React.SetStateAction<Point2D>>;
  // Drafting settings
  tunnelConfig: { type: TunnelType; width: number };
  geologyConfig: { type: GeologyType; pattern: HatchPattern };
  utilityConfig: { type: UtilityType };
  symbolConfig: { type: SymbolType };
}

export const MineCanvas: React.FC<MineCanvasProps> = ({
  plan,
  setPlan,
  activeTool,
  setActiveTool,
  snapSettings,
  selectedId,
  selectedType,
  onSelect,
  zoomLevel,
  setZoomLevel,
  panOffset,
  setPanOffset,
  tunnelConfig,
  geologyConfig,
  utilityConfig,
  symbolConfig,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Canvas drawing dimensions (in SVG virtual units)
  const svgWidth = 1400;
  const svgHeight = 980;

  // Panning interaction state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });

  // Drafting in-progress points (in mine coordinates)
  const [draftingPoints, setDraftingPoints] = useState<Point2D[]>([]);
  const [currentCursorMine, setCurrentCursorMine] = useState<Point2D | null>(null);
  const [snapFeedback, setSnapFeedback] = useState<{ point: Point2D; label?: string } | null>(null);

  // Node editing state (dragging a vertex of selected item)
  const [draggedVertexIndex, setDraggedVertexIndex] = useState<number | null>(null);

  // Dynamic layout configuration (defaults with user/agent customizations)
  const layout = {
    titleBlockTopLeft: { x: 24, y: 28, scale: 1, visible: true, ...plan.layout?.titleBlockTopLeft },
    titleBlockBottomRight: { x: svgWidth - 360, y: svgHeight - 88, scale: 1, visible: true, ...plan.layout?.titleBlockBottomRight },
    legend: { x: 24, y: 275, scale: 1, visible: true, ...plan.layout?.legend },
    crossSection: { x: 340, y: 420, scale: 1, visible: true, ...plan.layout?.crossSection },
    northArrow: { x: svgWidth - 100, y: 80, scale: 1, visible: true, ...plan.layout?.northArrow },
    scaleBar: { x: 320, y: svgHeight - 110, scale: 1, visible: true, ...plan.layout?.scaleBar },
    showCoordinateGrid: plan.layout?.showCoordinateGrid ?? true,
  };

  // Sheet layout element interactive dragging state
  const [draggingLayoutKey, setDraggingLayoutKey] = useState<string | null>(null);
  const [layoutDragStart, setLayoutDragStart] = useState<{
    startSvgX: number;
    startSvgY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [hoveredLayoutKey, setHoveredLayoutKey] = useState<string | null>(null);

  const handleLayoutMouseDown = (e: React.MouseEvent, key: string) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX - panOffset.x) / zoomLevel;
    const svgY = (clientY - panOffset.y) / zoomLevel;
    const elem = (layout as any)[key];
    if (!elem) return;
    setDraggingLayoutKey(key);
    setLayoutDragStart({
      startSvgX: svgX,
      startSvgY: svgY,
      origX: elem.x,
      origY: elem.y,
    });
  };

  // Convert mouse event to Mine Coordinates (taking into account container bounds, pan, zoom, and coordinate transform)
  const getMineCoordinatesFromEvent = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): Point2D => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Transform from screen coords into viewBox SVG coordinates
      const svgX = (clientX - panOffset.x) / zoomLevel;
      const svgY = (clientY - panOffset.y) / zoomLevel;

      return svgToMine(
        { x: svgX, y: svgY },
        plan.gridOrigin,
        plan.gridWidth,
        plan.gridHeight,
        svgWidth,
        svgHeight
      );
    },
    [panOffset, zoomLevel, plan.gridOrigin, plan.gridWidth, plan.gridHeight, svgWidth, svgHeight]
  );

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoomLevel * zoomFactor, 0.4), 4.0);

    // Zoom towards mouse position
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPanOffset((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoomLevel),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoomLevel),
      }));
    }

    setZoomLevel(newZoom);
  };

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Middle click or space-bar or Pan tool triggers panning
    if (e.button === 1 || activeTool === 'pan' || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.button !== 0) return; // Only primary left click

    const rawMinePt = getMineCoordinatesFromEvent(e);
    const snapResult = snapPoint(rawMinePt, snapSettings, {
      stations: plan.surveyStations,
      tunnels: plan.tunnels,
      anchorPoint: draftingPoints.length > 0 ? draftingPoints[draftingPoints.length - 1] : null,
      origin: plan.gridOrigin,
    });
    const minePt = snapResult.point;

    // Handle drafting tool clicks
    if (activeTool === 'draw_tunnel' || activeTool === 'draw_geology' || activeTool === 'draw_utility') {
      setDraftingPoints((prev) => [...prev, minePt]);
      return;
    }

    // Handle placing symbols
    if (activeTool === 'place_symbol') {
      const newSymbol: MapSymbol = {
        id: `sym-${Date.now()}`,
        name: symbolConfig.type.replace('_', ' ').toUpperCase(),
        type: symbolConfig.type,
        position: minePt,
        rotation: 0,
        scale: 1.2,
        label: symbolConfig.type.replace('_', ' '),
        isSurveyed: plan.metadata.isSurveyCalibrated,
      };
      setPlan((prev) => ({ ...prev, symbols: [...prev.symbols, newSymbol] }));
      onSelect(newSymbol.id, 'symbol');
      setActiveTool('select');
      return;
    }

    // Handle adding annotations
    if (activeTool === 'add_annotation') {
      const newAnnotation: MapAnnotation = {
        id: `ann-${Date.now()}`,
        text: 'New Note',
        position: minePt,
        style: 'callout',
        fontSize: 12,
        isSurveyed: plan.metadata.isSurveyCalibrated,
      };
      setPlan((prev) => ({ ...prev, annotations: [...prev.annotations, newAnnotation] }));
      onSelect(newAnnotation.id, 'annotation');
      setActiveTool('select');
      return;
    }
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const rawMinePt = getMineCoordinatesFromEvent(e);
    const snapResult = snapPoint(rawMinePt, snapSettings, {
      stations: plan.surveyStations,
      tunnels: plan.tunnels,
      anchorPoint: draftingPoints.length > 0 ? draftingPoints[draftingPoints.length - 1] : null,
      origin: plan.gridOrigin,
    });

    setCurrentCursorMine(snapResult.point);
    if (snapResult.snappedType) {
      setSnapFeedback({ point: snapResult.point, label: snapResult.label });
    } else {
      setSnapFeedback(null);
    }

    // Handle dragging a sheet layout element (title block, legend, section, north arrow, scale bar)
    if (draggingLayoutKey && layoutDragStart) {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const svgX = (clientX - panOffset.x) / zoomLevel;
      const svgY = (clientY - panOffset.y) / zoomLevel;
      const dx = svgX - layoutDragStart.startSvgX;
      const dy = svgY - layoutDragStart.startSvgY;

      setPlan((prev) => {
        const currentLayout = prev.layout || {};
        const elemKey = draggingLayoutKey as keyof typeof layout;
        const currentElem = (currentLayout as any)[elemKey] || (layout as any)[elemKey];
        return {
          ...prev,
          layout: {
            ...layout,
            ...currentLayout,
            [elemKey]: {
              ...currentElem,
              x: Math.round(layoutDragStart.origX + dx),
              y: Math.round(layoutDragStart.origY + dy),
            },
          },
        };
      });
      return;
    }

    // Handle dragging a selected vertex node
    if (draggedVertexIndex !== null && selectedId && selectedType) {
      const updatedPt = snapResult.point;
      if (selectedType === 'tunnel') {
        setPlan((prev) => ({
          ...prev,
          tunnels: prev.tunnels.map((t) => {
            if (t.id !== selectedId) return t;
            const newPoints = [...t.points];
            newPoints[draggedVertexIndex] = updatedPt;
            return { ...t, points: newPoints };
          }),
        }));
      } else if (selectedType === 'geology') {
        setPlan((prev) => ({
          ...prev,
          geologicalFeatures: prev.geologicalFeatures.map((g) => {
            if (g.id !== selectedId) return g;
            const newPoints = [...g.points];
            newPoints[draggedVertexIndex] = updatedPt;
            return { ...g, points: newPoints };
          }),
        }));
      }
    }
  };

  // Mouse up handler
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedVertexIndex(null);
    setDraggingLayoutKey(null);
    setLayoutDragStart(null);
  };

  // Double click finishes drafting a tunnel or geology feature
  const handleDoubleClick = () => {
    if (draftingPoints.length >= 2 && activeTool === 'draw_tunnel') {
      const newTunnel: Tunnel = {
        id: `t-${Date.now()}`,
        name: `${tunnelConfig.type.toUpperCase()} Drive`,
        type: tunnelConfig.type,
        points: draftingPoints,
        width: tunnelConfig.width,
        profile: 'arch',
        grade: 'Flat',
        status: 'developed',
        isSurveyed: plan.metadata.isSurveyCalibrated,
      };
      setPlan((prev) => ({ ...prev, tunnels: [...prev.tunnels, newTunnel] }));
      setDraftingPoints([]);
      onSelect(newTunnel.id, 'tunnel');
      setActiveTool('select');
    } else if (draftingPoints.length >= 3 && activeTool === 'draw_geology') {
      const newGeology: GeologicalFeature = {
        id: `geo-${Date.now()}`,
        name: `${geologyConfig.type.replace('_', ' ').toUpperCase()}`,
        type: geologyConfig.type,
        points: draftingPoints,
        fillPattern: geologyConfig.pattern,
        fillColor: geologyConfig.pattern === 'diagonal_red' ? '#fee2e2' : '#f8fafc',
        strokeColor: geologyConfig.pattern === 'diagonal_red' ? '#dc2626' : '#334155',
        strokeWidth: 2,
        opacity: 0.9,
        isSurveyed: plan.metadata.isSurveyCalibrated,
      };
      setPlan((prev) => ({ ...prev, geologicalFeatures: [...prev.geologicalFeatures, newGeology] }));
      setDraftingPoints([]);
      onSelect(newGeology.id, 'geology');
      setActiveTool('select');
    } else if (draftingPoints.length >= 2 && activeTool === 'draw_utility') {
      const newUtility: VentilationUtility = {
        id: `util-${Date.now()}`,
        name: utilityConfig.type.replace('_', ' ').toUpperCase(),
        type: utilityConfig.type,
        points: draftingPoints,
        color:
          utilityConfig.type === 'fresh_air'
            ? '#0284c7'
            : utilityConfig.type === 'return_air'
            ? '#dc2626'
            : utilityConfig.type === 'electrical_cable'
            ? '#eab308'
            : utilityConfig.type === 'water_pipe'
            ? '#2563eb'
            : '#16a34a',
        width: 2.2,
        hasArrows: utilityConfig.type === 'fresh_air' || utilityConfig.type === 'return_air',
        flowDirection: 'forward',
        isSurveyed: plan.metadata.isSurveyCalibrated,
      };
      setPlan((prev) => ({ ...prev, ventilationUtilities: [...prev.ventilationUtilities, newUtility] }));
      setDraftingPoints([]);
      onSelect(newUtility.id, 'utility');
      setActiveTool('select');
    }
  };

  // Keyboard shortcut handler (Escape cancels drafting, Enter finishes, Delete removes selected)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDraftingPoints([]);
        onSelect(null, null);
      } else if (e.key === 'Enter') {
        handleDoubleClick();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && selectedType) {
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
          onSelect(null, null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draftingPoints, selectedId, selectedType, activeTool]);

  // Transform helper from mine coordinates to SVG
  const toSvg = (pt: Point2D): Point2D => {
    return mineToSvg(pt, plan.gridOrigin, plan.gridWidth, plan.gridHeight, svgWidth, svgHeight);
  };

  // Grid tick numbers:
  // Eastings: 335400, 335600, 335800, 336000, 336200, 336400
  const eastingValues = [335400, 335600, 335800, 336000, 336200, 336400];
  // Northings: 7801800, 7802000, 7802200, 7802400, 7802600
  const northingValues = [7801800, 7802000, 7802200, 7802400, 7802600];

  // Sheet layout margins (so border, grid numbers, title blocks and neatlines sit on paper)
  const margin = 50;
  const mapInnerW = svgWidth - margin * 2;
  const mapInnerH = svgHeight - margin * 2;

  // Selected object vertex points for node editing
  let selectedPoints: Point2D[] = [];
  if (selectedId && selectedType === 'tunnel') {
    const t = plan.tunnels.find((item) => item.id === selectedId);
    if (t) selectedPoints = t.points;
  } else if (selectedId && selectedType === 'geology') {
    const g = plan.geologicalFeatures.find((item) => item.id === selectedId);
    if (g) selectedPoints = g.points;
  }



  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="flex-1 h-full w-full bg-[#0a0d14] relative overflow-hidden select-none cursor-crosshair"
    >
      {/* Live Coordinate Status Ribbon in bottom-left */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-4 shadow-lg pointer-events-none">
        <div>
          <span className="text-slate-500 font-sans mr-1">Easting:</span>
          <span className="text-cyan-300 font-bold">
            {currentCursorMine ? Math.round(currentCursorMine.x).toLocaleString() : '---'} m E
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-sans mr-1">Northing:</span>
          <span className="text-cyan-300 font-bold">
            {currentCursorMine ? Math.round(currentCursorMine.y).toLocaleString() : '---'} m N
          </span>
        </div>
        <div>
          <span className="text-slate-500 font-sans mr-1">Datum:</span>
          <span className="text-slate-400">Mine Grid (Local)</span>
        </div>
        {snapFeedback && (
          <div className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded text-[11px] border border-emerald-800">
            {snapFeedback.label}
          </div>
        )}
      </div>

      {/* Interactive SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full block"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Pattern 1: Red Diagonal Hatching for Mined-out Stopes */}
          <pattern
            id="diagonal_red"
            width="12"
            height="12"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="12" height="12" fill="#fee2e2" />
            <line x1="0" y1="0" x2="0" y2="12" stroke="#dc2626" strokeWidth="2" />
          </pattern>

          {/* Pattern 2: Dense Diagonal Hatching for Planned Stopes */}
          <pattern
            id="diagonal_dense"
            width="8"
            height="8"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="8" height="8" fill="#fecaca" opacity="0.6" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="1.2" />
          </pattern>

          {/* Pattern 3: Stipple Dot Rock Hatching for Ore Zone */}
          <pattern
            id="stipple_ore"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <rect width="14" height="14" fill="#f8fafc" opacity="0.1" />
            <circle cx="3" cy="3" r="0.9" fill="#94a3b8" />
            <circle cx="10" cy="8" r="1.1" fill="#64748b" />
            <circle cx="6" cy="11" r="0.8" fill="#94a3b8" />
          </pattern>

          {/* Pattern 4: Triangular Gravel Pattern for Waste / Backfill */}
          <pattern
            id="triangles_gravel"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <polygon points="4,2 8,8 2,8" fill="none" stroke="#64748b" strokeWidth="1" />
            <polygon points="12,9 15,15 9,15" fill="none" stroke="#64748b" strokeWidth="1" />
          </pattern>

          {/* Pattern 5: Crosshatch */}
          <pattern
            id="crosshatch"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="10" y2="10" stroke="#94a3b8" strokeWidth="1" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="1" />
          </pattern>

          {/* Arrow Marker: Fresh Air (Blue) */}
          <marker
            id="marker-arrow-fresh"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
          </marker>

          {/* Arrow Marker: Return Air (Red) */}
          <marker
            id="marker-arrow-return"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#dc2626" />
          </marker>

          {/* Dimension Line Arrow Marker */}
          <marker
            id="marker-dim"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 10 5 L 0 8 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Paper Drawing Canvas Background */}
        <rect
          x="0"
          y="0"
          width={svgWidth}
          height={svgHeight}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="2"
        />

        {/* ======================================================== */}
        {/* LAYER: SURVEY GRID & NEATLINE BORDER */}
        {/* ======================================================== */}
        {plan.layers.surveyGrid.visible && (
          <g
            id="layer-survey-grid"
            opacity={plan.layers.surveyGrid.opacity}
            className="select-none font-mono text-[11px]"
          >
            {/* Outer Sheet Neatline Border */}
            <rect
              x="12"
              y="12"
              width={svgWidth - 24}
              height={svgHeight - 24}
              fill="none"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Inner Engineering Coordinate Border */}
            <rect
              x="300"
              y="40"
              width={svgWidth - 320}
              height={svgHeight - 120}
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* Easting Vertical Grid Lines & Coordinate Labels */}
            {eastingValues.map((easting) => {
              const svgPt = toSvg({ x: easting, y: plan.gridOrigin.y });
              if (svgPt.x < 300 || svgPt.x > svgWidth - 20) return null;
              const formattedE = `${Math.floor(easting / 1000)} ${(easting % 1000).toString().padStart(3, '0')} E`;

              return (
                <g key={easting}>
                  {/* Subtle Grid Line */}
                  <line
                    x1={svgPt.x}
                    y1={40}
                    x2={svgPt.x}
                    y2={svgHeight - 80}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  {/* Top Tick & Label */}
                  <line x1={svgPt.x} y1={34} x2={svgPt.x} y2={40} stroke="#0f172a" strokeWidth="1.5" />
                  <text
                    x={svgPt.x}
                    y={30}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {formattedE}
                  </text>
                  {/* Bottom Tick & Label */}
                  <line x1={svgPt.x} y1={svgHeight - 80} x2={svgPt.x} y2={svgHeight - 74} stroke="#0f172a" strokeWidth="1.5" />
                  <text
                    x={svgPt.x}
                    y={svgHeight - 62}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {formattedE}
                  </text>
                </g>
              );
            })}

            {/* Northing Horizontal Grid Lines & Coordinate Labels */}
            {northingValues.map((northing) => {
              const svgPt = toSvg({ x: plan.gridOrigin.x, y: northing });
              if (svgPt.y < 40 || svgPt.y > svgHeight - 80) return null;
              const formattedN = `${Math.floor(northing / 1000)} ${(northing % 1000).toString().padStart(3, '0')} N`;

              return (
                <g key={northing}>
                  {/* Subtle Grid Line */}
                  <line
                    x1={300}
                    y1={svgPt.y}
                    x2={svgWidth - 20}
                    y2={svgPt.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  {/* Left Tick & Label */}
                  <line x1={294} y1={svgPt.y} x2={300} stroke="#0f172a" strokeWidth="1.5" />
                  <text
                    x={288}
                    y={svgPt.y + 4}
                    textAnchor="end"
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="600"
                    transform={`rotate(-90 288 ${svgPt.y + 4})`}
                  >
                    {formattedN}
                  </text>
                  {/* Right Tick & Label */}
                  <line x1={svgWidth - 20} y1={svgPt.y} x2={svgWidth - 14} stroke="#0f172a" strokeWidth="1.5" />
                  <text
                    x={svgWidth - 6}
                    y={svgPt.y + 4}
                    textAnchor="start"
                    fill="#0f172a"
                    fontSize="11"
                    fontWeight="600"
                    transform={`rotate(90 ${svgWidth - 6} ${svgPt.y + 4})`}
                  >
                    {formattedN}
                  </text>
                </g>
              );
            })}

            {/* North Arrow */}
            {layout.northArrow.visible && (
              <g
                transform={`translate(${layout.northArrow.x}, ${layout.northArrow.y}) scale(${layout.northArrow.scale})`}
                onMouseDown={(e) => handleLayoutMouseDown(e, 'northArrow')}
                onMouseEnter={() => activeTool === 'select' && setHoveredLayoutKey('northArrow')}
                onMouseLeave={() => setHoveredLayoutKey((prev) => (prev === 'northArrow' ? null : prev))}
                className={activeTool === 'select' ? 'cursor-move select-none' : 'select-none'}
              >
                {(hoveredLayoutKey === 'northArrow' || draggingLayoutKey === 'northArrow') && activeTool === 'select' && (
                  <circle cx="0" cy="0" r="32" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
                )}
                <circle cx="0" cy="0" r="24" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" opacity="0.9" />
                {/* Arrow Head */}
                <polygon points="0,-20 8,10 0,6" fill="#0f172a" />
                <polygon points="0,-20 -8,10 0,6" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <text x="0" y="-26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0f172a">
                  N
                </text>
              </g>
            )}

            {/* Metric Scale Bar */}
            {layout.scaleBar.visible && (
              <g
                transform={`translate(${layout.scaleBar.x}, ${layout.scaleBar.y}) scale(${layout.scaleBar.scale})`}
                onMouseDown={(e) => handleLayoutMouseDown(e, 'scaleBar')}
                onMouseEnter={() => activeTool === 'select' && setHoveredLayoutKey('scaleBar')}
                onMouseLeave={() => setHoveredLayoutKey((prev) => (prev === 'scaleBar' ? null : prev))}
                className={activeTool === 'select' ? 'cursor-move select-none' : 'select-none'}
              >
                {(hoveredLayoutKey === 'scaleBar' || draggingLayoutKey === 'scaleBar') && activeTool === 'select' && (
                  <rect x="-8" y="-18" width="340" height="46" rx="4" fill="#06b6d4" fillOpacity="0.08" stroke="#06b6d4" strokeWidth="1.2" strokeDasharray="3 3" />
                )}
                {/* Scale bar: 400m total (0 to 400) at 1:2000 */}
                <rect x="0" y="0" width="40" height="6" fill="#000000" />
                <rect x="40" y="0" width="40" height="6" fill="#ffffff" stroke="#000000" strokeWidth="0.8" />
                <rect x="80" y="0" width="80" height="6" fill="#000000" />
                <rect x="160" y="0" width="80" height="6" fill="#ffffff" stroke="#000000" strokeWidth="0.8" />
                <rect x="240" y="0" width="80" height="6" fill="#000000" />

                <text x="0" y="-4" fontSize="10" textAnchor="middle" fill="#000000">0</text>
                <text x="40" y="-4" fontSize="10" textAnchor="middle" fill="#000000">50</text>
                <text x="80" y="-4" fontSize="10" textAnchor="middle" fill="#000000">100</text>
                <text x="160" y="-4" fontSize="10" textAnchor="middle" fill="#000000">200</text>
                <text x="240" y="-4" fontSize="10" textAnchor="middle" fill="#000000">300</text>
                <text x="320" y="-4" fontSize="10" textAnchor="middle" fill="#000000">400 m</text>
                <text x="160" y="18" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000000">
                  Scale 1 : 2 000
                </text>
              </g>
            )}

            {/* Top-Left Title Block */}
            {layout.titleBlockTopLeft.visible && (
              <g
                transform={`translate(${layout.titleBlockTopLeft.x}, ${layout.titleBlockTopLeft.y}) scale(${layout.titleBlockTopLeft.scale})`}
                onMouseDown={(e) => handleLayoutMouseDown(e, 'titleBlockTopLeft')}
                onMouseEnter={() => activeTool === 'select' && setHoveredLayoutKey('titleBlockTopLeft')}
                onMouseLeave={() => setHoveredLayoutKey((prev) => (prev === 'titleBlockTopLeft' ? null : prev))}
                className={activeTool === 'select' ? 'cursor-move select-none' : 'select-none'}
              >
                {(hoveredLayoutKey === 'titleBlockTopLeft' || draggingLayoutKey === 'titleBlockTopLeft') && activeTool === 'select' && (
                  <rect x="-4" y="-4" width="258" height="238" rx="4" fill="#06b6d4" fillOpacity="0.08" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 4" />
                )}
                <rect width="250" height="230" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                {/* Banner */}
                <rect width="250" height="66" fill="#0f172a" />
                <text x="14" y="32" fill="#ffffff" fontSize="20" fontWeight="bold" fontFamily="sans-serif">
                  {plan.metadata.mineName}
                </text>
                <text x="14" y="52" fill="#93c5fd" fontSize="13" fontWeight="500" fontFamily="sans-serif">
                  {plan.metadata.title}
                </text>

                {/* Metadata Table Rows */}
                <g transform="translate(14, 90)" fontSize="11" fontFamily="sans-serif">
                  <text x="0" y="0" fill="#475569" fontWeight="600">Level:</text>
                  <text x="70" y="0" fill="#0f172a" fontWeight="bold" fontFamily="monospace">{plan.metadata.level}</text>
                  <line x1="0" y1="6" x2="222" y2="6" stroke="#e2e8f0" strokeWidth="1" />

                  <text x="0" y="24" fill="#475569" fontWeight="600">Plan:</text>
                  <text x="70" y="24" fill="#0f172a">{plan.metadata.planType}</text>
                  <line x1="0" y1="30" x2="222" y2="30" stroke="#e2e8f0" strokeWidth="1" />

                  <text x="0" y="48" fill="#475569" fontWeight="600">Datum:</text>
                  <text x="70" y="48" fill="#0f172a">{plan.metadata.datum}</text>
                  <line x1="0" y1="54" x2="222" y2="54" stroke="#e2e8f0" strokeWidth="1" />

                  <text x="0" y="72" fill="#475569" fontWeight="600">Scale:</text>
                  <text x="70" y="72" fill="#0f172a" fontFamily="monospace">{plan.metadata.scaleText}</text>
                  <line x1="0" y1="78" x2="222" y2="78" stroke="#e2e8f0" strokeWidth="1" />

                  <text x="0" y="96" fill="#475569" fontWeight="600">Date:</text>
                  <text x="70" y="96" fill="#0f172a">{plan.metadata.date}</text>
                  <line x1="0" y1="102" x2="222" y2="102" stroke="#e2e8f0" strokeWidth="1" />

                  <text x="0" y="120" fill="#475569" fontWeight="600">Revision:</text>
                  <text x="70" y="120" fill="#0f172a" fontWeight="bold">{plan.metadata.revision}</text>
                </g>
              </g>
            )}

            {/* Left Legend Block */}
            {layout.legend.visible && (
              <g
                transform={`translate(${layout.legend.x}, ${layout.legend.y}) scale(${layout.legend.scale})`}
                onMouseDown={(e) => handleLayoutMouseDown(e, 'legend')}
                onMouseEnter={() => activeTool === 'select' && setHoveredLayoutKey('legend')}
                onMouseLeave={() => setHoveredLayoutKey((prev) => (prev === 'legend' ? null : prev))}
                className={activeTool === 'select' ? 'cursor-move select-none' : 'select-none'}
                fontSize="10.5"
                fontFamily="sans-serif"
              >
                {(hoveredLayoutKey === 'legend' || draggingLayoutKey === 'legend') && activeTool === 'select' && (
                  <rect x="-4" y="-4" width="258" height="428" rx="4" fill="#06b6d4" fillOpacity="0.08" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 4" />
                )}
                <rect width="250" height="420" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                <text x="14" y="26" fontSize="14" fontWeight="bold" fill="#0f172a">
                  Legend
                </text>
                <line x1="14" y1="34" x2="236" y2="34" stroke="#0f172a" strokeWidth="1" />

                {/* Legend Items */}
                <g transform="translate(14, 52)">
                  {/* 1. Development drive */}
                  <rect x="0" y="0" width="38" height="10" rx="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="48" y="9" fill="#0f172a">Development drive (tunnel)</text>

                  {/* 2. Decline (ramp) */}
                  <rect x="0" y="18" width="38" height="10" rx="5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="5" y1="23" x2="33" y2="23" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
                  <text x="48" y="27" fill="#0f172a">Decline (ramp)</text>

                  {/* 3. Raise (up) */}
                  <line x1="0" y1="42" x2="38" y2="42" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="5 3" />
                  <text x="48" y="45" fill="#0f172a">Raise (up)</text>

                  {/* 4. Winze (down) */}
                  <line x1="0" y1="60" x2="38" y2="60" stroke="#0f172a" strokeWidth="1.5" strokeDasharray="2 3" />
                  <text x="48" y="63" fill="#0f172a">Winze (down)</text>

                  {/* 5. Stope (mined-out) */}
                  <rect x="0" y="74" width="38" height="14" fill="url(#diagonal_red)" stroke="#dc2626" strokeWidth="1.2" />
                  <text x="48" y="85" fill="#0f172a">Stope (mined-out)</text>

                  {/* 6. Ore body / Ore zone */}
                  <rect x="0" y="96" width="38" height="14" fill="url(#stipple_ore)" stroke="#334155" strokeWidth="1.2" strokeDasharray="3 2" />
                  <text x="48" y="107" fill="#0f172a">Ore body / Ore zone</text>

                  {/* 7. Waste / Backfill */}
                  <rect x="0" y="118" width="38" height="14" fill="url(#triangles_gravel)" stroke="#64748b" strokeWidth="1.2" />
                  <text x="48" y="129" fill="#0f172a">Waste / Backfill</text>

                  {/* 8. Ventilation (fresh air) */}
                  <line x1="0" y1="148" x2="38" y2="148" stroke="#0284c7" strokeWidth="2.2" markerEnd="url(#marker-arrow-fresh)" />
                  <text x="48" y="151" fill="#0f172a">Ventilation (fresh air)</text>

                  {/* 9. Ventilation (return air) */}
                  <line x1="0" y1="168" x2="38" y2="168" stroke="#dc2626" strokeWidth="2.2" strokeDasharray="5 3" markerEnd="url(#marker-arrow-return)" />
                  <text x="48" y="171" fill="#0f172a">Ventilation (return air)</text>

                  {/* 10. Electrical cable route */}
                  <line x1="0" y1="188" x2="38" y2="188" stroke="#eab308" strokeWidth="2.5" />
                  <text x="48" y="191" fill="#0f172a">Electrical cable route</text>

                  {/* 11. Water pipeline */}
                  <line x1="0" y1="208" x2="38" y2="208" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 3" />
                  <text x="48" y="211" fill="#0f172a">Water pipeline</text>

                  {/* 12. Compressed air line */}
                  <line x1="0" y1="228" x2="38" y2="228" stroke="#16a34a" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="48" y="231" fill="#0f172a">Compressed air line</text>

                  {/* 13. POI Circle */}
                  <circle cx="16" cy="250" r="10" fill="none" stroke="#dc2626" strokeWidth="2.5" />
                  <text x="48" y="253" fill="#0f172a">Point of interest (gas/hazard)</text>

                  {/* 14. Hazard Warning */}
                  <polygon points="16,266 26,284 6,284" fill="#facc15" stroke="#000000" strokeWidth="1.2" />
                  <text x="16" y="282" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#000000">!</text>
                  <text x="48" y="278" fill="#0f172a">Hazard / Restricted area</text>

                  {/* 15. Refuge chamber */}
                  <rect x="8" y="294" width="16" height="16" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
                  <rect x="12" y="298" width="8" height="8" fill="#0f172a" />
                  <text x="48" y="306" fill="#0f172a">Refuge chamber</text>

                  {/* 16. Ore pass */}
                  <circle cx="16" cy="326" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="10" y1="320" x2="22" y2="332" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="22" y1="320" x2="10" y2="332" stroke="#0f172a" strokeWidth="1.5" />
                  <text x="48" y="330" fill="#0f172a">Ore pass</text>

                  {/* 17. Sump */}
                  <circle cx="16" cy="348" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                  <line x1="10" y1="342" x2="22" y2="354" stroke="#0f172a" strokeWidth="1.2" />
                  <line x1="22" y1="342" x2="10" y2="354" stroke="#0f172a" strokeWidth="1.2" />
                  <circle cx="16" cy="348" r="4" fill="none" stroke="#0f172a" strokeWidth="1" />
                  <text x="48" y="352" fill="#0f172a">Sump (water collection)</text>

                  {/* 18. Pump station */}
                  <rect x="8" y="364" width="16" height="12" fill="#0f172a" />
                  <polygon points="12,360 20,360 20,364 12,364" fill="#0f172a" />
                  <text x="48" y="373" fill="#0f172a">Pump station</text>
                </g>
              </g>
            )}

            {/* Bottom-Right Title Block */}
            {layout.titleBlockBottomRight.visible && (
              <g
                transform={`translate(${layout.titleBlockBottomRight.x}, ${layout.titleBlockBottomRight.y}) scale(${layout.titleBlockBottomRight.scale})`}
                onMouseDown={(e) => handleLayoutMouseDown(e, 'titleBlockBottomRight')}
                onMouseEnter={() => activeTool === 'select' && setHoveredLayoutKey('titleBlockBottomRight')}
                onMouseLeave={() => setHoveredLayoutKey((prev) => (prev === 'titleBlockBottomRight' ? null : prev))}
                className={activeTool === 'select' ? 'cursor-move select-none' : 'select-none'}
                fontFamily="sans-serif"
              >
                {(hoveredLayoutKey === 'titleBlockBottomRight' || draggingLayoutKey === 'titleBlockBottomRight') && activeTool === 'select' && (
                  <rect x="-4" y="-4" width="348" height="82" rx="4" fill="#06b6d4" fillOpacity="0.08" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 4" />
                )}
                <rect width="340" height="74" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                {/* Title Header */}
                <rect width="340" height="22" fill="#f8fafc" stroke="#0f172a" strokeWidth="1" />
                <text x="170" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                  WEBA MINE – UNDERGROUND PLAN
                </text>
                <g fontSize="9.5" fill="#334155" transform="translate(10, 36)">
                  <text x="0" y="0">Level: <tspan fontWeight="bold" fill="#0f172a">{plan.metadata.level}</tspan></text>
                  <text x="120" y="0">Plan: <tspan fontWeight="bold" fill="#0f172a">{plan.metadata.planType}</tspan></text>

                  <text x="0" y="15">Project: <tspan fill="#0f172a">{plan.metadata.project}</tspan></text>

                  <text x="0" y="30">Drawn: <tspan fill="#0f172a">{plan.metadata.drawnBy}</tspan></text>
                  <text x="120" y="30">Checked: <tspan fill="#0f172a">{plan.metadata.checkedBy}</tspan></text>
                  <text x="260" y="30">Rev: <tspan fontWeight="bold" fill="#0f172a">{plan.metadata.revision}</tspan></text>
                </g>
              </g>
            )}
          </g>
        )}

        {/* ======================================================== */}
        {/* LAYER: GEOLOGY & STOPES */}
        {/* ======================================================== */}
        {plan.layers.geology.visible && (
          <g id="layer-geology" opacity={plan.layers.geology.opacity}>
            {plan.geologicalFeatures.map((geo) => {
              const svgPoints = geo.points.map(toSvg);
              const pathD = pointsToSvgPath(svgPoints, true);
              const isSelected = selectedId === geo.id;

              return (
                <g key={geo.id}>
                  <path
                    d={pathD}
                    fill={`url(#${geo.fillPattern})`}
                    stroke={geo.strokeColor}
                    strokeWidth={isSelected ? geo.strokeWidth + 1.5 : geo.strokeWidth}
                    strokeDasharray={geo.strokeDasharray}
                    opacity={geo.opacity}
                    className="cursor-pointer transition-all hover:brightness-105"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(geo.id, 'geology');
                    }}
                  />
                  {isSelected && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ======================================================== */}
        {/* LAYER: EXCAVATIONS & TUNNELS */}
        {/* ======================================================== */}
        {plan.layers.excavations.visible && (
          <g id="layer-excavations" opacity={plan.layers.excavations.opacity}>
            {plan.tunnels.map((tunnel) => {
              // Generate ribbon polygon in mine meters then transform to SVG
              const ribbonMine = generateTunnelRibbon(tunnel.points, tunnel.width);
              const ribbonSvg = ribbonMine.map(toSvg);
              const ribbonPath = pointsToSvgPath(ribbonSvg, true);

              // Centerline path for guidelines and selection
              const centerlineSvg = tunnel.points.map(toSvg);
              const centerlinePath = pointsToSvgPath(centerlineSvg, false);

              const isSelected = selectedId === tunnel.id;

              return (
                <g
                  key={tunnel.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(tunnel.id, 'tunnel');
                  }}
                  className="cursor-pointer group"
                >
                  {/* Excavation Hollow Body */}
                  <path
                    d={ribbonPath}
                    fill={tunnel.fillColor || '#ffffff'}
                    stroke={isSelected ? '#06b6d4' : '#0f172a'}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {/* Centerline Guideline */}
                  <path
                    d={centerlinePath}
                    fill="none"
                    stroke={isSelected ? '#06b6d4' : '#94a3b8'}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    strokeDasharray={tunnel.type === 'raise' || tunnel.type === 'winze' ? '4 3' : 'none'}
                    opacity="0.7"
                  />

                  {/* Tunnel Start / End caps */}
                  <circle
                    cx={centerlineSvg[0].x}
                    cy={centerlineSvg[0].y}
                    r={2}
                    fill="#0f172a"
                  />
                  <circle
                    cx={centerlineSvg[centerlineSvg.length - 1].x}
                    cy={centerlineSvg[centerlineSvg.length - 1].y}
                    r={2}
                    fill="#0f172a"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* ======================================================== */}
        {/* LAYER: VENTILATION & UTILITY RETICULATION */}
        {/* ======================================================== */}
        {plan.layers.ventilationUtilities.visible && (
          <g id="layer-utilities" opacity={plan.layers.ventilationUtilities.opacity}>
            {plan.ventilationUtilities.map((util) => {
              const svgPoints = util.points.map(toSvg);
              const pathD = pointsToSvgPath(svgPoints, false);
              const isSelected = selectedId === util.id;

              let markerEnd = undefined;
              if (util.hasArrows) {
                if (util.type === 'fresh_air') markerEnd = 'url(#marker-arrow-fresh)';
                else if (util.type === 'return_air') markerEnd = 'url(#marker-arrow-return)';
              }

              return (
                <g
                  key={util.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(util.id, 'utility');
                  }}
                  className="cursor-pointer"
                >
                  {/* Outer selection glow */}
                  {isSelected && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={util.width + 3}
                      opacity="0.5"
                    />
                  )}
                  {/* Service Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={util.color}
                    strokeWidth={util.width}
                    strokeDasharray={util.dashPattern}
                    markerEnd={markerEnd}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* ======================================================== */}
        {/* LAYER: MINING SYMBOLS & EQUIPMENT */}
        {/* ======================================================== */}
        {plan.layers.symbols.visible && (
          <g id="layer-symbols" opacity={plan.layers.symbols.opacity}>
            {plan.symbols.map((sym) => {
              const svgPt = toSvg(sym.position);
              const isSelected = selectedId === sym.id;

              return (
                <g
                  key={sym.id}
                  transform={`translate(${svgPt.x}, ${svgPt.y}) rotate(${sym.rotation}) scale(${sym.scale})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(sym.id, 'symbol');
                  }}
                  className="cursor-pointer select-none"
                >
                  {/* Selection Indicator Ring */}
                  {isSelected && (
                    <circle cx="0" cy="0" r="16" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" />
                  )}

                  {/* POI Circle (Central Gas Monitor / Ventilation Node) */}
                  {sym.type === 'poi_circle' && (
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#dc2626" strokeWidth="3" />
                  )}

                  {/* Refuge Chamber Symbol */}
                  {sym.type === 'refuge_chamber' && (
                    <g>
                      <rect x="-8" y="-8" width="16" height="16" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                      <rect x="-4" y="-4" width="8" height="8" fill="#0f172a" />
                    </g>
                  )}

                  {/* Pump Station Symbol */}
                  {sym.type === 'pump_station' && (
                    <g>
                      <rect x="-8" y="-6" width="16" height="12" fill="#0f172a" />
                      <polygon points="-4,-10 4,-10 4,-6 -4,-6" fill="#0f172a" />
                    </g>
                  )}

                  {/* Sump Symbol */}
                  {sym.type === 'sump' && (
                    <g>
                      <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                      <line x1="-6" y1="-6" x2="6" y2="6" stroke="#0f172a" strokeWidth="1.2" />
                      <line x1="6" y1="-6" x2="-6" y2="6" stroke="#0f172a" strokeWidth="1.2" />
                      <circle cx="0" cy="0" r="4" fill="none" stroke="#0f172a" strokeWidth="1" />
                    </g>
                  )}

                  {/* Ore Pass Symbol */}
                  {sym.type === 'ore_pass' && (
                    <g>
                      <circle cx="0" cy="0" r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                      <line x1="-5.5" y1="-5.5" x2="5.5" y2="5.5" stroke="#0f172a" strokeWidth="1.5" />
                      <line x1="5.5" y1="-5.5" x2="-5.5" y2="5.5" stroke="#0f172a" strokeWidth="1.5" />
                    </g>
                  )}

                  {/* Hazard Warning Triangle */}
                  {sym.type === 'hazard' && (
                    <g>
                      <polygon points="0,-12 11,8 -11,8" fill="#facc15" stroke="#000000" strokeWidth="1.5" />
                      <text x="0" y="6" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#000000">!</text>
                    </g>
                  )}

                  {/* Survey Benchmark Peg */}
                  {sym.type === 'survey_peg' && (
                    <g>
                      <circle cx="0" cy="0" r="4" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />
                      <polygon points="0,-7 6,5 -6,5" fill="none" stroke="#06b6d4" strokeWidth="1" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ======================================================== */}
        {/* LAYER: TYPICAL DRIVE SECTION INSET CALLOUT */}
        {/* ======================================================== */}
        {plan.layers.crossSection.visible && layout.crossSection.visible && (
          <g
            id="layer-cross-section"
            transform={`translate(${layout.crossSection.x}, ${layout.crossSection.y}) scale(${layout.crossSection.scale})`}
            opacity={plan.layers.crossSection.opacity}
            onMouseDown={(e) => handleLayoutMouseDown(e, 'crossSection')}
            onMouseEnter={() => activeTool === 'select' && setHoveredLayoutKey('crossSection')}
            onMouseLeave={() => setHoveredLayoutKey((prev) => (prev === 'crossSection' ? null : prev))}
            className={activeTool === 'select' ? 'cursor-move select-none' : 'select-none'}
          >
            {(hoveredLayoutKey === 'crossSection' || draggingLayoutKey === 'crossSection') && activeTool === 'select' && (
              <rect x="-4" y="-4" width="188" height="218" rx="6" fill="#06b6d4" fillOpacity="0.08" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 4" />
            )}
            {/* Arched section 4.5m x 4.5m matching reference plan */}
            <rect width="180" height="210" fill="#ffffff" stroke="#0f172a" strokeWidth="1.2" rx="4" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <text x="90" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">
              Typical Drive Section A – A'
            </text>
            <text x="90" y="34" textAnchor="middle" fontSize="9" fill="#475569">
              (Development Drive)
            </text>

            {/* Arched excavation profile inside inset */}
            <g transform="translate(20, 36)">
              {/* Rock Bolts */}
              <line x1="30" y1="50" x2="10" y2="40" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="45" y1="30" x2="35" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="95" y1="30" x2="105" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="110" y1="50" x2="130" y2="40" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Arched Profile Path */}
              <path
                d="M 30 110 L 30 65 Q 30 25 70 25 Q 110 25 110 65 L 110 110 Z"
                fill="#f8fafc"
                stroke="#0f172a"
                strokeWidth="2"
              />
              {/* Floor Ballast */}
              <rect x="30" y="105" width="80" height="6" fill="#64748b" />
              {/* Electrical Cable Tray */}
              <rect x="94" y="46" width="12" height="5" fill="#eab308" />
              {/* Water Pipe */}
              <circle cx="100" cy="58" r="3" fill="#2563eb" />
              {/* Air Pipe */}
              <circle cx="100" cy="67" r="2.5" fill="#16a34a" />

              {/* Width Dimension (4.5 m) */}
              <line x1="30" y1="15" x2="110" y2="15" stroke="#0f172a" strokeWidth="1" markerStart="url(#marker-dim)" markerEnd="url(#marker-dim)" />
              <text x="70" y="12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a">4.5 m</text>

              {/* Height Dimension (4.5 m) */}
              <line x1="18" y1="25" x2="18" y2="110" stroke="#0f172a" strokeWidth="1" markerStart="url(#marker-dim)" markerEnd="url(#marker-dim)" />
              <text x="12" y="70" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0f172a" transform="rotate(-90 12 70)">4.5 m</text>
            </g>
          </g>
        )}

        {/* ======================================================== */}
        {/* LAYER: ANNOTATIONS & CALLOUTS */}
        {/* ======================================================== */}
        {plan.layers.annotations.visible && (
          <g id="layer-annotations" opacity={plan.layers.annotations.opacity}>
            {plan.annotations.map((ann) => {
              const posSvg = toSvg(ann.position);
              const targetSvg = ann.target ? toSvg(ann.target) : null;
              const isSelected = selectedId === ann.id;

              return (
                <g
                  key={ann.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(ann.id, 'annotation');
                  }}
                  className="cursor-pointer font-sans select-none"
                >
                  {/* Leader Line if target is defined */}
                  {targetSvg && (
                    <g>
                      <line
                        x1={posSvg.x}
                        y1={posSvg.y}
                        x2={targetSvg.x}
                        y2={targetSvg.y}
                        stroke="#0f172a"
                        strokeWidth="1.2"
                      />
                      <circle cx={targetSvg.x} cy={targetSvg.y} r="2.5" fill="#0f172a" />
                    </g>
                  )}

                  {/* Annotation Text Box */}
                  <g transform={`translate(${posSvg.x}, ${posSvg.y})`}>
                    {isSelected && (
                      <rect
                        x="-4"
                        y="-16"
                        width="140"
                        height="36"
                        fill="#06b6d4"
                        opacity="0.15"
                        stroke="#06b6d4"
                        strokeWidth="1"
                        rx="3"
                      />
                    )}
                    {ann.text.split('\n').map((line, idx) => (
                      <text
                        key={idx}
                        x="0"
                        y={idx * (ann.fontSize + 3)}
                        fontSize={ann.fontSize}
                        fontWeight="600"
                        fill="#0f172a"
                        fontFamily="sans-serif"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================================================== */}
        {/* INTERACTIVE DRAFTING OVERLAY (LIVE PREVIEW) */}
        {/* ======================================================== */}
        {draftingPoints.length > 0 && (
          <g id="drafting-preview">
            {/* Drafted polyline segments */}
            {draftingPoints.map((pt, idx) => {
              const svgPt = toSvg(pt);
              return (
                <circle
                  key={idx}
                  cx={svgPt.x}
                  cy={svgPt.y}
                  r="4"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Connecting line between placed points */}
            {draftingPoints.length > 1 && (
              <path
                d={pointsToSvgPath(draftingPoints.map(toSvg), false)}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}

            {/* Dynamic rubber-band line to cursor */}
            {currentCursorMine && draftingPoints.length > 0 && (
              <line
                x1={toSvg(draftingPoints[draftingPoints.length - 1]).x}
                y1={toSvg(draftingPoints[draftingPoints.length - 1]).y}
                x2={toSvg(currentCursorMine).x}
                y2={toSvg(currentCursorMine).y}
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            )}

            {/* Distance & Bearing HUD label along draft line */}
            {currentCursorMine && draftingPoints.length > 0 && (
              <g
                transform={`translate(${
                  (toSvg(draftingPoints[draftingPoints.length - 1]).x + toSvg(currentCursorMine).x) / 2 + 10
                }, ${
                  (toSvg(draftingPoints[draftingPoints.length - 1]).y + toSvg(currentCursorMine).y) / 2 - 10
                })`}
              >
                <rect x="-4" y="-12" width="130" height="20" rx="3" fill="#0f172a" opacity="0.85" />
                <text x="4" y="2" fill="#38bdf8" fontSize="10" fontFamily="monospace">
                  {formatDistance(calculateDistance(draftingPoints[draftingPoints.length - 1], currentCursorMine))} ·{' '}
                  {formatBearing(calculateBearing(draftingPoints[draftingPoints.length - 1], currentCursorMine))}
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================================================== */}
        {/* INTERACTIVE VERTEX EDITING HANDLES (ON SELECTED OBJECT) */}
        {/* ======================================================== */}
        {selectedPoints.length > 0 && activeTool === 'select' && (
          <g id="vertex-handles">
            {selectedPoints.map((pt, idx) => {
              const svgPt = toSvg(pt);
              return (
                <circle
                  key={idx}
                  cx={svgPt.x}
                  cy={svgPt.y}
                  r={5}
                  fill="#ffffff"
                  stroke="#0891b2"
                  strokeWidth="2"
                  className="cursor-move hover:scale-125 transition-transform"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggedVertexIndex(idx);
                  }}
                />
              );
            })}
          </g>
        )}

        {/* Snap Target Visual Marker */}
        {snapFeedback && (
          <g transform={`translate(${toSvg(snapFeedback.point).x}, ${toSvg(snapFeedback.point).y})`}>
            <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="2" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#10b981" strokeWidth="1.5" />
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#10b981" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
};
