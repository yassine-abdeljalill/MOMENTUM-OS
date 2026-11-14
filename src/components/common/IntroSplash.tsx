import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MOMENTUM_EASE } from './MotionPrimitives';

const SPLASH_SESSION_KEY = 'momentum_intro_splash_seen';

export const IntroSplash: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    if (sessionStorage.getItem(SPLASH_SESSION_KEY) === '1') return false;
    return true;
  });

  const dismiss = () => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    if (prefersReduced) {
      dismiss();
      return;
    }
    const timer = window.setTimeout(dismiss, 1400);
    return () => window.clearTimeout(timer);
  }, [visible, prefersReduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.015, transition: { duration: 0.38, ease: MOMENTUM_EASE } }
          }
          className="fixed inset-0 z-[100] bg-[#1A1A1D] flex flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] select-none overflow-hidden"
          role="dialog"
          aria-label="Welcome to MOMENTUM"
        >
          {/* Subtle atmospheric radial depth strictly using official blue & beige */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(158, 204, 253, 0.08) 0%, rgba(210, 146, 91, 0.05) 28%, rgba(26, 26, 29, 0.96) 66%, #1A1A1D 100%)',
            }}
          />

          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: MOMENTUM_EASE }}
            className="relative z-10 glass-elevated glass-specular-rim rounded-[32px] px-8 py-9 sm:px-10 sm:py-10 flex flex-col items-center text-center max-w-sm w-full"
          >
            {/* Liquid Glass Icon Lens */}
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.42, delay: 0.06, ease: MOMENTUM_EASE }}
              className="w-20 h-20 rounded-[22px] p-1.5 glass-control glass-specular-rim flex items-center justify-center mb-5"
            >
              <img
                src="/brand-logo.png"
                alt="MOMENTUM"
                className="w-full h-full rounded-[16px] object-contain"
              />
            </motion.div>

            <motion.h1
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14, ease: MOMENTUM_EASE }}
              className="text-2xl sm:text-[28px] font-extrabold tracking-[0.2em] pl-[0.2em] text-ink uppercase font-heading"
            >
              MOMENTUM
            </motion.h1>

            <motion.p
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.22, ease: MOMENTUM_EASE }}
              className="mt-1.5 font-mono text-[11px] font-semibold tracking-[0.22em] text-brand-blue uppercase"
            >
              Life Operating System
            </motion.p>

            {/* Liquid Glass Progress Rail */}
            <div className="mt-7 w-48 h-1.5 rounded-full bg-white/[0.06] border border-white/10 overflow-hidden p-[1px]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.1, delay: 0.12, ease: MOMENTUM_EASE }}
                className="h-full rounded-full bg-gradient-to-r from-[#9ECCFD] via-[#D2925B] to-[#D2925B]"
              />
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mt-6 text-[11px] font-medium text-ink-muted hover:text-ink transition-colors px-3.5 py-1.5 rounded-full glass-control btn-press"
            >
              Enter Workspace
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
