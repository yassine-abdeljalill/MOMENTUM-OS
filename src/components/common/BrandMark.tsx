import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MOMENTUM_EASE } from '../../lib/motion';

interface BrandMarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  className?: string;
  interactive?: boolean;
  active?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps['size']>, string> = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'sm',
  variant = 'dark',
  className = '',
  interactive = false,
  active = false,
}) => {
  const isLight = variant === 'light';
  const prefersReduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const triggerWave = !prefersReduced && (hovered || active);

  return (
    <motion.svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      onMouseEnter={interactive ? () => setHovered(true) : undefined}
      onMouseLeave={interactive ? () => setHovered(false) : undefined}
      whileHover={interactive && !prefersReduced ? { scale: 1.05 } : undefined}
      whileTap={interactive && !prefersReduced ? { scale: 0.94 } : undefined}
      transition={{ duration: 0.18, ease: MOMENTUM_EASE }}
      className={`${SIZE_CLASSES[size]} shrink-0 ${interactive ? 'cursor-pointer' : ''} ${className}`}
    >
      <rect
        width="64"
        height="64"
        rx="15"
        fill={isLight ? '#FFFFFF' : '#1D1D1F'}
      />
      <rect
        x="0.75"
        y="0.75"
        width="62.5"
        height="62.5"
        rx="14.25"
        stroke={isLight ? '#000000' : '#FFFFFF'}
        strokeOpacity={isLight ? '0.1' : '0.14'}
        strokeWidth="1.5"
      />
      {/* Three ascending precision bars representing Discipline -> Focus -> Momentum */}
      <motion.rect
        x="16"
        y="31"
        width="8"
        height="17"
        rx="2.5"
        fill={isLight ? '#AEAEB2' : '#8E8E93'}
        style={{ transformOrigin: '20px 48px' }}
        animate={
          triggerWave
            ? { scaleY: [1, 1.24, 0.94, 1] }
            : { scaleY: 1 }
        }
        transition={{
          duration: 0.55,
          delay: 0,
          ease: MOMENTUM_EASE,
          repeat: active && !prefersReduced ? Infinity : 0,
          repeatDelay: 1.8,
        }}
      />
      <motion.rect
        x="28"
        y="23"
        width="8"
        height="25"
        rx="2.5"
        fill={isLight ? '#6E6E73' : '#D1D1D6'}
        style={{ transformOrigin: '32px 48px' }}
        animate={
          triggerWave
            ? { scaleY: [1, 1.16, 0.95, 1] }
            : { scaleY: 1 }
        }
        transition={{
          duration: 0.55,
          delay: 0.07,
          ease: MOMENTUM_EASE,
          repeat: active && !prefersReduced ? Infinity : 0,
          repeatDelay: 1.8,
        }}
      />
      <motion.rect
        x="40"
        y="15"
        width="8"
        height="33"
        rx="2.5"
        fill={isLight ? '#1D1D1F' : '#FFFFFF'}
        style={{ transformOrigin: '44px 48px' }}
        animate={
          triggerWave
            ? { scaleY: [1, 1.1, 0.96, 1] }
            : { scaleY: 1 }
        }
        transition={{
          duration: 0.55,
          delay: 0.14,
          ease: MOMENTUM_EASE,
          repeat: active && !prefersReduced ? Infinity : 0,
          repeatDelay: 1.8,
        }}
      />
    </motion.svg>
  );
};
