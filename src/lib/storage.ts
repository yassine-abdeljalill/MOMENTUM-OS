import {
  UserProfile,
  UserPreferences,
  Task,
  Goal,
  Project,
  NinetyDayPlan,
  Course,
  Habit,
  HabitCompletion,
  WorkoutRoutine,
  WorkoutSession,
  FocusSession,
  DailyScheduleActivity,
  JournalEntry,
  ResourceItem,
  AppNotification,
  StudySession,
} from '../types';

import {
  initialProfile,
  initialPreferences,
  initialGoals,
  initialProjects,
  initialTasks,
  initialHabits,
  generateRecentHabitCompletions,
  initialNinetyDayPlans,
  initialCourses,
  initialStudySessions,
  initialWorkoutRoutines,
  initialWorkoutSessions,
  initialFocusSessions,
  initialDailySchedule,
  initialJournalEntries,
  initialResources,
  initialNotifications,
} from './seedData';

export interface AppState {
  profile: UserProfile;
  preferences: UserPreferences;
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  ninetyDayPlans: NinetyDayPlan[];
  courses: Course[];
  studySessions: StudySession[];
  workoutRoutines: WorkoutRoutine[];
  workoutSessions: WorkoutSession[];
  focusSessions: FocusSession[];
  dailySchedule: DailyScheduleActivity[];
  journalEntries: JournalEntry[];
  resources: ResourceItem[];
  notifications: AppNotification[];
  isDemoMode: boolean;
}

const STORAGE_KEY = 'momentum_life_os_state_v1';

export function getInitialState(): AppState {
  if (typeof window === 'undefined') {
    return getDefaultState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.profile && parsed.tasks) {
        if (parsed.preferences?.accentColor === '#8EC5FF') {
          parsed.preferences = {
            ...parsed.preferences,
            theme: 'light',
            accentColor: '#D2925B',
          };
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored MOMENTUM state, falling back to seed data', err);
  }

  return getDefaultState();
}

export function getDefaultState(): AppState {
  return {
    profile: initialProfile,
    preferences: initialPreferences,
    goals: initialGoals,
    projects: initialProjects,
    tasks: initialTasks,
    habits: initialHabits,
    habitCompletions: generateRecentHabitCompletions(),
    ninetyDayPlans: initialNinetyDayPlans,
    courses: initialCourses,
    studySessions: initialStudySessions,
    workoutRoutines: initialWorkoutRoutines,
    workoutSessions: initialWorkoutSessions,
    focusSessions: initialFocusSessions,
    dailySchedule: initialDailySchedule,
    journalEntries: initialJournalEntries,
    resources: initialResources,
    notifications: initialNotifications,
    isDemoMode: true,
  };
}

export function getCleanEmptyState(): AppState {
  return {
    profile: {
      ...initialProfile,
      fullName: 'New User',
      email: 'user@momentum.app',
      onboardingCompleted: false,
    },
    preferences: initialPreferences,
    goals: [],
    projects: [],
    tasks: [],
    habits: [],
    habitCompletions: [],
    ninetyDayPlans: [],
    courses: [],
    studySessions: [],
    workoutRoutines: initialWorkoutRoutines,
    workoutSessions: [],
    focusSessions: [],
    dailySchedule: [],
    journalEntries: [],
    resources: [],
    notifications: [
      {
        id: 'notif-welcome',
        userId: 'usr_clean',
        title: 'Welcome to MOMENTUM',
        message: 'Your personal Life Operating System is ready. Define your vision and establish your first daily priorities.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ],
    isDemoMode: false,
  };
}

export function saveStateToStorage(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save MOMENTUM state to localStorage', err);
  }
}

export function exportStateToJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function exportTasksToCsv(tasks: Task[]): string {
  const headers = ['ID', 'Title', 'Status', 'Priority', 'Category', 'Due Date', 'Estimated Min', 'Actual Min', 'Tags'];
  const rows = tasks.map(t => [
    `"${t.id}"`,
    `"${t.title.replace(/"/g, '""')}"`,
    `"${t.status}"`,
    `"${t.priority}"`,
    `"${t.category}"`,
    `"${t.dueDate || ''}"`,
    `"${t.estimatedDurationMinutes || 0}"`,
    `"${t.actualDurationMinutes || 0}"`,
    `"${t.tags.join(', ')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportGoalsToCsv(goals: Goal[]): string {
  const headers = ['ID', 'Title', 'Category', 'Status', 'Priority', 'Target Date', 'Milestones Completed', 'Total Milestones'];
  const rows = goals.map(g => [
    `"${g.id}"`,
    `"${g.title.replace(/"/g, '""')}"`,
    `"${g.category}"`,
    `"${g.status}"`,
    `"${g.priority}"`,
    `"${g.targetDate}"`,
    `"${g.milestones.filter(m => m.completed).length}"`,
    `"${g.milestones.length}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
