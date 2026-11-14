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
                  scale: 1.015,
                  transition: { duration: 0.36, ease: MOMENTUM_EASE },
                }
          }
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1D] text-[#F5F1E9] select-none overflow-hidden px-6"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          {/* Subtle atmospheric radial depth strictly using official blue & beige */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.45, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 42%, rgba(158, 204, 253, 0.08) 0%, rgba(210, 146, 91, 0.05) 30%, rgba(26, 26, 29, 0.96) 66%, #1A1A1D 100%)',
            }}
          />

          <div className="relative z-10 glass-elevated glass-specular-rim rounded-[32px] flex flex-col items-center px-8 py-9 sm:px-10 sm:py-10 text-center max-w-sm w-full">
            {/* Official MOMENTUM icon inside Liquid Glass bezel */}
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.44,
                ease: MOMENTUM_EASE,
              }}
              className="mb-5 rounded-[22px] p-1.5 glass-control glass-specular-rim"
            >
              <img
                src="/brand-logo.png"
                alt="MOMENTUM official logo"
                width={88}
                height={88}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-[16px] object-contain block"
              />
            </motion.div>

            {/* Brand Name */}
            <motion.h1
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.36,
                delay: prefersReduced ? 0 : 0.14,
                ease: MOMENTUM_EASE,
              }}
              className="text-2xl sm:text-[28px] font-extrabold tracking-[0.2em] text-[#F5F1E9] pl-[0.2em] font-heading"
            >
              MOMENTUM
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.34,
                delay: prefersReduced ? 0 : 0.23,
                ease: MOMENTUM_EASE,
              }}
              className="mt-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9ECCFD] pl-[0.24em]"
            >
              LIFE OPERATING SYSTEM
            </motion.p>

            {/* Luminous glass progress rail */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: prefersReduced ? 0.1 : 0.28,
                delay: prefersReduced ? 0 : 0.31,
                ease: 'easeOut',
              }}
              className="mt-7 w-48"
            >
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] border border-white/10 p-[1px]">
                {prefersReduced ? (
                  <div className="h-full w-full rounded-full bg-[#9ECCFD]" />
                ) : (
                  <motion.div
                    className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#9ECCFD] to-[#D2925B]"
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

            {/* Workspace preparation status */}
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
              className="mt-4 text-xs font-medium tracking-wide text-[#868A7A]"
            >
              {statusMessage}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
