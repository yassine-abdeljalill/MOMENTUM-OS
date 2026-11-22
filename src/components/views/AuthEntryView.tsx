import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { BrandMark } from '../common/BrandMark';
import { AuthCredentialsForm, type CredentialsMode } from './AuthCredentialsForm';
import type { AuthUser } from '../../types';

export const AuthEntryView: React.FC = () => {
  const { authModalMode, setAuthUser, showToast, setCurrentView, currentView } = useApp();
  const prefersReduced = useReducedMotion();

  const [mode, setMode] = useState<CredentialsMode>(() =>
    authModalMode === 'signup' ? 'signup' : authModalMode === 'forgot' ? 'forgot' : 'login'
  );

  const handleAuthenticated = (user: AuthUser, toastMessage: string) => {
    setAuthUser(user);
    showToast(toastMessage, 'success');
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
      if (path === '/login' || path === '/signin' || path === '/signup' || path === '/register') {
        window.history.replaceState(null, '', '/');
      }
    }
    if (currentView !== 'finance' && currentView !== 'learning') {
      setCurrentView('overview');
    }
  };

  return (
    <div
      data-testid="auth-entry-screen"
      className="relative min-h-dvh w-full bg-canvas text-ink flex flex-col justify-between overflow-x-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* Subtle Apple Soft Ambient Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 55% at 50% 18%, rgba(255, 255, 255, 0.92) 0%, rgba(245, 245, 247, 0) 70%)',
        }}
      />

      {/* Minimal Apple Top Brand Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark size="md" />
          <span className="font-heading font-semibold text-sm tracking-[0.12em] uppercase text-ink">
            MOMENTUM
          </span>
        </div>
        <span className="hidden sm:inline text-xs font-medium text-ink-muted">
          Personal Workspace
        </span>
      </header>

      {/* Main Centered Split Entry */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 py-5 sm:py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-16 items-center">
          {/* Left Editorial Identity (below form on mobile so Sign In/Up sits cleanly above fold) */}
          <motion.section
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.34, ease: MOMENTUM_EASE }}
            className="order-2 lg:order-1 space-y-6"
          >
            <div className="space-y-3 hidden lg:block">
              <p className="text-xs font-medium text-ink-muted tracking-tight">
                Discipline · Focus · Progress
              </p>
              <h1 className="text-3xl sm:text-[38px] font-bold font-heading tracking-tight text-ink leading-[1.12]">
                Transform ambition into daily motion.
              </h1>
              <p className="text-sm text-ink-muted leading-relaxed max-w-md">
                One calm, unified workspace for your daily priorities, integrated calendar, learning notes, habits, and personal ledger.
              </p>
            </div>

            <div className="border-t border-line pt-5 space-y-3 max-w-md mx-auto lg:mx-0">
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
                <span className="text-xs font-medium text-ink">Daily Priorities &amp; Focus</span>
                <span className="text-[11px] font-medium text-ink-muted">Rule of 3</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
                <span className="text-xs font-medium text-ink">Integrated Calendar</span>
                <span className="text-[11px] font-medium text-ink-muted">Day · Week · Month</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
                <span className="text-xs font-medium text-ink">Learning Management Center</span>
                <span className="text-[11px] font-medium text-ink-muted">Modules &amp; Notes</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-medium text-ink">Private Finance Ledger</span>
                <span className="text-[11px] font-medium text-ink-muted">Personal Session</span>
              </div>
            </div>
          </motion.section>

          {/* Right Single-Elevation Apple Auth Surface */}
          <motion.section
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.36, delay: 0.04, ease: MOMENTUM_EASE }}
            aria-label="Account authentication"
            className="order-1 lg:order-2 bg-surface border border-line rounded-[22px] p-5 sm:p-8 shadow-[0_16px_44px_-14px_rgba(0,0,0,0.1)]"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold font-heading text-ink tracking-tight">
                {mode === 'login'
                  ? 'Sign in to MOMENTUM'
                  : mode === 'signup'
                  ? 'Create your account'
                  : 'Reset password'}
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                {mode === 'login'
                  ? 'Resume your active tasks, calendar, learning, and ledger.'
                  : mode === 'signup'
                  ? 'Start a dedicated workspace synced to your personal account.'
                  : 'Recover access to your personal workspace.'}
              </p>
            </div>

            {/* Apple Segmented Control Switcher */}
            {mode !== 'forgot' && (
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-inset/75 border border-line mb-5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => setMode('login')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    mode === 'login'
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => setMode('signup')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    mode === 'signup'
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            <AuthCredentialsForm
              mode={mode}
              onModeChange={setMode}
              onAuthenticated={handleAuthenticated}
              allowGuestWorkspace={true}
            />
          </motion.section>
        </div>
      </main>

      {/* Quiet Minimal Apple Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 pb-6 pt-3 flex items-center justify-between text-[11px] text-ink-muted">
        <span>MOMENTUM · Personal Workspace</span>
        <span>Discipline · Focus · Progress</span>
      </footer>
    </div>
  );
};
