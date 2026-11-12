import React, { useState } from 'react';
import {
  SunMedium,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Sparkles,
  Timer,
  TrendingUp,
  Plus,
  ArrowRight,
  Flame,
  Calendar,
  Layers,
  ChevronRight,
  Settings2,
  BookOpen,
  FolderGit2,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { calculateDailyScore, calculateGoalProgress, calculateHabitStreak, formatMinutes, getPriorityColor } from '../../lib/logic';

export const OverviewView: React.FC = () => {
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
    targetFocusMinutes: Math.round((state.profile.dailyAvailabilityHours || 3) * 60 * 0.5), // 50% dedicated focus target
  });

  // Top 3 Daily Priorities
  const dailyPriorities = state.tasks
    .filter(t => t.isDailyPriority)
    .sort((a, b) => (a.priorityRank || 99) - (b.priorityRank || 99))
    .slice(0, 3);

  // Upcoming Tasks (due today or next few days)
  const upcomingTasks = state.tasks
    .filter(t => t.status !== 'completed' && !t.isDailyPriority)
    .slice(0, 4);

  // Active Goals
  const activeGoals = state.goals
    .filter(g => g.status === 'active' || g.status === 'in_progress')
    .slice(0, 3);

  // Mock weekly activity bars for past 7 days
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    const isToday = i === 6;

    // Calculate real completions for that day
    const tasksDone = state.tasks.filter(
      t => t.completedAt && t.completedAt.startsWith(dayStr)
    ).length;
    const habitsDone = state.habitCompletions.filter(
      c => c.date === dayStr && c.completed
    ).length;
    const heightPct = isToday
      ? dailyScore.overallPercentage
      : Math.min(100, Math.max(25, (tasksDone * 20 + habitsDone * 15)));

    return { dayName, dayStr, heightPct, isToday };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner (Secondary Espresso Anchor with Sky-Blue Details) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3B2418] via-[#4D3021] to-[#3B2418] border border-[#5A3927] p-6 md:p-8 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#8EC5FF]">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#F2E8DA] tracking-tight">
              {getGreeting()}, {state.profile.fullName.split(' ')[0]}.
            </h1>
            <p className="text-sm text-[#E6D8C7] max-w-xl">
              &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo; Focus on your 3 core priorities today.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => setIsFocusTimerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4D3021] hover:bg-[#5A3927] text-[#F2E8DA] border border-[#8EC5FF]/40 text-xs font-semibold transition-colors"
            >
              <Timer className="w-4 h-4 text-[#8EC5FF]" />
              <span>Focus Timer</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                className="p-2 rounded-xl bg-[#4D3021] hover:bg-[#5A3927] text-[#F2E8DA] border border-[#5A3927] transition-colors"
                title="Configure Dashboard Widgets"
                aria-label="Configure widgets"
              >
                <Settings2 className="w-4 h-4 text-[#8EC5FF]" />
              </button>
              {showSettingsPopover && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FAF5ED] border border-[#D6C6B2] rounded-xl shadow-xl p-3 z-30 space-y-2 text-xs">
                  <span className="font-semibold text-[#3B2418] block border-b border-[#D6C6B2] pb-1">
                    Toggle Widgets
                  </span>
                  <label className="flex items-center gap-2 text-[#6E5648] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showWeeklyChart}
                      onChange={e => setShowWeeklyChart(e.target.checked)}
                      className="rounded accent-[#3B2418]"
                    />
                    Weekly Activity
                  </label>
                  <label className="flex items-center gap-2 text-[#6E5648] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGoalsWidget}
                      onChange={e => setShowGoalsWidget(e.target.checked)}
                      className="rounded accent-[#3B2418]"
                    />
                    Active Goals
                  </label>
                  <label className="flex items-center gap-2 text-[#6E5648] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHabitsWidget}
                      onChange={e => setShowHabitsWidget(e.target.checked)}
                      className="rounded accent-[#3B2418]"
                    />
                    Daily Habits
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Completion Overall */}
        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E5648]">
              Daily Progress
            </span>
            <div className="p-1.5 rounded-lg bg-[#8EC5FF]/40 text-[#3B2418]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#3B2418]">
              {dailyScore.overallPercentage}%
            </span>
            <span className="text-xs text-[#6E5648]">score</span>
          </div>
          <div className="w-full bg-[#EAE0D0] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#8EC5FF] h-full rounded-full transition-all duration-500 border-r border-[#3B2418]/20"
              style={{ width: `${dailyScore.overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Tasks Today */}
        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E5648]">
              Tasks Completed
            </span>
            <div className="p-1.5 rounded-lg bg-[#3E7B52]/15 text-[#3E7B52]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#3B2418]">
              {tasksCompleted}
            </span>
            <span className="text-xs text-[#6E5648]">/ {todayTasks.length} planned</span>
          </div>
          <div className="text-[11px] text-[#6E5648]">
            {tasksRemaining === 0 ? 'All scheduled tasks done!' : `${tasksRemaining} remaining for today`}
          </div>
        </div>

        {/* Habits Today */}
        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E5648]">
              Habits Checked
            </span>
            <div className="p-1.5 rounded-lg bg-[#8EC5FF]/40 text-[#3B2418]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#3B2418]">
              {habitsCompletedToday}
            </span>
            <span className="text-xs text-[#6E5648]">/ {activeHabits.length} habits</span>
          </div>
          <div className="text-[11px] text-[#6E5648]">
            {Math.round((habitsCompletedToday / (activeHabits.length || 1)) * 100)}% consistency today
          </div>
        </div>

        {/* Focus Time */}
        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E5648]">
              Focus Time
            </span>
            <div className="p-1.5 rounded-lg bg-[#3B2418] text-[#8EC5FF]">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#3B2418]">
              {formatMinutes(todayFocusMinutes)}
            </span>
          </div>
          <div className="text-[11px] text-[#6E5648]">
            {state.focusSessions.filter(s => s.startTime.startsWith(todayStr)).length} deep work sessions
          </div>
        </div>
      </div>

      {/* Main Grid: Priorities & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Today's 3 Core Priorities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418]">
                  <Flame className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
                  Today&apos;s Core Priorities (Rule of 3)
                </h2>
              </div>
              <button
                onClick={() => setCurrentView('today')}
                className="text-xs text-[#1E5A99] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Manage Today</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dailyPriorities.length === 0 ? (
              <div className="py-8 text-center text-[#6E5648] space-y-2 border border-dashed border-[#D6C6B2] rounded-xl bg-[#F2E8DA]/60">
                <Target className="w-8 h-8 mx-auto opacity-50 text-[#1E5A99]" />
                <p className="text-sm text-[#3B2418] font-medium">No core priorities selected for today</p>
                <p className="text-xs text-[#6E5648]">
                  Select up to 3 major tasks in the Today tab to anchor your day.
                </p>
                <button
                  onClick={() => setCurrentView('today')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418] font-semibold text-xs border border-[#3B2418]/15"
                >
                  Set Priorities
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyPriorities.map((task, idx) => {
                  const isDone = task.status === 'completed';
                  const pColor = getPriorityColor(task.priority);
                  const relatedGoal = state.goals.find(g => g.id === task.relatedGoalId);
                  const relatedProject = state.projects.find(p => p.id === task.relatedProjectId);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all flex items-start gap-3 group ${
                        isDone
                          ? 'bg-[#EAE0D0]/60 border-[#D6C6B2] opacity-75'
                          : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF] hover:shadow-xs'
                      }`}
                    >
                      <button
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="mt-0.5 text-[#6E5648] hover:text-[#3E7B52] transition-colors"
                        aria-label={isDone ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-[#3E7B52] fill-[#3E7B52]/15" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#8EC5FF] text-[#3B2418] font-bold">
                            #{idx + 1}
                          </span>
                          <span
                            className={`text-sm font-semibold truncate ${
                              isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-[#6E5648] mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${pColor.bg} ${pColor.text} ${pColor.border}`}
                          >
                            {task.priority}
                          </span>

                          {task.dueTime && (
                            <span className="text-[11px] text-[#6E5648] flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-[#3B2418]" />
                              {task.dueTime}
                            </span>
                          )}

                          {relatedGoal && (
                            <span className="text-[11px] text-[#6E5648] truncate max-w-[150px]">
                              🎯 {relatedGoal.title}
                            </span>
                          )}

                          {relatedProject && (
                            <span className="text-[11px] text-[#6E5648] truncate max-w-[150px]">
                              📁 {relatedProject.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Activity Summary Chart */}
          {showWeeklyChart && (
            <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
                  Weekly Productivity Rhythm
                </span>
                <span className="text-xs text-[#6E5648]">Past 7 Days</span>
              </div>

              <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
                {past7Days.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono text-[#1E5A99] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.heightPct}%
                    </span>
                    <div className="w-full max-w-[36px] bg-[#EAE0D0] rounded-t-md h-full flex items-end p-0.5 border border-[#D6C6B2]/50">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${
                          day.isToday ? 'bg-[#8EC5FF] border-t-2 border-[#3B2418]' : 'bg-[#3B2418]/65 group-hover:bg-[#3B2418]'
                        }`}
                        style={{ height: `${day.heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-medium ${
                        day.isToday ? 'text-[#3B2418] font-bold px-1.5 rounded bg-[#8EC5FF]/50' : 'text-[#6E5648]'
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Goals & Quick Habits */}
        <div className="space-y-6">
          {/* Active Goals */}
          {showGoalsWidget && (
            <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#1E5A99]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
                    Active Goals
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentView('goals')}
                  className="text-xs text-[#1E5A99] font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {activeGoals.map(goal => {
                  const progress = calculateGoalProgress(goal, state.tasks);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setCurrentView('goals');
                      }}
                      className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] hover:border-[#8EC5FF] cursor-pointer transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-[#3B2418] group-hover:text-[#1E5A99] truncate">
                          {goal.title}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-[#3B2418] px-1.5 py-0.5 rounded bg-[#8EC5FF]/60 shrink-0">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-[#EAE0D0] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#8EC5FF] h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#6E5648]">
                        <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                        <span>Due {goal.targetDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Today's Habits Checkoff */}
          {showHabitsWidget && (
            <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1E5A99]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
                    Daily Habits
                  </h2>
                </div>
                <button
                  onClick={() => setCurrentView('habits')}
                  className="text-xs text-[#1E5A99] font-semibold hover:underline"
                >
                  Habit Hub
                </button>
              </div>

              <div className="space-y-2.5">
                {activeHabits.slice(0, 4).map(habit => {
                  const isDone = state.habitCompletions.some(
                    c => c.habitId === habit.id && c.date === todayStr && c.completed
                  );
                  const streak = calculateHabitStreak(habit, state.habitCompletions, todayStr);

                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                          className="text-[#6E5648] hover:text-[#3E7B52] transition-colors shrink-0"
                          aria-label={isDone ? 'Mark habit incomplete' : 'Mark habit complete'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-[#3E7B52] fill-[#3E7B52]/15" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`text-xs font-medium truncate ${
                            isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#3B2418] text-[#8EC5FF] shrink-0 font-bold">
                        🔥 {streak.currentStreak}d
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
