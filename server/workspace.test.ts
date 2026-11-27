import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { getDb, resetDbConnection } from './db.ts';
import authRoutes from './routes/auth.ts';
import workspaceRoutes from './routes/workspace.ts';

describe('MOMENTUM Cross-Device Workspace Sync API & SQLite Isolation', () => {
  let tempDir = '';
  let baseUrl = '';
  let httpServer: any;
  let userAToken = '';
  let userAId = '';
  let userBToken = '';
  let userBId = '';

  before(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'momentum-sync-test-'));
    process.env.MOMENTUM_DATA_DIR = tempDir;
    resetDbConnection();
    getDb();

    const app = express();
    app.use(express.json({ limit: '5mb' }));
    app.use('/api/auth', authRoutes);
    app.use('/api/workspace', workspaceRoutes);

    httpServer = app.listen(0);
    const port = (httpServer.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    const resA = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'device.a@example.com',
        password: 'StrongPassword123!',
        fullName: 'User Alpha',
      }),
    });
    assert.equal(resA.status, 201);
    const dataA = (await resA.json()) as any;
    userAToken = dataA.sessionToken;
    userAId = dataA.user.id;

    const resB = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'device.b@example.com',
        password: 'StrongPassword123!',
        fullName: 'User Beta',
      }),
    });
    assert.equal(resB.status, 201);
    const dataB = (await resB.json()) as any;
    userBToken = dataB.sessionToken;
    userBId = dataB.user.id;
  });

  after(async () => {
    await new Promise<void>(resolve => httpServer.close(() => resolve()));
    resetDbConnection();
    delete process.env.MOMENTUM_DATA_DIR;
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects unauthenticated access to /api/workspace/*', async () => {
    const res = await fetch(`${baseUrl}/api/workspace/bootstrap`);
    assert.equal(res.status, 401);

    const syncRes = await fetch(`${baseUrl}/api/workspace/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collections: {} }),
    });
    assert.equal(syncRes.status, 401);
  });

  it('runs idempotent migrations and prevents duplicate imports', async () => {
    const now = new Date().toISOString();
    const migratePayload = {
      importKey: 'macbook_initial_migration_1',
      source: 'local_migration',
      profile: {
        data: {
          fullName: 'User Alpha Updated',
          visionStatement: 'Build calm systems.',
          dailyAvailabilityHours: 4.5,
          onboardingCompleted: true,
        },
        updatedAt: now,
      },
      preferences: {
        data: { theme: 'dark', startOfWeek: 'monday', timeFormat: '24h' },
        updatedAt: now,
      },
      collections: {
        tasks: [
          {
            id: 'shared-seed-id-1',
            data: {
              id: 'shared-seed-id-1',
              userId: 'spoofed-client-user-id',
              title: 'Alpha Private Task',
              status: 'in_progress',
              priority: 'urgent',
              category: 'career',
              tags: ['sync'],
              subtasks: [],
              isDailyPriority: true,
              priorityRank: 1,
              dueDate: '2026-11-27',
              createdAt: now,
            },
            updatedAt: now,
          },
        ],
        journalEntries: [
          {
            id: 'je-alpha-1',
            data: {
              id: 'je-alpha-1',
              userId: 'spoofed-client-user-id',
              title: 'Confidential Note',
              content: 'Private journal thoughts only for Alpha.',
              date: '2026-11-27',
              category: 'daily_reflection',
              tags: ['private'],
              createdAt: now,
              updatedAt: now,
            },
            updatedAt: now,
          },
        ],
      },
    };

    const first = await fetch(`${baseUrl}/api/workspace/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify(migratePayload),
    });
    assert.equal(first.status, 200);
    const firstJson = (await first.json()) as any;
    assert.equal(firstJson.alreadyImported, false);
    assert.ok(firstJson.appliedCount >= 3);
    assert.equal(firstJson.bootstrap.collections.tasks[0].userId, userAId);
    assert.equal(firstJson.bootstrap.collections.dailyPriorities.length, 1);

    // Retry same importKey -> must be idempotent and not duplicate
    const second = await fetch(`${baseUrl}/api/workspace/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify(migratePayload),
    });
    assert.equal(second.status, 200);
    const secondJson = (await second.json()) as any;
    assert.equal(secondJson.alreadyImported, true);
    assert.equal(secondJson.appliedCount, 0);
    assert.equal(secondJson.bootstrap.collections.tasks.length, 1);

    // Different importKey with identical record under new ID -> semantic dedupe blocks duplicate
    const third = await fetch(`${baseUrl}/api/workspace/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        ...migratePayload,
        importKey: 'json_import_duplicate_check',
        source: 'json_import',
        collections: {
          tasks: [
            {
              ...migratePayload.collections.tasks[0],
              id: 'new-random-id-for-same-task',
              data: {
                ...migratePayload.collections.tasks[0].data,
                id: 'new-random-id-for-same-task',
              },
            },
          ],
        },
      }),
    });
    assert.equal(third.status, 200);
    const thirdJson = (await third.json()) as any;
    assert.equal(thirdJson.bootstrap.collections.tasks.length, 1);
  });

  it('strictly isolates User A data from User B even with identical record IDs', async () => {
    const now = new Date().toISOString();
    // User B writes a task with the EXACT same record ID 'shared-seed-id-1'
    const resB = await fetch(`${baseUrl}/api/workspace/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        collections: {
          tasks: [
            {
              id: 'shared-seed-id-1',
              data: {
                id: 'shared-seed-id-1',
                userId: userAId, // Attempted spoof must be ignored server-side
                title: 'Beta Isolated Task',
                status: 'not_started',
                priority: 'low',
                category: 'health',
                tags: [],
                subtasks: [],
                createdAt: now,
              },
              updatedAt: now,
            },
          ],
        },
      }),
    });
    assert.equal(resB.status, 200);
    const dataB = (await resB.json()) as any;
    assert.equal(dataB.bootstrap.collections.tasks.length, 1);
    assert.equal(dataB.bootstrap.collections.tasks[0].title, 'Beta Isolated Task');
    assert.equal(dataB.bootstrap.collections.tasks[0].userId, userBId);
    assert.equal(dataB.bootstrap.collections.journalEntries.length, 0);

    // User A still sees only User A's private data
    const bootA = await fetch(`${baseUrl}/api/workspace/bootstrap`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const jsonA = (await bootA.json()) as any;
    assert.equal(jsonA.collections.tasks.length, 1);
    assert.equal(jsonA.collections.tasks[0].title, 'Alpha Private Task');
    assert.equal(jsonA.collections.journalEntries.length, 1);
  });

  it('syncs all productivity entities across devices and resolves concurrent conflicts + tombstones', async () => {
    const t1 = '2026-11-27T11:00:00.000Z';
    const t2 = '2026-11-27T11:05:00.000Z';
    const tStale = '2026-11-27T11:02:00.000Z';
    const tDelete = '2026-11-27T11:06:00.000Z';

    // MacBook pushes multi-entity changes (goals, projects, habits, completions, schedule, focus, workouts)
    const macRes = await fetch(`${baseUrl}/api/workspace/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        collections: {
          goals: [
            {
              id: 'goal-sync-1',
              data: { id: 'goal-sync-1', title: 'Launch v2', status: 'active' },
              updatedAt: t2,
            },
          ],
          projects: [
            {
              id: 'proj-sync-1',
              data: { id: 'proj-sync-1', name: 'Mobile Sync', status: 'active' },
              updatedAt: t1,
            },
          ],
          habits: [
            {
              id: 'habit-sync-1',
              data: { id: 'habit-sync-1', name: 'Deep Work', active: true },
              updatedAt: t1,
            },
          ],
          habitCompletions: [
            {
              id: 'hc-sync-1',
              data: { id: 'hc-sync-1', habitId: 'habit-sync-1', date: '2026-11-27', completed: true, count: 1 },
              updatedAt: t1,
            },
          ],
          dailySchedule: [
            {
              id: 'act-sync-1',
              data: {
                id: 'act-sync-1',
                date: '2026-11-27',
                title: 'Sync Architecture',
                startTime: '09:00',
                endTime: '11:00',
                category: 'career',
                completed: false,
              },
              updatedAt: t1,
            },
          ],
          focusSessions: [
            {
              id: 'fs-sync-1',
              data: {
                id: 'fs-sync-1',
                durationMinutes: 50,
                startTime: t1,
                endTime: t2,
                completed: true,
                sessionType: 'focus',
              },
              updatedAt: t1,
            },
          ],
          workoutRoutines: [
            {
              id: 'wr-sync-1',
              data: { id: 'wr-sync-1', name: 'Push Day', exercises: [] },
              updatedAt: t1,
            },
          ],
          workoutSessions: [
            {
              id: 'ws-sync-1',
              data: {
                id: 'ws-sync-1',
                routineName: 'Push Day',
                date: '2026-11-27',
                durationMinutes: 60,
                sets: [],
                createdAt: t1,
              },
              updatedAt: t1,
            },
          ],
        },
      }),
    });
    assert.equal(macRes.status, 200);
    const macJson = (await macRes.json()) as any;
    const baselineVer = macJson.syncVersion;

    // iPhone tries pushing a stale edit to 'goal-sync-1' (tStale < t2) while adding its own activity
    const iphoneRes = await fetch(`${baseUrl}/api/workspace/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        collections: {
          goals: [
            {
              id: 'goal-sync-1',
              data: { id: 'goal-sync-1', title: 'Stale Offline Rename', status: 'paused' },
              updatedAt: tStale,
            },
          ],
          dailySchedule: [
            {
              id: 'act-iphone-1',
              data: {
                id: 'act-iphone-1',
                date: '2026-11-27',
                title: 'Evening Walk',
                startTime: '18:00',
                endTime: '18:45',
                category: 'health',
                completed: true,
              },
              updatedAt: t2,
            },
          ],
        },
      }),
    });
    assert.equal(iphoneRes.status, 200);
    const iphoneJson = (await iphoneRes.json()) as any;
    assert.equal(iphoneJson.conflicts.length, 1);
    assert.equal(iphoneJson.conflicts[0].resolution, 'server_wins');
    const goalAfter = iphoneJson.bootstrap.collections.goals.find((g: any) => g.id === 'goal-sync-1');
    assert.equal(goalAfter.title, 'Launch v2');

    // MacBook deletes 'proj-sync-1' -> iPhone delta fetch receives tombstone!
    const deleteRes = await fetch(`${baseUrl}/api/workspace/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        collections: {
          projects: [
            {
              id: 'proj-sync-1',
              updatedAt: tDelete,
              deletedAt: tDelete,
            },
          ],
        },
      }),
    });
    assert.equal(deleteRes.status, 200);

    const deltaRes = await fetch(`${baseUrl}/api/workspace/bootstrap?sinceVersion=${baselineVer}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(deltaRes.status, 200);
    const deltaJson = (await deltaRes.json()) as any;
    assert.equal(deltaJson.mode, 'delta');
    assert.equal(deltaJson.tombstones.projects.length, 1);
    assert.equal(deltaJson.tombstones.projects[0].id, 'proj-sync-1');
    assert.ok(deltaJson.collections.dailySchedule.some((a: any) => a.id === 'act-iphone-1'));
  });
});
