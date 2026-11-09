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
import { useApp } from '../../lib/context';
import { getPriorityColor, formatMinutes } from '../../lib/logic';

export const TodayView: React.FC = () => {
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
    setTimeout(() => {
      setShowReflectionModal(false);
      setReflectionSaved(false);
      setWentWell('');
      setCouldBeBetter('');
      setLearned('');
      setTomorrowPriority('');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#D2925B]">
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
          <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
            Daily Execution Command Center
          </h1>
          <p className="text-xs text-[#A8A8A2]">
            Commit to the Top 3 priorities first. Guard your deep focus blocks against trivial urgency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReflectionModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#64432B] hover:bg-[#7E5437] text-[#F4F0E9] border border-[#D2925B]/40 text-xs font-semibold shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#D2925B]" />
            <span>Daily Reflection</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Priorities & Schedule Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): The 3 Core Priorities System */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top 3 Priorities Card */}
          <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9] flex items-center gap-2">
                  <SunMedium className="w-4 h-4 text-[#D2925B]" />
                  <span>The Three Core Priorities</span>
                </h2>
                <p className="text-xs text-[#868A7A]">
                  Visually emphasized anchors for today. Rank in order of importance.
                </p>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="text-xs text-[#D2925B] hover:underline flex items-center gap-1 font-medium"
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
                      className="p-4 rounded-xl border border-dashed border-[#434D56] bg-[#242B31]/30 flex items-center justify-between text-xs text-[#868A7A]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#868A7A] px-2 py-0.5 rounded bg-[#2E373F]">
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
                        className="px-2 py-1 rounded bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:outline-hidden"
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
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                      isDone
                        ? 'bg-[#242B31]/50 border-[#434D56]/40 opacity-70'
                        : 'bg-[#242B31] border-[#434D56] shadow-xs'
                    }`}
                  >
                    <button
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="mt-0.5 text-[#868A7A] hover:text-[#5B8C67] transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[#5B8C67] fill-[#5B8C67]/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#D2925B]/20 text-[#D2925B] font-bold">
                            #{rank}
                          </span>
                          <span
                            className={`text-sm font-semibold truncate ${
                              isDone ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'
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
                              className="p-1 rounded text-[#868A7A] hover:text-[#F4F0E9] hover:bg-[#2E373F]"
                              title="Move priority up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {rank < dailyPriorities.length && (
                            <button
                              onClick={() => handleMovePriority(task.id, 'down')}
                              className="p-1 rounded text-[#868A7A] hover:text-[#F4F0E9] hover:bg-[#2E373F]"
                              title="Move priority down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDailyPriorityRank(task.id, undefined)}
                            className="p-1 rounded text-[#868A7A] hover:text-[#E57373] hover:bg-[#2E373F]"
                            title="Remove from core priorities"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#A8A8A2] mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#434D56]/30">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${pColor.bg} ${pColor.text} ${pColor.border}`}
                          >
                            {task.priority}
                          </span>
                          {task.dueTime && (
                            <span className="text-[11px] text-[#A8A8A2] font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#868A7A]" />
                              {task.dueTime}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            startFocusTimer(25, { id: task.id, title: task.title });
                            setIsFocusTimerOpen(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-medium text-[#D2925B] hover:text-[#C2824B] px-2 py-0.5 rounded bg-[#D2925B]/10 hover:bg-[#D2925B]/20 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Focus On This</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unscheduled Queue */}
          <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F4F0E9]">
                Pending & Unscheduled Tasks ({unscheduledTasks.length})
              </h2>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="text-xs text-[#D2925B] hover:underline"
              >
                + Add Task
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {unscheduledTasks.slice(0, 6).map(task => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#242B31] border border-[#434D56] hover:border-[#868A7A] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="text-[#868A7A] hover:text-[#5B8C67] shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#5B8C67]" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`text-xs truncate ${isDone ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'}`}>
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
                        className="text-[10px] px-2 py-0.5 rounded bg-[#2E373F] text-[#D2925B] hover:bg-[#36414A] disabled:opacity-30 border border-[#434D56]"
                        title="Promote to Top 3 Priorities"
                      >
                        + Top 3
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Daily Schedule Timeline & Habits */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timeline View */}
          <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#D2925B]" />
                  <span>Time-Blocked Schedule</span>
                </h2>
              </div>
              <button
                onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                className="text-xs text-[#D2925B] hover:underline"
              >
                {showAddActivityForm ? 'Cancel' : '+ Block Time'}
              </button>
            </div>

            {/* Inline Add Activity Form */}
            {showAddActivityForm && (
              <form onSubmit={handleCreateActivity} className="p-3 rounded-xl bg-[#242B31] border border-[#434D56] space-y-2">
                <input
                  type="text"
                  required
                  value={newActivityTitle}
                  onChange={e => setNewActivityTitle(e.target.value)}
                  placeholder="Activity title..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newActivityStart}
                    onChange={e => setNewActivityStart(e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9]"
                  />
                  <input
                    type="time"
                    value={newActivityEnd}
                    onChange={e => setNewActivityEnd(e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-[#D2925B] text-[#242B31] font-semibold text-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Schedule Timeline List */}
            <div className="space-y-2.5">
              {scheduleActivities.map(act => (
                <div
                  key={act.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    act.completed
                      ? 'bg-[#242B31]/50 border-[#434D56]/40 opacity-70'
                      : 'bg-[#242B31] border-[#434D56]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleScheduleActivityCompleted(act.id)}
                      className="text-[#868A7A] hover:text-[#5B8C67]"
                    >
                      {act.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-[#5B8C67]" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-semibold truncate ${act.completed ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'}`}>
                        {act.title}
                      </span>
                      <span className="font-mono text-[10px] text-[#D2925B]">
                        {act.startTime} — {act.endTime}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteScheduleActivity(act.id)}
                    className="text-[#868A7A] hover:text-[#E57373] p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Habits */}
          <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F4F0E9] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D2925B]" />
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
                    className="flex items-center justify-between p-3 rounded-xl bg-[#242B31] border border-[#434D56]"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <button
                        onClick={() => toggleHabitCompletion(habit.id, todayStr)}
                        className="text-[#868A7A] hover:text-[#5B8C67] shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-[#5B8C67]" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`text-xs truncate ${isDone ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'}`}>
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
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#434D56] bg-[#22292F]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#D2925B]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">End of Day Reflection</h3>
              </div>
              <button
                onClick={() => setShowReflectionModal(false)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReflection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#D2925B] mb-1">
                  1. What went well today?
                </label>
                <textarea
                  rows={2}
                  required
                  value={wentWell}
                  onChange={e => setWentWell(e.target.value)}
                  placeholder="Completed uninterrupted deep work session, hit lifting numbers..."
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#868A7A] mb-1">
                  2. What could have been better?
                </label>
                <textarea
                  rows={2}
                  value={couldBeBetter}
                  onChange={e => setCouldBeBetter(e.target.value)}
                  placeholder="Delayed afternoon study block, context switched too frequently..."
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">
                  3. What did I learn?
                </label>
                <textarea
                  rows={2}
                  value={learned}
                  onChange={e => setLearned(e.target.value)}
                  placeholder="Starting small dissolves executive friction..."
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D2925B] mb-1">
                  4. What should I prioritize tomorrow?
                </label>
                <input
                  type="text"
                  required
                  value={tomorrowPriority}
                  onChange={e => setTomorrowPriority(e.target.value)}
                  placeholder="e.g. Audit API authorization checks first thing in morning"
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                />
              </div>

              {reflectionSaved && (
                <div className="p-2.5 rounded-lg bg-[#5B8C67]/20 border border-[#5B8C67]/40 text-xs text-[#5B8C67] flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Saved to private Journal!</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setShowReflectionModal(false)}
                  className="px-3 py-1.5 text-xs text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Save to Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
