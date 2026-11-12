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
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { Habit, LifeArea } from '../../types';
import { calculateHabitStreak } from '../../lib/logic';
import { ModalShell, MOMENTUM_EASE } from '../common/MotionPrimitives';

export const HabitsView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    addHabit,
    deleteHabit,
    toggleHabitCompletion,
    skipHabitCompletion,
    showToast,
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
      color: '#8EC5FF',
      active: true,
    });

    setName('');
    setDescription('');
    setShowNewHabitModal(false);
    showToast('New habit established');
  };

  const handleConfirmSkip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSkipModal) return;
    skipHabitCompletion(showSkipModal.habitId, showSkipModal.dateStr, skipReason || 'Planned recovery');
    setShowSkipModal(null);
    setSkipReason('');
    showToast('Habit day skipped intentionally', 'info');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Philosophy banner */}
      <div className="p-6 rounded-2xl bg-[#3B2418] border border-[#5A3927] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8EC5FF]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8EC5FF]">
              Sustainable Consistency Engine
            </span>
          </div>
          <p className="text-xs text-[#F2E8DA] max-w-2xl leading-relaxed">
            Habits compound quietly over months. Missing a single day is a normal part of life, not a failure.
            Use the &ldquo;Skip with reason&rdquo; feature to preserve your psychological momentum without guilt.
          </p>
        </div>

        <button
          onClick={() => setShowNewHabitModal(true)}
          className="btn-press group flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Main Habits Table & Heatmap */}
      <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D6C6B2]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
            Active Habit Tracker ({state.habits.length})
          </h2>
          <span className="text-xs text-[#6E5648]">14-Day View</span>
        </div>

        {state.habits.length === 0 ? (
          <div className="py-12 text-center text-[#6E5648]">
            No habits configured yet.
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {state.habits.map(habit => {
                const streak = calculateHabitStreak(habit, state.habitCompletions, todayStr);

                return (
                  <motion.div
                    key={habit.id}
                    layout={!prefersReduced}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                    transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                    className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] flex flex-col lg:flex-row lg:items-center justify-between gap-4 card-hover"
                  >
                    {/* Left: Habit Info & Streaks */}
                    <div className="space-y-1.5 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#3B2418]">{habit.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#FAF5ED] border border-[#D6C6B2] text-[#6E5648]">
                          {habit.frequency}
                        </span>
                      </div>

                      {habit.description && (
                        <p className="text-xs text-[#6E5648]">{habit.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs font-mono text-[#6E5648] pt-1">
                        <motion.span
                          key={streak.currentStreak}
                          initial={prefersReduced ? false : { scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.18, ease: MOMENTUM_EASE }}
                          className="text-[#1E5A99] font-bold flex items-center gap-1"
                        >
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          {streak.currentStreak}d streak
                        </motion.span>
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
                                day.isToday ? 'text-[#1E5A99] font-bold' : 'text-[#6E5648]'
                              }`}
                            >
                              {day.dayNumber}
                            </span>
                            <motion.button
                              type="button"
                              whileTap={prefersReduced ? undefined : { scale: 0.84 }}
                              onClick={() => toggleHabitCompletion(habit.id, day.dateStr)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                                isCompleted
                                  ? 'bg-[#3E7B52] text-[#FAF5ED] font-bold shadow-xs'
                                  : isSkipped
                                  ? 'bg-[#EAE0D0] text-[#6E5648] border border-[#D6C6B2]'
                                  : 'bg-[#FAF5ED] hover:bg-[#8EC5FF]/30 border border-[#D6C6B2] text-[#6E5648]'
                              }`}
                              title={`${day.dateStr}: ${isCompleted ? 'Completed' : isSkipped ? 'Skipped with reason' : 'Incomplete'}`}
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {isCompleted ? (
                                  <motion.span
                                    key="done"
                                    initial={prefersReduced ? { opacity: 1 } : { scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={prefersReduced ? { opacity: 0 } : { scale: 0.7, opacity: 0 }}
                                    transition={{ duration: 0.14, ease: MOMENTUM_EASE }}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </motion.span>
                                ) : isSkipped ? (
                                  <motion.span
                                    key="skip"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                    className="text-[10px]"
                                  >
                                    ⏸
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                  >
                                    <Circle className="w-3.5 h-3.5 opacity-30" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          </div>
                        );
                      })}

                      {/* Quick Skip Button for Today */}
                      <button
                        onClick={() => setShowSkipModal({ habitId: habit.id, dateStr: todayStr })}
                        className="btn-press ml-2 text-[10px] text-[#6E5648] hover:text-[#1E5A99] flex items-center gap-0.5 px-2 py-1 rounded bg-[#FAF5ED] border border-[#D6C6B2] transition-colors"
                        title="Skip today with intentional reason"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>Skip</span>
                      </button>

                      <button
                        onClick={() => {
                          deleteHabit(habit.id);
                          showToast('Habit removed', 'info');
                        }}
                        className="btn-press text-[#6E5648] hover:text-[#B84A44] p-1.5 ml-1 transition-colors"
                        title="Delete Habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* New Habit Modal */}
      <ModalShell
        isOpen={showNewHabitModal}
        onClose={() => setShowNewHabitModal(false)}
        maxWidthClass="max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8EC5FF]" />
            <h3 className="text-sm font-bold text-[#F2E8DA]">Establish New Habit</h3>
          </div>
          <button
            onClick={() => setShowNewHabitModal(false)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateHabit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Habit Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 20-minute daily systems architecture reading"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Description / Cue</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Trigger: right after morning coffee; without phone notifications..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as LifeArea)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              >
                <option value="personal_development">Personal Development</option>
                <option value="education">Education</option>
                <option value="fitness">Fitness</option>
                <option value="health">Health</option>
                <option value="career">Career</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Cadence</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as 'daily' | 'weekdays')}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              >
                <option value="daily">Daily (7 days / week)</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={() => setShowNewHabitModal(false)}
              className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-xs transition-colors"
            >
              Start Habit
            </button>
          </div>
        </form>
      </ModalShell>

      {/* Skip with Reason Modal */}
      <ModalShell
        isOpen={Boolean(showSkipModal)}
        onClose={() => setShowSkipModal(null)}
        maxWidthClass="max-w-sm"
      >
        <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
          <span className="text-xs font-bold text-[#F2E8DA]">Skip Day with Reason</span>
          <button
            onClick={() => setShowSkipModal(null)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleConfirmSkip} className="p-5 space-y-3">
          <p className="text-xs text-[#6E5648]">
            Skipping intentionally preserves your streak calculation and prevents guilt.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-[#6E5648] mb-1">Reason</label>
            <input
              type="text"
              required
              value={skipReason}
              onChange={e => setSkipReason(e.target.value)}
              placeholder="e.g. Travel day / Restorative rest"
              className="w-full px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSkipModal(null)}
              className="btn-press px-3 py-1 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-3 py-1 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-colors"
            >
              Confirm Skip
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
