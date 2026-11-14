import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Target,
  Sparkles,
  FolderGit2,
  BookOpen,
  Plus,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { LifeArea, Priority } from '../../types';
import { ModalShell, MOMENTUM_EASE } from './MotionPrimitives';

type CreationTab = 'task' | 'goal' | 'habit' | 'project' | 'journal';

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    addTask,
    addGoal,
    addHabit,
    addProject,
    addJournalEntry,
    showToast,
    state,
  } = useApp();

  const prefersReduced = useReducedMotion();
  const [activeTab, setActiveTab] = useState<CreationTab>('task');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<LifeArea>('education');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('');
  const [taskIsDailyPriority, setTaskIsDailyPriority] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState<string>('');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState<LifeArea>('career');
  const [goalTargetDate, setGoalTargetDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [goalMotivation, setGoalMotivation] = useState('');

  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState<LifeArea>('personal_development');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays'>('daily');

  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectCategory, setProjectCategory] = useState<LifeArea>('career');
  const [projectDeadline, setProjectDeadline] = useState(
    new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0]
  );

  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState<'great' | 'good' | 'neutral' | 'challenging'>('good');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask({
      title: taskTitle.trim(),
      category: taskCategory,
      priority: taskPriority,
      status: 'not_started',
      dueDate: taskDueDate || undefined,
      dueTime: taskDueTime || undefined,
      isDailyPriority: taskIsDailyPriority,
      priorityRank: taskIsDailyPriority ? 1 : undefined,
      relatedProjectId: taskProjectId || undefined,
      tags: [],
      subtasks: [],
    });

    setTaskTitle('');
    setIsQuickAddOpen(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    addGoal({
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      category: goalCategory,
      startDate: new Date().toISOString().split('T')[0],
      targetDate: goalTargetDate,
      status: 'active',
      priority: 'high',
      progressCalculation: 'milestones',
      manualProgress: 0,
      successCriteria: 'Achieve all milestones according to schedule',
      motivation: goalMotivation.trim() || 'Personal mastery and growth',
      milestones: [
        { id: `gm-${Date.now()}-1`, goalId: '', title: 'Phase 1 Foundations', completed: false, order: 1 },
        { id: `gm-${Date.now()}-2`, goalId: '', title: 'Phase 2 Execution & Delivery', completed: false, order: 2 },
      ],
      relatedProjectIds: [],
    });

    showToast('Goal created.');
    setGoalTitle('');
    setGoalDescription('');
    setIsQuickAddOpen(false);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    addHabit({
      name: habitName.trim(),
      category: habitCategory,
      frequency: habitFrequency,
      targetCountPerDay: 1,
      startDate: new Date().toISOString().split('T')[0],
      color: '#D2925B',
      active: true,
    });

    showToast('Habit added.');
    setHabitName('');
    setIsQuickAddOpen(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    addProject({
      name: projectName.trim(),
      description: projectDescription.trim(),
      category: projectCategory,
      color: '#D2925B',
      status: 'active',
      priority: 'high',
      startDate: new Date().toISOString().split('T')[0],
      deadline: projectDeadline,
      milestones: [
        { id: `pm-${Date.now()}-1`, projectId: '', title: 'Initial setup & requirements', completed: false },
        { id: `pm-${Date.now()}-2`, projectId: '', title: 'Core milestone execution', completed: false },
      ],
    });

    showToast('Project created.');
    setProjectName('');
    setProjectDescription('');
    setIsQuickAddOpen(false);
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalContent.trim()) return;

    addJournalEntry({
      title: journalTitle.trim(),
      content: journalContent.trim(),
      date: new Date().toISOString().split('T')[0],
      category: 'daily_reflection',
      mood: journalMood,
      tags: ['reflection'],
    });

    showToast('Journal reflection saved.');
    setJournalTitle('');
    setJournalContent('');
    setIsQuickAddOpen(false);
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl bg-[#1A1A1D]/75 border border-white/12 text-ink text-xs focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden';

  return (
    <ModalShell
      isOpen={isQuickAddOpen}
      onClose={() => setIsQuickAddOpen(false)}
      maxWidthClass="max-w-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03] text-ink">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-sm font-heading">Quick Create</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsQuickAddOpen(false)}
          className="p-1.5 rounded-xl glass-control text-ink-muted hover:text-ink btn-press"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Liquid Glass Segmented Tabs */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex glass-segmented p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'task', label: 'Task', icon: CheckSquare },
            { id: 'goal', label: 'Goal', icon: Target },
            { id: 'habit', label: 'Habit', icon: Sparkles },
            { id: 'project', label: 'Project', icon: FolderGit2 },
            { id: 'journal', label: 'Journal', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CreationTab)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors btn-press whitespace-nowrap ${
                  isActive ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="quickadd-tab-bg"
                    transition={{
                      type: 'spring',
                      stiffness: 440,
                      damping: 34,
                      mass: 0.8,
                    }}
                    className="absolute inset-0 glass-accent-pill rounded-xl z-0"
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Form */}
      <div className="p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.14, ease: MOMENTUM_EASE }}
          >
            {activeTab === 'task' && (
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Task Title <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Audit student portal authentication middleware"
                    className={`${inputCls} text-sm`}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Life Area</label>
                    <select
                      value={taskCategory}
                      onChange={e => setTaskCategory(e.target.value as LifeArea)}
                      className={inputCls}
                    >
                      <option value="education">Education</option>
                      <option value="career">Career</option>
                      <option value="health">Health</option>
                      <option value="fitness">Fitness</option>
                      <option value="financial">Financial</option>
                      <option value="personal_development">Personal Development</option>
                      <option value="relationships">Relationships</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={e => setTaskPriority(e.target.value as Priority)}
                      className={inputCls}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Due Time (opt)</label>
                    <input
                      type="time"
                      value={taskDueTime}
                      onChange={e => setTaskDueTime(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {state.projects.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Related Project (Optional)
                    </label>
                    <select
                      value={taskProjectId}
                      onChange={e => setTaskProjectId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">No Project</option>
                      {state.projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="quick-daily-prio"
                    checked={taskIsDailyPriority}
                    onChange={e => setTaskIsDailyPriority(e.target.checked)}
                    className="rounded border-line accent-accent focus:ring-0"
                  />
                  <label htmlFor="quick-daily-prio" className="text-xs text-ink font-medium cursor-pointer">
                    Mark as one of Today&apos;s Core Priorities
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-accent-ink btn-press"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'goal' && (
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Goal Objective <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={goalTitle}
                    onChange={e => setGoalTitle(e.target.value)}
                    placeholder="e.g. Master Distributed Systems Architecture"
                    className={`${inputCls} text-sm`}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Category</label>
                    <select
                      value={goalCategory}
                      onChange={e => setGoalCategory(e.target.value as LifeArea)}
                      className={inputCls}
                    >
                      <option value="education">Education</option>
                      <option value="career">Career</option>
                      <option value="fitness">Fitness</option>
                      <option value="personal_development">Personal Development</option>
                      <option value="financial">Financial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Target Date</label>
                    <input
                      type="date"
                      required
                      value={goalTargetDate}
                      onChange={e => setGoalTargetDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Why does this matter? (Motivation)
                  </label>
                  <input
                    type="text"
                    value={goalMotivation}
                    onChange={e => setGoalMotivation(e.target.value)}
                    placeholder="To build resilient infrastructure and achieve professional mastery"
                    className={inputCls}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-accent-ink btn-press"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'habit' && (
              <form onSubmit={handleCreateHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Habit Name <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={habitName}
                    onChange={e => setHabitName(e.target.value)}
                    placeholder="e.g. Read 20 pages of technical literature"
                    className={`${inputCls} text-sm`}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Life Area</label>
                    <select
                      value={habitCategory}
                      onChange={e => setHabitCategory(e.target.value as LifeArea)}
                      className={inputCls}
                    >
                      <option value="personal_development">Personal Development</option>
                      <option value="education">Education</option>
                      <option value="fitness">Fitness</option>
                      <option value="health">Health</option>
                      <option value="career">Career</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Frequency</label>
                    <select
                      value={habitFrequency}
                      onChange={e => setHabitFrequency(e.target.value as 'daily' | 'weekdays')}
                      className={inputCls}
                    >
                      <option value="daily">Every Day</option>
                      <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-accent-ink btn-press"
                  >
                    Create Habit
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'project' && (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Project Title <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. Distributed Consensus Lab Engine"
                    className={`${inputCls} text-sm`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={projectDescription}
                    onChange={e => setProjectDescription(e.target.value)}
                    placeholder="Short summary of project scope and core deliverable..."
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Category</label>
                    <select
                      value={projectCategory}
                      onChange={e => setProjectCategory(e.target.value as LifeArea)}
                      className={inputCls}
                    >
                      <option value="career">Career</option>
                      <option value="education">Education</option>
                      <option value="personal_development">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Deadline</label>
                    <input
                      type="date"
                      value={projectDeadline}
                      onChange={e => setProjectDeadline(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-accent-ink btn-press"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'journal' && (
              <form onSubmit={handleCreateJournal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Reflection Title <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={journalTitle}
                    onChange={e => setJournalTitle(e.target.value)}
                    placeholder="e.g. Closing the week with intentional focus"
                    className={`${inputCls} text-sm`}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {(['great', 'good', 'neutral', 'challenging'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setJournalMood(m)}
                        className={`px-3 py-1.5 text-xs rounded-xl capitalize border transition-colors ${
                          journalMood === m
                            ? 'border-accent bg-accent text-accent-ink font-semibold'
                            : 'border-line text-ink-muted hover:text-ink bg-surface-warm/60'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Content <span className="text-accent">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={journalContent}
                    onChange={e => setJournalContent(e.target.value)}
                    placeholder="What went well today? What resisted progress? What is the main priority for tomorrow?"
                    className={`${inputCls} leading-relaxed`}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink btn-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-accent hover:bg-accent-hover text-accent-ink btn-press"
                  >
                    Save Reflection
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </ModalShell>
  );
};
