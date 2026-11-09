import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMinePlanSchema, createMinePlanTemplate } from './aiAgentBridge';
import { DEMO_MINE_PLAN } from '../data/demoMinePlan';

test('validateMinePlanSchema accepts valid DEMO_MINE_PLAN', () => {
  const result = validateMinePlanSchema(DEMO_MINE_PLAN);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.ok(result.plan);
  assert.equal(result.plan?.metadata.mineName, 'WEBA MINE');
});

test('validateMinePlanSchema catches missing metadata', () => {
  const invalid = {
    gridOrigin: { x: 335400, y: 7801800 },
    tunnels: [],
  };
  const result = validateMinePlanSchema(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('metadata')));
});

test('validateMinePlanSchema catches tunnel with insufficient points', () => {
  const invalid = {
    metadata: { mineName: 'TEST', level: '100 mL' },
    gridOrigin: { x: 335400, y: 7801800 },
    tunnels: [
      {
        id: 't-1',
        name: 'Single Point Tunnel',
        points: [{ x: 335500, y: 7802000 }],
        width: 4.5,
      },
    ],
  };
  const result = validateMinePlanSchema(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('at least 2 coordinate points')));
});

test('createMinePlanTemplate generates room and pillar layout', () => {
  const rpPlan = createMinePlanTemplate('room_and_pillar');
  assert.equal(rpPlan.metadata.mineName, 'CENTRAL COAL & POTASH');
  assert.ok(rpPlan.tunnels.length >= 10);
  assert.ok(rpPlan.geologicalFeatures.length >= 1);
});
