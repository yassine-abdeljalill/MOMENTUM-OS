import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { initializeUserFinanceDefaults } from './auth.ts';
import { getDb, getLearningUploadsDir } from './db.ts';
import { ALLOWED_CURRENCIES, PAYMENT_METHODS } from './validation.ts';
import { getWorkspaceBootstrap, restoreWorkspaceInTransaction } from './workspaceSync.ts';
import {
  ALLOWED_BACKUP_EXTENSIONS,
  BACKUP_APP_VERSION,
  BackupValidationError,
  MAX_BACKUP_ATTACHMENT_BYTES,
  base64ToBytes,
  buildBackupPreview,
  bytesToBase64,
  computeSha256HexFromBytes,
  createEmptyCollectionsRecord,
  finalizeBackupEnvelope,
  parseAndVerifyBackupText,
  verifyAndNormalizeBackupPayload,
  type BackupLearningAttachment,
  type BackupPreviewSummary,
  type MomentumCompleteBackupV2,
  type RestoreStrategy,
} from '../src/lib/backupEngine.ts';
import { SYNC_COLLECTION_KEYS } from '../src/lib/syncEngine.ts';
import type {
  FinanceBudget,
  FinanceCategory,
  FinanceRecurringPayment,
  FinanceSavingsContribution,
  FinanceSavingsGoal,
  FinanceSettings,
  FinanceTransaction,
} from '../src/types/finance.ts';
import type {
  LearningLesson,
  LearningModule,
  LearningNote,
  LearningResource,
  LearningStudySession,
  LearningTask,
} from '../src/types/learning.ts';

const ALLOWED_CURRENCY_SET = new Set<string>(ALLOWED_CURRENCIES);
const ALLOWED_PAYMENT_SET = new Set<string>(PAYMENT_METHODS);

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function sanitizeNoteHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|form|meta|link|base)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|meta|link|base)[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi, '');
}

function extractPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|pre|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sanitizeExternalUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function sanitizeIsoStr(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function sanitizeColorHex(val: unknown, fallback = '#1D1D1F'): string {
  return typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val.trim()) ? val.trim() : fallback;
}

function asNonEmptyStr(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function asStr(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function resolveUploadPathInsideUserDir(userId: string, storageFilename: string): string | null {
  const uploadsDir = path.resolve(getLearningUploadsDir(userId));
  const safeName = path.basename(storageFilename || '');
  if (!safeName || safeName === '.' || safeName === '..') return null;
  const candidate = path.resolve(path.join(uploadsDir, safeName));
  if (!candidate.startsWith(`${uploadsDir}${path.sep}`)) {
    return null;
  }
  return candidate;
}

export async function exportCompleteBackupForUser(
  userId: string
): Promise<MomentumCompleteBackupV2> {
  const db = getDb();
  const now = new Date().toISOString();
  const warnings: string[] = [];

  // Only read safe identity columns (never password_hash, password_salt, or sessions)
  const userRow = db
    .prepare('SELECT id, email, full_name, created_at FROM users WHERE id = ?')
    .get(userId) as
    | { id: string; email: string; full_name: string; created_at: string }
    | undefined;

  if (!userRow) {
    throw new Error('Authenticated user record not found.');
  }

  // 1. Workspace (profile, preferences, all 16 synced collections)
  const workspaceBoot = getWorkspaceBootstrap(userId, 0);
  const collections = createEmptyCollectionsRecord();
  for (const key of SYNC_COLLECTION_KEYS) {
    const arr = workspaceBoot.collections?.[key];
    collections[key] = Array.isArray(arr) ? arr : [];
  }
  collections.tasks = collections.tasks.filter(t => !t.learningModuleId);

  const safeProfile = workspaceBoot.profile
    ? {
        id: userRow.id,
        email: workspaceBoot.profile.email || userRow.email,
        fullName: workspaceBoot.profile.fullName || userRow.full_name,
        avatarUrl: workspaceBoot.profile.avatarUrl || '',
        timezone: workspaceBoot.profile.timezone || 'UTC',
        preferredLanguage: workspaceBoot.profile.preferredLanguage || 'English',
        lifeAreas: workspaceBoot.profile.lifeAreas || [],
        visionStatement: workspaceBoot.profile.visionStatement || '',
        dailyAvailabilityHours: workspaceBoot.profile.dailyAvailabilityHours ?? 3.5,
        onboardingCompleted: workspaceBoot.profile.onboardingCompleted ?? true,
        createdAt: workspaceBoot.profile.createdAt || userRow.created_at,
        updatedAt: workspaceBoot.profile.updatedAt || now,
      }
    : {
        id: userRow.id,
        email: userRow.email,
        fullName: userRow.full_name,
        createdAt: userRow.created_at,
      };

  // 2. Learning (modules, lessons, notes, resources + disk files, tasks/assignments/labs, study sessions)
  const modules: LearningModule[] = db
    .prepare('SELECT * FROM learning_modules WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      color: row.color || '#1D1D1F',
      icon: row.icon || 'book',
      status: row.status,
      sortOrder: Number(row.sort_order),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  const lessons: LearningLesson[] = db
    .prepare('SELECT * FROM learning_lessons WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      moduleId: row.module_id,
      title: row.title,
      description: row.description || '',
      teacherName: row.teacher_name || '',
      lessonDate: row.lesson_date || '',
      status: row.status,
      learningObjectives: safeJsonParse<string[]>(row.learning_objectives, []),
      studyDurationMinutes: Number(row.study_duration_minutes || 45),
      sortOrder: Number(row.sort_order),
      ...(row.last_opened_at ? { lastOpenedAt: row.last_opened_at } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  const notes: LearningNote[] = db
    .prepare('SELECT * FROM learning_notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      lessonId: row.lesson_id,
      title: row.title,
      contentHtml: row.content_html || '',
      plainText: row.plain_text || '',
      isPinned: Boolean(row.is_pinned),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  const rawResourceRows = db
    .prepare('SELECT * FROM learning_resources WHERE user_id = ? ORDER BY created_at ASC')
    .all(userId) as any[];

  const resources: LearningResource[] = [];
  const attachments: BackupLearningAttachment[] = [];

  for (const row of rawResourceRows) {
    const resourceItem: LearningResource = {
      id: row.id,
      userId: row.user_id,
      moduleId: row.module_id,
      lessonId: row.lesson_id || null,
      kind: row.kind,
      title: row.title,
      description: row.description || '',
      folderName: row.folder_name || 'General',
      ...(row.external_url ? { externalUrl: row.external_url } : {}),
      ...(row.original_filename ? { originalFilename: row.original_filename } : {}),
      ...(row.mime_type ? { mimeType: row.mime_type } : {}),
      fileSize: Number(row.file_size || 0),
      ...(row.file_extension ? { fileExtension: row.file_extension } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    resources.push(resourceItem);

    if (row.kind === 'file' && row.storage_filename) {
      const filePath = resolveUploadPathInsideUserDir(userId, row.storage_filename);
      if (filePath && fs.existsSync(filePath)) {
        const buf = fs.readFileSync(filePath);
        if (buf.byteLength <= MAX_BACKUP_ATTACHMENT_BYTES) {
          const sha256 = await computeSha256HexFromBytes(new Uint8Array(buf));
          const origName = row.original_filename || row.title || path.basename(filePath);
          const ext = (
            row.file_extension ||
            path.extname(origName) ||
            path.extname(row.storage_filename) ||
            '.bin'
          ).toLowerCase();
          attachments.push({
            resourceId: row.id,
            originalFilename: origName,
            mimeType: row.mime_type || 'application/octet-stream',
            fileSize: buf.byteLength,
            fileExtension: ext,
            sha256,
            contentBase64: bytesToBase64(new Uint8Array(buf)),
          });
        } else {
          warnings.push(`File "${row.original_filename || row.title}" exceeded the 25 MB limit and was skipped.`);
        }
      } else {
        warnings.push(`Uploaded file "${row.original_filename || row.title}" was missing on disk at export time.`);
      }
    }
  }

  const learningTasks: LearningTask[] = db
    .prepare('SELECT * FROM learning_tasks WHERE user_id = ? ORDER BY created_at ASC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      moduleId: row.module_id,
      lessonId: row.lesson_id || null,
      title: row.title,
      description: row.description || '',
      taskKind: row.task_kind || 'task',
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date || '',
      subtasks: safeJsonParse<any[]>(row.subtasks, []),
      ...(row.completed_at ? { completedAt: row.completed_at } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  const studySessions: LearningStudySession[] = db
    .prepare('SELECT * FROM learning_study_sessions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      moduleId: row.module_id || null,
      lessonId: row.lesson_id || null,
      subject: row.subject,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: Number(row.duration_minutes),
      whatWasLearned: row.what_was_learned || '',
      createdAt: row.created_at,
    }));

  // 3. Finance (settings, categories, transactions, budgets, savingsGoals + contributions, recurring)
  const settingsRow = db
    .prepare('SELECT user_id, currency, locale, updated_at FROM finance_settings WHERE user_id = ?')
    .get(userId) as any;

  const financeSettings: FinanceSettings | undefined = settingsRow
    ? {
        userId: settingsRow.user_id,
        currency: settingsRow.currency,
        locale: settingsRow.locale,
        updatedAt: settingsRow.updated_at,
      }
    : undefined;

  const categories: FinanceCategory[] = db
    .prepare('SELECT * FROM finance_categories WHERE user_id = ? ORDER BY is_default DESC, name ASC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      color: row.color,
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
    }));

  const transactions: FinanceTransaction[] = db
    .prepare('SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      amount: Number(row.amount),
      date: row.date,
      category: row.category,
      description: row.description || '',
      paymentMethod: row.payment_method,
      ...(row.recurring_payment_id ? { recurringPaymentId: row.recurring_payment_id } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  const budgets: FinanceBudget[] = db
    .prepare('SELECT * FROM finance_budgets WHERE user_id = ? ORDER BY month DESC, category ASC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      category: row.category,
      month: row.month,
      limitAmount: Number(row.limit_amount),
      warningThresholdPercent: Number(row.warning_threshold_percent),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  const contribRows = db
    .prepare('SELECT * FROM finance_savings_contributions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId) as any[];
  const contribByGoal = new Map<string, FinanceSavingsContribution[]>();
  for (const c of contribRows) {
    const arr = contribByGoal.get(c.goal_id) || [];
    arr.push({
      id: c.id,
      userId: c.user_id,
      goalId: c.goal_id,
      amount: Number(c.amount),
      date: c.date,
      note: c.note || '',
      createdAt: c.created_at,
    });
    contribByGoal.set(c.goal_id, arr);
  }

  const savingsGoals: FinanceSavingsGoal[] = db
    .prepare('SELECT * FROM finance_savings_goals WHERE user_id = ? ORDER BY deadline ASC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      targetAmount: Number(row.target_amount),
      currentAmount: Number(row.current_amount),
      deadline: row.deadline,
      category: row.category,
      notes: row.notes || '',
      contributions: contribByGoal.get(row.id) || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  const recurringPayments: FinanceRecurringPayment[] = db
    .prepare('SELECT * FROM finance_recurring_payments WHERE user_id = ? ORDER BY next_due_date ASC')
    .all(userId)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      paymentMethod: row.payment_method,
      frequency: row.frequency,
      kind: row.kind,
      nextDueDate: row.next_due_date,
      active: Boolean(row.active),
      ...(row.last_paid_date ? { lastPaidDate: row.last_paid_date } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

  return finalizeBackupEnvelope({
    exportedAt: now,
    appVersion: BACKUP_APP_VERSION,
    warnings,
    workspace: {
      profile: safeProfile,
      preferences: workspaceBoot.preferences || {},
      collections,
    },
    learning: {
      modules,
      lessons,
      notes,
      resources,
      tasks: learningTasks,
      studySessions,
      attachments,
    },
    finance: {
      ...(financeSettings ? { settings: financeSettings } : {}),
      categories,
      transactions,
      budgets,
      savingsGoals,
      recurringPayments,
    },
  });
}

export async function previewBackupPayload(input: {
  rawText?: string;
  backup?: unknown;
}): Promise<{ preview: BackupPreviewSummary; normalizedBackup: MomentumCompleteBackupV2 }> {
  const verified =
    typeof input.rawText === 'string'
      ? await parseAndVerifyBackupText(input.rawText)
      : await verifyAndNormalizeBackupPayload(input.backup);

  return {
    preview: verified.preview,
    normalizedBackup: verified.backup,
  };
}

interface ResolvedIdResult {
  finalId: string;
  skipExisting: boolean;
}

function resolveTableSafeId(
  db: DatabaseSync,
  table: string,
  rawId: string,
  userId: string,
  strategy: RestoreStrategy,
  idMap: Map<string, string>
): ResolvedIdResult {
  const cleanRaw = asNonEmptyStr(rawId, crypto.randomUUID());
  const mapped = idMap.get(cleanRaw);
  if (mapped) {
    if (strategy === 'merge') {
      const existing = db.prepare(`SELECT user_id FROM ${table} WHERE id = ?`).get(mapped) as
        | { user_id: string }
        | undefined;
      if (existing && existing.user_id === userId) {
        return { finalId: mapped, skipExisting: true };
      }
    }
    return { finalId: mapped, skipExisting: false };
  }

  const row = db.prepare(`SELECT user_id FROM ${table} WHERE id = ?`).get(cleanRaw) as
    | { user_id: string }
    | undefined;

  if (!row) {
    idMap.set(cleanRaw, cleanRaw);
    return { finalId: cleanRaw, skipExisting: false };
  }

  if (row.user_id === userId) {
    idMap.set(cleanRaw, cleanRaw);
    if (strategy === 'merge') {
      return { finalId: cleanRaw, skipExisting: true };
    }
    return { finalId: cleanRaw, skipExisting: false };
  }

  // Belongs to another account in this shared database: mint a fresh UUID
  const freshId = crypto.randomUUID();
  idMap.set(cleanRaw, freshId);
  return { finalId: freshId, skipExisting: false };
}

export interface RestoreExecutionResult {
  restored: true;
  strategy: RestoreStrategy;
  preview: BackupPreviewSummary;
  summary: {
    workspaceApplied: number;
    workspaceSkipped: number;
    learningApplied: number;
    learningSkipped: number;
    filesRestored: number;
    financeApplied: number;
    financeSkipped: number;
    warnings: string[];
  };
  syncVersion: number;
}

export async function restoreCompleteBackupForUser(
  userId: string,
  input: {
    rawText?: string;
    backup?: unknown;
    strategy: RestoreStrategy;
  }
): Promise<RestoreExecutionResult> {
  const { strategy } = input;
  const verified =
    typeof input.rawText === 'string'
      ? await parseAndVerifyBackupText(input.rawText)
      : await verifyAndNormalizeBackupPayload(input.backup);

  const backup = verified.backup;
  const db = getDb();
  const now = new Date().toISOString();
  const runtimeWarnings = [...verified.preview.warnings];

  // Pre-decode all verified attachments into memory buffers before opening SQLite transaction
  const decodedAttachmentByResourceId = new Map<
    string,
    {
      bytes: Buffer;
      originalFilename: string;
      mimeType: string;
      safeExtension: string;
    }
  >();

  for (const att of backup.learning.attachments) {
    const ext = (
      att.fileExtension ||
      path.extname(att.originalFilename || '') ||
      '.bin'
    ).toLowerCase();
    if (!ALLOWED_BACKUP_EXTENSIONS.has(ext)) {
      throw new BackupValidationError(
        'UNSUPPORTED_ATTACHMENT_TYPE',
        `Attachment "${att.originalFilename}" uses an unsupported extension (${ext}).`
      );
    }
    const rawBytes = base64ToBytes(att.contentBase64);
    decodedAttachmentByResourceId.set(att.resourceId, {
      bytes: Buffer.from(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength),
      originalFilename: path.basename(att.originalFilename || 'attachment' + ext),
      mimeType: att.mimeType || 'application/octet-stream',
      safeExtension: ext,
    });
  }

  const writtenDiskFiles: string[] = [];
  const oldDiskFilesToDelete: string[] = [];

  let workspaceResult = { appliedCount: 0, skippedCount: 0, syncVersion: 0 };
  let learningApplied = 0;
  let learningSkipped = 0;
  let filesRestored = 0;
  let financeApplied = 0;
  let financeSkipped = 0;

  db.exec('BEGIN IMMEDIATE');
  try {
    // 1. Workspace (profile, preferences, 16 collections)
    workspaceResult = restoreWorkspaceInTransaction(
      db,
      userId,
      backup.workspace,
      strategy,
      now
    );

    // 2. Learning (modules, lessons, notes, resources + attachments, tasks/assignments/labs, study sessions)
    if (strategy === 'replace') {
      const prevFileRows = db
        .prepare(
          `SELECT storage_filename FROM learning_resources WHERE user_id = ? AND kind = 'file' AND storage_filename IS NOT NULL`
        )
        .all(userId) as { storage_filename: string }[];
      for (const pf of prevFileRows) {
        const resolved = resolveUploadPathInsideUserDir(userId, pf.storage_filename);
        if (resolved) oldDiskFilesToDelete.push(resolved);
      }

      db.prepare('DELETE FROM learning_study_sessions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM learning_tasks WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM learning_resources WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM learning_notes WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM learning_lessons WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM learning_modules WHERE user_id = ?').run(userId);
    }

    const moduleMap = new Map<string, string>();
    const lessonMap = new Map<string, string>();
    const noteMap = new Map<string, string>();
    const resourceMap = new Map<string, string>();
    const learningTaskMap = new Map<string, string>();
    const learningSessionMap = new Map<string, string>();

    const validModuleIds = new Set<string>(
      (db.prepare('SELECT id FROM learning_modules WHERE user_id = ?').all(userId) as { id: string }[]).map(
        r => r.id
      )
    );
    const validLessonIds = new Set<string>(
      (db.prepare('SELECT id FROM learning_lessons WHERE user_id = ?').all(userId) as { id: string }[]).map(
        r => r.id
      )
    );

    // 2a. Modules
    const insertModStmt = db.prepare(
      `INSERT INTO learning_modules (id, user_id, title, description, color, icon, status, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < backup.learning.modules.length; i += 1) {
      const m = backup.learning.modules[i];
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'learning_modules',
        m.id,
        userId,
        strategy,
        moduleMap
      );
      if (skipExisting) {
        validModuleIds.add(finalId);
        learningSkipped += 1;
        continue;
      }
      const status =
        m.status === 'in_progress' || m.status === 'completed' ? m.status : 'not_started';
      insertModStmt.run(
        finalId,
        userId,
        asNonEmptyStr(m.title, 'Untitled Module').slice(0, 120),
        asStr(m.description, ''),
        sanitizeColorHex(m.color, '#1D1D1F'),
        asNonEmptyStr(m.icon, 'book'),
        status,
        Number.isFinite(m.sortOrder) ? Math.trunc(m.sortOrder) : i,
        sanitizeIsoStr(m.createdAt, now),
        sanitizeIsoStr(m.updatedAt, now)
      );
      validModuleIds.add(finalId);
      learningApplied += 1;
    }

    // 2b. Lessons
    const insertLessonStmt = db.prepare(
      `INSERT INTO learning_lessons
        (id, user_id, module_id, title, description, teacher_name, lesson_date, status, learning_objectives, study_duration_minutes, sort_order, last_opened_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < backup.learning.lessons.length; i += 1) {
      const l = backup.learning.lessons[i];
      const mappedModuleId = moduleMap.get(l.moduleId) || l.moduleId;
      if (!validModuleIds.has(mappedModuleId)) {
        learningSkipped += 1;
        runtimeWarnings.push(`Skipped orphan lesson "${l.title}" (module reference missing).`);
        continue;
      }
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'learning_lessons',
        l.id,
        userId,
        strategy,
        lessonMap
      );
      if (skipExisting) {
        validLessonIds.add(finalId);
        learningSkipped += 1;
        continue;
      }
      const status =
        l.status === 'in_progress' || l.status === 'completed' ? l.status : 'not_started';
      const objectives = Array.isArray(l.learningObjectives)
        ? l.learningObjectives.filter((o): o is string => typeof o === 'string')
        : [];
      insertLessonStmt.run(
        finalId,
        userId,
        mappedModuleId,
        asNonEmptyStr(l.title, 'Untitled Lesson').slice(0, 140),
        asStr(l.description, ''),
        asStr(l.teacherName, ''),
        asStr(l.lessonDate, ''),
        status,
        JSON.stringify(objectives),
        Number.isFinite(l.studyDurationMinutes) && l.studyDurationMinutes > 0
          ? Math.trunc(l.studyDurationMinutes)
          : 45,
        Number.isFinite(l.sortOrder) ? Math.trunc(l.sortOrder) : i,
        l.lastOpenedAt || null,
        sanitizeIsoStr(l.createdAt, now),
        sanitizeIsoStr(l.updatedAt, now)
      );
      validLessonIds.add(finalId);
      learningApplied += 1;
    }

    // 2c. Notes (with XSS sanitization)
    const insertNoteStmt = db.prepare(
      `INSERT INTO learning_notes
        (id, user_id, lesson_id, title, content_html, plain_text, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const n of backup.learning.notes) {
      const mappedLessonId = lessonMap.get(n.lessonId) || n.lessonId;
      if (!validLessonIds.has(mappedLessonId)) {
        learningSkipped += 1;
        runtimeWarnings.push(`Skipped orphan note "${n.title}" (lesson reference missing).`);
        continue;
      }
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'learning_notes',
        n.id,
        userId,
        strategy,
        noteMap
      );
      if (skipExisting) {
        learningSkipped += 1;
        continue;
      }
      const cleanHtml = sanitizeNoteHtml(asStr(n.contentHtml, ''));
      const plain = extractPlainText(cleanHtml) || asStr(n.plainText, '');
      insertNoteStmt.run(
        finalId,
        userId,
        mappedLessonId,
        asNonEmptyStr(n.title, 'Untitled Note').slice(0, 160),
        cleanHtml,
        plain,
        n.isPinned ? 1 : 0,
        sanitizeIsoStr(n.createdAt, now),
        sanitizeIsoStr(n.updatedAt, now)
      );
      learningApplied += 1;
    }

    // 2d. Resources & file attachments
    const insertResourceStmt = db.prepare(
      `INSERT INTO learning_resources
        (id, user_id, module_id, lesson_id, kind, title, description, folder_name, external_url, original_filename, storage_filename, mime_type, file_size, file_extension, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of backup.learning.resources) {
      const mappedModuleId = moduleMap.get(r.moduleId) || r.moduleId;
      if (!validModuleIds.has(mappedModuleId)) {
        learningSkipped += 1;
        runtimeWarnings.push(`Skipped orphan resource "${r.title}" (module reference missing).`);
        continue;
      }
      const mappedLessonId = r.lessonId ? lessonMap.get(r.lessonId) || r.lessonId : null;
      const finalLessonId =
        mappedLessonId && validLessonIds.has(mappedLessonId) ? mappedLessonId : null;

      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'learning_resources',
        r.id,
        userId,
        strategy,
        resourceMap
      );
      if (skipExisting) {
        learningSkipped += 1;
        continue;
      }

      if (r.kind === 'link') {
        const safeUrl = sanitizeExternalUrl(r.externalUrl);
        if (!safeUrl) {
          learningSkipped += 1;
          runtimeWarnings.push(`Skipped resource "${r.title}" due to invalid URL.`);
          continue;
        }
        insertResourceStmt.run(
          finalId,
          userId,
          mappedModuleId,
          finalLessonId,
          'link',
          asNonEmptyStr(r.title, 'External Resource').slice(0, 160),
          asStr(r.description, ''),
          asNonEmptyStr(r.folderName, 'General').slice(0, 80),
          safeUrl,
          null,
          null,
          null,
          0,
          null,
          sanitizeIsoStr(r.createdAt, now),
          sanitizeIsoStr(r.updatedAt, now)
        );
        learningApplied += 1;
      } else {
        const att = decodedAttachmentByResourceId.get(r.id);
        let newStorageFilename: string | null = null;
        if (att) {
          newStorageFilename = `${crypto.randomUUID()}${att.safeExtension}`;
          const destPath = resolveUploadPathInsideUserDir(userId, newStorageFilename);
          if (!destPath) {
            throw new Error('Failed to resolve safe upload path for restored file.');
          }
          fs.writeFileSync(destPath, att.bytes);
          writtenDiskFiles.push(destPath);
          filesRestored += 1;
        } else {
          runtimeWarnings.push(
            `Restored metadata for "${r.title}", but file binary was unavailable in the backup.`
          );
        }

        insertResourceStmt.run(
          finalId,
          userId,
          mappedModuleId,
          finalLessonId,
          'file',
          asNonEmptyStr(r.title, att?.originalFilename || 'Restored File').slice(0, 160),
          asStr(r.description, ''),
          asNonEmptyStr(r.folderName, 'General').slice(0, 80),
          null,
          att?.originalFilename || r.originalFilename || null,
          newStorageFilename,
          att?.mimeType || r.mimeType || 'application/octet-stream',
          att ? att.bytes.byteLength : Number(r.fileSize || 0),
          att?.safeExtension || r.fileExtension || null,
          sanitizeIsoStr(r.createdAt, now),
          sanitizeIsoStr(r.updatedAt, now)
        );
        learningApplied += 1;
      }
    }

    // 2e. Learning Tasks (Assignments, Practical Labs, Exercises, Tasks)
    const insertLearningTaskStmt = db.prepare(
      `INSERT INTO learning_tasks
        (id, user_id, module_id, lesson_id, title, description, task_kind, status, priority, due_date, subtasks, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const lt of backup.learning.tasks) {
      const mappedModuleId = moduleMap.get(lt.moduleId) || lt.moduleId;
      if (!validModuleIds.has(mappedModuleId)) {
        learningSkipped += 1;
        continue;
      }
      const mappedLessonId = lt.lessonId ? lessonMap.get(lt.lessonId) || lt.lessonId : null;
      const finalLessonId =
        mappedLessonId && validLessonIds.has(mappedLessonId) ? mappedLessonId : null;

      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'learning_tasks',
        lt.id,
        userId,
        strategy,
        learningTaskMap
      );
      if (skipExisting) {
        learningSkipped += 1;
        continue;
      }
      const kind =
        lt.taskKind === 'assignment' || lt.taskKind === 'lab' || lt.taskKind === 'exercise'
          ? lt.taskKind
          : 'task';
      const status =
        lt.status === 'in_progress' || lt.status === 'completed' ? lt.status : 'todo';
      const priority =
        lt.priority === 'low' || lt.priority === 'high' || lt.priority === 'urgent'
          ? lt.priority
          : 'medium';

      insertLearningTaskStmt.run(
        finalId,
        userId,
        mappedModuleId,
        finalLessonId,
        asNonEmptyStr(lt.title, 'Learning Task').slice(0, 180),
        asStr(lt.description, ''),
        kind,
        status,
        priority,
        asStr(lt.dueDate, ''),
        JSON.stringify(Array.isArray(lt.subtasks) ? lt.subtasks : []),
        lt.completedAt || null,
        sanitizeIsoStr(lt.createdAt, now),
        sanitizeIsoStr(lt.updatedAt, now)
      );
      learningApplied += 1;
    }

    // 2f. Learning Study Sessions
    const insertStudyStmt = db.prepare(
      `INSERT INTO learning_study_sessions
        (id, user_id, module_id, lesson_id, subject, date, start_time, end_time, duration_minutes, what_was_learned, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const ss of backup.learning.studySessions) {
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'learning_study_sessions',
        ss.id,
        userId,
        strategy,
        learningSessionMap
      );
      if (skipExisting) {
        learningSkipped += 1;
        continue;
      }
      const rawMod = ss.moduleId ? moduleMap.get(ss.moduleId) || ss.moduleId : null;
      const finalMod = rawMod && validModuleIds.has(rawMod) ? rawMod : null;
      const rawLes = ss.lessonId ? lessonMap.get(ss.lessonId) || ss.lessonId : null;
      const finalLes = rawLes && validLessonIds.has(rawLes) ? rawLes : null;

      insertStudyStmt.run(
        finalId,
        userId,
        finalMod,
        finalLes,
        asNonEmptyStr(ss.subject, 'Study Session').slice(0, 140),
        asNonEmptyStr(ss.date, now.slice(0, 10)),
        asNonEmptyStr(ss.startTime, '09:00'),
        asNonEmptyStr(ss.endTime, '10:00'),
        Number.isFinite(ss.durationMinutes) && ss.durationMinutes > 0
          ? Math.trunc(ss.durationMinutes)
          : 45,
        asStr(ss.whatWasLearned, ''),
        sanitizeIsoStr(ss.createdAt, now)
      );
      learningApplied += 1;
    }

    // 3. Finance (settings, categories, savingsGoals + contributions, recurringPayments, transactions, budgets)
    if (strategy === 'replace') {
      db.prepare('DELETE FROM finance_transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM finance_budgets WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM finance_savings_contributions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM finance_savings_goals WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM finance_recurring_payments WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM finance_categories WHERE user_id = ?').run(userId);
    }

    // 3a. Finance Settings
    const existingFinSettings = db
      .prepare('SELECT user_id FROM finance_settings WHERE user_id = ?')
      .get(userId);
    if (backup.finance.settings && (strategy === 'replace' || !existingFinSettings)) {
      const cur =
        backup.finance.settings.currency &&
        ALLOWED_CURRENCY_SET.has(backup.finance.settings.currency)
          ? backup.finance.settings.currency
          : 'MAD';
      const locale = asNonEmptyStr(backup.finance.settings.locale, 'en-MA');
      db.prepare(
        `INSERT INTO finance_settings (user_id, currency, locale, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET currency = excluded.currency, locale = excluded.locale, updated_at = excluded.updated_at`
      ).run(userId, cur, locale, now);
      financeApplied += 1;
    }

    // 3b. Finance Categories (respect UNIQUE(user_id, name, type))
    const categoryMap = new Map<string, string>();
    const existingCatKeys = new Set<string>(
      (
        db
          .prepare('SELECT name, type FROM finance_categories WHERE user_id = ?')
          .all(userId) as { name: string; type: string }[]
      ).map(r => `${r.name}::${r.type}`)
    );
    const insertCatStmt = db.prepare(
      `INSERT INTO finance_categories (id, user_id, name, type, color, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const cat of backup.finance.categories) {
      const catName = asNonEmptyStr(cat.name, 'General').slice(0, 40);
      const catType =
        cat.type === 'income' || cat.type === 'expense' || cat.type === 'both' ? cat.type : 'expense';
      const uniqueKey = `${catName}::${catType}`;
      if (existingCatKeys.has(uniqueKey)) {
        financeSkipped += 1;
        continue;
      }
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'finance_categories',
        cat.id,
        userId,
        strategy,
        categoryMap
      );
      if (skipExisting) {
        financeSkipped += 1;
        continue;
      }
      insertCatStmt.run(
        finalId,
        userId,
        catName,
        catType,
        sanitizeColorHex(cat.color, '#1D1D1F'),
        cat.isDefault ? 1 : 0,
        sanitizeIsoStr(cat.createdAt, now)
      );
      existingCatKeys.add(uniqueKey);
      financeApplied += 1;
    }

    // Ensure default categories exist if backup had none
    initializeUserFinanceDefaults(userId);

    // 3c. Savings Goals + Contributions
    const goalMap = new Map<string, string>();
    const contribMap = new Map<string, string>();
    const insertGoalStmt = db.prepare(
      `INSERT INTO finance_savings_goals
        (id, user_id, name, target_amount, current_amount, deadline, category, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertContribStmt = db.prepare(
      `INSERT INTO finance_savings_contributions
        (id, user_id, goal_id, amount, date, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    for (const sg of backup.finance.savingsGoals) {
      const targetAmount =
        typeof sg.targetAmount === 'number' && Number.isFinite(sg.targetAmount) && sg.targetAmount > 0
          ? Math.round(sg.targetAmount * 100) / 100
          : 1;
      const currentAmount =
        typeof sg.currentAmount === 'number' &&
        Number.isFinite(sg.currentAmount) &&
        sg.currentAmount >= 0
          ? Math.round(sg.currentAmount * 100) / 100
          : 0;

      const { finalId: finalGoalId, skipExisting } = resolveTableSafeId(
        db,
        'finance_savings_goals',
        sg.id,
        userId,
        strategy,
        goalMap
      );
      if (!skipExisting) {
        insertGoalStmt.run(
          finalGoalId,
          userId,
          asNonEmptyStr(sg.name, 'Savings Goal').slice(0, 100),
          targetAmount,
          currentAmount,
          asNonEmptyStr(sg.deadline, now.slice(0, 10)),
          asNonEmptyStr(sg.category, 'General'),
          asStr(sg.notes, ''),
          sanitizeIsoStr(sg.createdAt, now),
          sanitizeIsoStr(sg.updatedAt, now)
        );
        financeApplied += 1;
      } else {
        financeSkipped += 1;
      }

      if (Array.isArray(sg.contributions)) {
        for (const c of sg.contributions) {
          if (
            typeof c.amount !== 'number' ||
            !Number.isFinite(c.amount) ||
            c.amount <= 0
          ) {
            continue;
          }
          const { finalId: finalContribId, skipExisting: skipContrib } = resolveTableSafeId(
            db,
            'finance_savings_contributions',
            c.id,
            userId,
            strategy,
            contribMap
          );
          if (skipContrib) {
            financeSkipped += 1;
            continue;
          }
          insertContribStmt.run(
            finalContribId,
            userId,
            finalGoalId,
            Math.round(c.amount * 100) / 100,
            asNonEmptyStr(c.date, now.slice(0, 10)),
            asStr(c.note, ''),
            sanitizeIsoStr(c.createdAt, now)
          );
          financeApplied += 1;
        }
      }
    }

    // 3d. Recurring Payments
    const recurringMap = new Map<string, string>();
    const insertRecStmt = db.prepare(
      `INSERT INTO finance_recurring_payments
        (id, user_id, title, type, amount, category, payment_method, frequency, kind, next_due_date, active, last_paid_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of backup.finance.recurringPayments) {
      if (typeof r.amount !== 'number' || !Number.isFinite(r.amount) || r.amount <= 0) {
        financeSkipped += 1;
        continue;
      }
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'finance_recurring_payments',
        r.id,
        userId,
        strategy,
        recurringMap
      );
      if (skipExisting) {
        financeSkipped += 1;
        continue;
      }
      const rType = r.type === 'income' ? 'income' : 'expense';
      const method = ALLOWED_PAYMENT_SET.has(r.paymentMethod) ? r.paymentMethod : 'Other';
      const freq =
        r.frequency === 'weekly' ||
        r.frequency === 'quarterly' ||
        r.frequency === 'yearly'
          ? r.frequency
          : 'monthly';
      const kind =
        r.kind === 'rent' ||
        r.kind === 'internet_phone' ||
        r.kind === 'recurring_income' ||
        r.kind === 'custom'
          ? r.kind
          : 'subscription';

      insertRecStmt.run(
        finalId,
        userId,
        asNonEmptyStr(r.title, 'Recurring Payment').slice(0, 120),
        rType,
        Math.round(r.amount * 100) / 100,
        asNonEmptyStr(r.category, 'Bills'),
        method,
        freq,
        kind,
        asNonEmptyStr(r.nextDueDate, now.slice(0, 10)),
        r.active === false ? 0 : 1,
        r.lastPaidDate || null,
        sanitizeIsoStr(r.createdAt, now),
        sanitizeIsoStr(r.updatedAt, now)
      );
      financeApplied += 1;
    }

    // 3e. Transactions
    const txMap = new Map<string, string>();
    const insertTxStmt = db.prepare(
      `INSERT INTO finance_transactions
        (id, user_id, type, amount, date, category, description, payment_method, recurring_payment_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const tx of backup.finance.transactions) {
      if (typeof tx.amount !== 'number' || !Number.isFinite(tx.amount) || tx.amount <= 0) {
        financeSkipped += 1;
        continue;
      }
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'finance_transactions',
        tx.id,
        userId,
        strategy,
        txMap
      );
      if (skipExisting) {
        financeSkipped += 1;
        continue;
      }
      const txType = tx.type === 'income' ? 'income' : 'expense';
      const method = ALLOWED_PAYMENT_SET.has(tx.paymentMethod) ? tx.paymentMethod : 'Other';
      const mappedRec = tx.recurringPaymentId
        ? recurringMap.get(tx.recurringPaymentId) || tx.recurringPaymentId
        : null;

      insertTxStmt.run(
        finalId,
        userId,
        txType,
        Math.round(tx.amount * 100) / 100,
        asNonEmptyStr(tx.date, now.slice(0, 10)),
        asNonEmptyStr(tx.category, 'Other'),
        asStr(tx.description, '').slice(0, 240),
        method,
        mappedRec,
        sanitizeIsoStr(tx.createdAt, now),
        sanitizeIsoStr(tx.updatedAt, now)
      );
      financeApplied += 1;
    }

    // 3f. Budgets (respect UNIQUE(user_id, category, month))
    const budgetMap = new Map<string, string>();
    const existingBudgetKeys = new Set<string>(
      (
        db
          .prepare('SELECT category, month FROM finance_budgets WHERE user_id = ?')
          .all(userId) as { category: string; month: string }[]
      ).map(r => `${r.category}::${r.month}`)
    );
    const insertBudgetStmt = db.prepare(
      `INSERT INTO finance_budgets
        (id, user_id, category, month, limit_amount, warning_threshold_percent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const b of backup.finance.budgets) {
      if (typeof b.limitAmount !== 'number' || !Number.isFinite(b.limitAmount) || b.limitAmount <= 0) {
        financeSkipped += 1;
        continue;
      }
      const cat = asNonEmptyStr(b.category, 'Other').slice(0, 60);
      const month = asNonEmptyStr(b.month, now.slice(0, 7));
      const uniqueKey = `${cat}::${month}`;
      if (existingBudgetKeys.has(uniqueKey)) {
        financeSkipped += 1;
        continue;
      }
      const { finalId, skipExisting } = resolveTableSafeId(
        db,
        'finance_budgets',
        b.id,
        userId,
        strategy,
        budgetMap
      );
      if (skipExisting) {
        financeSkipped += 1;
        continue;
      }
      const threshold =
        typeof b.warningThresholdPercent === 'number' && Number.isFinite(b.warningThresholdPercent)
          ? Math.min(100, Math.max(10, Math.trunc(b.warningThresholdPercent)))
          : 80;
      insertBudgetStmt.run(
        finalId,
        userId,
        cat,
        month,
        Math.round(b.limitAmount * 100) / 100,
        threshold,
        sanitizeIsoStr(b.createdAt, now),
        sanitizeIsoStr(b.updatedAt, now)
      );
      existingBudgetKeys.add(uniqueKey);
      financeApplied += 1;
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    for (const written of writtenDiskFiles) {
      try {
        if (fs.existsSync(written)) fs.unlinkSync(written);
      } catch {
        // Best-effort rollback disk cleanup
      }
    }
    throw err;
  }

  // Post-commit cleanup of replaced disk attachments
  if (strategy === 'replace' && oldDiskFilesToDelete.length > 0) {
    for (const oldPath of oldDiskFilesToDelete) {
      try {
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch {
        // Best-effort cleanup
      }
    }
  }

  const finalPreview = buildBackupPreview(backup, {
    migratedFromVersion: verified.preview.migratedFromVersion,
    extraWarnings: runtimeWarnings,
  });

  return {
    restored: true,
    strategy,
    preview: finalPreview,
    summary: {
      workspaceApplied: workspaceResult.appliedCount,
      workspaceSkipped: workspaceResult.skippedCount,
      learningApplied,
      learningSkipped,
      filesRestored,
      financeApplied,
      financeSkipped,
      warnings: Array.from(new Set(runtimeWarnings)),
    },
    syncVersion: workspaceResult.syncVersion,
  };
}
