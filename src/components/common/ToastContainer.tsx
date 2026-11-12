import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../lib/context';
import { MOMENTUM_EASE } from './MotionPrimitives';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  const prefersReduced = useReducedMotion();

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-xs w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence initial={false}>
        {toasts.map(toast => {
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';

          return (
            <motion.div
              key={toast.id}
              layout={!prefersReduced}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
              className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-lg border text-xs font-medium ${
                isError
                  ? 'bg-[#3B2418] border-[#B84A44] text-[#F2E8DA]'
                  : 'bg-[#3B2418] border-[#8EC5FF]/50 text-[#F2E8DA]'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4 text-[#F08A85] shrink-0" />
              ) : isInfo ? (
                <Info className="w-4 h-4 text-[#8EC5FF] shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#8EC5FF] shrink-0" />
              )}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-0.5 rounded text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
