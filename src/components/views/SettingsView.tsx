import React, { useState } from 'react';
import {
  User,
  Palette,
  Sliders,
  Database,
  Download,
  Upload,
  Check,
  Compass,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../lib/context';
import { exportStateToJson } from '../../lib/storage';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { GlassSegmentedControl } from '../common/LiquidGlass';

export const SettingsView: React.FC = () => {
  const {
    state,
    updateProfile,
    updatePreferences,
    resetToDemoData,
    clearAllData,
    importStateFromJson,
    setIsOnboardingOpen,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'integrations' | 'data'>('profile');
  const [successToast, setSuccessToast] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [name, setName] = useState(state.profile.fullName);
  const [email, setEmail] = useState(state.profile.email);
  const [timezone, setTimezone] = useState(state.profile.timezone);
  const [vision, setVision] = useState(state.profile.visionStatement || '');
  const [hours, setHours] = useState(state.profile.dailyAvailabilityHours || 3.5);

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setSuccessToast(msg);
    showToast(msg, type);
    setTimeout(() => setSuccessToast(''), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: name,
      email,
      timezone,
      visionStatement: vision,
      dailyAvailabilityHours: Number(hours),
    });
    notify('Profile updated successfully.');
  };

  const handleExportJson = () => {
    const json = exportStateToJson(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Full JSON backup exported.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importStateFromJson(content);
        if (ok) {
          notify('Data imported successfully.');
        } else {
          showToast('Invalid backup file format.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const paletteSwatches = [
    { name: 'Primary Canvas', hex: '#1A1A1D', bg: 'bg-[#1A1A1D] text-[#F5F1E9] border-[#393940]' },
    { name: 'Elevated Surface', hex: '#242428', bg: 'bg-[#242428] text-[#F5F1E9] border-[#393940]' },
    { name: 'Secondary Card', hex: '#2A2A2F', bg: 'bg-[#2A2A2F] text-[#F5F1E9] border-[#393940]' },
    { name: 'Warm Beige', hex: '#D2925B', bg: 'bg-[#D2925B] text-[#1A1A1D] border-[#DF9F68]' },
    { name: 'MOMENTUM Blue', hex: '#9ECCFD', bg: 'bg-[#9ECCFD] text-[#1A1A1D] border-[#B4D7FE]' },
    { name: 'Muted Sage', hex: '#868A7A', bg: 'bg-[#868A7A] text-[#F5F1E9] border-[#393940]' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-surface border border-line">
        <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
          Settings & System Controls
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Customize your Life OS profile, color system overview, data backups, and integrations.
        </p>

        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-success/15 border border-success/40 text-xs font-medium text-success flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{successToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Navigation Tabs */}
      <GlassSegmentedControl
        value={activeTab}
        onChange={setActiveTab}
        layoutId="settings-tab-pill"
        options={[
          { id: 'profile', label: 'Profile & Vision', icon: User },
          { id: 'appearance', label: 'Appearance & Preferences', icon: Palette },
          { id: 'integrations', label: 'Supabase & Notion', icon: Database },
          { id: 'data', label: 'Data & Backups', icon: Sliders },
        ]}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Profile & Vision */}
        {activeTab === 'profile' && (
          <motion.form
            key="settings-profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl bg-surface border border-line space-y-5"
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              Personal Identity & Vision Statement
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Daily Availability Commitment (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={hours}
                  onChange={e => setHours(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs font-mono text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Personal Vision Statement (&ldquo;Track who you are becoming&rdquo;)
              </label>
              <textarea
                rows={3}
                value={vision}
                onChange={e => setVision(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="btn-press text-xs font-semibold text-accent hover:underline"
              >
                Relaunch Onboarding Setup
              </button>
              <button
                type="submit"
                className="btn-press glass-accent-pill px-5 py-2 rounded-xl text-accent-ink font-semibold text-xs transition-all"
              >
                Save Profile
              </button>
            </div>
          </motion.form>
        )}

        {/* Tab 2: Appearance & Preferences */}
        {activeTab === 'appearance' && (
          <motion.div
            key="settings-appearance"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
            className="p-6 rounded-2xl bg-surface border border-line space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                  Official Dark Color System & Liquid Glass
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Deep obsidian canvas (#1A1A1D) paired with warm beige (#D2925B) and MOMENTUM blue (#9ECCFD) accents, framed by translucent Liquid Glass controls.
                </p>
              </div>

              <span className="glass-blue-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-brand-blue">
                <Sparkles className="w-3.5 h-3.5" />
                Official Palette Active
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-line">
              <span className="text-xs font-semibold text-ink-muted block">
                Official MOMENTUM Palette Tokens:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {paletteSwatches.map(swatch => (
                  <div
                    key={swatch.hex}
                    className={`card-hover p-3 rounded-xl text-xs font-mono space-y-1 border ${swatch.bg}`}
                  >
                    <span className="font-bold block truncate">{swatch.name}</span>
                    <span className="text-[11px] opacity-85">{swatch.hex}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-line">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Start of Week</label>
                <select
                  value={state.preferences.startOfWeek}
                  onChange={e => updatePreferences({ startOfWeek: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                >
                  <option value="monday">Monday (ISO Standard)</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Time Format</label>
                <select
                  value={state.preferences.timeFormat}
                  onChange={e => updatePreferences({ timeFormat: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                >
                  <option value="24h">24-hour (14:00)</option>
                  <option value="12h">12-hour (2:00 PM)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Supabase & Notion Integrations */}
        {activeTab === 'integrations' && (
          <motion.div
            key="settings-integrations"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
            className="p-6 rounded-2xl bg-surface border border-line space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                External Integration Architecture
              </h2>
              <p className="text-xs text-ink-muted">
                Connect remote PostgreSQL via Supabase or bidirectional sync with your Notion workspace.
              </p>
            </div>

            <div className="card-hover p-5 rounded-xl bg-canvas border border-line space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-success" />
                  <h3 className="text-sm font-bold text-ink">Supabase PostgreSQL & Auth</h3>
                </div>
                <span className="text-[11px] font-mono text-accent">
                  Client Ready (Offline Storage Active)
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                To connect your live Supabase cloud project, configure{' '}
                <code className="text-accent font-semibold">VITE_SUPABASE_URL</code> and{' '}
                <code className="text-accent font-semibold">VITE_SUPABASE_ANON_KEY</code> in your environment. The
                complete PostgreSQL migration script with all 30 normalized tables and RLS security policies is stored at{' '}
                <code className="text-ink">supabase/migrations/20261109000000_momentum_core.sql</code>.
              </p>
            </div>

            <div className="card-hover p-5 rounded-xl bg-canvas border border-line space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-bold text-ink">Notion Life OS Sync</h3>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">Modular API Layer</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                MOMENTUM can optionally synchronize tasks, milestones, and notes with an external Notion Life OS database
                using Notion&apos;s official REST API and server-side secret tokens. MOMENTUM operates completely
                independently when Notion is disconnected.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Data & Backups */}
        {activeTab === 'data' && (
          <motion.div
            key="settings-data"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
            className="p-6 rounded-2xl bg-surface border border-line space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
                Data Privacy & Local Storage
              </h2>
              <p className="text-xs text-ink-muted">
                You own your data completely. Export full JSON snapshots, reload demo data, or clear the local sandbox.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-hover p-4 rounded-xl bg-canvas border border-line space-y-3">
                <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                  <Download className="w-4 h-4 text-accent" />
                  <span>Export Backups</span>
                </h3>
                <p className="text-xs text-ink-muted">
                  Download your complete profile, goals, habits, workouts, and journal entries in JSON format.
                </p>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="btn-press glass-accent-pill w-full py-2 rounded-xl text-accent-ink font-semibold text-xs transition-colors"
                >
                  Download Full JSON Backup
                </button>
              </div>

              <div className="card-hover p-4 rounded-xl bg-canvas border border-line space-y-3">
                <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                  <Upload className="w-4 h-4 text-ink-muted" />
                  <span>Restore Backup</span>
                </h3>
                <p className="text-xs text-ink-muted">
                  Import a previous MOMENTUM JSON state file to restore all your data.
                </p>
                <label className="btn-press glass-control w-full py-2 rounded-xl text-ink font-semibold text-xs cursor-pointer flex items-center justify-center transition-colors">
                  <span>Select JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-canvas border border-danger/40 space-y-3">
              <h3 className="text-xs font-bold text-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Danger Zone: Demo & Local Reset</span>
              </h3>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetToDemoData();
                    notify('Reset to realistic demonstration data.', 'info');
                  }}
                  className="btn-press glass-control px-4 py-2 rounded-xl text-xs font-semibold text-ink transition-colors"
                >
                  Reload Realistic Sample/Demo Data
                </button>

                <AnimatePresence mode="wait">
                  {!showClearConfirm ? (
                    <motion.button
                      key="clear-trigger"
                      type="button"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setShowClearConfirm(true)}
                      className="btn-press px-4 py-2 rounded-xl bg-danger/15 hover:bg-danger/25 text-xs font-semibold text-danger border border-danger/40 transition-colors"
                    >
                      Clear All Data (Blank Slate)
                    </motion.button>
                  ) : (
                    <motion.div
                      key="clear-confirm"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.18, ease: MOMENTUM_EASE }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-xs font-semibold text-danger">Are you sure?</span>
                      <button
                        type="button"
                        onClick={() => {
                          clearAllData();
                          setShowClearConfirm(false);
                          notify('All local data cleared.', 'info');
                        }}
                        className="btn-press px-3 py-1.5 rounded-xl bg-danger text-white text-xs font-bold"
                      >
                        Yes, Wipe Data
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="btn-press px-3 py-1.5 rounded-xl bg-surface border border-line text-xs text-ink-muted hover:text-ink"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
