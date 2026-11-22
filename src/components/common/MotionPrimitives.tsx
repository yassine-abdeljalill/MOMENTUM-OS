import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
import { CheckCircle2, Circle } from 'lucide-react';
import {
  MOMENTUM_EASE,
  MOMENTUM_SPRING,
  MOMENTUM_GENTLE_SPRING,
  MOMENTUM_MODAL_SPRING,
  clampProgress,
  easeOutQuart,
  getMomentumBarLevels,
} from '../../lib/motion';

export { MOMENTUM_EASE, MOMENTUM_SPRING, MOMENTUM_GENTLE_SPRING, MOMENTUM_MODAL_SPRING };

/**
 * Ultra-smooth, GPU-composited Apple spatial continuity transition for main view navigation.
 */
export const PageTransition: React.FC<{
  viewKey: string;
  children: React.ReactNode;
}> = ({ viewKey, children }) => {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      key={viewKey}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.988 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -6, scale: 0.994 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.28, ease: MOMENTUM_EASE }}
      style={{ willChange: prefersReduced ? 'auto' : 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Interactive Apple surface card with GPU pointer-tracking monochrome specular sheen
 * and silky damped hover lift (zero re-renders per mousemove).
 */
export const SpotlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);

  const spotlightBg = useMotionTemplate`radial-gradient(260px circle at ${mouseX}px ${mouseY}px, var(--spotlight-sheen), transparent 72%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-999);
    mouseY.set(-999);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={prefersReduced ? undefined : { y: -2 }}
      transition={MOMENTUM_GENTLE_SPRING}
      className={`relative overflow-hidden group/spotlight ${className}`}
    >
      {!prefersReduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover/spotlight:opacity-100 transition-opacity duration-300"
          style={{ background: spotlightBg }}
        />
      )}
      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </motion.div>
  );
};

/**
 * Reusable Modal shell with smooth backdrop blur fade + silky Apple spring detent.
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
  panelClassName = 'glass-elevated text-ink rounded-t-2xl sm:rounded-2xl overflow-hidden',
  alignTop = false,
  fullscreen = false,
  backdropClassName = 'bg-black/35 dark:bg-black/65 backdrop-blur-md',
}) => {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE }}
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
                : { opacity: 0, scale: alignTop ? 0.96 : 0.965, y: alignTop ? -12 : 24 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.97, y: alignTop ? -8 : 18 }
            }
            transition={
              prefersReduced
                ? { duration: 0.01 }
                : { ...MOMENTUM_MODAL_SPRING, opacity: { duration: 0.2, ease: MOMENTUM_EASE } }
            }
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
  panelClassName = 'w-full max-w-sm h-full glass-elevated border-l border-line text-ink flex flex-col',
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
          transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE }}
          onClick={onClose}
          className={`fixed inset-0 z-50 flex ${
            side === 'right' ? 'justify-end' : 'justify-start'
          } bg-black/35 dark:bg-black/65 backdrop-blur-sm`}
        >
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { x: initialX }}
            animate={prefersReduced ? { opacity: 1 } : { x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { x: initialX }}
            transition={
              prefersReduced
                ? { duration: 0.01 }
                : { duration: 0.3, ease: MOMENTUM_EASE }
            }
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
 * Silky 60fps quartic-eased numeric count-up that respects prefers-reduced-motion.
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

    const duration = 560;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const t = Math.max(0, Math.min(1, elapsed / duration));
      const eased = easeOutQuart(t);
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
 * Animated horizontal progress bar with silky updates and a soft monochrome
 * specular sweep whenever progress rises.
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
  const clamped = clampProgress(percentage);
  const prevPctRef = useRef<number>(clamped);
  const [sweepKey, setSweepKey] = useState<number>(0);

  useEffect(() => {
    if (!prefersReduced && clamped > prevPctRef.current) {
      setSweepKey(k => k + 1);
    }
    prevPctRef.current = clamped;
  }, [clamped, prefersReduced]);

  return (
    <div className={trackClassName}>
      <motion.div
        className={`relative overflow-hidden ${fillClassName}`}
        initial={prefersReduced ? { width: `${clamped}%` } : { width: '0%' }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: prefersReduced ? 0.01 : 0.62, ease: MOMENTUM_EASE }}
      >
        {sweepKey > 0 && !prefersReduced && clamped > 0 && (
          <motion.span
            key={sweepKey}
            aria-hidden="true"
            initial={{ x: '-100%', opacity: 0.75 }}
            animate={{ x: '220%', opacity: 0 }}
            transition={{ duration: 0.85, ease: MOMENTUM_EASE }}
            className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-accent-ink/45 to-transparent"
          />
        )}
      </motion.div>
    </div>
  );
};

/**
 * Identity-driven 3-bar ascending momentum indicator mirroring the BrandMark silhouette.
 * Adapts crisply to Light & Dark modes.
 */
export const MomentumVelocityBars: React.FC<{
  percentage: number;
  showLabel?: boolean;
  className?: string;
}> = ({ percentage, showLabel = false, className = '' }) => {
  const prefersReduced = useReducedMotion();
  const { bars, activeBars, tierLabel } = getMomentumBarLevels(percentage);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`} title={`Momentum: ${tierLabel}`}>
      <div className="flex items-end gap-[2.5px] h-4" aria-hidden="true">
        {bars.map((heightPct, idx) => {
          const isLit = idx < activeBars;
          return (
            <motion.span
              key={idx}
              initial={false}
              animate={{
                height: `${heightPct}%`,
                opacity: isLit ? 1 : 0.35,
              }}
              transition={
                prefersReduced
                  ? { duration: 0.01 }
                  : { ...MOMENTUM_GENTLE_SPRING, delay: idx * 0.055 }
              }
              className={`w-[3.5px] rounded-[1.5px] transition-colors ${
                isLit
                  ? idx === 2
                    ? 'bg-ink'
                    : idx === 1
                    ? 'bg-ink/70'
                    : 'bg-ink-muted'
                  : 'bg-surface-hover'
              }`}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-[10.5px] font-medium text-ink-muted tracking-tight">
          {tierLabel}
        </span>
      )}
    </div>
  );
};

/**
 * Tactile checkmark button with Apple spring pop + monochrome completion ring burst.
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
  const prevCheckedRef = useRef<boolean>(checked);
  const [burstKey, setBurstKey] = useState<number>(0);

  useEffect(() => {
    if (!prefersReduced && checked && !prevCheckedRef.current) {
      setBurstKey(k => k + 1);
    }
    prevCheckedRef.current = checked;
  }, [checked, prefersReduced]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={prefersReduced ? undefined : { scale: 1.09 }}
      whileTap={prefersReduced ? undefined : { scale: 0.85 }}
      transition={MOMENTUM_SPRING}
      className={`text-ink-muted hover:text-accent transition-colors shrink-0 relative flex items-center justify-center ${className}`}
      aria-label={ariaLabel || (checked ? 'Mark incomplete' : 'Mark completed')}
    >
      {burstKey > 0 && !prefersReduced && (
        <motion.span
          key={burstKey}
          aria-hidden="true"
          initial={{ scale: 0.7, opacity: 0.5 }}
          animate={{ scale: 2.05, opacity: 0 }}
          transition={{ duration: 0.48, ease: MOMENTUM_EASE }}
          className="pointer-events-none absolute inset-0 rounded-full border border-ink/60"
        />
      )}

      <AnimatePresence mode="wait" initial={false}>
        {checked ? (
          <motion.span
            key="checked"
            initial={prefersReduced ? { opacity: 1 } : { scale: 0.55, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
            transition={prefersReduced ? { duration: 0.01 } : MOMENTUM_SPRING}
            className="flex items-center justify-center"
          >
            <CheckCircle2 className={`${dim} text-accent fill-accent/15`} />
          </motion.span>
        ) : (
          <motion.span
            key="unchecked"
            initial={prefersReduced ? { opacity: 1 } : { scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
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
 * Staggered grid/list container & item wrappers for silky dashboard cards and lists.
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}> = ({ children, className = '', stagger = 0.055 }) => {
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
        hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12, scale: 0.986 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: prefersReduced ? 0.01 : 0.32, ease: MOMENTUM_EASE },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
