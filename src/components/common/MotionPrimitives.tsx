import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';

export const MOMENTUM_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Smooth, lightweight page transition for main view navigation.
 */
export const PageTransition: React.FC<{
  viewKey: string;
  children: React.ReactNode;
}> = ({ viewKey, children }) => {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      key={viewKey}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Reusable Modal shell with smooth backdrop fade + bottom-sheet adaptation on mobile.
 */
export const ModalShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  panelClassName?: string;
  alignTop?: boolean;
  fullscreen?: boolean;
  backdropClassName?: string;
}> = ({
  isOpen,
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
  panelClassName = 'glass-modal glass-specular-rim text-ink rounded-t-3xl sm:rounded-3xl overflow-hidden',
  alignTop = false,
  fullscreen = false,
  backdropClassName = 'bg-black/65 backdrop-blur-md',
}) => {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: 'easeOut' }}
          onClick={onClose}
          className={`fixed inset-0 z-50 flex justify-center ${
            fullscreen
              ? 'items-center p-0'
              : alignTop
              ? 'items-start pt-14 md:pt-24 px-3 sm:px-4'
              : 'items-end sm:items-center p-0 sm:p-4'
          } ${backdropClassName}`}
        >
          <motion.div
            initial={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 0, scale: alignTop ? 0.96 : 0.97, y: alignTop ? -10 : 24 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: alignTop ? -8 : 18 }
            }
            transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE }}
            onClick={e => e.stopPropagation()}
            className={`w-full ${
              fullscreen
                ? 'h-dvh w-screen max-w-none rounded-none border-0'
                : `${maxWidthClass} max-h-[90dvh] overflow-y-auto`
            } ${panelClassName}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Reusable Drawer shell for slide-over panels (NotificationsDrawer, sheets).
 */
export const DrawerShell: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
  panelClassName?: string;
}> = ({
  isOpen,
  onClose,
  side = 'right',
  children,
  panelClassName = 'w-full max-w-sm h-full glass-sheet text-ink flex flex-col border-y-0 border-r-0',
}) => {
  const prefersReduced = useReducedMotion();
  const initialX = side === 'right' ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.01 : 0.18 }}
          onClick={onClose}
          className={`fixed inset-0 z-50 flex ${
            side === 'right' ? 'justify-end' : 'justify-start'
          } bg-black/60 backdrop-blur-md`}
        >
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { x: initialX }}
            animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { x: initialX }}
            transition={{ duration: prefersReduced ? 0.01 : 0.24, ease: MOMENTUM_EASE }}
            onClick={e => e.stopPropagation()}
            className={panelClassName}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Animated numeric count-up that respects prefers-reduced-motion.
 */
export const AnimatedNumber: React.FC<{
  value: number;
  formatter?: (val: number) => string;
  className?: string;
}> = ({ value, formatter, className }) => {
  const prefersReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevRef = useRef<number>(0);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(value);
      prevRef.current = value;
      return;
    }

    const startVal = prevRef.current;
    const endVal = value;
    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    const duration = 380;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const t = Math.max(0, Math.min(1, elapsed / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const current = startVal + (endVal - startVal) * eased;
      setDisplayValue(t >= 1 ? endVal : Math.round(current));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevRef.current = endVal;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value, prefersReduced]);

  const formatted = formatter ? formatter(displayValue) : String(displayValue);
  return <span className={className}>{formatted}</span>;
};

/**
 * Animated horizontal progress bar that animates smoothly on viewport entry and updates.
 */
export const AnimatedProgressBar: React.FC<{
  percentage: number;
  trackClassName?: string;
  fillClassName?: string;
}> = ({
  percentage,
  trackClassName = 'w-full bg-surface-inset h-2 rounded-full overflow-hidden',
  fillClassName = 'bg-accent h-full rounded-full',
}) => {
  const prefersReduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={trackClassName}>
      <motion.div
        className={fillClassName}
        initial={prefersReduced ? { width: `${clamped}%` } : { width: '0%' }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.45, ease: MOMENTUM_EASE }}
      />
    </div>
  );
};

/**
 * Satisfying checkmark toggle button with spring pop & SVG draw feel.
 */
export const AnimatedCheckButton: React.FC<{
  checked: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  className?: string;
}> = ({ checked, onClick, size = 'md', ariaLabel, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const dim = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={prefersReduced ? undefined : { scale: 0.85 }}
      className={`text-ink-muted hover:text-success transition-colors shrink-0 relative flex items-center justify-center ${className}`}
      aria-label={ariaLabel || (checked ? 'Mark incomplete' : 'Mark completed')}
    >
      <AnimatePresence mode="wait" initial={false}>
        {checked ? (
          <motion.span
            key="checked"
            initial={prefersReduced ? { opacity: 1 } : { scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
            className="flex items-center justify-center"
          >
            <CheckCircle2 className={`${dim} text-success fill-success/15`} />
          </motion.span>
        ) : (
          <motion.span
            key="unchecked"
            initial={prefersReduced ? { opacity: 1 } : { scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.14 }}
            className="flex items-center justify-center"
          >
            <Circle className={dim} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

/**
 * Staggered grid/list container & item wrappers for dashboard cards and lists.
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}> = ({ children, className = '', stagger = 0.035 }) => {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReduced ? 0 : stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
