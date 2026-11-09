import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Calendar,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  SkipForward,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { Habit, LifeArea } from '../../types';
import { calculateHabitStreak } from '../../lib/logic';

export const HabitsView: React.FC = () => {
  const {
    state,
    addHabit,
    deleteHabit,
    toggleHabitCompletion,
    skipHabitCompletion,
  } = useApp();

  const [showNewHabitModal, setShowNewHabitModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState<{ habitId: string; dateStr: string } | null>(null);
  const [skipReason, setSkipReason] = useState('');

  // New habit form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LifeArea>('personal_development');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays'>('daily');

  const todayStr = new Date().toISOString().split('T')[0];

  // Calendar dates for the past 14 days grid
  const past14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      dayLetter: d.toLocaleDateString([], { weekday: 'narrow' }),
      dayNumber: d.getDate(),
      isToday: i === 13,
    };
  });

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
      targetCountPerDay: 1,
      startDate: new Date().toISOString().split('T')[0],
      color: '#D2925B',
      active: true,
    });

    setName('');
    setDescription('');
    setShowNewHabitModal(false);
  };

  const handleConfirmSkip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSkipModal) return;
    skipHabitCompletion(showSkipModal.habitId, showSkipModal.dateStr, skipReason || 'Planned recovery');
    setShowSkipModal(null);
    setSkipReason('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Philosophy banner */}
      <div className="p-6 rounded-2xl bg-[#64432B]/60 border border-[#7E5437]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D2925B]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D2925B]">
              Sustainable Consistency Engine
            </span>
          </div>
          <p className="text-xs text-[#F4F0E9] max-w-2xl leading-relaxed">
            Habits compound quietly over months. Missing a single day is a normal part of life, not a failure.
            Use the &ldquo;Skip with reason&rdquo; feature to preserve your psychological momentum without guilt.
          </p>
        </div>

        <button
          onClick={() => setShowNewHabitModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Main Habits Table & Heatmap */}
      <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#434D56]/60">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
            Active Habit Tracker ({state.habits.length})
          </h2>
          <span className="text-xs text-[#868A7A]">14-Day View</span>
        </div>

        {state.habits.length === 0 ? (
          <div className="py-12 text-center text-[#868A7A]">
            No habits configured yet.
          </div>
        ) : (
          <div className="space-y-4">
            {state.habits.map(habit => {
              const streak = calculateHabitStreak(habit, state.habitCompletions, todayStr);

              return (
                <div
                  key={habit.id}
                  className="p-4 rounded-xl bg-[#242B31] border border-[#434D56] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Habit Info & Streaks */}
                  <div className="space-y-1.5 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#F4F0E9]">{habit.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#2E373F] text-[#868A7A]">
                        {habit.frequency}
                      </span>
                    </div>

                    {habit.description && (
                      <p className="text-xs text-[#A8A8A2]">{habit.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs font-mono text-[#868A7A] pt-1">
                      <span className="text-[#D2925B] font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {streak.currentStreak}d streak
                      </span>
                      <span>Best: {streak.longestStreak}d</span>
                      <span>30d rate: {streak.last30DaysRate}%</span>
                    </div>
                  </div>

                  {/* Right: 14-Day Interactive Matrix */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {past14Days.map(day => {
                      const completion = state.habitCompletions.find(
                        c => c.habitId === habit.id && c.date === day.dateStr
                      );
                      const isCompleted = Boolean(completion && completion.completed);
                      const isSkipped = Boolean(completion && completion.skipped);

                      return (
                        <div key={day.dateStr} className="flex flex-col items-center gap-1">
                          <span
                            className={`text-[9px] font-mono ${
                              day.isToday ? 'text-[#D2925B] font-bold' : 'text-[#868A7A]'
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                          <button
                            onClick={() => toggleHabitCompletion(habit.id, day.dateStr)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-[#5B8C67] text-[#242B31] font-bold shadow-xs'
                                : isSkipped
                                ? 'bg-[#868A7A]/30 text-[#868A7A] border border-[#868A7A]/50'
                                : 'bg-[#2E373F] hover:bg-[#36414A] border border-[#434D56]'
                            }`}
                            title={`${day.dateStr}: ${isCompleted ? 'Completed' : isSkipped ? 'Skipped with reason' : 'Incomplete'}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 fill-current" />
                            ) : isSkipped ? (
                              <span className="text-[10px]">⏸</span>
                            ) : (
                              <Circle className="w-3.5 h-3.5 opacity-20" />
                            )}
                          </button>
                        </div>
                      );
                    })}

                    {/* Quick Skip Button for Today */}
                    <button
                      onClick={() => setShowSkipModal({ habitId: habit.id, dateStr: todayStr })}
                      className="ml-2 text-[10px] text-[#868A7A] hover:text-[#D2925B] flex items-center gap-0.5 px-2 py-1 rounded bg-[#2E373F] border border-[#434D56]"
                      title="Skip today with intentional reason"
                    >
                      <SkipForward className="w-3 h-3" />
                      <span>Skip</span>
                    </button>

                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-[#868A7A] hover:text-[#E57373] p-1.5 ml-1"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Habit Modal */}
      {showNewHabitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#434D56] bg-[#22292F]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D2925B]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">Establish New Habit</h3>
              </div>
              <button
                onClick={() => setShowNewHabitModal(false)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Habit Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 20-minute daily systems architecture reading"
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Description / Cue</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Trigger: right after morning coffee; without phone notifications..."
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as LifeArea)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  >
                    <option value="personal_development">Personal Development</option>
                    <option value="education">Education</option>
                    <option value="fitness">Fitness</option>
                    <option value="health">Health</option>
                    <option value="career">Career</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Cadence</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as 'daily' | 'weekdays')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  >
                    <option value="daily">Daily (7 days / week)</option>
                    <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setShowNewHabitModal(false)}
                  className="px-3 py-1.5 text-xs text-[#868A7A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Start Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skip with Reason Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-sm bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#434D56] bg-[#22292F] flex items-center justify-between">
              <span className="text-xs font-bold text-[#F4F0E9]">Skip Day with Reason</span>
              <button
                onClick={() => setShowSkipModal(null)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmSkip} className="p-5 space-y-3">
              <p className="text-xs text-[#A8A8A2]">
                Skipping intentionally preserves your streak calculation and prevents guilt.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-[#868A7A] mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={skipReason}
                  onChange={e => setSkipReason(e.target.value)}
                  placeholder="e.g. Travel day / Restorative rest"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSkipModal(null)}
                  className="px-3 py-1 text-xs text-[#868A7A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#868A7A] text-[#242B31] font-semibold text-xs"
                >
                  Confirm Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
