import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Flame,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { WorkoutSet } from '../../types';
import {
  ModalShell,
  AnimatedNumber,
  StaggerContainer,
  StaggerItem,
  MOMENTUM_EASE,
} from '../common/MotionPrimitives';
import { GlassSegmentedControl } from '../common/LiquidGlass';

export const FitnessView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    logWorkoutSession,
    deleteWorkoutSession,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'sessions' | 'routines'>('sessions');
  const [showLogModal, setShowLogModal] = useState(false);

  const [selectedRoutine, setSelectedRoutine] = useState(
    state.workoutRoutines[0]?.name || 'Upper Body (Hypertrophy & Strength)'
  );
  const [sessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessionNotes, setSessionNotes] = useState('');

  const [sets, setSets] = useState<WorkoutSet[]>([
    { id: 's-1', exerciseId: 'e-1', exerciseName: 'Barbell Bench Press', setNumber: 1, reps: 6, weightKg: 85, completed: true },
    { id: 's-2', exerciseId: 'e-1', exerciseName: 'Barbell Bench Press', setNumber: 2, reps: 6, weightKg: 85, completed: true },
    { id: 's-3', exerciseId: 'e-2', exerciseName: 'Weighted Pull-Ups', setNumber: 1, reps: 8, weightKg: 15, completed: true },
  ]);

  const totalVolumeKg = state.workoutSessions.reduce((acc, sess) => {
    const sessionVolume = sess.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.reps * s.weightKg : 0), 0);
    return acc + sessionVolume;
  }, 0);

  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([
      ...sets,
      {
        id: `s-${Date.now()}`,
        exerciseId: 'custom',
        exerciseName: lastSet ? lastSet.exerciseName : 'Barbell Squat',
        setNumber: sets.length + 1,
        reps: lastSet ? lastSet.reps : 8,
        weightKg: lastSet ? lastSet.weightKg : 80,
        completed: true,
      },
    ]);
  };

  const handleRemoveSet = (idx: number) => {
    setSets(sets.filter((_, i) => i !== idx));
  };

  const handleLogWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (sets.length === 0) return;

    logWorkoutSession({
      routineName: selectedRoutine,
      date: sessionDate,
      durationMinutes: sessionDuration,
      sets,
      notes: sessionNotes.trim() || undefined,
    });

    setShowLogModal(false);
    showToast('Workout logged! Great session.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Physical Vitality & Training
          </h1>
          <p className="text-xs text-ink-muted">
            Build physical stamina, record compound lift progression, and track training volume.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <GlassSegmentedControl
            layoutId="fitness-tab-pill"
            size="sm"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { id: 'sessions', label: 'Logged Workouts', count: state.workoutSessions.length },
              { id: 'routines', label: 'Routines', count: state.workoutRoutines.length },
            ]}
          />

          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="btn-press group flex items-center gap-1.5 px-4 py-2 min-h-[44px] sm:min-h-0 rounded-xl glass-accent-pill text-xs transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            <span>Log Workout</span>
          </button>
        </div>
      </div>

      {/* Fitness Statistics */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Total Sessions</span>
          <div className="font-mono text-2xl font-bold text-ink mt-1 tabular-nums">
            <AnimatedNumber value={state.workoutSessions.length} />
          </div>
        </StaggerItem>
        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Cumulative Volume</span>
          <div className="font-mono text-2xl font-bold text-accent mt-1 tabular-nums">
            <AnimatedNumber value={totalVolumeKg} formatter={v => `${v.toLocaleString()} kg`} />
          </div>
        </StaggerItem>
        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Active Cadence</span>
          <div className="font-mono text-2xl font-bold text-success mt-1 tabular-nums">
            4x / week
          </div>
        </StaggerItem>
        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Bench Press PR</span>
          <div className="font-mono text-2xl font-bold text-ink mt-1 tabular-nums">
            87.5 kg
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Content */}
      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'sessions' ? (
          <motion.div
            key="fitness-sessions"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="space-y-4"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block px-1">
              Recent Workout Sessions
            </span>

            {state.workoutSessions.length === 0 ? (
              <div className="p-12 text-center text-ink-muted rounded-2xl bg-surface border border-line text-sm">
                No workouts logged yet. Hit &ldquo;Log Workout&rdquo; to record your first session!
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {state.workoutSessions.map(session => {
                  const sessionVolume = session.sets.reduce(
                    (acc, s) => acc + (s.completed ? s.reps * s.weightKg : 0),
                    0
                  );

                  return (
                    <motion.div
                      key={session.id}
                      layout={!prefersReduced}
                      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                      transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                      className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4 card-hover"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-accent" />
                          <h3 className="text-base font-bold text-ink">
                            {session.routineName}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-ink-muted tabular-nums">
                          <span>{session.date}</span>
                          <span>· {session.durationMinutes} mins</span>
                          <span className="text-accent font-bold">· {sessionVolume.toLocaleString()} kg</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteWorkoutSession(session.id);
                              showToast('Workout session deleted', 'info');
                            }}
                            className="btn-press text-ink-muted hover:text-danger transition-colors p-1"
                            title="Delete session"
                            aria-label="Delete workout session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {session.notes && (
                        <p className="text-xs text-ink-muted italic">
                          Note: &ldquo;{session.notes}&rdquo;
                        </p>
                      )}

                      {/* Sets Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-line text-ink-muted font-mono uppercase text-[10px]">
                              <th className="py-2">Exercise</th>
                              <th className="py-2">Set</th>
                              <th className="py-2">Weight</th>
                              <th className="py-2">Reps</th>
                              <th className="py-2 text-right">Volume</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {session.sets.map((set, sIdx) => (
                              <tr key={sIdx} className="text-ink">
                                <td className="py-2 font-medium">{set.exerciseName}</td>
                                <td className="py-2 font-mono text-ink-muted tabular-nums">#{set.setNumber}</td>
                                <td className="py-2 font-mono tabular-nums">{set.weightKg} kg</td>
                                <td className="py-2 font-mono tabular-nums">{set.reps} reps</td>
                                <td className="py-2 font-mono text-right text-accent font-semibold tabular-nums">
                                  {(set.reps * set.weightKg).toLocaleString()} kg
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="fitness-routines"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {state.workoutRoutines.map(routine => (
              <div
                key={routine.id}
                className="p-6 rounded-2xl bg-surface border border-line space-y-4 card-hover"
              >
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-bold text-ink">{routine.name}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-ink-muted tabular-nums">
                    {routine.exercises.length} exercises
                  </span>
                </div>

                {routine.description && (
                  <p className="text-xs text-ink-muted">{routine.description}</p>
                )}

                <div className="space-y-2">
                  {routine.exercises.map((ex, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-canvas border border-line text-xs"
                    >
                      <span className="font-medium text-ink">{ex.exerciseName}</span>
                      <span className="font-mono text-accent font-semibold tabular-nums">
                        {ex.defaultSets} × {ex.defaultReps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Workout Modal */}
      <ModalShell
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        maxWidthClass="max-w-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.03] shrink-0">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-bold text-ink">Log Training Session</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowLogModal(false)}
            className="btn-press glass-control p-1.5 rounded-xl text-ink-muted hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleLogWorkout} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Routine</label>
              <select
                value={selectedRoutine}
                onChange={e => setSelectedRoutine(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              >
                {state.workoutRoutines.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
                <option value="Custom Training Session">Custom Session</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Duration (min)</label>
              <input
                type="number"
                min="15"
                max="180"
                value={sessionDuration}
                onChange={e => setSessionDuration(parseInt(e.target.value) || 15)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs font-mono text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              />
            </div>
          </div>

          {/* Sets Editor */}
          <div className="space-y-2 pt-2 border-t border-line">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Recorded Sets</span>
              <button
                type="button"
                onClick={handleAddSet}
                className="btn-press text-xs font-semibold text-accent hover:underline"
              >
                + Add Set
              </button>
            </div>

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {sets.map((set, idx) => (
                  <motion.div
                    key={set.id}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -8 }}
                    transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                    className="p-2.5 rounded-xl bg-canvas border border-line flex flex-wrap items-center gap-2 text-xs"
                  >
                    <input
                      type="text"
                      value={set.exerciseName}
                      onChange={e => {
                        const updated = [...sets];
                        updated[idx].exerciseName = e.target.value;
                        setSets(updated);
                      }}
                      className="flex-1 min-w-[130px] px-2 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        value={set.weightKg}
                        onChange={e => {
                          const updated = [...sets];
                          updated[idx].weightKg = parseFloat(e.target.value) || 0;
                          setSets(updated);
                        }}
                        className="w-14 px-1.5 py-1.5 rounded-lg bg-surface border border-line text-xs font-mono text-ink text-center focus:ring-2 focus:ring-accent focus:outline-hidden"
                      />
                      <span className="text-[10px] text-ink-muted">kg</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => {
                          const updated = [...sets];
                          updated[idx].reps = parseInt(e.target.value) || 0;
                          setSets(updated);
                        }}
                        className="w-12 px-1.5 py-1.5 rounded-lg bg-surface border border-line text-xs font-mono text-ink text-center focus:ring-2 focus:ring-accent focus:outline-hidden"
                      />
                      <span className="text-[10px] text-ink-muted">reps</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSet(idx)}
                      className="btn-press text-ink-muted hover:text-danger p-1 transition-colors"
                      aria-label="Remove set"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Session Notes</label>
            <textarea
              rows={2}
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              placeholder="RPE, energy level, recovery..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowLogModal(false)}
              className="btn-press px-3 py-1.5 rounded-xl text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-xl text-xs glass-accent-pill transition-colors"
            >
              Save Workout
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
