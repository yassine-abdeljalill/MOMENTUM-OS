export const DEFAULT_SPLASH_MIN_DURATION_MS = 650;
export const DEFAULT_SPLASH_FAILSAFE_MS = 3800;

export interface WorkspaceInitializationSnapshot {
  authChecked: boolean;
  hasAuthUser: boolean;
  hasLearningData: boolean;
  hasLearningError: boolean;
  timedOut: boolean;
}

/**
 * Allows automated end-to-end tests or deep-links with `?autostart=1`
 * to skip the startup splash overlay cleanly.
 */
export function shouldBypassStartupSplash(search: string): boolean {
  if (!search) return false;
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  return params.get('autostart') === '1';
}

/**
 * Determines whether the real application workspace has finished initializing
 * (or hit the safety failsafe timeout so the user can never get stuck).
 */
export function isWorkspaceInitializationReady(
  snapshot: WorkspaceInitializationSnapshot
): boolean {
  if (snapshot.timedOut) return true;
  if (!snapshot.authChecked) return false;
  if (!snapshot.hasAuthUser) return true;
  return snapshot.hasLearningData || snapshot.hasLearningError;
}

/**
 * Computes how long (in ms) the splash should still remain visible after
 * initialization settles so the entrance animation completes smoothly
 * without an abrupt 1-frame flicker or excessive artificial delay.
 */
export function computeRemainingSplashDelayMs(
  mountedAtMs: number,
  nowMs: number,
  minDurationMs: number = DEFAULT_SPLASH_MIN_DURATION_MS,
  reducedMotion: boolean = false
): number {
  if (reducedMotion) return 0;
  const elapsed = Math.max(0, nowMs - mountedAtMs);
  return Math.max(0, minDurationMs - elapsed);
}
