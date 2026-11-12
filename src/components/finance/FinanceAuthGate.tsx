import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../lib/context';
import { authApi } from '../../lib/financeApi';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';

export const FinanceAuthGate: React.FC = () => {
  const { setAuthUser, showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      const { user } =
        mode === 'signup'
          ? await authApi.signup({ email: email.trim(), password, fullName: fullName.trim() })
          : await authApi.login({ email: email.trim(), password });

      setAuthUser(user);
      showToast(
        mode === 'signup'
          ? `Private Finance Vault initialized for ${user.fullName}.`
          : `Welcome back, ${user.fullName}.`,
        'success'
      );
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: MOMENTUM_EASE }}
        className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-[#D6C6B2] shadow-lg bg-[#FAF5ED]"
      >
        {/* Left Info Panel */}
        <div className="lg:col-span-5 bg-[#3B2418] text-[#F2E8DA] p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#8EC5FF] text-[#3B2418] flex items-center justify-center shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-[#4D3021] text-[#8EC5FF] border border-[#5A3927]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Private Financial Vault
              </span>
              <h2 className="text-xl font-bold tracking-tight text-[#F2E8DA]">
                MOMENTUM Finance Center
              </h2>
              <p className="text-xs text-[#D8C7B4] leading-relaxed">
                Sign in or create your personal account to manage income, expenses, budgets, savings goals, and recurring bills in complete privacy.
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 text-xs text-[#E6D8C7]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8EC5FF] shrink-0 mt-0.5" />
              <span>Strict per-user isolation & protected server endpoints</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8EC5FF] shrink-0 mt-0.5" />
              <span>Default Moroccan Dirham (MAD) with multi-currency support</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8EC5FF] shrink-0 mt-0.5" />
              <span>Clean workspace for new accounts — zero fake data</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8EC5FF] shrink-0 mt-0.5" />
              <span>No banking credentials or external bank links stored</span>
            </li>
          </ul>
        </div>

        {/* Right Auth Form */}
        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-center">
          <div className="flex gap-1 p-1 rounded-xl bg-[#EAE0D0] border border-[#D6C6B2] mb-6 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors btn-press ${
                mode === 'signup'
                  ? 'bg-[#8EC5FF] text-[#3B2418] shadow-xs'
                  : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors btn-press ${
                mode === 'login'
                  ? 'bg-[#8EC5FF] text-[#3B2418] shadow-xs'
                  : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Sign In
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 flex items-center gap-2 text-xs text-[#9E3530]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Yassine Abdelljalil"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6E5648] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                  className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-2.5 text-[#6E5648] hover:text-[#3B2418]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-sm btn-press disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'signup'
                  ? 'Create Account & Unlock Finance'
                  : 'Sign In to Finance Vault'}
              </span>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
