import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import {
  CREATIVE_SPLASH_MIN_DURATION_MS,
  DEFAULT_SPLASH_FAILSAFE_MS,
  computeRemainingSplashDelayMs,
  getStartupPhaseInfo,
  getStartupProgressPercent,
  isWorkspaceInitializationReady,
} from '../../lib/startupSplash';
import { MOMENTUM_EASE } from './MotionPrimitives';

const PILLARS = ['Priorities', 'Calendar', 'Learning', 'Vitality'] as const;

export const IntroSplash: React.FC = () => {
  const {
    authChecked,
    authUser,
    learningData,
    learningError,
    splashDismissed,
    dismissSplash,
  } = useApp();

  const prefersReduced = Boolean(useReducedMotion());
  const mountedAtRef = useRef<number>(Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const visible = !splashDismissed && (!authChecked || true);
  // Keep visible until both auth check completes AND splash is dismissed (or failsafe timeout hits)
  const shouldShow = !splashDismissed || (!authChecked && !timedOut);

  useEffect(() => {
    if (!shouldShow) return;
    const failsafeTimer = window.setTimeout(() => {
      setTimedOut(true);
    }, DEFAULT_SPLASH_FAILSAFE_MS);
    return () => window.clearTimeout(failsafeTimer);
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismissSplash();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shouldShow, dismissSplash]);

  const snapshot = useMemo(
    () => ({
      authChecked,
      hasAuthUser: Boolean(authUser),
      hasLearningData: Boolean(learningData),
      hasLearningError: Boolean(learningError),
      timedOut,
    }),
    [authChecked, authUser, learningData, learningError, timedOut]
  );

  const isReady = isWorkspaceInitializationReady(snapshot);
  const phase = getStartupPhaseInfo(snapshot);
  const progressPct = getStartupProgressPercent(snapshot);

  useEffect(() => {
    if (!shouldShow || splashDismissed) return;
    if (!isReady) return;

    const remainingMs = computeRemainingSplashDelayMs(
      mountedAtRef.current,
      Date.now(),
      CREATIVE_SPLASH_MIN_DURATION_MS,
      prefersReduced
    );

    if (remainingMs <= 0) {
      dismissSplash();
      return;
    }

    const timer = window.setTimeout(() => {
      dismissSplash();
    }, remainingMs);
    return () => window.clearTimeout(timer);
  }, [shouldShow, splashDismissed, isReady, prefersReduced, dismissSplash]);

  // Unused boolean guard kept silent
  void visible;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          data-testid="intro-splash"
          initial={{ opacity: 1 }}
          exit={
            prefersReduced
              ? { opacity: 0, transition: { duration: 0.08 } }
              : {
                  opacity: 0,
                  transition: { duration: 0.28, ease: MOMENTUM_EASE },
                }
          }
          className="fixed inset-0 z-[100] bg-canvas text-ink flex flex-col items-center justify-between px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.75rem+env(safe-area-inset-bottom))] select-none overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="MOMENTUM startup presentation"
        >
          {/* Soft Apple Keynote Radial Spotlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.96) 0%, rgba(245, 245, 247, 0) 62%)',
            }}
          />

          {/* Top Quiet Anchor */}
          <div className="relative z-10 w-full max-w-4xl flex items-center justify-between text-[11px] text-ink-muted">
            <span className="font-medium tracking-tight text-ink">MOMENTUM</span>
            <span className="font-mono tabular-nums tracking-wider uppercase text-ink-muted/80">
              Personal Workspace
            </span>
          </div>

          {/* Centerpiece Kinetic Momentum Emblem + Wordmark */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto py-8 max-w-md w-full">
            {/* Carbon Black Apple Squircle with Animated Ascending Momentum Bars */}
            <motion.div
              initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.44, ease: MOMENTUM_EASE }}
              className="relative w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-[22px] bg-[#1D1D1F] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.28)] border border-white/15 flex items-center justify-center mb-7"
            >
              <svg
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden="true"
                className="w-full h-full"
              >
                <motion.rect
                  x="16"
                  y="31"
                  width="8"
                  height="17"
                  rx="2.5"
                  fill="#8E8E93"
                  style={{ transformOrigin: '20px 48px' }}
                  initial={prefersReduced ? { scaleY: 1, opacity: 1 } : { scaleY: 0.15, opacity: 0.25 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: prefersReduced ? 0.01 : 0.42,
                    delay: prefersReduced ? 0 : 0.1,
                    ease: MOMENTUM_EASE,
                  }}
                />
                <motion.rect
                  x="28"
                  y="23"
                  width="8"
                  height="25"
                  rx="2.5"
                  fill="#D1D1D6"
                  style={{ transformOrigin: '32px 48px' }}
                  initial={prefersReduced ? { scaleY: 1, opacity: 1 } : { scaleY: 0.15, opacity: 0.25 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: prefersReduced ? 0.01 : 0.44,
                    delay: prefersReduced ? 0 : 0.19,
                    ease: MOMENTUM_EASE,
                  }}
                />
                <motion.rect
                  x="40"
                  y="15"
                  width="8"
                  height="33"
                  rx="2.5"
                  fill="#FFFFFF"
                  style={{ transformOrigin: '44px 48px' }}
                  initial={prefersReduced ? { scaleY: 1, opacity: 1 } : { scaleY: 0.15, opacity: 0.25 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{
                    duration: prefersReduced ? 0.01 : 0.46,
                    delay: prefersReduced ? 0 : 0.28,
                    ease: MOMENTUM_EASE,
                  }}
                />
              </svg>
            </motion.div>

            {/* Clean Apple Wordmark */}
            <motion.h1
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.42, delay: 0.14, ease: MOMENTUM_EASE }}
              className="text-2xl sm:text-[30px] font-bold tracking-[0.16em] text-ink uppercase font-heading pl-[0.16em]"
            >
              MOMENTUM
            </motion.h1>

            {/* Project Identity Mission Line */}
            <motion.p
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.4, delay: 0.24, ease: MOMENTUM_EASE }}
              className="mt-2.5 text-sm font-medium text-ink-muted tracking-tight"
            >
              Transform ambition into daily motion.
            </motion.p>

            {/* Four Core Workspace Pillars */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.38, delay: 0.34 }}
              className="mt-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-ink-muted/80"
            >
              {PILLARS.map((pillar, idx) => (
                <React.Fragment key={pillar}>
                  {idx > 0 && <span aria-hidden="true" className="text-line-strong">·</span>}
                  <span>{pillar}</span>
                </React.Fragment>
              ))}
            </motion.div>

            {/* Apple Progress Capsule Tied to Real Initialization */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.3, delay: 0.3 }}
              className="mt-8 w-44 sm:w-52 flex flex-col items-center gap-2.5"
            >
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label="Workspace initialization progress"
                className="w-full h-[3px] rounded-full bg-surface-inset overflow-hidden"
              >
                <motion.div
                  className="h-full rounded-full bg-ink"
                  initial={{ width: '24%' }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.38, ease: MOMENTUM_EASE }}
                />
              </div>
              <span
                role="status"
                aria-live="polite"
                className="text-[11px] font-medium text-ink-muted tabular-nums"
              >
                {phase.label}
              </span>
            </motion.div>
          </div>

          {/* Bottom Subtle Skip Action */}
          <div className="relative z-10 w-full max-w-4xl flex items-center justify-center">
            <button
              type="button"
              onClick={dismissSplash}
              className="text-xs font-medium text-ink-muted hover:text-ink transition-colors px-4 py-1.5 rounded-full bg-surface/80 hover:bg-surface border border-line shadow-2xs btn-press"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
