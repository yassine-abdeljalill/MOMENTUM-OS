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
    const timer = window.setTimeout(dismiss, 1300);
    return () => window.clearTimeout(timer);
  }, [visible, prefersReduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: MOMENTUM_EASE } }}
          className="fixed inset-0 z-[100] bg-canvas flex flex-col items-center justify-center px-6 select-none"
          role="dialog"
          aria-label="Welcome to MOMENTUM"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.45, ease: MOMENTUM_EASE }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.05, ease: MOMENTUM_EASE }}
              className="w-20 h-20 rounded-2xl p-1.5 bg-surface border border-line shadow-xl flex items-center justify-center mb-5"
            >
              <img
                src="/brand-logo.png"
                alt="MOMENTUM"
                className="w-full h-full rounded-xl object-contain"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.14, ease: MOMENTUM_EASE }}
              className="text-2xl sm:text-3xl font-extrabold tracking-[0.18em] text-ink uppercase font-heading"
            >
              MOMENTUM
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.22, ease: MOMENTUM_EASE }}
              className="mt-1.5 text-xs font-medium tracking-wide text-accent uppercase"
            >
              Personal Life Operating System
            </motion.p>

            {/* Progress Reveal Bar */}
            <div className="mt-6 w-44 h-1 rounded-full bg-surface-inset overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.05, delay: 0.12, ease: MOMENTUM_EASE }}
                className="h-full bg-gradient-to-r from-brand via-accent to-accent rounded-full"
              />
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mt-6 text-[11px] font-medium text-ink-muted hover:text-ink transition-colors px-3 py-1 rounded-lg hover:bg-surface-warm"
            >
              Skip intro
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
