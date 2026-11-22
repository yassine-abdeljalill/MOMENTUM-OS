import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { MOMENTUM_SPRING } from '../../lib/motion';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
}) => {
  const { resolvedTheme, toggleTheme } = useApp();
  const prefersReduced = useReducedMotion();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={prefersReduced ? undefined : { scale: 1.03 }}
      whileTap={prefersReduced ? undefined : { scale: 0.94 }}
      transition={MOMENTUM_SPRING}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`h-8 sm:h-9 ${
        showLabel ? 'px-3 gap-1.5' : 'w-8 sm:w-9'
      } rounded-xl glass-control text-ink text-xs font-medium btn-press flex items-center justify-center shrink-0 relative overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon-icon"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, rotate: -65, scale: 0.65 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, rotate: 65, scale: 0.65 }}
            transition={prefersReduced ? { duration: 0.01 } : MOMENTUM_SPRING}
            className="flex items-center justify-center"
          >
            <Moon className="w-4 h-4 text-ink" />
          </motion.span>
        ) : (
          <motion.span
            key="sun-icon"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, rotate: 65, scale: 0.65 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, rotate: -65, scale: 0.65 }}
            transition={prefersReduced ? { duration: 0.01 } : MOMENTUM_SPRING}
            className="flex items-center justify-center"
          >
            <Sun className="w-4 h-4 text-ink" />
          </motion.span>
        )}
      </AnimatePresence>
      {showLabel && (
        <span className="text-xs font-medium whitespace-nowrap">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </motion.button>
  );
};
