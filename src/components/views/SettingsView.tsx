import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Palette,
  Sliders,
  Bell,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Check,
  Compass,
  Key,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../lib/context';
import { exportStateToJson, exportTasksToCsv, exportGoalsToCsv } from '../../lib/storage';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';

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

  // Profile Form state
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
          Settings & System Controls
        </h1>
        <p className="text-xs text-[#6E5648] mt-1">
          Customize your Life OS profile, aesthetics, data backups, and integrations.
        </p>

        {/* Success Alert */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-lg bg-[#3E7B52]/15 border border-[#3E7B52]/40 text-xs font-medium text-[#2D6240] flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{successToast}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#FAF5ED] p-1.5 rounded-xl border border-[#D6C6B2] shadow-xs text-xs">
        {(
          [
            { id: 'profile', label: 'Profile & Vision', icon: User },
            { id: 'appearance', label: 'Appearance & Preferences', icon: Palette },
            { id: 'integrations', label: 'Supabase & Notion', icon: Database },
            { id: 'data', label: 'Data & Backups', icon: Sliders },
          ] as const
        ).map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isActive ? 'text-[#3B2418]' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="settings-tab-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-[#8EC5FF] shadow-xs"
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

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
            className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-5"
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              Personal Identity & Vision Statement
            </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">
                Daily Availability Commitment (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="12"
                value={hours}
                onChange={e => setHours(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              Personal Vision Statement (&ldquo;Track who you are becoming&rdquo;)
            </label>
            <textarea
              rows={3}
              value={vision}
              onChange={e => setVision(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="btn-press text-xs font-semibold text-[#1E5A99] hover:underline"
            >
              Relaunch Onboarding Setup
            </button>
            <button
              type="submit"
              className="btn-press px-5 py-2 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-all"
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
          className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-6"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
            Visual Identity & Palette Tokens
          </h2>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#6E5648] block">
              Official MOMENTUM Palette (Active Theme Tokens):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card-hover p-3 rounded-xl bg-[#F2E8DA] text-[#3B2418] text-xs font-mono space-y-1 border border-[#D6C6B2]">
                <span className="font-bold block">Main Cream</span>
                <span className="text-[11px] opacity-80">#F2E8DA</span>
              </div>
              <div className="card-hover p-3 rounded-xl bg-[#3B2418] text-[#F2E8DA] text-xs font-mono space-y-1 border border-[#5A3927]">
                <span className="font-bold block">Espresso</span>
                <span className="text-[11px] opacity-80">#3B2418</span>
              </div>
              <div className="card-hover p-3 rounded-xl bg-[#8EC5FF] text-[#3B2418] text-xs font-mono space-y-1 border border-[#3B2418]/15">
                <span className="font-bold block">Detail Sky</span>
                <span className="text-[11px] opacity-90">#8EC5FF</span>
              </div>
              <div className="card-hover p-3 rounded-xl bg-[#FAF5ED] text-[#3B2418] text-xs font-mono space-y-1 border border-[#D6C6B2]">
                <span className="font-bold block">Elevated Cream</span>
                <span className="text-[11px] opacity-80">#FAF5ED</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#D6C6B2]">
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Start of Week</label>
              <select
                value={state.preferences.startOfWeek}
                onChange={e => updatePreferences({ startOfWeek: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              >
                <option value="monday">Monday (ISO Standard)</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Time Format</label>
              <select
                value={state.preferences.timeFormat}
                onChange={e => updatePreferences({ timeFormat: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
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
          className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              External Integration Architecture
            </h2>
            <p className="text-xs text-[#6E5648]">
              Connect remote PostgreSQL via Supabase or bidirectional sync with your Notion workspace.
            </p>
          </div>

          {/* Supabase Card */}
          <div className="card-hover p-5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#3E7B52]" />
                <h3 className="text-sm font-bold text-[#3B2418]">Supabase PostgreSQL & Auth</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3B2418] text-[#8EC5FF]">
                Client Ready (Using Offline Storage)
              </span>
            </div>
            <p className="text-xs text-[#6E5648] leading-relaxed">
              To connect your live Supabase cloud project, configure <code className="text-[#1E5A99] font-semibold">VITE_SUPABASE_URL</code> and <code className="text-[#1E5A99] font-semibold">VITE_SUPABASE_ANON_KEY</code> in your environment. The complete PostgreSQL migration script with all 30 normalized tables and RLS security policies is stored at <code className="text-[#3B2418]">supabase/migrations/20261109000000_momentum_core.sql</code>.
            </p>
          </div>

          {/* Notion Card */}
          <div className="card-hover p-5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1E5A99]" />
                <h3 className="text-sm font-bold text-[#3B2418]">Notion Life OS Sync</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF5ED] border border-[#D6C6B2] text-[#6E5648]">
                Modular API Layer
              </span>
            </div>
            <p className="text-xs text-[#6E5648] leading-relaxed">
              MOMENTUM can optionally synchronize tasks, milestones, and notes with an external Notion Life OS database using Notion&apos;s official REST API and server-side secret tokens. MOMENTUM operates completely independently when Notion is disconnected.
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
          className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              Data Privacy & Local Storage
            </h2>
            <p className="text-xs text-[#6E5648]">
              You own your data completely. Export full JSON snapshots, reload demo data, or clear the local sandbox.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-hover p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
              <h3 className="text-xs font-bold text-[#3B2418] flex items-center gap-2">
                <Download className="w-4 h-4 text-[#1E5A99]" />
                <span>Export Backups</span>
              </h3>
              <p className="text-xs text-[#6E5648]">
                Download your complete profile, goals, habits, workouts, and journal entries in JSON format.
              </p>
              <button
                onClick={handleExportJson}
                className="btn-press w-full py-2 rounded-lg bg-[#8EC5FF] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs hover:bg-[#73B6FC] shadow-xs transition-colors"
              >
                Download Full JSON Backup
              </button>
            </div>

            <div className="card-hover p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
              <h3 className="text-xs font-bold text-[#3B2418] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#6E5648]" />
                <span>Restore Backup</span>
              </h3>
              <p className="text-xs text-[#6E5648]">
                Import a previous MOMENTUM JSON state file to restore all your data.
              </p>
              <label className="btn-press w-full py-2 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-[#3B2418] font-semibold text-xs hover:bg-[#EAE0D0] cursor-pointer flex items-center justify-center transition-colors">
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

          {/* Reset & Wipe Options */}
          <div className="p-4 rounded-xl bg-[#F2E8DA] border border-[#B84A44]/40 space-y-3">
            <h3 className="text-xs font-bold text-[#9E3530] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B84A44]" />
              <span>Danger Zone: Demo & Local Reset</span>
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  resetToDemoData();
                  notify('Reset to realistic demonstration data.', 'info');
                }}
                className="btn-press px-4 py-2 rounded-lg bg-[#3B2418] hover:bg-[#4D3021] text-xs font-semibold text-[#F2E8DA] border border-[#5A3927] transition-colors"
              >
                Reload Realistic Sample/Demo Data
              </button>

              <AnimatePresence mode="wait">
                {!showClearConfirm ? (
                  <motion.button
                    key="clear-trigger"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setShowClearConfirm(true)}
                    className="btn-press px-4 py-2 rounded-lg bg-[#B84A44]/15 hover:bg-[#B84A44]/25 text-xs font-semibold text-[#9E3530] border border-[#B84A44]/40 transition-colors"
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
                    <span className="text-xs font-semibold text-[#9E3530]">Are you sure?</span>
                    <button
                      onClick={() => {
                        clearAllData();
                        setShowClearConfirm(false);
                        notify('All local data cleared.', 'info');
                      }}
                      className="btn-press px-3 py-1.5 rounded-lg bg-[#B84A44] text-[#FAF5ED] text-xs font-bold"
                    >
                      Yes, Wipe Data
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="btn-press px-3 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#6E5648] hover:text-[#3B2418]"
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
