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
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../lib/context';

type AuthMode = 'login' | 'signup' | 'forgot' | 'profile';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    state,
    updateProfile,
    resetToDemoData,
    clearAllData,
  } = useApp();

  const [mode, setMode] = useState<AuthMode>('profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      updateProfile({ email, fullName: email.split('@')[0] });
      setSuccessMsg('Successfully signed in.');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMsg('');
      }, 700);
    }, 500);
  };

  const handleSignUp = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setLoading(false);
      updateProfile({ email, fullName: name, onboardingCompleted: true });
      setSuccessMsg('Account created successfully!');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setSuccessMsg('');
      }, 700);
    }, 500);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#434D56]/60 bg-[#22292F]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#D2925B] flex items-center justify-center text-[#242B31]">
              <Compass className="w-4 h-4 text-[#242B31]" />
            </div>
            <h2 className="font-semibold text-sm text-[#F4F0E9] uppercase tracking-wider font-mono">
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
            className="p-1 rounded-lg text-[#868A7A] hover:text-[#F4F0E9] hover:bg-[#2E373F]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#B9534F]/20 border border-[#B9534F]/40 flex items-center gap-2 text-xs text-[#E57373]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-[#5B8C67]/20 border border-[#5B8C67]/40 flex items-center gap-2 text-xs text-[#5B8C67]">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#2E373F] border border-[#434D56]">
                <div className="w-12 h-12 rounded-full bg-[#868A7A]/30 border border-[#868A7A] flex items-center justify-center text-lg font-bold text-[#F4F0E9]">
                  {state.profile.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#F4F0E9] truncate">
                    {state.profile.fullName}
                  </h3>
                  <p className="text-xs text-[#A8A8A2] truncate">{state.profile.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#64432B] text-[#D2925B]">
                      {state.isDemoMode ? 'Active Session: Demo Mode' : 'Authenticated'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#A8A8A2]">
                <div className="flex justify-between py-1 border-b border-[#434D56]/40">
                  <span>Timezone</span>
                  <span className="font-mono text-[#F4F0E9]">{state.profile.timezone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#434D56]/40">
                  <span>Language</span>
                  <span className="text-[#F4F0E9]">{state.profile.preferredLanguage}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#434D56]/40">
                  <span>Daily Commitment</span>
                  <span className="font-mono text-[#D2925B]">
                    {state.profile.dailyAvailabilityHours} hours/day
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setMode('login')}
                  className="w-full py-2 px-3 rounded-lg bg-[#2E373F] hover:bg-[#36414A] text-xs font-semibold text-[#F4F0E9] border border-[#434D56] transition-colors flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#D2925B]" />
                  <span>Switch Account / Sign In</span>
                </button>
                <button
                  onClick={() => {
                    clearAllData();
                    setIsAuthModalOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#B9534F]/10 hover:bg-[#B9534F]/20 text-xs font-medium text-[#E57373] border border-[#B9534F]/30 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out (Clear Local Session)</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#868A7A] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#A8A8A2]">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#D2925B] hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#868A7A] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#868A7A] hover:text-[#F4F0E9]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-[#A8A8A2] border-t border-[#434D56]/60">
                <button
                  type="button"
                  onClick={() => setMode('profile')}
                  className="hover:text-[#F4F0E9]"
                >
                  ← Back to Profile
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#D2925B] hover:underline font-medium"
                >
                  Don&apos;t have an account? Sign Up
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#868A7A] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#868A7A] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#868A7A] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#868A7A] hover:text-[#F4F0E9]"
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
                                ? 'bg-[#D2925B]'
                                : 'bg-[#5B8C67]'
                              : 'bg-[#434D56]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#868A7A]">
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
                className="w-full py-2.5 rounded-lg bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Register Account'}
              </button>

              <div className="flex items-center justify-between pt-3 text-xs text-[#A8A8A2] border-t border-[#434D56]/60">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#D2925B] hover:underline font-medium"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-[#A8A8A2]">
                Enter your registered email address and we will generate a secure reset link.
              </p>
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#868A7A] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
