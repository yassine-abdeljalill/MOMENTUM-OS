import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
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
      {/* Subtle Architectural Hairline Grid matching IntroSplash */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Minimal Top Brand Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/brand-logo.png"
            alt="MOMENTUM"
            className="w-8 h-8 rounded-lg object-contain shrink-0"
          />
          <span className="font-heading font-semibold text-sm tracking-[0.18em] uppercase text-ink">
            MOMENTUM
          </span>
        </div>
        <span className="hidden sm:inline text-xs font-mono tracking-wider uppercase text-ink-muted">
          Personal Life Operating System
        </span>
      </header>

      {/* Main Centered Split Entry */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 py-5 sm:py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-14 items-center">
          {/* Left Editorial Identity (below form on mobile so Sign In/Up sits cleanly above fold) */}
          <motion.section
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.36, ease: MOMENTUM_EASE }}
            className="order-2 lg:order-1 space-y-5"
          >
            <div className="space-y-2.5 hidden lg:block">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">
                Focused Execution
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-ink leading-[1.14]">
                Enter your daily command center.
              </h1>
              <p className="text-sm text-ink-muted leading-relaxed max-w-md font-serif italic">
                &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo;
              </p>
            </div>

            <div className="border-t border-line pt-4 lg:pt-5 space-y-3 max-w-md mx-auto lg:mx-0">
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
                <span className="text-xs font-medium text-ink">Daily Priorities &amp; Focus</span>
                <span className="text-[11px] font-mono text-ink-muted">Rule of 3</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
                <span className="text-xs font-medium text-ink">Learning Management Center</span>
                <span className="text-[11px] font-mono text-ink-muted">Modules &amp; Notes</span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-medium text-ink">Private Finance Ledger</span>
                <span className="text-[11px] font-mono text-ink-muted">Encrypted Session</span>
              </div>
            </div>
          </motion.section>

          {/* Right Single-Elevation Auth Surface (primary above-the-fold card on mobile) */}
          <motion.section
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.4, delay: 0.05, ease: MOMENTUM_EASE }}
            aria-label="Account authentication"
            className="order-1 lg:order-2 bg-surface border border-line rounded-2xl p-5 sm:p-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)]"
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold font-heading text-ink">
                {mode === 'login'
                  ? 'Sign in to MOMENTUM'
                  : mode === 'signup'
                  ? 'Create your account'
                  : 'Reset password'}
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                {mode === 'login'
                  ? 'Resume your active tasks, learning modules, and ledger.'
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
                className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-inset/80 border border-line mb-5"
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

      {/* Quiet Minimal Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 pb-6 pt-3 flex items-center justify-between text-[11px] text-ink-muted">
        <span>MOMENTUM · Personal Workspace</span>
        <span className="font-mono">White · Grey · Black</span>
      </footer>
    </div>
  );
};
