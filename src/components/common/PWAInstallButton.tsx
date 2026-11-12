import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { ModalShell } from './MotionPrimitives';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title="Install MOMENTUM App"
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-[#8EC5FF]/15 hover:bg-[#8EC5FF]/25 text-[#8EC5FF] border border-[#8EC5FF]/35 transition-colors btn-press ${
          compact ? 'justify-center px-2' : ''
        }`}
      >
        <Download className="w-4 h-4 shrink-0" />
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-[#8EC5FF]/15 hover:bg-[#8EC5FF]/25 text-[#8EC5FF] border border-[#8EC5FF]/35 transition-colors btn-press ${
            compact ? 'justify-center px-2' : ''
          }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          {!compact && <span className="truncate">Add to Home Screen</span>}
        </button>

        <ModalShell
          isOpen={showIOSGuide}
          onClose={() => setShowIOSGuide(false)}
          maxWidthClass="max-w-sm"
          backdropClassName="bg-[#3B2418]/70 backdrop-blur-xs"
          panelClassName="bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 bg-[#3B2418] border-b border-[#5A3927]">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand-logo.png"
                alt="MOMENTUM"
                className="w-6 h-6 rounded-md object-contain"
              />
              <h3 className="text-sm font-bold text-[#F2E8DA]">Install on iPhone / iPad</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="p-1 rounded-lg text-[#D8C7B4] hover:text-[#F2E8DA] hover:bg-[#4D3021]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-3 text-xs text-[#3B2418]">
            <p className="text-[#6E5648] leading-relaxed">
              Install MOMENTUM to your Home Screen for a full-screen native experience:
            </p>
            <ol className="space-y-2 pl-4 list-decimal text-[#3B2418]">
              <li>
                Tap the <span className="inline-flex items-center gap-1 font-semibold"><Share className="w-3.5 h-3.5 text-[#1E5A99]" /> Share</span> button in Safari&apos;s toolbar.
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
              className="mt-2 w-full py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs btn-press"
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
