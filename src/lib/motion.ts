export const MOMENTUM_EASE = [0.22, 1, 0.36, 1] as const;

export const MOMENTUM_SPRING = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 32,
  mass: 0.85,
};

export const MOMENTUM_GENTLE_SPRING = {
  type: 'spring' as const,
  stiffness: 240,
  damping: 28,
  mass: 0.95,
};

export const MOMENTUM_MODAL_SPRING = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 30,
  mass: 0.9,
};

export const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

export const easeOutQuart = (t: number): number => {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  return 1 - Math.pow(1 - clamped, 4);
};

export const getStaggerDelay = (
  index: number,
  baseDelay = 0,
  step = 0.04,
  maxDelay = 0.34
): number => {
  const safeIndex = Math.max(0, Number.isFinite(index) ? Math.floor(index) : 0);
  const safeBase = Math.max(0, Number.isFinite(baseDelay) ? baseDelay : 0);
  const safeStep = Math.max(0, Number.isFinite(step) ? step : 0);
  const safeMax = Math.max(safeBase, Number.isFinite(maxDelay) ? maxDelay : safeBase);
  return Math.min(safeMax, Number((safeBase + safeIndex * safeStep).toFixed(4)));
};

export interface MomentumBarLevels {
  bars: [number, number, number];
  activeBars: 0 | 1 | 2 | 3;
  tierLabel: 'Idle' | 'Building' | 'Steady' | 'Peak';
}

/**
 * Maps overall progress (0-100) into the 3 ascending MOMENTUM bar proportions.
 * Bar 1 = Discipline foundation, Bar 2 = Focus cadence, Bar 3 = Peak ascent.
 */
export const getMomentumBarLevels = (progressPct: number): MomentumBarLevels => {
  const pct = clampProgress(progressPct);

  const bar1 = Math.round(32 + Math.min(1, pct / 35) * 20); // 32% -> 52%
  const bar2 = Math.round(28 + Math.min(1, Math.max(0, (pct - 15) / 55)) * 46); // 28% -> 74%
  const bar3 = Math.round(24 + Math.min(1, Math.max(0, (pct - 30) / 70)) * 76); // 24% -> 100%

  let activeBars: 0 | 1 | 2 | 3 = 0;
  let tierLabel: MomentumBarLevels['tierLabel'] = 'Idle';

  if (pct >= 72) {
    activeBars = 3;
    tierLabel = 'Peak';
  } else if (pct >= 36) {
    activeBars = 2;
    tierLabel = 'Steady';
  } else if (pct > 0) {
    activeBars = 1;
    tierLabel = 'Building';
  }

  return {
    bars: [bar1, bar2, bar3],
    activeBars,
    tierLabel,
  };
};
