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
      <div className="p-6 rounded-2xl bg-[#64432B]/60 border border-[#7E5437]/60 space-y-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#D2925B]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D2925B]">
            Long-Term Vision
          </span>
        </div>
        <p className="text-sm font-medium text-[#F4F0E9] italic max-w-3xl leading-relaxed">
          &ldquo;{state.profile.visionStatement || 'Don’t just track what you do. Track who you’re becoming.'}&rdquo;
        </p>
      </div>

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
            Goals & Strategic Objectives
          </h1>
          <p className="text-xs text-[#A8A8A2]">
            Connect long-term vision to 90-day execution sprints, milestones, and projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-tabs */}
          <div className="flex bg-[#242B31] p-1 rounded-xl border border-[#434D56] text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'all' ? 'bg-[#D2925B] text-[#242B31] font-bold' : 'text-[#868A7A]'
              }`}
            >
              Active Goals
            </button>
            <button
              onClick={() => setActiveTab('90day')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === '90day' ? 'bg-[#D2925B] text-[#242B31] font-bold' : 'text-[#868A7A]'
              }`}
            >
              90-Day Plans
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'hierarchy' ? 'bg-[#D2925B] text-[#242B31] font-bold' : 'text-[#868A7A]'
              }`}
            >
              Hierarchy
            </button>
          </div>

          <button
            onClick={() => setShowNewGoalModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-sm transition-all"
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#A8A8A2] block px-1">
              Active Objectives ({state.goals.length})
            </span>

            {state.goals.map(goal => {
              const isSelected = currentGoal && currentGoal.id === goal.id;
              const progress = calculateGoalProgress(goal, state.tasks);
              const pColor = getPriorityColor(goal.priority);

              return (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoalId(goal.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-[#2E373F] border-[#D2925B] shadow-md'
                      : 'bg-[#242B31] border-[#434D56] hover:border-[#868A7A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-[#D2925B]' : 'text-[#F4F0E9]'}`}>
                      {goal.title}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#D2925B] shrink-0">
                      {progress}%
                    </span>
                  </div>

                  <div className="w-full bg-[#242B31] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#D2925B] h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#868A7A]">
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
              <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#434D56]/60">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#242B31] text-[#D2925B] border border-[#434D56]">
                      {currentGoal.category.replace('_', ' ')}
                    </span>
                    <h2 className="text-lg font-bold text-[#F4F0E9] pt-1">
                      {currentGoal.title}
                    </h2>
                    <p className="text-xs text-[#A8A8A2] leading-relaxed">
                      {currentGoal.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <select
                      value={currentGoal.status}
                      onChange={e => updateGoal(currentGoal.id, { status: e.target.value as any })}
                      className="px-2.5 py-1 rounded-lg bg-[#242B31] border border-[#434D56] text-xs font-semibold text-[#D2925B] focus:outline-hidden"
                    >
                      <option value="active">Active</option>
                      <option value="in_progress">In Progress</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>

                    <button
                      onClick={() => deleteGoal(currentGoal.id)}
                      className="text-[11px] text-[#E57373] hover:underline"
                    >
                      Delete Goal
                    </button>
                  </div>
                </div>

                {/* Motivation & Success Criteria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-[#242B31] border border-[#434D56]/60 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#868A7A]">
                      Why It Matters (Motivation)
                    </span>
                    <p className="text-xs text-[#F4F0E9]">
                      {currentGoal.motivation || 'Deep personal growth and achievement.'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#242B31] border border-[#434D56]/60 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#868A7A]">
                      Success Criteria
                    </span>
                    <p className="text-xs text-[#F4F0E9]">
                      {currentGoal.successCriteria || 'Complete all scheduled milestones.'}
                    </p>
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F4F0E9]">
                      Milestones ({currentGoal.milestones.filter(m => m.completed).length}/{currentGoal.milestones.length})
                    </span>
                    <span className="text-xs font-mono text-[#D2925B]">
                      {calculateGoalProgress(currentGoal, state.tasks)}% Complete
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentGoal.milestones.map(m => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#242B31] border border-[#434D56]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => toggleGoalMilestone(currentGoal.id, m.id)}
                            className="text-[#868A7A] hover:text-[#5B8C67] shrink-0"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#5B8C67]" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span className={`text-xs truncate ${m.completed ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'}`}>
                            {m.title}
                          </span>
                        </div>
                        {m.completedAt && (
                          <span className="text-[10px] font-mono text-[#5B8C67]">
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
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#242B31] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-[#D2925B] text-[#242B31] font-semibold text-xs"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[#868A7A]">No goal selected</div>
            )}
          </div>
        </div>
      )}

      {/* 90-Day Planning View */}
      {activeTab === '90day' && (
        <div className="space-y-6">
          {state.ninetyDayPlans.map(plan => {
            const goal = state.goals.find(g => g.id === plan.goalId);
            return (
              <div key={plan.id} className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#434D56]/50">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#64432B] text-[#D2925B]">
                      {plan.quarter}
                    </span>
                    <h3 className="text-base font-bold text-[#F4F0E9] mt-1">
                      {plan.mainObjective}
                    </h3>
                  </div>
                  <div className="text-xs font-mono text-[#868A7A]">
                    {plan.startDate} → {plan.endDate}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#242B31] border border-[#434D56]/40">
                    <span className="text-[10px] font-mono uppercase text-[#D2925B] block mb-1">Why It Matters</span>
                    <p className="text-[#F4F0E9]">{plan.whyItMatters}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#242B31] border border-[#434D56]/40">
                    <span className="text-[10px] font-mono uppercase text-[#5B8C67] block mb-1">Expected Outcome</span>
                    <p className="text-[#F4F0E9]">{plan.expectedOutcome}</p>
                  </div>
                </div>

                {/* Weekly Checkpoints */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-[#F4F0E9] block">
                    Weekly Execution Checkpoints
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {plan.weeklyCheckpoints.map(cp => (
                      <div
                        key={cp.weekNumber}
                        onClick={() => togglePlanCheckpoint(plan.id, cp.weekNumber)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                          cp.completed
                            ? 'bg-[#242B31]/40 border-[#5B8C67]/40 text-[#868A7A]'
                            : 'bg-[#242B31] border-[#434D56] text-[#F4F0E9]'
                        }`}
                      >
                        <div className="mt-0.5">
                          {cp.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#5B8C67]" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#868A7A]" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-[10px] text-[#D2925B] font-bold">
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
        <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
              Strategic Alignment Tree
            </h2>
            <p className="text-xs text-[#A8A8A2]">
              Verify how your daily tasks compound into projects, milestones, goals, and long-term vision.
            </p>
          </div>

          <div className="space-y-4">
            {state.goals.map(goal => {
              const linkedProjects = state.projects.filter(p => p.relatedGoalId === goal.id);
              const linkedTasks = state.tasks.filter(t => t.relatedGoalId === goal.id);

              return (
                <div key={goal.id} className="p-4 rounded-xl bg-[#242B31] border border-[#434D56] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#D2925B]" />
                      <span className="text-sm font-bold text-[#F4F0E9]">{goal.title}</span>
                    </div>
                    <span className="font-mono text-xs text-[#D2925B] font-bold">
                      {calculateGoalProgress(goal, state.tasks)}%
                    </span>
                  </div>

                  {/* Sub-tree: Linked Projects */}
                  {linkedProjects.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#434D56] space-y-2">
                      <span className="text-[10px] font-mono uppercase text-[#868A7A]">Linked Projects</span>
                      {linkedProjects.map(proj => (
                        <div key={proj.id} className="flex items-center gap-2 text-xs text-[#F4F0E9]">
                          <FolderGit2 className="w-3.5 h-3.5 text-[#868A7A]" />
                          <span>{proj.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-tree: Linked Tasks */}
                  {linkedTasks.length > 0 && (
                    <div className="pl-6 border-l-2 border-[#434D56] space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-[#868A7A]">Direct Tasks ({linkedTasks.length})</span>
                      {linkedTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="flex items-center gap-2 text-xs text-[#A8A8A2]">
                          <CheckSquare className="w-3.5 h-3.5 text-[#868A7A]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#434D56] bg-[#22292F]">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#D2925B]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">Create New Goal</h3>
              </div>
              <button
                onClick={() => setShowNewGoalModal(false)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Master Cloud-Native Security Protocols"
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Detailed breakdown of what achieving this goal entails..."
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
                    <option value="career">Career</option>
                    <option value="education">Education</option>
                    <option value="fitness">Fitness</option>
                    <option value="health">Health</option>
                    <option value="personal_development">Personal Development</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Motivation (Why)</label>
                <input
                  type="text"
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  placeholder="Why this matters for who you are becoming..."
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="px-3 py-1.5 text-xs text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
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
