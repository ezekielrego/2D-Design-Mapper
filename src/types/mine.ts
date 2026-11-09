/**
 * Mine Mapping CAD Types & Data Model
 * Distinguishes surveyed vs illustrative geometry and defines all mining entities.
 */

export interface Point2D {
  x: number; // Mine Easting (or canvas X in meters)
  y: number; // Mine Northing (or canvas Y in meters)
}

export type TunnelType =
  | 'decline'
  | 'drive'
  | 'crosscut'
  | 'shaft'
  | 'raise'
  | 'winze'
  | 'haulage'
  | 'ramp';

export type TunnelProfile = 'arch' | 'horseshoe' | 'rectangular';

export type TunnelStatus = 'developed' | 'active_face' | 'planned' | 'abandoned';

export interface Tunnel {
  id: string;
  name: string;
  type: TunnelType;
  points: Point2D[];
  width: number; // in meters (e.g., 4.5, 4.0)
  profile: TunnelProfile;
  grade?: string; // e.g. "1:7 (8.1°)", "1:50", "Flat"
  status: TunnelStatus;
  isSurveyed: boolean; // Critical requirement: surveyed vs illustrative
  notes?: string;
  wallColor?: string;
  fillColor?: string;
}

export type GeologyType =
  | 'ore_body'
  | 'stope_mined'
  | 'stope_planned'
  | 'fault'
  | 'backfill'
  | 'shear_zone'
  | 'geological_boundary';

export type HatchPattern =
  | 'diagonal_red'
  | 'diagonal_dense'
  | 'crosshatch'
  | 'stipple_ore'
  | 'triangles_gravel'
  | 'solid_tint'
  | 'none';

export interface GeologicalFeature {
  id: string;
  name: string;
  type: GeologyType;
  points: Point2D[];
  fillPattern: HatchPattern;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
  isSurveyed: boolean;
  notes?: string;
}

export type UtilityType =
  | 'fresh_air'
  | 'return_air'
  | 'electrical_cable'
  | 'water_pipe'
  | 'compressed_air'
  | 'vent_duct';

export interface VentilationUtility {
  id: string;
  name: string;
  type: UtilityType;
  points: Point2D[];
  color: string;
  width: number;
  dashPattern?: string;
  hasArrows?: boolean;
  flowDirection?: 'forward' | 'reverse' | 'none';
  specification?: string; // e.g. "11 kV", "DN150", "65 m³/s"
  isSurveyed: boolean;
}

export type SymbolType =
  | 'vent_arrow_fresh'
  | 'vent_arrow_return'
  | 'refuge_chamber'
  | 'pump_station'
  | 'sump'
  | 'ore_pass'
  | 'hazard'
  | 'poi_circle'
  | 'gas_monitor'
  | 'survey_peg'
  | 'vent_door'
  | 'substation';

export interface MapSymbol {
  id: string;
  name: string;
  type: SymbolType;
  position: Point2D;
  rotation: number; // in degrees
  scale: number;
  label?: string;
  description?: string;
  isSurveyed: boolean;
}

export type AnnotationStyle = 'callout' | 'technical' | 'dimension' | 'station';

export interface MapAnnotation {
  id: string;
  text: string;
  position: Point2D;
  target?: Point2D; // Leader line destination
  style: AnnotationStyle;
  fontSize: number;
  angle?: number;
  dimensionValue?: string;
  isSurveyed: boolean;
}

export type StationType = 'instrument' | 'backsight' | 'wall_peg' | 'grade_peg' | 'benchmark';

export interface SurveyStation {
  id: string;
  name: string;
  easting: number;
  northing: number;
  elevationRL: number; // Relative Level in meters (e.g. 210.00)
  type: StationType;
  status: 'verified' | 'uncalibrated' | 'pending';
  accuracyClass: 'Class A (1:25,000)' | 'Class B (1:15,000)' | 'Draft';
  notes?: string;
}

export interface LayerState {
  visible: boolean;
  locked: boolean;
  opacity: number;
}

export interface MapLayers {
  excavations: LayerState;
  geology: LayerState;
  ventilationUtilities: LayerState;
  symbols: LayerState;
  annotations: LayerState;
  surveyGrid: LayerState;
  crossSection: LayerState;
}

export interface PlanMetadata {
  mineName: string;
  title: string;
  level: string; // e.g. "210 mL"
  planType: string; // e.g. "Development & Stoping"
  datum: string; // e.g. "Mine Grid (Local)"
  scaleText: string; // e.g. "1 : 2 000"
  scaleRatio: number; // 2000
  date: string;
  revision: string;
  drawnBy: string;
  checkedBy: string;
  approvedBy?: string;
  project: string;
  isSurveyCalibrated: boolean;
  calibrationNotes: string;
}

export interface ElementLayout {
  x: number;
  y: number;
  scale: number;
  visible: boolean;
}

export interface MapLayoutConfig {
  titleBlockTopLeft?: ElementLayout;
  titleBlockBottomRight?: ElementLayout;
  legend?: ElementLayout;
  crossSection?: ElementLayout;
  northArrow?: ElementLayout;
  scaleBar?: ElementLayout;
  showCoordinateGrid?: boolean;
  coordinateGridSpacing?: number;
}

export interface MinePlan {
  metadata: PlanMetadata;
  layers: MapLayers;
  layout?: MapLayoutConfig; // Customizable positions, scales, and visibility
  gridOrigin: Point2D; // Easting & Northing at bottom-left corner of sheet
  gridWidth: number;   // Grid width in mine meters (e.g. 1000m)
  gridHeight: number;  // Grid height in mine meters (e.g. 800m)
  gridSpacing: number; // Grid interval in mine meters (e.g. 200m)
  tunnels: Tunnel[];
  geologicalFeatures: GeologicalFeature[];
  ventilationUtilities: VentilationUtility[];
  symbols: MapSymbol[];
  annotations: MapAnnotation[];
  surveyStations: SurveyStation[];
}

export type ActiveTool =
  | 'select'
  | 'pan'
  | 'draw_tunnel'
  | 'draw_geology'
  | 'draw_utility'
  | 'place_symbol'
  | 'add_annotation'
  | 'measure_dimension';

export interface SnapSettings {
  snapToGrid: boolean;
  gridSnapSize: number; // in meters (e.g. 10, 20)
  snapToStations: boolean;
  snapToEndpoints: boolean;
  orthoConstraint: boolean; // Shift key constraint
}
