import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Pause,
  SkipForward,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { LifeArea } from '../../types';
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

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LifeArea>('personal_development');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays'>('daily');

  const todayStr = new Date().toISOString().split('T')[0];

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
      <div className="p-6 rounded-2xl bg-brand dark:bg-surface-warm border border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent">
              Sustainable Consistency Engine
            </span>
          </div>
          <p className="text-xs text-brand-ink/90 dark:text-ink-muted max-w-2xl leading-relaxed">
            Habits compound quietly over months. Missing a single day is a normal part of life, not a failure.
            Use the &ldquo;Skip with reason&rdquo; feature to preserve your momentum without guilt.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewHabitModal(true)}
          className="btn-press group flex items-center gap-1.5 px-4 py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Main Habits Table & Heatmap */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
            Active Habit Tracker ({state.habits.length})
          </h2>
          <span className="text-xs font-mono text-ink-muted tabular-nums">14-Day View</span>
        </div>

        {state.habits.length === 0 ? (
          <div className="py-12 text-center text-ink-muted text-sm">
            No habits configured yet.
          </div>
        ) : (
          <div className="space-y-3">
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
                    className="p-4 rounded-xl bg-canvas border border-line flex flex-col lg:flex-row lg:items-center justify-between gap-4 card-hover"
                  >
                    {/* Left: Habit Info & Streaks */}
                    <div className="space-y-1.5 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{habit.name}</span>
                        <span className="text-[10px] uppercase font-mono text-ink-muted">
                          · {habit.frequency}
                        </span>
                      </div>

                      {habit.description && (
                        <p className="text-xs text-ink-muted">{habit.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-ink-muted pt-1 tabular-nums">
                        <motion.span
                          key={streak.currentStreak}
                          initial={prefersReduced ? false : { scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.18, ease: MOMENTUM_EASE }}
                          className="text-accent font-bold flex items-center gap-1"
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
                          <div key={day.dateStr} className="flex flex-col items-center gap-1 shrink-0">
                            <span
                              className={`text-[9px] font-mono tabular-nums ${
                                day.isToday ? 'text-accent font-bold' : 'text-ink-muted'
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
                                  ? 'bg-success text-white font-bold'
                                  : isSkipped
                                  ? 'bg-surface-inset text-ink-muted border border-line'
                                  : 'bg-surface hover:bg-accent/20 border border-line text-ink-muted'
                              }`}
                              title={`${day.dateStr}: ${isCompleted ? 'Completed' : isSkipped ? 'Skipped with reason' : 'Incomplete'}`}
                              aria-label={`${habit.name} on ${day.dateStr}: ${
                                isCompleted ? 'Completed' : isSkipped ? 'Skipped' : 'Incomplete'
                              }`}
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
                                  >
                                    <Pause className="w-3.5 h-3.5" />
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                  >
                                    <Circle className="w-3.5 h-3.5 opacity-35" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          </div>
                        );
                      })}

                      {/* Quick Skip Button for Today */}
                      <button
                        type="button"
                        onClick={() => setShowSkipModal({ habitId: habit.id, dateStr: todayStr })}
                        className="btn-press ml-2 text-[11px] text-ink-muted hover:text-ink flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-line transition-colors whitespace-nowrap shrink-0"
                        title="Skip today with intentional reason"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>Skip</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteHabit(habit.id);
                          showToast('Habit removed', 'info');
                        }}
                        className="btn-press text-ink-muted hover:text-danger p-1.5 ml-1 transition-colors shrink-0"
                        title="Delete Habit"
                        aria-label={`Delete ${habit.name}`}
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-brand dark:bg-surface-warm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-brand-ink dark:text-ink">Establish New Habit</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNewHabitModal(false)}
            className="text-brand-ink/80 dark:text-ink-muted hover:text-brand-ink dark:hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateHabit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Habit Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. 20-minute daily systems architecture reading"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Description / Cue</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Trigger: right after morning coffee; without phone notifications..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as LifeArea)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              >
                <option value="personal_development">Personal Development</option>
                <option value="education">Education</option>
                <option value="fitness">Fitness</option>
                <option value="health">Health</option>
                <option value="career">Career</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Cadence</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as 'daily' | 'weekdays')}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              >
                <option value="daily">Daily (7 days / week)</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setShowNewHabitModal(false)}
              className="btn-press px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:bg-accent-hover transition-colors"
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
        <div className="px-5 py-3.5 border-b border-line bg-brand dark:bg-surface-warm flex items-center justify-between">
          <span className="text-xs font-bold text-brand-ink dark:text-ink">Skip Day with Reason</span>
          <button
            type="button"
            onClick={() => setShowSkipModal(null)}
            className="text-brand-ink/80 dark:text-ink-muted hover:text-brand-ink dark:hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleConfirmSkip} className="p-5 space-y-3">
          <p className="text-xs text-ink-muted">
            Skipping intentionally preserves your streak calculation and prevents guilt.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted mb-1">Reason</label>
            <input
              type="text"
              required
              value={skipReason}
              onChange={e => setSkipReason(e.target.value)}
              placeholder="e.g. Travel day / Restorative rest"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowSkipModal(null)}
              className="btn-press px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors"
            >
              Confirm Skip
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
