import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import {
  CREATIVE_SPLASH_MIN_DURATION_MS,
  DEFAULT_SPLASH_FAILSAFE_MS,
  computeRemainingSplashDelayMs,
  getStartupPhaseInfo,
  isWorkspaceInitializationReady,
} from '../../lib/startupSplash';
import { MOMENTUM_EASE } from './MotionPrimitives';

const WORDMARK_LETTERS = ['M', 'O', 'M', 'E', 'N', 'T', 'U', 'M'] as const;

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

  const visible = !splashDismissed || !authChecked;

  useEffect(() => {
    if (!visible) return;
    const failsafeTimer = window.setTimeout(() => {
      setTimedOut(true);
    }, DEFAULT_SPLASH_FAILSAFE_MS);
    return () => window.clearTimeout(failsafeTimer);
  }, [visible]);

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

  useEffect(() => {
    if (!visible || splashDismissed) return;
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
  }, [visible, splashDismissed, isReady, prefersReduced, dismissSplash]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="intro-splash"
          initial={{ opacity: 1 }}
          exit={
            prefersReduced
              ? { opacity: 0, transition: { duration: 0.01 } }
              : {
                  opacity: 0,
                  scale: 1.015,
                  transition: { duration: 0.38, ease: MOMENTUM_EASE },
                }
          }
          className="fixed inset-0 z-[100] bg-canvas text-ink flex flex-col items-center justify-between px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.75rem+env(safe-area-inset-bottom))] select-none overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Starting MOMENTUM"
        >
          {/* Architectural Precision Hairline Grid */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.7, ease: MOMENTUM_EASE }}
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(210, 196, 172, 0.75) 1px, transparent 1px), linear-gradient(to bottom, rgba(210, 196, 172, 0.75) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />

          {/* Horizontal & Vertical Center Hairline Axis Flash */}
          <motion.div
            aria-hidden="true"
            initial={prefersReduced ? { opacity: 0 } : { scaleX: 0, opacity: 0.3 }}
            animate={{ scaleX: 1, opacity: 0.09 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.85, ease: MOMENTUM_EASE }}
            className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-stone origin-center"
          />
          <motion.div
            aria-hidden="true"
            initial={prefersReduced ? { opacity: 0 } : { scaleY: 0, opacity: 0.3 }}
            animate={{ scaleY: 1, opacity: 0.09 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.85, ease: MOMENTUM_EASE }}
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-stone origin-center"
          />

          {/* Four Architectural Corner Registration Brackets */}
          <div
            aria-hidden="true"
            className="pointer-events-none relative z-10 w-full max-w-5xl flex items-center justify-between"
          >
            <motion.span
              initial={prefersReduced ? { opacity: 0.5 } : { opacity: 0, x: -8, y: -8 }}
              animate={{ opacity: 0.55, x: 0, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.45, ease: MOMENTUM_EASE }}
              className="w-4 h-4 border-l border-t border-stone/60"
            />
            <motion.span
              initial={prefersReduced ? { opacity: 0.7 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 0.75, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.45, delay: 0.1, ease: MOMENTUM_EASE }}
              className="text-[10px] font-mono tracking-[0.26em] uppercase text-stone/80"
            >
              Life OS · v2
            </motion.span>
            <motion.span
              initial={prefersReduced ? { opacity: 0.5 } : { opacity: 0, x: 8, y: -8 }}
              animate={{ opacity: 0.55, x: 0, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.45, ease: MOMENTUM_EASE }}
              className="w-4 h-4 border-r border-t border-stone/60"
            />
          </div>

          {/* Centerpiece Kinetic Orbital Emblem + Masked Wordmark */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto py-8">
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center mb-7">
              {/* Subtle Electric Blue Ambient Halo */}
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={
                  prefersReduced
                    ? { opacity: 0.16, scale: 1 }
                    : { opacity: [0, 0.22, 0.14], scale: [0.7, 1.08, 1] }
                }
                transition={{ duration: prefersReduced ? 0.01 : 1.15, ease: MOMENTUM_EASE }}
                className="absolute inset-4 rounded-full bg-accent/25 blur-2xl"
              />

              {/* Outer Precision Champagne Dial Ring */}
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 160 160"
                className="absolute inset-0 w-full h-full"
                initial={prefersReduced ? { rotate: 0, opacity: 0.7 } : { rotate: -75, scale: 0.86, opacity: 0 }}
                animate={{ rotate: 12, scale: 1, opacity: 0.85 }}
                transition={{ duration: prefersReduced ? 0.01 : 1.25, ease: MOMENTUM_EASE }}
              >
                <circle
                  cx="80"
                  cy="80"
                  r="74"
                  fill="none"
                  stroke="rgba(210, 196, 172, 0.22)"
                  strokeWidth="1"
                  strokeDasharray="3 7"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  fill="none"
                  stroke="rgba(210, 196, 172, 0.16)"
                  strokeWidth="1"
                />
                {/* Cardinal Precision Ticks */}
                <line x1="80" y1="2" x2="80" y2="11" stroke="#D2C4AC" strokeWidth="1.5" />
                <line x1="80" y1="149" x2="80" y2="158" stroke="#D2C4AC" strokeWidth="1.5" />
                <line x1="2" y1="80" x2="11" y2="80" stroke="#D2C4AC" strokeWidth="1.5" />
                <line x1="149" y1="80" x2="158" y2="80" stroke="#D2C4AC" strokeWidth="1.5" />
              </motion.svg>

              {/* Inner Electric Blue Kinetic Sweep Arc */}
              <motion.svg
                aria-hidden="true"
                viewBox="0 0 160 160"
                className="absolute inset-0 w-full h-full"
                initial={prefersReduced ? { rotate: 0 } : { rotate: -140 }}
                animate={{ rotate: 220 }}
                transition={{ duration: prefersReduced ? 0.01 : 1.35, ease: MOMENTUM_EASE }}
              >
                <motion.circle
                  cx="80"
                  cy="80"
                  r="54"
                  fill="none"
                  stroke="#397BFF"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeDasharray="339.29"
                  initial={prefersReduced ? { strokeDashoffset: 110 } : { strokeDashoffset: 320 }}
                  animate={{ strokeDashoffset: 120 }}
                  transition={{ duration: prefersReduced ? 0.01 : 1.05, delay: 0.08, ease: MOMENTUM_EASE }}
                />
              </motion.svg>

              {/* Crisp Brand Mark */}
              <motion.div
                initial={prefersReduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.78 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.55, delay: 0.08, ease: MOMENTUM_EASE }}
                className="relative w-20 h-20 rounded-2xl bg-surface/95 border border-stone/25 shadow-2xl p-2 flex items-center justify-center"
              >
                <img
                  src="/brand-logo.png"
                  alt="MOMENTUM"
                  className="w-full h-full rounded-xl object-contain"
                />
              </motion.div>
            </div>

            {/* Staggered Masked Typographic Reveal */}
            <h1 className="flex items-center justify-center overflow-hidden text-2xl sm:text-3xl font-extrabold tracking-[0.26em] text-ink uppercase font-heading pl-[0.26em]">
              {WORDMARK_LETTERS.map((char, idx) => (
                <motion.span
                  key={`${char}-${idx}`}
                  initial={prefersReduced ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  transition={{
                    duration: prefersReduced ? 0.01 : 0.45,
                    delay: prefersReduced ? 0 : 0.18 + idx * 0.038,
                    ease: MOMENTUM_EASE,
                  }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </h1>

            {/* Expanding Champagne Hairline Divider */}
            <motion.div
              aria-hidden="true"
              initial={prefersReduced ? { scaleX: 1, opacity: 0.5 } : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 0.6 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.55, delay: 0.42, ease: MOMENTUM_EASE }}
              className="mt-3.5 h-px w-48 bg-gradient-to-r from-transparent via-stone to-transparent origin-center"
            />

            <motion.p
              initial={prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.4, delay: 0.48, ease: MOMENTUM_EASE }}
              className="mt-3 text-xs font-medium tracking-[0.18em] text-stone uppercase"
            >
              Personal Life Operating System
            </motion.p>

            {/* Real Initialization Phase Readout */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.35, delay: 0.55 }}
              className="mt-7 flex items-center gap-2.5 text-[11px] font-mono tracking-wider uppercase text-ink-muted tabular-nums"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-stone">{phase.step}</span>
              <span className="text-ink-muted/50">/</span>
              <span>{phase.label}</span>
            </motion.div>
          </div>

          {/* Bottom Brackets & Skip Control */}
          <div className="relative z-10 w-full max-w-5xl flex items-center justify-between">
            <motion.span
              aria-hidden="true"
              initial={prefersReduced ? { opacity: 0.5 } : { opacity: 0, x: -8, y: 8 }}
              animate={{ opacity: 0.55, x: 0, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.45, ease: MOMENTUM_EASE }}
              className="w-4 h-4 border-l border-b border-stone/60"
            />

            <button
              type="button"
              onClick={dismissSplash}
              className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-warm/70 btn-press"
            >
              Skip intro
            </button>

            <motion.span
              aria-hidden="true"
              initial={prefersReduced ? { opacity: 0.5 } : { opacity: 0, x: 8, y: 8 }}
              animate={{ opacity: 0.55, x: 0, y: 0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.45, ease: MOMENTUM_EASE }}
              className="w-4 h-4 border-r border-b border-stone/60"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
