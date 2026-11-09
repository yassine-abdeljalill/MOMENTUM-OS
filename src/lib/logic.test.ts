import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGoalProgress,
  calculateProjectProgress,
  calculateDailyScore,
  calculateHabitStreak,
  calculateFocusElapsedTime,
  formatMinutes,
  isHabitScheduledOnDay,
} from './logic';
import { Goal, Habit, HabitCompletion, Project, Task } from '../types';

test('calculateGoalProgress calculates milestone-based progress accurately', () => {
  const goal: Goal = {
    id: 'g-1',
    userId: 'u-1',
    title: 'Master Systems Architecture',
    description: 'Deep dive into distributed systems',
    category: 'education',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    status: 'active',
    priority: 'high',
    progressCalculation: 'milestones',
    manualProgress: 0,
    successCriteria: 'Deploy microservices pipeline',
    motivation: 'Professional excellence',
    milestones: [
      { id: 'm1', goalId: 'g-1', title: 'Complete Course', completed: true, order: 1 },
      { id: 'm2', goalId: 'g-1', title: 'Build Project', completed: true, order: 2 },
      { id: 'm3', goalId: 'g-1', title: 'Pass Certification', completed: false, order: 3 },
      { id: 'm4', goalId: 'g-1', title: 'Publish Case Study', completed: false, order: 4 },
    ],
    relatedProjectIds: [],
    createdAt: '2026-01-01',
  };

  const progress = calculateGoalProgress(goal);
  assert.equal(progress, 50); // 2 of 4 milestones = 50%
});

test('calculateGoalProgress handles completed status override', () => {
  const goal: Goal = {
    id: 'g-2',
    userId: 'u-1',
    title: 'Completed Goal',
    description: '',
    category: 'career',
    startDate: '2026-01-01',
    targetDate: '2026-06-01',
    status: 'completed',
    priority: 'medium',
    progressCalculation: 'manual',
    manualProgress: 35,
    successCriteria: '',
    motivation: '',
    milestones: [],
    relatedProjectIds: [],
    createdAt: '2026-01-01',
  };

  assert.equal(calculateGoalProgress(goal), 100);
});

test('calculateProjectProgress tracks tasks and milestones', () => {
  const project: Project = {
    id: 'p-1',
    userId: 'u-1',
    name: 'MOMENTUM Platform',
    description: 'Life OS web app',
    color: '#D2925B',
    status: 'active',
    priority: 'urgent',
    category: 'career',
    startDate: '2026-01-01',
    milestones: [
      { id: 'pm-1', projectId: 'p-1', title: 'Architecture design', completed: true },
      { id: 'pm-2', projectId: 'p-1', title: 'Database schema', completed: false },
    ],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const tasks: Task[] = [
    {
      id: 't-1',
      userId: 'u-1',
      title: 'Build UI components',
      status: 'completed',
      priority: 'high',
      category: 'career',
      tags: [],
      subtasks: [],
      relatedProjectId: 'p-1',
      createdAt: '2026-01-01',
    },
    {
      id: 't-2',
      userId: 'u-1',
      title: 'Deploy to Cloud',
      status: 'in_progress',
      priority: 'high',
      category: 'career',
      tags: [],
      subtasks: [],
      relatedProjectId: 'p-1',
      createdAt: '2026-01-01',
    },
  ];

  // 2 items completed out of 4 total (1 milestone + 1 task completed)
  const progress = calculateProjectProgress(project, tasks);
  assert.equal(progress, 50);
});

test('calculateDailyScore calculates transparent weighted score', () => {
  const score = calculateDailyScore({
    tasksCompleted: 4,
    tasksTotal: 5, // 80% tasks
    habitsCompleted: 3,
    habitsTotal: 3, // 100% habits
    focusMinutes: 60,
    targetFocusMinutes: 60, // 100% focus
  });

  // 80*0.5 (40) + 100*0.3 (30) + 100*0.2 (20) = 90%
  assert.equal(score.overallPercentage, 90);
  assert.equal(score.taskPercentage, 80);
  assert.equal(score.habitPercentage, 100);
  assert.equal(score.focusPercentage, 100);
});

test('calculateHabitStreak computes streak and honors skipped days', () => {
  const habit: Habit = {
    id: 'h-1',
    userId: 'u-1',
    name: 'Daily Reading',
    category: 'personal_development',
    frequency: 'daily',
    targetCountPerDay: 1,
    startDate: '2026-11-01',
    color: '#868A7A',
    active: true,
    createdAt: '2026-11-01',
  };

  const completions: HabitCompletion[] = [
    { id: 'c-1', habitId: 'h-1', userId: 'u-1', date: '2026-11-09', completed: true, count: 1 },
    { id: 'c-2', habitId: 'h-1', userId: 'u-1', date: '2026-11-08', completed: true, count: 1 },
    { id: 'c-3', habitId: 'h-1', userId: 'u-1', date: '2026-11-07', completed: false, skipped: true, skipReason: 'Travel day', count: 0 },
    { id: 'c-4', habitId: 'h-1', userId: 'u-1', date: '2026-11-06', completed: true, count: 1 },
    { id: 'c-5', habitId: 'h-1', userId: 'u-1', date: '2026-11-05', completed: true, count: 1 },
  ];

  const result = calculateHabitStreak(habit, completions, '2026-11-09');
  // 4 active completed days with 1 skipped day preserved
  assert.equal(result.currentStreak, 4);
  assert.equal(result.completedToday, true);
});

test('calculateFocusElapsedTime computes drift-free seconds', () => {
  const start = 1700000000000;
  const now = 1700001500000; // 1500 seconds later
  const paused = 300000; // 300 seconds paused
  const elapsed = calculateFocusElapsedTime(start, paused, now);
  assert.equal(elapsed, 1200); // 1200 seconds = 20 mins
});

test('formatMinutes formats properly', () => {
  assert.equal(formatMinutes(0), '0m');
  assert.equal(formatMinutes(45), '45m');
  assert.equal(formatMinutes(90), '1h 30m');
  assert.equal(formatMinutes(120), '2h');
});
