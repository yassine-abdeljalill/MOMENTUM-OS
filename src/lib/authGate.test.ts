import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAuthPath,
  resolveEntryScreenState,
  shouldAllowRouteAuthModal,
  shouldTriggerOnboardingModal,
} from './authGate.ts';
import type { AuthUser } from '../types';

const REGISTERED_USER: AuthUser = {
  id: 'usr_1',
  email: 'alex@momentum.app',
  fullName: 'Alex Vance',
  isWorkspace: false,
  createdAt: '2026-11-01T00:00:00.000Z',
};

describe('authGate decision logic', () => {
  it('stays on splash while auth check is still pending even if splashDismissed is toggled', () => {
    assert.equal(
      resolveEntryScreenState({
        authChecked: false,
        authUser: null,
        splashDismissed: false,
      }),
      'splash'
    );
    assert.equal(
      resolveEntryScreenState({
        authChecked: false,
        authUser: null,
        splashDismissed: true,
      }),
      'splash'
    );
  });

  it('stays on splash while creative loading presentation is active, even when already logged in', () => {
    assert.equal(
      resolveEntryScreenState({
        authChecked: true,
        authUser: REGISTERED_USER,
        splashDismissed: false,
      }),
      'splash'
    );
  });

  it('shows pre-app auth_gate when unauthenticated after startup splash finishes', () => {
    assert.equal(
      resolveEntryScreenState({
        authChecked: true,
        authUser: null,
        splashDismissed: true,
      }),
      'auth_gate'
    );
  });

  it('enters app directly and never shows auth_gate once a user session exists', () => {
    assert.equal(
      resolveEntryScreenState({
        authChecked: true,
        authUser: REGISTERED_USER,
        splashDismissed: true,
      }),
      'app'
    );
  });

  it('never opens route-triggered auth modal if user is already logged in', () => {
    assert.equal(shouldAllowRouteAuthModal(false, null, true), false);
    assert.equal(shouldAllowRouteAuthModal(true, REGISTERED_USER, true), false);
    assert.equal(shouldAllowRouteAuthModal(true, null, true), true);
    assert.equal(shouldAllowRouteAuthModal(true, null, false), false);
  });

  it('prevents OnboardingModal from appearing behind splash or auth_gate', () => {
    assert.equal(
      shouldTriggerOnboardingModal({
        entryScreen: 'splash',
        hasProfile: true,
        onboardingCompleted: false,
      }),
      false
    );
    assert.equal(
      shouldTriggerOnboardingModal({
        entryScreen: 'auth_gate',
        hasProfile: true,
        onboardingCompleted: false,
      }),
      false
    );
    assert.equal(
      shouldTriggerOnboardingModal({
        entryScreen: 'app',
        hasProfile: true,
        onboardingCompleted: false,
      }),
      true
    );
    assert.equal(
      shouldTriggerOnboardingModal({
        entryScreen: 'app',
        hasProfile: true,
        onboardingCompleted: true,
      }),
      false
    );
  });

  it('detects auth-specific URL paths accurately', () => {
    assert.equal(isAuthPath('/login'), true);
    assert.equal(isAuthPath('/signin/'), true);
    assert.equal(isAuthPath('/signup'), true);
    assert.equal(isAuthPath('/register'), true);
    assert.equal(isAuthPath('/overview'), false);
    assert.equal(isAuthPath('/'), false);
  });
});
