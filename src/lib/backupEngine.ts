import type {
  Course,
  DailyPriority,
  DailyScheduleActivity,
  FocusSession,
  Goal,
  Habit,
  HabitCompletion,
  JournalEntry,
  LearningBootstrapData,
  LearningLesson,
  LearningModule,
  LearningNote,
  LearningResource,
  LearningStudySession,
  LearningTask,
  NinetyDayPlan,
  Project,
  ResourceItem,
  StudySession,
  Task,
  UserPreferences,
  UserProfile,
  WorkoutRoutine,
  WorkoutSession,
  AppNotification,
} from '../types';
import type {
  FinanceBootstrapData,
  FinanceBudget,
  FinanceCategory,
  FinanceRecurringPayment,
  FinanceSavingsGoal,
  FinanceSettings,
  FinanceTransaction,
} from '../types/finance';
import { SYNC_COLLECTION_KEYS, stableSerialize, type SyncCollectionKey } from './syncEngine';
import type { AppState } from './storage';

export const BACKUP_FORMAT = 'momentum-complete-backup' as const;
export const CURRENT_BACKUP_SCHEMA_VERSION = 2 as const;
export const BACKUP_APP_VERSION = '2.0.0' as const;
export const MAX_BACKUP_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_BACKUP_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.log',
  '.py',
  '.js',
  '.ts',
  '.tsx',
  '.sh',
  '.sql',
  '.yaml',
  '.yml',
  '.conf',
  '.xml',
  '.zip',
  '.xls',
  '.xlsx',
  '.odt',
  '.odp',
]);

export type RestoreStrategy = 'merge' | 'replace';

export interface BackupWorkspacePayload {
  profile: Partial<UserProfile> & { updatedAt?: string };
  preferences: Partial<UserPreferences> & { updatedAt?: string };
  collections: Record<SyncCollectionKey, any[]>;
}

export interface BackupLearningAttachment {
  resourceId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  fileExtension: string;
  sha256: string;
  contentBase64: string;
}

export interface BackupLearningPayload {
  modules: LearningModule[];
  lessons: LearningLesson[];
  notes: LearningNote[];
  resources: LearningResource[];
  tasks: LearningTask[];
  studySessions: LearningStudySession[];
  attachments: BackupLearningAttachment[];
}

export interface BackupFinancePayload {
  settings?: Partial<FinanceSettings>;
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  budgets: FinanceBudget[];
  savingsGoals: FinanceSavingsGoal[];
  recurringPayments: FinanceRecurringPayment[];
}

export interface MomentumCompleteBackupV2 {
  format: typeof BACKUP_FORMAT;
  schemaVersion: typeof CURRENT_BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  appVersion: string;
  integrityAlgorithm: 'SHA-256';
  checksum: string;
  warnings?: string[];
  workspace: BackupWorkspacePayload;
  learning: BackupLearningPayload;
  finance: BackupFinancePayload;
}

export type BackupValidationErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_VERSION'
  | 'CORRUPTED_CHECKSUM'
  | 'CORRUPTED_ATTACHMENT'
  | 'INVALID_STRUCTURE'
  | 'UNSUPPORTED_ATTACHMENT_TYPE';

export class BackupValidationError extends Error {
  code: BackupValidationErrorCode;
  details?: string;

  constructor(code: BackupValidationErrorCode, message: string, details?: string) {
    super(message);
    this.name = 'BackupValidationError';
    this.code = code;
    this.details = details;
  }
}

export interface BackupPreviewCounts {
  tasks: number;
  dailyPriorities: number;
  goals: number;
  ninetyDayPlans: number;
  projects: number;
  habits: number;
  habitCompletions: number;
  calendarActivities: number;
  journalEntries: number;
  focusSessions: number;
  workoutRoutines: number;
  workoutSessions: number;
  courses: number;
  studySessions: number;
  workspaceResources: number;
  notifications: number;
  learningModules: number;
  learningLessons: number;
  learningNotes: number;
  assignments: number;
  practicalLabs: number;
  learningTasksOther: number;
  learningTasksTotal: number;
  learningStudySessions: number;
  learningResources: number;
  attachedFiles: number;
  attachedFilesTotalBytes: number;
  financeCategories: number;
  financeTransactions: number;
  budgets: number;
  savingsGoals: number;
  savingsContributions: number;
  recurringPayments: number;
  hasPreferences: boolean;
}

export interface BackupPreviewSummary {
  format: string;
  exportedAt: string;
  appVersion: string;
  schemaVersion: number;
  migratedFromVersion?: number;
  integrityStatus: 'verified' | 'migrated_legacy';
  checksumValid: boolean;
  warnings: string[];
  counts: BackupPreviewCounts;
}

export interface VerifiedBackupResult {
  backup: MomentumCompleteBackupV2;
  preview: BackupPreviewSummary;
}

const SENSITIVE_KEY_SET = new Set([
  'password',
  'passwordhash',
  'passwordsalt',
  'password_hash',
  'password_salt',
  'token',
  'tokenhash',
  'token_hash',
  'sessiontoken',
  'session_token',
  'sessionid',
  'session_id',
  'sessionsecret',
  'session_secret',
  'secret',
  'apikey',
  'api_key',
  'sessions',
  'storagefilename',
  'storage_filename',
]);

export function stripSecretsDeep<T>(value: T): T {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => stripSecretsDeep(item)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_SET.has(k.toLowerCase())) {
      continue;
    }
    out[k] = stripSecretsDeep(v);
  }
  return out as T;
}

function sanitizeSafeProfile(raw: any): Partial<UserProfile> & { updatedAt?: string } {
  if (!raw || typeof raw !== 'object') return {};
  const cleaned = stripSecretsDeep(raw) as Record<string, unknown>;
  const safe: Partial<UserProfile> & { updatedAt?: string } = {};
  if (typeof cleaned.id === 'string') safe.id = cleaned.id;
  if (typeof cleaned.email === 'string') safe.email = cleaned.email;
  if (typeof cleaned.fullName === 'string') safe.fullName = cleaned.fullName;
  if (typeof cleaned.avatarUrl === 'string') safe.avatarUrl = cleaned.avatarUrl;
  if (typeof cleaned.timezone === 'string') safe.timezone = cleaned.timezone;
  if (typeof cleaned.preferredLanguage === 'string') safe.preferredLanguage = cleaned.preferredLanguage;
  if (Array.isArray(cleaned.lifeAreas)) {
    safe.lifeAreas = cleaned.lifeAreas.filter((a): a is any => typeof a === 'string');
  }
  if (typeof cleaned.visionStatement === 'string') safe.visionStatement = cleaned.visionStatement;
  if (typeof cleaned.dailyAvailabilityHours === 'number' && Number.isFinite(cleaned.dailyAvailabilityHours)) {
    safe.dailyAvailabilityHours = cleaned.dailyAvailabilityHours;
  }
  if (typeof cleaned.onboardingCompleted === 'boolean') {
    safe.onboardingCompleted = cleaned.onboardingCompleted;
  }
  if (typeof cleaned.createdAt === 'string') safe.createdAt = cleaned.createdAt;
  if (typeof cleaned.updatedAt === 'string') safe.updatedAt = cleaned.updatedAt;
  return safe;
}

export function createEmptyCollectionsRecord(): Record<SyncCollectionKey, any[]> {
  return {
    tasks: [],
    dailyPriorities: [],
    goals: [],
    ninetyDayPlans: [],
    projects: [],
    habits: [],
    habitCompletions: [],
    dailySchedule: [],
    journalEntries: [],
    focusSessions: [],
    workoutRoutines: [],
    workoutSessions: [],
    courses: [],
    studySessions: [],
    resources: [],
    notifications: [],
  };
}

export function createEmptyLearningPayload(): BackupLearningPayload {
  return {
    modules: [],
    lessons: [],
    notes: [],
    resources: [],
    tasks: [],
    studySessions: [],
    attachments: [],
  };
}

export function createEmptyFinancePayload(): BackupFinancePayload {
  return {
    categories: [],
    transactions: [],
    budgets: [],
    savingsGoals: [],
    recurringPayments: [],
  };
}

function getSubtleCrypto(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto SubtleCrypto API is required for backup integrity verification.');
  }
  return subtle;
}

export async function computeSha256HexFromBytes(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await getSubtleCrypto().digest('SHA-256', copy.buffer);
  const out = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < out.length; i += 1) {
    hex += out[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function computeSha256HexFromString(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  return computeSha256HexFromBytes(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const normalized = base64.replace(/\s+/g, '');
  if (!normalized || normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error('Invalid base64 encoding');
  }
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(normalized, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(normalized);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function getFileExtension(filename: string, explicitExt?: string): string {
  const candidate = (explicitExt || '').trim().toLowerCase();
  if (candidate.startsWith('.')) return candidate;
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

function canonicalBackupPayloadForChecksum(
  draft: Omit<MomentumCompleteBackupV2, 'checksum' | 'integrityAlgorithm' | 'warnings'>
): string {
  return stableSerialize({
    format: draft.format,
    schemaVersion: draft.schemaVersion,
    exportedAt: draft.exportedAt,
    appVersion: draft.appVersion,
    workspace: draft.workspace,
    learning: draft.learning,
    finance: draft.finance,
  });
}

export async function finalizeBackupEnvelope(draft: {
  exportedAt?: string;
  appVersion?: string;
  warnings?: string[];
  workspace: BackupWorkspacePayload;
  learning: BackupLearningPayload;
  finance: BackupFinancePayload;
}): Promise<MomentumCompleteBackupV2> {
  const exportedAt = draft.exportedAt || new Date().toISOString();
  const appVersion = draft.appVersion || BACKUP_APP_VERSION;

  const collections = createEmptyCollectionsRecord();
  for (const key of SYNC_COLLECTION_KEYS) {
    const arr = Array.isArray(draft.workspace?.collections?.[key])
      ? draft.workspace.collections[key]
      : [];
    collections[key] = stripSecretsDeep(arr);
  }

  const normalizedWorkspace: BackupWorkspacePayload = {
    profile: sanitizeSafeProfile(draft.workspace?.profile),
    preferences: stripSecretsDeep(
      draft.workspace?.preferences && typeof draft.workspace.preferences === 'object'
        ? draft.workspace.preferences
        : {}
    ),
    collections,
  };

  const normalizedLearning: BackupLearningPayload = {
    modules: stripSecretsDeep(Array.isArray(draft.learning?.modules) ? draft.learning.modules : []),
    lessons: stripSecretsDeep(Array.isArray(draft.learning?.lessons) ? draft.learning.lessons : []),
    notes: stripSecretsDeep(Array.isArray(draft.learning?.notes) ? draft.learning.notes : []),
    resources: stripSecretsDeep(
      Array.isArray(draft.learning?.resources) ? draft.learning.resources : []
    ),
    tasks: stripSecretsDeep(Array.isArray(draft.learning?.tasks) ? draft.learning.tasks : []),
    studySessions: stripSecretsDeep(
      Array.isArray(draft.learning?.studySessions) ? draft.learning.studySessions : []
    ),
    attachments: stripSecretsDeep(
      Array.isArray(draft.learning?.attachments) ? draft.learning.attachments : []
    ),
  };

  const normalizedFinance: BackupFinancePayload = {
    ...(draft.finance?.settings && typeof draft.finance.settings === 'object'
      ? { settings: stripSecretsDeep(draft.finance.settings) }
      : {}),
    categories: stripSecretsDeep(
      Array.isArray(draft.finance?.categories) ? draft.finance.categories : []
    ),
    transactions: stripSecretsDeep(
      Array.isArray(draft.finance?.transactions) ? draft.finance.transactions : []
    ),
    budgets: stripSecretsDeep(Array.isArray(draft.finance?.budgets) ? draft.finance.budgets : []),
    savingsGoals: stripSecretsDeep(
      Array.isArray(draft.finance?.savingsGoals) ? draft.finance.savingsGoals : []
    ),
    recurringPayments: stripSecretsDeep(
      Array.isArray(draft.finance?.recurringPayments) ? draft.finance.recurringPayments : []
    ),
  };

  const corePayload = {
    format: BACKUP_FORMAT,
    schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
    exportedAt,
    appVersion,
    workspace: normalizedWorkspace,
    learning: normalizedLearning,
    finance: normalizedFinance,
  } as const;

  const checksum = await computeSha256HexFromString(canonicalBackupPayloadForChecksum(corePayload));
  const warnings = Array.isArray(draft.warnings)
    ? draft.warnings.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
    : [];

  return {
    ...corePayload,
    integrityAlgorithm: 'SHA-256',
    checksum,
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}

function isLegacyV0AppState(obj: any): obj is AppState {
  return Boolean(
    obj &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      obj.profile &&
      typeof obj.profile === 'object' &&
      Array.isArray(obj.tasks) &&
      obj.format === undefined &&
      obj.schemaVersion === undefined
  );
}

function ensureArrayOfObjects(value: unknown, fieldName: string): any[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new BackupValidationError(
      'INVALID_STRUCTURE',
      `Backup field "${fieldName}" is corrupted or not a valid list.`
    );
  }
  for (let i = 0; i < value.length; i += 1) {
    if (!value[i] || typeof value[i] !== 'object' || Array.isArray(value[i])) {
      throw new BackupValidationError(
        'INVALID_STRUCTURE',
        `Backup field "${fieldName}" contains an invalid entry at index ${i}.`
      );
    }
  }
  return value;
}

export async function migrateBackupToV2(rawParsed: unknown): Promise<{
  backup: MomentumCompleteBackupV2;
  migratedFromVersion?: number;
  wasV2WithChecksum: boolean;
}> {
  if (!rawParsed || typeof rawParsed !== 'object' || Array.isArray(rawParsed)) {
    throw new BackupValidationError(
      'INVALID_FORMAT',
      'The selected file is not a valid MOMENTUM backup object.'
    );
  }

  const obj = rawParsed as Record<string, any>;

  // Case 1: Legacy v0 raw AppState JSON from pre-v2 exports
  if (isLegacyV0AppState(obj)) {
    const legacyObj = obj as Record<string, any>;
    const collections = createEmptyCollectionsRecord();
    for (const key of SYNC_COLLECTION_KEYS) {
      const rawArr = legacyObj[key];
      if (rawArr !== undefined) {
        collections[key] = ensureArrayOfObjects(rawArr, key);
      }
    }
    // Strip server-synced learning task projections from workspace tasks when migrating
    collections.tasks = collections.tasks.filter(t => !t.learningModuleId);

    const backup = await finalizeBackupEnvelope({
      exportedAt:
        typeof legacyObj.exportedAt === 'string'
          ? legacyObj.exportedAt
          : typeof legacyObj.profile?.updatedAt === 'string'
            ? legacyObj.profile.updatedAt
            : new Date().toISOString(),
      appVersion: '1.0.0-legacy',
      warnings: [
        'Migrated from a legacy v0 workspace JSON export. Server-side Learning modules/files and Finance records were not included in v0 backups.',
      ],
      workspace: {
        profile: sanitizeSafeProfile(obj.profile),
        preferences:
          obj.preferences && typeof obj.preferences === 'object'
            ? stripSecretsDeep(obj.preferences)
            : {},
        collections,
      },
      learning: createEmptyLearningPayload(),
      finance: createEmptyFinancePayload(),
    });

    return {
      backup,
      migratedFromVersion: 0,
      wasV2WithChecksum: false,
    };
  }

  // Must carry either recognizable format or schemaVersion
  if (obj.format !== undefined && obj.format !== BACKUP_FORMAT) {
    throw new BackupValidationError(
      'INVALID_FORMAT',
      `Unrecognized backup format "${String(obj.format)}". Expected "${BACKUP_FORMAT}".`
    );
  }

  const version = obj.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new BackupValidationError(
      'INVALID_FORMAT',
      'This file does not appear to be a MOMENTUM backup file.'
    );
  }

  if (version > CURRENT_BACKUP_SCHEMA_VERSION) {
    throw new BackupValidationError(
      'UNSUPPORTED_VERSION',
      `This backup uses schema v${version}, which is newer than this version of MOMENTUM (supports up to v${CURRENT_BACKUP_SCHEMA_VERSION}).`
    );
  }

  // Case 2: v1 backup envelope -> upgrade to v2
  if (version === 1) {
    const workspaceObj =
      obj.workspace && typeof obj.workspace === 'object' ? obj.workspace : obj;
    const rawCollections =
      workspaceObj.collections && typeof workspaceObj.collections === 'object'
        ? workspaceObj.collections
        : workspaceObj;

    const collections = createEmptyCollectionsRecord();
    for (const key of SYNC_COLLECTION_KEYS) {
      if (rawCollections[key] !== undefined) {
        collections[key] = ensureArrayOfObjects(rawCollections[key], `workspace.${key}`);
      }
    }
    collections.tasks = collections.tasks.filter(t => !t.learningModuleId);

    const learningRaw = obj.learning && typeof obj.learning === 'object' ? obj.learning : {};
    const financeRaw = obj.finance && typeof obj.finance === 'object' ? obj.finance : {};

    const learning: BackupLearningPayload = {
      modules: ensureArrayOfObjects(learningRaw.modules, 'learning.modules'),
      lessons: ensureArrayOfObjects(learningRaw.lessons, 'learning.lessons'),
      notes: ensureArrayOfObjects(learningRaw.notes, 'learning.notes'),
      resources: ensureArrayOfObjects(learningRaw.resources, 'learning.resources'),
      tasks: ensureArrayOfObjects(learningRaw.tasks, 'learning.tasks'),
      studySessions: ensureArrayOfObjects(learningRaw.studySessions, 'learning.studySessions'),
      attachments: ensureArrayOfObjects(learningRaw.attachments, 'learning.attachments'),
    };

    const finance: BackupFinancePayload = {
      ...(financeRaw.settings && typeof financeRaw.settings === 'object'
        ? { settings: stripSecretsDeep(financeRaw.settings) }
        : {}),
      categories: ensureArrayOfObjects(financeRaw.categories, 'finance.categories'),
      transactions: ensureArrayOfObjects(financeRaw.transactions, 'finance.transactions'),
      budgets: ensureArrayOfObjects(financeRaw.budgets, 'finance.budgets'),
      savingsGoals: ensureArrayOfObjects(financeRaw.savingsGoals, 'finance.savingsGoals'),
      recurringPayments: ensureArrayOfObjects(
        financeRaw.recurringPayments,
        'finance.recurringPayments'
      ),
    };

    const backup = await finalizeBackupEnvelope({
      exportedAt:
        typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      appVersion: typeof obj.appVersion === 'string' ? obj.appVersion : '1.x',
      warnings: [
        ...(Array.isArray(obj.warnings) ? obj.warnings : []),
        'Migrated backup archive from schema v1 to schema v2.',
      ],
      workspace: {
        profile: sanitizeSafeProfile(workspaceObj.profile || obj.profile),
        preferences: stripSecretsDeep(
          workspaceObj.preferences || obj.preferences || {}
        ),
        collections,
      },
      learning,
      finance,
    });

    return {
      backup,
      migratedFromVersion: 1,
      wasV2WithChecksum: false,
    };
  }

  // Case 3: Current v2 format — validate strict required sections + verify checksum
  if (obj.format !== BACKUP_FORMAT) {
    throw new BackupValidationError(
      'INVALID_FORMAT',
      'Missing MOMENTUM backup format identifier.'
    );
  }
  if (typeof obj.exportedAt !== 'string' || !obj.exportedAt.trim()) {
    throw new BackupValidationError(
      'INVALID_STRUCTURE',
      'Backup metadata is missing an export timestamp.'
    );
  }
  if (!obj.workspace || typeof obj.workspace !== 'object') {
    throw new BackupValidationError(
      'INVALID_STRUCTURE',
      'Backup is missing the workspace section.'
    );
  }
  if (!obj.workspace.collections || typeof obj.workspace.collections !== 'object') {
    throw new BackupValidationError(
      'INVALID_STRUCTURE',
      'Backup is missing workspace collections.'
    );
  }
  if (!obj.learning || typeof obj.learning !== 'object') {
    throw new BackupValidationError(
      'INVALID_STRUCTURE',
      'Backup is missing the Learning section.'
    );
  }
  if (!obj.finance || typeof obj.finance !== 'object') {
    throw new BackupValidationError(
      'INVALID_STRUCTURE',
      'Backup is missing the Finance section.'
    );
  }
  if (typeof obj.checksum !== 'string' || !/^[a-f0-9]{64}$/i.test(obj.checksum.trim())) {
    throw new BackupValidationError(
      'CORRUPTED_CHECKSUM',
      'Backup integrity checksum is missing or malformed. The file may be corrupted.'
    );
  }

  const collections = createEmptyCollectionsRecord();
  for (const key of SYNC_COLLECTION_KEYS) {
    collections[key] = ensureArrayOfObjects(
      obj.workspace.collections[key],
      `workspace.collections.${key}`
    );
  }

  const learning: BackupLearningPayload = {
    modules: ensureArrayOfObjects(obj.learning.modules, 'learning.modules'),
    lessons: ensureArrayOfObjects(obj.learning.lessons, 'learning.lessons'),
    notes: ensureArrayOfObjects(obj.learning.notes, 'learning.notes'),
    resources: ensureArrayOfObjects(obj.learning.resources, 'learning.resources'),
    tasks: ensureArrayOfObjects(obj.learning.tasks, 'learning.tasks'),
    studySessions: ensureArrayOfObjects(obj.learning.studySessions, 'learning.studySessions'),
    attachments: ensureArrayOfObjects(obj.learning.attachments, 'learning.attachments'),
  };

  const finance: BackupFinancePayload = {
    ...(obj.finance.settings && typeof obj.finance.settings === 'object'
      ? { settings: stripSecretsDeep(obj.finance.settings) }
      : {}),
    categories: ensureArrayOfObjects(obj.finance.categories, 'finance.categories'),
    transactions: ensureArrayOfObjects(obj.finance.transactions, 'finance.transactions'),
    budgets: ensureArrayOfObjects(obj.finance.budgets, 'finance.budgets'),
    savingsGoals: ensureArrayOfObjects(obj.finance.savingsGoals, 'finance.savingsGoals'),
    recurringPayments: ensureArrayOfObjects(
      obj.finance.recurringPayments,
      'finance.recurringPayments'
    ),
  };

  const workspace: BackupWorkspacePayload = {
    profile: sanitizeSafeProfile(obj.workspace.profile),
    preferences: stripSecretsDeep(
      obj.workspace.preferences && typeof obj.workspace.preferences === 'object'
        ? obj.workspace.preferences
        : {}
    ),
    collections,
  };

  const appVersion = typeof obj.appVersion === 'string' ? obj.appVersion : BACKUP_APP_VERSION;
  const expectedChecksum = await computeSha256HexFromString(
    canonicalBackupPayloadForChecksum({
      format: BACKUP_FORMAT,
      schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      exportedAt: obj.exportedAt,
      appVersion,
      workspace,
      learning,
      finance,
    })
  );

  if (expectedChecksum.toLowerCase() !== obj.checksum.trim().toLowerCase()) {
    throw new BackupValidationError(
      'CORRUPTED_CHECKSUM',
      'Backup integrity check failed (checksum mismatch). This file was modified or corrupted and cannot be safely restored.'
    );
  }

  const warnings = Array.isArray(obj.warnings)
    ? obj.warnings.filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
    : [];

  return {
    backup: {
      format: BACKUP_FORMAT,
      schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      exportedAt: obj.exportedAt,
      appVersion,
      integrityAlgorithm: 'SHA-256',
      checksum: expectedChecksum,
      ...(warnings.length > 0 ? { warnings } : {}),
      workspace,
      learning,
      finance,
    },
    migratedFromVersion: undefined,
    wasV2WithChecksum: true,
  };
}

async function verifyAttachmentsIntegrity(backup: MomentumCompleteBackupV2): Promise<string[]> {
  const warnings: string[] = [];
  const attachmentsByResourceId = new Map<string, BackupLearningAttachment>();

  for (const att of backup.learning.attachments) {
    if (
      !att ||
      typeof att.resourceId !== 'string' ||
      typeof att.originalFilename !== 'string' ||
      typeof att.sha256 !== 'string' ||
      typeof att.contentBase64 !== 'string'
    ) {
      throw new BackupValidationError(
        'CORRUPTED_ATTACHMENT',
        'Backup contains a malformed attachment entry.'
      );
    }

    const ext = getFileExtension(att.originalFilename, att.fileExtension);
    if (!ext || !ALLOWED_BACKUP_EXTENSIONS.has(ext)) {
      throw new BackupValidationError(
        'UNSUPPORTED_ATTACHMENT_TYPE',
        `Attachment "${att.originalFilename}" uses an unsupported file extension (${ext || 'none'}).`
      );
    }

    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(att.contentBase64);
    } catch {
      throw new BackupValidationError(
        'CORRUPTED_ATTACHMENT',
        `Attachment "${att.originalFilename}" has corrupted binary encoding.`
      );
    }

    if (bytes.byteLength > MAX_BACKUP_ATTACHMENT_BYTES) {
      throw new BackupValidationError(
        'CORRUPTED_ATTACHMENT',
        `Attachment "${att.originalFilename}" exceeds the 25 MB per-file limit.`
      );
    }

    if (typeof att.fileSize === 'number' && att.fileSize >= 0 && bytes.byteLength !== att.fileSize) {
      throw new BackupValidationError(
        'CORRUPTED_ATTACHMENT',
        `Attachment "${att.originalFilename}" size does not match backup metadata (expected ${att.fileSize} bytes, got ${bytes.byteLength}).`
      );
    }

    const actualHash = await computeSha256HexFromBytes(bytes);
    if (actualHash.toLowerCase() !== att.sha256.trim().toLowerCase()) {
      throw new BackupValidationError(
        'CORRUPTED_ATTACHMENT',
        `Attachment "${att.originalFilename}" failed SHA-256 verification and may be corrupted.`
      );
    }

    attachmentsByResourceId.set(att.resourceId, att);
  }

  for (const res of backup.learning.resources) {
    if (res.kind === 'file' && !attachmentsByResourceId.has(res.id)) {
      warnings.push(
        `Attachment binary for "${res.originalFilename || res.title}" was missing when this backup was exported.`
      );
    }
  }

  return warnings;
}

export function buildBackupPreview(
  backup: MomentumCompleteBackupV2,
  meta: {
    migratedFromVersion?: number;
    wasV2WithChecksum?: boolean;
    extraWarnings?: string[];
  } = {}
): BackupPreviewSummary {
  const c = backup.workspace.collections;
  const learningTasks = backup.learning.tasks || [];
  let assignments = 0;
  let practicalLabs = 0;
  let learningTasksOther = 0;

  for (const t of learningTasks) {
    if (t.taskKind === 'assignment') assignments += 1;
    else if (t.taskKind === 'lab') practicalLabs += 1;
    else learningTasksOther += 1;
  }

  const savingsGoals = backup.finance.savingsGoals || [];
  const savingsContributions = savingsGoals.reduce(
    (sum, g) => sum + (Array.isArray(g.contributions) ? g.contributions.length : 0),
    0
  );

  const attachedFilesTotalBytes = (backup.learning.attachments || []).reduce(
    (sum, a) => sum + (typeof a.fileSize === 'number' ? a.fileSize : 0),
    0
  );

  const warnings = Array.from(
    new Set([...(backup.warnings || []), ...(meta.extraWarnings || [])])
  );

  return {
    format: backup.format,
    exportedAt: backup.exportedAt,
    appVersion: backup.appVersion,
    schemaVersion: backup.schemaVersion,
    ...(meta.migratedFromVersion !== undefined
      ? { migratedFromVersion: meta.migratedFromVersion }
      : {}),
    integrityStatus: meta.migratedFromVersion !== undefined ? 'migrated_legacy' : 'verified',
    checksumValid: true,
    warnings,
    counts: {
      tasks: (c.tasks || []).length,
      dailyPriorities: (c.dailyPriorities || []).length,
      goals: (c.goals || []).length,
      ninetyDayPlans: (c.ninetyDayPlans || []).length,
      projects: (c.projects || []).length,
      habits: (c.habits || []).length,
      habitCompletions: (c.habitCompletions || []).length,
      calendarActivities: (c.dailySchedule || []).length,
      journalEntries: (c.journalEntries || []).length,
      focusSessions: (c.focusSessions || []).length,
      workoutRoutines: (c.workoutRoutines || []).length,
      workoutSessions: (c.workoutSessions || []).length,
      courses: (c.courses || []).length,
      studySessions: (c.studySessions || []).length,
      workspaceResources: (c.resources || []).length,
      notifications: (c.notifications || []).length,
      learningModules: (backup.learning.modules || []).length,
      learningLessons: (backup.learning.lessons || []).length,
      learningNotes: (backup.learning.notes || []).length,
      assignments,
      practicalLabs,
      learningTasksOther,
      learningTasksTotal: learningTasks.length,
      learningStudySessions: (backup.learning.studySessions || []).length,
      learningResources: (backup.learning.resources || []).length,
      attachedFiles: (backup.learning.attachments || []).length,
      attachedFilesTotalBytes,
      financeCategories: (backup.finance.categories || []).length,
      financeTransactions: (backup.finance.transactions || []).length,
      budgets: (backup.finance.budgets || []).length,
      savingsGoals: savingsGoals.length,
      savingsContributions,
      recurringPayments: (backup.finance.recurringPayments || []).length,
      hasPreferences: Object.keys(backup.workspace.preferences || {}).length > 0,
    },
  };
}

export async function verifyAndNormalizeBackupPayload(
  rawParsed: unknown
): Promise<VerifiedBackupResult> {
  const migrated = await migrateBackupToV2(rawParsed);
  const extraWarnings = await verifyAttachmentsIntegrity(migrated.backup);
  const preview = buildBackupPreview(migrated.backup, {
    migratedFromVersion: migrated.migratedFromVersion,
    wasV2WithChecksum: migrated.wasV2WithChecksum,
    extraWarnings,
  });
  return {
    backup: migrated.backup,
    preview,
  };
}

export async function parseAndVerifyBackupText(rawText: string): Promise<VerifiedBackupResult> {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new BackupValidationError('INVALID_JSON', 'The selected backup file is empty.');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new BackupValidationError(
      'INVALID_JSON',
      'Could not parse JSON. The file may be corrupted or not a valid MOMENTUM backup.'
    );
  }
  return verifyAndNormalizeBackupPayload(parsed);
}

export async function createCompleteBackupFromClientState(params: {
  appState: AppState;
  learning?: LearningBootstrapData | null;
  finance?: FinanceBootstrapData | null;
}): Promise<MomentumCompleteBackupV2> {
  const { appState, learning, finance } = params;
  const collections = createEmptyCollectionsRecord();
  for (const key of SYNC_COLLECTION_KEYS) {
    const arr = (appState as any)[key];
    collections[key] = Array.isArray(arr) ? arr : [];
  }
  collections.tasks = collections.tasks.filter(t => !t.learningModuleId);

  return finalizeBackupEnvelope({
    exportedAt: new Date().toISOString(),
    appVersion: BACKUP_APP_VERSION,
    workspace: {
      profile: sanitizeSafeProfile(appState.profile),
      preferences: appState.preferences,
      collections,
    },
    learning: learning
      ? {
          modules: learning.modules || [],
          lessons: learning.lessons || [],
          notes: learning.notes || [],
          resources: learning.resources || [],
          tasks: learning.tasks || [],
          studySessions: learning.studySessions || [],
          attachments: [],
        }
      : createEmptyLearningPayload(),
    finance: finance
      ? {
          settings: finance.settings,
          categories: finance.categories || [],
          transactions: finance.transactions || [],
          budgets: finance.budgets || [],
          savingsGoals: finance.savingsGoals || [],
          recurringPayments: finance.recurringPayments || [],
        }
      : createEmptyFinancePayload(),
  });
}

function mergeArrayById<T extends { id?: string }>(
  existing: T[],
  incoming: T[],
  userId: string
): T[] {
  const seen = new Set(existing.map(item => item.id).filter(Boolean));
  const additions: T[] = [];
  for (const item of incoming) {
    if (!item || typeof item !== 'object') continue;
    const id = item.id;
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    additions.push({ ...item, userId });
  }
  return [...additions, ...existing];
}

export function applyBackupToLocalAppState(params: {
  currentState: AppState;
  backup: MomentumCompleteBackupV2;
  strategy: RestoreStrategy;
  userId?: string;
}): AppState {
  const { currentState, backup, strategy } = params;
  const effectiveUserId = params.userId || currentState.profile.id;
  const c = backup.workspace.collections;

  if (strategy === 'replace') {
    const rebind = <T extends Record<string, any>>(arr: T[]): T[] =>
      (arr || []).map(item => ({
        ...item,
        ...(typeof item.userId === 'string' || !item.userId ? { userId: effectiveUserId } : {}),
      }));

    return {
      profile: {
        ...currentState.profile,
        ...backup.workspace.profile,
        id: effectiveUserId,
      },
      preferences: {
        ...currentState.preferences,
        ...backup.workspace.preferences,
      },
      tasks: rebind(c.tasks as Task[]),
      goals: rebind(c.goals as Goal[]),
      projects: rebind(c.projects as Project[]),
      habits: rebind(c.habits as Habit[]),
      habitCompletions: rebind(c.habitCompletions as HabitCompletion[]),
      ninetyDayPlans: rebind(c.ninetyDayPlans as NinetyDayPlan[]),
      courses: rebind(c.courses as Course[]),
      studySessions: rebind(c.studySessions as StudySession[]),
      workoutRoutines: rebind(c.workoutRoutines as WorkoutRoutine[]),
      workoutSessions: rebind(c.workoutSessions as WorkoutSession[]),
      focusSessions: rebind(c.focusSessions as FocusSession[]),
      dailySchedule: rebind(c.dailySchedule as DailyScheduleActivity[]),
      journalEntries: rebind(c.journalEntries as JournalEntry[]),
      resources: rebind(c.resources as ResourceItem[]),
      notifications: rebind(c.notifications as AppNotification[]),
      isDemoMode: false,
    };
  }

  // Merge non-destructively (keep existing records & preferences on conflict)
  return {
    ...currentState,
    profile: {
      ...backup.workspace.profile,
      ...currentState.profile,
      id: effectiveUserId,
    },
    preferences: {
      ...backup.workspace.preferences,
      ...currentState.preferences,
    },
    tasks: mergeArrayById(currentState.tasks, c.tasks as Task[], effectiveUserId),
    goals: mergeArrayById(currentState.goals, c.goals as Goal[], effectiveUserId),
    projects: mergeArrayById(currentState.projects, c.projects as Project[], effectiveUserId),
    habits: mergeArrayById(currentState.habits, c.habits as Habit[], effectiveUserId),
    habitCompletions: mergeArrayById(
      currentState.habitCompletions,
      c.habitCompletions as HabitCompletion[],
      effectiveUserId
    ),
    ninetyDayPlans: mergeArrayById(
      currentState.ninetyDayPlans,
      c.ninetyDayPlans as NinetyDayPlan[],
      effectiveUserId
    ),
    courses: mergeArrayById(currentState.courses, c.courses as Course[], effectiveUserId),
    studySessions: mergeArrayById(
      currentState.studySessions,
      c.studySessions as StudySession[],
      effectiveUserId
    ),
    workoutRoutines: mergeArrayById(
      currentState.workoutRoutines,
      c.workoutRoutines as WorkoutRoutine[],
      effectiveUserId
    ),
    workoutSessions: mergeArrayById(
      currentState.workoutSessions,
      c.workoutSessions as WorkoutSession[],
      effectiveUserId
    ),
    focusSessions: mergeArrayById(
      currentState.focusSessions,
      c.focusSessions as FocusSession[],
      effectiveUserId
    ),
    dailySchedule: mergeArrayById(
      currentState.dailySchedule,
      c.dailySchedule as DailyScheduleActivity[],
      effectiveUserId
    ),
    journalEntries: mergeArrayById(
      currentState.journalEntries,
      c.journalEntries as JournalEntry[],
      effectiveUserId
    ),
    resources: mergeArrayById(currentState.resources, c.resources as ResourceItem[], effectiveUserId),
    notifications: mergeArrayById(
      currentState.notifications,
      c.notifications as AppNotification[],
      effectiveUserId
    ),
    isDemoMode: false,
  };
}

export function formatBackupBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
