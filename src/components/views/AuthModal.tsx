import React, { useEffect } from 'react';
import {
  X,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp, type AuthModalMode } from '../../lib/context';
import { ModalShell, MOMENTUM_EASE } from '../common/MotionPrimitives';
import { BrandMark } from '../common/BrandMark';
import { AuthCredentialsForm, type CredentialsMode } from './AuthCredentialsForm';
import type { AuthUser } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    currentView,
    setCurrentView,
    state,
    authUser,
    setAuthUser,
    logoutAuth,
    showToast,
  } = useApp();

  const prefersReduced = useReducedMotion();
  const mode = authModalMode;

  const switchMode = (nextMode: AuthModalMode) => {
    setAuthModalMode(nextMode);
  };

  useEffect(() => {
    if (!isAuthModalOpen) return;
    if (!authUser) {
      if (authModalMode === 'profile') {
        setAuthModalMode('login');
      }
    } else if (!authUser.isWorkspace && authModalMode === 'profile') {
      setAuthModalMode('profile');
    }
  }, [isAuthModalOpen, authUser, authModalMode, setAuthModalMode]);

  const handleAuthenticated = (user: AuthUser, toastMessage: string) => {
    setAuthUser(user);
    showToast(toastMessage || `Signed in as ${user.fullName}`, 'success');
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
      if (path === '/login' || path === '/signin' || path === '/signup' || path === '/register') {
        window.history.replaceState(null, '', '/');
      }
    }
    if (currentView !== 'finance' && currentView !== 'learning') {
      setCurrentView('overview');
    }
    setIsAuthModalOpen(false);
    setAuthModalMode('profile');
  };

  return (
    <ModalShell
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      maxWidthClass="max-w-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-warm/50 text-ink">
        <div className="flex items-center gap-2.5">
          <BrandMark size="xs" />
          <h2 className="font-semibold text-sm tracking-tight text-ink font-heading">
            {mode === 'profile'
              ? 'Account & Profile'
              : mode === 'login'
              ? 'Sign In to MOMENTUM'
              : mode === 'signup'
              ? 'Create Account'
              : 'Reset Password'}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover btn-press"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.15, ease: MOMENTUM_EASE }}
          >
            {mode === 'profile' ? (() => {
              const isRegistered = Boolean(authUser && !authUser.isWorkspace);
              const isSignedOut = !authUser;
              const displayName = isSignedOut
                ? 'Signed Out'
                : isRegistered
                ? authUser!.fullName
                : state.profile.fullName;
              const displayEmail = isSignedOut
                ? 'Sign in to sync your account'
                : isRegistered
                ? authUser!.email
                : 'Guest Workspace';

              return (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-warm/70 border border-line">
                    <div className="w-12 h-12 rounded-full bg-surface-inset border-2 border-stone flex items-center justify-center text-lg font-bold text-ink shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-ink truncate font-heading">
                        {displayName}
                      </h3>
                      <p className="text-xs text-ink-muted truncate">{displayEmail}</p>
                      <p
                        className={`mt-1 text-[11px] font-mono font-medium ${
                          isRegistered ? 'text-success' : 'text-stone'
                        }`}
                      >
                        {isRegistered
                          ? 'Authenticated Account'
                          : authUser
                          ? 'Guest Workspace Session'
                          : 'Signed Out'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-ink-muted">
                    <div className="flex justify-between py-1.5 border-b border-line">
                      <span>Timezone</span>
                      <span className="font-mono text-ink font-medium">{state.profile.timezone}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-line">
                      <span>Language</span>
                      <span className="text-ink font-medium">{state.profile.preferredLanguage}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-line">
                      <span>Daily Commitment</span>
                      <span className="font-mono text-accent font-semibold tabular-nums">
                        {state.profile.dailyAvailabilityHours} hours/day
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="w-full py-2.5 px-3 rounded-xl bg-accent hover:bg-accent-hover text-xs font-bold text-accent-ink btn-press flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isRegistered ? 'Switch Account' : 'Sign In / Create Account'}</span>
                    </button>
                    {authUser && (
                      <button
                        type="button"
                        onClick={async () => {
                          await logoutAuth();
                          switchMode('login');
                          showToast('Signed out securely.', 'info');
                          setIsAuthModalOpen(false);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-danger/10 hover:bg-danger/20 text-xs font-semibold text-danger border border-danger/30 btn-press flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <AuthCredentialsForm
                mode={mode as CredentialsMode}
                onModeChange={next => switchMode(next)}
                onAuthenticated={handleAuthenticated}
                showBackToProfile={Boolean(authUser)}
                onBackToProfile={() => switchMode('profile')}
                allowGuestWorkspace={false}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </ModalShell>
  );
};
