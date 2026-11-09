/**
 * AI Agent Integration Bridge & Schema Validator
 * 
 * Allows other AI agents to programmatically generate, validate, and render
 * underground mine mapping plans.
 */

import { MinePlan, Tunnel, GeologicalFeature, SurveyStation } from '../types/mine';
import { DEMO_MINE_PLAN } from '../data/demoMinePlan';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  plan?: MinePlan;
}

/**
 * Validates a MinePlan JSON structure submitted by an AI agent or external file.
 */
export function validateMinePlanSchema(input: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Input must be a valid JSON object.'], warnings: [] };
  }

  const data = input as Partial<MinePlan>;

  // Check Metadata
  if (!data.metadata) {
    errors.push('Missing required "metadata" object.');
  } else {
    if (!data.metadata.mineName) errors.push('Metadata is missing "mineName".');
    if (!data.metadata.level) errors.push('Metadata is missing "level" (e.g. "210 mL").');
    if (!data.metadata.planType) warnings.push('Metadata missing "planType"; defaulting to "Underground Development".');
  }

  // Check Grid Bounds
  if (!data.gridOrigin || typeof data.gridOrigin.x !== 'number' || typeof data.gridOrigin.y !== 'number') {
    errors.push('Missing or invalid "gridOrigin" { x: number, y: number } in mine coordinates.');
  }

  if (typeof data.gridWidth !== 'number' || data.gridWidth <= 0) {
    warnings.push('gridWidth missing or invalid; defaulting to 1000m.');
  }

  if (typeof data.gridHeight !== 'number' || data.gridHeight <= 0) {
    warnings.push('gridHeight missing or invalid; defaulting to 800m.');
  }

  // Check Tunnels
  if (!Array.isArray(data.tunnels)) {
    errors.push('Missing "tunnels" array.');
  } else {
    data.tunnels.forEach((t: any, idx: number) => {
      if (!t.id) errors.push(`Tunnel at index ${idx} is missing an "id".`);
      if (!t.name) warnings.push(`Tunnel at index ${idx} is missing a "name".`);
      if (!Array.isArray(t.points) || t.points.length < 2) {
        errors.push(`Tunnel "${t.name || idx}" must have at least 2 coordinate points.`);
      } else {
        t.points.forEach((pt: any, ptIdx: number) => {
          if (typeof pt.x !== 'number' || typeof pt.y !== 'number') {
            errors.push(`Tunnel "${t.name}" point #${ptIdx + 1} has invalid (x, y) coordinates.`);
          }
        });
      }
    });
  }

  // Ensure default layers if missing
  const defaultLayers = {
    excavations: { visible: true, locked: false, opacity: 1 },
    geology: { visible: true, locked: false, opacity: 0.95 },
    ventilationUtilities: { visible: true, locked: false, opacity: 1 },
    symbols: { visible: true, locked: false, opacity: 1 },
    annotations: { visible: true, locked: false, opacity: 1 },
    surveyGrid: { visible: true, locked: false, opacity: 1 },
    crossSection: { visible: true, locked: false, opacity: 1 },
  };

  const normalizedPlan: MinePlan = {
    metadata: {
      mineName: data.metadata?.mineName || 'NEW UNDERGROUND MINE',
      title: data.metadata?.title || 'Underground Development Plan',
      level: data.metadata?.level || '100 mL',
      planType: data.metadata?.planType || 'Development & Stoping',
      datum: data.metadata?.datum || 'Mine Grid (Local)',
      scaleText: data.metadata?.scaleText || '1 : 2 000',
      scaleRatio: data.metadata?.scaleRatio || 2000,
      date: data.metadata?.date || new Date().toISOString().split('T')[0],
      revision: data.metadata?.revision || '0',
      drawnBy: data.metadata?.drawnBy || 'AI Surveyor',
      checkedBy: data.metadata?.checkedBy || 'Chief Mining Engineer',
      project: data.metadata?.project || 'Mine Planning & Digital Twin',
      isSurveyCalibrated: Boolean(data.metadata?.isSurveyCalibrated),
      calibrationNotes: data.metadata?.calibrationNotes || 'Generated via AI CAD agent interface.',
    },
    layers: { ...defaultLayers, ...data.layers },
    gridOrigin: data.gridOrigin || { x: 335400, y: 7801800 },
    gridWidth: data.gridWidth || 1000,
    gridHeight: data.gridHeight || 800,
    gridSpacing: data.gridSpacing || 200,
    tunnels: data.tunnels || [],
    geologicalFeatures: data.geologicalFeatures || [],
    ventilationUtilities: data.ventilationUtilities || [],
    symbols: data.symbols || [],
    annotations: data.annotations || [],
    surveyStations: data.surveyStations || [],
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    plan: errors.length === 0 ? normalizedPlan : undefined,
  };
}

/**
 * Pre-built template generators for AI agents
 */
export function createMinePlanTemplate(type: 'room_and_pillar' | 'sublevel_stoping' | 'blank'): MinePlan {
  if (type === 'blank') {
    return {
      ...DEMO_MINE_PLAN,
      metadata: {
        ...DEMO_MINE_PLAN.metadata,
        mineName: 'CUSTOM MINE',
        title: 'New Underground Plan',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        revision: '0',
      },
      tunnels: [],
      geologicalFeatures: [],
      ventilationUtilities: [],
      symbols: [],
      annotations: [],
      surveyStations: [],
    };
  }

  if (type === 'room_and_pillar') {
    // Generate standard Room & Pillar coal / potash / limestone layout
    const origin = { x: 335400, y: 7801800 };
    const tunnels: Tunnel[] = [];
    const pillarWidth = 25;
    const roomWidth = 5.0;

    // 5 Mains
    for (let r = 0; r < 5; r++) {
      const y = origin.y + 300 + r * (pillarWidth + roomWidth);
      tunnels.push({
        id: `main-entry-${r}`,
        name: `Entry #${r + 1}`,
        type: 'drive',
        points: [
          { x: origin.x + 100, y },
          { x: origin.x + 850, y },
        ],
        width: roomWidth,
        profile: 'rectangular',
        grade: 'Flat',
        status: 'developed',
        isSurveyed: true,
      });
    }

    // Crosscuts every 30m
    for (let c = 0; c < 10; c++) {
      const x = origin.x + 200 + c * (pillarWidth + roomWidth);
      tunnels.push({
        id: `crosscut-${c}`,
        name: `Breakthrough XC #${c + 1}`,
        type: 'crosscut',
        points: [
          { x, y: origin.y + 300 },
          { x, y: origin.y + 300 + 4 * (pillarWidth + roomWidth) },
        ],
        width: roomWidth,
        profile: 'rectangular',
        grade: 'Flat',
        status: 'developed',
        isSurveyed: true,
      });
    }

    return {
      ...DEMO_MINE_PLAN,
      metadata: {
        ...DEMO_MINE_PLAN.metadata,
        mineName: 'CENTRAL COAL & POTASH',
        title: 'Room & Pillar Panel Layout',
        level: '140 mL',
        planType: 'Continuous Miner Extraction',
        scaleText: '1 : 2 000',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        revision: '1',
      },
      tunnels,
      geologicalFeatures: [
        {
          id: 'geo-coal-seam',
          name: 'Seam #4 (Bituminous Coal)',
          type: 'ore_body',
          points: [
            { x: origin.x + 80, y: origin.y + 260 },
            { x: origin.x + 880, y: origin.y + 260 },
            { x: origin.x + 880, y: origin.y + 550 },
            { x: origin.x + 80, y: origin.y + 550 },
          ],
          fillPattern: 'stipple_ore',
          fillColor: '#f1f5f9',
          strokeColor: '#0f172a',
          strokeWidth: 1.5,
          opacity: 0.8,
          isSurveyed: true,
        },
      ],
      symbols: [
        {
          id: 'sym-refuge-rp',
          name: 'Permanent Refuge Bay',
          type: 'refuge_chamber',
          position: { x: origin.x + 180, y: origin.y + 360 },
          rotation: 0,
          scale: 1.2,
          label: 'Refuge Chamber (30-Person)',
          isSurveyed: true,
        },
      ],
      annotations: [
        {
          id: 'ann-rp-panel',
          text: 'Panel A-1\nRoom & Pillar Extraction\n(Pillar Safety Factor: 1.85)',
          position: { x: origin.x + 500, y: origin.y + 500 },
          style: 'callout',
          fontSize: 12,
          isSurveyed: true,
        },
      ],
    };
  }

  // Default: Sublevel stoping demo
  return DEMO_MINE_PLAN;
}
