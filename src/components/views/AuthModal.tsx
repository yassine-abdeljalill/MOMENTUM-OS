import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  KeyRound,
  LogOut,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp, type AuthModalMode } from '../../lib/context';
import { authApi } from '../../lib/financeApi';
import { ModalShell, MOMENTUM_EASE } from '../common/MotionPrimitives';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode: AuthModalMode) => {
    setError('');
    setSuccessMsg('');
    setAuthModalMode(nextMode);
  };

  useEffect(() => {
    if (!isAuthModalOpen) return;
    setError('');
    setSuccessMsg('');
    if (!authUser) {
      if (authModalMode === 'profile') {
        setAuthModalMode('login');
      }
    } else if (!authUser.isWorkspace && authModalMode === 'profile') {
      setAuthModalMode('profile');
    }
  }, [isAuthModalOpen]);

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(password);

  const finishAuthSuccess = (userName: string, toastMessage: string) => {
    showToast(toastMessage || `Signed in as ${userName}`, 'success');
    setPassword('');
    setError('');
    setSuccessMsg('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError('Please provide your email and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.login({ email: trimmedEmail, password });
      setAuthUser(user);
      finishAuthSuccess(user.fullName, `Signed in as ${user.fullName}`);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password || !trimmedName) {
      setError('All fields are required for registration.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.signup({
        email: trimmedEmail,
        password,
        fullName: trimmedName,
      });
      setAuthUser(user);
      finishAuthSuccess(user.fullName, `Welcome, ${user.fullName}`);
    } catch (err: any) {
      setError(err?.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('If an account exists for that email, password reset instructions have been sent.');
    }, 350);
  };

  const inputCls =
    'w-full pl-9 pr-3 py-2 rounded-xl bg-surface-warm/70 border border-line text-ink text-xs focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden';

  return (
    <ModalShell
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      maxWidthClass="max-w-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-warm/50 text-ink">
        <div className="flex items-center gap-2.5">
          <img
            src="/brand-logo.png"
            alt="MOMENTUM logo"
            className="w-6 h-6 rounded-md object-contain shrink-0"
          />
          <h2 className="font-semibold text-sm uppercase tracking-wider font-mono">
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
        <AnimatePresence>
          {error && (
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.15 }}
              className="mb-4 p-3 rounded-xl bg-danger/12 border border-danger/35 flex items-center gap-2 text-xs text-danger"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.15 }}
              className="mb-4 p-3 rounded-xl bg-success/12 border border-success/35 flex items-center gap-2 text-xs text-success"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.15, ease: MOMENTUM_EASE }}
          >
            {mode === 'profile' && (() => {
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
                : state.profile.email;

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
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                            isRegistered
                              ? 'bg-success/12 text-success border-success/35'
                              : 'bg-stone/15 text-stone border-stone/35'
                          }`}
                        >
                          {isRegistered
                            ? 'Authenticated Account'
                            : authUser
                            ? 'Active Workspace Session'
                            : 'Signed Out'}
                        </span>
                      </div>
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
            })()}

            {mode === 'login' && (
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-ink-muted">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] text-accent hover:underline font-medium"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-9`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-ink-muted hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-bold text-xs shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                </button>

                <div className="flex items-center justify-between pt-3 text-xs text-ink-muted border-t border-line">
                  <button
                    type="button"
                    onClick={() => switchMode('profile')}
                    className="hover:text-ink"
                  >
                    ← Back to Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-accent hover:underline font-medium"
                  >
                    Don&apos;t have an account? Sign Up
                  </button>
                </div>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={handleSignUp} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={`${inputCls} pr-9`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-ink-muted hover:text-ink"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map(idx => (
                          <div
                            key={idx}
                            className={`flex-1 rounded-full ${
                              passwordScore >= idx
                                ? passwordScore <= 2
                                  ? 'bg-accent'
                                  : 'bg-success'
                                : 'bg-surface-inset'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-ink-muted">
                        {passwordScore <= 1
                          ? 'Weak password'
                          : passwordScore <= 3
                          ? 'Moderate strength'
                          : 'Strong password'}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-bold text-xs shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Creating...' : 'Register Account'}</span>
                </button>

                <div className="flex items-center justify-between pt-3 text-xs text-ink-muted border-t border-line">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-accent hover:underline font-medium"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgot} noValidate className="space-y-4">
                <p className="text-xs text-ink-muted">
                  Enter your registered email address and we will generate a secure reset link.
                </p>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-bold text-xs shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs text-ink-muted hover:text-ink"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </ModalShell>
  );
};
