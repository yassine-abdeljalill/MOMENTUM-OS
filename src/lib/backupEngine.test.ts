import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKUP_FORMAT,
  CURRENT_BACKUP_SCHEMA_VERSION,
  BackupValidationError,
  applyBackupToLocalAppState,
  base64ToBytes,
  buildBackupPreview,
  bytesToBase64,
  computeSha256HexFromBytes,
  createEmptyCollectionsRecord,
  finalizeBackupEnvelope,
  parseAndVerifyBackupText,
  verifyAndNormalizeBackupPayload,
} from './backupEngine';
import { getDefaultState } from './storage';

test('finalizeBackupEnvelope creates signed v2 backup and strips secret fields', async () => {
  const sampleBytes = new TextEncoder().encode('%PDF-1.4\nSample lab sheet binary');
  const fileHash = await computeSha256HexFromBytes(sampleBytes);

  const collections = createEmptyCollectionsRecord();
  collections.tasks = [
    {
      id: 't-1',
      userId: 'user-a',
      title: 'Verify kernel firewall rules',
      status: 'in_progress',
      priority: 'high',
      category: 'education',
      tags: ['sec'],
      subtasks: [],
      createdAt: '2026-04-01T10:00:00.000Z',
    },
  ];
  collections.projects = [
    {
      id: 'p-1',
      userId: 'user-a',
      name: 'Zero Trust Lab',
      description: 'Home lab setup',
      color: '#1D1D1F',
      status: 'active',
      priority: 'high',
      category: 'career',
      startDate: '2026-04-01',
      milestones: [],
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-01T10:00:00.000Z',
    },
  ];
  collections.journalEntries = [
    {
      id: 'j-1',
      userId: 'user-a',
      title: 'Weekly Review',
      content: 'Deep focus worked well',
      date: '2026-04-02',
      category: 'weekly_review',
      tags: [],
      createdAt: '2026-04-02T19:00:00.000Z',
      updatedAt: '2026-04-02T19:00:00.000Z',
    },
  ];

  const backup = await finalizeBackupEnvelope({
    exportedAt: '2026-04-05T12:00:00.000Z',
    workspace: {
      profile: {
        id: 'user-a',
        email: 'alex@example.com',
        fullName: 'Alex',
        // @ts-expect-error deliberate secret injection test
        passwordHash: 'SECRET_HASH_SHOULD_NOT_EXPORT',
        passwordSalt: 'SECRET_SALT',
        sessionToken: 'SECRET_SESSION',
      },
      preferences: { theme: 'dark', startOfWeek: 'monday' },
      collections,
    },
    learning: {
      modules: [
        {
          id: 'mod-1',
          userId: 'user-a',
          title: 'Network Security',
          description: '',
          color: '#1D1D1F',
          icon: 'shield',
          status: 'in_progress',
          sortOrder: 0,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
      lessons: [
        {
          id: 'les-1',
          userId: 'user-a',
          moduleId: 'mod-1',
          title: 'TLS 1.3 Handshake',
          description: '',
          teacherName: 'Dr. Reed',
          lessonDate: '2026-04-02',
          status: 'in_progress',
          learningObjectives: ['Verify handshake keys'],
          studyDurationMinutes: 60,
          sortOrder: 0,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
      notes: [
        {
          id: 'note-1',
          userId: 'user-a',
          lessonId: 'les-1',
          title: 'Cipher Suites',
          contentHtml: '<p>AEAD only</p>',
          plainText: 'AEAD only',
          isPinned: true,
          createdAt: '2026-04-02T10:00:00.000Z',
          updatedAt: '2026-04-02T10:00:00.000Z',
        },
      ],
      tasks: [
        {
          id: 'lt-1',
          userId: 'user-a',
          moduleId: 'mod-1',
          lessonId: 'les-1',
          title: 'Assignment 1: Packet Capture',
          description: 'Analyze handshake',
          taskKind: 'assignment',
          status: 'todo',
          priority: 'high',
          dueDate: '2026-04-10',
          subtasks: [],
          createdAt: '2026-04-02T10:00:00.000Z',
          updatedAt: '2026-04-02T10:00:00.000Z',
        },
        {
          id: 'lt-2',
          userId: 'user-a',
          moduleId: 'mod-1',
          lessonId: 'les-1',
          title: 'Practical Lab: OpenSSL Mutual TLS',
          description: 'Configure mTLS',
          taskKind: 'lab',
          status: 'in_progress',
          priority: 'urgent',
          dueDate: '2026-04-12',
          subtasks: [],
          createdAt: '2026-04-02T10:00:00.000Z',
          updatedAt: '2026-04-02T10:00:00.000Z',
        },
      ],
      resources: [
        {
          id: 'res-1',
          userId: 'user-a',
          moduleId: 'mod-1',
          lessonId: 'les-1',
          kind: 'file',
          title: 'Lab Sheet PDF',
          description: 'Instructions',
          folderName: 'Labs',
          originalFilename: 'lab1.pdf',
          mimeType: 'application/pdf',
          fileSize: sampleBytes.byteLength,
          fileExtension: '.pdf',
          createdAt: '2026-04-02T10:00:00.000Z',
          updatedAt: '2026-04-02T10:00:00.000Z',
        },
      ],
      studySessions: [],
      attachments: [
        {
          resourceId: 'res-1',
          originalFilename: 'lab1.pdf',
          mimeType: 'application/pdf',
          fileSize: sampleBytes.byteLength,
          fileExtension: '.pdf',
          sha256: fileHash,
          contentBase64: bytesToBase64(sampleBytes),
        },
      ],
    },
    finance: {
      settings: { userId: 'user-a', currency: 'USD', locale: 'en-US', updatedAt: '2026-04-01T00:00:00.000Z' },
      categories: [],
      transactions: [
        {
          id: 'tx-1',
          userId: 'user-a',
          type: 'expense',
          amount: 42.5,
          date: '2026-04-03',
          category: 'Books',
          description: 'RFC guide',
          paymentMethod: 'Credit Card',
          createdAt: '2026-04-03T10:00:00.000Z',
          updatedAt: '2026-04-03T10:00:00.000Z',
        },
      ],
      budgets: [
        {
          id: 'bud-1',
          userId: 'user-a',
          category: 'Books',
          month: '2026-04',
          limitAmount: 200,
          warningThresholdPercent: 80,
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
      savingsGoals: [
        {
          id: 'sg-1',
          userId: 'user-a',
          name: 'Workstation Upgrade',
          targetAmount: 2500,
          currentAmount: 500,
          deadline: '2026-12-31',
          category: 'Hardware',
          notes: '',
          contributions: [
            {
              id: 'sc-1',
              userId: 'user-a',
              goalId: 'sg-1',
              amount: 500,
              date: '2026-04-01',
              note: 'Initial deposit',
              createdAt: '2026-04-01T00:00:00.000Z',
            },
          ],
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
      ],
      recurringPayments: [],
    },
  });

  assert.equal(backup.format, BACKUP_FORMAT);
  assert.equal(backup.schemaVersion, CURRENT_BACKUP_SCHEMA_VERSION);
  assert.match(backup.checksum, /^[a-f0-9]{64}$/);

  const rawJson = JSON.stringify(backup);
  assert.equal(rawJson.includes('SECRET_HASH_SHOULD_NOT_EXPORT'), false);
  assert.equal(rawJson.includes('SECRET_SALT'), false);
  assert.equal(rawJson.includes('SECRET_SESSION'), false);

  const verified = await parseAndVerifyBackupText(rawJson);
  assert.equal(verified.preview.integrityStatus, 'verified');
  assert.equal(verified.preview.checksumValid, true);
  assert.equal(verified.preview.counts.tasks, 1);
  assert.equal(verified.preview.counts.projects, 1);
  assert.equal(verified.preview.counts.journalEntries, 1);
  assert.equal(verified.preview.counts.learningModules, 1);
  assert.equal(verified.preview.counts.learningLessons, 1);
  assert.equal(verified.preview.counts.learningNotes, 1);
  assert.equal(verified.preview.counts.assignments, 1);
  assert.equal(verified.preview.counts.practicalLabs, 1);
  assert.equal(verified.preview.counts.attachedFiles, 1);
  assert.equal(verified.preview.counts.attachedFilesTotalBytes, sampleBytes.byteLength);
  assert.equal(verified.preview.counts.financeTransactions, 1);
  assert.equal(verified.preview.counts.budgets, 1);
  assert.equal(verified.preview.counts.savingsGoals, 1);
  assert.equal(verified.preview.counts.savingsContributions, 1);
  assert.equal(verified.preview.counts.hasPreferences, true);

  const roundTripBytes = base64ToBytes(verified.backup.learning.attachments[0].contentBase64);
  assert.deepEqual(roundTripBytes, sampleBytes);
});

test('parseAndVerifyBackupText rejects tampered checksum and corrupted attachments', async () => {
  const bytes = new TextEncoder().encode('hello attachment');
  const hash = await computeSha256HexFromBytes(bytes);

  const backup = await finalizeBackupEnvelope({
    exportedAt: '2026-04-05T12:00:00.000Z',
    workspace: {
      profile: { id: 'u1', email: 'u1@test.com', fullName: 'User One' },
      preferences: { theme: 'light' },
      collections: createEmptyCollectionsRecord(),
    },
    learning: {
      modules: [],
      lessons: [],
      notes: [],
      resources: [],
      tasks: [],
      studySessions: [],
      attachments: [
        {
          resourceId: 'r1',
          originalFilename: 'notes.txt',
          mimeType: 'text/plain',
          fileSize: bytes.byteLength,
          fileExtension: '.txt',
          sha256: hash,
          contentBase64: bytesToBase64(bytes),
        },
      ],
    },
    finance: {
      categories: [],
      transactions: [],
      budgets: [],
      savingsGoals: [],
      recurringPayments: [],
    },
  });

  // Tamper with a workspace preference without updating checksum
  const tamperedEnvelope = structuredClone(backup);
  tamperedEnvelope.workspace.preferences.theme = 'dark';
  await assert.rejects(
    () => verifyAndNormalizeBackupPayload(tamperedEnvelope),
    (err: unknown) => err instanceof BackupValidationError && err.code === 'CORRUPTED_CHECKSUM'
  );

  // Re-sign envelope, but corrupt attachment bytes with matching envelope checksum
  const badBytes = new TextEncoder().encode('corrupted payload');
  const corruptedAttachmentBackup = await finalizeBackupEnvelope({
    exportedAt: '2026-04-05T12:00:00.000Z',
    workspace: backup.workspace,
    learning: {
      ...backup.learning,
      attachments: [
        {
          ...backup.learning.attachments[0],
          fileSize: badBytes.byteLength,
          contentBase64: bytesToBase64(badBytes),
          // keep original hash -> mismatch!
        },
      ],
    },
    finance: backup.finance,
  });

  await assert.rejects(
    () => verifyAndNormalizeBackupPayload(corruptedAttachmentBackup),
    (err: unknown) => err instanceof BackupValidationError && err.code === 'CORRUPTED_ATTACHMENT'
  );
});

test('parseAndVerifyBackupText migrates legacy v0 AppState JSON and rejects future schema versions', async () => {
  const legacy = getDefaultState();
  const migrated = await parseAndVerifyBackupText(JSON.stringify(legacy));
  assert.equal(migrated.backup.schemaVersion, 2);
  assert.equal(migrated.preview.migratedFromVersion, 0);
  assert.equal(migrated.preview.integrityStatus, 'migrated_legacy');
  assert.equal(migrated.preview.counts.tasks, legacy.tasks.filter(t => !t.learningModuleId).length);
  assert.equal(migrated.preview.counts.goals, legacy.goals.length);
  assert.equal(migrated.preview.counts.projects, legacy.projects.length);
  assert.equal(migrated.preview.counts.habits, legacy.habits.length);
  assert.ok(migrated.preview.warnings.some(w => w.includes('legacy v0')));

  await assert.rejects(
    () =>
      verifyAndNormalizeBackupPayload({
        format: BACKUP_FORMAT,
        schemaVersion: 99,
      }),
    (err: unknown) => err instanceof BackupValidationError && err.code === 'UNSUPPORTED_VERSION'
  );

  await assert.rejects(
    () => parseAndVerifyBackupText('{not valid json'),
    (err: unknown) => err instanceof BackupValidationError && err.code === 'INVALID_JSON'
  );
});

test('applyBackupToLocalAppState preserves existing items on merge and replaces cleanly on replace', async () => {
  const existing = getDefaultState();
  const incomingCollections = createEmptyCollectionsRecord();
  incomingCollections.tasks = [
    {
      id: 'new-task-from-backup',
      userId: 'other-user',
      title: 'Restored Task',
      status: 'not_started',
      priority: 'medium',
      category: 'career',
      tags: [],
      subtasks: [],
      createdAt: '2026-04-01T00:00:00.000Z',
    },
  ];
  const backup = await finalizeBackupEnvelope({
    workspace: {
      profile: { id: 'other-user', email: 'other@test.com', fullName: 'Backup Owner' },
      preferences: { theme: 'dark' },
      collections: incomingCollections,
    },
    learning: {
      modules: [],
      lessons: [],
      notes: [],
      resources: [],
      tasks: [],
      studySessions: [],
      attachments: [],
    },
    finance: {
      categories: [],
      transactions: [],
      budgets: [],
      savingsGoals: [],
      recurringPayments: [],
    },
  });

  const merged = applyBackupToLocalAppState({
    currentState: existing,
    backup,
    strategy: 'merge',
    userId: 'current-user',
  });
  assert.equal(merged.tasks.length, existing.tasks.length + 1);
  assert.equal(merged.profile.fullName, existing.profile.fullName);
  assert.equal(merged.tasks[0].userId, 'current-user');

  const replaced = applyBackupToLocalAppState({
    currentState: existing,
    backup,
    strategy: 'replace',
    userId: 'current-user',
  });
  assert.equal(replaced.tasks.length, 1);
  assert.equal(replaced.tasks[0].id, 'new-task-from-backup');
  assert.equal(replaced.profile.id, 'current-user');
  assert.equal(replaced.preferences.theme, 'dark');
  assert.ok(buildBackupPreview(backup).counts.tasks === 1);
});
