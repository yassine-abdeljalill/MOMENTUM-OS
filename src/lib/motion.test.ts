import test from 'node:test';
import assert from 'node:assert/strict';
import { clampProgress, getMomentumBarLevels, getStaggerDelay } from './motion';

test('clampProgress clamps values cleanly to 0..100', () => {
  assert.equal(clampProgress(-15), 0);
  assert.equal(clampProgress(0), 0);
  assert.equal(clampProgress(64.5), 64.5);
  assert.equal(clampProgress(140), 100);
  assert.equal(clampProgress(Number.NaN), 0);
});

test('getStaggerDelay increments monotonically and caps at maxDelay', () => {
  assert.equal(getStaggerDelay(0, 0.02, 0.04, 0.25), 0.02);
  assert.equal(getStaggerDelay(3, 0.02, 0.04, 0.25), 0.14);
  assert.equal(getStaggerDelay(20, 0.02, 0.04, 0.25), 0.25);
  assert.equal(getStaggerDelay(-2, 0.02, 0.04, 0.25), 0.02);
});

test('getMomentumBarLevels produces ascending bar levels aligned with progress tiers', () => {
  const idle = getMomentumBarLevels(0);
  assert.equal(idle.activeBars, 0);
  assert.equal(idle.tierLabel, 'Idle');
  assert.deepEqual(idle.bars, [32, 28, 24]);

  const building = getMomentumBarLevels(25);
  assert.equal(building.activeBars, 1);
  assert.equal(building.tierLabel, 'Building');

  const steady = getMomentumBarLevels(55);
  assert.equal(steady.activeBars, 2);
  assert.equal(steady.tierLabel, 'Steady');

  const peak = getMomentumBarLevels(100);
  assert.equal(peak.activeBars, 3);
  assert.equal(peak.tierLabel, 'Peak');
  assert.deepEqual(peak.bars, [52, 74, 100]);
  assert.ok(peak.bars[0] < peak.bars[1] && peak.bars[1] < peak.bars[2]);
});
