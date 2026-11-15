import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { LifeArea, Priority } from '../../types';
import { calculateProjectProgress } from '../../lib/logic';
import {
  ModalShell,
  AnimatedProgressBar,
  AnimatedCheckButton,
  AnimatedNumber,
  MOMENTUM_EASE,
} from '../common/MotionPrimitives';

export const ProjectsView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    addProject,
    updateProject,
    deleteProject,
    toggleProjectMilestone,
    addTask,
    selectedProjectId,
    setSelectedProjectId,
    showToast,
  } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LifeArea>('career');
  const [priority] = useState<Priority>('high');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
  );
  const [relatedGoalId, setRelatedGoalId] = useState('');

  const currentProject = selectedProjectId
    ? state.projects.find(p => p.id === selectedProjectId) || state.projects[0]
    : state.projects[0];

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newP = addProject({
      name: name.trim(),
      description: description.trim(),
      color: '#D2925B',
      status: 'active',
      priority,
      category,
      startDate: new Date().toISOString().split('T')[0],
      deadline,
      relatedGoalId: relatedGoalId || undefined,
      milestones: [
        { id: `pm-${Date.now()}-1`, projectId: '', title: 'Scope architecture & specifications', completed: false },
        { id: `pm-${Date.now()}-2`, projectId: '', title: 'MVP Implementation & Testing', completed: false },
      ],
    });

    setName('');
    setDescription('');
    setShowNewProjectModal(false);
    setSelectedProjectId(newP.id);
    showToast('Project created');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !currentProject) return;

    const newM = {
      id: `pm-${Date.now()}`,
      projectId: currentProject.id,
      title: newMilestoneTitle.trim(),
      completed: false,
    };

    updateProject(currentProject.id, {
      milestones: [...(currentProject.milestones || []), newM],
    });
    setNewMilestoneTitle('');
  };

  const handleAddProjectTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTaskTitle.trim() || !currentProject) return;

    addTask({
      title: newProjectTaskTitle.trim(),
      status: 'not_started',
      priority: 'medium',
      category: currentProject.category,
      relatedProjectId: currentProject.id,
      relatedGoalId: currentProject.relatedGoalId,
      tags: ['project-task'],
      subtasks: [],
    });

    setNewProjectTaskTitle('');
  };

  const linkedTasks = currentProject
    ? state.tasks.filter(t => t.relatedProjectId === currentProject.id)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Projects & Initiatives
          </h1>
          <p className="text-xs text-ink-muted">
            End-to-end deliverables driving toward your key long-term goals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-warm p-1 rounded-xl border border-line relative">
            {(['grid', 'list'] as const).map(mode => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-label={`${mode} view`}
                  className={`relative z-10 p-2 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="projects-view-mode-pill"
                      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                      className="absolute inset-0 bg-accent rounded-lg -z-10"
                    />
                  )}
                  {mode === 'grid' ? (
                    <LayoutGrid className="w-3.5 h-3.5" />
                  ) : (
                    <List className="w-3.5 h-3.5" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowNewProjectModal(true)}
            className="btn-press group flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.25] transition-transform duration-200 group-hover:rotate-90" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Projects List/Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-semibold text-ink-muted block px-1">
            All Projects ({state.projects.length})
          </span>

          <div className={viewMode === 'list' ? 'space-y-2' : 'space-y-3'}>
            {state.projects.map(proj => {
              const isSelected = currentProject && currentProject.id === proj.id;
              const progress = calculateProjectProgress(proj, state.tasks);

              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full text-left ${viewMode === 'list' ? 'p-3' : 'p-4'} rounded-2xl border transition-all duration-200 space-y-2.5 card-hover ${
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
                      {proj.name}
                    </span>
                    <AnimatedNumber
                      value={progress}
                      formatter={v => `${v}%`}
                      className="font-mono text-xs font-semibold text-accent shrink-0 tabular-nums"
                    />
                  </div>

                  {viewMode === 'grid' && (
                    <p className="text-xs text-ink-muted line-clamp-1">
                      {proj.description || 'No description'}
                    </p>
                  )}

                  <AnimatedProgressBar
                    percentage={progress}
                    trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
                    fillClassName="bg-accent h-full rounded-full"
                  />

                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span className="capitalize">{proj.category}</span>
                    {proj.deadline && <span className="font-mono tabular-nums">Due {proj.deadline}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Project Detail (7 cols) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait" initial={false}>
            {currentProject ? (
              <motion.div
                key={currentProject.id}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-line">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                      <span className="text-accent uppercase font-medium">{currentProject.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{currentProject.status.replace('_', ' ')}</span>
                    </div>
                    <h2 className="text-lg font-bold text-ink pt-0.5">{currentProject.name}</h2>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {currentProject.description}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                    <select
                      value={currentProject.status}
                      aria-label="Project status"
                      onChange={e => updateProject(currentProject.id, { status: e.target.value as any })}
                      className="px-3 py-1.5 rounded-xl bg-canvas border border-line text-xs font-medium text-ink focus:outline-hidden"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        deleteProject(currentProject.id);
                        showToast('Project deleted', 'info');
                      }}
                      className="btn-press text-xs text-danger hover:underline font-medium"
                    >
                      Delete Project
                    </button>
                  </div>
                </div>

                {/* Progress Summary */}
                <div className="p-4 rounded-xl bg-surface-warm border border-line flex items-center justify-between text-ink">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-ink-muted block">
                      Execution Progress
                    </span>
                    <AnimatedNumber
                      value={calculateProjectProgress(currentProject, state.tasks)}
                      formatter={v => `${v}% Complete`}
                      className="text-xl font-bold font-mono text-accent tabular-nums"
                    />
                  </div>
                  <div className="text-right text-xs text-ink-muted font-mono tabular-nums">
                    <div>{linkedTasks.length} linked tasks</div>
                    <div>{currentProject.milestones?.length || 0} milestones</div>
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-ink block">Project Milestones</span>
                  <div className="divide-y divide-line border-t border-line">
                    <AnimatePresence initial={false}>
                      {(currentProject.milestones || []).map(m => (
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
                              onClick={() => toggleProjectMilestone(currentProject.id, m.id)}
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
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <form onSubmit={handleAddMilestone} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newMilestoneTitle}
                      onChange={e => setNewMilestoneTitle(e.target.value)}
                      placeholder="Add milestone deliverable..."
                      className="flex-1 px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* Linked Tasks */}
                <div className="space-y-3 pt-3 border-t border-line">
                  <span className="text-xs font-semibold text-ink block">
                    Project Tasks ({linkedTasks.length})
                  </span>

                  <div className="divide-y divide-line border-t border-line max-h-48 overflow-y-auto">
                    <AnimatePresence initial={false}>
                      {linkedTasks.map(task => (
                        <motion.div
                          key={task.id}
                          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                          transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                          className="flex items-center justify-between py-2.5 text-xs gap-2"
                        >
                          <span
                            className={`truncate font-medium ${
                              task.status === 'completed' ? 'line-through text-ink-muted' : 'text-ink'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-[11px] font-mono capitalize text-accent font-medium shrink-0">
                            {task.status.replace('_', ' ')}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <form onSubmit={handleAddProjectTask} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newProjectTaskTitle}
                      onChange={e => setNewProjectTaskTitle(e.target.value)}
                      placeholder="Add task to this project..."
                      className="flex-1 px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors whitespace-nowrap"
                    >
                      Add Task
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <div className="p-12 text-center text-ink-muted text-sm">No project selected</div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Project Modal */}
      <ModalShell
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        maxWidthClass="max-w-lg"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line bg-surface-warm">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-semibold text-ink">Create Project</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNewProjectModal(false)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink transition-colors"
            aria-label="Close project modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Distributed Consensus Engine"
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
              placeholder="Core deliverable and scope..."
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
                <option value="personal_development">Personal Development</option>
                <option value="fitness">Fitness</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink font-mono focus:outline-hidden"
              />
            </div>
          </div>

          {state.goals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Related Goal (Optional)
              </label>
              <select
                value={relatedGoalId}
                onChange={e => setRelatedGoalId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:outline-hidden"
              >
                <option value="">No parent goal</option>
                {state.goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setShowNewProjectModal(false)}
              className="btn-press px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:bg-accent-hover transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
