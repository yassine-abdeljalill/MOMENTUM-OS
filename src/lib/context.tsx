import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  HabitCompletion,
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
  AuthUser,
  LearningBootstrapData,
  LearningTask,
} from '../types';
import { ApiError, authApi, isMissingApiEndpointError } from './financeApi';
import { createEmptyLearningBootstrap } from './localAuthFallback';
import { learningApi } from './learningApi';
import {
  mapAppTaskStatusToLearningStatus,
  mapLearningTaskToAppTask,
} from './learning';
import { shouldBypassStartupSplash } from './startupSplash';
import {
  isAuthPath,
  resolveEntryScreenState,
  shouldTriggerOnboardingModal,
  type EntryScreenState,
} from './authGate';
import {
  getThemeSurfaceTokens,
  normalizeThemePreference,
  resolveThemeMode,
  THEME_STORAGE_KEY,
  toggleThemePreference,
} from './theme';
import {
  buildMigrationPayload,
  createClientRecordId,
  createEmptyOutbox,
  enqueueOutboxDelete,
  enqueueOutboxPreferences,
  enqueueOutboxProfile,
  enqueueOutboxUpsert,
  hasOutboxChanges,
  reconcileWorkspaceState,
  SYNC_COLLECTION_KEYS,
  type SyncCollectionKey,
  type WorkspaceSyncBatchRequest,
  type WorkspaceSyncOutbox,
} from './syncEngine';
import {
  clearSyncOutbox,
  computeContentHashKey,
  getDeviceInstallId,
  getLocalCustomizationFlag,
  hasUserMigratedLocal,
  isWorkspaceApiUnavailableError,
  loadSyncOutbox,
  markLocalCustomized,
  markUserMigratedLocal,
  saveSyncOutbox,
  shouldUseLocalOnlyMode,
  workspaceApi,
} from './workspaceApi';
import {
  applyBackupToLocalAppState,
  buildBackupPreview,
  createCompleteBackupFromClientState,
  parseAndVerifyBackupText,
  type BackupPreviewSummary,
  type MomentumCompleteBackupV2,
  type RestoreStrategy,
} from './backupEngine';
import { backupApi, type ServerRestoreResponse } from './backupApi';

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
  | 'finance'
  | 'analytics'
  | 'journal'
  | 'resources'
  | 'settings';

export type WorkspaceSyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface FocusTimerState {
  isActive: boolean;
  isPaused: boolean;
  totalDurationSeconds: number;
  startTimestampMs: number;
  pausedAccumulatedMs: number;
  pausedAtMs?: number;
  linkedTaskId?: string;
  linkedTaskTitle?: string;
  sessionType: 'focus' | 'break';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type AuthModalMode = 'login' | 'signup' | 'forgot' | 'profile';

const VALID_NAV_TABS: ReadonlySet<string> = new Set([
  'overview',
  'today',
  'tasks',
  'calendar',
  'goals',
  'projects',
  'learning',
  'fitness',
  'habits',
  'finance',
  'analytics',
  'journal',
  'resources',
  'settings',
]);

function getInitialRouteState(): {
  view: NavigationTab;
  openAuth: boolean;
  authMode: AuthModalMode;
} {
  if (typeof window === 'undefined') {
    return { view: 'overview', openAuth: false, authMode: 'profile' };
  }
  const rawPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  if (rawPath === '/login' || rawPath === '/signin') {
    return { view: 'overview', openAuth: true, authMode: 'login' };
  }
  if (rawPath === '/signup' || rawPath === '/register') {
    return { view: 'overview', openAuth: true, authMode: 'signup' };
  }
  if (rawPath === '/dashboard') {
    return { view: 'overview', openAuth: false, authMode: 'profile' };
  }
  const segment = rawPath.replace(/^\//, '');
  if (VALID_NAV_TABS.has(segment)) {
    return { view: segment as NavigationTab, openAuth: false, authMode: 'profile' };
  }
  return { view: 'overview', openAuth: false, authMode: 'profile' };
}

function pruneFlushedOutbox(
  current: WorkspaceSyncOutbox,
  flushed: WorkspaceSyncOutbox,
  nextSyncVersion: number
): WorkspaceSyncOutbox {
  const next: WorkspaceSyncOutbox = {
    lastSyncVersion: Math.max(current.lastSyncVersion, nextSyncVersion),
    profile:
      current.profile && flushed.profile && current.profile.updatedAt === flushed.profile.updatedAt
        ? null
        : current.profile,
    preferences:
      current.preferences &&
      flushed.preferences &&
      current.preferences.updatedAt === flushed.preferences.updatedAt
        ? null
        : current.preferences,
    collections: {},
  };

  for (const key of SYNC_COLLECTION_KEYS) {
    const curMap = current.collections[key];
    if (!curMap) continue;
    const flushedMap = flushed.collections[key] || {};
    const remaining: Record<string, any> = {};
    for (const [id, entry] of Object.entries(curMap)) {
      const f = flushedMap[id];
      if (!f || entry.updatedAt !== f.updatedAt) {
        remaining[id] = entry;
      }
    }
    if (Object.keys(remaining).length > 0) {
      next.collections[key] = remaining;
    }
  }

  return next;
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
  authModalMode: AuthModalMode;
  setAuthModalMode: (mode: AuthModalMode) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;

  // Server Authentication Session & Entry Gate
  authUser: AuthUser | null;
  authChecked: boolean;
  splashDismissed: boolean;
  dismissSplash: () => void;
  entryScreen: EntryScreenState;
  setAuthUser: (user: AuthUser | null) => void;
  logoutAuth: () => Promise<void>;

  // Cross-Device Synchronization
  syncStatus: WorkspaceSyncStatus;
  lastSyncedAt: string | null;
  lastSyncConflicts: number;
  syncNow: () => Promise<void>;

  // Action Feedback Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

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

  // Learning Management Center (SQLite-backed)
  learningData: LearningBootstrapData | null;
  learningLoading: boolean;
  learningError: string;
  selectedLearningModuleId: string | null;
  setSelectedLearningModuleId: (id: string | null) => void;
  selectedLearningLessonId: string | null;
  setSelectedLearningLessonId: (id: string | null) => void;
  refreshLearningData: () => Promise<void>;
  updateLearningData: (updater: (prev: LearningBootstrapData) => LearningBootstrapData) => void;

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
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  importStateFromJson: (jsonStr: string) => boolean;
  completeOnboarding: (data: Partial<UserProfile>) => void;

  // Complete Versioned Backup & Restore
  financeRefreshVersion: number;
  exportCompleteBackup: () => Promise<MomentumCompleteBackupV2>;
  previewCompleteBackup: (rawText: string) => Promise<{
    preview: BackupPreviewSummary;
    normalizedBackup: MomentumCompleteBackupV2;
  }>;
  restoreCompleteBackup: (
    backup: MomentumCompleteBackupV2,
    strategy: RestoreStrategy,
    confirmReplace?: boolean
  ) => Promise<ServerRestoreResponse>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const initialRoute = useRef(getInitialRouteState());
  const [state, setState] = useState<AppState>(getInitialState);
  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  const [currentView, setCurrentView] = useState<NavigationTab>(initialRoute.current.view);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>(initialRoute.current.authMode);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Server Authentication Session & Startup Presentation Gate
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null);
  const authUserRef = useRef<AuthUser | null>(authUser);
  authUserRef.current = authUser;

  const [authChecked, setAuthChecked] = useState(false);
  const [splashDismissed, setSplashDismissed] = useState<boolean>(() =>
    typeof window !== 'undefined' ? shouldBypassStartupSplash(window.location.search) : false
  );
  const dismissSplash = useCallback(() => {
    setSplashDismissed(true);
  }, []);
  const entryScreen = resolveEntryScreenState({
    authChecked,
    authUser,
    splashDismissed,
  });
  const profileNameRef = useRef(state.profile.fullName);
  profileNameRef.current = state.profile.fullName;

  // Cross-Device Synchronization State
  const [syncStatus, setSyncStatus] = useState<WorkspaceSyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSyncConflicts, setLastSyncConflicts] = useState(0);
  const [financeRefreshVersion, setFinanceRefreshVersion] = useState(0);
  const outboxRef = useRef<WorkspaceSyncOutbox>(createEmptyOutbox());
  const syncVersionRef = useRef<number>(0);
  const flushTimerRef = useRef<number | null>(null);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const bootstrappedUserIdRef = useRef<string | null>(null);
  const lastDeltaPullMsRef = useRef<number>(0);

  // Action Feedback Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts(prev => [...prev.slice(-2), { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 2600);
    },
    []
  );

  // Learning Management Center State (SQLite-backed per authenticated user)
  const [learningData, setLearningDataState] = useState<LearningBootstrapData | null>(null);
  const [learningLoading, setLearningLoading] = useState(false);
  const [learningError, setLearningError] = useState('');
  const [selectedLearningModuleId, setSelectedLearningModuleId] = useState<string | null>(null);
  const [selectedLearningLessonId, setSelectedLearningLessonId] = useState<string | null>(null);

  const reconcileLearningTasksIntoAppState = useCallback((boot: LearningBootstrapData | null) => {
    setState(prev => {
      const nonLearningTasks = prev.tasks.filter(t => !t.learningModuleId);
      if (!boot) {
        if (nonLearningTasks.length === prev.tasks.length) return prev;
        return { ...prev, tasks: nonLearningTasks };
      }
      const existingById = new Map(prev.tasks.map(t => [t.id, t]));
      const modulesById = new Map(boot.modules.map(m => [m.id, m]));
      const lessonsById = new Map(boot.lessons.map(l => [l.id, l]));
      const mappedLearningTasks = boot.tasks.map(lt =>
        mapLearningTaskToAppTask(lt, modulesById, lessonsById, existingById.get(lt.id))
      );
      return {
        ...prev,
        tasks: [...mappedLearningTasks, ...nonLearningTasks],
      };
    });
  }, []);

  const updateLearningData = useCallback(
    (updater: (prev: LearningBootstrapData) => LearningBootstrapData) => {
      setLearningDataState(prev => {
        const base: LearningBootstrapData = prev || {
          modules: [],
          lessons: [],
          notes: [],
          resources: [],
          tasks: [],
          studySessions: [],
        };
        const next = updater(base);
        reconcileLearningTasksIntoAppState(next);
        return next;
      });
    },
    [reconcileLearningTasksIntoAppState]
  );

  const buildBatchFromOutbox = useCallback((outbox: WorkspaceSyncOutbox): WorkspaceSyncBatchRequest => {
    const collections: Partial<Record<SyncCollectionKey, any[]>> = {};
    for (const key of SYNC_COLLECTION_KEYS) {
      const map = outbox.collections[key];
      if (!map) continue;
      const entries = Object.values(map);
      if (entries.length > 0) {
        collections[key] = entries;
      }
    }
    return {
      ...(outbox.profile ? { profile: outbox.profile } : {}),
      ...(outbox.preferences ? { preferences: outbox.preferences } : {}),
      collections,
    };
  }, []);

  const flushSyncOutbox = useCallback(
    async (options: { keepalive?: boolean } = {}) => {
      const activeUser = authUserRef.current;
      if (!activeUser || shouldUseLocalOnlyMode()) return;
      if (!hasOutboxChanges(outboxRef.current)) return;

      if (syncInFlightRef.current && !options.keepalive) {
        await syncInFlightRef.current;
        if (!hasOutboxChanges(outboxRef.current)) return;
      }

      const flushedSnapshot = outboxRef.current;
      const batch = buildBatchFromOutbox(flushedSnapshot);
      setSyncStatus('syncing');

      const runner = (async () => {
        try {
          const res = await workspaceApi.sync(batch, { keepalive: options.keepalive });
          const nextOutbox = pruneFlushedOutbox(outboxRef.current, flushedSnapshot, res.syncVersion);
          outboxRef.current = nextOutbox;
          saveSyncOutbox(activeUser.id, nextOutbox);
          syncVersionRef.current = Math.max(syncVersionRef.current, res.syncVersion);

          setState(prev =>
            reconcileWorkspaceState({
              currentState: prev,
              bootstrap: res.bootstrap,
              outbox: nextOutbox,
              userId: activeUser.id,
            })
          );

          if (res.conflicts && res.conflicts.length > 0) {
            setLastSyncConflicts(prev => prev + res.conflicts.length);
            showToast('Synced newer updates from another device.', 'info');
          }
          setSyncStatus('synced');
          setLastSyncedAt(res.serverTime);
        } catch (err: any) {
          if (isWorkspaceApiUnavailableError(err)) {
            setSyncStatus('offline');
            return;
          }
          const status = err instanceof ApiError ? err.status : err?.status;
          if (status === 401) {
            setSyncStatus('error');
            return;
          }
          setSyncStatus(
            typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error'
          );
        } finally {
          syncInFlightRef.current = null;
        }
      })();

      syncInFlightRef.current = runner;
      await runner;
    },
    [buildBatchFromOutbox, showToast]
  );

  const scheduleSyncFlush = useCallback(() => {
    if (!authUserRef.current || shouldUseLocalOnlyMode()) return;
    if (flushTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(flushTimerRef.current);
    }
    if (typeof window !== 'undefined') {
      flushTimerRef.current = window.setTimeout(() => {
        flushTimerRef.current = null;
        void flushSyncOutbox();
      }, 450);
    }
  }, [flushSyncOutbox]);

  const queueMutation = useCallback(
    (updater: (prev: WorkspaceSyncOutbox) => WorkspaceSyncOutbox) => {
      const activeUser = authUserRef.current;
      if (!activeUser) {
        markLocalCustomized(true);
        return;
      }
      const next = updater(outboxRef.current);
      outboxRef.current = next;
      saveSyncOutbox(activeUser.id, next);
      scheduleSyncFlush();
    },
    [scheduleSyncFlush]
  );

  const bootstrapAndSyncWorkspace = useCallback(
    async (user: AuthUser) => {
      if (!user || shouldUseLocalOnlyMode()) return;
      if (syncInFlightRef.current) {
        await syncInFlightRef.current;
      }

      const runner = (async () => {
        setSyncStatus('syncing');
        try {
          outboxRef.current = loadSyncOutbox(user.id);
          let boot = await workspaceApi.bootstrap(0);

          if (!hasUserMigratedLocal(user.id)) {
            const importKey = `mig_${getDeviceInstallId()}_${user.id}`;
            const preAuthState = stateRef.current;

            if (user.isWorkspace && !boot.hasWorkspaceData) {
              const seedForGuest =
                preAuthState.tasks.length > 0 || getLocalCustomizationFlag()
                  ? preAuthState
                  : getDefaultState();
              const guestMig = buildMigrationPayload(seedForGuest, {
                forceIncludeAll: true,
              });
              const res = await workspaceApi.migrate({
                importKey,
                source: seedForGuest.isDemoMode ? 'demo_seed' : 'local_migration',
                ...guestMig.payload,
              });
              boot = res.bootstrap;
              markUserMigratedLocal(user.id, importKey);
            } else {
              const mig = buildMigrationPayload(preAuthState, {
                hasLocalCustomizations: getLocalCustomizationFlag(),
                serverHasData: boot.hasWorkspaceData,
              });

              if (mig.shouldMigrate) {
                const res = await workspaceApi.migrate({
                  importKey,
                  source: 'local_migration',
                  ...mig.payload,
                });
                boot = res.bootstrap;
                markUserMigratedLocal(user.id, importKey);
              } else {
                markUserMigratedLocal(user.id, importKey);
                if (!boot.hasWorkspaceData) {
                  const clean = getCleanEmptyState();
                  const now = new Date().toISOString();
                  clean.profile = {
                    ...clean.profile,
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    onboardingCompleted: false,
                    createdAt: user.createdAt || now,
                  };
                  clean.preferences = {
                    ...clean.preferences,
                    theme: preAuthState.preferences.theme,
                  };
                  const initialMig = buildMigrationPayload(clean, {
                    forceIncludeAll: true,
                  });
                  const res = await workspaceApi.migrate({
                    importKey: `init_${getDeviceInstallId()}_${user.id}`,
                    source: 'local_migration',
                    ...initialMig.payload,
                  });
                  boot = res.bootstrap;
                }
              }
            }
            markLocalCustomized(false);
          }

          if (hasOutboxChanges(outboxRef.current)) {
            const flushedSnapshot = outboxRef.current;
            const res = await workspaceApi.sync(buildBatchFromOutbox(flushedSnapshot));
            const nextOutbox = pruneFlushedOutbox(outboxRef.current, flushedSnapshot, res.syncVersion);
            outboxRef.current = nextOutbox;
            saveSyncOutbox(user.id, nextOutbox);
            boot = res.bootstrap;
            if (res.conflicts && res.conflicts.length > 0) {
              setLastSyncConflicts(prev => prev + res.conflicts.length);
              showToast('Synced newer updates from another device.', 'info');
            }
          }

          syncVersionRef.current = boot.syncVersion;
          setState(prev =>
            reconcileWorkspaceState({
              currentState: prev,
              bootstrap: boot,
              outbox: outboxRef.current,
              userId: user.id,
            })
          );
          setSyncStatus('synced');
          setLastSyncedAt(boot.serverTime);
          bootstrappedUserIdRef.current = user.id;
        } catch (err) {
          if (isWorkspaceApiUnavailableError(err)) {
            setSyncStatus('offline');
            return;
          }
          setSyncStatus(
            typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error'
          );
        } finally {
          syncInFlightRef.current = null;
        }
      })();

      syncInFlightRef.current = runner;
      await runner;
    },
    [buildBatchFromOutbox, showToast]
  );

  const pullDeltaFromServer = useCallback(
    async (force = false) => {
      const activeUser = authUserRef.current;
      if (!activeUser || shouldUseLocalOnlyMode()) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setSyncStatus('offline');
        return;
      }

      const nowMs = Date.now();
      if (!force && nowMs - lastDeltaPullMsRef.current < 4000) return;
      lastDeltaPullMsRef.current = nowMs;

      if (hasOutboxChanges(outboxRef.current)) {
        await flushSyncOutbox();
      }
      if (syncInFlightRef.current) {
        await syncInFlightRef.current;
      }

      try {
        const sinceVer = bootstrappedUserIdRef.current === activeUser.id ? syncVersionRef.current : 0;
        const boot = await workspaceApi.bootstrap(sinceVer);
        const hasChanges =
          boot.syncVersion > syncVersionRef.current ||
          boot.mode === 'full' ||
          SYNC_COLLECTION_KEYS.some(k => (boot.collections?.[k]?.length || 0) > 0) ||
          Boolean(boot.profile || boot.preferences);

        if (hasChanges) {
          syncVersionRef.current = Math.max(syncVersionRef.current, boot.syncVersion);
          setState(prev =>
            reconcileWorkspaceState({
              currentState: prev,
              bootstrap: boot,
              outbox: outboxRef.current,
              userId: activeUser.id,
            })
          );
        }
        setSyncStatus('synced');
        setLastSyncedAt(boot.serverTime);
      } catch (err) {
        if (!isWorkspaceApiUnavailableError(err)) {
          setSyncStatus(
            typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error'
          );
        }
      }
    },
    [flushSyncOutbox]
  );

  const syncNow = useCallback(async () => {
    if (!authUserRef.current) return;
    await pullDeltaFromServer(true);
    showToast('Workspace synchronized across devices.', 'success');
  }, [pullDeltaFromServer, showToast]);

  const setAuthUser = useCallback(
    (user: AuthUser | null) => {
      setAuthUserState(user);
      if (user) {
        setIsAuthModalOpen(false);
        setAuthModalMode('profile');
        if (!user.isWorkspace) {
          setState(prev => ({
            ...prev,
            isDemoMode: false,
            profile: {
              ...prev.profile,
              id: user.id,
              email: user.email,
              fullName: user.fullName,
            },
          }));
        }
      } else {
        bootstrappedUserIdRef.current = null;
        syncVersionRef.current = 0;
        outboxRef.current = createEmptyOutbox();
        setSyncStatus('idle');
        setLastSyncedAt(null);
        setLearningDataState(null);
        setSelectedLearningModuleId(null);
        setSelectedLearningLessonId(null);
        reconcileLearningTasksIntoAppState(null);
      }
    },
    [reconcileLearningTasksIntoAppState]
  );

  const logoutAuth = useCallback(async () => {
    await flushSyncOutbox({ keepalive: true }).catch(() => {});
    if (flushTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    bootstrappedUserIdRef.current = null;
    syncVersionRef.current = 0;
    outboxRef.current = createEmptyOutbox();
    markLocalCustomized(false);

    // Clear signed-out in-memory workspace state (preserving user's visual theme) so private
    // notes/journal/data never linger or mix if another account signs in on this browser.
    setState(prev => {
      const clean = getCleanEmptyState();
      return {
        ...clean,
        preferences: {
          ...clean.preferences,
          theme: prev.preferences.theme,
        },
      };
    });

    setAuthUserState(null);
    setSyncStatus('idle');
    setLastSyncedAt(null);
    setIsAuthModalOpen(false);
    setIsOnboardingOpen(false);
    setAuthModalMode('login');
    setLearningDataState(null);
    setSelectedLearningModuleId(null);
    setSelectedLearningLessonId(null);
    reconcileLearningTasksIntoAppState(null);
  }, [flushSyncOutbox, reconcileLearningTasksIntoAppState]);

  const refreshLearningData = useCallback(async () => {
    if (!authUser) {
      setLearningDataState(null);
      reconcileLearningTasksIntoAppState(null);
      return;
    }
    setLearningLoading(true);
    setLearningError('');
    try {
      const boot = await learningApi.bootstrap();
      setLearningDataState(boot);
      reconcileLearningTasksIntoAppState(boot);
    } catch (err: any) {
      if (isMissingApiEndpointError(err)) {
        const emptyBoot = createEmptyLearningBootstrap();
        setLearningDataState(emptyBoot);
        reconcileLearningTasksIntoAppState(emptyBoot);
        return;
      }
      const status = err instanceof ApiError ? err.status : err?.status;
      if (status === 401) {
        authApi.clearToken();
        if (authUser.isWorkspace) {
          try {
            const { user: refreshed } = await authApi.ensureWorkspaceSession(profileNameRef.current);
            setAuthUser(refreshed);
            const bootRetry = await learningApi.bootstrap();
            setLearningDataState(bootRetry);
            reconcileLearningTasksIntoAppState(bootRetry);
            return;
          } catch {
            // Fall through to error message
          }
        } else {
          setAuthUser(null);
          return;
        }
      }
      setLearningError(err?.message || 'Failed to load Learning workspace.');
    } finally {
      setLearningLoading(false);
    }
  }, [authUser, reconcileLearningTasksIntoAppState, setAuthUser]);

  useEffect(() => {
    let cancelled = false;
    const authTimeout = window.setTimeout(() => {
      if (!cancelled) setAuthChecked(true);
    }, 3000);
    authApi
      .me()
      .then(({ user }) => {
        if (cancelled) return;
        if (user) {
          setAuthUser(user);
          if (typeof window !== 'undefined' && isAuthPath(window.location.pathname)) {
            window.history.replaceState(null, '', '/');
          }
        }
      })
      .catch(() => {
        // Unauthenticated or offline
      })
      .finally(() => {
        window.clearTimeout(authTimeout);
        if (!cancelled) setAuthChecked(true);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(authTimeout);
    };
  }, [setAuthUser]);

  useEffect(() => {
    if (authChecked && authUser) {
      refreshLearningData();
      if (bootstrappedUserIdRef.current !== authUser.id) {
        void bootstrapAndSyncWorkspace(authUser);
      }
    } else if (authChecked && !authUser) {
      setLearningDataState(null);
      reconcileLearningTasksIntoAppState(null);
    }
  }, [
    authChecked,
    authUser,
    bootstrapAndSyncWorkspace,
    reconcileLearningTasksIntoAppState,
    refreshLearningData,
  ]);

  // Cross-device sync lifecycle listeners: PWA resume, tab focus, reconnect, and background flush
  useEffect(() => {
    if (!authChecked || !authUser) return;

    const onOnline = () => {
      void pullDeltaFromServer(true);
    };
    const onFocus = () => {
      void pullDeltaFromServer(false);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void pullDeltaFromServer(false);
      } else if (hasOutboxChanges(outboxRef.current)) {
        void flushSyncOutbox({ keepalive: true });
      }
    };
    const onPageHide = () => {
      if (hasOutboxChanges(outboxRef.current)) {
        void flushSyncOutbox({ keepalive: true });
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void pullDeltaFromServer(false);
      }
    }, 25000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [authChecked, authUser?.id, flushSyncOutbox, pullDeltaFromServer]);

  // Focus Timer
  const [focusTimer, setFocusTimer] = useState<FocusTimerState>({
    isActive: false,
    isPaused: false,
    totalDurationSeconds: 25 * 60,
    startTimestampMs: 0,
    pausedAccumulatedMs: 0,
    sessionType: 'focus',
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const themePreference = normalizeThemePreference(state.preferences.theme);
  const resolvedTheme: 'light' | 'dark' = resolveThemeMode(themePreference, systemPrefersDark);
  const themeSwitchTimerRef = useRef<number | null>(null);

  const triggerSmoothThemeTransition = useCallback(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    root.classList.add('theme-switching');
    if (themeSwitchTimerRef.current !== null) {
      window.clearTimeout(themeSwitchTimerRef.current);
    }
    themeSwitchTimerRef.current = window.setTimeout(() => {
      root.classList.remove('theme-switching');
      themeSwitchTimerRef.current = null;
    }, 360);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const tokens = getThemeSurfaceTokens(resolvedTheme);
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = tokens.colorScheme;
    root.style.backgroundColor = tokens.canvasBg;
    if (document.body) {
      document.body.style.backgroundColor = tokens.canvasBg;
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', tokens.metaThemeColor);
    }
    const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatus) {
      appleStatus.setAttribute('content', tokens.appleStatusBarStyle);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    } catch {
      // Ignore storage quota restrictions
    }
  }, [resolvedTheme, themePreference]);

  // Persist state changes locally for instant PWA boot & offline fallback
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Global Keyboard shortcuts (only active inside entered workspace)
  useEffect(() => {
    if (entryScreen !== 'app') return;
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [entryScreen]);

  // Check onboarding only after entering authenticated workspace
  useEffect(() => {
    if (
      shouldTriggerOnboardingModal({
        entryScreen,
        hasProfile: Boolean(state.profile),
        onboardingCompleted: Boolean(state.profile?.onboardingCompleted),
      })
    ) {
      setIsOnboardingOpen(true);
    }
  }, [entryScreen, state.profile]);

  // Timer Actions
  const startFocusTimer = useCallback(
    (durationMinutes: number, linkedTask?: { id: string; title: string }, sessionType: 'focus' | 'break' = 'focus') => {
      setFocusTimer({
        isActive: true,
        isPaused: false,
        totalDurationSeconds: durationMinutes * 60,
        startTimestampMs: Date.now(),
        pausedAccumulatedMs: 0,
        pausedAtMs: undefined,
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
        pausedAtMs: Date.now(),
      };
    });
  }, []);

  const resumeFocusTimer = useCallback(() => {
    setFocusTimer(prev => {
      if (!prev.isActive || !prev.isPaused) return prev;
      const pauseDelta = prev.pausedAtMs ? Math.max(0, Date.now() - prev.pausedAtMs) : 0;
      return {
        ...prev,
        isPaused: false,
        pausedAccumulatedMs: prev.pausedAccumulatedMs + pauseDelta,
        pausedAtMs: undefined,
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
      pausedAtMs: undefined,
      sessionType: 'focus',
    });
  }, []);

  const completeFocusSession = useCallback(() => {
    if (!focusTimer.isActive) return;
    const now = new Date().toISOString();
    const minutes = Math.max(1, Math.round(focusTimer.totalDurationSeconds / 60));
    const userId = authUserRef.current?.id || stateRef.current.profile.id;
    const newSession: FocusSession & { updatedAt: string } = {
      id: createClientRecordId('fs'),
      userId,
      taskId: focusTimer.linkedTaskId,
      subject: focusTimer.linkedTaskTitle || (focusTimer.sessionType === 'focus' ? 'Deep Focus Session' : 'Rest Break'),
      startTime: new Date(focusTimer.startTimestampMs).toISOString(),
      endTime: now,
      durationMinutes: minutes,
      completed: true,
      sessionType: focusTimer.sessionType,
      updatedAt: now,
    };

    const linkedTask = focusTimer.linkedTaskId
      ? stateRef.current.tasks.find(t => t.id === focusTimer.linkedTaskId) || null
      : null;
    const baseTaskUpdatedAt = (linkedTask as (Task & { updatedAt?: string }) | null)?.updatedAt;
    const updatedTask: (Task & { updatedAt: string }) | null = linkedTask
      ? {
          ...linkedTask,
          actualDurationMinutes: (linkedTask.actualDurationMinutes || 0) + minutes,
          updatedAt: now,
        }
      : null;

    setState(prev => ({
      ...prev,
      focusSessions: [newSession, ...prev.focusSessions],
      tasks: updatedTask
        ? prev.tasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
        : prev.tasks,
    }));

    queueMutation(outbox => {
      let next = enqueueOutboxUpsert(outbox, 'focusSessions', newSession);
      if (updatedTask && !updatedTask.learningModuleId) {
        next = enqueueOutboxUpsert(next, 'tasks', updatedTask, baseTaskUpdatedAt);
      }
      return next;
    });

    showToast(`Logged ${minutes}m ${focusTimer.sessionType === 'focus' ? 'focus session' : 'break'}.`, 'success');
    resetFocusTimer();
  }, [focusTimer, queueMutation, resetFocusTimer, showToast]);

  // Tasks Actions
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'userId' | 'createdAt'>): Task => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newTask: Task & { updatedAt: string } = {
        ...taskData,
        id: createClientRecordId('task'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
      if (!newTask.learningModuleId) {
        queueMutation(outbox => enqueueOutboxUpsert(outbox, 'tasks', newTask));
      }
      showToast('Task added.');
      return newTask;
    },
    [queueMutation, showToast]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      const target = stateRef.current.tasks.find(t => t.id === id);
      if (!target) return;
      const now = new Date().toISOString();

      if (target.learningModuleId) {
        const learningTaskPatch: Parameters<typeof learningApi.updateTask>[1] = {
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.description !== undefined ? { description: updates.description || '' } : {}),
          ...(updates.status !== undefined
            ? { status: mapAppTaskStatusToLearningStatus(updates.status) }
            : {}),
          ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
          ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate || '' } : {}),
          ...(updates.subtasks !== undefined ? { subtasks: updates.subtasks } : {}),
        };
        const updatedLocalTask: Task = { ...target, ...updates };

        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === id ? updatedLocalTask : t)),
        }));

        setLearningDataState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map(lt =>
              lt.id === id
                ? {
                    ...lt,
                    ...(learningTaskPatch.title !== undefined ? { title: learningTaskPatch.title } : {}),
                    ...(learningTaskPatch.description !== undefined
                      ? { description: learningTaskPatch.description }
                      : {}),
                    ...(learningTaskPatch.status !== undefined ? { status: learningTaskPatch.status } : {}),
                    ...(learningTaskPatch.priority !== undefined ? { priority: learningTaskPatch.priority } : {}),
                    ...(learningTaskPatch.dueDate !== undefined ? { dueDate: learningTaskPatch.dueDate } : {}),
                    ...(learningTaskPatch.subtasks !== undefined ? { subtasks: learningTaskPatch.subtasks } : {}),
                  }
                : lt
            ),
          };
        });
        learningApi.updateTask(id, learningTaskPatch).catch(err => {
          console.error('Failed to sync learning task update:', err);
        });
        return;
      }

      const baseUpdatedAt = (target as Task & { updatedAt?: string }).updatedAt;
      const updatedStandardTask: Task & { updatedAt: string } = {
        ...target,
        ...updates,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === id ? updatedStandardTask : t)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'tasks', updatedStandardTask, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.tasks.find(t => t.id === id);
      const isLearningTask = Boolean(target?.learningModuleId);
      const baseUpdatedAt = (target as (Task & { updatedAt?: string }) | undefined)?.updatedAt;
      const linkedSchedule = stateRef.current.dailySchedule.filter(a => a.taskId === id);

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== id),
        dailySchedule: prev.dailySchedule.filter(a => a.taskId !== id),
      }));

      if (isLearningTask) {
        setLearningDataState(prev =>
          prev ? { ...prev, tasks: prev.tasks.filter(lt => lt.id !== id) } : prev
        );
        learningApi.deleteTask(id).catch(err => {
          console.error('Failed to sync learning task deletion:', err);
        });
      } else {
        queueMutation(outbox => {
          let next = enqueueOutboxDelete(outbox, 'tasks', id, now, baseUpdatedAt);
          for (const act of linkedSchedule) {
            next = enqueueOutboxDelete(
              next,
              'dailySchedule',
              act.id,
              now,
              (act as DailyScheduleActivity & { updatedAt?: string }).updatedAt
            );
          }
          return next;
        });
      }
      showToast('Task removed.', 'info');
    },
    [queueMutation, showToast]
  );

  const toggleTaskCompleted = useCallback(
    (id: string) => {
      const target = stateRef.current.tasks.find(t => t.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const isNowCompleted = target.status !== 'completed';

      if (target.learningModuleId) {
        const nextLearningStatus: LearningTask['status'] = isNowCompleted ? 'completed' : 'todo';
        const updatedTask: Task = {
          ...target,
          status: isNowCompleted ? 'completed' : 'in_progress',
          completedAt: isNowCompleted ? now : undefined,
        };
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === id ? updatedTask : t)),
        }));
        setLearningDataState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map(lt =>
              lt.id === id
                ? {
                    ...lt,
                    status: nextLearningStatus,
                    completedAt: nextLearningStatus === 'completed' ? now : undefined,
                  }
                : lt
            ),
          };
        });
        learningApi.updateTask(id, { status: nextLearningStatus }).catch(err => {
          console.error('Failed to sync learning task completion:', err);
        });
        return;
      }

      const baseUpdatedAt = (target as Task & { updatedAt?: string }).updatedAt;
      const updatedStandardTask: Task & { updatedAt: string } = {
        ...target,
        status: isNowCompleted ? 'completed' : 'in_progress',
        completedAt: isNowCompleted ? now : undefined,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === id ? updatedStandardTask : t)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'tasks', updatedStandardTask, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  const toggleSubtaskCompleted = useCallback(
    (taskId: string, subtaskId: string) => {
      const target = stateRef.current.tasks.find(t => t.id === taskId);
      if (!target) return;
      const now = new Date().toISOString();
      const updatedSubtasks = target.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );

      if (target.learningModuleId) {
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t)),
        }));
        setLearningDataState(prev =>
          prev
            ? {
                ...prev,
                tasks: prev.tasks.map(lt =>
                  lt.id === taskId ? { ...lt, subtasks: updatedSubtasks } : lt
                ),
              }
            : prev
        );
        learningApi.updateTask(taskId, { subtasks: updatedSubtasks }).catch(err => {
          console.error('Failed to sync learning subtask update:', err);
        });
        return;
      }

      const baseUpdatedAt = (target as Task & { updatedAt?: string }).updatedAt;
      const updatedStandardTask: Task & { updatedAt: string } = {
        ...target,
        subtasks: updatedSubtasks,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === taskId ? updatedStandardTask : t)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'tasks', updatedStandardTask, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  const setDailyPriorityRank = useCallback(
    (taskId: string, rank: number | undefined) => {
      const now = new Date().toISOString();
      const updatesById = new Map<string, Task & { updatedAt: string }>();
      const changedTasks: Array<{ record: Task & { updatedAt: string }; baseUpdatedAt?: string }> = [];

      for (const t of stateRef.current.tasks) {
        if (t.id === taskId) {
          const baseUpdatedAt = (t as Task & { updatedAt?: string }).updatedAt;
          const nextTask: Task & { updatedAt: string } = {
            ...t,
            isDailyPriority: rank !== undefined,
            priorityRank: rank,
            updatedAt: now,
          };
          updatesById.set(t.id, nextTask);
          if (!t.learningModuleId) {
            changedTasks.push({ record: nextTask, baseUpdatedAt });
          }
        } else if (rank !== undefined && t.priorityRank === rank) {
          const baseUpdatedAt = (t as Task & { updatedAt?: string }).updatedAt;
          const nextTask: Task & { updatedAt: string } = {
            ...t,
            isDailyPriority: false,
            priorityRank: undefined,
            updatedAt: now,
          };
          updatesById.set(t.id, nextTask);
          if (!t.learningModuleId) {
            changedTasks.push({ record: nextTask, baseUpdatedAt });
          }
        }
      }

      if (updatesById.size === 0) return;

      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => updatesById.get(t.id) || t),
      }));

      if (changedTasks.length > 0) {
        queueMutation(outbox => {
          let next = outbox;
          for (const item of changedTasks) {
            next = enqueueOutboxUpsert(next, 'tasks', item.record, item.baseUpdatedAt);
          }
          return next;
        });
      }
    },
    [queueMutation]
  );

  // Goals Actions
  const addGoal = useCallback(
    (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt'>): Goal => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newGoal: Goal & { updatedAt: string } = {
        ...goalData,
        id: createClientRecordId('goal'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        goals: [newGoal, ...prev.goals],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'goals', newGoal));
      return newGoal;
    },
    [queueMutation]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      const target = stateRef.current.goals.find(g => g.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as Goal & { updatedAt?: string }).updatedAt;
      const updatedGoal: Goal & { updatedAt: string } = { ...target, ...updates, updatedAt: now };
      setState(prev => ({
        ...prev,
        goals: prev.goals.map(g => (g.id === id ? updatedGoal : g)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'goals', updatedGoal, baseUpdatedAt));
    },
    [queueMutation]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.goals.find(g => g.id === id);
      const baseUpdatedAt = (target as (Goal & { updatedAt?: string }) | undefined)?.updatedAt;
      const linkedPlans = stateRef.current.ninetyDayPlans.filter(p => p.goalId === id);

      setState(prev => ({
        ...prev,
        goals: prev.goals.filter(g => g.id !== id),
        ninetyDayPlans: prev.ninetyDayPlans.filter(p => p.goalId !== id),
      }));

      queueMutation(outbox => {
        let next = enqueueOutboxDelete(outbox, 'goals', id, now, baseUpdatedAt);
        for (const plan of linkedPlans) {
          next = enqueueOutboxDelete(
            next,
            'ninetyDayPlans',
            plan.id,
            now,
            (plan as NinetyDayPlan & { updatedAt?: string }).updatedAt
          );
        }
        return next;
      });
    },
    [queueMutation]
  );

  const toggleGoalMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      const target = stateRef.current.goals.find(g => g.id === goalId);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as Goal & { updatedAt?: string }).updatedAt;
      const updatedGoal: Goal & { updatedAt: string } = {
        ...target,
        milestones: target.milestones.map(m =>
          m.id === milestoneId
            ? {
                ...m,
                completed: !m.completed,
                completedAt: !m.completed ? now : undefined,
              }
            : m
        ),
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        goals: prev.goals.map(g => (g.id === goalId ? updatedGoal : g)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'goals', updatedGoal, baseUpdatedAt));
    },
    [queueMutation]
  );

  // 90-Day Plans
  const addNinetyDayPlan = useCallback(
    (planData: Omit<NinetyDayPlan, 'id' | 'userId'>): NinetyDayPlan => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newPlan: NinetyDayPlan & { updatedAt: string } = {
        ...planData,
        id: createClientRecordId('ndp'),
        userId,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        ninetyDayPlans: [newPlan, ...prev.ninetyDayPlans],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'ninetyDayPlans', newPlan));
      return newPlan;
    },
    [queueMutation]
  );

  const updateNinetyDayPlan = useCallback(
    (id: string, updates: Partial<NinetyDayPlan>) => {
      const target = stateRef.current.ninetyDayPlans.find(p => p.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as NinetyDayPlan & { updatedAt?: string }).updatedAt;
      const updatedPlan: NinetyDayPlan & { updatedAt: string } = {
        ...target,
        ...updates,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        ninetyDayPlans: prev.ninetyDayPlans.map(p => (p.id === id ? updatedPlan : p)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'ninetyDayPlans', updatedPlan, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  const togglePlanCheckpoint = useCallback(
    (planId: string, weekNumber: number) => {
      const target = stateRef.current.ninetyDayPlans.find(p => p.id === planId);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as NinetyDayPlan & { updatedAt?: string }).updatedAt;
      const updatedPlan: NinetyDayPlan & { updatedAt: string } = {
        ...target,
        weeklyCheckpoints: target.weeklyCheckpoints.map(cp =>
          cp.weekNumber === weekNumber ? { ...cp, completed: !cp.completed } : cp
        ),
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        ninetyDayPlans: prev.ninetyDayPlans.map(p => (p.id === planId ? updatedPlan : p)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'ninetyDayPlans', updatedPlan, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  // Projects Actions
  const addProject = useCallback(
    (projData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Project => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newProj: Project = {
        ...projData,
        id: createClientRecordId('proj'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        projects: [newProj, ...prev.projects],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'projects', newProj));
      return newProj;
    },
    [queueMutation]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      const target = stateRef.current.projects.find(p => p.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = target.updatedAt;
      const updatedProj: Project = { ...target, ...updates, updatedAt: now };
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => (p.id === id ? updatedProj : p)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'projects', updatedProj, baseUpdatedAt));
    },
    [queueMutation]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.projects.find(p => p.id === id);
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id),
      }));
      queueMutation(outbox => enqueueOutboxDelete(outbox, 'projects', id, now, target?.updatedAt));
    },
    [queueMutation]
  );

  const toggleProjectMilestone = useCallback(
    (projectId: string, milestoneId: string) => {
      const target = stateRef.current.projects.find(p => p.id === projectId);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = target.updatedAt;
      const updatedProj: Project = {
        ...target,
        milestones: target.milestones.map(m =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        ),
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => (p.id === projectId ? updatedProj : p)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'projects', updatedProj, baseUpdatedAt));
    },
    [queueMutation]
  );

  // Habits Actions
  const addHabit = useCallback(
    (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt'>): Habit => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newHabit: Habit & { updatedAt: string } = {
        ...habitData,
        id: createClientRecordId('habit'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        habits: [newHabit, ...prev.habits],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'habits', newHabit));
      return newHabit;
    },
    [queueMutation]
  );

  const updateHabit = useCallback(
    (id: string, updates: Partial<Habit>) => {
      const target = stateRef.current.habits.find(h => h.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as Habit & { updatedAt?: string }).updatedAt;
      const updatedHabit: Habit & { updatedAt: string } = { ...target, ...updates, updatedAt: now };
      setState(prev => ({
        ...prev,
        habits: prev.habits.map(h => (h.id === id ? updatedHabit : h)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'habits', updatedHabit, baseUpdatedAt));
    },
    [queueMutation]
  );

  const deleteHabit = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.habits.find(h => h.id === id);
      const baseUpdatedAt = (target as (Habit & { updatedAt?: string }) | undefined)?.updatedAt;
      const linkedCompletions = stateRef.current.habitCompletions.filter(hc => hc.habitId === id);

      setState(prev => ({
        ...prev,
        habits: prev.habits.filter(h => h.id !== id),
        habitCompletions: prev.habitCompletions.filter(hc => hc.habitId !== id),
      }));

      queueMutation(outbox => {
        let next = enqueueOutboxDelete(outbox, 'habits', id, now, baseUpdatedAt);
        for (const comp of linkedCompletions) {
          next = enqueueOutboxDelete(
            next,
            'habitCompletions',
            comp.id,
            now,
            (comp as HabitCompletion & { updatedAt?: string }).updatedAt
          );
        }
        return next;
      });
    },
    [queueMutation]
  );

  const toggleHabitCompletion = useCallback(
    (habitId: string, dateStr: string) => {
      const now = new Date().toISOString();
      const current = stateRef.current.habitCompletions.find(
        c => c.habitId === habitId && c.date === dateStr
      );

      if (current) {
        const baseUpdatedAt = (current as HabitCompletion & { updatedAt?: string }).updatedAt;
        const updatedCompletion: HabitCompletion & { updatedAt: string } = {
          ...current,
          completed: !current.completed,
          count: !current.completed ? 1 : 0,
          skipped: false,
          updatedAt: now,
        };
        setState(prev => ({
          ...prev,
          habitCompletions: prev.habitCompletions.map(c =>
            c.id === current.id ? updatedCompletion : c
          ),
        }));
        queueMutation(outbox =>
          enqueueOutboxUpsert(outbox, 'habitCompletions', updatedCompletion, baseUpdatedAt)
        );
      } else {
        const userId = authUserRef.current?.id || stateRef.current.profile.id;
        const createdCompletion: HabitCompletion & { updatedAt: string } = {
          id: createClientRecordId('hc'),
          habitId,
          userId,
          date: dateStr,
          completed: true,
          count: 1,
          updatedAt: now,
        };
        setState(prev => ({
          ...prev,
          habitCompletions: [createdCompletion, ...prev.habitCompletions],
        }));
        queueMutation(outbox =>
          enqueueOutboxUpsert(outbox, 'habitCompletions', createdCompletion)
        );
      }
    },
    [queueMutation]
  );

  const skipHabitCompletion = useCallback(
    (habitId: string, dateStr: string, reason: string) => {
      const now = new Date().toISOString();
      const current = stateRef.current.habitCompletions.find(
        c => c.habitId === habitId && c.date === dateStr
      );

      if (current) {
        const baseUpdatedAt = (current as HabitCompletion & { updatedAt?: string }).updatedAt;
        const updatedCompletion: HabitCompletion & { updatedAt: string } = {
          ...current,
          completed: false,
          skipped: true,
          skipReason: reason,
          updatedAt: now,
        };
        setState(prev => ({
          ...prev,
          habitCompletions: prev.habitCompletions.map(c =>
            c.id === current.id ? updatedCompletion : c
          ),
        }));
        queueMutation(outbox =>
          enqueueOutboxUpsert(outbox, 'habitCompletions', updatedCompletion, baseUpdatedAt)
        );
      } else {
        const userId = authUserRef.current?.id || stateRef.current.profile.id;
        const createdCompletion: HabitCompletion & { updatedAt: string } = {
          id: createClientRecordId('hc'),
          habitId,
          userId,
          date: dateStr,
          completed: false,
          skipped: true,
          skipReason: reason,
          count: 0,
          updatedAt: now,
        };
        setState(prev => ({
          ...prev,
          habitCompletions: [createdCompletion, ...prev.habitCompletions],
        }));
        queueMutation(outbox =>
          enqueueOutboxUpsert(outbox, 'habitCompletions', createdCompletion)
        );
      }
    },
    [queueMutation]
  );

  // Learning Actions
  const addCourse = useCallback(
    (courseData: Omit<Course, 'id' | 'userId' | 'createdAt'>): Course => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newCourse: Course & { updatedAt: string } = {
        ...courseData,
        id: createClientRecordId('course'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        courses: [newCourse, ...prev.courses],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'courses', newCourse));
      return newCourse;
    },
    [queueMutation]
  );

  const updateCourse = useCallback(
    (id: string, updates: Partial<Course>) => {
      const target = stateRef.current.courses.find(c => c.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as Course & { updatedAt?: string }).updatedAt;
      const updatedCourse: Course & { updatedAt: string } = { ...target, ...updates, updatedAt: now };
      setState(prev => ({
        ...prev,
        courses: prev.courses.map(c => (c.id === id ? updatedCourse : c)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'courses', updatedCourse, baseUpdatedAt));
    },
    [queueMutation]
  );

  const deleteCourse = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.courses.find(c => c.id === id);
      setState(prev => ({
        ...prev,
        courses: prev.courses.filter(c => c.id !== id),
      }));
      queueMutation(outbox =>
        enqueueOutboxDelete(
          outbox,
          'courses',
          id,
          now,
          (target as (Course & { updatedAt?: string }) | undefined)?.updatedAt
        )
      );
    },
    [queueMutation]
  );

  const toggleLessonCompleted = useCallback(
    (courseId: string, lessonId: string) => {
      const target = stateRef.current.courses.find(c => c.id === courseId);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as Course & { updatedAt?: string }).updatedAt;
      const updatedCourse: Course & { updatedAt: string } = {
        ...target,
        lessons: target.lessons.map(l =>
          l.id === lessonId ? { ...l, completed: !l.completed } : l
        ),
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        courses: prev.courses.map(c => (c.id === courseId ? updatedCourse : c)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'courses', updatedCourse, baseUpdatedAt));
    },
    [queueMutation]
  );

  const addStudySession = useCallback(
    (sessionData: Omit<StudySession, 'id' | 'userId'>) => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newSession: StudySession & { updatedAt: string } = {
        ...sessionData,
        id: createClientRecordId('ss'),
        userId,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        studySessions: [newSession, ...prev.studySessions],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'studySessions', newSession));
    },
    [queueMutation]
  );

  // Fitness Actions
  const addWorkoutRoutine = useCallback(
    (routineData: Omit<WorkoutRoutine, 'id' | 'userId'>): WorkoutRoutine => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newRoutine: WorkoutRoutine & { updatedAt: string } = {
        ...routineData,
        id: createClientRecordId('wr'),
        userId,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        workoutRoutines: [newRoutine, ...prev.workoutRoutines],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'workoutRoutines', newRoutine));
      return newRoutine;
    },
    [queueMutation]
  );

  const logWorkoutSession = useCallback(
    (sessionData: Omit<WorkoutSession, 'id' | 'userId' | 'createdAt'>) => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newSession: WorkoutSession & { updatedAt: string } = {
        ...sessionData,
        id: createClientRecordId('ws'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        workoutSessions: [newSession, ...prev.workoutSessions],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'workoutSessions', newSession));
    },
    [queueMutation]
  );

  const deleteWorkoutSession = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.workoutSessions.find(w => w.id === id);
      setState(prev => ({
        ...prev,
        workoutSessions: prev.workoutSessions.filter(w => w.id !== id),
      }));
      queueMutation(outbox =>
        enqueueOutboxDelete(
          outbox,
          'workoutSessions',
          id,
          now,
          (target as (WorkoutSession & { updatedAt?: string }) | undefined)?.updatedAt
        )
      );
    },
    [queueMutation]
  );

  // Daily Schedule Actions
  const addScheduleActivity = useCallback(
    (actData: Omit<DailyScheduleActivity, 'id' | 'userId'>) => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newAct: DailyScheduleActivity & { updatedAt: string } = {
        ...actData,
        id: createClientRecordId('act'),
        userId,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        dailySchedule: [...prev.dailySchedule, newAct],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'dailySchedule', newAct));
    },
    [queueMutation]
  );

  const updateScheduleActivity = useCallback(
    (id: string, updates: Partial<DailyScheduleActivity>) => {
      const target = stateRef.current.dailySchedule.find(a => a.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as DailyScheduleActivity & { updatedAt?: string }).updatedAt;
      const updatedAct: DailyScheduleActivity & { updatedAt: string } = {
        ...target,
        ...updates,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        dailySchedule: prev.dailySchedule.map(a => (a.id === id ? updatedAct : a)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'dailySchedule', updatedAct, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  const deleteScheduleActivity = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.dailySchedule.find(a => a.id === id);
      setState(prev => ({
        ...prev,
        dailySchedule: prev.dailySchedule.filter(a => a.id !== id),
      }));
      queueMutation(outbox =>
        enqueueOutboxDelete(
          outbox,
          'dailySchedule',
          id,
          now,
          (target as (DailyScheduleActivity & { updatedAt?: string }) | undefined)?.updatedAt
        )
      );
    },
    [queueMutation]
  );

  const toggleScheduleActivityCompleted = useCallback(
    (id: string) => {
      const target = stateRef.current.dailySchedule.find(a => a.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as DailyScheduleActivity & { updatedAt?: string }).updatedAt;
      const updatedAct: DailyScheduleActivity & { updatedAt: string } = {
        ...target,
        completed: !target.completed,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        dailySchedule: prev.dailySchedule.map(a => (a.id === id ? updatedAct : a)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'dailySchedule', updatedAct, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  // Journal Actions
  const addJournalEntry = useCallback(
    (entryData: Omit<JournalEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): JournalEntry => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newEntry: JournalEntry = {
        ...entryData,
        id: createClientRecordId('je'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        journalEntries: [newEntry, ...prev.journalEntries],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'journalEntries', newEntry));
      return newEntry;
    },
    [queueMutation]
  );

  const updateJournalEntry = useCallback(
    (id: string, updates: Partial<JournalEntry>) => {
      const target = stateRef.current.journalEntries.find(e => e.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = target.updatedAt;
      const updatedEntry: JournalEntry = { ...target, ...updates, updatedAt: now };
      setState(prev => ({
        ...prev,
        journalEntries: prev.journalEntries.map(e => (e.id === id ? updatedEntry : e)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'journalEntries', updatedEntry, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  const deleteJournalEntry = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.journalEntries.find(e => e.id === id);
      setState(prev => ({
        ...prev,
        journalEntries: prev.journalEntries.filter(e => e.id !== id),
      }));
      queueMutation(outbox =>
        enqueueOutboxDelete(outbox, 'journalEntries', id, now, target?.updatedAt)
      );
    },
    [queueMutation]
  );

  // Resources Actions
  const addResource = useCallback(
    (resData: Omit<ResourceItem, 'id' | 'userId' | 'createdAt'>): ResourceItem => {
      const now = new Date().toISOString();
      const userId = authUserRef.current?.id || stateRef.current.profile.id;
      const newRes: ResourceItem & { updatedAt: string } = {
        ...resData,
        id: createClientRecordId('res'),
        userId,
        createdAt: now,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        resources: [newRes, ...prev.resources],
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'resources', newRes));
      return newRes;
    },
    [queueMutation]
  );

  const updateResource = useCallback(
    (id: string, updates: Partial<ResourceItem>) => {
      const target = stateRef.current.resources.find(r => r.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as ResourceItem & { updatedAt?: string }).updatedAt;
      const updatedRes: ResourceItem & { updatedAt: string } = { ...target, ...updates, updatedAt: now };
      setState(prev => ({
        ...prev,
        resources: prev.resources.map(r => (r.id === id ? updatedRes : r)),
      }));
      queueMutation(outbox => enqueueOutboxUpsert(outbox, 'resources', updatedRes, baseUpdatedAt));
    },
    [queueMutation]
  );

  const deleteResource = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const target = stateRef.current.resources.find(r => r.id === id);
      setState(prev => ({
        ...prev,
        resources: prev.resources.filter(r => r.id !== id),
      }));
      queueMutation(outbox =>
        enqueueOutboxDelete(
          outbox,
          'resources',
          id,
          now,
          (target as (ResourceItem & { updatedAt?: string }) | undefined)?.updatedAt
        )
      );
    },
    [queueMutation]
  );

  // Notifications Actions
  const markNotificationRead = useCallback(
    (id: string) => {
      const target = stateRef.current.notifications.find(n => n.id === id);
      if (!target) return;
      const now = new Date().toISOString();
      const baseUpdatedAt = (target as any).updatedAt;
      const updatedNotif = { ...target, read: true, updatedAt: now };
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => (n.id === id ? updatedNotif : n)),
      }));
      queueMutation(outbox =>
        enqueueOutboxUpsert(outbox, 'notifications', updatedNotif, baseUpdatedAt)
      );
    },
    [queueMutation]
  );

  const markAllNotificationsRead = useCallback(() => {
    const now = new Date().toISOString();
    const updatedNotifs = stateRef.current.notifications.map(n => ({
      ...n,
      read: true,
      updatedAt: now,
    }));
    const byId = new Map(updatedNotifs.map(n => [n.id, n]));
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => byId.get(n.id) || n),
    }));
    if (updatedNotifs.length > 0) {
      queueMutation(outbox => {
        let next = outbox;
        for (const n of updatedNotifs) {
          next = enqueueOutboxUpsert(next, 'notifications', n);
        }
        return next;
      });
    }
  }, [queueMutation]);

  // Profile & System
  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      const now = new Date().toISOString();
      const currentProfile = stateRef.current.profile;
      const baseUpdatedAt = (currentProfile as UserProfile & { updatedAt?: string }).updatedAt;
      const nextProfile: UserProfile & { updatedAt?: string } = {
        ...currentProfile,
        ...updates,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        profile: { ...prev.profile, ...updates },
      }));
      queueMutation(outbox => enqueueOutboxProfile(outbox, nextProfile, now, baseUpdatedAt));
    },
    [queueMutation]
  );

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      const now = new Date().toISOString();
      if (updates.theme) {
        triggerSmoothThemeTransition();
      }
      const currentPrefs = stateRef.current.preferences;
      const baseUpdatedAt = (currentPrefs as UserPreferences & { updatedAt?: string }).updatedAt;
      const nextPrefs: UserPreferences & { updatedAt?: string } = {
        ...currentPrefs,
        ...updates,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...updates },
      }));
      queueMutation(outbox => enqueueOutboxPreferences(outbox, nextPrefs, now, baseUpdatedAt));
    },
    [queueMutation, triggerSmoothThemeTransition]
  );

  const toggleTheme = useCallback(() => {
    const now = new Date().toISOString();
    triggerSmoothThemeTransition();
    const currentPrefs = stateRef.current.preferences;
    const baseUpdatedAt = (currentPrefs as UserPreferences & { updatedAt?: string }).updatedAt;
    const currentPref = normalizeThemePreference(currentPrefs.theme);
    const currentResolved = resolveThemeMode(currentPref, systemPrefersDark);
    const nextTheme = toggleThemePreference(currentPref, currentResolved);
    const nextPrefs: UserPreferences & { updatedAt?: string } = {
      ...currentPrefs,
      theme: nextTheme,
      updatedAt: now,
    };
    setState(prev => ({
      ...prev,
      preferences: { ...prev.preferences, theme: nextTheme },
    }));
    queueMutation(outbox => enqueueOutboxPreferences(outbox, nextPrefs, now, baseUpdatedAt));
  }, [queueMutation, systemPrefersDark, triggerSmoothThemeTransition]);

  const resetToDemoData = useCallback(() => {
    const seed = getDefaultState();
    const activeUser = authUserRef.current;
    if (activeUser) {
      const scopedSeed: AppState = {
        ...seed,
        isDemoMode: true,
        profile: {
          ...seed.profile,
          id: activeUser.id,
          email: activeUser.isWorkspace ? seed.profile.email : activeUser.email,
          fullName: activeUser.isWorkspace ? seed.profile.fullName : activeUser.fullName,
        },
      };
      setState(scopedSeed);
      saveStateToStorage(scopedSeed);
      if (!shouldUseLocalOnlyMode()) {
        const mig = buildMigrationPayload(scopedSeed, { forceIncludeAll: true });
        void workspaceApi
          .sync(mig.payload)
          .then(res => {
            syncVersionRef.current = Math.max(syncVersionRef.current, res.syncVersion);
            setSyncStatus('synced');
            setLastSyncedAt(res.serverTime);
          })
          .catch(() => {});
      }
    } else {
      setState(seed);
      saveStateToStorage(seed);
    }
  }, []);

  const clearAllData = useCallback(() => {
    const activeUser = authUserRef.current;
    const blank = getCleanEmptyState();
    if (activeUser) {
      blank.profile = {
        ...blank.profile,
        id: activeUser.id,
        email: activeUser.email,
        fullName: activeUser.fullName,
        onboardingCompleted: true,
      };
      clearSyncOutbox(activeUser.id);
      outboxRef.current = createEmptyOutbox();
      if (!shouldUseLocalOnlyMode()) {
        void workspaceApi
          .clear()
          .then(res => {
            syncVersionRef.current = Math.max(syncVersionRef.current, res.syncVersion);
            setSyncStatus('synced');
            setLastSyncedAt(res.serverTime);
          })
          .catch(() => {});
      }
    }
    setState(blank);
    saveStateToStorage(blank);
  }, []);

  const importStateFromJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.profile && parsed.tasks) {
        const activeUser = authUserRef.current;
        if (activeUser) {
          const scoped: AppState = {
            ...parsed,
            isDemoMode: false,
            profile: {
              ...parsed.profile,
              id: activeUser.id,
            },
          };
          setState(scoped);
          saveStateToStorage(scoped);
          if (!shouldUseLocalOnlyMode()) {
            const mig = buildMigrationPayload(scoped, { forceIncludeAll: true });
            const importKey = `json_${computeContentHashKey(jsonStr)}`;
            void workspaceApi
              .migrate({
                importKey,
                source: 'json_import',
                ...mig.payload,
              })
              .then(res => {
                syncVersionRef.current = Math.max(syncVersionRef.current, res.syncVersion);
                setState(prev =>
                  reconcileWorkspaceState({
                    currentState: prev,
                    bootstrap: res.bootstrap,
                    outbox: outboxRef.current,
                    userId: activeUser.id,
                  })
                );
                setSyncStatus('synced');
                setLastSyncedAt(res.serverTime);
              })
              .catch(() => {});
          }
        } else {
          markLocalCustomized(true);
          setState(parsed);
          saveStateToStorage(parsed);
        }
        return true;
      }
    } catch (e) {
      console.error('Import parse error:', e);
    }
    return false;
  }, []);

  const completeOnboarding = useCallback(
    (data: Partial<UserProfile>) => {
      const now = new Date().toISOString();
      const currentProfile = stateRef.current.profile;
      const baseUpdatedAt = (currentProfile as UserProfile & { updatedAt?: string }).updatedAt;
      const nextProfile: UserProfile & { updatedAt?: string } = {
        ...currentProfile,
        ...data,
        onboardingCompleted: true,
        updatedAt: now,
      };
      setState(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...data,
          onboardingCompleted: true,
        },
      }));
      queueMutation(outbox => enqueueOutboxProfile(outbox, nextProfile, now, baseUpdatedAt));
      setIsOnboardingOpen(false);
    },
    [queueMutation]
  );

  const exportCompleteBackup = useCallback(async (): Promise<MomentumCompleteBackupV2> => {
    const activeUser = authUserRef.current;
    if (activeUser && !shouldUseLocalOnlyMode()) {
      await flushSyncOutbox().catch(() => {});
      try {
        return await backupApi.exportComplete();
      } catch (err) {
        if (!isMissingApiEndpointError(err)) {
          throw err;
        }
      }
    }
    return createCompleteBackupFromClientState({
      appState: stateRef.current,
      learning: learningData,
      finance: null,
    });
  }, [flushSyncOutbox, learningData]);

  const previewCompleteBackup = useCallback(async (rawText: string) => {
    const verified = await parseAndVerifyBackupText(rawText);
    return {
      preview: verified.preview,
      normalizedBackup: verified.backup,
    };
  }, []);

  const restoreCompleteBackup = useCallback(
    async (
      backup: MomentumCompleteBackupV2,
      strategy: RestoreStrategy,
      confirmReplace = false
    ): Promise<ServerRestoreResponse> => {
      if (flushTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }

      const activeUser = authUserRef.current;
      if (activeUser && !shouldUseLocalOnlyMode()) {
        const res = await backupApi.restore({
          backup,
          strategy,
          confirmReplace,
        });
        outboxRef.current = createEmptyOutbox();
        clearSyncOutbox(activeUser.id);
        markLocalCustomized(false);

        const boot = await workspaceApi.bootstrap(0);
        syncVersionRef.current = boot.syncVersion;
        setState(prev =>
          reconcileWorkspaceState({
            currentState: prev,
            bootstrap: boot,
            outbox: outboxRef.current,
            userId: activeUser.id,
          })
        );
        setSyncStatus('synced');
        setLastSyncedAt(boot.serverTime);
        setIsOnboardingOpen(false);
        await refreshLearningData();
        setFinanceRefreshVersion(v => v + 1);
        return res;
      }

      // Local-only / Guest mode restore
      const nextState = applyBackupToLocalAppState({
        currentState: stateRef.current,
        backup,
        strategy,
        userId: stateRef.current.profile.id,
      });
      markLocalCustomized(true);
      setState(nextState);
      saveStateToStorage(nextState);
      const preview = buildBackupPreview(backup);
      return {
        restored: true,
        strategy,
        preview,
        summary: {
          workspaceApplied:
            preview.counts.tasks +
            preview.counts.goals +
            preview.counts.projects +
            preview.counts.habits +
            preview.counts.calendarActivities +
            preview.counts.journalEntries +
            preview.counts.focusSessions +
            preview.counts.workoutSessions,
          workspaceSkipped: 0,
          learningApplied: 0,
          learningSkipped: 0,
          filesRestored: 0,
          financeApplied: 0,
          financeSkipped: 0,
          warnings: preview.warnings,
        },
        syncVersion: syncVersionRef.current,
      };
    },
    [refreshLearningData]
  );

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
        authModalMode,
        setAuthModalMode,
        isOnboardingOpen,
        setIsOnboardingOpen,

        authUser,
        authChecked,
        splashDismissed,
        dismissSplash,
        entryScreen,
        setAuthUser,
        logoutAuth,

        syncStatus,
        lastSyncedAt,
        lastSyncConflicts,
        syncNow,

        toasts,
        showToast,
        dismissToast,

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

        learningData,
        learningLoading,
        learningError,
        selectedLearningModuleId,
        setSelectedLearningModuleId,
        selectedLearningLessonId,
        setSelectedLearningLessonId,
        refreshLearningData,
        updateLearningData,

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

        resolvedTheme,
        toggleTheme,
        updateProfile,
        updatePreferences,
        resetToDemoData,
        clearAllData,
        importStateFromJson,
        completeOnboarding,
        financeRefreshVersion,
        exportCompleteBackup,
        previewCompleteBackup,
        restoreCompleteBackup,
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
