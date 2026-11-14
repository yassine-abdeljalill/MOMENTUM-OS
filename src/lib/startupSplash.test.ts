import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeRemainingSplashDelayMs,
  DEFAULT_SPLASH_MIN_DURATION_MS,
  isWorkspaceInitializationReady,
  shouldBypassStartupSplash,
} from './startupSplash.ts';

describe('startupSplash logic', () => {
  it('bypasses splash when autostart=1 query param is present', () => {
    assert.equal(shouldBypassStartupSplash('?autostart=1'), true);
    assert.equal(shouldBypassStartupSplash('?view=tasks&autostart=1'), true);
    assert.equal(shouldBypassStartupSplash('?autostart=0'), false);
    assert.equal(shouldBypassStartupSplash(''), false);
  });

  it('stays unready while auth check is still pending', () => {
    assert.equal(
      isWorkspaceInitializationReady({
        authChecked: false,
        hasAuthUser: false,
        hasLearningData: false,
        hasLearningError: false,
        timedOut: false,
      }),
      false
    );
  });

  it('becomes ready immediately once authChecked is true and no user is signed in', () => {
    assert.equal(
      isWorkspaceInitializationReady({
        authChecked: true,
        hasAuthUser: false,
        hasLearningData: false,
        hasLearningError: false,
        timedOut: false,
      }),
      true
    );
  });

  it('waits for authenticated user learning bootstrap data or error before becoming ready', () => {
    assert.equal(
      isWorkspaceInitializationReady({
        authChecked: true,
        hasAuthUser: true,
        hasLearningData: false,
        hasLearningError: false,
        timedOut: false,
      }),
      false
    );

    assert.equal(
      isWorkspaceInitializationReady({
        authChecked: true,
        hasAuthUser: true,
        hasLearningData: true,
        hasLearningError: false,
        timedOut: false,
      }),
      true
    );

    assert.equal(
      isWorkspaceInitializationReady({
        authChecked: true,
        hasAuthUser: true,
        hasLearningData: false,
        hasLearningError: true,
        timedOut: false,
      }),
      true
    );
  });

  it('respects failsafe timeout even if API initialization hangs', () => {
    assert.equal(
      isWorkspaceInitializationReady({
        authChecked: false,
        hasAuthUser: false,
        hasLearningData: false,
        hasLearningError: false,
        timedOut: true,
      }),
      true
    );
  });

  it('computes minimum entrance floor delay cleanly and skips delay for reduced motion', () => {
    assert.equal(
      computeRemainingSplashDelayMs(1000, 1150, DEFAULT_SPLASH_MIN_DURATION_MS, false),
      DEFAULT_SPLASH_MIN_DURATION_MS - 150
    );
    assert.equal(
      computeRemainingSplashDelayMs(1000, 1900, DEFAULT_SPLASH_MIN_DURATION_MS, false),
      0
    );
    assert.equal(
      computeRemainingSplashDelayMs(1000, 1050, DEFAULT_SPLASH_MIN_DURATION_MS, true),
      0
    );
  });
});
