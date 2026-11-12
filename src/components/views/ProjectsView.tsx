import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Layers,
  Edit3,
  Trash2,
  CheckSquare,
  ExternalLink,
  Target,
  LayoutGrid,
  List,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { Project, LifeArea, Priority } from '../../types';
import { calculateProjectProgress, getPriorityColor } from '../../lib/logic';
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
    setCurrentView,
    showToast,
  } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newProjectTaskTitle, setNewProjectTaskTitle] = useState('');

  // New project state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LifeArea>('career');
  const [priority, setPriority] = useState<Priority>('high');
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
      color: '#8EC5FF',
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
            Projects & Initiatives
          </h1>
          <p className="text-xs text-[#6E5648]">
            End-to-end deliverables driving toward your key long-term goals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2] relative">
            {(['grid', 'list'] as const).map(mode => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`relative z-10 p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'text-[#3B2418]' : 'text-[#6E5648] hover:text-[#3B2418]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="projects-view-mode-pill"
                      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                      className="absolute inset-0 bg-[#8EC5FF] rounded-lg -z-10"
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
            onClick={() => setShowNewProjectModal(true)}
            className="btn-press group flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Projects Overview + Dedicated Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Projects List/Cards */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6E5648] block px-1">
            All Projects ({state.projects.length})
          </span>

          <div className={viewMode === 'list' ? 'space-y-2' : 'space-y-3'}>
            {state.projects.map(proj => {
              const isSelected = currentProject && currentProject.id === proj.id;
              const progress = calculateProjectProgress(proj, state.tasks);

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`${viewMode === 'list' ? 'p-3' : 'p-4'} rounded-xl border transition-all duration-200 cursor-pointer space-y-2.5 card-hover ${
                    isSelected
                      ? 'bg-[#FAF5ED] border-[#3B2418] ring-2 ring-[#8EC5FF] shadow-md'
                      : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-[#1E5A99]' : 'text-[#3B2418]'}`}>
                      {proj.name}
                    </h3>
                    <AnimatedNumber
                      value={progress}
                      formatter={v => `${v}%`}
                      className="font-mono text-xs font-bold text-[#3B2418] px-1.5 py-0.5 rounded bg-[#8EC5FF]/60 shrink-0"
                    />
                  </div>

                  {viewMode === 'grid' && (
                    <p className="text-xs text-[#6E5648] line-clamp-1">
                      {proj.description || 'No description'}
                    </p>
                  )}

                  <AnimatedProgressBar
                    percentage={progress}
                    trackClassName="w-full bg-[#EAE0D0] h-1.5 rounded-full overflow-hidden"
                    fillClassName="bg-[#8EC5FF] h-full rounded-full"
                  />

                  <div className="flex items-center justify-between text-[11px] text-[#6E5648]">
                    <span className="capitalize">{proj.category}</span>
                    {proj.deadline && <span>Due {proj.deadline}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Project Detail Page */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait" initial={false}>
            {currentProject ? (
              <motion.div
                key={currentProject.id}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-6 shadow-xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D6C6B2]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-[#8EC5FF]/50 text-[#3B2418] border border-[#8EC5FF]">
                        {currentProject.category}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#F2E8DA] text-[#6E5648] border border-[#D6C6B2]">
                        {currentProject.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-[#3B2418] pt-1">
                      {currentProject.name}
                    </h2>
                    <p className="text-xs text-[#6E5648] leading-relaxed">
                      {currentProject.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <select
                      value={currentProject.status}
                      onChange={e => updateProject(currentProject.id, { status: e.target.value as any })}
                      className="px-2.5 py-1 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418] focus:outline-hidden"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>

                    <button
                      onClick={() => {
                        deleteProject(currentProject.id);
                        showToast('Project deleted', 'info');
                      }}
                      className="btn-press text-[11px] text-[#9E3530] hover:underline font-medium"
                    >
                      Delete Project
                    </button>
                  </div>
                </div>

                {/* Progress Summary */}
                <div className="p-4 rounded-xl bg-[#3B2418] border border-[#5A3927] flex items-center justify-between text-[#F2E8DA]">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#D8C7B4] block">
                      Execution Progress
                    </span>
                    <AnimatedNumber
                      value={calculateProjectProgress(currentProject, state.tasks)}
                      formatter={v => `${v}% Complete`}
                      className="text-xl font-bold font-mono text-[#8EC5FF]"
                    />
                  </div>
                  <div className="text-right text-xs text-[#D8C7B4]">
                    <div>{linkedTasks.length} linked tasks</div>
                    <div>{currentProject.milestones?.length || 0} milestones</div>
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#3B2418] block">
                    Project Milestones
                  </span>
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {(currentProject.milestones || []).map(m => (
                        <motion.div
                          key={m.id}
                          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                          transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                            m.completed
                              ? 'bg-[#EAE0D0]/60 border-[#3E7B52]/35'
                              : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <AnimatedCheckButton
                              checked={m.completed}
                              size="sm"
                              onClick={() => toggleProjectMilestone(currentProject.id, m.id)}
                            />
                            <span className={`text-xs font-medium truncate transition-colors ${m.completed ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
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
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden focus:ring-2 focus:ring-[#8EC5FF]"
                    />
                    <button
                      type="submit"
                      className="btn-press px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-semibold text-xs border border-[#3B2418]/15 transition-colors"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* Linked Tasks */}
                <div className="space-y-3 pt-2 border-t border-[#D6C6B2]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#3B2418] block">
                    Project Tasks ({linkedTasks.length})
                  </span>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <AnimatePresence initial={false}>
                      {linkedTasks.map(task => (
                        <motion.div
                          key={task.id}
                          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                          transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs"
                        >
                          <span className={`truncate font-medium ${task.status === 'completed' ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-[#1E5A99] font-semibold shrink-0">
                            {task.status}
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
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden focus:ring-2 focus:ring-[#8EC5FF]"
                    />
                    <button
                      type="submit"
                      className="btn-press px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-semibold text-xs border border-[#3B2418]/15 transition-colors"
                    >
                      Add Task
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <div className="p-12 text-center text-[#6E5648]">No project selected</div>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#8EC5FF]" />
            <h3 className="text-sm font-bold text-[#F2E8DA]">Create Project</h3>
          </div>
          <button
            onClick={() => setShowNewProjectModal(false)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateProject} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Distributed Consensus Engine"
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
              placeholder="Core deliverable and scope..."
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
                <option value="personal_development">Personal Development</option>
                <option value="fitness">Fitness</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden"
              />
            </div>
          </div>

          {state.goals.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Related Goal (Optional)</label>
              <select
                value={relatedGoalId}
                onChange={e => setRelatedGoalId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:outline-hidden"
              >
                <option value="">No parent goal</option>
                {state.goals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={() => setShowNewProjectModal(false)}
              className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
