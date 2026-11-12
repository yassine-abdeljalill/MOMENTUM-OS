import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Check,
  Compass,
  AlertCircle,
  KeyRound,
  LogOut,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { authApi } from '../../lib/financeApi';
import { ModalShell, MOMENTUM_EASE } from '../common/MotionPrimitives';

type AuthMode = 'login' | 'signup' | 'forgot' | 'profile';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    state,
    authUser,
    setAuthUser,
    logoutAuth,
    showToast,
  } = useApp();

  const prefersReduced = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>('profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength check
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const passwordScore = getPasswordStrength(password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.login({ email, password });
      setAuthUser(user);
      setSuccessMsg('Successfully signed in.');
      showToast(`Signed in as ${user.fullName}`, 'success');
      setPassword('');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMsg('');
        setMode('profile');
      }, 450);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !name) {
      setError('All fields are required for registration.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await authApi.signup({ email, password, fullName: name });
      setAuthUser(user);
      setSuccessMsg('Account created and authenticated!');
      showToast(`Welcome, ${user.fullName}`, 'success');
      setPassword('');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMsg('');
        setMode('profile');
      }, 450);
    } catch (err: any) {
      setError(err?.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Password reset instructions sent to your email.');
    }, 500);
  };

  return (
    <ModalShell
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      maxWidthClass="max-w-md"
      backdropClassName="bg-[#3B2418]/70 backdrop-blur-sm"
      panelClassName="bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#8EC5FF] flex items-center justify-center text-[#3B2418]">
            <Compass className="w-4 h-4 text-[#3B2418]" />
          </div>
          <h2 className="font-semibold text-sm text-[#F2E8DA] uppercase tracking-wider font-mono">
            {mode === 'profile'
              ? 'Account & Profile'
              : mode === 'login'
              ? 'Sign In to MOMENTUM'
              : mode === 'signup'
              ? 'Create MOMENTUM Account'
              : 'Reset Password'}
          </h2>
        </div>
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="p-1 rounded-lg text-[#D8C7B4] hover:text-[#F2E8DA] hover:bg-[#4D3021] btn-press"
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
              className="mb-4 p-3 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 flex items-center gap-2 text-xs text-[#9E3530]"
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
              className="mb-4 p-3 rounded-lg bg-[#3E7B52]/15 border border-[#3E7B52]/40 flex items-center gap-2 text-xs text-[#2D6240]"
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

          {mode === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
                <div className="w-12 h-12 rounded-full bg-[#3B2418] border-2 border-[#8EC5FF] flex items-center justify-center text-lg font-bold text-[#F2E8DA]">
                  {(authUser?.fullName || state.profile.fullName).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#3B2418] truncate">
                    {authUser?.fullName || state.profile.fullName}
                  </h3>
                  <p className="text-xs text-[#6E5648] truncate">
                    {authUser?.email || state.profile.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        authUser
                          ? 'bg-[#3E7B52]/15 text-[#2D6240] border-[#3E7B52]/40'
                          : 'bg-[#8EC5FF]/50 text-[#3B2418] border-[#8EC5FF]'
                      }`}
                    >
                      {authUser ? 'Authenticated Session' : 'Not Signed In (Local Preview)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#6E5648]">
                <div className="flex justify-between py-1 border-b border-[#D6C6B2]">
                  <span>Timezone</span>
                  <span className="font-mono text-[#3B2418] font-medium">{state.profile.timezone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D6C6B2]">
                  <span>Language</span>
                  <span className="text-[#3B2418] font-medium">{state.profile.preferredLanguage}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D6C6B2]">
                  <span>Daily Commitment</span>
                  <span className="font-mono text-[#1E5A99] font-semibold">
                    {state.profile.dailyAvailabilityHours} hours/day
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setMode('login');
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-xs font-bold text-[#3B2418] border border-[#3B2418]/15 btn-press flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{authUser ? 'Switch Account' : 'Sign In / Create Account'}</span>
                </button>
                {authUser && (
                  <button
                    onClick={async () => {
                      await logoutAuth();
                      showToast('Signed out securely.', 'info');
                      setIsAuthModalOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-[#B84A44]/10 hover:bg-[#B84A44]/20 text-xs font-medium text-[#9E3530] border border-[#B84A44]/30 btn-press flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6E5648] mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#6E5648]">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#1E5A99] hover:underline font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#6E5648] hover:text-[#3B2418]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-md btn-press disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-[#6E5648] border-t border-[#D6C6B2]">
                <button
                  type="button"
                  onClick={() => setMode('profile')}
                  className="hover:text-[#3B2418]"
                >
                  ← Back to Profile
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#1E5A99] hover:underline font-medium"
                >
                  Don&apos;t have an account? Sign Up
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6E5648] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E5648] mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E5648] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#6E5648] hover:text-[#3B2418]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength indicators */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={`flex-1 rounded-full ${
                            passwordScore >= idx
                              ? passwordScore <= 2
                                ? 'bg-[#8EC5FF]'
                                : 'bg-[#3E7B52]'
                              : 'bg-[#D6C6B2]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#6E5648]">
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
                className="w-full py-2.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-md btn-press disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Creating...' : 'Register Account'}</span>
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-[#6E5648] border-t border-[#D6C6B2]">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#1E5A99] hover:underline font-medium"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-[#6E5648]">
                Enter your registered email address and we will generate a secure reset link.
              </p>
              <div>
                <label className="block text-xs font-medium text-[#6E5648] mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-md btn-press disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-[#6E5648] hover:text-[#3B2418]"
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
