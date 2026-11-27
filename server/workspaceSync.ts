import type { DatabaseSync } from 'node:sqlite';
import { getDb } from './db.ts';
import {
  resolveRecordConflict,
  stableSerialize,
  SYNC_COLLECTION_KEYS,
  type SyncCollectionKey,
  type SyncConflict,
  type SyncMutationRecord,
  type WorkspaceBootstrapResponse,
  type WorkspaceSyncBatchRequest,
  type WorkspaceSyncResponse,
  type WorkspaceTombstone,
} from '../src/lib/syncEngine.ts';
import type { UserPreferences, UserProfile } from '../src/types/index.ts';

interface TableSpec {
  table: string;
  extractIndexValues: (data: any, userId: string, now: string) => Record<string, any>;
  columns: string[];
}

function asStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNullableStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}

function asIntBool(v: unknown, fallback = 0): number {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v ? 1 : 0;
  return fallback;
}

function asNum(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

const COLLECTION_TABLE_SPECS: Record<SyncCollectionKey, TableSpec> = {
  tasks: {
    table: 'workspace_tasks',
    columns: [
      'title',
      'status',
      'priority',
      'category',
      'due_date',
      'is_daily_priority',
      'priority_rank',
      'created_at',
    ],
    extractIndexValues: (d, _u, now) => ({
      title: asStr(d.title, 'Untitled Task'),
      status: asStr(d.status, 'not_started'),
      priority: asStr(d.priority, 'medium'),
      category: asStr(d.category, 'other'),
      due_date: asNullableStr(d.dueDate),
      is_daily_priority: asIntBool(d.isDailyPriority, 0),
      priority_rank: typeof d.priorityRank === 'number' ? d.priorityRank : null,
      created_at: asStr(d.createdAt, now),
    }),
  },
  dailyPriorities: {
    table: 'workspace_daily_priorities',
    columns: ['date', 'task_id', 'rank', 'notes', 'completed'],
    extractIndexValues: (d, _u, now) => ({
      date: asStr(d.date, now.slice(0, 10)),
      task_id: asStr(d.taskId, ''),
      rank: asNum(d.rank, 1),
      notes: asStr(d.notes, ''),
      completed: asIntBool(d.completed, 0),
    }),
  },
  goals: {
    table: 'workspace_goals',
    columns: ['title', 'status', 'category', 'target_date', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      title: asStr(d.title, 'Untitled Goal'),
      status: asStr(d.status, 'active'),
      category: asStr(d.category, 'personal_development'),
      target_date: asStr(d.targetDate, ''),
      created_at: asStr(d.createdAt, now),
    }),
  },
  ninetyDayPlans: {
    table: 'workspace_ninety_day_plans',
    columns: ['goal_id', 'quarter'],
    extractIndexValues: d => ({
      goal_id: asStr(d.goalId, ''),
      quarter: asStr(d.quarter, ''),
    }),
  },
  projects: {
    table: 'workspace_projects',
    columns: ['name', 'status', 'category', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      name: asStr(d.name, 'Untitled Project'),
      status: asStr(d.status, 'planning'),
      category: asStr(d.category, 'other'),
      created_at: asStr(d.createdAt, now),
    }),
  },
  habits: {
    table: 'workspace_habits',
    columns: ['name', 'category', 'frequency', 'active', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      name: asStr(d.name, 'Untitled Habit'),
      category: asStr(d.category, 'health'),
      frequency: asStr(d.frequency, 'daily'),
      active: asIntBool(d.active, 1),
      created_at: asStr(d.createdAt, now),
    }),
  },
  habitCompletions: {
    table: 'workspace_habit_completions',
    columns: ['habit_id', 'date', 'completed', 'skipped'],
    extractIndexValues: (d, _u, now) => ({
      habit_id: asStr(d.habitId, ''),
      date: asStr(d.date, now.slice(0, 10)),
      completed: asIntBool(d.completed, 0),
      skipped: asIntBool(d.skipped, 0),
    }),
  },
  dailySchedule: {
    table: 'workspace_schedule_activities',
    columns: ['date', 'title', 'start_time', 'end_time', 'category', 'completed', 'task_id'],
    extractIndexValues: (d, _u, now) => ({
      date: asStr(d.date, now.slice(0, 10)),
      title: asStr(d.title, 'Scheduled Block'),
      start_time: asStr(d.startTime, '09:00'),
      end_time: asStr(d.endTime, '10:00'),
      category: asStr(d.category, 'other'),
      completed: asIntBool(d.completed, 0),
      task_id: asNullableStr(d.taskId),
    }),
  },
  journalEntries: {
    table: 'workspace_journal_entries',
    columns: ['title', 'date', 'category', 'mood', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      title: asStr(d.title, 'Untitled Entry'),
      date: asStr(d.date, now.slice(0, 10)),
      category: asStr(d.category, 'daily_reflection'),
      mood: asNullableStr(d.mood),
      created_at: asStr(d.createdAt, now),
    }),
  },
  focusSessions: {
    table: 'workspace_focus_sessions',
    columns: ['task_id', 'session_type', 'duration_minutes', 'start_time'],
    extractIndexValues: (d, _u, now) => ({
      task_id: asNullableStr(d.taskId),
      session_type: asStr(d.sessionType, 'focus'),
      duration_minutes: asNum(d.durationMinutes, 25),
      start_time: asStr(d.startTime, now),
    }),
  },
  workoutRoutines: {
    table: 'workspace_workout_routines',
    columns: ['name'],
    extractIndexValues: d => ({
      name: asStr(d.name, 'Workout Routine'),
    }),
  },
  workoutSessions: {
    table: 'workspace_workout_sessions',
    columns: ['routine_name', 'date', 'duration_minutes', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      routine_name: asStr(d.routineName, 'Workout'),
      date: asStr(d.date, now.slice(0, 10)),
      duration_minutes: asNum(d.durationMinutes, 0),
      created_at: asStr(d.createdAt, now),
    }),
  },
  courses: {
    table: 'workspace_courses',
    columns: ['title', 'category', 'status', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      title: asStr(d.title, 'Course'),
      category: asStr(d.category, 'General'),
      status: asStr(d.status, 'active'),
      created_at: asStr(d.createdAt, now),
    }),
  },
  studySessions: {
    table: 'workspace_study_sessions',
    columns: ['course_id', 'subject', 'date', 'duration_minutes'],
    extractIndexValues: (d, _u, now) => ({
      course_id: asNullableStr(d.courseId),
      subject: asStr(d.subject, 'Study'),
      date: asStr(d.date, now.slice(0, 10)),
      duration_minutes: asNum(d.durationMinutes, 0),
    }),
  },
  resources: {
    table: 'workspace_resources',
    columns: ['title', 'resource_type', 'category', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      title: asStr(d.title, 'Resource'),
      resource_type: asStr(d.resourceType, 'website'),
      category: asStr(d.category, 'other'),
      created_at: asStr(d.createdAt, now),
    }),
  },
  notifications: {
    table: 'workspace_notifications',
    columns: ['type', 'read', 'created_at'],
    extractIndexValues: (d, _u, now) => ({
      type: asStr(d.type, 'system'),
      read: asIntBool(d.read, 0),
      created_at: asStr(d.createdAt, now),
    }),
  },
};

function sanitizeRecordData(rawData: any, userId: string, id: string, updatedAt: string): Record<string, any> {
  const { userId: _ignoredUserId, ...rest } = rawData || {};
  return {
    ...rest,
    id,
    userId,
    updatedAt,
  };
}

function getOrInitSyncMeta(db: DatabaseSync, userId: string): { syncVersion: number; updatedAt: string } {
  const row = db
    .prepare('SELECT sync_version, updated_at FROM workspace_sync_meta WHERE user_id = ?')
    .get(userId) as { sync_version: number; updated_at: string } | undefined;
  if (row) {
    return { syncVersion: Number(row.sync_version), updatedAt: row.updated_at };
  }
  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR IGNORE INTO workspace_sync_meta (user_id, sync_version, updated_at) VALUES (?, 0, ?)'
  ).run(userId, now);
  return { syncVersion: 0, updatedAt: now };
}

function bumpSyncVersion(db: DatabaseSync, userId: string, now: string): number {
  const meta = getOrInitSyncMeta(db, userId);
  const nextVersion = meta.syncVersion + 1;
  db.prepare(
    'UPDATE workspace_sync_meta SET sync_version = ?, updated_at = ? WHERE user_id = ?'
  ).run(nextVersion, now, userId);
  return nextVersion;
}

function mapProfileRow(row: any): (UserProfile & { updatedAt: string }) | null {
  if (!row) return null;
  let lifeAreas: UserProfile['lifeAreas'] = [];
  try {
    lifeAreas = JSON.parse(row.life_areas_json || '[]');
  } catch {
    lifeAreas = [];
  }
  return {
    id: row.user_id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url || '',
    timezone: row.timezone || 'UTC',
    preferredLanguage: row.preferred_language || 'English',
    lifeAreas,
    visionStatement: row.vision_statement || '',
    dailyAvailabilityHours: Number(row.daily_availability_hours ?? 3.5),
    onboardingCompleted: Boolean(row.onboarding_completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPreferencesRow(row: any): (UserPreferences & { updatedAt: string }) | null {
  if (!row) return null;
  return {
    theme: row.theme,
    accentColor: row.accent_color || '#1D1D1F',
    startOfWeek: row.start_of_week,
    timeFormat: row.time_format,
    dateFormat: row.date_format,
    defaultDashboard: row.default_dashboard || 'overview',
    defaultTaskView: row.default_task_view,
    enableBrowserNotifications: Boolean(row.enable_browser_notifications),
    dailyReminderTime: row.daily_reminder_time || '08:00',
    soundEnabled: Boolean(row.sound_enabled),
    updatedAt: row.updated_at,
  };
}

function buildContentFingerprint(data: Record<string, any> | undefined): string {
  if (!data) return '';
  const { updatedAt: _u, userId: _uid, ...comparable } = data;
  return stableSerialize(comparable);
}

function syncDerivedDailyPriorityForTask(
  db: DatabaseSync,
  userId: string,
  taskId: string,
  taskData: any | null,
  deletedAt: string | null,
  updatedAt: string,
  nextVersion: number
): void {
  const dpId = `dp-${taskId}`;
  if (deletedAt || !taskData?.isDailyPriority || !taskData?.priorityRank) {
    db.prepare(
      `UPDATE workspace_daily_priorities
       SET deleted_at = ?, updated_at = ?, sync_version = ?
       WHERE user_id = ? AND id = ? AND deleted_at IS NULL`
    ).run(deletedAt || updatedAt, updatedAt, nextVersion, userId, dpId);
    return;
  }

  const dpObj = {
    id: dpId,
    userId,
    date: asStr(taskData.dueDate, updatedAt.slice(0, 10)),
    taskId,
    rank: asNum(taskData.priorityRank, 1),
    notes: '',
    completed: taskData.status === 'completed',
    updatedAt,
  };

  db.prepare(
    `INSERT INTO workspace_daily_priorities
      (user_id, id, date, task_id, rank, notes, completed, data_json, updated_at, deleted_at, sync_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
     ON CONFLICT(user_id, id) DO UPDATE SET
      date = excluded.date,
      task_id = excluded.task_id,
      rank = excluded.rank,
      completed = excluded.completed,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at,
      deleted_at = NULL,
      sync_version = excluded.sync_version`
  ).run(
    userId,
    dpId,
    dpObj.date,
    dpObj.taskId,
    dpObj.rank,
    '',
    dpObj.completed ? 1 : 0,
    JSON.stringify(dpObj),
    updatedAt,
    nextVersion
  );
}

export function getWorkspaceBootstrap(
  userId: string,
  sinceVersion = 0
): WorkspaceBootstrapResponse {
  const db = getDb();
  const meta = getOrInitSyncMeta(db, userId);
  const now = new Date().toISOString();
  const isDelta = sinceVersion > 0 && sinceVersion <= meta.syncVersion;

  const profileRow = db
    .prepare('SELECT * FROM workspace_profiles WHERE user_id = ?')
    .get(userId) as any;
  const prefRow = db
    .prepare('SELECT * FROM workspace_preferences WHERE user_id = ?')
    .get(userId) as any;

  const collections: Partial<Record<SyncCollectionKey, any[]>> = {};
  const tombstones: Partial<Record<SyncCollectionKey, WorkspaceTombstone[]>> = {};

  for (const key of SYNC_COLLECTION_KEYS) {
    const spec = COLLECTION_TABLE_SPECS[key];
    const rows = isDelta
      ? (db
          .prepare(
            `SELECT id, data_json, updated_at, deleted_at
             FROM ${spec.table}
             WHERE user_id = ? AND sync_version > ?
             ORDER BY updated_at ASC`
          )
          .all(userId, sinceVersion) as any[])
      : (db
          .prepare(
            `SELECT id, data_json, updated_at, deleted_at
             FROM ${spec.table}
             WHERE user_id = ? AND deleted_at IS NULL
             ORDER BY updated_at DESC`
          )
          .all(userId) as any[]);

    const activeItems: any[] = [];
    const deletedItems: WorkspaceTombstone[] = [];

    for (const row of rows) {
      if (row.deleted_at) {
        deletedItems.push({
          id: row.id,
          deletedAt: row.deleted_at,
          updatedAt: row.updated_at,
        });
        continue;
      }
      try {
        const parsed = JSON.parse(row.data_json);
        activeItems.push({
          ...parsed,
          id: row.id,
          userId,
          updatedAt: row.updated_at,
        });
      } catch {
        // Ignore corrupt row JSON
      }
    }

    collections[key] = activeItems;
    if (isDelta && deletedItems.length > 0) {
      tombstones[key] = deletedItems;
    }
  }

  const mappedProfile =
    profileRow && (!isDelta || Number(profileRow.sync_version) > sinceVersion)
      ? mapProfileRow(profileRow)
      : null;
  const mappedPreferences =
    prefRow && (!isDelta || Number(prefRow.sync_version) > sinceVersion)
      ? mapPreferencesRow(prefRow)
      : null;

  return {
    syncVersion: meta.syncVersion,
    serverTime: now,
    hasWorkspaceData: meta.syncVersion > 0 || Boolean(profileRow || prefRow),
    mode: isDelta ? 'delta' : 'full',
    profile: mappedProfile,
    preferences: mappedPreferences,
    collections,
    ...(isDelta ? { tombstones } : {}),
  };
}

function upsertCollectionRow(
  db: DatabaseSync,
  key: SyncCollectionKey,
  userId: string,
  mutation: SyncMutationRecord,
  nextVersion: number,
  now: string
): void {
  const spec = COLLECTION_TABLE_SPECS[key];
  const existing = db
    .prepare(`SELECT id, data_json, updated_at, deleted_at FROM ${spec.table} WHERE user_id = ? AND id = ?`)
    .get(userId, mutation.id) as any;

  if (mutation.deletedAt) {
    const tombstoneData = existing?.data_json || JSON.stringify({ id: mutation.id, userId });
    if (existing) {
      db.prepare(
        `UPDATE ${spec.table}
         SET updated_at = ?, deleted_at = ?, sync_version = ?
         WHERE user_id = ? AND id = ?`
      ).run(mutation.updatedAt, mutation.deletedAt, nextVersion, userId, mutation.id);
    } else {
      const defaults = spec.extractIndexValues({ id: mutation.id }, userId, now);
      const colNames = ['user_id', 'id', ...spec.columns, 'data_json', 'updated_at', 'deleted_at', 'sync_version'];
      const placeholders = colNames.map(() => '?').join(', ');
      db.prepare(`INSERT INTO ${spec.table} (${colNames.join(', ')}) VALUES (${placeholders})`).run(
        userId,
        mutation.id,
        ...spec.columns.map(c => defaults[c]),
        tombstoneData,
        mutation.updatedAt,
        mutation.deletedAt,
        nextVersion
      );
    }
    if (key === 'tasks') {
      syncDerivedDailyPriorityForTask(db, userId, mutation.id, null, mutation.deletedAt, mutation.updatedAt, nextVersion);
    }
    return;
  }

  const sanitized = sanitizeRecordData(mutation.data, userId, mutation.id, mutation.updatedAt);
  const indexVals = spec.extractIndexValues(sanitized, userId, now);
  const dataJson = JSON.stringify(sanitized);

  const colNames = ['user_id', 'id', ...spec.columns, 'data_json', 'updated_at', 'deleted_at', 'sync_version'];
  const placeholders = colNames.map(() => '?').join(', ');
  const updatesSql = [
    ...spec.columns.map(c => `${c} = excluded.${c}`),
    'data_json = excluded.data_json',
    'updated_at = excluded.updated_at',
    'deleted_at = NULL',
    'sync_version = excluded.sync_version',
  ].join(', ');

  db.prepare(
    `INSERT INTO ${spec.table} (${colNames.join(', ')})
     VALUES (${placeholders})
     ON CONFLICT(user_id, id) DO UPDATE SET ${updatesSql}`
  ).run(
    userId,
    mutation.id,
    ...spec.columns.map(c => indexVals[c]),
    dataJson,
    mutation.updatedAt,
    null,
    nextVersion
  );

  if (key === 'tasks') {
    syncDerivedDailyPriorityForTask(db, userId, mutation.id, sanitized, null, mutation.updatedAt, nextVersion);
  }
}

export function applyWorkspaceSyncBatch(
  userId: string,
  batch: WorkspaceSyncBatchRequest,
  options: { dedupeByFingerprint?: boolean } = {}
): WorkspaceSyncResponse {
  const db = getDb();
  const now = new Date().toISOString();
  const conflicts: SyncConflict[] = [];
  let appliedCount = 0;
  let skippedCount = 0;

  db.exec('BEGIN IMMEDIATE');
  let nextVersion = getOrInitSyncMeta(db, userId).syncVersion;

  try {
    const bumpOnce = () => {
      if (appliedCount === 0) {
        nextVersion = bumpSyncVersion(db, userId, now);
      }
    };

    // 1. Profile sync (conflict-resolved via updatedAt)
    if (batch.profile) {
      const existingProfileRow = db
        .prepare('SELECT * FROM workspace_profiles WHERE user_id = ?')
        .get(userId) as any;
      const existingProfile = mapProfileRow(existingProfileRow);
      const userRow = db
        .prepare('SELECT email, full_name, created_at FROM users WHERE id = ?')
        .get(userId) as { email: string; full_name: string; created_at: string } | undefined;

      const mergedIncoming: UserProfile & { updatedAt: string } = {
        id: userId,
        email: batch.profile.data.email || existingProfile?.email || userRow?.email || '',
        fullName: batch.profile.data.fullName || existingProfile?.fullName || userRow?.full_name || 'MOMENTUM User',
        avatarUrl: batch.profile.data.avatarUrl ?? existingProfile?.avatarUrl ?? '',
        timezone: batch.profile.data.timezone ?? existingProfile?.timezone ?? 'UTC',
        preferredLanguage: batch.profile.data.preferredLanguage ?? existingProfile?.preferredLanguage ?? 'English',
        lifeAreas: batch.profile.data.lifeAreas ?? existingProfile?.lifeAreas ?? [],
        visionStatement: batch.profile.data.visionStatement ?? existingProfile?.visionStatement ?? '',
        dailyAvailabilityHours:
          batch.profile.data.dailyAvailabilityHours ?? existingProfile?.dailyAvailabilityHours ?? 3.5,
        onboardingCompleted:
          batch.profile.data.onboardingCompleted ?? existingProfile?.onboardingCompleted ?? true,
        createdAt: existingProfile?.createdAt || userRow?.created_at || now,
        updatedAt: batch.profile.updatedAt,
      };

      const resolution = resolveRecordConflict(
        existingProfile
          ? {
              updatedAt: existingProfile.updatedAt,
              deletedAt: null,
              fingerprint: buildContentFingerprint(existingProfile),
            }
          : null,
        {
          updatedAt: batch.profile.updatedAt,
          baseUpdatedAt: batch.profile.baseUpdatedAt,
          deletedAt: null,
          fingerprint: buildContentFingerprint(mergedIncoming),
        }
      );

      if (resolution.conflict) {
        conflicts.push({
          collection: 'profile',
          id: userId,
          resolution: resolution.conflict.resolution,
          serverUpdatedAt: existingProfile?.updatedAt || now,
          clientUpdatedAt: batch.profile.updatedAt,
          reason: resolution.conflict.reason,
        });
      }

      if (resolution.action === 'insert' || resolution.action === 'update') {
        bumpOnce();
        db.prepare(
          `INSERT INTO workspace_profiles
            (user_id, full_name, email, avatar_url, timezone, preferred_language, life_areas_json, vision_statement, daily_availability_hours, onboarding_completed, created_at, updated_at, sync_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
            full_name = excluded.full_name,
            email = excluded.email,
            avatar_url = excluded.avatar_url,
            timezone = excluded.timezone,
            preferred_language = excluded.preferred_language,
            life_areas_json = excluded.life_areas_json,
            vision_statement = excluded.vision_statement,
            daily_availability_hours = excluded.daily_availability_hours,
            onboarding_completed = excluded.onboarding_completed,
            updated_at = excluded.updated_at,
            sync_version = excluded.sync_version`
        ).run(
          userId,
          mergedIncoming.fullName,
          mergedIncoming.email,
          mergedIncoming.avatarUrl || '',
          mergedIncoming.timezone,
          mergedIncoming.preferredLanguage,
          JSON.stringify(mergedIncoming.lifeAreas),
          mergedIncoming.visionStatement,
          mergedIncoming.dailyAvailabilityHours,
          mergedIncoming.onboardingCompleted ? 1 : 0,
          mergedIncoming.createdAt,
          batch.profile.updatedAt,
          nextVersion
        );
        appliedCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    // 2. Preferences sync (conflict-resolved via updatedAt)
    if (batch.preferences) {
      const existingPrefRow = db
        .prepare('SELECT * FROM workspace_preferences WHERE user_id = ?')
        .get(userId) as any;
      const existingPref = mapPreferencesRow(existingPrefRow);

      const mergedPref: UserPreferences & { updatedAt: string } = {
        theme: batch.preferences.data.theme ?? existingPref?.theme ?? 'light',
        accentColor: batch.preferences.data.accentColor ?? existingPref?.accentColor ?? '#1D1D1F',
        startOfWeek: batch.preferences.data.startOfWeek ?? existingPref?.startOfWeek ?? 'monday',
        timeFormat: batch.preferences.data.timeFormat ?? existingPref?.timeFormat ?? '24h',
        dateFormat: batch.preferences.data.dateFormat ?? existingPref?.dateFormat ?? 'YYYY-MM-DD',
        defaultDashboard: batch.preferences.data.defaultDashboard ?? existingPref?.defaultDashboard ?? 'overview',
        defaultTaskView: batch.preferences.data.defaultTaskView ?? existingPref?.defaultTaskView ?? 'board',
        enableBrowserNotifications:
          batch.preferences.data.enableBrowserNotifications ?? existingPref?.enableBrowserNotifications ?? false,
        dailyReminderTime:
          batch.preferences.data.dailyReminderTime ?? existingPref?.dailyReminderTime ?? '08:00',
        soundEnabled: batch.preferences.data.soundEnabled ?? existingPref?.soundEnabled ?? true,
        updatedAt: batch.preferences.updatedAt,
      };

      const resolution = resolveRecordConflict(
        existingPref
          ? {
              updatedAt: existingPref.updatedAt,
              deletedAt: null,
              fingerprint: buildContentFingerprint(existingPref),
            }
          : null,
        {
          updatedAt: batch.preferences.updatedAt,
          baseUpdatedAt: batch.preferences.baseUpdatedAt,
          deletedAt: null,
          fingerprint: buildContentFingerprint(mergedPref),
        }
      );

      if (resolution.conflict) {
        conflicts.push({
          collection: 'preferences',
          id: userId,
          resolution: resolution.conflict.resolution,
          serverUpdatedAt: existingPref?.updatedAt || now,
          clientUpdatedAt: batch.preferences.updatedAt,
          reason: resolution.conflict.reason,
        });
      }

      if (resolution.action === 'insert' || resolution.action === 'update') {
        bumpOnce();
        db.prepare(
          `INSERT INTO workspace_preferences
            (user_id, theme, accent_color, start_of_week, time_format, date_format, default_dashboard, default_task_view, enable_browser_notifications, daily_reminder_time, sound_enabled, updated_at, sync_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
            theme = excluded.theme,
            accent_color = excluded.accent_color,
            start_of_week = excluded.start_of_week,
            time_format = excluded.time_format,
            date_format = excluded.date_format,
            default_dashboard = excluded.default_dashboard,
            default_task_view = excluded.default_task_view,
            enable_browser_notifications = excluded.enable_browser_notifications,
            daily_reminder_time = excluded.daily_reminder_time,
            sound_enabled = excluded.sound_enabled,
            updated_at = excluded.updated_at,
            sync_version = excluded.sync_version`
        ).run(
          userId,
          mergedPref.theme,
          mergedPref.accentColor,
          mergedPref.startOfWeek,
          mergedPref.timeFormat,
          mergedPref.dateFormat,
          mergedPref.defaultDashboard,
          mergedPref.defaultTaskView,
          mergedPref.enableBrowserNotifications ? 1 : 0,
          mergedPref.dailyReminderTime,
          mergedPref.soundEnabled ? 1 : 0,
          batch.preferences.updatedAt,
          nextVersion
        );
        appliedCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    // 3. Collection mutations (with record-level conflict checks + optional content deduplication)
    const collections = batch.collections || {};
    for (const key of SYNC_COLLECTION_KEYS) {
      const items = collections[key];
      if (!items || items.length === 0) continue;

      const spec = COLLECTION_TABLE_SPECS[key];
      let contentFingerprints: Set<string> | null = null;
      if (options.dedupeByFingerprint) {
        contentFingerprints = new Set<string>();
        const activeRows = db
          .prepare(`SELECT data_json FROM ${spec.table} WHERE user_id = ? AND deleted_at IS NULL`)
          .all(userId) as { data_json: string }[];
        for (const r of activeRows) {
          try {
            const parsed = JSON.parse(r.data_json);
            const { id: _i, userId: _u, updatedAt: _up, ...contentOnly } = parsed;
            contentFingerprints.add(stableSerialize(contentOnly));
          } catch {
            // Skip
          }
        }
      }

      for (const mutation of items) {
        if (key === 'tasks' && mutation.data && (mutation.data as any).learningModuleId) {
          skippedCount += 1;
          continue;
        }

        const existingRow = db
          .prepare(
            `SELECT id, data_json, updated_at, deleted_at FROM ${spec.table} WHERE user_id = ? AND id = ?`
          )
          .get(userId, mutation.id) as any;

        let existingParsed: Record<string, any> | undefined;
        if (existingRow?.data_json) {
          try {
            existingParsed = JSON.parse(existingRow.data_json);
          } catch {
            existingParsed = undefined;
          }
        }

        const sanitizedIncoming = mutation.deletedAt
          ? undefined
          : sanitizeRecordData(mutation.data, userId, mutation.id, mutation.updatedAt);

        // During migration/JSON restore, prevent duplicate insertion of identical records under a different ID
        if (
          options.dedupeByFingerprint &&
          !existingRow &&
          sanitizedIncoming &&
          contentFingerprints
        ) {
          const { id: _i, userId: _u, updatedAt: _up, ...contentOnly } = sanitizedIncoming;
          const semanticFp = stableSerialize(contentOnly);
          if (contentFingerprints.has(semanticFp)) {
            skippedCount += 1;
            continue;
          }
          contentFingerprints.add(semanticFp);
        }

        const resolution = resolveRecordConflict(
          existingRow
            ? {
                updatedAt: existingRow.updated_at,
                deletedAt: existingRow.deleted_at,
                fingerprint: existingRow.deleted_at
                  ? '__deleted__'
                  : buildContentFingerprint(existingParsed),
              }
            : null,
          {
            updatedAt: mutation.updatedAt,
            baseUpdatedAt: mutation.baseUpdatedAt,
            deletedAt: mutation.deletedAt,
            fingerprint: mutation.deletedAt
              ? '__deleted__'
              : buildContentFingerprint(sanitizedIncoming),
          }
        );

        if (resolution.conflict) {
          conflicts.push({
            collection: key,
            id: mutation.id,
            resolution: resolution.conflict.resolution,
            serverUpdatedAt: existingRow?.updated_at || now,
            clientUpdatedAt: mutation.updatedAt,
            reason: resolution.conflict.reason,
          });
        }

        if (resolution.action === 'insert' || resolution.action === 'update') {
          bumpOnce();
          upsertCollectionRow(db, key, userId, mutation, nextVersion, now);
          appliedCount += 1;
        } else {
          skippedCount += 1;
        }
      }
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const bootstrap = getWorkspaceBootstrap(userId, 0);
  return {
    syncVersion: bootstrap.syncVersion,
    serverTime: now,
    appliedCount,
    skippedCount,
    conflicts,
    bootstrap,
  };
}

export function applyWorkspaceMigration(
  userId: string,
  params: {
    importKey: string;
    source: 'local_migration' | 'json_import' | 'demo_seed';
    batch: WorkspaceSyncBatchRequest;
  }
): WorkspaceSyncResponse {
  const db = getDb();
  const existingImport = db
    .prepare('SELECT imported_count, imported_at FROM workspace_sync_imports WHERE user_id = ? AND import_key = ?')
    .get(userId, params.importKey) as { imported_count: number; imported_at: string } | undefined;

  if (existingImport) {
    const bootstrap = getWorkspaceBootstrap(userId, 0);
    return {
      syncVersion: bootstrap.syncVersion,
      serverTime: new Date().toISOString(),
      appliedCount: 0,
      skippedCount: 0,
      alreadyImported: true,
      conflicts: [],
      bootstrap,
    };
  }

  const result = applyWorkspaceSyncBatch(userId, params.batch, {
    dedupeByFingerprint: true,
  });

  db.prepare(
    `INSERT OR IGNORE INTO workspace_sync_imports (user_id, import_key, source, imported_count, imported_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, params.importKey, params.source, result.appliedCount, new Date().toISOString());

  return {
    ...result,
    alreadyImported: false,
  };
}

export function clearWorkspaceData(userId: string): WorkspaceSyncResponse {
  const db = getDb();
  const now = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE');
  try {
    const nextVersion = bumpSyncVersion(db, userId, now);
    for (const key of SYNC_COLLECTION_KEYS) {
      const spec = COLLECTION_TABLE_SPECS[key];
      db.prepare(
        `UPDATE ${spec.table}
         SET deleted_at = ?, updated_at = ?, sync_version = ?
         WHERE user_id = ? AND deleted_at IS NULL`
      ).run(now, now, nextVersion, userId);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const bootstrap = getWorkspaceBootstrap(userId, 0);
  return {
    syncVersion: bootstrap.syncVersion,
    serverTime: now,
    appliedCount: 1,
    conflicts: [],
    bootstrap,
  };
}

export function restoreWorkspaceInTransaction(
  db: DatabaseSync,
  userId: string,
  workspace: {
    profile?: Partial<UserProfile> & { updatedAt?: string };
    preferences?: Partial<UserPreferences> & { updatedAt?: string };
    collections?: Partial<Record<SyncCollectionKey, any[]>>;
  },
  strategy: 'merge' | 'replace',
  now: string
): { appliedCount: number; skippedCount: number; syncVersion: number } {
  const nextVersion = bumpSyncVersion(db, userId, now);
  let appliedCount = 0;
  let skippedCount = 0;

  const userRow = db
    .prepare('SELECT email, full_name, created_at FROM users WHERE id = ?')
    .get(userId) as { email: string; full_name: string; created_at: string } | undefined;

  if (strategy === 'replace') {
    for (const key of SYNC_COLLECTION_KEYS) {
      const spec = COLLECTION_TABLE_SPECS[key];
      db.prepare(
        `UPDATE ${spec.table}
         SET deleted_at = ?, updated_at = ?, sync_version = ?
         WHERE user_id = ? AND deleted_at IS NULL`
      ).run(now, now, nextVersion, userId);
    }
  }

  // Restore profile (keep authenticated user id/email integrity intact)
  const existingProfileRow = db
    .prepare('SELECT * FROM workspace_profiles WHERE user_id = ?')
    .get(userId) as any;

  if (workspace.profile && (strategy === 'replace' || !existingProfileRow)) {
    const p = workspace.profile;
    const existingProfile = mapProfileRow(existingProfileRow);
    const mergedProfile: UserProfile & { updatedAt: string } = {
      id: userId,
      email: userRow?.email || existingProfile?.email || p.email || '',
      fullName: p.fullName || existingProfile?.fullName || userRow?.full_name || 'MOMENTUM User',
      avatarUrl: p.avatarUrl ?? existingProfile?.avatarUrl ?? '',
      timezone: p.timezone ?? existingProfile?.timezone ?? 'UTC',
      preferredLanguage: p.preferredLanguage ?? existingProfile?.preferredLanguage ?? 'English',
      lifeAreas: Array.isArray(p.lifeAreas) ? p.lifeAreas : existingProfile?.lifeAreas ?? [],
      visionStatement: p.visionStatement ?? existingProfile?.visionStatement ?? '',
      dailyAvailabilityHours:
        typeof p.dailyAvailabilityHours === 'number' && Number.isFinite(p.dailyAvailabilityHours)
          ? p.dailyAvailabilityHours
          : existingProfile?.dailyAvailabilityHours ?? 3.5,
      onboardingCompleted:
        typeof p.onboardingCompleted === 'boolean'
          ? p.onboardingCompleted
          : existingProfile?.onboardingCompleted ?? true,
      createdAt: existingProfile?.createdAt || userRow?.created_at || p.createdAt || now,
      updatedAt: now,
    };

    db.prepare(
      `INSERT INTO workspace_profiles
        (user_id, full_name, email, avatar_url, timezone, preferred_language, life_areas_json, vision_statement, daily_availability_hours, onboarding_completed, created_at, updated_at, sync_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
        full_name = excluded.full_name,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        timezone = excluded.timezone,
        preferred_language = excluded.preferred_language,
        life_areas_json = excluded.life_areas_json,
        vision_statement = excluded.vision_statement,
        daily_availability_hours = excluded.daily_availability_hours,
        onboarding_completed = excluded.onboarding_completed,
        updated_at = excluded.updated_at,
        sync_version = excluded.sync_version`
    ).run(
      userId,
      mergedProfile.fullName,
      mergedProfile.email,
      mergedProfile.avatarUrl || '',
      mergedProfile.timezone,
      mergedProfile.preferredLanguage,
      JSON.stringify(mergedProfile.lifeAreas),
      mergedProfile.visionStatement,
      mergedProfile.dailyAvailabilityHours,
      mergedProfile.onboardingCompleted ? 1 : 0,
      mergedProfile.createdAt,
      now,
      nextVersion
    );
    appliedCount += 1;
  } else if (existingProfileRow && !existingProfileRow.onboarding_completed) {
    db.prepare(
      `UPDATE workspace_profiles
       SET onboarding_completed = 1, updated_at = ?, sync_version = ?
       WHERE user_id = ?`
    ).run(now, nextVersion, userId);
  }

  // Restore preferences (in merge mode, preserve existing preferences)
  const existingPrefRow = db
    .prepare('SELECT * FROM workspace_preferences WHERE user_id = ?')
    .get(userId) as any;

  if (workspace.preferences && (strategy === 'replace' || !existingPrefRow)) {
    const pref = workspace.preferences;
    const existingPref = mapPreferencesRow(existingPrefRow);
    const mergedPref: UserPreferences = {
      theme: pref.theme ?? existingPref?.theme ?? 'light',
      accentColor: pref.accentColor ?? existingPref?.accentColor ?? '#1D1D1F',
      startOfWeek: pref.startOfWeek ?? existingPref?.startOfWeek ?? 'monday',
      timeFormat: pref.timeFormat ?? existingPref?.timeFormat ?? '24h',
      dateFormat: pref.dateFormat ?? existingPref?.dateFormat ?? 'YYYY-MM-DD',
      defaultDashboard: pref.defaultDashboard ?? existingPref?.defaultDashboard ?? 'overview',
      defaultTaskView: pref.defaultTaskView ?? existingPref?.defaultTaskView ?? 'board',
      enableBrowserNotifications:
        pref.enableBrowserNotifications ?? existingPref?.enableBrowserNotifications ?? false,
      dailyReminderTime: pref.dailyReminderTime ?? existingPref?.dailyReminderTime ?? '08:00',
      soundEnabled: pref.soundEnabled ?? existingPref?.soundEnabled ?? true,
    };

    db.prepare(
      `INSERT INTO workspace_preferences
        (user_id, theme, accent_color, start_of_week, time_format, date_format, default_dashboard, default_task_view, enable_browser_notifications, daily_reminder_time, sound_enabled, updated_at, sync_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
        theme = excluded.theme,
        accent_color = excluded.accent_color,
        start_of_week = excluded.start_of_week,
        time_format = excluded.time_format,
        date_format = excluded.date_format,
        default_dashboard = excluded.default_dashboard,
        default_task_view = excluded.default_task_view,
        enable_browser_notifications = excluded.enable_browser_notifications,
        daily_reminder_time = excluded.daily_reminder_time,
        sound_enabled = excluded.sound_enabled,
        updated_at = excluded.updated_at,
        sync_version = excluded.sync_version`
    ).run(
      userId,
      mergedPref.theme,
      mergedPref.accentColor,
      mergedPref.startOfWeek,
      mergedPref.timeFormat,
      mergedPref.dateFormat,
      mergedPref.defaultDashboard,
      mergedPref.defaultTaskView,
      mergedPref.enableBrowserNotifications ? 1 : 0,
      mergedPref.dailyReminderTime,
      mergedPref.soundEnabled ? 1 : 0,
      now,
      nextVersion
    );
    appliedCount += 1;
  }

  // Restore collections
  const collections = workspace.collections || {};
  for (const key of SYNC_COLLECTION_KEYS) {
    const items = collections[key];
    if (!Array.isArray(items) || items.length === 0) continue;

    const spec = COLLECTION_TABLE_SPECS[key];
    const existingIds = new Set<string>();
    const existingFingerprints = new Set<string>();

    if (strategy === 'merge') {
      const existingRows = db
        .prepare(`SELECT id, data_json, deleted_at FROM ${spec.table} WHERE user_id = ?`)
        .all(userId) as { id: string; data_json: string; deleted_at: string | null }[];
      for (const r of existingRows) {
        if (!r.deleted_at) {
          existingIds.add(r.id);
          try {
            const parsed = JSON.parse(r.data_json);
            const { id: _i, userId: _u, updatedAt: _up, ...contentOnly } = parsed;
            existingFingerprints.add(stableSerialize(contentOnly));
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    for (const rawItem of items) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      if (key === 'tasks' && (rawItem as any).learningModuleId) {
        skippedCount += 1;
        continue;
      }

      const itemId =
        typeof rawItem.id === 'string' && rawItem.id.trim()
          ? rawItem.id.trim()
          : `${key}-${appliedCount + skippedCount + 1}`;

      if (strategy === 'merge' && existingIds.has(itemId)) {
        skippedCount += 1;
        continue;
      }

      const sanitized = sanitizeRecordData(rawItem, userId, itemId, now);
      if (strategy === 'merge') {
        const { id: _i, userId: _u, updatedAt: _up, ...contentOnly } = sanitized;
        const fp = stableSerialize(contentOnly);
        if (existingFingerprints.has(fp)) {
          skippedCount += 1;
          continue;
        }
        existingIds.add(itemId);
        existingFingerprints.add(fp);
      }

      upsertCollectionRow(
        db,
        key,
        userId,
        {
          id: itemId,
          data: sanitized,
          updatedAt: now,
        },
        nextVersion,
        now
      );
      appliedCount += 1;
    }
  }

  return { appliedCount, skippedCount, syncVersion: nextVersion };
}
