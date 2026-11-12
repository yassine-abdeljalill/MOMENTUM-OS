import React, { useState } from 'react';
import {
  SunMedium,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Sparkles,
  Timer,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Trash2,
  Calendar,
  AlertCircle,
  Play,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { getPriorityColor, formatMinutes } from '../../lib/logic';
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
  const [reflectionTitle, setReflectionTitle] = useState(
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#1E5A99] font-semibold">
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
          <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
            Daily Execution Command Center
          </h1>
          <p className="text-xs text-[#6E5648]">
            Commit to the Top 3 priorities first. Guard your deep focus blocks against trivial urgency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReflectionModal(true)}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B2418] hover:bg-[#4D3021] text-[#F2E8DA] border border-[#5A3927] text-xs font-semibold shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#8EC5FF]" />
            <span>Daily Reflection</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Priorities & Schedule Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): The 3 Core Priorities System */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top 3 Priorities Card */}
          <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418] flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-[#1E5A99]" />
                  <span>The Three Core Priorities</span>
                </h2>
                <p className="text-xs text-[#6E5648]">
                  Visually emphasized anchors for today. Rank in order of importance.
                </p>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="text-xs text-[#1E5A99] hover:underline flex items-center gap-1 font-semibold"
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
                      className="p-4 rounded-xl border border-dashed border-[#D6C6B2] bg-[#F2E8DA]/60 flex items-center justify-between text-xs text-[#6E5648]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#3B2418] px-2 py-0.5 rounded bg-[#EAE0D0]">
                          #{rank}
                        </span>
                        <span>No priority assigned for slot #{rank}</span>
                      </div>
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            setDailyPriorityRank(e.target.value, rank);
                          }
                        }}
                        className="px-2 py-1 rounded bg-[#FAF5ED] border border-[#D6C6B2] text-[#3B2418] text-xs focus:outline-hidden"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign from tasks...</option>
                        {unscheduledTasks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
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
                        ? 'bg-[#EAE0D0]/60 border-[#D6C6B2] opacity-75'
                        : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF] shadow-xs card-hover'
                    }`}
                  >
                    <AnimatedCheckButton
                      checked={isDone}
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="mt-0.5"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#8EC5FF] text-[#3B2418] font-bold">
                            #{rank}
                          </span>
                          <span
                            className={`text-sm font-semibold truncate ${
                              isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        {/* Reordering Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          {rank > 1 && (
                            <button
                              onClick={() => handleMovePriority(task.id, 'up')}
                              className="p-1 rounded text-[#6E5648] hover:text-[#3B2418] hover:bg-[#EAE0D0]"
                              title="Move priority up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {rank < dailyPriorities.length && (
                            <button
                              onClick={() => handleMovePriority(task.id, 'down')}
                              className="p-1 rounded text-[#6E5648] hover:text-[#3B2418] hover:bg-[#EAE0D0]"
                              title="Move priority down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDailyPriorityRank(task.id, undefined)}
                            className="p-1 rounded text-[#6E5648] hover:text-[#B84A44] hover:bg-[#EAE0D0]"
                            title="Remove from core priorities"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#6E5648] mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#D6C6B2]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${pColor.bg} ${pColor.text} ${pColor.border}`}
                          >
                            {task.priority}
                          </span>
                          {task.dueTime && (
                            <span className="text-[11px] text-[#6E5648] font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#3B2418]" />
                              {task.dueTime}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            startFocusTimer(25, { id: task.id, title: task.title });
                            setIsFocusTimerOpen(true);
                          }}
                          className="btn-press flex items-center gap-1 text-[11px] font-semibold text-[#3B2418] px-2.5 py-1 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] border border-[#3B2418]/15 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Focus On This</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Unscheduled Queue */}
          <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
                Pending & Unscheduled Tasks ({unscheduledTasks.length})
              </h2>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="text-xs text-[#1E5A99] font-semibold hover:underline"
              >
                + Add Task
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                        isDone
                          ? 'bg-[#EAE0D0]/60 border-[#D6C6B2] opacity-75'
                          : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AnimatedCheckButton
                          checked={isDone}
                          size="sm"
                          onClick={() => toggleTaskCompleted(task.id)}
                        />
                        <span className={`text-xs truncate font-medium transition-colors ${isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            const nextRank = dailyPriorities.length + 1;
                            if (nextRank <= 3) {
                              setDailyPriorityRank(task.id, nextRank);
                            }
                          }}
                          disabled={dailyPriorities.length >= 3}
                          className="btn-press text-[10px] font-semibold px-2 py-0.5 rounded bg-[#8EC5FF]/60 text-[#3B2418] hover:bg-[#8EC5FF] disabled:opacity-35 border border-[#8EC5FF] transition-colors"
                          title="Promote to Top 3 Priorities"
                        >
                          + Top 3
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Daily Schedule Timeline & Habits */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timeline View */}
          <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1E5A99]" />
                  <span>Time-Blocked Schedule</span>
                </h2>
              </div>
              <button
                onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                className="text-xs text-[#1E5A99] font-semibold hover:underline"
              >
                {showAddActivityForm ? 'Cancel' : '+ Block Time'}
              </button>
            </div>

            {/* Inline Add Activity Form */}
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
                  <div className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-2">
                    <input
                      type="text"
                      required
                      value={newActivityTitle}
                      onChange={e => setNewActivityTitle(e.target.value)}
                      placeholder="Activity title..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden focus:ring-2 focus:ring-[#8EC5FF]"
                    />
                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={newActivityStart}
                        onChange={e => setNewActivityStart(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418]"
                      />
                      <input
                        type="time"
                        value={newActivityEnd}
                        onChange={e => setNewActivityEnd(e.target.value)}
                        className="flex-1 px-2 py-1 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418]"
                      />
                      <button
                        type="submit"
                        className="btn-press px-3 py-1 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-semibold text-xs border border-[#3B2418]/15 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Schedule Timeline List */}
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {scheduleActivities.map(act => (
                  <motion.div
                    key={act.id}
                    layout={!prefersReduced}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                    transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                      act.completed
                        ? 'bg-[#EAE0D0]/60 border-[#D6C6B2] opacity-75'
                        : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AnimatedCheckButton
                        checked={act.completed}
                        size="sm"
                        onClick={() => toggleScheduleActivityCompleted(act.id)}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-semibold truncate transition-colors ${act.completed ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
                          {act.title}
                        </span>
                        <span className="font-mono text-[10px] text-[#1E5A99] font-semibold">
                          {act.startTime} — {act.endTime}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteScheduleActivity(act.id)}
                      className="btn-press text-[#6E5648] hover:text-[#B84A44] p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Today's Habits */}
          <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3B2418] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1E5A99]" />
                <span>Today&apos;s Habits</span>
              </h2>
            </div>
            <div className="space-y-2">
              {activeHabits.map(habit => {
                const isDone = state.habitCompletions.some(
                  c => c.habitId === habit.id && c.date === todayStr && c.completed
                );
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                      isDone
                        ? 'bg-[#EAE0D0]/70 border-[#3E7B52]/35'
                        : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <AnimatedCheckButton
                        checked={isDone}
                        size="sm"
                        onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                      />
                      <span className={`text-xs font-medium truncate transition-colors ${isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
                        {habit.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Reflection Modal */}
      <ModalShell
        isOpen={showReflectionModal}
        onClose={() => setShowReflectionModal(false)}
        maxWidthClass="max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8EC5FF]" />
            <h3 className="text-sm font-bold text-[#F2E8DA]">End of Day Reflection</h3>
          </div>
          <button
            onClick={() => setShowReflectionModal(false)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveReflection} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E5A99] mb-1">
              1. What went well today?
            </label>
            <textarea
              rows={2}
              required
              value={wentWell}
              onChange={e => setWentWell(e.target.value)}
              placeholder="Completed uninterrupted deep work session, hit lifting numbers..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              2. What could have been better?
            </label>
            <textarea
              rows={2}
              value={couldBeBetter}
              onChange={e => setCouldBeBetter(e.target.value)}
              placeholder="Delayed afternoon study block, context switched too frequently..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              3. What did I learn?
            </label>
            <textarea
              rows={2}
              value={learned}
              onChange={e => setLearned(e.target.value)}
              placeholder="Starting small dissolves executive friction..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E5A99] mb-1">
              4. What should I prioritize tomorrow?
            </label>
            <input
              type="text"
              required
              value={tomorrowPriority}
              onChange={e => setTomorrowPriority(e.target.value)}
              placeholder="e.g. Audit API authorization checks first thing in morning"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <AnimatePresence>
            {reflectionSaved && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-2.5 rounded-lg bg-[#3E7B52]/15 border border-[#3E7B52]/40 text-xs text-[#2D6240] flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Saved to private Journal!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={() => setShowReflectionModal(false)}
              className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 transition-colors"
            >
              Save to Journal
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
