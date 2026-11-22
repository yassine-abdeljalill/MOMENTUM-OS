import React from 'react';

interface BrandMarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  className?: string;
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
}) => {
  const isLight = variant === 'light';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`${SIZE_CLASSES[size]} shrink-0 ${className}`}
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
      <rect
        x="16"
        y="31"
        width="8"
        height="17"
        rx="2.5"
        fill={isLight ? '#AEAEB2' : '#8E8E93'}
      />
      <rect
        x="28"
        y="23"
        width="8"
        height="25"
        rx="2.5"
        fill={isLight ? '#6E6E73' : '#D1D1D6'}
      />
      <rect
        x="40"
        y="15"
        width="8"
        height="33"
        rx="2.5"
        fill={isLight ? '#1D1D1F' : '#FFFFFF'}
      />
    </svg>
  );
};
