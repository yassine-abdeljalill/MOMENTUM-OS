import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
  Timer,
  TrendingUp,
  Plus,
  Flame,
  ChevronRight,
  Settings2,
  FolderGit2,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import {
  calculateDailyScore,
  calculateGoalProgress,
  calculateHabitStreak,
  formatMinutes,
  getPriorityColor,
} from '../../lib/logic';
import {
  AnimatedNumber,
  AnimatedProgressBar,
  AnimatedCheckButton,
  StaggerContainer,
  StaggerItem,
  MOMENTUM_EASE,
} from '../common/MotionPrimitives';

export const OverviewView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    setCurrentView,
    toggleTaskCompleted,
    toggleHabitCompletion,
    setIsQuickAddOpen,
    setIsFocusTimerOpen,
    setSelectedGoalId,
    setSelectedProjectId,
  } = useApp();

  // Widget visibility toggles
  const [showWeeklyChart, setShowWeeklyChart] = useState(true);
  const [showGoalsWidget, setShowGoalsWidget] = useState(true);
  const [showHabitsWidget, setShowHabitsWidget] = useState(true);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Daily statistics
  const todayTasks = state.tasks.filter(t => t.dueDate === todayStr || t.isDailyPriority);
  const tasksCompleted = todayTasks.filter(t => t.status === 'completed').length;
  const tasksRemaining = todayTasks.length - tasksCompleted;

  // Active habits for today
  const activeHabits = state.habits.filter(h => h.active);
  const habitsCompletedToday = activeHabits.filter(h => {
    const completion = state.habitCompletions.find(
      c => c.habitId === h.id && c.date === todayStr && c.completed
    );
    return Boolean(completion);
  }).length;

  // Focus time today
  const todayFocusMinutes = state.focusSessions
    .filter(s => s.startTime.startsWith(todayStr) && s.sessionType === 'focus')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const dailyScore = calculateDailyScore({
    tasksCompleted,
    tasksTotal: todayTasks.length,
    habitsCompleted: habitsCompletedToday,
    habitsTotal: activeHabits.length,
    focusMinutes: todayFocusMinutes,
    targetFocusMinutes: Math.round((state.profile.dailyAvailabilityHours || 3) * 60 * 0.5),
  });

  // Top 3 Daily Priorities
  const dailyPriorities = state.tasks
    .filter(t => t.isDailyPriority)
    .sort((a, b) => (a.priorityRank || 99) - (b.priorityRank || 99))
    .slice(0, 3);

  // Active Goals
  const activeGoals = state.goals
    .filter(g => g.status === 'active' || g.status === 'in_progress')
    .slice(0, 3);

  // Active Projects
  const activeProjects = state.projects
    .filter(p => p.status === 'active' || p.status === 'planning')
    .slice(0, 3);

  // Weekly activity bars for past 7 days
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    const isToday = i === 6;

    const tasksDone = state.tasks.filter(
      t => t.completedAt && t.completedAt.startsWith(dayStr)
    ).length;
    const habitsDone = state.habitCompletions.filter(
      c => c.date === dayStr && c.completed
    ).length;
    const heightPct = isToday
      ? dailyScore.overallPercentage
      : Math.min(100, Math.max(20, tasksDone * 20 + habitsDone * 15));

    return { dayName, dayStr, heightPct, isToday };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-surface border border-line p-5 sm:p-7 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs font-mono tracking-wide text-brand-blue tabular-nums">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight text-balance">
              {getGreeting()}, {state.profile.fullName.split(' ')[0]}.
            </h1>
            <p className="text-sm text-ink-muted max-w-xl leading-relaxed">
              &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo; Focus on your 3 core priorities today.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="btn-press group flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] sm:min-h-0 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-semibold shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.25] transition-transform duration-200 group-hover:rotate-90" />
              <span>Add Task</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFocusTimerOpen(true)}
              className="btn-press flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] sm:min-h-0 rounded-xl bg-surface-warm hover:bg-surface-hover text-ink border border-line text-xs font-medium whitespace-nowrap shrink-0"
            >
              <Timer className="w-4 h-4 text-brand-blue" />
              <span>Focus Timer</span>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                className="btn-press flex items-center justify-center w-10 h-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:w-9 sm:h-9 rounded-xl bg-surface-warm hover:bg-surface-hover text-ink border border-line transition-colors"
                title="Configure Dashboard Widgets"
                aria-label="Configure dashboard widgets"
                aria-expanded={showSettingsPopover}
              >
                <Settings2 className="w-4 h-4 text-brand-blue" />
              </button>
              <AnimatePresence>
                {showSettingsPopover && (
                  <motion.div
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: prefersReduced ? 0.01 : 0.15, ease: MOMENTUM_EASE }}
                    className="absolute right-0 mt-2 w-52 bg-surface border border-line rounded-xl shadow-xl p-3 z-30 space-y-2 text-xs origin-top-right"
                  >
                    <span className="font-semibold text-ink block border-b border-line pb-1.5">
                      Toggle Widgets
                    </span>
                    <label className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={showWeeklyChart}
                        onChange={e => setShowWeeklyChart(e.target.checked)}
                        className="rounded accent-accent"
                      />
                      Weekly Activity
                    </label>
                    <label className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={showGoalsWidget}
                        onChange={e => setShowGoalsWidget(e.target.checked)}
                        className="rounded accent-accent"
                      />
                      Active Goals
                    </label>
                    <label className="flex items-center gap-2 text-ink-muted hover:text-ink transition-colors cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={showHabitsWidget}
                        onChange={e => setShowHabitsWidget(e.target.checked)}
                        className="rounded accent-accent"
                      />
                      Daily Habits
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Progress KPI Row */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StaggerItem className="p-4 sm:p-5 rounded-2xl bg-surface border border-line flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted">Daily Progress</span>
            <div className="p-1.5 rounded-lg bg-accent/15 text-accent">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <AnimatedNumber
              value={dailyScore.overallPercentage}
              formatter={v => `${v}%`}
              className="font-mono text-2xl sm:text-3xl font-bold text-ink tabular-nums"
            />
            <span className="text-xs text-ink-muted">score</span>
          </div>
          <AnimatedProgressBar
            percentage={dailyScore.overallPercentage}
            trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
            fillClassName="bg-accent h-full rounded-full"
          />
        </StaggerItem>

        <StaggerItem className="p-4 sm:p-5 rounded-2xl bg-surface border border-line flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted">Tasks Completed</span>
            <div className="p-1.5 rounded-lg bg-success/15 text-success">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <AnimatedNumber
              value={tasksCompleted}
              className="font-mono text-2xl sm:text-3xl font-bold text-ink tabular-nums"
            />
            <span className="text-xs text-ink-muted tabular-nums">/ {todayTasks.length} planned</span>
          </div>
          <div className="text-xs text-ink-muted">
            {tasksRemaining === 0 ? 'All scheduled tasks done' : `${tasksRemaining} remaining today`}
          </div>
        </StaggerItem>

        <StaggerItem className="p-4 sm:p-5 rounded-2xl bg-surface border border-line flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted">Habits Checked</span>
            <div className="p-1.5 rounded-lg bg-sage/20 text-sage">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <AnimatedNumber
              value={habitsCompletedToday}
              className="font-mono text-2xl sm:text-3xl font-bold text-ink tabular-nums"
            />
            <span className="text-xs text-ink-muted tabular-nums">/ {activeHabits.length} habits</span>
          </div>
          <div className="text-xs text-ink-muted tabular-nums">
            {Math.round((habitsCompletedToday / (activeHabits.length || 1)) * 100)}% consistency today
          </div>
        </StaggerItem>

        <StaggerItem className="p-4 sm:p-5 rounded-2xl bg-surface border border-line flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-ink-muted">Focus Time</span>
            <div className="p-1.5 rounded-lg bg-brand-blue/15 text-brand-blue">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <AnimatedNumber
              value={todayFocusMinutes}
              formatter={formatMinutes}
              className="font-mono text-2xl sm:text-3xl font-bold text-ink tabular-nums"
            />
          </div>
          <div className="text-xs text-ink-muted tabular-nums">
            {state.focusSessions.filter(s => s.startTime.startsWith(todayStr)).length} deep work sessions
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Core Priorities & Weekly Rhythm */}
        <div className="lg:col-span-7 space-y-6">
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-accent/15 text-accent">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    Today&apos;s Core Priorities
                  </h2>
                  <p className="text-xs text-ink-muted">Rule of 3 daily anchors</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('today')}
                className="text-xs text-brand-blue font-medium hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[36px]"
              >
                <span>Manage Today</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dailyPriorities.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-2.5 border border-dashed border-line rounded-xl bg-surface-warm/50">
                <Target className="w-7 h-7 mx-auto text-ink-muted opacity-60" />
                <p className="text-sm text-ink font-medium">No core priorities selected for today</p>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Select up to 3 major tasks in the Today tab to anchor your day.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentView('today')}
                  className="btn-press mt-1 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs whitespace-nowrap"
                >
                  Set Priorities
                </button>
              </div>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {dailyPriorities.map((task, idx) => {
                  const isDone = task.status === 'completed';
                  const pColor = getPriorityColor(task.priority);
                  const relatedGoal = state.goals.find(g => g.id === task.relatedGoalId);
                  const relatedProject = state.projects.find(p => p.id === task.relatedProjectId);

                  return (
                    <div
                      key={task.id}
                      className={`py-3.5 first:pt-4 last:pb-1 flex items-start gap-3 transition-opacity ${
                        isDone ? 'opacity-65' : ''
                      }`}
                    >
                      <AnimatedCheckButton
                        checked={isDone}
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="mt-0.5"
                        ariaLabel={isDone ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" completed`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-accent font-semibold tabular-nums">
                            0{idx + 1}.
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              isDone ? 'line-through text-ink-muted' : 'text-ink'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-ink-muted mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-ink-muted">
                          <span className={`font-medium capitalize ${pColor.text}`}>
                            {task.priority}
                          </span>

                          {task.dueTime && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                <Clock className="w-3 h-3" />
                                {task.dueTime}
                              </span>
                            </>
                          )}

                          {relatedGoal && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                <Target className="w-3 h-3 text-accent shrink-0" />
                                <span className="truncate">{relatedGoal.title}</span>
                              </span>
                            </>
                          )}

                          {relatedProject && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                <FolderGit2 className="w-3 h-3 text-sage shrink-0" />
                                <span className="truncate">{relatedProject.name}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Weekly Activity Rhythm */}
          <AnimatePresence>
            {showWeeklyChart && (
              <motion.section
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Weekly Productivity Rhythm</h2>
                    <p className="text-xs text-ink-muted">Past 7 days completion trend</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('analytics')}
                    className="text-xs text-brand-blue font-medium hover:underline flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Analytics</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-36 flex items-end justify-between gap-2 pt-4 px-1">
                  {past7Days.map((day, i) => (
                    <div
                      key={day.dayStr}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                    >
                      <span className="text-[11px] font-mono text-ink-muted tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.heightPct}%
                      </span>
                      <div className="w-full max-w-[38px] bg-surface-inset rounded-t-lg h-full flex items-end p-0.5 overflow-hidden">
                        <motion.div
                          className={`w-full rounded-t-md transition-colors duration-200 ${
                            day.isToday
                              ? 'bg-accent'
                              : 'bg-brand-blue/65 group-hover:bg-brand-blue'
                          }`}
                          initial={prefersReduced ? { height: `${day.heightPct}%` } : { height: '0%' }}
                          whileInView={{ height: `${day.heightPct}%` }}
                          viewport={{ once: true, amount: 0.1 }}
                          transition={{
                            duration: prefersReduced ? 0.01 : 0.45,
                            delay: prefersReduced ? 0 : i * 0.04,
                            ease: MOMENTUM_EASE,
                          }}
                        />
                      </div>
                      <span
                        className={`text-[11px] tabular-nums ${
                          day.isToday ? 'text-accent font-semibold' : 'text-ink-muted'
                        }`}
                      >
                        {day.dayName}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column (5 cols): Active Goals, Habits, Projects */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence>
            {showGoalsWidget && (
              <motion.section
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent" />
                    <h2 className="text-sm font-semibold text-ink">Active Goals</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('goals')}
                    className="text-xs text-brand-blue font-medium hover:underline whitespace-nowrap"
                  >
                    View All
                  </button>
                </div>

                {activeGoals.length === 0 ? (
                  <p className="text-xs text-ink-muted py-4 text-center">No active goals set.</p>
                ) : (
                  <div className="space-y-3">
                    {activeGoals.map(goal => {
                      const progress = calculateGoalProgress(goal, state.tasks);
                      return (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setCurrentView('goals');
                          }}
                          className="w-full text-left p-3.5 rounded-xl bg-surface-warm/60 hover:bg-surface-warm border border-line transition-colors space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-ink group-hover:text-accent truncate transition-colors">
                              {goal.title}
                            </span>
                            <span className="text-xs font-mono font-semibold text-accent shrink-0 tabular-nums">
                              {progress}%
                            </span>
                          </div>
                          <AnimatedProgressBar
                            percentage={progress}
                            trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                            fillClassName="bg-accent h-full rounded-full"
                          />
                          <div className="flex items-center justify-between text-[11px] text-ink-muted">
                            <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                            <span className="tabular-nums font-mono">Due {goal.targetDate}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showHabitsWidget && (
              <motion.section
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sage" />
                    <h2 className="text-sm font-semibold text-ink">Daily Habits</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentView('habits')}
                    className="text-xs text-brand-blue font-medium hover:underline whitespace-nowrap"
                  >
                    Habit Hub
                  </button>
                </div>

                <div className="divide-y divide-line border-t border-line">
                  {activeHabits.slice(0, 4).map(habit => {
                    const isDone = state.habitCompletions.some(
                      c => c.habitId === habit.id && c.date === todayStr && c.completed
                    );
                    const streak = calculateHabitStreak(habit, state.habitCompletions, todayStr);

                    return (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between py-2.5 first:pt-3 last:pb-1 gap-3 min-h-[44px]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AnimatedCheckButton
                            checked={isDone}
                            size="sm"
                            onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                            ariaLabel={isDone ? `Uncheck ${habit.name}` : `Complete ${habit.name}`}
                          />
                          <span
                            className={`text-xs font-medium truncate transition-colors ${
                              isDone ? 'line-through text-ink-muted' : 'text-ink'
                            }`}
                          >
                            {habit.name}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-ink-muted shrink-0 tabular-nums">
                          <Flame className="w-3.5 h-3.5 text-accent" />
                          {streak.currentStreak}d
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {activeProjects.length > 0 && (
            <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-brand-blue" />
                  <h2 className="text-sm font-semibold text-ink">Active Projects</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('projects')}
                  className="text-xs text-brand-blue font-medium hover:underline whitespace-nowrap"
                >
                  All Projects
                </button>
              </div>
              <div className="divide-y divide-line border-t border-line">
                {activeProjects.map(project => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setCurrentView('projects');
                    }}
                    className="w-full py-2.5 first:pt-3 last:pb-1 flex items-center justify-between gap-2 text-left group min-h-[44px]"
                  >
                    <span className="text-xs font-medium text-ink group-hover:text-accent truncate transition-colors">
                      {project.name}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted capitalize shrink-0">
                      {project.status.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
