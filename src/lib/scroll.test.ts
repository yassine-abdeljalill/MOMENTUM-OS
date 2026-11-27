import test from 'node:test';
import assert from 'node:assert/strict';
import { SCROLL_TO_TOP_THRESHOLD_PX, shouldShowScrollToTop } from './scroll';

test('shouldShowScrollToTop requires scrolling strictly more than 200px', () => {
  assert.equal(SCROLL_TO_TOP_THRESHOLD_PX, 200);
  assert.equal(shouldShowScrollToTop(0), false);
  assert.equal(shouldShowScrollToTop(199), false);
  assert.equal(shouldShowScrollToTop(200), false);
  assert.equal(shouldShowScrollToTop(200.5), true);
  assert.equal(shouldShowScrollToTop(201), true);
  assert.equal(shouldShowScrollToTop(1200), true);
});

test('shouldShowScrollToTop safely handles invalid numbers', () => {
  assert.equal(shouldShowScrollToTop(-10), false);
  assert.equal(shouldShowScrollToTop(Number.NaN), false);
  assert.equal(shouldShowScrollToTop(Number.POSITIVE_INFINITY), false);
});
