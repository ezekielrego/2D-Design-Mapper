/**
 * Geometry & Survey Math Utilities for 2D Underground Mine Mapping
 */

import { Point2D, SnapSettings, SurveyStation, Tunnel } from '../types/mine';

/**
 * Standard Euclidean distance between two 2D points in meters.
 */
export function calculateDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate surveying azimuth (bearing from Grid North) in degrees: [0, 360)
 * 0° = North (+Y), 90° = East (+X), 180° = South (-Y), 270° = West (-X)
 */
export function calculateBearing(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  let angle = Math.atan2(dx, dy) * (180 / Math.PI);
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

/**
 * Format azimuth as a human-readable mining bearing string (e.g. "045°" or "315° N-W")
 */
export function formatBearing(degrees: number): string {
  const normalized = (degrees % 360 + 360) % 360;
  const degRound = Math.round(normalized);
  const pad = degRound.toString().padStart(3, '0');
  
  let quadrant = 'N';
  if (degRound > 10 && degRound < 80) quadrant = 'N-E';
  else if (degRound >= 80 && degRound <= 100) quadrant = 'E';
  else if (degRound > 100 && degRound < 170) quadrant = 'S-E';
  else if (degRound >= 170 && degRound <= 190) quadrant = 'S';
  else if (degRound > 190 && degRound < 260) quadrant = 'S-W';
  else if (degRound >= 260 && degRound <= 280) quadrant = 'W';
  else if (degRound > 280 && degRound < 350) quadrant = 'N-W';

  return `${pad}° (${quadrant})`;
}

/**
 * Format distance in mining notation (e.g. "4.5 m", "320 m", "2.3 km")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters * 10) / 10} m`;
}

/**
 * Convert Mine Coordinates (Easting, Northing) to Canvas SVG Coordinates (X, Y).
 * In mine grid, Northing increases upwards (+Y), while in SVG Y increases downwards (+Y).
 */
export function mineToSvg(
  point: Point2D,
  origin: Point2D,
  viewWidthMeters: number,
  viewHeightMeters: number,
  svgWidth: number,
  svgHeight: number
): Point2D {
  const relX = (point.x - origin.x) / viewWidthMeters;
  const relY = (point.y - origin.y) / viewHeightMeters;

  return {
    x: relX * svgWidth,
    y: svgHeight - relY * svgHeight,
  };
}

/**
 * Convert Canvas SVG Coordinates (X, Y) to Mine Coordinates (Easting, Northing).
 */
export function svgToMine(
  svgPoint: Point2D,
  origin: Point2D,
  viewWidthMeters: number,
  viewHeightMeters: number,
  svgWidth: number,
  svgHeight: number
): Point2D {
  const relX = svgPoint.x / svgWidth;
  const relY = (svgHeight - svgPoint.y) / svgHeight;

  return {
    x: origin.x + relX * viewWidthMeters,
    y: origin.y + relY * viewHeightMeters,
  };
}

/**
 * Generate 2D ribbon polygon boundary for an underground tunnel from its centerline points.
 * Returns an array of boundary points traversing one side then returning along the other side.
 */
export function generateTunnelRibbon(centerline: Point2D[], width: number): Point2D[] {
  if (centerline.length < 2) return [];

  const halfWidth = width / 2;
  const leftPoints: Point2D[] = [];
  const rightPoints: Point2D[] = [];

  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i];
    let normalX = 0;
    let normalY = 0;

    if (i === 0) {
      // First segment direction
      const next = centerline[i + 1];
      const dx = next.x - p.x;
      const dy = next.y - p.y;
      const len = Math.hypot(dx, dy) || 1;
      normalX = -dy / len;
      normalY = dx / len;
    } else if (i === centerline.length - 1) {
      // Last segment direction
      const prev = centerline[i - 1];
      const dx = p.x - prev.x;
      const dy = p.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      normalX = -dy / len;
      normalY = dx / len;
    } else {
      // Average normal of adjacent segments
      const prev = centerline[i - 1];
      const next = centerline[i + 1];
      const dx1 = p.x - prev.x;
      const dy1 = p.y - prev.y;
      const len1 = Math.hypot(dx1, dy1) || 1;
      const nx1 = -dy1 / len1;
      const ny1 = dx1 / len1;

      const dx2 = next.x - p.x;
      const dy2 = next.y - p.y;
      const len2 = Math.hypot(dx2, dy2) || 1;
      const nx2 = -dy2 / len2;
      const ny2 = dx2 / len2;

      let mx = nx1 + nx2;
      let my = ny1 + ny2;
      const mLen = Math.hypot(mx, my);
      if (mLen > 0.0001) {
        // Miter scale factor to avoid excessive spikes on sharp turns
        const dot = nx1 * nx2 + ny1 * ny2;
        const miterLimit = 2.0;
        const scale = Math.min(Math.SQRT2 / Math.sqrt(Math.max(0.1, 1 + dot)), miterLimit);
        normalX = (mx / mLen) * scale;
        normalY = (my / mLen) * scale;
      } else {
        normalX = nx1;
        normalY = ny1;
      }
    }

    leftPoints.push({
      x: p.x + normalX * halfWidth,
      y: p.y + normalY * halfWidth,
    });
    rightPoints.push({
      x: p.x - normalX * halfWidth,
      y: p.y - normalY * halfWidth,
    });
  }

  // Combine: left side forward, right side backward to form a closed ribbon polygon
  return [...leftPoints, ...rightPoints.reverse()];
}

/**
 * Convert an array of Point2D to SVG path data "d" attribute.
 */
export function pointsToSvgPath(points: Point2D[], closed = true): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (const pt of rest) {
    d += ` L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
  }
  if (closed) {
    d += ' Z';
  }
  return d;
}

/**
 * Snapping engine for mine drafting.
 * Checks for grid snap, survey stations, existing tunnel nodes, and ortho constraints.
 */
export function snapPoint(
  rawPoint: Point2D,
  settings: SnapSettings,
  context?: {
    stations?: SurveyStation[];
    tunnels?: Tunnel[];
    anchorPoint?: Point2D | null; // For ortho snapping
    origin?: Point2D;
    snapRadius?: number; // In meters
  }
): { point: Point2D; snappedType?: 'grid' | 'station' | 'vertex' | 'ortho'; label?: string } {
  const snapRadius = context?.snapRadius ?? 15; // default 15m tolerance
  let snapped = { ...rawPoint };

  // 1. Check survey stations (highest priority for accurate mine plans)
  if (settings.snapToStations && context?.stations) {
    for (const stn of context.stations) {
      const dist = calculateDistance(rawPoint, { x: stn.easting, y: stn.northing });
      if (dist <= snapRadius) {
        return {
          point: { x: stn.easting, y: stn.northing },
          snappedType: 'station',
          label: `Station: ${stn.name}`,
        };
      }
    }
  }

  // 2. Check existing tunnel vertices & endpoints
  if (settings.snapToEndpoints && context?.tunnels) {
    let closestDist = Infinity;
    let closestVertex: Point2D | null = null;
    let tunnelName = '';

    for (const tunnel of context.tunnels) {
      for (const pt of tunnel.points) {
        const d = calculateDistance(rawPoint, pt);
        if (d <= snapRadius && d < closestDist) {
          closestDist = d;
          closestVertex = pt;
          tunnelName = tunnel.name;
        }
      }
    }

    if (closestVertex) {
      return {
        point: closestVertex,
        snappedType: 'vertex',
        label: `Snap: ${tunnelName}`,
      };
    }
  }

  // 3. Orthogonal constraint if an anchor exists (e.g. holding Shift)
  if (settings.orthoConstraint && context?.anchorPoint) {
    const anchor = context.anchorPoint;
    const dx = rawPoint.x - anchor.x;
    const dy = rawPoint.y - anchor.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);

    // Snap to nearest 45 degree angle (0, 45, 90, 135, 180, -135, -90, -45)
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    snapped = {
      x: anchor.x + dist * Math.cos(snapAngle),
      y: anchor.y + dist * Math.sin(snapAngle),
    };
    return {
      point: snapped,
      snappedType: 'ortho',
      label: 'Ortho (45°)',
    };
  }

  // 4. Snap to mine coordinate grid
  if (settings.snapToGrid && settings.gridSnapSize > 0) {
    const originX = context?.origin?.x ?? 0;
    const originY = context?.origin?.y ?? 0;
    const gridSize = settings.gridSnapSize;

    const snappedX = Math.round((rawPoint.x - originX) / gridSize) * gridSize + originX;
    const snappedY = Math.round((rawPoint.y - originY) / gridSize) * gridSize + originY;

    if (calculateDistance(rawPoint, { x: snappedX, y: snappedY }) <= snapRadius) {
      return {
        point: { x: snappedX, y: snappedY },
        snappedType: 'grid',
        label: `Grid ${gridSize}m`,
      };
    }
  }

  return { point: snapped };
}
