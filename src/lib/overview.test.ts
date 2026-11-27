import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  Course,
  FocusSession,
  Habit,
  HabitCompletion,
  LearningBootstrapData,
  Project,
  StudySession,
  Task,
  UserPreferences,
  UserProfile,
  WorkoutSession,
} from '../types';
import {
  computeFocusStatistics,
  computeWeeklyProgress,
  DEFAULT_WEEKLY_TARGETS,
  getTaskDueUrgency,
  getWeekBounds,
  resolveWeeklyTargets,
  selectContinueLearning,
  selectTodaysPriorities,
  selectUpcomingDeadlines,
} from './overview';

const baseProfile: UserProfile = {
  id: 'u1',
  email: 'alex@example.com',
  fullName: 'Alex Vance',
  timezone: 'UTC',
  preferredLanguage: 'English',
  lifeAreas: ['education', 'fitness'],
  visionStatement: 'Focus',
  dailyAvailabilityHours: 4,
  onboardingCompleted: true,
  createdAt: '2026-01-01T00:00:00Z',
};

function makeTask(overrides: Partial<Task> & { id: string; title: string }): Task {
  return {
    userId: 'u1',
    status: 'not_started',
    priority: 'medium',
    category: 'education',
    tags: [],
    subtasks: [],
    createdAt: '2026-11-20T08:00:00Z',
    ...overrides,
  };
}

test('getTaskDueUrgency computes overdue, today, tomorrow, and upcoming deltas', () => {
  const today = '2026-11-27';
  assert.deepEqual(getTaskDueUrgency('2026-11-24', today, false), {
    label: 'Overdue · 3d',
    tone: 'overdue',
    isOverdue: true,
    daysDelta: -3,
  });
  assert.equal(getTaskDueUrgency('2026-11-24', today, true)?.isOverdue, false);
  assert.equal(getTaskDueUrgency('2026-11-27', today, false)?.label, 'Due today');
  assert.equal(getTaskDueUrgency('2026-11-28', today, false)?.label, 'Tomorrow');
  assert.equal(getTaskDueUrgency('2026-11-30', today, false)?.label, 'In 3d');
});

test('selectTodaysPriorities picks ranked pinned priorities, calculates estimated minutes & overdue count', () => {
  const today = '2026-11-27';
  const tasks: Task[] = [
    makeTask({
      id: 't1',
      title: 'Overdue Security Audit',
      isDailyPriority: true,
      priorityRank: 2,
      dueDate: '2026-11-25',
      estimatedDurationMinutes: 60,
      priority: 'urgent',
    }),
    makeTask({
      id: 't2',
      title: 'Morning Deep Study',
      isDailyPriority: true,
      priorityRank: 1,
      dueDate: '2026-11-27',
      estimatedDurationMinutes: 90,
      status: 'completed',
    }),
    makeTask({
      id: 't3',
      title: 'Evening Strength Block',
      isDailyPriority: true,
      priorityRank: 3,
      dueDate: '2026-11-27',
      estimatedDurationMinutes: 45,
    }),
    makeTask({
      id: 't4',
      title: 'Extra backlog item',
      isDailyPriority: false,
      dueDate: '2026-11-27',
      estimatedDurationMinutes: 30,
    }),
  ];

  const result = selectTodaysPriorities(tasks, today);
  assert.equal(result.usingSuggestedFallback, false);
  assert.equal(result.items.length, 3);
  assert.deepEqual(
    result.items.map(i => i.task.id),
    ['t2', 't1', 't3']
  );
  assert.equal(result.totalEstimatedMinutes, 195);
  assert.equal(result.completedCount, 1);
  assert.equal(result.overdueCount, 1);
  assert.equal(result.items[1].isOverdue, true);
  assert.equal(result.items[0].isOverdue, false);
});

test('selectTodaysPriorities falls back cleanly to top urgent/overdue tasks when nothing is pinned', () => {
  const today = '2026-11-27';
  const tasks: Task[] = [
    makeTask({ id: 't-later', title: 'Later low', dueDate: '2026-12-05', priority: 'low' }),
    makeTask({ id: 't-overdue', title: 'Past due', dueDate: '2026-11-25', priority: 'medium' }),
    makeTask({ id: 't-today', title: 'Today urgent', dueDate: '2026-11-27', priority: 'urgent' }),
  ];

  const result = selectTodaysPriorities(tasks, today);
  assert.equal(result.usingSuggestedFallback, true);
  assert.deepEqual(
    result.items.map(i => i.task.id),
    ['t-overdue', 't-today', 't-later']
  );
});

test('computeFocusStatistics sums focus time today and calculates completion & remaining counts', () => {
  const today = '2026-11-27';
  const tasks: Task[] = [
    makeTask({
      id: 't1',
      title: 'Done today',
      dueDate: today,
      status: 'completed',
      completedAt: `${today}T09:00:00Z`,
    }),
    makeTask({
      id: 't2',
      title: 'Remaining priority',
      dueDate: today,
      isDailyPriority: true,
      status: 'in_progress',
    }),
    makeTask({
      id: 't3',
      title: 'Overdue pending',
      dueDate: '2026-11-25',
      status: 'not_started',
    }),
  ];
  const focusSessions: FocusSession[] = [
    {
      id: 'fs1',
      userId: 'u1',
      startTime: `${today}T08:00:00Z`,
      endTime: `${today}T08:50:00Z`,
      durationMinutes: 50,
      completed: true,
      sessionType: 'focus',
    },
    {
      id: 'fs2',
      userId: 'u1',
      startTime: `${today}T09:00:00Z`,
      endTime: `${today}T09:10:00Z`,
      durationMinutes: 10,
      completed: true,
      sessionType: 'break',
    },
    {
      id: 'fs3',
      userId: 'u1',
      startTime: `${today}T10:00:00Z`,
      endTime: `${today}T10:40:00Z`,
      durationMinutes: 40,
      completed: true,
      sessionType: 'focus',
    },
  ];
  const habits: Habit[] = [
    {
      id: 'h1',
      userId: 'u1',
      name: 'Deep Work',
      category: 'education',
      frequency: 'daily',
      targetCountPerDay: 1,
      startDate: '2026-11-01',
      color: '#1D1D1F',
      active: true,
      createdAt: '2026-11-01T00:00:00Z',
    },
  ];
  const habitCompletions: HabitCompletion[] = [
    { id: 'hc1', habitId: 'h1', userId: 'u1', date: today, completed: true, count: 1 },
  ];

  const stats = computeFocusStatistics({
    tasks,
    focusSessions,
    habits,
    habitCompletions,
    profile: baseProfile,
    todayStr: today,
  });

  assert.equal(stats.focusMinutesToday, 90);
  assert.equal(stats.sessionsTodayCount, 2);
  assert.equal(stats.completedTasksToday, 1);
  assert.equal(stats.remainingTasksToday, 2);
  assert.equal(stats.overdueTasksCount, 1);
  assert.ok(stats.dailyProgressPercentage > 0 && stats.dailyProgressPercentage <= 100);
});

test('selectContinueLearning selects last opened module & lesson from learningData and falls back to courses', () => {
  const learningData: LearningBootstrapData = {
    modules: [
      {
        id: 'm1',
        userId: 'u1',
        title: 'Network Security',
        description: 'Protocols & defense',
        color: '#1D1D1F',
        icon: 'shield',
        status: 'in_progress',
        sortOrder: 0,
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-26T00:00:00Z',
      },
      {
        id: 'm2',
        userId: 'u1',
        title: 'Distributed Systems',
        description: 'Consensus & replication',
        color: '#3A3A3C',
        icon: 'layers',
        status: 'in_progress',
        sortOrder: 1,
        createdAt: '2026-11-02T00:00:00Z',
        updatedAt: '2026-11-27T00:00:00Z',
      },
    ],
    lessons: [
      {
        id: 'l1',
        moduleId: 'm1',
        userId: 'u1',
        title: 'TLS 1.3 Handshake',
        description: '',
        teacherName: 'Dr. Meyer',
        lessonDate: '2026-11-20',
        status: 'completed',
        learningObjectives: [],
        studyDurationMinutes: 60,
        sortOrder: 0,
        lastOpenedAt: '2026-11-24T10:00:00Z',
        createdAt: '2026-11-20T00:00:00Z',
        updatedAt: '2026-11-24T10:00:00Z',
      },
      {
        id: 'l2',
        moduleId: 'm2',
        userId: 'u1',
        title: 'Raft Leader Election',
        description: '',
        teacherName: 'Prof. Lin',
        lessonDate: '2026-11-27',
        status: 'in_progress',
        learningObjectives: [],
        studyDurationMinutes: 75,
        sortOrder: 0,
        lastOpenedAt: '2026-11-27T02:00:00Z',
        createdAt: '2026-11-26T00:00:00Z',
        updatedAt: '2026-11-27T02:00:00Z',
      },
    ],
    notes: [],
    resources: [],
    tasks: [],
    studySessions: [],
  };

  const active = selectContinueLearning({
    learningData,
    courses: [],
    studySessions: [],
  });

  assert.equal(active.source, 'learning_center');
  assert.equal(active.moduleId, 'm2');
  assert.equal(active.lessonId, 'l2');
  assert.equal(active.lessonTitle, 'Raft Leader Election');
  assert.equal(active.progressPercentage, 0);

  // Fallback to legacy courses when learningData modules are empty
  const courses: Course[] = [
    {
      id: 'c1',
      userId: 'u1',
      title: 'Operating Systems',
      description: 'Kernel internals',
      category: 'Systems',
      startDate: '2026-10-01',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      lessons: [
        {
          id: 'cl1',
          courseId: 'c1',
          title: 'Virtual Memory',
          learningObjectives: [],
          content: '',
          completed: true,
          studyDurationMinutes: 50,
          order: 1,
        },
        {
          id: 'cl2',
          courseId: 'c1',
          title: 'Page Replacement',
          learningObjectives: [],
          content: '',
          completed: false,
          studyDurationMinutes: 45,
          order: 2,
        },
      ],
    },
  ];
  const fallback = selectContinueLearning({
    learningData: { modules: [], lessons: [], notes: [], resources: [], tasks: [], studySessions: [] },
    courses,
    studySessions: [],
  });
  assert.equal(fallback.source, 'legacy_course');
  assert.equal(fallback.moduleId, 'c1');
  assert.equal(fallback.lessonTitle, 'Page Replacement');
  assert.equal(fallback.progressPercentage, 50);
});

test('selectUpcomingDeadlines merges learning assignments/labs and tasks without duplicates, overdue first', () => {
  const today = '2026-11-27';
  const learningData: LearningBootstrapData = {
    modules: [
      {
        id: 'm1',
        userId: 'u1',
        title: 'Web Security',
        description: '',
        color: '#1D1D1F',
        icon: 'shield',
        status: 'in_progress',
        sortOrder: 0,
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-27T00:00:00Z',
      },
    ],
    lessons: [],
    notes: [],
    resources: [],
    tasks: [
      {
        id: 'lt-1',
        moduleId: 'm1',
        lessonId: null,
        userId: 'u1',
        title: 'SQL Injection Lab Writeup',
        description: '',
        taskKind: 'lab',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-11-28',
        subtasks: [],
        createdAt: '2026-11-20T00:00:00Z',
        updatedAt: '2026-11-20T00:00:00Z',
      },
    ],
    studySessions: [],
  };

  const projects: Project[] = [
    {
      id: 'p1',
      userId: 'u1',
      name: 'Portal Audit',
      description: '',
      color: '#1D1D1F',
      status: 'active',
      priority: 'urgent',
      category: 'career',
      startDate: '2026-11-01',
      milestones: [],
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];

  const tasks: Task[] = [
    // Duplicate reconciled learning task ID should not appear twice
    makeTask({
      id: 'lt-1',
      title: 'SQL Injection Lab Writeup',
      learningModuleId: 'm1',
      learningTaskKind: 'lab',
      dueDate: '2026-11-28',
      priority: 'high',
    }),
    makeTask({
      id: 't-overdue',
      title: 'Submit IDOR Threat Model',
      dueDate: '2026-11-25',
      priority: 'urgent',
      relatedProjectId: 'p1',
    }),
    makeTask({
      id: 't-pinned-today',
      title: 'Pinned Priority Already Shown Above',
      dueDate: '2026-11-27',
      priority: 'urgent',
      isDailyPriority: true,
      priorityRank: 1,
    }),
  ];

  const deadlines = selectUpcomingDeadlines({
    tasks,
    learningData,
    projects,
    todayStr: today,
  });

  assert.equal(deadlines.length, 2);
  assert.equal(deadlines.some(d => d.id === 't-pinned-today'), false);
  assert.equal(deadlines[0].id, 't-overdue');
  assert.equal(deadlines[0].urgency.isOverdue, true);
  assert.equal(deadlines[0].contextLabel, 'Portal Audit');
  assert.equal(deadlines[1].id, 'lt-1');
  assert.equal(deadlines[1].kindLabel, 'Practical Lab');
  assert.equal(deadlines[1].learningModuleId, 'm1');
});

test('computeWeeklyProgress aggregates weekly tasks, learning hours, labs, fitness & user targets', () => {
  const today = '2026-11-27'; // Friday
  const bounds = getWeekBounds(today, 'monday');
  assert.deepEqual(bounds, { startDateStr: '2026-11-23', endDateStr: '2026-11-29' });

  const prefs: Partial<UserPreferences> = {
    startOfWeek: 'monday',
    weeklyTargets: {
      tasksCompleted: 10,
      learningHours: 6,
      practicalLabs: 2,
      fitnessSessions: 4,
    },
  };
  assert.deepEqual(resolveWeeklyTargets(undefined), DEFAULT_WEEKLY_TARGETS);

  const tasks: Task[] = [
    makeTask({
      id: 'w1',
      title: 'Completed this week',
      status: 'completed',
      dueDate: '2026-11-24',
      completedAt: '2026-11-24T12:00:00Z',
    }),
    makeTask({
      id: 'w2',
      title: 'Completed today',
      status: 'completed',
      dueDate: '2026-11-27',
      completedAt: '2026-11-27T09:00:00Z',
    }),
    makeTask({
      id: 'w3',
      title: 'Planned this week open',
      status: 'not_started',
      dueDate: '2026-11-28',
    }),
    makeTask({
      id: 'old',
      title: 'Last week done',
      status: 'completed',
      dueDate: '2026-11-18',
      completedAt: '2026-11-18T12:00:00Z',
    }),
  ];

  const learningData: LearningBootstrapData = {
    modules: [],
    lessons: [],
    notes: [],
    resources: [],
    tasks: [
      {
        id: 'lab1',
        moduleId: 'm1',
        lessonId: null,
        userId: 'u1',
        title: 'Firewall Config Lab',
        description: '',
        taskKind: 'lab',
        status: 'completed',
        priority: 'high',
        dueDate: '2026-11-25',
        subtasks: [],
        createdAt: '2026-11-20T00:00:00Z',
        updatedAt: '2026-11-25T16:00:00Z',
        completedAt: '2026-11-25T16:00:00Z',
      },
    ],
    studySessions: [
      {
        id: 'ls1',
        moduleId: 'm1',
        lessonId: null,
        userId: 'u1',
        subject: 'Networks',
        date: '2026-11-25',
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        whatWasLearned: 'Packet tracing',
        createdAt: '2026-11-25T12:00:00Z',
      },
    ],
  };

  const legacyStudySessions: StudySession[] = [
    {
      id: 'ss-legacy',
      userId: 'u1',
      subject: 'Algorithms',
      date: '2026-11-26',
      startTime: '14:00',
      endTime: '15:30',
      durationMinutes: 90,
      whatWasLearned: 'Graphs',
    },
  ];

  const workoutSessions: WorkoutSession[] = [
    {
      id: 'ws1',
      userId: 'u1',
      routineName: 'Upper',
      date: '2026-11-24',
      durationMinutes: 60,
      sets: [],
      createdAt: '2026-11-24T18:00:00Z',
    },
    {
      id: 'ws2',
      userId: 'u1',
      routineName: 'Lower',
      date: '2026-11-26',
      durationMinutes: 65,
      sets: [],
      createdAt: '2026-11-26T18:00:00Z',
    },
  ];

  const weekly = computeWeeklyProgress({
    tasks,
    learningData,
    studySessions: legacyStudySessions,
    workoutSessions,
    preferences: prefs,
    todayStr: today,
  });

  assert.equal(weekly.tasks.completed, 2);
  assert.equal(weekly.tasks.planned, 3);
  assert.equal(weekly.learning.minutesActual, 210);
  assert.equal(weekly.learning.hoursActual, 3.5);
  assert.equal(weekly.learning.hoursTarget, 6);
  assert.equal(weekly.labs.completed, 1);
  assert.equal(weekly.labs.target, 2);
  assert.equal(weekly.fitness.sessions, 2);
  assert.equal(weekly.fitness.activeDays, 2);
  assert.equal(weekly.fitness.consistencyPercentage, 50);
});
