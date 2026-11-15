import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { MOMENTUM_EASE } from './MotionPrimitives';

interface StartupSplashScreenProps {
  isVisible: boolean;
  statusMessage?: string;
}

export const StartupSplashScreen: React.FC<StartupSplashScreenProps> = ({
  isVisible,
  statusMessage = 'Preparing your workspace...',
}) => {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="momentum-startup-splash"
          data-testid="startup-splash"
          aria-label="MOMENTUM startup screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={
            prefersReduced
              ? { opacity: 0, transition: { duration: 0.14, ease: 'easeOut' } }
              : {
                  opacity: 0,
                  scale: 1.012,
                  transition: { duration: 0.36, ease: MOMENTUM_EASE },
                }
          }
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1D] text-[#F5F1E9] select-none overflow-hidden"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          {/* Subtle charcoal radial depth — calm, grounded, no neon */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.45, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(42, 42, 47, 0.45) 0%, rgba(26, 26, 29, 0.92) 55%, rgba(26, 26, 29, 1) 100%)',
            }}
          />

          <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm w-full">
            {/* Step 2: Official uploaded MOMENTUM logo fading in & gently scaling 90% -> 100% */}
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.44,
                ease: MOMENTUM_EASE,
              }}
              className="mb-6 rounded-[22px] p-1 bg-[#242428] border border-[#393940] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6)]"
            >
              <img
                src="/brand-logo.png"
                alt="MOMENTUM official logo"
                width={96}
                height={96}
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] object-contain block"
              />
            </motion.div>

            {/* Step 3: Brand Name */}
            <motion.h1
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.36,
                delay: prefersReduced ? 0 : 0.14,
                ease: MOMENTUM_EASE,
              }}
              className="text-2xl sm:text-[28px] font-bold tracking-[0.16em] text-[#F5F1E9] pl-[0.16em]"
            >
              MOMENTUM
            </motion.h1>

            {/* Step 4: Subtitle */}
            <motion.p
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.34,
                delay: prefersReduced ? 0 : 0.23,
                ease: MOMENTUM_EASE,
              }}
              className="mt-1.5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-[0.26em] text-[#9ECCFD] pl-[0.26em]"
            >
              LIFE OPERATING SYSTEM
            </motion.p>

            {/* Step 5: Calm, compositor-only MOMENTUM blue loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: prefersReduced ? 0.1 : 0.28,
                delay: prefersReduced ? 0 : 0.31,
                ease: 'easeOut',
              }}
              className="mt-8 w-44 sm:w-52"
            >
              <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#313137]">
                {prefersReduced ? (
                  <div className="h-full w-full rounded-full bg-[#9ECCFD]" />
                ) : (
                  <motion.div
                    className="h-full w-1/2 rounded-full bg-[#9ECCFD]"
                    style={{ willChange: 'transform' }}
                    initial={{ x: '-100%', scaleX: 0.75 }}
                    animate={{
                      x: ['-100%', '200%'],
                      scaleX: [0.75, 1.15, 0.75],
                    }}
                    transition={{
                      duration: 1.35,
                      repeat: Infinity,
                      ease: [0.45, 0.05, 0.55, 0.95],
                    }}
                  />
                )}
              </div>
            </motion.div>

            {/* Step 6: Subtle workspace preparation status */}
            <motion.p
              role="status"
              aria-live="polite"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: prefersReduced ? 0.1 : 0.3,
                delay: prefersReduced ? 0 : 0.36,
                ease: 'easeOut',
              }}
              className="mt-3.5 text-xs font-medium tracking-wide text-[#868A7A]"
            >
              {statusMessage}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
