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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F5F5F7] text-[#1D1D1F] select-none overflow-hidden"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm w-full">
            <motion.div
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.44,
                ease: MOMENTUM_EASE,
              }}
              className="mb-6 rounded-[22px] p-1 glass-regular"
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

            <motion.h1
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.36,
                delay: prefersReduced ? 0 : 0.14,
                ease: MOMENTUM_EASE,
              }}
              className="text-2xl sm:text-[28px] font-bold tracking-[0.16em] text-[#1D1D1F] pl-[0.16em]"
            >
              MOMENTUM
            </motion.h1>

            <motion.p
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReduced ? 0.12 : 0.34,
                delay: prefersReduced ? 0 : 0.23,
                ease: MOMENTUM_EASE,
              }}
              className="mt-1.5 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-[0.26em] text-[#6E6E73] pl-[0.26em]"
            >
              LIFE OPERATING SYSTEM
            </motion.p>

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
              <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#E5E5EA]">
                {prefersReduced ? (
                  <div className="h-full w-full rounded-full bg-[#1D1D1F]" />
                ) : (
                  <motion.div
                    className="h-full w-1/2 rounded-full bg-[#1D1D1F]"
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
              className="mt-3.5 text-xs font-medium tracking-wide text-[#6E6E73]"
            >
              {statusMessage}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
