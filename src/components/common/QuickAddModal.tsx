import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Target,
  Sparkles,
  FolderGit2,
  BookOpen,
  Dumbbell,
  Plus,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { LifeArea, Priority } from '../../types';

type CreationTab = 'task' | 'goal' | 'habit' | 'project' | 'journal' | 'workout';

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    addTask,
    addGoal,
    addHabit,
    addProject,
    addJournalEntry,
    logWorkoutSession,
    state,
  } = useApp();

  const [activeTab, setActiveTab] = useState<CreationTab>('task');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<LifeArea>('education');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('');
  const [taskIsDailyPriority, setTaskIsDailyPriority] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState<string>('');
  const [taskGoalId, setTaskGoalId] = useState<string>('');

  // Goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalCategory, setGoalCategory] = useState<LifeArea>('career');
  const [goalTargetDate, setGoalTargetDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [goalMotivation, setGoalMotivation] = useState('');

  // Habit form state
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState<LifeArea>('personal_development');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays'>('daily');

  // Project form state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectCategory, setProjectCategory] = useState<LifeArea>('career');
  const [projectDeadline, setProjectDeadline] = useState(
    new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0]
  );

  // Journal form state
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState<'great' | 'good' | 'neutral' | 'challenging'>('good');

  if (!isQuickAddOpen) return null;

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
      relatedGoalId: taskGoalId || undefined,
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

    setJournalTitle('');
    setJournalContent('');
    setIsQuickAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-[#2E373F] border border-[#434D56] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#434D56] bg-[#242B31]">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#D2925B]" />
            <h2 className="font-semibold text-sm text-[#F4F0E9]">Quick Create</h2>
          </div>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            className="p-1 rounded text-[#868A7A] hover:text-[#F4F0E9] hover:bg-[#36414A]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#434D56] bg-[#242B31]/50 px-3 pt-2 gap-1 overflow-x-auto">
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
                onClick={() => setActiveTab(tab.id as CreationTab)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 ${
                  isActive
                    ? 'border-[#D2925B] text-[#D2925B] bg-[#2E373F]'
                    : 'border-transparent text-[#868A7A] hover:text-[#F4F0E9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Form */}
        <div className="p-5">
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                  Task Title <span className="text-[#D2925B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit student portal authentication middleware"
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Life Area</label>
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value as LifeArea)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
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
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
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
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Due Time (opt)</label>
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={e => setTaskDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
              </div>

              {state.projects.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                    Related Project (Optional)
                  </label>
                  <select
                    value={taskProjectId}
                    onChange={e => setTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
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
                  className="rounded bg-[#242B31] border-[#434D56] text-[#D2925B] focus:ring-0"
                />
                <label htmlFor="quick-daily-prio" className="text-xs text-[#F4F0E9] font-medium cursor-pointer">
                  Mark as one of Today&apos;s Core Priorities
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Create Task
                </button>
              </div>
            </form>
          )}

          {activeTab === 'goal' && (
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                  Goal Objective <span className="text-[#D2925B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="e.g. Master Distributed Systems Architecture"
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={e => setGoalCategory(e.target.value as LifeArea)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  >
                    <option value="education">Education</option>
                    <option value="career">Career</option>
                    <option value="fitness">Fitness</option>
                    <option value="personal_development">Personal Development</option>
                    <option value="financial">Financial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={goalTargetDate}
                    onChange={e => setGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                  Why does this matter? (Motivation)
                </label>
                <input
                  type="text"
                  value={goalMotivation}
                  onChange={e => setGoalMotivation(e.target.value)}
                  placeholder="To build resilient infrastructure and achieve professional mastery"
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Create Goal
                </button>
              </div>
            </form>
          )}

          {activeTab === 'habit' && (
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                  Habit Name <span className="text-[#D2925B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={habitName}
                  onChange={e => setHabitName(e.target.value)}
                  placeholder="e.g. Read 20 pages of technical literature"
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Life Area</label>
                  <select
                    value={habitCategory}
                    onChange={e => setHabitCategory(e.target.value as LifeArea)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  >
                    <option value="personal_development">Personal Development</option>
                    <option value="education">Education</option>
                    <option value="fitness">Fitness</option>
                    <option value="health">Health</option>
                    <option value="career">Career</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Frequency</label>
                  <select
                    value={habitFrequency}
                    onChange={e => setHabitFrequency(e.target.value as 'daily' | 'weekdays')}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Create Habit
                </button>
              </div>
            </form>
          )}

          {activeTab === 'project' && (
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                  Project Title <span className="text-[#D2925B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Distributed Consensus Lab Engine"
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  placeholder="Short summary of project scope and core deliverable..."
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Category</label>
                  <select
                    value={projectCategory}
                    onChange={e => setProjectCategory(e.target.value as LifeArea)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  >
                    <option value="career">Career</option>
                    <option value="education">Education</option>
                    <option value="personal_development">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Deadline</label>
                  <input
                    type="date"
                    value={projectDeadline}
                    onChange={e => setProjectDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Create Project
                </button>
              </div>
            </form>
          )}

          {activeTab === 'journal' && (
            <form onSubmit={handleCreateJournal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                  Reflection Title <span className="text-[#D2925B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={journalTitle}
                  onChange={e => setJournalTitle(e.target.value)}
                  placeholder="e.g. Closing the week with intentional focus"
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Mood</label>
                <div className="flex gap-2">
                  {(['great', 'good', 'neutral', 'challenging'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setJournalMood(m)}
                      className={`px-3 py-1 text-xs rounded-lg capitalize border ${
                        journalMood === m
                          ? 'border-[#D2925B] bg-[#D2925B]/20 text-[#D2925B] font-medium'
                          : 'border-[#434D56] text-[#868A7A] hover:text-[#F4F0E9]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A8A8A2] mb-1">
                  Content <span className="text-[#D2925B]">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={journalContent}
                  onChange={e => setJournalContent(e.target.value)}
                  placeholder="What went well today? What resisted progress? What is the main priority for tomorrow?"
                  className="w-full px-3 py-2 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#868A7A] hover:text-[#F4F0E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Save Reflection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
