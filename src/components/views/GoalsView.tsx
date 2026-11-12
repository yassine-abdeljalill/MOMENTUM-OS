import React, { useState } from 'react';
import {
  Target,
  Plus,
  Compass,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  TrendingUp,
  FolderGit2,
  CheckSquare,
  Sparkles,
  Edit3,
  Trash2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { Goal, GoalMilestone, LifeArea, Priority } from '../../types';
import { calculateGoalProgress, getPriorityColor } from '../../lib/logic';

export const GoalsView: React.FC = () => {
  const {
    state,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalMilestone,
    addNinetyDayPlan,
    togglePlanCheckpoint,
    selectedGoalId,
    setSelectedGoalId,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | '90day' | 'hierarchy'>('all');
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  // New goal form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LifeArea>('career');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<Priority>('high');
  const [motivation, setMotivation] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');

  // Selected goal detail
  const currentGoal = selectedGoalId
    ? state.goals.find(g => g.id === selectedGoalId) || state.goals[0]
    : state.goals[0];

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneText.trim() || !currentGoal) return;

    const newMilestone: GoalMilestone = {
      id: `gm-${Date.now()}`,
      goalId: currentGoal.id,
      title: newMilestoneText.trim(),
      completed: false,
      order: currentGoal.milestones.length + 1,
    };

    updateGoal(currentGoal.id, {
      milestones: [...currentGoal.milestones, newMilestone],
    });
    setNewMilestoneText('');
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newG = addGoal({
      title: title.trim(),
      description: description.trim(),
      category,
      startDate: new Date().toISOString().split('T')[0],
      targetDate,
      status: 'active',
      priority,
      progressCalculation: 'milestones',
      manualProgress: 0,
      successCriteria: successCriteria.trim() || 'Achieve all milestones according to schedule',
      motivation: motivation.trim() || 'Continuous self-mastery',
      milestones: [
        { id: `gm-${Date.now()}-1`, goalId: '', title: 'Phase 1: Foundation & Planning', completed: false, order: 1 },
        { id: `gm-${Date.now()}-2`, goalId: '', title: 'Phase 2: Execution & Validation', completed: false, order: 2 },
      ],
      relatedProjectIds: [],
    });

    setTitle('');
    setDescription('');
    setShowNewGoalModal(false);
    setSelectedGoalId(newG.id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Vision Statement Banner */}
      <div className="p-6 rounded-2xl bg-[#3B2418] border border-[#5A3927] space-y-2 shadow-md">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#8EC5FF]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8EC5FF]">
            Long-Term Vision
          </span>
        </div>
        <p className="text-sm font-medium text-[#F2E8DA] italic max-w-3xl leading-relaxed">
          &ldquo;{state.profile.visionStatement || 'Don’t just track what you do. Track who you’re becoming.'}&rdquo;
        </p>
      </div>

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
            Goals & Strategic Objectives
          </h1>
          <p className="text-xs text-[#6E5648]">
            Connect long-term vision to 90-day execution sprints, milestones, and projects.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Sub-tabs */}
          <div className="flex bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2] text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'all' ? 'bg-[#8EC5FF] text-[#3B2418] font-bold' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Active Goals
            </button>
            <button
              onClick={() => setActiveTab('90day')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === '90day' ? 'bg-[#8EC5FF] text-[#3B2418] font-bold' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              90-Day Plans
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'hierarchy' ? 'bg-[#8EC5FF] text-[#3B2418] font-bold' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Hierarchy
            </button>
          </div>

          <button
            onClick={() => setShowNewGoalModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Goals List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6E5648] block px-1">
              Active Objectives ({state.goals.length})
            </span>

            {state.goals.map(goal => {
              const isSelected = currentGoal && currentGoal.id === goal.id;
              const progress = calculateGoalProgress(goal, state.tasks);

              return (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-[#FAF5ED] border-[#3B2418] ring-2 ring-[#8EC5FF] shadow-md'
                      : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-[#1E5A99]' : 'text-[#3B2418]'}`}>
                      {goal.title}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#3B2418] px-1.5 py-0.5 rounded bg-[#8EC5FF]/60 shrink-0">
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full bg-[#EAE0D0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8EC5FF] h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6E5648]">
                    <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                    <span>Target: {goal.targetDate}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Goal Detail & Milestones (7 cols) */}
          <div className="lg:col-span-7">
            {currentGoal ? (
              <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-6 shadow-xs">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D6C6B2]">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-[#8EC5FF]/50 text-[#3B2418] border border-[#8EC5FF]">
                      {currentGoal.category.replace('_', ' ')}
                    </span>
                    <h2 className="text-lg font-bold text-[#3B2418] pt-1">
                      {currentGoal.title}
                    </h2>
                    <p className="text-xs text-[#6E5648] leading-relaxed">
                      {currentGoal.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <select
                      value={currentGoal.status}
                      onChange={e => updateGoal(currentGoal.id, { status: e.target.value as any })}
                      className="px-2.5 py-1 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418] focus:outline-hidden"
                    >
                      <option value="active">Active</option>
                      <option value="in_progress">In Progress</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>

                    <button
                      onClick={() => deleteGoal(currentGoal.id)}
                      className="text-[11px] text-[#9E3530] hover:underline font-medium"
                    >
                      Delete Goal
                    </button>
                  </div>
                </div>

                {/* Motivation & Success Criteria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E5648] font-semibold">
                      Why It Matters (Motivation)
                    </span>
                    <p className="text-xs text-[#3B2418]">
                      {currentGoal.motivation || 'Deep personal growth and achievement.'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E5648] font-semibold">
                      Success Criteria
                    </span>
                    <p className="text-xs text-[#3B2418]">
                      {currentGoal.successCriteria || 'Complete all scheduled milestones.'}
                    </p>
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
                      Milestones ({currentGoal.milestones.filter(m => m.completed).length}/{currentGoal.milestones.length})
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1E5A99]">
                      {calculateGoalProgress(currentGoal, state.tasks)}% Complete
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentGoal.milestones.map(m => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => toggleGoalMilestone(currentGoal.id, m.id)}
                            className="text-[#6E5648] hover:text-[#3E7B52] shrink-0"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#3E7B52]" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span className={`text-xs font-medium truncate ${m.completed ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
                            {m.title}
                          </span>
                        </div>
                        {m.completedAt && (
                          <span className="text-[10px] font-mono text-[#3E7B52] font-semibold">
                            Done {m.completedAt.split('T')[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Milestone Inline */}
                  <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newMilestoneText}
                      onChange={e => setNewMilestoneText(e.target.value)}
                      placeholder="Add concrete milestone..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden focus:ring-2 focus:ring-[#8EC5FF]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418] font-semibold text-xs border border-[#3B2418]/15"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[#6E5648]">No goal selected</div>
            )}
          </div>
        </div>
      )}

      {/* 90-Day Planning View */}
      {activeTab === '90day' && (
        <div className="space-y-6">
          {state.ninetyDayPlans.map(plan => {
            return (
              <div key={plan.id} className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D6C6B2]">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#3B2418] text-[#8EC5FF]">
                      {plan.quarter}
                    </span>
                    <h3 className="text-base font-bold text-[#3B2418] mt-1">
                      {plan.mainObjective}
                    </h3>
                  </div>
                  <div className="text-xs font-mono text-[#6E5648]">
                    {plan.startDate} → {plan.endDate}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
                    <span className="text-[10px] font-mono uppercase font-semibold text-[#1E5A99] block mb-1">Why It Matters</span>
                    <p className="text-[#3B2418]">{plan.whyItMatters}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
                    <span className="text-[10px] font-mono uppercase font-semibold text-[#3E7B52] block mb-1">Expected Outcome</span>
                    <p className="text-[#3B2418]">{plan.expectedOutcome}</p>
                  </div>
                </div>

                {/* Weekly Checkpoints */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-[#3B2418] block">
                    Weekly Execution Checkpoints
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {plan.weeklyCheckpoints.map(cp => (
                      <div
                        key={cp.weekNumber}
                        onClick={() => togglePlanCheckpoint(plan.id, cp.weekNumber)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                          cp.completed
                            ? 'bg-[#EAE0D0]/60 border-[#3E7B52]/40 text-[#6E5648]'
                            : 'bg-[#F2E8DA] border-[#D6C6B2] text-[#3B2418] hover:border-[#8EC5FF]'
                        }`}
                      >
                        <div className="mt-0.5">
                          {cp.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#3E7B52]" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#6E5648]" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-[10px] text-[#1E5A99] font-bold">
                            Week {cp.weekNumber}
                          </span>
                          <span className="text-xs truncate">{cp.focus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hierarchy View (Vision -> Goals -> Projects -> Tasks) */}
      {activeTab === 'hierarchy' && (
        <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              Strategic Alignment Tree
            </h2>
            <p className="text-xs text-[#6E5648]">
              Verify how your daily tasks compound into projects, milestones, goals, and long-term vision.
            </p>
          </div>

          <div className="space-y-4">
            {state.goals.map(goal => {
              const linkedProjects = state.projects.filter(p => p.relatedGoalId === goal.id);
              const linkedTasks = state.tasks.filter(t => t.relatedGoalId === goal.id);

              return (
                <div key={goal.id} className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#1E5A99]" />
                      <span className="text-sm font-bold text-[#3B2418]">{goal.title}</span>
                    </div>
                    <span className="font-mono text-xs text-[#3B2418] px-2 py-0.5 rounded bg-[#8EC5FF]/60 font-bold">
                      {calculateGoalProgress(goal, state.tasks)}%
                    </span>
                  </div>

                  {/* Sub-tree: Linked Projects */}
                  {linkedProjects.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#8EC5FF] space-y-2">
                      <span className="text-[10px] font-mono uppercase text-[#6E5648]">Linked Projects</span>
                      {linkedProjects.map(proj => (
                        <div key={proj.id} className="flex items-center gap-2 text-xs text-[#3B2418] font-medium">
                          <FolderGit2 className="w-3.5 h-3.5 text-[#1E5A99]" />
                          <span>{proj.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-tree: Linked Tasks */}
                  {linkedTasks.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#D6C6B2] space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#6E5648]">Direct Tasks ({linkedTasks.length})</span>
                      {linkedTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center gap-2 text-xs text-[#6E5648]">
                          <CheckSquare className="w-3.5 h-3.5 text-[#3B2418]/70" />
                          <span className={task.status === 'completed' ? 'line-through' : ''}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2418]/65 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#8EC5FF]" />
                <h3 className="text-sm font-bold text-[#F2E8DA]">Create New Goal</h3>
              </div>
              <button
                onClick={() => setShowNewGoalModal(false)}
                className="text-[#D8C7B4] hover:text-[#F2E8DA]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master Cloud-Native Security Protocols"
                  className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden focus:ring-2 focus:ring-[#8EC5FF]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of what achieving this goal entails..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden focus:ring-2 focus:ring-[#8EC5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as LifeArea)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden"
                  >
                    <option value="career">Career</option>
                    <option value="education">Education</option>
                    <option value="fitness">Fitness</option>
                    <option value="health">Health</option>
                    <option value="personal_development">Personal Development</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Motivation (Why)</label>
                <input
                  type="text"
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  placeholder="Why this matters for who you are becoming..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
