import test from 'node:test';
import assert from 'node:assert/strict';
import { getCleanEmptyState, getDefaultState } from './storage';
import {
  buildMigrationPayload,
  createEmptyOutbox,
  enqueueOutboxDelete,
  enqueueOutboxUpsert,
  hasOutboxChanges,
  reconcileWorkspaceState,
  resolveRecordConflict,
  stableSerialize,
} from './syncEngine';

test('resolveRecordConflict enforces Last-Write-Wins, idempotent retries, and conflict reporting', () => {
  const insertResult = resolveRecordConflict(null, {
    updatedAt: '2026-11-27T10:00:00.000Z',
    fingerprint: 'fp1',
  });
  assert.equal(insertResult.action, 'insert');

  // Exact same payload retry should be a clean noop (duplicate import prevention)
  const retryResult = resolveRecordConflict(
    { updatedAt: '2026-11-27T10:00:00.000Z', deletedAt: null, fingerprint: 'fp1' },
    { updatedAt: '2026-11-27T10:00:00.000Z', deletedAt: null, fingerprint: 'fp1' }
  );
  assert.equal(retryResult.action, 'noop');
  assert.equal(retryResult.conflict, undefined);

  // Older offline edit loses to newer server change and surfaces server_wins conflict
  const staleResult = resolveRecordConflict(
    { updatedAt: '2026-11-27T10:05:00.000Z', deletedAt: null, fingerprint: 'fp-server' },
    { updatedAt: '2026-11-27T10:02:00.000Z', deletedAt: null, fingerprint: 'fp-client' }
  );
  assert.equal(staleResult.action, 'keep_server');
  assert.equal(staleResult.conflict?.resolution, 'server_wins');

  // Newer client edit wins over older server state, flagging optimistic concurrency merge
  const newerResult = resolveRecordConflict(
    { updatedAt: '2026-11-27T10:05:00.000Z', deletedAt: null, fingerprint: 'fp-server' },
    {
      updatedAt: '2026-11-27T10:08:00.000Z',
      baseUpdatedAt: '2026-11-27T10:01:00.000Z',
      deletedAt: null,
      fingerprint: 'fp-client-newer',
    }
  );
  assert.equal(newerResult.action, 'update');
  assert.equal(newerResult.conflict?.resolution, 'client_wins_merged');
});

test('stableSerialize normalizes key order deterministically', () => {
  assert.equal(
    stableSerialize({ b: 2, a: 1, nested: { z: true, x: undefined, y: 'ok' } }),
    stableSerialize({ nested: { y: 'ok', z: true }, a: 1, b: 2 })
  );
});

test('buildMigrationPayload skips untouched demo boilerplate but migrates real local user data', () => {
  const untouchedSeed = getDefaultState();
  const skipResult = buildMigrationPayload(untouchedSeed, {
    hasLocalCustomizations: false,
    serverHasData: false,
  });
  assert.equal(skipResult.shouldMigrate, false);

  const customizedState = {
    ...untouchedSeed,
    isDemoMode: false,
    tasks: [
      ...untouchedSeed.tasks,
      {
        id: 'task-custom-1',
        userId: 'usr_demo_01',
        title: 'Custom offline task',
        status: 'not_started' as const,
        priority: 'high' as const,
        category: 'career' as const,
        tags: [],
        subtasks: [],
        createdAt: '2026-11-27T09:00:00.000Z',
        learningModuleId: undefined,
      },
      {
        id: 'ltask-1',
        userId: 'usr_demo_01',
        title: 'Learning module linked task',
        status: 'not_started' as const,
        priority: 'medium' as const,
        category: 'education' as const,
        tags: [],
        subtasks: [],
        createdAt: '2026-11-27T09:00:00.000Z',
        learningModuleId: 'mod_1',
      },
    ],
  };

  const migrateResult = buildMigrationPayload(customizedState, {
    hasLocalCustomizations: true,
    serverHasData: false,
  });
  assert.equal(migrateResult.shouldMigrate, true);
  // Learning tasks are managed by /api/learning and must not duplicate into workspace_tasks
  assert.equal(
    migrateResult.payload.collections?.tasks?.some(t => t.id === 'ltask-1'),
    false
  );
  assert.equal(
    migrateResult.payload.collections?.tasks?.some(t => t.id === 'task-custom-1'),
    true
  );
});

test('reconcileWorkspaceState merges delta tombstones and preserves offline outbox edits + learning tasks', () => {
  const base = getCleanEmptyState();
  base.tasks = [
    {
      id: 'ltask-keep',
      userId: 'usr_1',
      title: 'SQLite learning task',
      status: 'not_started',
      priority: 'medium',
      category: 'education',
      tags: [],
      subtasks: [],
      createdAt: '2026-11-27T09:00:00.000Z',
      learningModuleId: 'mod_1',
    },
    {
      id: 'task-to-delete',
      userId: 'usr_1',
      title: 'Deleted on iPhone',
      status: 'not_started',
      priority: 'low',
      category: 'other',
      tags: [],
      subtasks: [],
      createdAt: '2026-11-27T09:00:00.000Z',
    },
  ];

  let outbox = createEmptyOutbox(1);
  outbox = enqueueOutboxUpsert(outbox, 'tasks', {
    id: 'task-offline-new',
    userId: 'usr_1',
    title: 'Offline Mac task',
    status: 'in_progress',
    priority: 'urgent',
    category: 'career',
    tags: [],
    subtasks: [],
    createdAt: '2026-11-27T10:00:00.000Z',
  });
  outbox = enqueueOutboxDelete(outbox, 'goals', 'goal-local-del', '2026-11-27T10:01:00.000Z');
  assert.equal(hasOutboxChanges(outbox), true);

  const next = reconcileWorkspaceState({
    currentState: base,
    outbox,
    userId: 'usr_1',
    bootstrap: {
      syncVersion: 3,
      serverTime: '2026-11-27T10:02:00.000Z',
      hasWorkspaceData: true,
      mode: 'delta',
      profile: null,
      preferences: {
        theme: 'dark',
        accentColor: '#1D1D1F',
        startOfWeek: 'monday',
        timeFormat: '24h',
        dateFormat: 'YYYY-MM-DD',
        defaultDashboard: 'overview',
        defaultTaskView: 'board',
        enableBrowserNotifications: false,
        dailyReminderTime: '08:00',
        soundEnabled: true,
      },
      collections: {
        tasks: [
          {
            id: 'task-from-iphone',
            userId: 'usr_1',
            title: 'Added on iPhone',
            status: 'not_started',
            priority: 'high',
            category: 'personal_development',
            tags: [],
            subtasks: [],
            createdAt: '2026-11-27T09:30:00.000Z',
          },
        ],
      },
      tombstones: {
        tasks: [
          {
            id: 'task-to-delete',
            deletedAt: '2026-11-27T09:45:00.000Z',
            updatedAt: '2026-11-27T09:45:00.000Z',
          },
        ],
      },
    },
  });

  assert.equal(next.isDemoMode, false);
  assert.equal(next.preferences.theme, 'dark');
  assert.ok(next.tasks.some(t => t.id === 'ltask-keep'));
  assert.ok(next.tasks.some(t => t.id === 'task-from-iphone'));
  assert.ok(next.tasks.some(t => t.id === 'task-offline-new'));
  assert.equal(next.tasks.some(t => t.id === 'task-to-delete'), false);
});
