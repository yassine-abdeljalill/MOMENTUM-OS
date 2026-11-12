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
import { useApp } from '../../lib/context';
import { Project, LifeArea, Priority } from '../../types';
import { calculateProjectProgress, getPriorityColor } from '../../lib/logic';

export const ProjectsView: React.FC = () => {
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
          <div className="flex bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-[#8EC5FF] text-[#3B2418]' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'list' ? 'bg-[#8EC5FF] text-[#3B2418]' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
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

          <div className="space-y-3">
            {state.projects.map(proj => {
              const isSelected = currentProject && currentProject.id === proj.id;
              const progress = calculateProjectProgress(proj, state.tasks);

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-[#FAF5ED] border-[#3B2418] ring-2 ring-[#8EC5FF] shadow-md'
                      : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-[#1E5A99]' : 'text-[#3B2418]'}`}>
                      {proj.name}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#3B2418] px-1.5 py-0.5 rounded bg-[#8EC5FF]/60 shrink-0">
                      {progress}%
                    </span>
                  </div>

                  <p className="text-xs text-[#6E5648] line-clamp-1">
                    {proj.description || 'No description'}
                  </p>

                  <div className="w-full bg-[#EAE0D0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8EC5FF] h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

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
          {currentProject ? (
            <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-6 shadow-xs">
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
                    onClick={() => deleteProject(currentProject.id)}
                    className="text-[11px] text-[#9E3530] hover:underline font-medium"
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
                  <span className="text-xl font-bold font-mono text-[#8EC5FF]">
                    {calculateProjectProgress(currentProject, state.tasks)}% Complete
                  </span>
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
                  {(currentProject.milestones || []).map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => toggleProjectMilestone(currentProject.id, m.id)}
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
                    </div>
                  ))}
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
                    className="px-3 py-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418] font-semibold text-xs border border-[#3B2418]/15"
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
                  {linkedTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs"
                    >
                      <span className={`truncate font-medium ${task.status === 'completed' ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-[#1E5A99] font-semibold shrink-0">
                        {task.status}
                      </span>
                    </div>
                  ))}
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
                    className="px-3 py-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418] font-semibold text-xs border border-[#3B2418]/15"
                  >
                    Add Task
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#6E5648]">No project selected</div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2418]/65 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#8EC5FF]" />
                <h3 className="text-sm font-bold text-[#F2E8DA]">Create Project</h3>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-[#D8C7B4] hover:text-[#F2E8DA]"
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
                  className="px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
