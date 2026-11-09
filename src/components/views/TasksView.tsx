import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Tag,
  Trash2,
  Edit3,
  Calendar,
  X,
  Target,
  FolderGit2,
  List,
  LayoutGrid,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { Task, TaskStatus, Priority, LifeArea } from '../../types';
import { getPriorityColor, formatMinutes } from '../../lib/logic';

type TaskViewMode = 'board' | 'list';
type QuickFilterTab = 'all' | 'today' | 'upcoming' | 'completed';

export const TasksView: React.FC = () => {
  const {
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompleted,
    toggleSubtaskCompleted,
    setDailyPriorityRank,
    startFocusTimer,
    setIsFocusTimerOpen,
  } = useApp();

  const [viewMode, setViewMode] = useState<TaskViewMode>('board');
  const [filterTab, setFilterTab] = useState<QuickFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Fast inline task creation state
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineCategory, setInlineCategory] = useState<LifeArea>('career');
  const [inlinePriority, setInlinePriority] = useState<Priority>('medium');
  const [inlineDueDate, setInlineDueDate] = useState('');

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return state.tasks.filter(t => {
      // Tab filter
      if (filterTab === 'today') {
        if (t.dueDate !== todayStr && !t.isDailyPriority) return false;
      } else if (filterTab === 'upcoming') {
        if (!t.dueDate || t.dueDate <= todayStr || t.status === 'completed') return false;
      } else if (filterTab === 'completed') {
        if (t.status !== 'completed') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Dropdown filters
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (projectFilter !== 'all' && t.relatedProjectId !== projectFilter) return false;

      return true;
    });
  }, [state.tasks, filterTab, searchQuery, categoryFilter, priorityFilter, projectFilter, todayStr]);

  const handleCreateInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;

    addTask({
      title: inlineTitle.trim(),
      category: inlineCategory,
      priority: inlinePriority,
      status: 'not_started',
      dueDate: inlineDueDate || undefined,
      tags: [],
      subtasks: [],
      isDailyPriority: false,
    });

    setInlineTitle('');
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !editingTask) return;

    const newSubtask = {
      id: `st-${Date.now()}`,
      taskId: editingTask.id,
      title: newSubtaskTitle.trim(),
      completed: false,
      order: editingTask.subtasks.length + 1,
    };

    const updatedSubtasks = [...editingTask.subtasks, newSubtask];
    updateTask(editingTask.id, { subtasks: updatedSubtasks });
    setEditingTask({ ...editingTask, subtasks: updatedSubtasks });
    setNewSubtaskTitle('');
  };

  const columns: { status: TaskStatus; label: string }[] = [
    { status: 'inbox', label: 'Inbox' },
    { status: 'not_started', label: 'To Do' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* View Header & Controls */}
      <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
              Task Management
            </h1>
            <p className="text-xs text-[#A8A8A2]">
              Track execution, configure subtasks, and organize work into Kanban or detailed list view.
            </p>
          </div>

          {/* View mode toggle & quick count */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#242B31] p-1 rounded-xl border border-[#434D56]">
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'board'
                    ? 'bg-[#D2925B] text-[#242B31]'
                    : 'text-[#868A7A] hover:text-[#F4F0E9]'
                }`}
                title="Board / Kanban View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#D2925B] text-[#242B31]'
                    : 'text-[#868A7A] hover:text-[#F4F0E9]'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#434D56]/50">
          {/* Filter Tabs */}
          <div className="flex bg-[#242B31] p-1 rounded-lg border border-[#434D56] text-xs">
            {(['all', 'today', 'upcoming', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                  filterTab === tab
                    ? 'bg-[#2E373F] text-[#D2925B]'
                    : 'text-[#868A7A] hover:text-[#F4F0E9]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#868A7A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:outline-hidden w-36 sm:w-48"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:outline-hidden"
            >
              <option value="all">All Areas</option>
              <option value="education">Education</option>
              <option value="career">Career</option>
              <option value="fitness">Fitness</option>
              <option value="health">Health</option>
              <option value="personal_development">Personal</option>
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#242B31] border border-[#434D56] text-[#F4F0E9] text-xs focus:outline-hidden"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inline Fast Task Creator */}
      <form
        onSubmit={handleCreateInline}
        className="p-4 rounded-xl bg-[#242B31] border border-[#434D56] flex flex-wrap items-center gap-3"
      >
        <Plus className="w-4 h-4 text-[#D2925B] shrink-0" />
        <input
          type="text"
          required
          value={inlineTitle}
          onChange={e => setInlineTitle(e.target.value)}
          placeholder="Create task quickly... (press Enter to add)"
          className="flex-1 min-w-[200px] bg-transparent border-0 text-[#F4F0E9] text-xs focus:outline-hidden placeholder-[#868A7A]"
        />
        <select
          value={inlineCategory}
          onChange={e => setInlineCategory(e.target.value as LifeArea)}
          className="px-2 py-1 rounded bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
        >
          <option value="career">Career</option>
          <option value="education">Education</option>
          <option value="fitness">Fitness</option>
          <option value="personal_development">Personal</option>
        </select>
        <select
          value={inlinePriority}
          onChange={e => setInlinePriority(e.target.value as Priority)}
          className="px-2 py-1 rounded bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
        >
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          value={inlineDueDate}
          onChange={e => setInlineDueDate(e.target.value)}
          className="px-2 py-1 rounded bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded-lg bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-semibold text-xs transition-colors shrink-0"
        >
          Add
        </button>
      </form>

      {/* Main View Display */}
      {viewMode === 'board' ? (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.status);
            return (
              <div
                key={col.status}
                className="p-4 rounded-2xl bg-[#2E373F]/70 border border-[#434D56]/60 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#434D56]/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#F4F0E9]">
                      {col.label}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#242B31] text-[#D2925B] font-bold">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#868A7A]">
                      No tasks in {col.label}
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const isDone = task.status === 'completed';
                      const pColor = getPriorityColor(task.priority);

                      return (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-xl bg-[#242B31] border border-[#434D56] hover:border-[#D2925B]/60 transition-all space-y-2 group shadow-xs cursor-pointer"
                          onClick={() => setEditingTask(task)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                isDone ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-[#A8A8A2] line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Subtasks Progress if any */}
                          {task.subtasks.length > 0 && (
                            <div className="text-[10px] text-[#868A7A] flex items-center gap-1 font-mono">
                              <CheckSquare className="w-3 h-3 text-[#D2925B]" />
                              <span>
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-[#434D56]/30">
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-semibold ${pColor.bg} ${pColor.text} ${pColor.border}`}
                            >
                              {task.priority}
                            </span>

                            {task.dueDate && (
                              <span className="text-[10px] font-mono text-[#868A7A]">
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-[#868A7A] space-y-2">
              <CheckSquare className="w-8 h-8 mx-auto opacity-30 text-[#D2925B]" />
              <p className="text-sm font-medium text-[#F4F0E9]">No matching tasks</p>
              <p className="text-xs text-[#A8A8A2]">Create your first task or change filter options above.</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isDone = task.status === 'completed';
              const pColor = getPriorityColor(task.priority);

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isDone
                      ? 'bg-[#242B31]/50 border-[#434D56]/40 opacity-70'
                      : 'bg-[#242B31] border-[#434D56] hover:border-[#D2925B]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="text-[#868A7A] hover:text-[#5B8C67] shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-[#5B8C67]" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-semibold truncate ${isDone ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-[#868A7A] mt-0.5">
                        <span className="capitalize">{task.category}</span>
                        {task.dueDate && <span>• Due {task.dueDate}</span>}
                        {task.subtasks.length > 0 && (
                          <span>
                            • {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-semibold ${pColor.bg} ${pColor.text} ${pColor.border}`}
                    >
                      {task.priority}
                    </span>
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1 rounded text-[#868A7A] hover:text-[#F4F0E9] hover:bg-[#2E373F]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 rounded text-[#868A7A] hover:text-[#E57373] hover:bg-[#2E373F]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Task Edit / Detail Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-xl bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#434D56] bg-[#22292F]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#D2925B]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">Task Details</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={e => {
                    const updated = { ...editingTask, title: e.target.value };
                    setEditingTask(updated);
                    updateTask(editingTask.id, { title: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs font-medium focus:outline-hidden"
                />
              </div>

              {/* Status & Priority Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={e => {
                      const newStatus = e.target.value as TaskStatus;
                      setEditingTask({ ...editingTask, status: newStatus });
                      updateTask(editingTask.id, { status: newStatus });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  >
                    <option value="inbox">Inbox</option>
                    <option value="not_started">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={e => {
                      const newPriority = e.target.value as Priority;
                      setEditingTask({ ...editingTask, priority: newPriority });
                      updateTask(editingTask.id, { priority: newPriority });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate || ''}
                    onChange={e => {
                      setEditingTask({ ...editingTask, dueDate: e.target.value });
                      updateTask(editingTask.id, { dueDate: e.target.value || undefined });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingTask.description || ''}
                  onChange={e => {
                    setEditingTask({ ...editingTask, description: e.target.value });
                    updateTask(editingTask.id, { description: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                />
              </div>

              {/* Subtasks Section */}
              <div className="space-y-2 pt-2 border-t border-[#434D56]/60">
                <span className="text-xs font-semibold text-[#F4F0E9] block">Subtasks</span>
                <div className="space-y-1.5">
                  {editingTask.subtasks.map(st => (
                    <div
                      key={st.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#2E373F] border border-[#434D56]/40"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtaskCompleted(editingTask.id, st.id)}
                        className="text-[#868A7A] hover:text-[#5B8C67]"
                      >
                        {st.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#5B8C67]" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <span className={`text-xs flex-1 ${st.completed ? 'line-through text-[#868A7A]' : 'text-[#F4F0E9]'}`}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
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

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[#434D56] bg-[#22292F] flex items-center justify-between">
              <button
                onClick={() => {
                  deleteTask(editingTask.id);
                  setEditingTask(null);
                }}
                className="text-xs text-[#E57373] hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-1.5 rounded-lg bg-[#D2925B] text-[#242B31] font-semibold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
