import { test } from 'node:test';
import assert from 'node:assert';
import {
  computeModuleStats,
  formatFileSize,
  getResourceCategoryLabel,
  isResourcePreviewable,
  mapAppTaskStatusToLearningStatus,
  mapLearningStatusToAppTaskStatus,
  mapLearningTaskToAppTask,
  reorderListByIds,
} from './learning.ts';
import type {
  LearningLesson,
  LearningModule,
  LearningResource,
  LearningTask,
} from '../types/learning';

test('computeModuleStats accurately computes total, completed, remaining, and percentage', () => {
  const lessons: LearningLesson[] = [
    {
      id: 'l1',
      moduleId: 'm1',
      userId: 'u1',
      title: 'Lesson 1',
      description: '',
      teacherName: 'Prof. A',
      lessonDate: '2026-11-10',
      status: 'completed',
      learningObjectives: [],
      studyDurationMinutes: 60,
      sortOrder: 0,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'l2',
      moduleId: 'm1',
      userId: 'u1',
      title: 'Lesson 2',
      description: '',
      teacherName: 'Prof. A',
      lessonDate: '2026-11-11',
      status: 'in_progress',
      learningObjectives: [],
      studyDurationMinutes: 45,
      sortOrder: 1,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'l3',
      moduleId: 'm1',
      userId: 'u1',
      title: 'Lesson 3',
      description: '',
      teacherName: '',
      lessonDate: '2026-11-12',
      status: 'not_started',
      learningObjectives: [],
      studyDurationMinutes: 60,
      sortOrder: 2,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const stats = computeModuleStats(lessons);
  assert.strictEqual(stats.total, 3);
  assert.strictEqual(stats.completed, 1);
  assert.strictEqual(stats.inProgress, 1);
  assert.strictEqual(stats.remaining, 2);
  assert.strictEqual(stats.progressPct, 33);

  const empty = computeModuleStats([]);
  assert.strictEqual(empty.total, 0);
  assert.strictEqual(empty.progressPct, 0);
});

test('task status mapping preserves round-trip semantics between Learning and App Tasks', () => {
  assert.strictEqual(mapLearningStatusToAppTaskStatus('todo'), 'not_started');
  assert.strictEqual(mapLearningStatusToAppTaskStatus('in_progress'), 'in_progress');
  assert.strictEqual(mapLearningStatusToAppTaskStatus('completed'), 'completed');

  assert.strictEqual(mapAppTaskStatusToLearningStatus('not_started'), 'todo');
  assert.strictEqual(mapAppTaskStatusToLearningStatus('inbox'), 'todo');
  assert.strictEqual(mapAppTaskStatusToLearningStatus('in_progress'), 'in_progress');
  assert.strictEqual(mapAppTaskStatusToLearningStatus('completed'), 'completed');
});

test('mapLearningTaskToAppTask preserves exact ID and attaches module/lesson metadata without duplication', () => {
  const mod: LearningModule = {
    id: 'lmod_1',
    userId: 'u1',
    title: 'Applied Cryptography',
    description: '',
    color: '#9ECCFD',
    icon: 'shield',
    status: 'in_progress',
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  };
  const les: LearningLesson = {
    id: 'lles_1',
    moduleId: 'lmod_1',
    userId: 'u1',
    title: 'Lecture 1: AES-GCM',
    description: '',
    teacherName: 'Dr. Meyer',
    lessonDate: '2026-11-12',
    status: 'in_progress',
    learningObjectives: [],
    studyDurationMinutes: 60,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  };
  const lt: LearningTask = {
    id: 'ltask_123',
    userId: 'u1',
    moduleId: 'lmod_1',
    lessonId: 'lles_1',
    title: 'Implement Nonce Reuse Audit',
    description: 'Check IV generation',
    taskKind: 'lab',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-11-20',
    subtasks: [],
    createdAt: '2026-11-12T10:00:00Z',
    updatedAt: '2026-11-12T10:00:00Z',
  };

  const mapped = mapLearningTaskToAppTask(
    lt,
    new Map([[mod.id, mod]]),
    new Map([[les.id, les]])
  );

  assert.strictEqual(mapped.id, 'ltask_123');
  assert.strictEqual(mapped.status, 'in_progress');
  assert.strictEqual(mapped.category, 'education');
  assert.strictEqual(mapped.learningModuleId, 'lmod_1');
  assert.strictEqual(mapped.learningModuleTitle, 'Applied Cryptography');
  assert.strictEqual(mapped.learningLessonId, 'lles_1');
  assert.strictEqual(mapped.learningLessonTitle, 'Lecture 1: AES-GCM');
  assert.strictEqual(mapped.learningTaskKind, 'lab');
});

test('reorderListByIds reorders items cleanly without mutating the original array', () => {
  const original = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const reordered = reorderListByIds(original, 'c', 'a');
  assert.deepStrictEqual(
    reordered.map(x => x.id),
    ['c', 'a', 'b']
  );
  assert.deepStrictEqual(
    original.map(x => x.id),
    ['a', 'b', 'c']
  );
  assert.strictEqual(reorderListByIds(original, 'missing', 'a'), original);
});

test('resource helpers format file sizes and identify previewable formats', () => {
  assert.strictEqual(formatFileSize(0), '0 B');
  assert.strictEqual(formatFileSize(512), '512 B');
  assert.strictEqual(formatFileSize(2048), '2.0 KB');
  assert.strictEqual(formatFileSize(3 * 1024 * 1024), '3.00 MB');

  const base: LearningResource = {
    id: 'r1',
    userId: 'u1',
    moduleId: 'm1',
    lessonId: 'l1',
    kind: 'file',
    title: 'slides.pdf',
    description: '',
    folderName: 'Lecture Slides',
    fileSize: 1024,
    fileExtension: '.pdf',
    createdAt: '',
    updatedAt: '',
  };
  assert.strictEqual(isResourcePreviewable(base), 'pdf');
  assert.strictEqual(getResourceCategoryLabel(base), 'PDF Document');
  assert.strictEqual(isResourcePreviewable({ ...base, fileExtension: '.png' }), 'image');
  assert.strictEqual(isResourcePreviewable({ ...base, fileExtension: '.py' }), 'text');
  assert.strictEqual(isResourcePreviewable({ ...base, fileExtension: '.docx' }), null);
  assert.strictEqual(isResourcePreviewable({ ...base, kind: 'link' }), null);
});
