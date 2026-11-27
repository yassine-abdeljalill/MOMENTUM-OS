import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  Play,
  Plus,
  SlidersHorizontal,
  StickyNote,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { formatMinutes } from '../../lib/logic';
import { learningApi } from '../../lib/learningApi';
import {
  computeFocusStatistics,
  computeWeeklyProgress,
  resolveWeeklyTargets,
  selectContinueLearning,
  selectTodaysPriorities,
  selectUpcomingDeadlines,
} from '../../lib/overview';
import type { LearningLesson } from '../../types/learning';
import type { WeeklyTargets } from '../../types';
import {
  AnimatedCheckButton,
  AnimatedNumber,
  AnimatedProgressBar,
  MOMENTUM_EASE,
  MomentumVelocityBars,
  SpotlightCard,
  StaggerContainer,
  StaggerItem,
} from '../common/MotionPrimitives';
import {
  LearningQuickActionModal,
  type LearningQuickActionKind,
} from '../overview/LearningQuickActionModal';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatPriorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatShortDateRange(startStr: string, endStr: string): string {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };
  return `${fmt(startStr)} – ${fmt(endStr)}`;
}

export const OverviewView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    learningData,
    updateLearningData,
    setCurrentView,
    toggleTaskCompleted,
    setDailyPriorityRank,
    reorderDailyPriority,
    updatePreferences,
    setIsQuickAddOpen,
    setIsFocusTimerOpen,
    startFocusTimer,
    setSelectedLearningModuleId,
    setSelectedLearningLessonId,
    setSelectedProjectId,
    showToast,
  } = useApp();

  const [quickLearningAction, setQuickLearningAction] =
    useState<LearningQuickActionKind | null>(null);
  const [resumingLearning, setResumingLearning] = useState(false);

  const resolvedTargets = useMemo(
    () => resolveWeeklyTargets(state.preferences),
    [state.preferences]
  );
  const [editingTargets, setEditingTargets] = useState(false);
  const [draftTargets, setDraftTargets] = useState<WeeklyTargets>(resolvedTargets);

  const todayStr = new Date().toISOString().split('T')[0];
  const firstName = state.profile.fullName.trim().split(/\s+/)[0] || 'there';

  const focusStats = useMemo(
    () =>
      computeFocusStatistics({
        tasks: state.tasks,
        focusSessions: state.focusSessions,
        habits: state.habits,
        habitCompletions: state.habitCompletions,
        profile: state.profile,
        todayStr,
      }),
    [
      state.tasks,
      state.focusSessions,
      state.habits,
      state.habitCompletions,
      state.profile,
      todayStr,
    ]
  );

  const todaysPriorities = useMemo(
    () => selectTodaysPriorities(state.tasks, todayStr),
    [state.tasks, todayStr]
  );

  const continueLearning = useMemo(
    () =>
      selectContinueLearning({
        learningData,
        courses: state.courses,
        studySessions: state.studySessions,
      }),
    [learningData, state.courses, state.studySessions]
  );

  const upcomingDeadlines = useMemo(
    () =>
      selectUpcomingDeadlines({
        tasks: state.tasks,
        learningData,
        projects: state.projects,
        todayStr,
        limit: 5,
      }),
    [state.tasks, learningData, state.projects, todayStr]
  );

  const weeklyProgress = useMemo(
    () =>
      computeWeeklyProgress({
        tasks: state.tasks,
        learningData,
        studySessions: state.studySessions,
        workoutSessions: state.workoutSessions,
        preferences: state.preferences,
        todayStr,
      }),
    [
      state.tasks,
      learningData,
      state.studySessions,
      state.workoutSessions,
      state.preferences,
      todayStr,
    ]
  );

  const handleOpenTargetEditor = () => {
    setDraftTargets(resolvedTargets);
    setEditingTargets(prev => !prev);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const clamp = (val: number, min: number, max: number) =>
      Math.min(max, Math.max(min, Math.round(Number.isFinite(val) ? val : min)));
    const nextTargets: WeeklyTargets = {
      tasksCompleted: clamp(draftTargets.tasksCompleted, 1, 100),
      learningHours: clamp(draftTargets.learningHours, 1, 80),
      practicalLabs: clamp(draftTargets.practicalLabs, 1, 50),
      fitnessSessions: clamp(draftTargets.fitnessSessions, 1, 14),
    };
    updatePreferences({ weeklyTargets: nextTargets });
    setEditingTargets(false);
    showToast('Weekly targets updated.');
  };

  const handleResumeLearning = async () => {
    if (continueLearning.source === 'empty') {
      setCurrentView('learning');
      return;
    }

    if (continueLearning.source === 'learning_center' && continueLearning.moduleId) {
      const targetLessonId = continueLearning.lessonId;
      if (targetLessonId) {
        const now = new Date().toISOString();
        updateLearningData(prev => ({
          ...prev,
          lessons: prev.lessons.map(l =>
            l.id === targetLessonId ? { ...l, lastOpenedAt: now } : l
          ),
        }));
        learningApi
          .markLessonOpened(targetLessonId)
          .then(({ lesson }) => {
            updateLearningData(prev => ({
              ...prev,
              lessons: prev.lessons.map(l => (l.id === lesson.id ? lesson : l)),
            }));
          })
          .catch(() => {});
      }
      setSelectedLearningModuleId(continueLearning.moduleId);
      setSelectedLearningLessonId(targetLessonId);
      setCurrentView('learning');
      return;
    }

    // Fallback from seeded Course in Demo/Guest mode: create module + lessons cleanly in Learning Center so Resume lands inside the live lesson
    const sourceCourse = state.courses.find(c => c.id === continueLearning.moduleId);
    if (!sourceCourse) {
      setCurrentView('learning');
      return;
    }

    setResumingLearning(true);
    try {
      const { module: createdModule } = await learningApi.createModule({
        title: sourceCourse.title,
        description: sourceCourse.description,
        icon: sourceCourse.category.toLowerCase().includes('security') ? 'shield' : 'book',
        status: 'in_progress',
      });

      const createdLessons: LearningLesson[] = [];
      let resumeLessonId: string | null = null;
      const ordered = [...sourceCourse.lessons].sort((a, b) => a.order - b.order);

      for (const l of ordered) {
        const { lesson } = await learningApi.createLesson({
          moduleId: createdModule.id,
          title: l.title,
          description: l.content,
          teacherName: sourceCourse.instructor || '',
          lessonDate: sourceCourse.startDate,
          status: l.completed ? 'completed' : 'in_progress',
          learningObjectives: l.learningObjectives,
          studyDurationMinutes: l.studyDurationMinutes,
        });
        createdLessons.push(lesson);
        if (!resumeLessonId && l.id === continueLearning.lessonId) {
          resumeLessonId = lesson.id;
        }
      }

      if (!resumeLessonId && createdLessons.length > 0) {
        resumeLessonId = createdLessons[0].id;
      }

      if (resumeLessonId) {
        const opened = await learningApi.markLessonOpened(resumeLessonId).catch(() => null);
        if (opened?.lesson) {
          const idx = createdLessons.findIndex(item => item.id === opened.lesson.id);
          if (idx >= 0) createdLessons[idx] = opened.lesson;
        }
      }

      updateLearningData(prev => ({
        ...prev,
        modules: [...prev.modules, createdModule],
        lessons: [...prev.lessons, ...createdLessons],
      }));

      setSelectedLearningModuleId(createdModule.id);
      setSelectedLearningLessonId(resumeLessonId);
      setCurrentView('learning');
    } catch {
      setCurrentView('learning');
    } finally {
      setResumingLearning(false);
    }
  };

  const handleOpenDeadlineTarget = (item: (typeof upcomingDeadlines)[number]) => {
    if (item.learningModuleId) {
      setSelectedLearningModuleId(item.learningModuleId);
      setSelectedLearningLessonId(item.learningLessonId || null);
      setCurrentView('learning');
      return;
    }
    if (item.projectId) {
      setSelectedProjectId(item.projectId);
      setCurrentView('projects');
      return;
    }
    setCurrentView('tasks');
  };

  const statusBriefParts: string[] = [];
  if (todaysPriorities.items.length > 0) {
    statusBriefParts.push(
      `${todaysPriorities.completedCount} of ${todaysPriorities.items.length} priorities complete`
    );
  }
  if (focusStats.overdueTasksCount > 0) {
    statusBriefParts.push(
      `${focusStats.overdueTasksCount} overdue ${
        focusStats.overdueTasksCount === 1 ? 'task' : 'tasks'
      }`
    );
  }
  if (continueLearning.source !== 'empty') {
    statusBriefParts.push(`Next study: ${continueLearning.moduleTitle}`);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Command Header & Quick Actions (F) */}
      <section className="space-y-4 pb-1">
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="text-xs text-ink-muted tabular-nums">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight text-balance">
                {getGreeting()}, {firstName}.
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted truncate">
                {statusBriefParts.length > 0
                  ? statusBriefParts.join(' · ')
                  : 'Your daily command center is clear and ready.'}
              </p>
            </div>
          </div>
        </div>

        {/* F. Quick Actions */}
        <div
          aria-label="Quick actions"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="btn-press inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.25]" />
            <span>Create task</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLearningAction('assignment')}
            className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-surface hover:bg-surface-warm border border-line text-ink text-xs font-medium whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-ink-muted" />
            <span>Add assignment</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFocusTimerOpen(true)}
            className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-surface hover:bg-surface-warm border border-line text-ink text-xs font-medium whitespace-nowrap shrink-0"
          >
            <Timer className="w-3.5 h-3.5 text-ink-muted" />
            <span>Start focus session</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLearningAction('lab')}
            className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-surface hover:bg-surface-warm border border-line text-ink text-xs font-medium whitespace-nowrap shrink-0"
          >
            <FlaskConical className="w-3.5 h-3.5 text-ink-muted" />
            <span>Create practical lab</span>
          </button>

          <button
            type="button"
            onClick={() => setQuickLearningAction('note')}
            className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-surface hover:bg-surface-warm border border-line text-ink text-xs font-medium whitespace-nowrap shrink-0"
          >
            <StickyNote className="w-3.5 h-3.5 text-ink-muted" />
            <span>Add learning note</span>
          </button>
        </div>
      </section>

      {/* B. Focus Statistics */}
      <section aria-label="Focus statistics">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StaggerItem>
            <SpotlightCard className="h-full p-4 sm:p-5 rounded-2xl bg-surface border border-line card-hover">
              <span className="text-xs font-medium text-ink-muted">Focus time today</span>
              <div className="my-2 flex items-baseline gap-2">
                <AnimatedNumber
                  value={focusStats.focusMinutesToday}
                  formatter={formatMinutes}
                  className="font-mono text-2xl sm:text-3xl font-semibold text-ink tabular-nums"
                />
              </div>
              <div className="text-xs text-ink-muted tabular-nums">
                {focusStats.sessionsTodayCount}{' '}
                {focusStats.sessionsTodayCount === 1 ? 'session' : 'sessions'} · target{' '}
                {formatMinutes(focusStats.targetFocusMinutes)}
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard className="h-full p-4 sm:p-5 rounded-2xl bg-surface border border-line card-hover">
              <span className="text-xs font-medium text-ink-muted">Completed tasks</span>
              <div className="my-2 flex items-baseline gap-2">
                <AnimatedNumber
                  value={focusStats.completedTasksToday}
                  className="font-mono text-2xl sm:text-3xl font-semibold text-ink tabular-nums"
                />
                <span className="text-xs text-ink-muted font-mono tabular-nums">
                  / {focusStats.totalTasksToday}
                </span>
              </div>
              <div className="text-xs text-ink-muted">
                {focusStats.totalTasksToday === 0
                  ? 'No tasks scheduled today'
                  : 'Checked off for today'}
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard className="h-full p-4 sm:p-5 rounded-2xl bg-surface border border-line card-hover">
              <span className="text-xs font-medium text-ink-muted">Remaining tasks</span>
              <div className="my-2 flex items-baseline gap-2">
                <AnimatedNumber
                  value={focusStats.remainingTasksToday}
                  className="font-mono text-2xl sm:text-3xl font-semibold text-ink tabular-nums"
                />
              </div>
              <div className="text-xs text-ink-muted tabular-nums flex items-center gap-1.5">
                {focusStats.overdueTasksCount > 0 ? (
                  <span className="inline-flex items-center gap-1 font-medium text-ink">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{focusStats.overdueTasksCount} overdue</span>
                  </span>
                ) : focusStats.remainingTasksToday === 0 ? (
                  <span>All caught up</span>
                ) : (
                  <span>On schedule</span>
                )}
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard className="h-full p-4 sm:p-5 rounded-2xl bg-surface border border-line card-hover">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-muted">Daily progress</span>
                <MomentumVelocityBars percentage={focusStats.dailyProgressPercentage} showLabel />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <AnimatedNumber
                  value={focusStats.dailyProgressPercentage}
                  formatter={v => `${v}%`}
                  className="font-mono text-2xl sm:text-3xl font-semibold text-ink tabular-nums"
                />
              </div>
              <AnimatedProgressBar
                percentage={focusStats.dailyProgressPercentage}
                trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                fillClassName="bg-accent h-full rounded-full"
              />
            </SpotlightCard>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Main Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left Column (7 cols): A. Today's Priorities + D. Upcoming Deadlines */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6">
          {/* A. Today's Priorities */}
          <section
            aria-labelledby="overview-priorities-heading"
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    id="overview-priorities-heading"
                    className="text-sm font-semibold text-ink"
                  >
                    Today&apos;s Priorities
                  </h3>
                  <span className="text-xs text-ink-muted font-mono tabular-nums">
                    {todaysPriorities.completedCount}/{todaysPriorities.items.length}
                    {todaysPriorities.totalEstimatedMinutes > 0
                      ? ` · ~${formatMinutes(todaysPriorities.totalEstimatedMinutes)} est`
                      : ''}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  {todaysPriorities.usingSuggestedFallback
                    ? 'Suggested top priorities from your urgent and due tasks.'
                    : 'Your three primary outcomes for today. Complete or reorder as conditions shift.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('today')}
                className="text-xs text-ink-muted hover:text-ink font-medium hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[32px]"
              >
                <span>Plan Today</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todaysPriorities.items.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2.5 border border-dashed border-line rounded-xl bg-surface-warm/40">
                <p className="text-sm text-ink font-medium">No priorities queued for today</p>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Create a task or select your top three anchors in the Today planner.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(true)}
                    className="btn-press px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-semibold whitespace-nowrap"
                  >
                    Create task
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('today')}
                    className="btn-press px-3.5 py-2 rounded-xl bg-surface border border-line text-ink text-xs font-medium whitespace-nowrap"
                  >
                    Open Today
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {todaysPriorities.items.map((item, idx) => {
                  const { task, isOverdue, urgency, isPinned } = item;
                  const isDone = task.status === 'completed';
                  const project = task.relatedProjectId
                    ? state.projects.find(p => p.id === task.relatedProjectId)
                    : undefined;
                  const contextLabel = task.learningModuleTitle || project?.name;

                  return (
                    <motion.div
                      key={task.id}
                      layout={!prefersReduced}
                      transition={prefersReduced ? { duration: 0.01 } : { duration: 0.18, ease: MOMENTUM_EASE }}
                      className={`py-3.5 first:pt-4 last:pb-1 flex items-start gap-3 ${
                        isDone ? 'opacity-65' : ''
                      }`}
                    >
                      <AnimatedCheckButton
                        checked={isDone}
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="mt-0.5"
                        ariaLabel={
                          isDone
                            ? `Mark "${task.title}" incomplete`
                            : `Mark "${task.title}" completed`
                        }
                      />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex items-baseline gap-2">
                            <span className="font-mono text-xs font-semibold text-ink-muted tabular-nums shrink-0">
                              0{idx + 1}.
                            </span>
                            <span
                              className={`text-sm font-medium leading-snug ${
                                isDone ? 'line-through text-ink-muted' : 'text-ink'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isPinned && (
                              <>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => reorderDailyPriority(task.id, 'up')}
                                  className="min-w-[36px] min-h-[36px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                  aria-label={`Move "${task.title}" up`}
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === todaysPriorities.items.length - 1}
                                  onClick={() => reorderDailyPriority(task.id, 'down')}
                                  className="min-w-[36px] min-h-[36px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                  aria-label={`Move "${task.title}" down`}
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {!isPinned && todaysPriorities.usingSuggestedFallback && (
                              <button
                                type="button"
                                onClick={() => setDailyPriorityRank(task.id, idx + 1)}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-ink bg-surface-warm hover:bg-surface-inset border border-line whitespace-nowrap"
                              >
                                Pin #{idx + 1}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                startFocusTimer(
                                  task.estimatedDurationMinutes
                                    ? Math.min(60, Math.max(15, task.estimatedDurationMinutes))
                                    : 25,
                                  { id: task.id, title: task.title }
                                );
                                setIsFocusTimerOpen(true);
                              }}
                              className="btn-press inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] sm:min-h-[30px] rounded-lg bg-surface-warm hover:bg-accent hover:text-accent-ink border border-line text-xs font-medium text-ink transition-colors whitespace-nowrap"
                              aria-label={`Start focus session for "${task.title}"`}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Focus</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                          {isOverdue && urgency && (
                            <span className="inline-flex items-center gap-1 font-semibold text-ink">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{urgency.label}</span>
                            </span>
                          )}
                          {isOverdue && <span aria-hidden="true">·</span>}

                          {!isOverdue && urgency && (
                            <>
                              <span className="font-mono tabular-nums">{urgency.label}</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}

                          <span>{formatPriorityLabel(task.priority)}</span>

                          {task.estimatedDurationMinutes ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                <Clock className="w-3 h-3" />
                                <span>{formatMinutes(task.estimatedDurationMinutes)} est</span>
                              </span>
                            </>
                          ) : null}

                          {task.dueTime && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{task.dueTime}</span>
                            </>
                          )}

                          {contextLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[200px]">{contextLabel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* D. Upcoming Deadlines */}
          <section
            aria-labelledby="overview-deadlines-heading"
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3
                    id="overview-deadlines-heading"
                    className="text-sm font-semibold text-ink"
                  >
                    Upcoming Deadlines
                  </h3>
                  <span className="text-xs text-ink-muted font-mono tabular-nums">
                    {upcomingDeadlines.length}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Approaching assignments, practical labs, and dated commitments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('tasks')}
                className="text-xs text-ink-muted hover:text-ink font-medium hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[32px]"
              >
                <span>All Tasks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-7 px-4 text-center space-y-2 border border-dashed border-line rounded-xl bg-surface-warm/40">
                <CalendarClock className="w-6 h-6 mx-auto text-ink-muted" />
                <p className="text-xs font-medium text-ink">No approaching deadlines</p>
                <p className="text-xs text-ink-muted">
                  Add an assignment or practical lab to track submission dates here.
                </p>
                <button
                  type="button"
                  onClick={() => setQuickLearningAction('assignment')}
                  className="btn-press mt-1 px-3.5 py-1.5 rounded-xl bg-surface border border-line text-xs font-medium text-ink hover:bg-surface-warm"
                >
                  Add assignment
                </button>
              </div>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {upcomingDeadlines.map(item => (
                  <div
                    key={item.id}
                    className="py-3 first:pt-3.5 last:pb-1 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <AnimatedCheckButton
                        checked={false}
                        size="sm"
                        onClick={() => toggleTaskCompleted(item.id)}
                        className="mt-0.5"
                        ariaLabel={`Complete "${item.title}"`}
                      />
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-ink leading-snug truncate">
                          {item.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
                          {item.urgency.isOverdue ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-ink">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.urgency.label}</span>
                            </span>
                          ) : (
                            <span
                              className={
                                item.urgency.tone === 'today' || item.urgency.tone === 'soon'
                                  ? 'font-medium text-ink'
                                  : ''
                              }
                            >
                              {item.urgency.label}
                            </span>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{item.dueDate}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.kindLabel}</span>
                          {item.contextLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[200px]">{item.contextLabel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenDeadlineTarget(item)}
                      className="btn-press inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] sm:min-h-[30px] rounded-lg bg-surface-warm hover:bg-surface-inset border border-line text-xs font-medium text-ink whitespace-nowrap shrink-0"
                    >
                      <span>{item.learningModuleId ? 'Module' : item.projectId ? 'Project' : 'Open'}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (5 cols): C. Continue Learning + E. Weekly Progress */}
        <div className="lg:col-span-5 space-y-5 sm:space-y-6">
          {/* C. Continue Learning */}
          <section
            aria-labelledby="overview-learning-heading"
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3
                id="overview-learning-heading"
                className="text-sm font-semibold text-ink"
              >
                Continue Learning
              </h3>
              <button
                type="button"
                onClick={() => setCurrentView('learning')}
                className="text-xs text-ink-muted hover:text-ink font-medium hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[32px]"
              >
                <span>Learning Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {continueLearning.source === 'empty' ? (
              <div className="py-6 px-4 text-center space-y-2.5 border border-dashed border-line rounded-xl bg-surface-warm/40">
                <BookOpen className="w-6 h-6 mx-auto text-ink-muted" />
                <p className="text-xs font-medium text-ink">{continueLearning.moduleTitle}</p>
                <p className="text-xs text-ink-muted">{continueLearning.lessonTitle}</p>
                <button
                  type="button"
                  onClick={() => setCurrentView('learning')}
                  className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-semibold"
                >
                  Open Learning Center
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1 border-t border-line">
                <div className="space-y-1.5 pt-3">
                  <p className="text-xs font-medium text-ink-muted truncate">
                    {continueLearning.moduleTitle}
                  </p>
                  <h4 className="text-base font-semibold text-ink leading-snug">
                    {continueLearning.lessonTitle}
                  </h4>
                  {(continueLearning.lessonMeta || continueLearning.lastActivityLabel) && (
                    <p className="text-xs text-ink-muted font-mono tabular-nums">
                      {[continueLearning.lessonMeta, continueLearning.lastActivityLabel]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted tabular-nums font-mono">
                      {continueLearning.completedLessons} / {continueLearning.totalLessons} lessons
                    </span>
                    <span className="font-mono font-semibold text-ink tabular-nums">
                      {continueLearning.progressPercentage}%
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percentage={continueLearning.progressPercentage}
                    trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                    fillClassName="bg-accent h-full rounded-full"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={resumingLearning}
                    onClick={handleResumeLearning}
                    className="btn-press flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-semibold whitespace-nowrap disabled:opacity-60"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{resumingLearning ? 'Opening...' : 'Resume'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickLearningAction('note')}
                    className="btn-press inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-surface-warm hover:bg-surface-inset border border-line text-ink text-xs font-medium whitespace-nowrap"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>Add note</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* E. Weekly Progress */}
          <section
            aria-labelledby="overview-weekly-heading"
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <h3
                  id="overview-weekly-heading"
                  className="text-sm font-semibold text-ink"
                >
                  Weekly Progress
                </h3>
                <p className="text-xs text-ink-muted font-mono tabular-nums">
                  {formatShortDateRange(weeklyProgress.weekStartStr, weeklyProgress.weekEndStr)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenTargetEditor}
                aria-expanded={editingTargets}
                className="btn-press inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-surface-warm hover:bg-surface-inset border border-line text-xs font-medium text-ink whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{editingTargets ? 'Close' : 'Edit targets'}</span>
              </button>
            </div>

            <AnimatePresence initial={false}>
              {editingTargets && (
                <motion.form
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                  onSubmit={handleSaveTargets}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 rounded-xl bg-surface-warm border border-line space-y-3">
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label htmlFor="wt-tasks" className="block text-ink-muted mb-1">
                          Tasks / wk
                        </label>
                        <input
                          id="wt-tasks"
                          type="number"
                          min={1}
                          max={100}
                          value={draftTargets.tasksCompleted}
                          onChange={e =>
                            setDraftTargets(prev => ({
                              ...prev,
                              tasksCompleted: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-line font-mono text-ink text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="wt-hours" className="block text-ink-muted mb-1">
                          Learning hrs / wk
                        </label>
                        <input
                          id="wt-hours"
                          type="number"
                          min={1}
                          max={80}
                          value={draftTargets.learningHours}
                          onChange={e =>
                            setDraftTargets(prev => ({
                              ...prev,
                              learningHours: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-line font-mono text-ink text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="wt-labs" className="block text-ink-muted mb-1">
                          Practical labs / wk
                        </label>
                        <input
                          id="wt-labs"
                          type="number"
                          min={1}
                          max={50}
                          value={draftTargets.practicalLabs}
                          onChange={e =>
                            setDraftTargets(prev => ({
                              ...prev,
                              practicalLabs: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-line font-mono text-ink text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor="wt-fitness" className="block text-ink-muted mb-1">
                          Workouts / wk
                        </label>
                        <input
                          id="wt-fitness"
                          type="number"
                          min={1}
                          max={14}
                          value={draftTargets.fitnessSessions}
                          onChange={e =>
                            setDraftTargets(prev => ({
                              ...prev,
                              fitnessSessions: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-line font-mono text-ink text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="btn-press px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-ink text-xs font-semibold"
                      >
                        Save targets
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-4 pt-3 border-t border-line">
              {/* 1. Tasks completed vs planned & target */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-ink">Tasks completed</span>
                  <span className="font-mono tabular-nums text-ink-muted">
                    <strong className="text-ink font-semibold">
                      {weeklyProgress.tasks.completed}
                    </strong>{' '}
                    / {weeklyProgress.tasks.planned} planned · target {weeklyProgress.tasks.target}
                  </span>
                </div>
                <AnimatedProgressBar
                  percentage={weeklyProgress.tasks.percentageOfTarget}
                  trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                  fillClassName="bg-accent h-full rounded-full"
                />
              </div>

              {/* 2. Learning hours */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-ink">Learning hours</span>
                  <span className="font-mono tabular-nums text-ink-muted">
                    <strong className="text-ink font-semibold">
                      {weeklyProgress.learning.hoursActual}h
                    </strong>{' '}
                    / {weeklyProgress.learning.hoursTarget}h target
                  </span>
                </div>
                <AnimatedProgressBar
                  percentage={weeklyProgress.learning.percentageOfTarget}
                  trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                  fillClassName="bg-accent h-full rounded-full"
                />
              </div>

              {/* 3. Practical labs */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-ink">Completed practical labs</span>
                  <span className="font-mono tabular-nums text-ink-muted">
                    <strong className="text-ink font-semibold">
                      {weeklyProgress.labs.completed}
                    </strong>{' '}
                    / {weeklyProgress.labs.target} target
                    {weeklyProgress.labs.total > 0
                      ? ` · ${weeklyProgress.labs.total} total`
                      : ''}
                  </span>
                </div>
                <AnimatedProgressBar
                  percentage={weeklyProgress.labs.percentageOfTarget}
                  trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                  fillClassName="bg-accent h-full rounded-full"
                />
              </div>

              {/* 4. Fitness consistency */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-ink">Fitness consistency</span>
                  <span className="font-mono tabular-nums text-ink-muted">
                    <strong className="text-ink font-semibold">
                      {weeklyProgress.fitness.sessions}
                    </strong>{' '}
                    / {weeklyProgress.fitness.target} workouts ·{' '}
                    {weeklyProgress.fitness.consistencyPercentage}%
                  </span>
                </div>
                <AnimatedProgressBar
                  percentage={weeklyProgress.fitness.consistencyPercentage}
                  trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                  fillClassName="bg-accent h-full rounded-full"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Quick Action Modal for Learning Assignments, Practical Labs & Notes */}
      <LearningQuickActionModal
        isOpen={quickLearningAction !== null}
        kind={quickLearningAction || 'assignment'}
        onClose={() => setQuickLearningAction(null)}
      />
    </div>
  );
};
