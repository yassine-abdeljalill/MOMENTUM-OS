import type {
  Course,
  FocusSession,
  Habit,
  HabitCompletion,
  LearningBootstrapData,
  LearningLesson,
  LearningModule,
  LearningTaskKind,
  Priority,
  Project,
  StudySession,
  Task,
  UserPreferences,
  UserProfile,
  WeeklyTargets,
  WorkoutSession,
} from '../types';
import { calculateDailyScore } from './logic';
import { computeModuleStats, LEARNING_TASK_KIND_LABELS } from './learning';

export const DEFAULT_WEEKLY_TARGETS: WeeklyTargets = {
  tasksCompleted: 15,
  learningHours: 8,
  practicalLabs: 3,
  fitnessSessions: 4,
};

export function resolveWeeklyTargets(preferences?: Partial<UserPreferences> | null): WeeklyTargets {
  const raw = preferences?.weeklyTargets;
  const toPositiveInt = (val: unknown, fallback: number, max: number) => {
    const num = typeof val === 'number' && Number.isFinite(val) ? Math.round(val) : fallback;
    return Math.min(max, Math.max(1, num));
  };
  return {
    tasksCompleted: toPositiveInt(raw?.tasksCompleted, DEFAULT_WEEKLY_TARGETS.tasksCompleted, 100),
    learningHours: toPositiveInt(raw?.learningHours, DEFAULT_WEEKLY_TARGETS.learningHours, 80),
    practicalLabs: toPositiveInt(raw?.practicalLabs, DEFAULT_WEEKLY_TARGETS.practicalLabs, 50),
    fitnessSessions: toPositiveInt(raw?.fitnessSessions, DEFAULT_WEEKLY_TARGETS.fitnessSessions, 14),
  };
}

function parseUtcDate(dateStr: string): Date {
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  return new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1));
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  const from = parseUtcDate(fromDateStr);
  const to = parseUtcDate(toDateStr);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function getWeekBounds(
  referenceDateStr: string,
  startOfWeek: 'monday' | 'sunday' = 'monday'
): { startDateStr: string; endDateStr: string } {
  const ref = parseUtcDate(referenceDateStr);
  const day = ref.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const diffToStart = startOfWeek === 'monday' ? (day === 0 ? 6 : day - 1) : day;
  const start = new Date(ref);
  start.setUTCDate(ref.getUTCDate() - diffToStart);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    startDateStr: formatUtcDate(start),
    endDateStr: formatUtcDate(end),
  };
}

export type UrgencyTone = 'overdue' | 'today' | 'soon' | 'scheduled';

export interface DueUrgencyInfo {
  label: string;
  tone: UrgencyTone;
  isOverdue: boolean;
  daysDelta: number;
}

export function getTaskDueUrgency(
  dueDateStr: string | undefined,
  todayStr: string,
  completed = false
): DueUrgencyInfo | null {
  if (!dueDateStr) return null;
  const cleanDue = dueDateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDue)) return null;

  const delta = getDaysDifference(todayStr, cleanDue);
  if (delta < 0) {
    const overdueDays = Math.abs(delta);
    if (completed) {
      return {
        label: `Due ${cleanDue}`,
        tone: 'scheduled',
        isOverdue: false,
        daysDelta: delta,
      };
    }
    return {
      label: overdueDays === 1 ? 'Overdue · 1d' : `Overdue · ${overdueDays}d`,
      tone: 'overdue',
      isOverdue: true,
      daysDelta: delta,
    };
  }
  if (delta === 0) {
    return {
      label: 'Due today',
      tone: 'today',
      isOverdue: false,
      daysDelta: 0,
    };
  }
  if (delta === 1) {
    return {
      label: 'Tomorrow',
      tone: 'soon',
      isOverdue: false,
      daysDelta: 1,
    };
  }
  if (delta <= 3) {
    return {
      label: `In ${delta}d`,
      tone: 'soon',
      isOverdue: false,
      daysDelta: delta,
    };
  }
  return {
    label: `In ${delta}d`,
    tone: 'scheduled',
    isOverdue: false,
    daysDelta: delta,
  };
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export interface PriorityQueueItem {
  task: Task;
  displayRank: number;
  isPinned: boolean;
  isOverdue: boolean;
  urgency: DueUrgencyInfo | null;
}

export interface TodaysPrioritiesResult {
  items: PriorityQueueItem[];
  pinnedCount: number;
  usingSuggestedFallback: boolean;
  totalEstimatedMinutes: number;
  completedCount: number;
  overdueCount: number;
}

export function selectTodaysPriorities(
  tasks: Task[],
  todayStr: string
): TodaysPrioritiesResult {
  const pinned = tasks
    .filter(t => t.isDailyPriority && t.status !== 'cancelled')
    .sort((a, b) => (a.priorityRank || 99) - (b.priorityRank || 99))
    .slice(0, 3);

  const selectedTasks =
    pinned.length > 0
      ? pinned
      : [...tasks]
          .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
          .sort((a, b) => {
            const aOverdue = a.dueDate && a.dueDate.slice(0, 10) < todayStr ? 1 : 0;
            const bOverdue = b.dueDate && b.dueDate.slice(0, 10) < todayStr ? 1 : 0;
            if (aOverdue !== bOverdue) return bOverdue - aOverdue;

            const aToday = a.dueDate?.slice(0, 10) === todayStr ? 1 : 0;
            const bToday = b.dueDate?.slice(0, 10) === todayStr ? 1 : 0;
            if (aToday !== bToday) return bToday - aToday;

            const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
            if (pDiff !== 0) return pDiff;

            if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            return a.createdAt.localeCompare(b.createdAt);
          })
          .slice(0, 3);

  const usingSuggestedFallback = pinned.length === 0 && selectedTasks.length > 0;
  const items: PriorityQueueItem[] = selectedTasks.map((task, idx) => {
    const isCompleted = task.status === 'completed';
    const urgency = getTaskDueUrgency(task.dueDate, todayStr, isCompleted);
    return {
      task,
      displayRank: task.priorityRank || idx + 1,
      isPinned: Boolean(task.isDailyPriority),
      isOverdue: Boolean(urgency?.isOverdue && !isCompleted),
      urgency,
    };
  });

  return {
    items,
    pinnedCount: pinned.length,
    usingSuggestedFallback,
    totalEstimatedMinutes: items.reduce(
      (sum, item) => sum + (item.task.estimatedDurationMinutes || 0),
      0
    ),
    completedCount: items.filter(item => item.task.status === 'completed').length,
    overdueCount: items.filter(item => item.isOverdue).length,
  };
}

export interface FocusStatisticsResult {
  focusMinutesToday: number;
  sessionsTodayCount: number;
  completedTasksToday: number;
  remainingTasksToday: number;
  totalTasksToday: number;
  overdueTasksCount: number;
  dailyProgressPercentage: number;
  targetFocusMinutes: number;
}

export function computeFocusStatistics(params: {
  tasks: Task[];
  focusSessions: FocusSession[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  profile: UserProfile;
  todayStr: string;
}): FocusStatisticsResult {
  const { tasks, focusSessions, habits, habitCompletions, profile, todayStr } = params;

  const isTaskCompletedToday = (t: Task) =>
    t.status === 'completed' &&
    Boolean(t.completedAt?.startsWith(todayStr) || t.dueDate?.startsWith(todayStr) || t.isDailyPriority);

  const relevantTodayTasks = tasks.filter(t => {
    if (t.status === 'cancelled') return false;
    const dueStr = t.dueDate?.slice(0, 10);
    const isOverdueOpen = Boolean(dueStr && dueStr < todayStr && t.status !== 'completed');
    const isDueToday = dueStr === todayStr;
    return Boolean(t.isDailyPriority || isDueToday || isOverdueOpen || isTaskCompletedToday(t));
  });

  const completedTasksToday = relevantTodayTasks.filter(t => t.status === 'completed').length;
  const remainingTasksToday = Math.max(0, relevantTodayTasks.length - completedTasksToday);

  const overdueTasksCount = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    const dueStr = t.dueDate?.slice(0, 10);
    return Boolean(dueStr && dueStr < todayStr);
  }).length;

  const todayFocusSessions = focusSessions.filter(
    s => s.startTime.startsWith(todayStr) && s.sessionType === 'focus'
  );
  const focusMinutesToday = todayFocusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const activeHabits = habits.filter(h => h.active);
  const habitsCompletedToday = activeHabits.filter(h =>
    habitCompletions.some(c => c.habitId === h.id && c.date === todayStr && c.completed)
  ).length;

  const targetFocusMinutes = Math.max(
    45,
    Math.round((profile.dailyAvailabilityHours || 3) * 60 * 0.5)
  );

  const dailyScore = calculateDailyScore({
    tasksCompleted: completedTasksToday,
    tasksTotal: relevantTodayTasks.length,
    habitsCompleted: habitsCompletedToday,
    habitsTotal: activeHabits.length,
    focusMinutes: focusMinutesToday,
    targetFocusMinutes,
  });

  return {
    focusMinutesToday,
    sessionsTodayCount: todayFocusSessions.length,
    completedTasksToday,
    remainingTasksToday,
    totalTasksToday: relevantTodayTasks.length,
    overdueTasksCount,
    dailyProgressPercentage: dailyScore.overallPercentage,
    targetFocusMinutes,
  };
}

export interface ContinueLearningResult {
  source: 'learning_center' | 'legacy_course' | 'empty';
  moduleId: string | null;
  moduleTitle: string;
  moduleDescription?: string;
  moduleColor?: string;
  lessonId: string | null;
  lessonTitle: string;
  lessonMeta?: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lastActivityLabel?: string;
}

function pickNextLessonForModule(moduleLessons: LearningLesson[]): LearningLesson | null {
  if (moduleLessons.length === 0) return null;
  const ordered = [...moduleLessons].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
  );

  const recentlyOpenedIncomplete = [...ordered]
    .filter(l => l.status !== 'completed' && Boolean(l.lastOpenedAt))
    .sort((a, b) => (b.lastOpenedAt || '').localeCompare(a.lastOpenedAt || ''))[0];
  if (recentlyOpenedIncomplete) return recentlyOpenedIncomplete;

  const inProgress = ordered.find(l => l.status === 'in_progress');
  if (inProgress) return inProgress;

  const notStarted = ordered.find(l => l.status === 'not_started');
  if (notStarted) return notStarted;

  return (
    [...ordered].sort((a, b) =>
      (b.lastOpenedAt || b.updatedAt).localeCompare(a.lastOpenedAt || a.updatedAt)
    )[0] || ordered[0]
  );
}

export function selectContinueLearning(params: {
  learningData: LearningBootstrapData | null;
  courses: Course[];
  studySessions: StudySession[];
}): ContinueLearningResult {
  const { learningData, courses, studySessions } = params;

  if (learningData && learningData.modules.length > 0) {
    const modules = learningData.modules;
    const lessons = learningData.lessons;
    const sessions = learningData.studySessions;

    const moduleById = new Map<string, LearningModule>(modules.map(m => [m.id, m]));
    let activeModule: LearningModule | null = null;

    // 1. Most recently opened lesson's module
    const openedLessons = [...lessons]
      .filter(l => Boolean(l.lastOpenedAt))
      .sort((a, b) => (b.lastOpenedAt || '').localeCompare(a.lastOpenedAt || ''));
    for (const l of openedLessons) {
      const m = moduleById.get(l.moduleId);
      if (m) {
        activeModule = m;
        break;
      }
    }

    // 2. Or most recent study session's module
    if (!activeModule && sessions.length > 0) {
      const recentSessions = [...sessions].sort((a, b) =>
        `${b.date}T${b.startTime || '00:00'}`.localeCompare(`${a.date}T${a.startTime || '00:00'}`)
      );
      for (const s of recentSessions) {
        if (s.moduleId && moduleById.has(s.moduleId)) {
          activeModule = moduleById.get(s.moduleId)!;
          break;
        }
      }
    }

    // 3. Or most recently updated in-progress module / first active module
    if (!activeModule) {
      activeModule =
        [...modules]
          .filter(m => m.status === 'in_progress')
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ||
        [...modules].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ||
        modules[0];
    }

    const moduleLessons = lessons.filter(l => l.moduleId === activeModule.id);
    const stats = computeModuleStats(moduleLessons);
    const currentLesson = pickNextLessonForModule(moduleLessons);
    const activityTime =
      currentLesson?.lastOpenedAt || currentLesson?.updatedAt || activeModule.updatedAt;

    return {
      source: 'learning_center',
      moduleId: activeModule.id,
      moduleTitle: activeModule.title,
      moduleDescription: activeModule.description,
      moduleColor: activeModule.color,
      lessonId: currentLesson?.id || null,
      lessonTitle: currentLesson
        ? currentLesson.title
        : moduleLessons.length === 0
        ? 'No lessons added yet'
        : 'All lessons completed',
      lessonMeta: currentLesson
        ? [
            currentLesson.teacherName,
            currentLesson.studyDurationMinutes > 0
              ? `${currentLesson.studyDurationMinutes}m`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')
        : undefined,
      completedLessons: stats.completed,
      totalLessons: stats.total,
      progressPercentage: stats.progressPct,
      lastActivityLabel: activityTime ? activityTime.slice(0, 10) : undefined,
    };
  }

  // Fallback for Demo / Guest mode when Learning Center tables are still empty
  const activeCourses = courses.filter(c => c.status === 'active');
  if (activeCourses.length > 0) {
    const courseById = new Map(activeCourses.map(c => [c.id, c]));
    let activeCourse: Course = activeCourses[0];
    if (studySessions.length > 0) {
      const sortedSessions = [...studySessions].sort((a, b) => b.date.localeCompare(a.date));
      for (const s of sortedSessions) {
        if (s.courseId && courseById.has(s.courseId)) {
          activeCourse = courseById.get(s.courseId)!;
          break;
        }
      }
    }

    const orderedLessons = [...activeCourse.lessons].sort((a, b) => a.order - b.order);
    const totalLessons = orderedLessons.length;
    const completedLessons = orderedLessons.filter(l => l.completed).length;
    const currentLesson = orderedLessons.find(l => !l.completed) || orderedLessons[0] || null;
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      source: 'legacy_course',
      moduleId: activeCourse.id,
      moduleTitle: activeCourse.title,
      moduleDescription: activeCourse.description,
      lessonId: currentLesson?.id || null,
      lessonTitle: currentLesson ? currentLesson.title : 'Ready to start',
      lessonMeta: [
        activeCourse.category,
        currentLesson?.studyDurationMinutes ? `${currentLesson.studyDurationMinutes}m` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      completedLessons,
      totalLessons,
      progressPercentage,
      lastActivityLabel: studySessions[0]?.date,
    };
  }

  return {
    source: 'empty',
    moduleId: null,
    moduleTitle: 'No active module yet',
    lessonId: null,
    lessonTitle: 'Create your first learning module or lesson to track study continuity.',
    completedLessons: 0,
    totalLessons: 0,
    progressPercentage: 0,
  };
}

export interface UpcomingDeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  kindLabel: string;
  priority: Priority;
  urgency: DueUrgencyInfo;
  isLearningItem: boolean;
  learningModuleId?: string;
  learningLessonId?: string;
  projectId?: string;
  contextLabel?: string;
}

export function selectUpcomingDeadlines(params: {
  tasks: Task[];
  learningData: LearningBootstrapData | null;
  projects: Project[];
  todayStr: string;
  limit?: number;
}): UpcomingDeadlineItem[] {
  const { tasks, learningData, projects, todayStr, limit = 6 } = params;
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const moduleMap = new Map((learningData?.modules || []).map(m => [m.id, m]));
  const lessonMap = new Map((learningData?.lessons || []).map(l => [l.id, l]));

  const itemsById = new Map<string, UpcomingDeadlineItem>();

  // 1. Learning Center assignments, practical labs, exercises & tasks
  if (learningData) {
    for (const lt of learningData.tasks) {
      if (lt.status === 'completed' || !lt.dueDate) continue;
      const urgency = getTaskDueUrgency(lt.dueDate, todayStr, false);
      if (!urgency) continue;
      const mod = moduleMap.get(lt.moduleId);
      const lesson = lt.lessonId ? lessonMap.get(lt.lessonId) : undefined;
      itemsById.set(lt.id, {
        id: lt.id,
        title: lt.title,
        dueDate: lt.dueDate.slice(0, 10),
        kindLabel: LEARNING_TASK_KIND_LABELS[lt.taskKind] || 'Assignment',
        priority: lt.priority,
        urgency,
        isLearningItem: true,
        learningModuleId: lt.moduleId,
        learningLessonId: lt.lessonId || undefined,
        contextLabel: mod ? (lesson ? `${mod.title} · ${lesson.title}` : mod.title) : undefined,
      });
    }
  }

  // 2. General important or dated tasks (avoiding duplicates with Learning tasks and Today's Priorities)
  for (const t of tasks) {
    if (itemsById.has(t.id)) continue;
    if (t.status === 'completed' || t.status === 'cancelled' || !t.dueDate) continue;
    if (t.isDailyPriority && !t.learningModuleId) continue;

    const urgency = getTaskDueUrgency(t.dueDate, todayStr, false);
    if (!urgency) continue;

    const isLearningTask = Boolean(t.learningModuleId);
    const isImportantOrSoon =
      isLearningTask ||
      t.priority === 'urgent' ||
      t.priority === 'high' ||
      urgency.daysDelta <= 7;

    if (!isImportantOrSoon) continue;

    const proj = t.relatedProjectId ? projectMap.get(t.relatedProjectId) : undefined;
    const mod = t.learningModuleId ? moduleMap.get(t.learningModuleId) : undefined;
    const kindLabel = isLearningTask
      ? LEARNING_TASK_KIND_LABELS[(t.learningTaskKind || 'assignment') as LearningTaskKind] ||
        'Assignment'
      : t.priority === 'urgent'
      ? 'Urgent Task'
      : t.priority === 'high'
      ? 'High Priority'
      : 'Task';

    itemsById.set(t.id, {
      id: t.id,
      title: t.title,
      dueDate: t.dueDate.slice(0, 10),
      kindLabel,
      priority: t.priority,
      urgency,
      isLearningItem: isLearningTask,
      learningModuleId: t.learningModuleId,
      learningLessonId: t.learningLessonId,
      projectId: t.relatedProjectId,
      contextLabel: mod?.title || t.learningModuleTitle || proj?.name,
    });
  }

  return Array.from(itemsById.values())
    .sort((a, b) => {
      if (a.urgency.isOverdue !== b.urgency.isOverdue) {
        return a.urgency.isOverdue ? -1 : 1;
      }
      const dateCmp = a.dueDate.localeCompare(b.dueDate);
      if (dateCmp !== 0) return dateCmp;
      if (a.isLearningItem !== b.isLearningItem) {
        return a.isLearningItem ? -1 : 1;
      }
      return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    })
    .slice(0, limit);
}

export interface WeeklyProgressResult {
  weekStartStr: string;
  weekEndStr: string;
  targets: WeeklyTargets;
  tasks: {
    completed: number;
    planned: number;
    target: number;
    percentageOfPlanned: number;
    percentageOfTarget: number;
  };
  learning: {
    hoursActual: number;
    minutesActual: number;
    hoursTarget: number;
    percentageOfTarget: number;
  };
  labs: {
    completed: number;
    total: number;
    target: number;
    percentageOfTarget: number;
  };
  fitness: {
    sessions: number;
    activeDays: number;
    target: number;
    consistencyPercentage: number;
  };
}

export function computeWeeklyProgress(params: {
  tasks: Task[];
  learningData: LearningBootstrapData | null;
  studySessions: StudySession[];
  workoutSessions: WorkoutSession[];
  preferences?: Partial<UserPreferences> | null;
  todayStr: string;
}): WeeklyProgressResult {
  const { tasks, learningData, studySessions, workoutSessions, preferences, todayStr } = params;
  const targets = resolveWeeklyTargets(preferences);
  const { startDateStr, endDateStr } = getWeekBounds(todayStr, preferences?.startOfWeek || 'monday');

  const inCurrentWeek = (dateValue?: string) => {
    if (!dateValue) return false;
    const d = dateValue.slice(0, 10);
    return d >= startDateStr && d <= endDateStr;
  };

  // Tasks completed vs planned in current week
  const completedInWeek = tasks.filter(
    t => t.status === 'completed' && (inCurrentWeek(t.completedAt) || inCurrentWeek(t.dueDate))
  ).length;
  const plannedInWeekSet = new Set(
    tasks
      .filter(
        t =>
          t.status !== 'cancelled' &&
          (inCurrentWeek(t.dueDate) ||
            (t.status === 'completed' && inCurrentWeek(t.completedAt)) ||
            Boolean(t.isDailyPriority))
      )
      .map(t => t.id)
  );
  const plannedCount = Math.max(completedInWeek, plannedInWeekSet.size);

  // Learning hours in current week (prefer SQLite learning studySessions when present, plus non-overlapping legacy studySessions)
  const learningSessionsInWeek = (learningData?.studySessions || []).filter(s =>
    inCurrentWeek(s.date)
  );
  const learningSessionIds = new Set(learningSessionsInWeek.map(s => s.id));
  const legacySessionsInWeek = studySessions.filter(
    s => !learningSessionIds.has(s.id) && inCurrentWeek(s.date)
  );

  const learningMinutesActual =
    learningSessionsInWeek.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) +
    legacySessionsInWeek.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const learningHoursActual = Math.round((learningMinutesActual / 60) * 10) / 10;

  // Completed practical labs (in current week if completedAt present, plus total active/completed labs context)
  const labTasks = (learningData?.tasks || []).filter(lt => lt.taskKind === 'lab');
  const legacyLabTasks = tasks.filter(
    t => !learningData?.tasks.some(lt => lt.id === t.id) && t.learningTaskKind === 'lab'
  );
  const completedLabsInWeek =
    labTasks.filter(
      lt => lt.status === 'completed' && (!lt.completedAt || inCurrentWeek(lt.completedAt))
    ).length +
    legacyLabTasks.filter(
      t => t.status === 'completed' && (!t.completedAt || inCurrentWeek(t.completedAt))
    ).length;
  const totalLabs = labTasks.length + legacyLabTasks.length;

  // Fitness consistency (workout sessions this week + unique active days)
  const workoutsInWeek = workoutSessions.filter(ws => inCurrentWeek(ws.date));
  const uniqueWorkoutDays = new Set(workoutsInWeek.map(ws => ws.date.slice(0, 10))).size;

  const pct = (actual: number, goal: number) =>
    goal > 0 ? Math.min(100, Math.round((actual / goal) * 100)) : 0;

  return {
    weekStartStr: startDateStr,
    weekEndStr: endDateStr,
    targets,
    tasks: {
      completed: completedInWeek,
      planned: plannedCount,
      target: targets.tasksCompleted,
      percentageOfPlanned: plannedCount > 0 ? Math.min(100, Math.round((completedInWeek / plannedCount) * 100)) : 0,
      percentageOfTarget: pct(completedInWeek, targets.tasksCompleted),
    },
    learning: {
      hoursActual: learningHoursActual,
      minutesActual: learningMinutesActual,
      hoursTarget: targets.learningHours,
      percentageOfTarget: pct(learningHoursActual, targets.learningHours),
    },
    labs: {
      completed: completedLabsInWeek,
      total: totalLabs,
      target: targets.practicalLabs,
      percentageOfTarget: pct(completedLabsInWeek, targets.practicalLabs),
    },
    fitness: {
      sessions: workoutsInWeek.length,
      activeDays: uniqueWorkoutDays,
      target: targets.fitnessSessions,
      consistencyPercentage: pct(workoutsInWeek.length, targets.fitnessSessions),
    },
  };
}
