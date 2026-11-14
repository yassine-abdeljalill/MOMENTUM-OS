import React, { useState } from 'react';
import {
  Target,
  Plus,
  Compass,
  FolderGit2,
  CheckSquare,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { GoalMilestone, LifeArea, Priority } from '../../types';
import { calculateGoalProgress } from '../../lib/logic';
import {
  ModalShell,
  AnimatedProgressBar,
  AnimatedCheckButton,
  AnimatedNumber,
  MOMENTUM_EASE,
} from '../common/MotionPrimitives';
import { GlassSegmentedControl } from '../common/LiquidGlass';

export const GoalsView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalMilestone,
    togglePlanCheckpoint,
    selectedGoalId,
    setSelectedGoalId,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | '90day' | 'hierarchy'>('all');
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LifeArea>('career');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  );
  const [priority] = useState<Priority>('high');
  const [motivation, setMotivation] = useState('');
  const [successCriteria] = useState('');

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
    setMotivation('');
    setShowNewGoalModal(false);
    setSelectedGoalId(newG.id);
    showToast('New strategic goal created');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Vision Statement Banner */}
      <section className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-brand-blue" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-blue">
            Long-Term Vision
          </span>
        </div>
        <p className="font-serif text-sm sm:text-base text-ink italic max-w-3xl leading-relaxed">
          &ldquo;{state.profile.visionStatement || "Don't just track what you do. Track who you're becoming."}&rdquo;
        </p>
      </section>

      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Goals & Strategic Objectives
          </h1>
          <p className="text-xs text-ink-muted">
            Connect long-term vision to 90-day execution sprints, milestones, and projects.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <GlassSegmentedControl
            layoutId="goals-tab-pill"
            size="sm"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { id: 'all', label: 'Active Goals' },
              { id: '90day', label: '90-Day Plans' },
              { id: 'hierarchy', label: 'Hierarchy' },
            ]}
          />

          <button
            type="button"
            onClick={() => setShowNewGoalModal(true)}
            className="btn-press group flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl glass-accent-pill text-xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.25] transition-transform duration-200 group-hover:rotate-90" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'all' && (
          <motion.div
            key="goals-all"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Goals List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-semibold text-ink-muted block px-1">
                Active Objectives ({state.goals.length})
              </span>

              {state.goals.map(goal => {
                const isSelected = currentGoal && currentGoal.id === goal.id;
                const progress = calculateGoalProgress(goal, state.tasks);

                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 space-y-2.5 card-hover ${
                      isSelected
                        ? 'bg-surface border-accent ring-1 ring-accent shadow-sm'
                        : 'bg-surface border-line hover:border-accent/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-semibold truncate transition-colors ${
                          isSelected ? 'text-accent' : 'text-ink'
                        }`}
                      >
                        {goal.title}
                      </span>
                      <AnimatedNumber
                        value={progress}
                        formatter={v => `${v}%`}
                        className="font-mono text-xs font-semibold text-accent shrink-0 tabular-nums"
                      />
                    </div>

                    <AnimatedProgressBar
                      percentage={progress}
                      trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                      fillClassName="bg-accent h-full rounded-full"
                    />

                    <div className="flex items-center justify-between text-xs text-ink-muted">
                      <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                      <span className="font-mono tabular-nums">Target {goal.targetDate}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Goal Detail & Milestones (7 cols) */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait" initial={false}>
                {currentGoal ? (
                  <motion.div
                    key={currentGoal.id}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                    className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-line">
                      <div className="space-y-1">
                        <span className="text-xs font-mono uppercase text-accent font-medium">
                          {currentGoal.category.replace('_', ' ')}
                        </span>
                        <h2 className="text-lg font-bold text-ink">{currentGoal.title}</h2>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {currentGoal.description || 'No detailed description provided.'}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                        <select
                          value={currentGoal.status}
                          aria-label="Goal status"
                          onChange={e => updateGoal(currentGoal.id, { status: e.target.value as any })}
                          className="px-3 py-1.5 rounded-xl bg-canvas border border-line text-xs font-medium text-ink focus:outline-hidden"
                        >
                          <option value="active">Active</option>
                          <option value="in_progress">In Progress</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            deleteGoal(currentGoal.id);
                            showToast('Goal deleted', 'info');
                          }}
                          className="btn-press text-xs text-danger hover:underline font-medium"
                        >
                          Delete Goal
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-surface-warm/60 border border-line space-y-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted font-medium">
                          Why It Matters
                        </span>
                        <p className="text-xs text-ink">
                          {currentGoal.motivation || 'Deep personal growth and achievement.'}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-warm/60 border border-line space-y-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted font-medium">
                          Success Criteria
                        </span>
                        <p className="text-xs text-ink">
                          {currentGoal.successCriteria || 'Complete all scheduled milestones.'}
                        </p>
                      </div>
                    </div>

                    {/* Milestones Checklist */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">
                          Milestones ({currentGoal.milestones.filter(m => m.completed).length}/{currentGoal.milestones.length})
                        </span>
                        <span className="text-xs font-mono font-semibold text-accent tabular-nums">
                          {calculateGoalProgress(currentGoal, state.tasks)}% Complete
                        </span>
                      </div>

                      <div className="divide-y divide-line border-t border-line">
                        <AnimatePresence initial={false}>
                          {currentGoal.milestones.map(m => (
                            <motion.div
                              key={m.id}
                              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                              transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                              className={`flex items-center justify-between py-2.5 gap-3 min-h-[44px] ${
                                m.completed ? 'opacity-65' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <AnimatedCheckButton
                                  checked={m.completed}
                                  size="sm"
                                  onClick={() => toggleGoalMilestone(currentGoal.id, m.id)}
                                  ariaLabel={m.completed ? `Uncheck ${m.title}` : `Complete ${m.title}`}
                                />
                                <span
                                  className={`text-xs font-medium truncate transition-colors ${
                                    m.completed ? 'line-through text-ink-muted' : 'text-ink'
                                  }`}
                                >
                                  {m.title}
                                </span>
                              </div>
                              {m.completedAt && (
                                <span className="text-[11px] font-mono text-success font-medium tabular-nums shrink-0">
                                  Done {m.completedAt.split('T')[0]}
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={newMilestoneText}
                          onChange={e => setNewMilestoneText(e.target.value)}
                          placeholder="Add concrete milestone..."
                          className="flex-1 px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
                        />
                        <button
                          type="submit"
                          className="btn-press px-4 py-2 rounded-xl glass-accent-pill text-xs transition-colors"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-12 text-center text-ink-muted text-sm">No goal selected</div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* 90-Day Planning View */}
        {activeTab === '90day' && (
          <motion.div
            key="goals-90day"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="space-y-6"
          >
            {state.ninetyDayPlans.map(plan => (
              <div key={plan.id} className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                  <div>
                    <span className="text-xs font-mono font-semibold text-accent">
                      {plan.quarter}
                    </span>
                    <h3 className="text-base font-bold text-ink mt-0.5">
                      {plan.mainObjective}
                    </h3>
                  </div>
                  <div className="text-xs font-mono text-ink-muted tabular-nums">
                    {plan.startDate} → {plan.endDate}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-surface-warm/60 border border-line">
                    <span className="text-[11px] font-mono uppercase font-medium text-accent block mb-1">
                      Why It Matters
                    </span>
                    <p className="text-ink">{plan.whyItMatters}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-warm/60 border border-line">
                    <span className="text-[11px] font-mono uppercase font-medium text-success block mb-1">
                      Expected Outcome
                    </span>
                    <p className="text-ink">{plan.expectedOutcome}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-ink block">
                    Weekly Execution Checkpoints
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {plan.weeklyCheckpoints.map(cp => (
                      <button
                        key={cp.weekNumber}
                        type="button"
                        onClick={() => togglePlanCheckpoint(plan.id, cp.weekNumber)}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-2.5 ${
                          cp.completed
                            ? 'bg-surface-warm/40 border-success/40 text-ink-muted'
                            : 'bg-surface-warm/70 border-line text-ink hover:border-accent'
                        }`}
                      >
                        <div className="mt-0.5 pointer-events-none">
                          <AnimatedCheckButton
                            checked={cp.completed}
                            size="sm"
                            onClick={() => {}}
                            ariaLabel={`Week ${cp.weekNumber}`}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-[11px] text-accent font-semibold tabular-nums">
                            Week {cp.weekNumber}
                          </span>
                          <span className="text-xs truncate">{cp.focus}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Hierarchy View */}
        {activeTab === 'hierarchy' && (
          <motion.div
            key="goals-hierarchy"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-6"
          >
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-ink">Strategic Alignment Tree</h2>
              <p className="text-xs text-ink-muted">
                Verify how your daily tasks compound into projects, milestones, goals, and long-term vision.
              </p>
            </div>

            <div className="space-y-4">
              {state.goals.map(goal => {
                const linkedProjects = state.projects.filter(p => p.relatedGoalId === goal.id);
                const linkedTasks = state.tasks.filter(t => t.relatedGoalId === goal.id);

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-xl bg-surface-warm/60 border border-line space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Target className="w-4 h-4 text-accent shrink-0" />
                        <span className="text-sm font-semibold text-ink truncate">{goal.title}</span>
                      </div>
                      <span className="font-mono text-xs text-accent font-semibold tabular-nums shrink-0">
                        {calculateGoalProgress(goal, state.tasks)}%
                      </span>
                    </div>

                    {linkedProjects.length > 0 && (
                      <div className="pl-5 border-l border-line space-y-1.5">
                        <span className="text-[11px] font-mono uppercase text-ink-muted">
                          Linked Projects
                        </span>
                        {linkedProjects.map(proj => (
                          <div key={proj.id} className="flex items-center gap-2 text-xs text-ink font-medium">
                            <FolderGit2 className="w-3.5 h-3.5 text-sage shrink-0" />
                            <span>{proj.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {linkedTasks.length > 0 && (
                      <div className="pl-5 border-l border-line space-y-1.5">
                        <span className="text-[11px] font-mono uppercase text-ink-muted">
                          Direct Tasks ({linkedTasks.length})
                        </span>
                        {linkedTasks.slice(0, 3).map(task => (
                          <div key={task.id} className="flex items-center gap-2 text-xs text-ink-muted">
                            <CheckSquare className="w-3.5 h-3.5 shrink-0" />
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Goal Modal */}
      <ModalShell
        isOpen={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        maxWidthClass="max-w-lg"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-ink">Create New Goal</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNewGoalModal(false)}
            className="btn-press glass-control p-1.5 rounded-xl text-ink-muted hover:text-ink transition-colors"
            aria-label="Close goal modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateGoal} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Goal Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Master Cloud-Native Security Protocols"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed breakdown of what achieving this goal entails..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as LifeArea)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:outline-hidden"
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
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink font-mono focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Motivation (Why)</label>
            <input
              type="text"
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              placeholder="Why this matters for who you are becoming..."
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowNewGoalModal(false)}
              className="btn-press px-4 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-2 rounded-xl text-xs glass-accent-pill transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
