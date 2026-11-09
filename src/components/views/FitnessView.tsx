import React, { useState } from 'react';
import {
  Dumbbell,
  Plus,
  Calendar,
  CheckCircle2,
  Trash2,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { WorkoutRoutine, WorkoutSession, WorkoutSet } from '../../types';

export const FitnessView: React.FC = () => {
  const {
    state,
    addWorkoutRoutine,
    logWorkoutSession,
    deleteWorkoutSession,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'sessions' | 'routines'>('sessions');
  const [showLogModal, setShowLogModal] = useState(false);

  // New Workout Session Form State
  const [selectedRoutine, setSelectedRoutine] = useState(
    state.workoutRoutines[0]?.name || 'Upper Body (Hypertrophy & Strength)'
  );
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessionNotes, setSessionNotes] = useState('');

  // Sets state for the session being logged
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
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
            Physical Vitality & Training
          </h1>
          <p className="text-xs text-[#A8A8A2]">
            Build physical stamina, record compound lift progression, and track training volume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#242B31] p-1 rounded-xl border border-[#434D56] text-xs">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'sessions' ? 'bg-[#D2925B] text-[#242B31] font-bold' : 'text-[#868A7A]'
              }`}
            >
              Logged Workouts ({state.workoutSessions.length})
            </button>
            <button
              onClick={() => setActiveTab('routines')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'routines' ? 'bg-[#D2925B] text-[#242B31] font-bold' : 'text-[#868A7A]'
              }`}
            >
              Routines ({state.workoutRoutines.length})
            </button>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Workout</span>
          </button>
        </div>
      </div>

      {/* Fitness Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Total Sessions</span>
          <div className="font-mono text-2xl font-bold text-[#F4F0E9] mt-1">
            {state.workoutSessions.length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Cumulative Volume</span>
          <div className="font-mono text-2xl font-bold text-[#D2925B] mt-1">
            {totalVolumeKg.toLocaleString()} kg
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Active Cadence</span>
          <div className="font-mono text-2xl font-bold text-[#5B8C67] mt-1">
            4x / week
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Bench Press PR</span>
          <div className="font-mono text-2xl font-bold text-[#F4F0E9] mt-1">
            87.5 kg
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'sessions' ? (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A8A8A2] block px-1">
            Recent Workout Sessions
          </span>

          {state.workoutSessions.length === 0 ? (
            <div className="p-12 text-center text-[#868A7A] rounded-2xl bg-[#2E373F] border border-[#434D56]">
              No workouts logged yet. Hit &ldquo;Log Workout&rdquo; to record your first session!
            </div>
          ) : (
            state.workoutSessions.map(session => {
              const sessionVolume = session.sets.reduce(
                (acc, s) => acc + (s.completed ? s.reps * s.weightKg : 0),
                0
              );

              return (
                <div
                  key={session.id}
                  className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#434D56]/60">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-[#D2925B]" />
                      <h3 className="text-base font-bold text-[#F4F0E9]">
                        {session.routineName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-[#868A7A]">
                      <span>{session.date}</span>
                      <span>• {session.durationMinutes} mins</span>
                      <span className="text-[#D2925B] font-bold">• {sessionVolume.toLocaleString()} kg</span>
                      <button
                        onClick={() => deleteWorkoutSession(session.id)}
                        className="text-[#868A7A] hover:text-[#E57373] transition-colors p-1"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {session.notes && (
                    <p className="text-xs text-[#A8A8A2] italic">
                      Note: &ldquo;{session.notes}&rdquo;
                    </p>
                  )}

                  {/* Sets Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[#434D56]/40 text-[#868A7A] font-mono uppercase text-[10px]">
                          <th className="py-2">Exercise</th>
                          <th className="py-2">Set</th>
                          <th className="py-2">Weight</th>
                          <th className="py-2">Reps</th>
                          <th className="py-2 text-right">Volume</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#434D56]/30">
                        {session.sets.map((set, sIdx) => (
                          <tr key={sIdx} className="text-[#F4F0E9]">
                            <td className="py-2 font-medium">{set.exerciseName}</td>
                            <td className="py-2 font-mono text-[#868A7A]">#{set.setNumber}</td>
                            <td className="py-2 font-mono">{set.weightKg} kg</td>
                            <td className="py-2 font-mono">{set.reps} reps</td>
                            <td className="py-2 font-mono text-right text-[#D2925B]">
                              {(set.reps * set.weightKg).toLocaleString()} kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Routines View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {state.workoutRoutines.map(routine => (
            <div
              key={routine.id}
              className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#434D56]/60">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#D2925B]" />
                  <h3 className="text-sm font-bold text-[#F4F0E9]">{routine.name}</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#242B31] text-[#868A7A]">
                  {routine.exercises.length} exercises
                </span>
              </div>

              {routine.description && (
                <p className="text-xs text-[#A8A8A2]">{routine.description}</p>
              )}

              <div className="space-y-2">
                {routine.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#242B31] text-xs"
                  >
                    <span className="font-medium text-[#F4F0E9]">{ex.exerciseName}</span>
                    <span className="font-mono text-[#D2925B]">
                      {ex.defaultSets} × {ex.defaultReps}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Workout Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-xl bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#434D56] bg-[#22292F]">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#D2925B]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">Log Training Session</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogWorkout} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Routine</label>
                  <select
                    value={selectedRoutine}
                    onChange={e => setSelectedRoutine(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  >
                    {state.workoutRoutines.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                    <option value="Custom Training Session">Custom Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={sessionDuration}
                    onChange={e => setSessionDuration(parseInt(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Sets Editor */}
              <div className="space-y-2 pt-2 border-t border-[#434D56]/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F4F0E9]">Recorded Sets</span>
                  <button
                    type="button"
                    onClick={handleAddSet}
                    className="text-xs text-[#D2925B] hover:underline"
                  >
                    + Add Set
                  </button>
                </div>

                <div className="space-y-2">
                  {sets.map((set, idx) => (
                    <div
                      key={set.id}
                      className="p-2.5 rounded-lg bg-[#2E373F] border border-[#434D56] flex flex-wrap items-center gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={set.exerciseName}
                        onChange={e => {
                          const updated = [...sets];
                          updated[idx].exerciseName = e.target.value;
                          setSets(updated);
                        }}
                        className="flex-1 min-w-[130px] px-2 py-1 rounded bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9]"
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
                          className="w-14 px-1.5 py-1 rounded bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] text-center"
                        />
                        <span className="text-[10px] text-[#868A7A]">kg</span>
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
                          className="w-12 px-1.5 py-1 rounded bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] text-center"
                        />
                        <span className="text-[10px] text-[#868A7A]">reps</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(idx)}
                        className="text-[#868A7A] hover:text-[#E57373] p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Session Notes</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="RPE, energy level, recovery..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-xs text-[#868A7A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Save Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
