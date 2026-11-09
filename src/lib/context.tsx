import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  AppState,
  getInitialState,
  saveStateToStorage,
  getDefaultState,
  getCleanEmptyState,
} from './storage';
import {
  Task,
  Goal,
  Project,
  Habit,
  Course,
  StudySession,
  WorkoutRoutine,
  WorkoutSession,
  DailyScheduleActivity,
  JournalEntry,
  ResourceItem,
  FocusSession,
  UserProfile,
  UserPreferences,
  NinetyDayPlan,
} from '../types';

export type NavigationTab =
  | 'overview'
  | 'today'
  | 'tasks'
  | 'calendar'
  | 'goals'
  | 'projects'
  | 'learning'
  | 'fitness'
  | 'habits'
  | 'analytics'
  | 'journal'
  | 'resources'
  | 'settings';

interface FocusTimerState {
  isActive: boolean;
  isPaused: boolean;
  totalDurationSeconds: number;
  startTimestampMs: number;
  pausedAccumulatedMs: number;
  linkedTaskId?: string;
  linkedTaskTitle?: string;
  sessionType: 'focus' | 'break';
}

interface AppContextType {
  state: AppState;
  currentView: NavigationTab;
  setCurrentView: (view: NavigationTab) => void;
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedCourseId: string | null;
  setSelectedCourseId: (id: string | null) => void;

  // Modals & Panels
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isFocusTimerOpen: boolean;
  setIsFocusTimerOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;

  // Global Focus Timer
  focusTimer: FocusTimerState;
  startFocusTimer: (durationMinutes: number, linkedTask?: { id: string; title: string }, sessionType?: 'focus' | 'break') => void;
  pauseFocusTimer: () => void;
  resumeFocusTimer: () => void;
  resetFocusTimer: () => void;
  completeFocusSession: () => void;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompleted: (id: string) => void;
  toggleSubtaskCompleted: (taskId: string, subtaskId: string) => void;
  setDailyPriorityRank: (taskId: string, rank: number | undefined) => void;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleGoalMilestone: (goalId: string, milestoneId: string) => void;

  // 90-Day Plans
  addNinetyDayPlan: (plan: Omit<NinetyDayPlan, 'id' | 'userId'>) => NinetyDayPlan;
  updateNinetyDayPlan: (id: string, updates: Partial<NinetyDayPlan>) => void;
  togglePlanCheckpoint: (planId: string, weekNumber: number) => void;

  // Projects
  addProject: (project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitCompletion: (habitId: string, dateStr: string) => void;
  skipHabitCompletion: (habitId: string, dateStr: string, reason: string) => void;

  // Learning
  addCourse: (course: Omit<Course, 'id' | 'userId' | 'createdAt'>) => Course;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  toggleLessonCompleted: (courseId: string, lessonId: string) => void;
  addStudySession: (session: Omit<StudySession, 'id' | 'userId'>) => void;

  // Fitness
  addWorkoutRoutine: (routine: Omit<WorkoutRoutine, 'id' | 'userId'>) => WorkoutRoutine;
  logWorkoutSession: (session: Omit<WorkoutSession, 'id' | 'userId' | 'createdAt'>) => void;
  deleteWorkoutSession: (id: string) => void;

  // Schedule & Day Planning
  addScheduleActivity: (activity: Omit<DailyScheduleActivity, 'id' | 'userId'>) => void;
  updateScheduleActivity: (id: string, updates: Partial<DailyScheduleActivity>) => void;
  deleteScheduleActivity: (id: string) => void;
  toggleScheduleActivityCompleted: (id: string) => void;

  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => JournalEntry;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // Resources
  addResource: (res: Omit<ResourceItem, 'id' | 'userId' | 'createdAt'>) => ResourceItem;
  updateResource: (id: string, updates: Partial<ResourceItem>) => void;
  deleteResource: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Profile & System
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  importStateFromJson: (jsonStr: string) => boolean;
  completeOnboarding: (data: Partial<UserProfile>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(getInitialState);
  const [currentView, setCurrentView] = useState<NavigationTab>('overview');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Focus Timer
  const [focusTimer, setFocusTimer] = useState<FocusTimerState>({
    isActive: false,
    isPaused: false,
    totalDurationSeconds: 25 * 60,
    startTimestampMs: 0,
    pausedAccumulatedMs: 0,
    sessionType: 'focus',
  });

  // Persist state changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsQuickAddOpen(false);
        setIsFocusTimerOpen(false);
        setIsNotificationsOpen(false);
        setIsAuthModalOpen(false);
        setIsOnboardingOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check onboarding on mount
  useEffect(() => {
    if (state.profile && !state.profile.onboardingCompleted) {
      setIsOnboardingOpen(true);
    }
  }, [state.profile]);

  // Timer Actions
  const startFocusTimer = useCallback(
    (durationMinutes: number, linkedTask?: { id: string; title: string }, sessionType: 'focus' | 'break' = 'focus') => {
      setFocusTimer({
        isActive: true,
        isPaused: false,
        totalDurationSeconds: durationMinutes * 60,
        startTimestampMs: Date.now(),
        pausedAccumulatedMs: 0,
        linkedTaskId: linkedTask?.id,
        linkedTaskTitle: linkedTask?.title,
        sessionType,
      });
    },
    []
  );

  const pauseFocusTimer = useCallback(() => {
    setFocusTimer(prev => {
      if (!prev.isActive || prev.isPaused) return prev;
      return {
        ...prev,
        isPaused: true,
      };
    });
  }, []);

  const resumeFocusTimer = useCallback(() => {
    setFocusTimer(prev => {
      if (!prev.isActive || !prev.isPaused) return prev;
      return {
        ...prev,
        isPaused: false,
      };
    });
  }, []);

  const resetFocusTimer = useCallback(() => {
    setFocusTimer({
      isActive: false,
      isPaused: false,
      totalDurationSeconds: 25 * 60,
      startTimestampMs: 0,
      pausedAccumulatedMs: 0,
      sessionType: 'focus',
    });
  }, []);

  const completeFocusSession = useCallback(() => {
    if (!focusTimer.isActive) return;
    const minutes = Math.max(1, Math.round(focusTimer.totalDurationSeconds / 60));
    const newSession: FocusSession = {
      id: `fs-${Date.now()}`,
      userId: state.profile.id,
      taskId: focusTimer.linkedTaskId,
      subject: focusTimer.linkedTaskTitle || (focusTimer.sessionType === 'focus' ? 'Deep Focus Session' : 'Rest Break'),
      startTime: new Date(focusTimer.startTimestampMs).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: minutes,
      completed: true,
      sessionType: focusTimer.sessionType,
    };

    setState(prev => ({
      ...prev,
      focusSessions: [newSession, ...prev.focusSessions],
      tasks: focusTimer.linkedTaskId
        ? prev.tasks.map(t =>
            t.id === focusTimer.linkedTaskId
              ? { ...t, actualDurationMinutes: (t.actualDurationMinutes || 0) + minutes }
              : t
          )
        : prev.tasks,
    }));

    resetFocusTimer();
  }, [focusTimer, state.profile.id, resetFocusTimer]);

  // Tasks Actions
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>): Task => {
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}`,
        userId: state.profile.id,
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
      return newTask;
    },
    [state.profile.id]
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      dailySchedule: prev.dailySchedule.filter(a => a.taskId !== id),
    }));
  }, []);

  const toggleTaskCompleted = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== id) return t;
        const isNowCompleted = t.status !== 'completed';
        return {
          ...t,
          status: isNowCompleted ? 'completed' : 'in_progress',
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
        };
      }),
    }));
  }, []);

  const toggleSubtaskCompleted = useCallback((taskId: string, subtaskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      }),
    }));
  }, []);

  const setDailyPriorityRank = useCallback((taskId: string, rank: number | undefined) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            isDailyPriority: rank !== undefined,
            priorityRank: rank,
          };
        }
        // If assigning a rank that already exists, swap or clear
        if (rank !== undefined && t.priorityRank === rank) {
          return {
            ...t,
            isDailyPriority: false,
            priorityRank: undefined,
          };
        }
        return t;
      }),
    }));
  }, []);

  // Goals Actions
  const addGoal = useCallback(
    (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt'>): Goal => {
      const newGoal: Goal = {
        ...goalData,
        id: `goal-${Date.now()}`,
        userId: state.profile.id,
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        goals: [newGoal, ...prev.goals],
      }));
      return newGoal;
    },
    [state.profile.id]
  );

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
      ninetyDayPlans: prev.ninetyDayPlans.filter(p => p.goalId !== id),
    }));
  }, []);

  const toggleGoalMilestone = useCallback((goalId: string, milestoneId: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          milestones: g.milestones.map(m =>
            m.id === milestoneId
              ? {
                  ...m,
                  completed: !m.completed,
                  completedAt: !m.completed ? new Date().toISOString() : undefined,
                }
              : m
          ),
        };
      }),
    }));
  }, []);

  // 90-Day Plans
  const addNinetyDayPlan = useCallback(
    (planData: Omit<NinetyDayPlan, 'id' | 'userId'>): NinetyDayPlan => {
      const newPlan: NinetyDayPlan = {
        ...planData,
        id: `ndp-${Date.now()}`,
        userId: state.profile.id,
      };
      setState(prev => ({
        ...prev,
        ninetyDayPlans: [newPlan, ...prev.ninetyDayPlans],
      }));
      return newPlan;
    },
    [state.profile.id]
  );

  const updateNinetyDayPlan = useCallback((id: string, updates: Partial<NinetyDayPlan>) => {
    setState(prev => ({
      ...prev,
      ninetyDayPlans: prev.ninetyDayPlans.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const togglePlanCheckpoint = useCallback((planId: string, weekNumber: number) => {
    setState(prev => ({
      ...prev,
      ninetyDayPlans: prev.ninetyDayPlans.map(p => {
        if (p.id !== planId) return p;
        return {
          ...p,
          weeklyCheckpoints: p.weeklyCheckpoints.map(cp =>
            cp.weekNumber === weekNumber ? { ...cp, completed: !cp.completed } : cp
          ),
        };
      }),
    }));
  }, []);

  // Projects Actions
  const addProject = useCallback(
    (projData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Project => {
      const now = new Date().toISOString();
      const newProj: Project = {
        ...projData,
        id: `proj-${Date.now()}`,
        userId: state.profile.id,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        projects: [newProj, ...prev.projects],
      }));
      return newProj;
    },
    [state.profile.id]
  );

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
    }));
  }, []);

  const toggleProjectMilestone = useCallback((projectId: string, milestoneId: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  // Habits Actions
  const addHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'>): Habit => {
      const newHabit: Habit = {
        ...habitData,
        id: `habit-${Date.now()}`,
        userId: state.profile.id,
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        habits: [newHabit, ...prev.habits],
      }));
      return newHabit;
    },
    [state.profile.id]
  );

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => (h.id === id ? { ...h, ...updates } : h)),
    }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      habitCompletions: prev.habitCompletions.filter(hc => hc.habitId !== id),
    }));
  }, []);

  const toggleHabitCompletion = useCallback(
    (habitId: string, dateStr: string) => {
      setState(prev => {
        const existingIdx = prev.habitCompletions.findIndex(
          c => c.habitId === habitId && c.date === dateStr
        );

        if (existingIdx >= 0) {
          const current = prev.habitCompletions[existingIdx];
          const updated = [...prev.habitCompletions];
          if (current.completed) {
            // Remove or uncomplete
            updated[existingIdx] = { ...current, completed: false, count: 0, skipped: false };
          } else {
            updated[existingIdx] = { ...current, completed: true, count: 1, skipped: false };
          }
          return { ...prev, habitCompletions: updated };
        } else {
          const newCompletion = {
            id: `hc-${Date.now()}`,
            habitId,
            userId: prev.profile.id,
            date: dateStr,
            completed: true,
            count: 1,
          };
          return { ...prev, habitCompletions: [newCompletion, ...prev.habitCompletions] };
        }
      });
    },
    []
  );

  const skipHabitCompletion = useCallback(
    (habitId: string, dateStr: string, reason: string) => {
      setState(prev => {
        const existingIdx = prev.habitCompletions.findIndex(
          c => c.habitId === habitId && c.date === dateStr
        );
        if (existingIdx >= 0) {
          const updated = [...prev.habitCompletions];
          updated[existingIdx] = {
            ...updated[existingIdx],
            completed: false,
            skipped: true,
            skipReason: reason,
          };
          return { ...prev, habitCompletions: updated };
        } else {
          return {
            ...prev,
            habitCompletions: [
              {
                id: `hc-${Date.now()}`,
                habitId,
                userId: prev.profile.id,
                date: dateStr,
                completed: false,
                skipped: true,
                skipReason: reason,
                count: 0,
              },
              ...prev.habitCompletions,
            ],
          };
        }
      });
    },
    []
  );

  // Learning Actions
  const addCourse = useCallback(
    (courseData: Omit<Course, 'id' | 'userId' | 'createdAt'>): Course => {
      const newCourse: Course = {
        ...courseData,
        id: `course-${Date.now()}`,
        userId: state.profile.id,
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        courses: [newCourse, ...prev.courses],
      }));
      return newCourse;
    },
    [state.profile.id]
  );

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== id),
    }));
  }, []);

  const toggleLessonCompleted = useCallback((courseId: string, lessonId: string) => {
    setState(prev => ({
      ...prev,
      courses: prev.courses.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          lessons: c.lessons.map(l =>
            l.id === lessonId ? { ...l, completed: !l.completed } : l
          ),
        };
      }),
    }));
  }, []);

  const addStudySession = useCallback(
    (sessionData: Omit<StudySession, 'id' | 'userId'>) => {
      const newSession: StudySession = {
        ...sessionData,
        id: `ss-${Date.now()}`,
        userId: state.profile.id,
      };
      setState(prev => ({
        ...prev,
        studySessions: [newSession, ...prev.studySessions],
      }));
    },
    [state.profile.id]
  );

  // Fitness Actions
  const addWorkoutRoutine = useCallback(
    (routineData: Omit<WorkoutRoutine, 'id' | 'userId'>): WorkoutRoutine => {
      const newRoutine: WorkoutRoutine = {
        ...routineData,
        id: `wr-${Date.now()}`,
        userId: state.profile.id,
      };
      setState(prev => ({
        ...prev,
        workoutRoutines: [newRoutine, ...prev.workoutRoutines],
      }));
      return newRoutine;
    },
    [state.profile.id]
  );

  const logWorkoutSession = useCallback(
    (sessionData: Omit<WorkoutSession, 'id' | 'userId' | 'createdAt'>) => {
      const newSession: WorkoutSession = {
        ...sessionData,
        id: `ws-${Date.now()}`,
        userId: state.profile.id,
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        workoutSessions: [newSession, ...prev.workoutSessions],
      }));
    },
    [state.profile.id]
  );

  const deleteWorkoutSession = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      workoutSessions: prev.workoutSessions.filter(w => w.id !== id),
    }));
  }, []);

  // Daily Schedule Actions
  const addScheduleActivity = useCallback(
    (actData: Omit<DailyScheduleActivity, 'id' | 'userId'>) => {
      const newAct: DailyScheduleActivity = {
        ...actData,
        id: `act-${Date.now()}`,
        userId: state.profile.id,
      };
      setState(prev => ({
        ...prev,
        dailySchedule: [...prev.dailySchedule, newAct],
      }));
    },
    [state.profile.id]
  );

  const updateScheduleActivity = useCallback((id: string, updates: Partial<DailyScheduleActivity>) => {
    setState(prev => ({
      ...prev,
      dailySchedule: prev.dailySchedule.map(a => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, []);

  const deleteScheduleActivity = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      dailySchedule: prev.dailySchedule.filter(a => a.id !== id),
    }));
  }, []);

  const toggleScheduleActivityCompleted = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      dailySchedule: prev.dailySchedule.map(a =>
        a.id === id ? { ...a, completed: !a.completed } : a
      ),
    }));
  }, []);

  // Journal Actions
  const addJournalEntry = useCallback(
    (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): JournalEntry => {
      const now = new Date().toISOString();
      const newEntry: JournalEntry = {
        ...entryData,
        id: `je-${Date.now()}`,
        userId: state.profile.id,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        journalEntries: [newEntry, ...prev.journalEntries],
      }));
      return newEntry;
    },
    [state.profile.id]
  );

  const updateJournalEntry = useCallback((id: string, updates: Partial<JournalEntry>) => {
    setState(prev => ({
      ...prev,
      journalEntries: prev.journalEntries.map(e =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      ),
    }));
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      journalEntries: prev.journalEntries.filter(e => e.id !== id),
    }));
  }, []);

  // Resources Actions
  const addResource = useCallback(
    (resData: Omit<ResourceItem, 'id' | 'userId' | 'createdAt'>): ResourceItem => {
      const newRes: ResourceItem = {
        ...resData,
        id: `res-${Date.now()}`,
        userId: state.profile.id,
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({
        ...prev,
        resources: [newRes, ...prev.resources],
      }));
      return newRes;
    },
    [state.profile.id]
  );

  const updateResource = useCallback((id: string, updates: Partial<ResourceItem>) => {
    setState(prev => ({
      ...prev,
      resources: prev.resources.map(r => (r.id === id ? { ...r, ...updates } : r)),
    }));
  }, []);

  const deleteResource = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      resources: prev.resources.filter(r => r.id !== id),
    }));
  }, []);

  // Notifications Actions
  const markNotificationRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }));
  }, []);

  // Profile & System
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  }, []);

  const resetToDemoData = useCallback(() => {
    const seed = getDefaultState();
    setState(seed);
    saveStateToStorage(seed);
  }, []);

  const clearAllData = useCallback(() => {
    const blank = getCleanEmptyState();
    setState(blank);
    saveStateToStorage(blank);
  }, []);

  const importStateFromJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.profile && parsed.tasks) {
        setState(parsed);
        saveStateToStorage(parsed);
        return true;
      }
    } catch (e) {
      console.error('Import parse error:', e);
    }
    return false;
  }, []);

  const completeOnboarding = useCallback((data: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...data,
        onboardingCompleted: true,
      },
    }));
    setIsOnboardingOpen(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        currentView,
        setCurrentView,
        selectedGoalId,
        setSelectedGoalId,
        selectedProjectId,
        setSelectedProjectId,
        selectedCourseId,
        setSelectedCourseId,

        isQuickAddOpen,
        setIsQuickAddOpen,
        isSearchOpen,
        setIsSearchOpen,
        isFocusTimerOpen,
        setIsFocusTimerOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,

        focusTimer,
        startFocusTimer,
        pauseFocusTimer,
        resumeFocusTimer,
        resetFocusTimer,
        completeFocusSession,

        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompleted,
        toggleSubtaskCompleted,
        setDailyPriorityRank,

        addGoal,
        updateGoal,
        deleteGoal,
        toggleGoalMilestone,

        addNinetyDayPlan,
        updateNinetyDayPlan,
        togglePlanCheckpoint,

        addProject,
        updateProject,
        deleteProject,
        toggleProjectMilestone,

        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitCompletion,
        skipHabitCompletion,

        addCourse,
        updateCourse,
        deleteCourse,
        toggleLessonCompleted,
        addStudySession,

        addWorkoutRoutine,
        logWorkoutSession,
        deleteWorkoutSession,

        addScheduleActivity,
        updateScheduleActivity,
        deleteScheduleActivity,
        toggleScheduleActivityCompleted,

        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,

        addResource,
        updateResource,
        deleteResource,

        markNotificationRead,
        markAllNotificationsRead,

        updateProfile,
        updatePreferences,
        resetToDemoData,
        clearAllData,
        importStateFromJson,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
