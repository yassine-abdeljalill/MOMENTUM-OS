import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type GlassTier = 'ultra-thin' | 'regular' | 'elevated' | 'control';

const TIER_CLASS: Record<GlassTier, string> = {
  'ultra-thin': 'glass-ultra-thin',
  regular: 'glass-regular',
  elevated: 'glass-elevated',
  control: 'glass-control',
};

/**
 * Reusable Liquid Glass container for floating navigation bars, toolbars, popovers, and control clusters.
 * Content cards should stay solid/subtle (#242428 / #2A2A2F) for maximum legibility.
 */
export const GlassSurface: React.FC<{
  tier?: GlassTier;
  specular?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ tier = 'regular', specular = false, className = '', children }) => {
  return (
    <div
      className={`${TIER_CLASS[tier]} ${specular ? 'glass-specular-rim' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Apple-inspired Liquid Glass Segmented Control with spring-animated active capsule.
 */
export interface GlassSegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

export function GlassSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className = '',
  size = 'md',
}: {
  options: readonly GlassSegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  layoutId: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const prefersReduced = useReducedMotion();
  const pad = size === 'sm' ? 'px-3 py-1.5 min-h-[34px]' : 'px-3.5 py-2 min-h-[38px] sm:min-h-[34px]';

  return (
    <div
      className={`glass-segmented inline-flex items-center gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full ${className}`}
      role="tablist"
    >
      {options.map(opt => {
        const Icon = opt.icon;
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 inline-flex items-center justify-center gap-1.5 ${pad} rounded-xl text-xs font-semibold transition-colors btn-press whitespace-nowrap shrink-0 ${
              isActive ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={
                  prefersReduced
                    ? { duration: 0.01 }
                    : { type: 'spring', stiffness: 440, damping: 34, mass: 0.8 }
                }
                className="absolute inset-0 rounded-xl glass-accent-pill -z-10"
              />
            )}
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md tabular-nums ${
                  isActive ? 'bg-black/20 text-accent-ink' : 'bg-surface-inset text-ink'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
