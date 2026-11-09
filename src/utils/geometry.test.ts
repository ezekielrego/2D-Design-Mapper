import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistance,
  calculateBearing,
  formatBearing,
  formatDistance,
  mineToSvg,
  svgToMine,
  generateTunnelRibbon,
  snapPoint,
} from './geometry';

test('calculateDistance correctly computes 2D Euclidean distance', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 300, y: 400 };
  assert.equal(calculateDistance(p1, p2), 500);
});

test('calculateBearing returns surveying azimuth from North', () => {
  // Due North (+Y): dx = 0, dy = 100 -> 0°
  assert.equal(calculateBearing({ x: 0, y: 0 }, { x: 0, y: 100 }), 0);

  // Due East (+X): dx = 100, dy = 0 -> 90°
  assert.equal(calculateBearing({ x: 0, y: 0 }, { x: 100, y: 0 }), 90);

  // Due South (-Y): dx = 0, dy = -100 -> 180°
  assert.equal(calculateBearing({ x: 0, y: 0 }, { x: 0, y: -100 }), 180);

  // Due West (-X): dx = -100, dy = 0 -> 270°
  assert.equal(calculateBearing({ x: 0, y: 0 }, { x: -100, y: 0 }), 270);
});

test('formatBearing formats bearing degrees and quadrant', () => {
  assert.equal(formatBearing(0), '000° (N)');
  assert.equal(formatBearing(45), '045° (N-E)');
  assert.equal(formatBearing(90), '090° (E)');
  assert.equal(formatBearing(180), '180° (S)');
  assert.equal(formatBearing(315), '315° (N-W)');
});

test('formatDistance produces clean mining metric text', () => {
  assert.equal(formatDistance(4.5), '4.5 m');
  assert.equal(formatDistance(320), '320 m');
  assert.equal(formatDistance(2300), '2.3 km');
});

test('mineToSvg and svgToMine roundtrip is lossless', () => {
  const origin = { x: 335400, y: 7801800 };
  const gridW = 1000;
  const gridH = 800;
  const svgW = 1200;
  const svgH = 960;

  const originalMinePt = { x: 335950, y: 7802350 };
  const svgPt = mineToSvg(originalMinePt, origin, gridW, gridH, svgW, svgH);
  const roundtrip = svgToMine(svgPt, origin, gridW, gridH, svgW, svgH);

  assert.ok(Math.abs(roundtrip.x - originalMinePt.x) < 0.001);
  assert.ok(Math.abs(roundtrip.y - originalMinePt.y) < 0.001);
});

test('generateTunnelRibbon produces closed boundary for straight tunnel', () => {
  const centerline = [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
  ];
  const width = 4.5;
  const ribbon = generateTunnelRibbon(centerline, width);

  // 2 centerline points -> 4 ribbon points (2 left, 2 right reversed)
  assert.equal(ribbon.length, 4);

  // Check offset distance from centerline
  const halfWidth = width / 2;
  assert.equal(ribbon[0].y, 100 + halfWidth);
  assert.equal(ribbon[1].y, 100 + halfWidth);
  assert.equal(ribbon[2].y, 100 - halfWidth);
  assert.equal(ribbon[3].y, 100 - halfWidth);
});

test('snapPoint snaps to closest survey station', () => {
  const rawPt = { x: 335602, y: 7802198 };
  const stations = [
    {
      id: 'stn-1',
      name: 'STN-210-01',
      easting: 335600,
      northing: 7802200,
      elevationRL: 210,
      type: 'instrument' as const,
      status: 'verified' as const,
      accuracyClass: 'Class B (1:15,000)' as const,
    },
  ];

  const result = snapPoint(
    rawPt,
    {
      snapToGrid: false,
      gridSnapSize: 20,
      snapToStations: true,
      snapToEndpoints: false,
      orthoConstraint: false,
    },
    { stations, snapRadius: 10 }
  );

  assert.equal(result.snappedType, 'station');
  assert.equal(result.point.x, 335600);
  assert.equal(result.point.y, 7802200);
});

test('snapPoint snaps to grid', () => {
  const rawPt = { x: 335408, y: 7801819 };
  const result = snapPoint(
    rawPt,
    {
      snapToGrid: true,
      gridSnapSize: 20,
      snapToStations: false,
      snapToEndpoints: false,
      orthoConstraint: false,
    },
    { origin: { x: 335400, y: 7801800 }, snapRadius: 15 }
  );

  assert.equal(result.snappedType, 'grid');
  assert.equal(result.point.x, 335400);
  assert.equal(result.point.y, 7801820);
});
