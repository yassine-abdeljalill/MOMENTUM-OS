import type {
  AppNotification,
  Course,
  DailyPriority,
  DailyScheduleActivity,
  FocusSession,
  Goal,
  Habit,
  HabitCompletion,
  JournalEntry,
  NinetyDayPlan,
  Project,
  ResourceItem,
  StudySession,
  Task,
  UserPreferences,
  UserProfile,
  WorkoutRoutine,
  WorkoutSession,
} from '../types';
import type { AppState } from './storage';

export const SYNC_COLLECTION_KEYS = [
  'tasks',
  'dailyPriorities',
  'goals',
  'ninetyDayPlans',
  'projects',
  'habits',
  'habitCompletions',
  'dailySchedule',
  'journalEntries',
  'focusSessions',
  'workoutRoutines',
  'workoutSessions',
  'courses',
  'studySessions',
  'resources',
  'notifications',
] as const;

export type SyncCollectionKey = (typeof SYNC_COLLECTION_KEYS)[number];

export interface SyncCollectionItemMap {
  tasks: Task;
  dailyPriorities: DailyPriority;
  goals: Goal;
  ninetyDayPlans: NinetyDayPlan;
  projects: Project;
  habits: Habit;
  habitCompletions: HabitCompletion;
  dailySchedule: DailyScheduleActivity;
  journalEntries: JournalEntry;
  focusSessions: FocusSession;
  workoutRoutines: WorkoutRoutine;
  workoutSessions: WorkoutSession;
  courses: Course;
  studySessions: StudySession;
  resources: ResourceItem;
  notifications: AppNotification;
}

export interface SyncMutationRecord<T = any> {
  id: string;
  data?: T;
  updatedAt: string;
  baseUpdatedAt?: string;
  deletedAt?: string | null;
}

export interface SyncConflict {
  collection: string;
  id: string;
  resolution: 'server_wins' | 'client_wins_merged';
  serverUpdatedAt: string;
  clientUpdatedAt: string;
  reason: string;
}

export interface WorkspaceTombstone {
  id: string;
  deletedAt: string;
  updatedAt: string;
}

export interface WorkspaceBootstrapResponse {
  syncVersion: number;
  serverTime: string;
  hasWorkspaceData: boolean;
  mode: 'full' | 'delta';
  profile: (UserProfile & { updatedAt?: string }) | null;
  preferences: (UserPreferences & { updatedAt?: string }) | null;
  collections: Partial<Record<SyncCollectionKey, any[]>>;
  tombstones?: Partial<Record<SyncCollectionKey, WorkspaceTombstone[]>>;
}

export interface WorkspaceSyncBatchRequest {
  profile?: {
    data: Partial<UserProfile>;
    updatedAt: string;
    baseUpdatedAt?: string;
  };
  preferences?: {
    data: Partial<UserPreferences>;
    updatedAt: string;
    baseUpdatedAt?: string;
  };
  collections?: Partial<Record<SyncCollectionKey, SyncMutationRecord[]>>;
}

export interface WorkspaceMigrateRequest extends WorkspaceSyncBatchRequest {
  importKey: string;
  source?: 'local_migration' | 'json_import' | 'demo_seed';
}

export interface WorkspaceSyncResponse {
  syncVersion: number;
  serverTime: string;
  appliedCount: number;
  skippedCount?: number;
  alreadyImported?: boolean;
  conflicts: SyncConflict[];
  bootstrap: WorkspaceBootstrapResponse;
}

export interface WorkspaceSyncOutbox {
  lastSyncVersion: number;
  profile: {
    data: UserProfile;
    updatedAt: string;
    baseUpdatedAt?: string;
  } | null;
  preferences: {
    data: UserPreferences;
    updatedAt: string;
    baseUpdatedAt?: string;
  } | null;
  collections: Partial<Record<SyncCollectionKey, Record<string, SyncMutationRecord>>>;
}

export function createClientRecordId(prefix: string): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export function parseTimestampMs(iso?: string | null): number {
  if (!iso || typeof iso !== 'string') return 0;
  const parsed = Date.parse(iso);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => stableSerialize(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter(k => obj[k] !== undefined)
    .sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableSerialize(obj[k])}`).join(',')}}`;
}

export interface ConflictSnapshot {
  updatedAt: string;
  deletedAt?: string | null;
  fingerprint: string;
}

export interface IncomingConflictCandidate {
  updatedAt: string;
  baseUpdatedAt?: string;
  deletedAt?: string | null;
  fingerprint: string;
}

export interface ConflictResolutionResult {
  action: 'insert' | 'update' | 'noop' | 'keep_server';
  conflict?: {
    resolution: 'server_wins' | 'client_wins_merged';
    reason: string;
  };
}

/**
 * Deterministic record-level conflict resolution for multi-device synchronization.
 * Supports Last-Write-Wins via client mutation timestamps, delete tombstones,
 * idempotent retry deduplication (noop when identical), and optimistic conflict reporting.
 */
export function resolveRecordConflict(
  existing: ConflictSnapshot | null,
  incoming: IncomingConflictCandidate
): ConflictResolutionResult {
  if (!existing) {
    return { action: 'insert' };
  }

  const existingDeleted = Boolean(existing.deletedAt);
  const incomingDeleted = Boolean(incoming.deletedAt);

  if (existing.fingerprint === incoming.fingerprint && existingDeleted === incomingDeleted) {
    return { action: 'noop' };
  }

  const existingMs = parseTimestampMs(existing.updatedAt);
  const incomingMs = parseTimestampMs(incoming.updatedAt);

  if (incomingMs < existingMs) {
    return {
      action: 'keep_server',
      conflict: {
        resolution: 'server_wins',
        reason: 'A newer update from another device was preserved.',
      },
    };
  }

  if (incomingMs === existingMs) {
    return {
      action: 'keep_server',
      conflict: {
        resolution: 'server_wins',
        reason: 'Concurrent update at identical timestamp resolved in favor of server copy.',
      },
    };
  }

  const baseMs = parseTimestampMs(incoming.baseUpdatedAt);
  if (incoming.baseUpdatedAt && baseMs > 0 && baseMs < existingMs) {
    return {
      action: 'update',
      conflict: {
        resolution: 'client_wins_merged',
        reason: 'Newer local edit superseded an earlier update from another device.',
      },
    };
  }

  return { action: 'update' };
}

export function createEmptyOutbox(lastSyncVersion = 0): WorkspaceSyncOutbox {
  return {
    lastSyncVersion,
    profile: null,
    preferences: null,
    collections: {},
  };
}

export function hasOutboxChanges(outbox: WorkspaceSyncOutbox): boolean {
  if (outbox.profile || outbox.preferences) return true;
  for (const key of SYNC_COLLECTION_KEYS) {
    const map = outbox.collections[key];
    if (map && Object.keys(map).length > 0) return true;
  }
  return false;
}

export function enqueueOutboxUpsert<K extends SyncCollectionKey>(
  outbox: WorkspaceSyncOutbox,
  collection: K,
  record: SyncCollectionItemMap[K] & { updatedAt?: string },
  baseUpdatedAt?: string
): WorkspaceSyncOutbox {
  const updatedAt = record.updatedAt || new Date().toISOString();
  const prevCollection: Record<string, SyncMutationRecord> = outbox.collections[collection] || {};
  const existingEntry = prevCollection[record.id];
  const resolvedBase = existingEntry?.baseUpdatedAt || baseUpdatedAt;

  return {
    ...outbox,
    collections: {
      ...outbox.collections,
      [collection]: {
        ...prevCollection,
        [record.id]: {
          id: record.id,
          data: { ...record, updatedAt },
          updatedAt,
          ...(resolvedBase ? { baseUpdatedAt: resolvedBase } : {}),
          deletedAt: null,
        },
      },
    },
  };
}

export function enqueueOutboxDelete(
  outbox: WorkspaceSyncOutbox,
  collection: SyncCollectionKey,
  id: string,
  deletedAt: string = new Date().toISOString(),
  baseUpdatedAt?: string
): WorkspaceSyncOutbox {
  const prevCollection: Record<string, SyncMutationRecord> = outbox.collections[collection] || {};
  const existingEntry = prevCollection[id];
  const resolvedBase = existingEntry?.baseUpdatedAt || baseUpdatedAt;

  return {
    ...outbox,
    collections: {
      ...outbox.collections,
      [collection]: {
        ...prevCollection,
        [id]: {
          id,
          updatedAt: deletedAt,
          ...(resolvedBase ? { baseUpdatedAt: resolvedBase } : {}),
          deletedAt,
        },
      },
    },
  };
}

export function enqueueOutboxProfile(
  outbox: WorkspaceSyncOutbox,
  profile: UserProfile,
  updatedAt: string = new Date().toISOString(),
  baseUpdatedAt?: string
): WorkspaceSyncOutbox {
  const resolvedBase = outbox.profile?.baseUpdatedAt || baseUpdatedAt;
  return {
    ...outbox,
    profile: {
      data: profile,
      updatedAt,
      ...(resolvedBase ? { baseUpdatedAt: resolvedBase } : {}),
    },
  };
}

export function enqueueOutboxPreferences(
  outbox: WorkspaceSyncOutbox,
  preferences: UserPreferences,
  updatedAt: string = new Date().toISOString(),
  baseUpdatedAt?: string
): WorkspaceSyncOutbox {
  const resolvedBase = outbox.preferences?.baseUpdatedAt || baseUpdatedAt;
  return {
    ...outbox,
    preferences: {
      data: preferences,
      updatedAt,
      ...(resolvedBase ? { baseUpdatedAt: resolvedBase } : {}),
    },
  };
}

const KNOWN_SEED_TASK_IDS = new Set(['task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6']);
const KNOWN_SEED_GOAL_IDS = new Set(['goal-1', 'goal-2', 'goal-3', 'goal-4']);

export function looksLikeUntouchedDemoSeed(localState: AppState): boolean {
  const nonLearningTasks = localState.tasks.filter(t => !t.learningModuleId);
  if (
    nonLearningTasks.length !== KNOWN_SEED_TASK_IDS.size ||
    nonLearningTasks.some(t => !KNOWN_SEED_TASK_IDS.has(t.id))
  ) {
    return false;
  }

  if (
    localState.goals.length !== KNOWN_SEED_GOAL_IDS.size ||
    localState.goals.some(g => !KNOWN_SEED_GOAL_IDS.has(g.id))
  ) {
    return false;
  }

  return (
    localState.journalEntries.length === 2 &&
    localState.projects.length === 3 &&
    localState.workoutSessions.length === 1
  );
}

/**
 * Extracts localStorage state safely for first-time account migration without
 * accidentally uploading untouched demo seed boilerplate over an existing user's cloud data.
 */
export function buildMigrationPayload(
  localState: AppState,
  options: {
    hasLocalCustomizations?: boolean;
    serverHasData?: boolean;
    forceIncludeAll?: boolean;
  } = {}
): { shouldMigrate: boolean; payload: WorkspaceSyncBatchRequest } {
  const untouchedDemo = looksLikeUntouchedDemoSeed(localState);

  // If the server already has synced data (e.g., logging into an existing account on an iPhone)
  // and this browser only has untouched demo data or an empty/unmodified local store, never upload it.
  if (!options.forceIncludeAll && untouchedDemo && !options.hasLocalCustomizations) {
    return {
      shouldMigrate: false,
      payload: { collections: {} },
    };
  }

  // If server already has data and client isn't forcing a JSON import, only migrate if user made
  // genuine offline customizations before signing in on this device.
  if (options.serverHasData && !options.forceIncludeAll && !options.hasLocalCustomizations) {
    return {
      shouldMigrate: false,
      payload: { collections: {} },
    };
  }

  const now = new Date().toISOString();
  const nonLearningTasks = localState.tasks.filter(t => !t.learningModuleId);

  const dailyPriorities: DailyPriority[] = nonLearningTasks
    .filter(t => t.isDailyPriority && t.priorityRank)
    .map(t => ({
      id: `dp-${t.id}`,
      userId: localState.profile.id,
      date: t.dueDate || now.slice(0, 10),
      taskId: t.id,
      rank: t.priorityRank || 1,
      completed: t.status === 'completed',
    }));

  const toMutations = <T extends { id: string; updatedAt?: string; createdAt?: string }>(
    items: T[]
  ): SyncMutationRecord<T>[] =>
    items.map(item => ({
      id: item.id,
      data: item,
      updatedAt: item.updatedAt || item.createdAt || now,
      deletedAt: null,
    }));

  const payload: WorkspaceSyncBatchRequest = {
    profile: {
      data: localState.profile,
      updatedAt: (localState.profile as any)?.updatedAt || now,
    },
    preferences: {
      data: localState.preferences,
      updatedAt: (localState.preferences as any)?.updatedAt || now,
    },
    collections: {
      tasks: toMutations(nonLearningTasks),
      dailyPriorities: toMutations(dailyPriorities as any[]),
      goals: toMutations(localState.goals),
      ninetyDayPlans: toMutations(localState.ninetyDayPlans as any[]),
      projects: toMutations(localState.projects),
      habits: toMutations(localState.habits),
      habitCompletions: toMutations(localState.habitCompletions as any[]),
      dailySchedule: toMutations(localState.dailySchedule as any[]),
      journalEntries: toMutations(localState.journalEntries),
      focusSessions: toMutations(localState.focusSessions as any[]),
      workoutRoutines: toMutations(localState.workoutRoutines as any[]),
      workoutSessions: toMutations(localState.workoutSessions),
      courses: toMutations(localState.courses),
      studySessions: toMutations(localState.studySessions as any[]),
      resources: toMutations(localState.resources),
      notifications: toMutations(localState.notifications),
    },
  };

  return {
    shouldMigrate: true,
    payload,
  };
}

function mergeCollectionWithDeltaAndOutbox<T extends { id: string }>(params: {
  existingItems: T[];
  serverItems: T[] | undefined;
  tombstones: WorkspaceTombstone[] | undefined;
  mode: 'full' | 'delta';
  outboxMap: Record<string, SyncMutationRecord> | undefined;
}): T[] {
  const byId = new Map<string, T>();

  if (params.mode === 'delta') {
    for (const item of params.existingItems) {
      byId.set(item.id, item);
    }
  }

  for (const item of params.serverItems || []) {
    byId.set(item.id, item);
  }

  for (const tomb of params.tombstones || []) {
    byId.delete(tomb.id);
  }

  if (params.outboxMap) {
    for (const mutation of Object.values(params.outboxMap)) {
      if (mutation.deletedAt) {
        byId.delete(mutation.id);
      } else if (mutation.data) {
        byId.set(mutation.id, mutation.data as T);
      }
    }
  }

  return Array.from(byId.values());
}

/**
 * Reconciles current client AppState with a server bootstrap snapshot (full or delta)
 * while preserving reconciled Learning tasks and any pending offline mutations in the outbox.
 */
export function reconcileWorkspaceState(params: {
  currentState: AppState;
  bootstrap: WorkspaceBootstrapResponse;
  outbox: WorkspaceSyncOutbox;
  userId: string;
}): AppState {
  const { currentState, bootstrap, outbox, userId } = params;
  const learningTasks = currentState.tasks.filter(t => Boolean(t.learningModuleId));

  const mergeCollection = <K extends SyncCollectionKey>(
    key: K,
    existing: SyncCollectionItemMap[K][]
  ): SyncCollectionItemMap[K][] =>
    mergeCollectionWithDeltaAndOutbox<SyncCollectionItemMap[K]>({
      existingItems: existing,
      serverItems: bootstrap.collections?.[key] as SyncCollectionItemMap[K][] | undefined,
      tombstones: bootstrap.tombstones?.[key],
      mode: bootstrap.mode,
      outboxMap: outbox.collections?.[key],
    }).map(item => ({ ...item, userId }) as SyncCollectionItemMap[K]);

  const baseNonLearningTasks = currentState.tasks.filter(t => !t.learningModuleId);
  const mergedNonLearningTasks = mergeCollection('tasks', baseNonLearningTasks);

  const nextProfile: UserProfile = {
    ...currentState.profile,
    ...(bootstrap.profile || {}),
    ...(outbox.profile ? outbox.profile.data : {}),
    id: userId,
  };

  const nextPreferences: UserPreferences = {
    ...currentState.preferences,
    ...(bootstrap.preferences || {}),
    ...(outbox.preferences ? outbox.preferences.data : {}),
  };

  return {
    ...currentState,
    isDemoMode: false,
    profile: nextProfile,
    preferences: nextPreferences,
    tasks: [...learningTasks, ...mergedNonLearningTasks],
    goals: mergeCollection('goals', currentState.goals),
    ninetyDayPlans: mergeCollection('ninetyDayPlans', currentState.ninetyDayPlans),
    projects: mergeCollection('projects', currentState.projects),
    habits: mergeCollection('habits', currentState.habits),
    habitCompletions: mergeCollection('habitCompletions', currentState.habitCompletions),
    dailySchedule: mergeCollection('dailySchedule', currentState.dailySchedule),
    journalEntries: mergeCollection('journalEntries', currentState.journalEntries),
    focusSessions: mergeCollection('focusSessions', currentState.focusSessions),
    workoutRoutines: mergeCollection('workoutRoutines', currentState.workoutRoutines),
    workoutSessions: mergeCollection('workoutSessions', currentState.workoutSessions),
    courses: mergeCollection('courses', currentState.courses),
    studySessions: mergeCollection('studySessions', currentState.studySessions),
    resources: mergeCollection('resources', currentState.resources),
    notifications: mergeCollection('notifications', currentState.notifications),
  };
}
