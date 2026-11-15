import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { ModalShell } from './MotionPrimitives';

interface PWAInstallButtonProps {
  compact?: boolean;
  variant?: 'sidebar' | 'sheet';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  variant = 'sidebar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const buttonClasses =
    variant === 'sheet'
      ? 'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold bg-accent/15 hover:bg-accent/25 text-ink border border-accent/40 transition-colors btn-press min-h-[44px]'
      : `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-accent/15 hover:bg-accent/25 text-accent border border-accent/35 transition-colors btn-press ${
          compact ? 'justify-center px-2' : ''
        }`;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title="Install MOMENTUM App"
        className={buttonClasses}
      >
        <Download className="w-4 h-4 shrink-0 text-accent" />
        {!compact && <span className="truncate">Install MOMENTUM</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Install MOMENTUM on iPhone"
          className={buttonClasses}
        >
          <Download className="w-4 h-4 shrink-0 text-accent" />
          {!compact && <span className="truncate">Add to Home Screen</span>}
        </button>

        <ModalShell
          isOpen={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          maxWidthClass="max-w-sm"
        >
          <div className="flex items-center justify-between px-5 py-4 bg-surface-warm text-ink border-b border-line">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand-logo.png"
                alt="MOMENTUM"
                className="w-6 h-6 rounded-md object-contain"
              />
              <h3 className="text-sm font-bold">Install on iPhone / iPad</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3 text-xs text-ink">
            <p className="text-ink-muted leading-relaxed">
              Install MOMENTUM to your Home Screen for a full-screen native experience:
            </p>
            <ol className="space-y-2 pl-4 list-decimal text-ink">
              <li>
                Tap the{' '}
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Share className="w-3.5 h-3.5 text-accent" /> Share
                </span>{' '}
                button in Safari&apos;s toolbar.
              </li>
              <li>
                Scroll down and tap <span className="font-semibold">Add to Home Screen</span>.
              </li>
              <li>
                Tap <span className="font-semibold">Add</span> to place MOMENTUM on your Home Screen.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-2 w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-bold text-xs btn-press"
            >
              Got it
            </button>
          </div>
        </ModalShell>
      </>
    );
  }

  return null;
};
