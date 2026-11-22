import type { AuthUser } from '../types';

export type EntryScreenState = 'splash' | 'auth_gate' | 'app';

export interface EntryGateSnapshot {
  authChecked: boolean;
  authUser: AuthUser | null;
  splashDismissed: boolean;
}

/**
 * Pure state machine deciding whether to display:
 * - 'splash': while the startup presentation is running OR auth session check is still pending
 *             (prevents any flash of the login screen when the user is already authenticated).
 * - 'auth_gate': full-screen Login / Sign Up entry before entering the app when unauthenticated.
 * - 'app': main MOMENTUM workspace once authenticated (login page never shows up).
 */
export function resolveEntryScreenState(snapshot: EntryGateSnapshot): EntryScreenState {
  if (!snapshot.authChecked || !snapshot.splashDismissed) {
    return 'splash';
  }
  if (!snapshot.authUser) {
    return 'auth_gate';
  }
  return 'app';
}

/**
 * Ensures visiting `/login` or `/signup` while already authenticated
 * does not surface the auth modal over the dashboard.
 */
export function shouldAllowRouteAuthModal(
  authChecked: boolean,
  authUser: AuthUser | null,
  routeRequestedAuth: boolean
): boolean {
  if (!routeRequestedAuth) return false;
  if (!authChecked) return false;
  return authUser === null;
}

/**
 * Onboarding should only trigger once the user has actually entered the workspace.
 */
export function shouldTriggerOnboardingModal(params: {
  entryScreen: EntryScreenState;
  hasProfile: boolean;
  onboardingCompleted: boolean;
}): boolean {
  if (params.entryScreen !== 'app') return false;
  if (!params.hasProfile) return false;
  return !params.onboardingCompleted;
}

export function isAuthPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '').toLowerCase();
  return (
    normalized === '/login' ||
    normalized === '/signin' ||
    normalized === '/signup' ||
    normalized === '/register'
  );
}
