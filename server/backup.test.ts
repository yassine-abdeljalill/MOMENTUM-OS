import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { getDb, resetDbConnection } from './db.ts';
import authRoutes from './routes/auth.ts';
import workspaceRoutes from './routes/workspace.ts';
import learningRoutes from './routes/learning.ts';
import financeRoutes from './routes/finance.ts';
import backupRoutes from './routes/backup.ts';
import { getDefaultState } from '../src/lib/storage.ts';

describe('MOMENTUM Complete Backup & Restore API + Integrity & Isolation', () => {
  let tempDir = '';
  let baseUrl = '';
  let httpServer: any;
  let userAToken = '';
  let userAId = '';
  let userBToken = '';
  let userBId = '';

  const uploadedPdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (TLS Lab Guide) >>\nendobj\n%%EOF\n');

  before(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'momentum-backup-test-'));
    process.env.MOMENTUM_DATA_DIR = tempDir;
    resetDbConnection();
    getDb();

    const app = express();
    app.use('/api/backup', express.json({ limit: '64mb' }), backupRoutes);
    app.use(express.json({ limit: '5mb' }));
    app.use('/api/auth', authRoutes);
    app.use('/api/workspace', workspaceRoutes);
    app.use('/api/learning', learningRoutes);
    app.use('/api/finance', financeRoutes);

    httpServer = app.listen(0);
    const port = (httpServer.address() as any).port;
    baseUrl = `http://127.0.0.1:${port}`;

    const resA = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'backup.owner@example.com',
        password: 'StrongPassword123!',
        fullName: 'Backup Owner',
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
        email: 'backup.target@example.com',
        password: 'AnotherStrongPassword123!',
        fullName: 'Target Account',
      }),
    });
    assert.equal(resB.status, 201);
    const dataB = (await resB.json()) as any;
    userBToken = dataB.sessionToken;
    userBId = dataB.user.id;
  });

  after(async () => {
    if (httpServer) {
      await new Promise<void>(resolve => httpServer.close(() => resolve()));
    }
    resetDbConnection();
    delete process.env.MOMENTUM_DATA_DIR;
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('exports complete backup across Workspace, Learning (+ files), and Finance without leaking secrets, and restores safely', async () => {
    const authA = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userAToken}`,
    };
    const now = new Date().toISOString();

    // 1. Seed realistic Workspace items for User A
    const wsRes = await fetch(`${baseUrl}/api/workspace/sync`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        preferences: {
          data: { theme: 'dark', startOfWeek: 'sunday', timeFormat: '12h' },
          updatedAt: now,
        },
        collections: {
          tasks: [
            {
              id: 'task-a1',
              updatedAt: now,
              data: {
                id: 'task-a1',
                title: 'Harden SSH Bastion',
                status: 'in_progress',
                priority: 'urgent',
                category: 'career',
                tags: ['infra'],
                subtasks: [],
                createdAt: now,
              },
            },
          ],
          goals: [
            {
              id: 'goal-a1',
              updatedAt: now,
              data: {
                id: 'goal-a1',
                title: 'Master Applied Cryptography',
                description: 'Complete protocol proofs',
                category: 'education',
                startDate: '2026-01-01',
                targetDate: '2026-12-01',
                status: 'active',
                priority: 'high',
                progressCalculation: 'manual',
                manualProgress: 35,
                successCriteria: 'All labs passed',
                motivation: 'Deep expertise',
                milestones: [],
                relatedProjectIds: [],
                createdAt: now,
              },
            },
          ],
          projects: [
            {
              id: 'proj-a1',
              updatedAt: now,
              data: {
                id: 'proj-a1',
                name: 'Packet Inspector CLI',
                description: 'Rust packet capture analyzer',
                color: '#1D1D1F',
                status: 'active',
                priority: 'high',
                category: 'career',
                startDate: '2026-03-01',
                milestones: [],
                createdAt: now,
                updatedAt: now,
              },
            },
          ],
          habits: [
            {
              id: 'hab-a1',
              updatedAt: now,
              data: {
                id: 'hab-a1',
                name: 'Deep Reading 45m',
                category: 'personal_development',
                frequency: 'daily',
                targetCountPerDay: 1,
                startDate: '2026-01-01',
                color: '#1D1D1F',
                active: true,
                createdAt: now,
              },
            },
          ],
          habitCompletions: [
            {
              id: 'hc-a1',
              updatedAt: now,
              data: {
                id: 'hc-a1',
                habitId: 'hab-a1',
                date: '2026-04-05',
                completed: true,
                count: 1,
              },
            },
          ],
          dailySchedule: [
            {
              id: 'cal-a1',
              updatedAt: now,
              data: {
                id: 'cal-a1',
                date: '2026-04-05',
                title: 'Protocol Review Block',
                startTime: '09:00',
                endTime: '11:00',
                category: 'education',
                completed: false,
              },
            },
          ],
          journalEntries: [
            {
              id: 'jour-a1',
              updatedAt: now,
              data: {
                id: 'jour-a1',
                title: 'Private Security Journal',
                content: 'Confidential personal notes from macOS',
                date: '2026-04-05',
                category: 'daily_reflection',
                mood: 'great',
                tags: ['focus'],
                createdAt: now,
                updatedAt: now,
              },
            },
          ],
          focusSessions: [
            {
              id: 'foc-a1',
              updatedAt: now,
              data: {
                id: 'foc-a1',
                taskId: 'task-a1',
                subject: 'SSH Review',
                startTime: '2026-04-05T09:00:00.000Z',
                endTime: '2026-04-05T09:50:00.000Z',
                durationMinutes: 50,
                completed: true,
                sessionType: 'focus',
              },
            },
          ],
          workoutRoutines: [
            {
              id: 'wr-a1',
              updatedAt: now,
              data: {
                id: 'wr-a1',
                name: 'Upper Power',
                exercises: [{ exerciseName: 'Pull-ups', defaultSets: 4, defaultReps: 10 }],
              },
            },
          ],
          workoutSessions: [
            {
              id: 'ws-a1',
              updatedAt: now,
              data: {
                id: 'ws-a1',
                routineName: 'Upper Power',
                date: '2026-04-05',
                durationMinutes: 45,
                sets: [],
                createdAt: now,
              },
            },
          ],
        },
      }),
    });
    assert.equal(wsRes.status, 200);

    // 2. Seed realistic Learning items (Module, Lesson, Note, Assignment, Practical Lab, Study Session, Link, Binary PDF File)
    const modRes = await fetch(`${baseUrl}/api/learning/modules`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({ title: 'Applied Cryptography', icon: 'shield', status: 'in_progress' }),
    });
    assert.equal(modRes.status, 201);
    const { module } = (await modRes.json()) as any;

    const lesRes = await fetch(`${baseUrl}/api/learning/lessons`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        moduleId: module.id,
        title: 'TLS 1.3 Key Schedule',
        teacherName: 'Prof. Lin',
        studyDurationMinutes: 75,
        learningObjectives: ['Derive handshake traffic secrets'],
      }),
    });
    assert.equal(lesRes.status, 201);
    const { lesson } = (await lesRes.json()) as any;

    const noteRes = await fetch(`${baseUrl}/api/learning/notes`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        lessonId: lesson.id,
        title: 'HKDF-Expand-Label Notes',
        contentHtml: '<p>Uses SHA-256 transcript hash.</p>',
        isPinned: true,
      }),
    });
    assert.equal(noteRes.status, 201);

    const assignRes = await fetch(`${baseUrl}/api/learning/tasks`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        moduleId: module.id,
        lessonId: lesson.id,
        title: 'Assignment 1: Key Derivation Proof',
        taskKind: 'assignment',
        priority: 'high',
        dueDate: '2026-04-12',
      }),
    });
    assert.equal(assignRes.status, 201);

    const labRes = await fetch(`${baseUrl}/api/learning/tasks`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        moduleId: module.id,
        lessonId: lesson.id,
        title: 'Practical Lab: Packet Decryption',
        taskKind: 'lab',
        priority: 'urgent',
        dueDate: '2026-04-14',
      }),
    });
    assert.equal(labRes.status, 201);

    const ssRes = await fetch(`${baseUrl}/api/learning/study-sessions`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        moduleId: module.id,
        lessonId: lesson.id,
        subject: 'TLS 1.3 RFC 8446',
        date: '2026-04-05',
        startTime: '14:00',
        endTime: '15:15',
        durationMinutes: 75,
        whatWasLearned: '0-RTT replay nuances',
      }),
    });
    assert.equal(ssRes.status, 201);

    const linkRes = await fetch(`${baseUrl}/api/learning/resources/link`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        moduleId: module.id,
        lessonId: lesson.id,
        title: 'RFC 8446 Spec',
        externalUrl: 'https://datatracker.ietf.org/doc/html/rfc8446',
        folderName: 'Specs',
      }),
    });
    assert.equal(linkRes.status, 201);

    // Upload real PDF binary via multipart FormData
    const form = new FormData();
    form.append('moduleId', module.id);
    form.append('lessonId', lesson.id);
    form.append('title', 'TLS Lab Handout');
    form.append('folderName', 'Labs');
    form.append('file', new Blob([uploadedPdfBytes], { type: 'application/pdf' }), 'tls-lab-guide.pdf');
    const uploadRes = await fetch(`${baseUrl}/api/learning/resources/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: form,
    });
    assert.equal(uploadRes.status, 201);

    // 3. Seed realistic Finance items (currency, category, tx, budget, savings goal + contribution, recurring)
    const curRes = await fetch(`${baseUrl}/api/finance/settings`, {
      method: 'PATCH',
      headers: authA,
      body: JSON.stringify({ currency: 'USD' }),
    });
    assert.equal(curRes.status, 200);

    const txRes = await fetch(`${baseUrl}/api/finance/transactions`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        type: 'expense',
        amount: 89.5,
        date: '2026-04-05',
        category: 'Education',
        description: 'Cryptography textbook',
        paymentMethod: 'Credit Card',
      }),
    });
    assert.equal(txRes.status, 201);

    const budRes = await fetch(`${baseUrl}/api/finance/budgets`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        category: 'Education',
        month: '2026-04',
        limitAmount: 300,
        warningThresholdPercent: 80,
      }),
    });
    assert.equal(budRes.status, 201);

    const sgRes = await fetch(`${baseUrl}/api/finance/savings-goals`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        name: 'Lab Server Fund',
        targetAmount: 1800,
        currentAmount: 200,
        deadline: '2026-11-30',
        category: 'Hardware',
        notes: 'Rack node',
      }),
    });
    assert.equal(sgRes.status, 201);
    const { savingsGoal } = (await sgRes.json()) as any;

    const contribRes = await fetch(
      `${baseUrl}/api/finance/savings-goals/${savingsGoal.id}/contributions`,
      {
        method: 'POST',
        headers: authA,
        body: JSON.stringify({ amount: 150, date: '2026-04-05', note: 'April transfer' }),
      }
    );
    assert.equal(contribRes.status, 201);

    const recRes = await fetch(`${baseUrl}/api/finance/recurring`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({
        title: 'Cloud Lab VPS',
        type: 'expense',
        amount: 24,
        category: 'Technology',
        paymentMethod: 'Credit Card',
        frequency: 'monthly',
        kind: 'subscription',
        nextDueDate: '2026-05-01',
      }),
    });
    assert.equal(recRes.status, 201);

    // 4. Export Complete Backup for User A
    const exportRes = await fetch(`${baseUrl}/api/backup/export?download=1`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert.equal(exportRes.status, 200);
    assert.ok(exportRes.headers.get('content-disposition')?.includes('momentum-complete-backup-'));
    const exportText = await exportRes.text();
    const exported = JSON.parse(exportText) as any;

    // Ensure ZERO secrets/passwords/tokens appear anywhere in backup JSON
    assert.equal(exportText.includes(userAToken), false);
    assert.equal(exportText.includes('StrongPassword123!'), false);
    assert.equal(exportText.includes('password_hash'), false);
    assert.equal(exportText.includes('passwordHash'), false);
    assert.equal(exportText.includes('storageFilename'), false);

    assert.equal(exported.learning.attachments.length, 1);
    assert.equal(exported.learning.modules.length, 1);
    assert.equal(exported.learning.tasks.length, 2);
    assert.equal(exported.finance.transactions.length, 1);
    assert.equal(exported.finance.budgets.length, 1);
    assert.equal(exported.finance.savingsGoals.length, 1);
    assert.equal(exported.finance.savingsGoals[0].contributions.length, 1);

    // 5. Server Preview Verification
    const previewRes = await fetch(`${baseUrl}/api/backup/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userBToken}` },
      body: JSON.stringify({ rawText: exportText }),
    });
    assert.equal(previewRes.status, 200);
    const previewData = (await previewRes.json()) as any;
    assert.equal(previewData.preview.checksumValid, true);
    assert.equal(previewData.preview.counts.tasks, 1);
    assert.equal(previewData.preview.counts.goals, 1);
    assert.equal(previewData.preview.counts.projects, 1);
    assert.equal(previewData.preview.counts.habits, 1);
    assert.equal(previewData.preview.counts.calendarActivities, 1);
    assert.equal(previewData.preview.counts.journalEntries, 1);
    assert.equal(previewData.preview.counts.focusSessions, 1);
    assert.equal(previewData.preview.counts.workoutSessions, 1);
    assert.equal(previewData.preview.counts.learningModules, 1);
    assert.equal(previewData.preview.counts.learningLessons, 1);
    assert.equal(previewData.preview.counts.learningNotes, 1);
    assert.equal(previewData.preview.counts.assignments, 1);
    assert.equal(previewData.preview.counts.practicalLabs, 1);
    assert.equal(previewData.preview.counts.attachedFiles, 1);
    assert.equal(previewData.preview.counts.attachedFilesTotalBytes, uploadedPdfBytes.byteLength);
    assert.equal(previewData.preview.counts.financeTransactions, 1);
    assert.equal(previewData.preview.counts.budgets, 1);
    assert.equal(previewData.preview.counts.savingsGoals, 1);
    assert.equal(previewData.preview.counts.savingsContributions, 1);

    // 6. Corrupted / Tampered backup rejection
    const tampered = structuredClone(exported);
    tampered.finance.transactions[0].amount = 999999;
    const tamperedPreviewRes = await fetch(`${baseUrl}/api/backup/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userBToken}` },
      body: JSON.stringify({ backup: tampered }),
    });
    assert.equal(tamperedPreviewRes.status, 400);
    const tamperedErr = (await tamperedPreviewRes.json()) as any;
    assert.equal(tamperedErr.code, 'CORRUPTED_CHECKSUM');

    // 7. Create pre-existing data on User B before restore to test non-destructive Merge + Cross-User ID isolation
    const authB = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userBToken}`,
    };
    await fetch(`${baseUrl}/api/workspace/sync`, {
      method: 'POST',
      headers: authB,
      body: JSON.stringify({
        collections: {
          tasks: [
            {
              id: 'task-b-existing',
              updatedAt: now,
              data: {
                id: 'task-b-existing',
                title: 'User B Existing Task',
                status: 'not_started',
                priority: 'medium',
                category: 'other',
                tags: [],
                subtasks: [],
                createdAt: now,
              },
            },
          ],
        },
      }),
    });

    await fetch(`${baseUrl}/api/finance/transactions`, {
      method: 'POST',
      headers: authB,
      body: JSON.stringify({
        type: 'income',
        amount: 500,
        date: '2026-04-04',
        category: 'Salary',
        description: 'User B Pre-Existing Income',
        paymentMethod: 'Bank Transfer',
      }),
    });

    // Guard check: replace without confirmReplace MUST fail cleanly
    const unconfirmedReplace = await fetch(`${baseUrl}/api/backup/restore`, {
      method: 'POST',
      headers: authB,
      body: JSON.stringify({ backup: exported, strategy: 'replace', confirmReplace: false }),
    });
    assert.equal(unconfirmedReplace.status, 400);

    // 8. Safe Merge Restore into User B
    const mergeRes = await fetch(`${baseUrl}/api/backup/restore`, {
      method: 'POST',
      headers: authB,
      body: JSON.stringify({ backup: exported, strategy: 'merge' }),
    });
    assert.equal(mergeRes.status, 200);
    const mergeData = (await mergeRes.json()) as any;
    assert.equal(mergeData.summary.filesRestored, 1);

    // Verify User B has BOTH pre-existing + restored workspace tasks, learning module + attachment, finance transactions
    const bWsBoot = await (
      await fetch(`${baseUrl}/api/workspace/bootstrap`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      })
    ).json() as any;
    assert.equal(bWsBoot.collections.tasks.length, 2);
    assert.ok(bWsBoot.collections.tasks.some((t: any) => t.id === 'task-b-existing'));
    assert.ok(bWsBoot.collections.tasks.some((t: any) => t.title === 'Harden SSH Bastion'));
    assert.equal(bWsBoot.collections.journalEntries[0].title, 'Private Security Journal');

    const bLearnBoot = await (
      await fetch(`${baseUrl}/api/learning/bootstrap`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      })
    ).json() as any;
    assert.equal(bLearnBoot.modules.length, 1);
    assert.equal(bLearnBoot.modules[0].userId, userBId);
    assert.notEqual(bLearnBoot.modules[0].id, module.id); // remapped safely from User A's PK!
    assert.equal(bLearnBoot.tasks.length, 2);

    const restoredFileResObj = bLearnBoot.resources.find((r: any) => r.kind === 'file');
    assert.ok(restoredFileResObj);
    const fileDownloadRes = await fetch(
      `${baseUrl}/api/learning/resources/${restoredFileResObj.id}/file`,
      { headers: { Authorization: `Bearer ${userBToken}` } }
    );
    assert.equal(fileDownloadRes.status, 200);
    const downloadedBuf = Buffer.from(await fileDownloadRes.arrayBuffer());
    assert.deepEqual(downloadedBuf, uploadedPdfBytes);

    const bFinBoot = await (
      await fetch(`${baseUrl}/api/finance/bootstrap`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      })
    ).json() as any;
    assert.equal(bFinBoot.transactions.length, 2);
    assert.equal(bFinBoot.budgets.length, 1);
    assert.equal(bFinBoot.savingsGoals.length, 1);

    // Verify User A's own files and records were untouched by User B's restore!
    const aLearnBoot = await (
      await fetch(`${baseUrl}/api/learning/bootstrap`, {
        headers: { Authorization: `Bearer ${userAToken}` },
      })
    ).json() as any;
    assert.equal(aLearnBoot.modules[0].id, module.id);
    assert.equal(aLearnBoot.modules[0].userId, userAId);

    // 9. Confirmed Full Replace Restore on User B (removes User B's pre-existing extra records)
    const replaceRes = await fetch(`${baseUrl}/api/backup/restore`, {
      method: 'POST',
      headers: authB,
      body: JSON.stringify({
        backup: exported,
        strategy: 'replace',
        confirmReplace: true,
      }),
    });
    assert.equal(replaceRes.status, 200);

    const bWsAfterReplace = await (
      await fetch(`${baseUrl}/api/workspace/bootstrap`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      })
    ).json() as any;
    assert.equal(bWsAfterReplace.collections.tasks.length, 1);
    assert.equal(bWsAfterReplace.collections.tasks[0].title, 'Harden SSH Bastion');
    assert.equal(bWsAfterReplace.preferences.theme, 'dark');

    const bFinAfterReplace = await (
      await fetch(`${baseUrl}/api/finance/bootstrap`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      })
    ).json() as any;
    assert.equal(bFinAfterReplace.transactions.length, 1);
    assert.equal(bFinAfterReplace.settings.currency, 'USD');

    // 10. Legacy v0 migration + restore via API
    const legacyV0 = getDefaultState();
    const v0PreviewRes = await fetch(`${baseUrl}/api/backup/preview`, {
      method: 'POST',
      headers: authB,
      body: JSON.stringify({ rawText: JSON.stringify(legacyV0) }),
    });
    assert.equal(v0PreviewRes.status, 200);
    const v0Preview = (await v0PreviewRes.json()) as any;
    assert.equal(v0Preview.preview.migratedFromVersion, 0);
    assert.equal(v0Preview.preview.integrityStatus, 'migrated_legacy');
  });
});
