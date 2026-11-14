import React, { useState } from 'react';
import {
  SunMedium,
  Plus,
  Clock,
  Sparkles,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Trash2,
  Calendar,
  Play,
  Check,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { getPriorityColor } from '../../lib/logic';
import { ModalShell, AnimatedCheckButton, MOMENTUM_EASE } from '../common/MotionPrimitives';

export const TodayView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    toggleTaskCompleted,
    setDailyPriorityRank,
    toggleHabitCompletion,
    addScheduleActivity,
    toggleScheduleActivityCompleted,
    deleteScheduleActivity,
    addJournalEntry,
    startFocusTimer,
    setIsFocusTimerOpen,
    setIsQuickAddOpen,
    showToast,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Daily reflection modal state
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionTitle] = useState(
    `Daily Reflection — ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  );
  const [wentWell, setWentWell] = useState('');
  const [couldBeBetter, setCouldBeBetter] = useState('');
  const [learned, setLearned] = useState('');
  const [tomorrowPriority, setTomorrowPriority] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // New activity form
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityStart, setNewActivityStart] = useState('14:00');
  const [newActivityEnd, setNewActivityEnd] = useState('15:00');
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);

  // Today priorities
  const dailyPriorities = state.tasks
    .filter(t => t.isDailyPriority)
    .sort((a, b) => (a.priorityRank || 99) - (b.priorityRank || 99));

  // Non-priority tasks due today or pending
  const unscheduledTasks = state.tasks.filter(
    t => !t.isDailyPriority && (t.dueDate === todayStr || t.status !== 'completed')
  );

  // Habits for today
  const activeHabits = state.habits.filter(h => h.active);

  // Schedule timeline activities
  const scheduleActivities = (state.dailySchedule || [])
    .filter(a => a.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Reorder priority handler
  const handleMovePriority = (taskId: string, direction: 'up' | 'down') => {
    const currentIdx = dailyPriorities.findIndex(t => t.id === taskId);
    if (currentIdx === -1) return;
    const targetIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= dailyPriorities.length) return;

    const currentTask = dailyPriorities[currentIdx];
    const targetTask = dailyPriorities[targetIdx];

    setDailyPriorityRank(currentTask.id, targetIdx + 1);
    setDailyPriorityRank(targetTask.id, currentIdx + 1);
  };

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    addScheduleActivity({
      date: todayStr,
      title: newActivityTitle.trim(),
      startTime: newActivityStart,
      endTime: newActivityEnd,
      category: 'personal_development',
      completed: false,
    });

    setNewActivityTitle('');
    setShowAddActivityForm(false);
    showToast('Time block added to schedule');
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    const content = `### Daily Reflection\n\n**What went well:**\n${wentWell || 'Steady execution.'}\n\n**What could have been better:**\n${couldBeBetter || 'None.'}\n\n**Key lesson learned:**\n${learned || 'Consistency beats intensity.'}\n\n**Tomorrow Priority:**\n${tomorrowPriority || 'Follow 3 core priorities.'}`;

    addJournalEntry({
      title: reflectionTitle,
      content,
      date: todayStr,
      category: 'daily_reflection',
      mood: 'good',
      tags: ['reflection', 'daily-review'],
      reflectionQuestions: {
        wentWell,
        couldBeBetter,
        learned,
        tomorrowPriority,
      },
    });

    setReflectionSaved(true);
    showToast('Daily reflection saved to Journal');
    setTimeout(() => {
      setShowReflectionModal(false);
      setReflectionSaved(false);
      setWentWell('');
      setCouldBeBetter('');
      setLearned('');
      setTomorrowPriority('');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-accent font-medium tabular-nums">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Daily Execution Command Center
          </h1>
          <p className="text-xs text-ink-muted">
            Commit to the Top 3 priorities first. Guard your deep focus blocks against trivial urgency.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReflectionModal(true)}
          className="btn-press glass-control self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] sm:min-h-0 rounded-xl text-ink text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-brand-blue" />
          <span>Daily Reflection</span>
        </button>
      </div>

      {/* Main 2-Column Split: Priorities & Schedule Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): The 3 Core Priorities System */}
        <div className="lg:col-span-7 space-y-6">
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-accent" />
                  <span>The Three Core Priorities</span>
                </h2>
                <p className="text-xs text-ink-muted">
                  Visually emphasized anchors for today. Rank in order of importance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="text-xs text-brand-blue hover:underline flex items-center gap-1 font-medium whitespace-nowrap shrink-0 min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Priority</span>
              </button>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map(rank => {
                const task = dailyPriorities.find(t => t.priorityRank === rank);
                if (!task) {
                  return (
                    <div
                      key={rank}
                      className="p-4 rounded-xl border border-dashed border-line bg-surface-warm/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-ink tabular-nums">
                          0{rank}.
                        </span>
                        <span>No priority assigned for slot #{rank}</span>
                      </div>
                      <select
                        aria-label={`Assign task to priority slot ${rank}`}
                        onChange={e => {
                          if (e.target.value) {
                            setDailyPriorityRank(e.target.value, rank);
                          }
                        }}
                        className="px-3 py-2 min-h-[40px] sm:min-h-0 rounded-lg bg-surface border border-line text-ink text-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Assign from tasks...
                        </option>
                        {unscheduledTasks.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                const isDone = task.status === 'completed';
                const pColor = getPriorityColor(task.priority);

                return (
                  <motion.div
                    layout={!prefersReduced}
                    transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE }}
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                      isDone
                        ? 'bg-surface-warm/40 border-line opacity-70'
                        : 'bg-surface-warm/70 border-line hover:border-accent/60 card-hover'
                    }`}
                  >
                    <AnimatedCheckButton
                      checked={isDone}
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="mt-0.5"
                      ariaLabel={isDone ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-accent font-bold tabular-nums shrink-0">
                            0{rank}.
                          </span>
                          <span
                            className={`text-sm font-semibold truncate ${
                              isDone ? 'line-through text-ink-muted' : 'text-ink'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        {/* Reordering Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          {rank > 1 && (
                            <button
                              type="button"
                              onClick={() => handleMovePriority(task.id, 'up')}
                              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-inset transition-colors"
                              aria-label={`Move "${task.title}" priority up`}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {rank < dailyPriorities.length && (
                            <button
                              type="button"
                              onClick={() => handleMovePriority(task.id, 'down')}
                              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-inset transition-colors"
                              aria-label={`Move "${task.title}" priority down`}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDailyPriorityRank(task.id, undefined)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-surface-inset transition-colors"
                            aria-label={`Remove "${task.title}" from core priorities`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-ink-muted mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-line">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`font-medium capitalize ${pColor.text}`}>
                            {task.priority}
                          </span>
                          {task.dueTime && (
                            <>
                              <span aria-hidden="true" className="text-ink-muted">·</span>
                              <span className="text-ink-muted font-mono tabular-nums flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.dueTime}
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            startFocusTimer(25, { id: task.id, title: task.title });
                            setIsFocusTimerOpen(true);
                          }}
                          className="btn-press glass-accent-pill flex items-center gap-1.5 text-xs font-semibold text-accent-ink px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Focus</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Unscheduled Queue */}
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">
                Pending & Unscheduled Tasks ({unscheduledTasks.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="text-xs text-brand-blue font-medium hover:underline whitespace-nowrap shrink-0"
              >
                + Add Task
              </button>
            </div>

            <div className="divide-y divide-line border-t border-line max-h-72 overflow-y-auto">
              <AnimatePresence initial={false}>
                {unscheduledTasks.slice(0, 6).map(task => {
                  const isDone = task.status === 'completed';
                  return (
                    <motion.div
                      key={task.id}
                      layout={!prefersReduced}
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -8 }}
                      transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                      className={`flex items-center justify-between py-2.5 gap-3 min-h-[44px] ${
                        isDone ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AnimatedCheckButton
                          checked={isDone}
                          size="sm"
                          onClick={() => toggleTaskCompleted(task.id)}
                          ariaLabel={isDone ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
                        />
                        <span
                          className={`text-xs truncate font-medium transition-colors ${
                            isDone ? 'line-through text-ink-muted' : 'text-ink'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const nextRank = dailyPriorities.length + 1;
                          if (nextRank <= 3) {
                            setDailyPriorityRank(task.id, nextRank);
                          }
                        }}
                        disabled={dailyPriorities.length >= 3}
                        className="btn-press glass-control text-xs font-medium px-2.5 py-1 rounded-lg text-ink disabled:opacity-35 transition-colors whitespace-nowrap shrink-0"
                      >
                        + Top 3
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Daily Schedule Timeline & Habits */}
        <div className="lg:col-span-5 space-y-6">
          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span>Time-Blocked Schedule</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                className="text-xs text-brand-blue font-medium hover:underline whitespace-nowrap"
              >
                {showAddActivityForm ? 'Cancel' : '+ Block Time'}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showAddActivityForm && (
                <motion.form
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                  onSubmit={handleCreateActivity}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl bg-surface-warm border border-line space-y-2.5">
                    <input
                      type="text"
                      required
                      value={newActivityTitle}
                      onChange={e => setNewActivityTitle(e.target.value)}
                      placeholder="Activity title..."
                      className="w-full px-3 py-2 rounded-lg bg-surface border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
                    />
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={newActivityStart}
                        onChange={e => setNewActivityStart(e.target.value)}
                        aria-label="Start time"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink font-mono"
                      />
                      <input
                        type="time"
                        value={newActivityEnd}
                        onChange={e => setNewActivityEnd(e.target.value)}
                        aria-label="End time"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink font-mono"
                      />
                      <button
                        type="submit"
                        className="btn-press glass-accent-pill px-3.5 py-1.5 rounded-lg text-accent-ink font-semibold text-xs transition-colors whitespace-nowrap"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="divide-y divide-line border-t border-line">
              <AnimatePresence initial={false}>
                {scheduleActivities.length === 0 ? (
                  <p className="py-6 text-center text-xs text-ink-muted">
                    No blocks scheduled for today yet.
                  </p>
                ) : (
                  scheduleActivities.map(act => (
                    <motion.div
                      key={act.id}
                      layout={!prefersReduced}
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                      transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                      className={`py-2.5 flex items-center justify-between gap-3 min-h-[44px] ${
                        act.completed ? 'opacity-65' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AnimatedCheckButton
                          checked={act.completed}
                          size="sm"
                          onClick={() => toggleScheduleActivityCompleted(act.id)}
                          ariaLabel={act.completed ? `Uncheck ${act.title}` : `Complete ${act.title}`}
                        />
                        <div className="flex flex-col min-w-0">
                          <span
                            className={`text-xs font-medium truncate transition-colors ${
                              act.completed ? 'line-through text-ink-muted' : 'text-ink'
                            }`}
                          >
                            {act.title}
                          </span>
                          <span className="font-mono text-[11px] text-accent tabular-nums">
                            {act.startTime} — {act.endTime}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteScheduleActivity(act.id)}
                        className="btn-press text-ink-muted hover:text-danger p-1.5 rounded-lg transition-colors"
                        aria-label={`Delete block "${act.title}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sage" />
              <span>Today&apos;s Habits</span>
            </h2>
            <div className="divide-y divide-line border-t border-line">
              {activeHabits.map(habit => {
                const isDone = state.habitCompletions.some(
                  c => c.habitId === habit.id && c.date === todayStr && c.completed
                );
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between py-2.5 gap-3 min-h-[44px]"
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
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Daily Reflection Modal */}
      <ModalShell
        isOpen={showReflectionModal}
        onClose={() => setShowReflectionModal(false)}
        maxWidthClass="max-w-lg"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-semibold text-ink">
              End of Day Reflection
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowReflectionModal(false)}
            className="btn-press glass-control p-1.5 rounded-xl text-ink-muted hover:text-ink transition-colors"
            aria-label="Close reflection modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveReflection} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              1. What went well today?
            </label>
            <textarea
              rows={2}
              required
              value={wentWell}
              onChange={e => setWentWell(e.target.value)}
              placeholder="Completed uninterrupted deep work session, hit lifting numbers..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              2. What could have been better?
            </label>
            <textarea
              rows={2}
              value={couldBeBetter}
              onChange={e => setCouldBeBetter(e.target.value)}
              placeholder="Delayed afternoon study block, context switched too frequently..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              3. What did I learn?
            </label>
            <textarea
              rows={2}
              value={learned}
              onChange={e => setLearned(e.target.value)}
              placeholder="Starting small dissolves executive friction..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              4. What should I prioritize tomorrow?
            </label>
            <input
              type="text"
              required
              value={tomorrowPriority}
              onChange={e => setTomorrowPriority(e.target.value)}
              placeholder="e.g. Audit API authorization checks first thing in morning"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden"
            />
          </div>

          <AnimatePresence>
            {reflectionSaved && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-2.5 rounded-xl bg-success/15 border border-success/30 text-xs text-success flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Saved to private Journal!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowReflectionModal(false)}
              className="btn-press px-4 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press glass-accent-pill px-4 py-2 rounded-xl text-xs font-semibold text-accent-ink transition-colors"
            >
              Save to Journal
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
