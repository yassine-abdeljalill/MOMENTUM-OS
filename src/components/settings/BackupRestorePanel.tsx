import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  FileCode2,
  FileText,
  FolderKanban,
  GraduationCap,
  Loader2,
  Paperclip,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../lib/context';
import {
  BackupValidationError,
  formatBackupBytes,
  type BackupPreviewSummary,
  type MomentumCompleteBackupV2,
  type RestoreStrategy,
} from '../../lib/backupEngine';
import type { ServerRestoreResponse } from '../../lib/backupApi';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';

interface LoadedBackupCandidate {
  filename: string;
  fileSizeBytes: number;
  preview: BackupPreviewSummary;
  backup: MomentumCompleteBackupV2;
}

export const BackupRestorePanel: React.FC = () => {
  const {
    authUser,
    exportCompleteBackup,
    previewCompleteBackup,
    restoreCompleteBackup,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [lastExportSummary, setLastExportSummary] = useState<{
    filename: string;
    exportedAt: string;
    checksum: string;
    preview: BackupPreviewSummary;
  } | null>(null);

  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<LoadedBackupCandidate | null>(null);

  const [strategy, setStrategy] = useState<RestoreStrategy>('merge');
  const [replaceAcknowledgeChecked, setReplaceAcknowledgeChecked] = useState(false);
  const [replaceConfirmPhrase, setReplaceConfirmPhrase] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<ServerRestoreResponse | null>(null);

  const handleCreateCompleteBackup = async () => {
    setIsExporting(true);
    try {
      const backup = await exportCompleteBackup();
      const verified = await previewCompleteBackup(JSON.stringify(backup));
      const dateStamp = new Date().toISOString().slice(0, 10);
      const filename = `momentum-complete-backup-${dateStamp}.json`;

      const jsonText = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setLastExportSummary({
        filename,
        exportedAt: backup.exportedAt,
        checksum: backup.checksum,
        preview: verified.preview,
      });
      showToast('Complete versioned backup downloaded.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create complete backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const resetCandidate = () => {
    setCandidate(null);
    setValidationError(null);
    setStrategy('merge');
    setReplaceAcknowledgeChecked(false);
    setReplaceConfirmPhrase('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBackupFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidatingFile(true);
    setValidationError(null);
    setCandidate(null);
    setRestoreResult(null);
    setStrategy('merge');
    setReplaceAcknowledgeChecked(false);
    setReplaceConfirmPhrase('');

    try {
      const text = await file.text();
      const { preview, normalizedBackup } = await previewCompleteBackup(text);
      setCandidate({
        filename: file.name,
        fileSizeBytes: file.size,
        preview,
        backup: normalizedBackup,
      });
    } catch (err: any) {
      const msg =
        err instanceof BackupValidationError || err?.message
          ? err.message
          : 'This file is invalid or corrupted and cannot be restored.';
      setValidationError(msg);
      showToast('Backup validation failed.', 'error');
    } finally {
      setIsValidatingFile(false);
    }
  };

  const canConfirmRestore =
    Boolean(candidate) &&
    !isRestoring &&
    (strategy === 'merge' ||
      (replaceAcknowledgeChecked && replaceConfirmPhrase.trim().toUpperCase() === 'RESTORE'));

  const handleConfirmRestore = async () => {
    if (!candidate || !canConfirmRestore) return;
    setIsRestoring(true);
    setValidationError(null);
    try {
      const result = await restoreCompleteBackup(
        candidate.backup,
        strategy,
        strategy === 'replace'
      );
      setRestoreResult(result);
      setCandidate(null);
      setReplaceAcknowledgeChecked(false);
      setReplaceConfirmPhrase('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showToast(
        strategy === 'replace'
          ? 'Workspace, Learning, and Finance restored cleanly.'
          : 'Backup merged safely without overwriting existing records.',
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Restore failed. Existing data was not modified.';
      setValidationError(msg);
      showToast(msg, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Create Complete Backup Card */}
        <div className="card-hover p-5 rounded-2xl bg-canvas border border-line flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-warm border border-line flex items-center justify-center text-ink">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink">Create Complete Backup</h3>
                  <p className="text-[11px] text-ink-muted">
                    Schema v2 &middot; SHA-256 verified portable archive
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-line text-[10px] font-mono font-semibold text-ink whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3 h-3 text-success" />
                Secrets Excluded
              </span>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Exports everything in one portable file: Tasks, Goals, Projects, Habits, Calendar blocks,
              Journal entries, Focus &amp; Fitness sessions, Learning modules, lessons, notes, assignments,
              practical labs, <strong>uploaded attachments</strong>, Finance transactions, budgets, savings
              goals, and preferences. Passwords and session tokens are never exported.
            </p>

            {!authUser && (
              <p className="text-[11px] text-ink-muted bg-surface border border-line rounded-lg px-2.5 py-1.5">
                Guest mode active: export captures local workspace state. Sign in to include server-side
                Learning attachments and Finance ledgers.
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              data-testid="create-complete-backup-btn"
              disabled={isExporting}
              onClick={handleCreateCompleteBackup}
              className="btn-press w-full py-2.5 px-4 rounded-xl bg-accent text-accent-ink font-semibold text-xs hover:bg-accent-hover disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Packaging Backup &amp; Attachments...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Complete Backup (.json)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-ink-muted leading-snug">
              Individual CSV exports remain available inside <strong>Analytics</strong> (Tasks &amp; Goals)
              and <strong>Finance</strong> (Ledger CSV).
            </p>
          </div>
        </div>

        {/* Select Backup to Restore Card */}
        <div className="card-hover p-5 rounded-2xl bg-canvas border border-line flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-warm border border-line flex items-center justify-center text-ink">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink">Restore from Backup</h3>
                  <p className="text-[11px] text-ink-muted">
                    Supports v2 complete archives &amp; legacy v0/v1 migrations
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-line text-[10px] font-mono font-semibold text-ink whitespace-nowrap shrink-0">
                Preview Before Apply
              </span>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Every backup file is parsed, checked for structural validity, verified against its SHA-256
              integrity signature and per-file attachment hashes, and previewed with record counts before
              any data is written.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="btn-press w-full py-2.5 px-4 rounded-xl bg-surface border border-line text-ink font-semibold text-xs hover:bg-surface-warm cursor-pointer flex items-center justify-center gap-2 transition-colors">
              {isValidatingFile ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Checksum &amp; Structure...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Backup File (.json)</span>
                </>
              )}
              <input
                ref={fileInputRef}
                data-testid="backup-file-input"
                type="file"
                accept=".json,application/json"
                onChange={handleBackupFileSelected}
                className="hidden"
              />
            </label>

            <p className="text-[11px] text-ink-muted leading-snug">
              Selecting a file only opens the preview. Existing data is never overwritten without your explicit
              strategy choice and confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Export Summary Notice */}
      <AnimatePresence>
        {lastExportSummary && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
            data-testid="backup-export-summary"
            className="p-4 rounded-xl bg-canvas border border-line flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-semibold text-ink">
                  Exported <span className="font-mono">{lastExportSummary.filename}</span>
                </p>
                <p className="text-[11px] text-ink-muted">
                  Includes {lastExportSummary.preview.counts.tasks} tasks,{' '}
                  {lastExportSummary.preview.counts.projects} projects,{' '}
                  {lastExportSummary.preview.counts.learningModules} learning modules,{' '}
                  {lastExportSummary.preview.counts.assignments + lastExportSummary.preview.counts.practicalLabs}{' '}
                  assignments/labs, {lastExportSummary.preview.counts.attachedFiles} uploaded files, and{' '}
                  {lastExportSummary.preview.counts.financeTransactions} transactions &middot; SHA-256{' '}
                  <code className="font-mono text-ink">{lastExportSummary.checksum.slice(0, 12)}...</code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastExportSummary(null)}
              aria-label="Dismiss export summary"
              className="p-1 rounded-lg text-ink-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation / Corruption Error Banner */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
            data-testid="backup-error-banner"
            className="p-4 rounded-xl bg-danger/10 border border-danger/40 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-danger">Backup Verification Failed — No Data Changed</p>
                <p className="text-ink leading-relaxed">{validationError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setValidationError(null)}
              aria-label="Dismiss validation error"
              className="p-1 rounded-lg text-ink-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore Success Banner */}
      <AnimatePresence>
        {restoreResult && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
            data-testid="backup-restore-success"
            className="p-4 rounded-xl bg-success/10 border border-success/40 flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-success">
                  Backup Restored ({restoreResult.strategy === 'replace' ? 'Full Replace' : 'Safe Merge'})
                </p>
                <p className="text-ink-muted">
                  Workspace: {restoreResult.summary.workspaceApplied} applied ({restoreResult.summary.workspaceSkipped}{' '}
                  kept/skipped) &middot; Learning: {restoreResult.summary.learningApplied} applied,{' '}
                  {restoreResult.summary.filesRestored} file(s) restored &middot; Finance:{' '}
                  {restoreResult.summary.financeApplied} applied.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRestoreResult(null)}
              aria-label="Dismiss restore summary"
              className="p-1 rounded-lg text-ink-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-Restore Preview & Safe Strategy Confirmation Panel */}
      <AnimatePresence>
        {candidate && (
          <motion.div
            key="backup-preview-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: MOMENTUM_EASE }}
            data-testid="backup-preview-panel"
            className="p-5 rounded-2xl bg-canvas border-2 border-ink/20 space-y-5"
          >
            {/* Preview Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-line">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-ink">Backup Preview &amp; Verification</h3>
                  <span
                    data-testid="backup-integrity-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/15 text-success text-[11px] font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {candidate.preview.migratedFromVersion !== undefined
                      ? `Migrated v${candidate.preview.migratedFromVersion} → v2`
                      : `Schema v${candidate.preview.schemaVersion} Verified`}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  File: <span className="font-mono text-ink">{candidate.filename}</span> (
                  {formatBackupBytes(candidate.fileSizeBytes)}) &middot; Backup Date:{' '}
                  <span data-testid="preview-backup-date" className="font-semibold text-ink">
                    {new Date(candidate.preview.exportedAt).toLocaleString()}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={resetCandidate}
                className="btn-press inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs font-medium text-ink-muted hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            {/* Migration / Attachment Warnings */}
            {candidate.preview.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-warm border border-line space-y-1">
                {candidate.preview.warnings.map((w, idx) => (
                  <p key={idx} className="text-xs text-ink flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-ink-muted" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Complete Record Counts Grid */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Contents Summary
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                {[
                  {
                    label: 'Tasks',
                    value: candidate.preview.counts.tasks,
                    sub: `${candidate.preview.counts.focusSessions} focus sessions`,
                    icon: CheckCircle2,
                    testId: 'preview-count-tasks',
                  },
                  {
                    label: 'Projects',
                    value: candidate.preview.counts.projects,
                    sub: `${candidate.preview.counts.goals} goals`,
                    icon: FolderKanban,
                    testId: 'preview-count-projects',
                  },
                  {
                    label: 'Habits & Calendar',
                    value: candidate.preview.counts.habits,
                    sub: `${candidate.preview.counts.calendarActivities} calendar blocks`,
                    icon: Calendar,
                    testId: 'preview-count-habits',
                  },
                  {
                    label: 'Journal & Fitness',
                    value: candidate.preview.counts.journalEntries,
                    sub: `${candidate.preview.counts.workoutSessions} workout logs`,
                    icon: FileText,
                    testId: 'preview-count-journal',
                  },
                  {
                    label: 'Learning Modules',
                    value: candidate.preview.counts.learningModules,
                    sub: `${candidate.preview.counts.learningLessons} lessons · ${candidate.preview.counts.learningNotes} notes`,
                    icon: GraduationCap,
                    testId: 'preview-count-learning-modules',
                  },
                  {
                    label: 'Assignments & Labs',
                    value:
                      candidate.preview.counts.assignments + candidate.preview.counts.practicalLabs,
                    sub: `${candidate.preview.counts.assignments} assignments · ${candidate.preview.counts.practicalLabs} labs`,
                    icon: FileCode2,
                    testId: 'preview-count-assignments-labs',
                  },
                  {
                    label: 'Uploaded Files',
                    value: candidate.preview.counts.attachedFiles,
                    sub: `${formatBackupBytes(candidate.preview.counts.attachedFilesTotalBytes)} · ${candidate.preview.counts.learningResources} resources`,
                    icon: Paperclip,
                    testId: 'preview-count-files',
                  },
                  {
                    label: 'Finance & Budgets',
                    value: candidate.preview.counts.financeTransactions,
                    sub: `${candidate.preview.counts.budgets} budgets · ${candidate.preview.counts.savingsGoals} savings goals`,
                    icon: Wallet,
                    testId: 'preview-count-finance',
                  },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      data-testid={item.testId}
                      className="p-3 rounded-xl bg-surface border border-line space-y-1"
                    >
                      <div className="flex items-center justify-between text-ink-muted">
                        <span className="text-[11px] font-medium">{item.label}</span>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-lg font-bold font-mono text-ink leading-tight">
                        {item.value}
                      </p>
                      <p className="text-[10px] text-ink-muted truncate">{item.sub}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Goals: <strong className="text-ink">{candidate.preview.counts.goals}</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  <PiggyBank className="w-3 h-3" />
                  Savings Contributions:{' '}
                  <strong className="text-ink">{candidate.preview.counts.savingsContributions}</strong>
                </span>
                <span>
                  Preferences:{' '}
                  <strong className="text-ink">
                    {candidate.preview.counts.hasPreferences ? 'Included' : 'Default'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Restore Strategy Selection */}
            <div className="space-y-3 pt-4 border-t border-line">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Choose Restore Strategy
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Restore strategy">
                <button
                  type="button"
                  role="radio"
                  aria-checked={strategy === 'merge'}
                  data-testid="strategy-merge-btn"
                  onClick={() => setStrategy('merge')}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    strategy === 'merge'
                      ? 'bg-surface border-ink ring-1 ring-ink'
                      : 'bg-surface/60 border-line hover:border-ink/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink">
                      Safe Merge (Recommended)
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-success/15 text-success text-[10px] font-semibold">
                      Non-Destructive
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                    Imports missing tasks, notes, assignments, labs, attachments, and transactions while
                    preserving all existing data you already have.
                  </p>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={strategy === 'replace'}
                  data-testid="strategy-replace-btn"
                  onClick={() => setStrategy('replace')}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    strategy === 'replace'
                      ? 'bg-danger/10 border-danger ring-1 ring-danger'
                      : 'bg-surface/60 border-line hover:border-danger/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-danger" />
                      Full Replace
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-danger/15 text-danger text-[10px] font-semibold">
                      Overwrites Current Data
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                    Replaces existing Workspace, Learning modules/attachments, and Finance ledgers with this
                    backup snapshot. Requires confirmation below.
                  </p>
                </button>
              </div>

              {/* Explicit Destructive Confirmation Guard for Full Replace */}
              {strategy === 'replace' && (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/40 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-danger font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Warning: Full Replace will overwrite your current Workspace, Learning files, and Finance
                      records with this backup. Consider downloading a fresh backup first.
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="replace-ack-checkbox"
                      checked={replaceAcknowledgeChecked}
                      onChange={e => setReplaceAcknowledgeChecked(e.target.checked)}
                      className="rounded border-line"
                    />
                    <span>I understand this will replace my existing MOMENTUM data.</span>
                  </label>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-ink-muted">
                      Type <code className="font-mono text-ink font-bold">RESTORE</code> to unlock Full Replace:
                    </label>
                    <input
                      type="text"
                      data-testid="replace-confirm-input"
                      value={replaceConfirmPhrase}
                      onChange={e => setReplaceConfirmPhrase(e.target.value)}
                      placeholder="RESTORE"
                      className="w-full sm:w-56 px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-mono text-ink focus:ring-2 focus:ring-danger focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Final Confirmation Action Row */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetCandidate}
                  className="btn-press px-4 py-2 rounded-xl bg-surface border border-line text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="confirm-restore-btn"
                  disabled={!canConfirmRestore}
                  onClick={handleConfirmRestore}
                  className={`btn-press px-5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                    strategy === 'replace'
                      ? 'bg-danger text-accent-ink hover:opacity-90'
                      : 'bg-accent text-accent-ink hover:bg-accent-hover'
                  }`}
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Restoring Backup...</span>
                    </>
                  ) : strategy === 'replace' ? (
                    <span>Confirm Full Replace Restore</span>
                  ) : (
                    <span>Confirm Safe Merge Restore</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
