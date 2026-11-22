import React, { useId, useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { authApi } from '../../lib/financeApi';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import type { AuthUser } from '../../types';

export type CredentialsMode = 'login' | 'signup' | 'forgot';

interface AuthCredentialsFormProps {
  mode: CredentialsMode;
  onModeChange: (mode: CredentialsMode) => void;
  onAuthenticated: (user: AuthUser, toastMessage: string) => void;
  showBackToProfile?: boolean;
  onBackToProfile?: () => void;
  allowGuestWorkspace?: boolean;
}

export const AuthCredentialsForm: React.FC<AuthCredentialsFormProps> = ({
  mode,
  onModeChange,
  onAuthenticated,
  showBackToProfile = false,
  onBackToProfile,
  allowGuestWorkspace = false,
}) => {
  const { state } = useApp();
  const prefersReduced = useReducedMotion();
  const baseId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const switchMode = (nextMode: CredentialsMode) => {
    setError('');
    setSuccessMsg('');
    onModeChange(nextMode);
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(password);

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
      setPassword('');
      onAuthenticated(user, `Signed in as ${user.fullName}`);
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
      setPassword('');
      onAuthenticated(user, `Welcome, ${user.fullName}`);
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

  const handleContinueAsGuest = async () => {
    setError('');
    setSuccessMsg('');
    setGuestLoading(true);
    try {
      const { user } = await authApi.ensureWorkspaceSession(state.profile.fullName);
      onAuthenticated(user, 'Entered personal workspace');
    } catch (err: any) {
      setError(err?.message || 'Unable to start guest workspace.');
    } finally {
      setGuestLoading(false);
    }
  };

  const inputCls =
    'w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-warm/70 border border-line text-ink text-xs placeholder:text-ink-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden transition-colors';

  return (
    <div>
      <AnimatePresence>
        {error && (
          <motion.div
            role="alert"
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
            role="status"
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
          {mode === 'login' && (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor={`${baseId}-login-email`}
                  className="block text-xs font-medium text-ink-muted mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    id={`${baseId}-login-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={`${baseId}-login-password`}
                    className="text-xs font-medium text-ink-muted"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    id={`${baseId}-login-password`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
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
                    className="absolute right-3 top-3 text-ink-muted hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || guestLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-ink-muted border-t border-line">
                {showBackToProfile && onBackToProfile ? (
                  <button
                    type="button"
                    onClick={onBackToProfile}
                    className="hover:text-ink transition-colors"
                  >
                    ← Back to Profile
                  </button>
                ) : (
                  <span>New to MOMENTUM?</span>
                )}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-accent hover:underline font-medium"
                >
                  Create account
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor={`${baseId}-signup-name`}
                  className="block text-xs font-medium text-ink-muted mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    id={`${baseId}-signup-name`}
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Alex Vance"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-signup-email`}
                  className="block text-xs font-medium text-ink-muted mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    id={`${baseId}-signup-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-signup-password`}
                  className="block text-xs font-medium text-ink-muted mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    id={`${baseId}-signup-password`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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
                    className="absolute right-3 top-3 text-ink-muted hover:text-ink"
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
                disabled={loading || guestLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-ink-muted border-t border-line">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-accent hover:underline font-medium"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} noValidate className="space-y-4">
              <p className="text-xs text-ink-muted leading-relaxed">
                Enter your registered email address and we will send password reset instructions.
              </p>
              <div>
                <label
                  htmlFor={`${baseId}-forgot-email`}
                  className="block text-xs font-medium text-ink-muted mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    id={`${baseId}-forgot-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
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
                disabled={loading || guestLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Sending...' : 'Send Reset Instructions'}</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      {allowGuestWorkspace && mode !== 'forgot' && (
        <div className="mt-5 pt-4 border-t border-line">
          <button
            type="button"
            disabled={loading || guestLoading}
            onClick={handleContinueAsGuest}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-warm/60 hover:bg-surface-warm border border-line text-xs font-medium text-stone hover:text-ink transition-colors btn-press disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {guestLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Continue as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
