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
import { useApp } from '../../lib/context';
import { exportStateToJson, exportTasksToCsv, exportGoalsToCsv } from '../../lib/storage';

export const SettingsView: React.FC = () => {
  const {
    state,
    updateProfile,
    updatePreferences,
    resetToDemoData,
    clearAllData,
    importStateFromJson,
    setIsOnboardingOpen,
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

  const notify = (msg: string) => {
    setSuccessToast(msg);
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
          alert('Invalid backup file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
        <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
          Settings & System Controls
        </h1>
        <p className="text-xs text-[#A8A8A2] mt-1">
          Customize your Life OS profile, aesthetics, data backups, and integrations.
        </p>

        {/* Success Alert */}
        {successToast && (
          <div className="mt-4 p-3 rounded-lg bg-[#5B8C67]/20 border border-[#5B8C67]/40 text-xs text-[#5B8C67] flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex bg-[#242B31] p-1.5 rounded-xl border border-[#434D56] text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'profile' ? 'bg-[#D2925B] text-[#242B31]' : 'text-[#868A7A] hover:text-[#F4F0E9]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Vision</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'appearance' ? 'bg-[#D2925B] text-[#242B31]' : 'text-[#868A7A] hover:text-[#F4F0E9]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance & Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'integrations' ? 'bg-[#D2925B] text-[#242B31]' : 'text-[#868A7A] hover:text-[#F4F0E9]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase & Notion</span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === 'data' ? 'bg-[#D2925B] text-[#242B31]' : 'text-[#868A7A] hover:text-[#F4F0E9]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Data & Backups</span>
        </button>
      </div>

      {/* Tab 1: Profile & Vision */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
            Personal Identity & Vision Statement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">
                Daily Availability Commitment (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="12"
                value={hours}
                onChange={e => setHours(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">
              Personal Vision Statement (&ldquo;Track who you are becoming&rdquo;)
            </label>
            <textarea
              rows={3}
              value={vision}
              onChange={e => setVision(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#434D56]/60">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-xs text-[#D2925B] hover:underline"
            >
              Relaunch Onboarding Setup
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-sm transition-all"
            >
              Save Profile
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Appearance & Preferences */}
      {activeTab === 'appearance' && (
        <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
            Visual Identity & Palette Tokens
          </h2>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#A8A8A2] block">
              Official MOMENTUM Palette (Mandatory Brand Constants):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#64432B] text-[#F4F0E9] text-xs font-mono space-y-1 border border-[#7E5437]">
                <span className="font-bold block">Primary Brown</span>
                <span className="text-[11px] opacity-80">#64432B</span>
              </div>
              <div className="p-3 rounded-xl bg-[#D2925B] text-[#242B31] text-xs font-mono space-y-1">
                <span className="font-bold block">Warm Amber</span>
                <span className="text-[11px] opacity-90">#D2925B</span>
              </div>
              <div className="p-3 rounded-xl bg-[#333C44] text-[#F4F0E9] text-xs font-mono space-y-1 border border-[#434D56]">
                <span className="font-bold block">Charcoal Blue</span>
                <span className="text-[11px] opacity-80">#333C44</span>
              </div>
              <div className="p-3 rounded-xl bg-[#868A7A] text-[#242B31] text-xs font-mono space-y-1">
                <span className="font-bold block">Muted Sage</span>
                <span className="text-[11px] opacity-90">#868A7A</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#434D56]/60">
            <div>
              <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Start of Week</label>
              <select
                value={state.preferences.startOfWeek}
                onChange={e => updatePreferences({ startOfWeek: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
              >
                <option value="monday">Monday (ISO Standard)</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Time Format</label>
              <select
                value={state.preferences.timeFormat}
                onChange={e => updatePreferences({ timeFormat: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
              >
                <option value="24h">24-hour (14:00)</option>
                <option value="12h">12-hour (2:00 PM)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Supabase & Notion Integrations */}
      {activeTab === 'integrations' && (
        <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
              External Integration Architecture
            </h2>
            <p className="text-xs text-[#A8A8A2]">
              Connect remote PostgreSQL via Supabase or bidirectional sync with your Notion workspace.
            </p>
          </div>

          {/* Supabase Card */}
          <div className="p-5 rounded-xl bg-[#242B31] border border-[#434D56] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#5B8C67]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">Supabase PostgreSQL & Auth</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2E373F] text-[#D2925B]">
                Client Ready (Using Offline Storage)
              </span>
            </div>
            <p className="text-xs text-[#A8A8A2] leading-relaxed">
              To connect your live Supabase cloud project, configure <code className="text-[#D2925B]">VITE_SUPABASE_URL</code> and <code className="text-[#D2925B]">VITE_SUPABASE_ANON_KEY</code> in your environment. The complete PostgreSQL migration script with all 30 normalized tables and RLS security policies is stored at <code className="text-[#868A7A]">supabase/migrations/20261109000000_momentum_core.sql</code>.
            </p>
          </div>

          {/* Notion Card */}
          <div className="p-5 rounded-xl bg-[#242B31] border border-[#434D56] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#D2925B]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">Notion Life OS Sync</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2E373F] text-[#868A7A]">
                Modular API Layer
              </span>
            </div>
            <p className="text-xs text-[#A8A8A2] leading-relaxed">
              MOMENTUM can optionally synchronize tasks, milestones, and notes with an external Notion Life OS database using Notion&apos;s official REST API and server-side secret tokens. MOMENTUM operates completely independently when Notion is disconnected.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Data & Backups */}
      {activeTab === 'data' && (
        <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
              Data Privacy & Local Storage
            </h2>
            <p className="text-xs text-[#A8A8A2]">
              You own your data completely. Export full JSON snapshots, reload demo data, or clear the local sandbox.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#242B31] border border-[#434D56] space-y-3">
              <h3 className="text-xs font-bold text-[#F4F0E9] flex items-center gap-2">
                <Download className="w-4 h-4 text-[#D2925B]" />
                <span>Export Backups</span>
              </h3>
              <p className="text-xs text-[#A8A8A2]">
                Download your complete profile, goals, habits, workouts, and journal entries in JSON format.
              </p>
              <button
                onClick={handleExportJson}
                className="w-full py-2 rounded-lg bg-[#D2925B] text-[#242B31] font-semibold text-xs hover:bg-[#C2824B] transition-colors"
              >
                Download Full JSON Backup
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#242B31] border border-[#434D56] space-y-3">
              <h3 className="text-xs font-bold text-[#F4F0E9] flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#868A7A]" />
                <span>Restore Backup</span>
              </h3>
              <p className="text-xs text-[#A8A8A2]">
                Import a previous MOMENTUM JSON state file to restore all your data.
              </p>
              <label className="w-full py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] font-semibold text-xs hover:bg-[#36414A] cursor-pointer flex items-center justify-center transition-colors">
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
          <div className="p-4 rounded-xl bg-[#242B31] border border-[#B9534F]/30 space-y-3">
            <h3 className="text-xs font-bold text-[#E57373] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#E57373]" />
              <span>Danger Zone: Demo & Local Reset</span>
            </h3>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  resetToDemoData();
                  notify('Reset to realistic demonstration data.');
                }}
                className="px-4 py-2 rounded-lg bg-[#64432B] hover:bg-[#7E5437] text-xs font-semibold text-[#F4F0E9] border border-[#D2925B]/40"
              >
                Reload Realistic Sample/Demo Data
              </button>

              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 rounded-lg bg-[#B9534F]/20 hover:bg-[#B9534F]/30 text-xs font-semibold text-[#E57373] border border-[#B9534F]/40"
                >
                  Clear All Data (Blank Slate)
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#E57373]">Are you sure?</span>
                  <button
                    onClick={() => {
                      clearAllData();
                      setShowClearConfirm(false);
                      notify('All local data cleared.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#B9534F] text-[#F4F0E9] text-xs font-bold"
                  >
                    Yes, Wipe Data
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#2E373F] text-xs text-[#868A7A]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
