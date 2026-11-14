import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  List,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { Task, TaskStatus, Priority, LifeArea } from '../../types';
import { getPriorityColor } from '../../lib/logic';
import { ModalShell, AnimatedCheckButton, MOMENTUM_EASE } from '../common/MotionPrimitives';

type TaskViewMode = 'board' | 'list';
type QuickFilterTab = 'all' | 'today' | 'upcoming' | 'completed';

export const TasksView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompleted,
    toggleSubtaskCompleted,
  } = useApp();

  const [viewMode, setViewMode] = useState<TaskViewMode>('board');
  const [filterTab, setFilterTab] = useState<QuickFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Fast inline task creation state
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineCategory, setInlineCategory] = useState<LifeArea>('career');
  const [inlinePriority, setInlinePriority] = useState<Priority>('medium');
  const [inlineDueDate, setInlineDueDate] = useState('');

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const activeEditingTask = editingTask
    ? state.tasks.find(t => t.id === editingTask.id) ?? editingTask
    : null;

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = useMemo(() => {
    return state.tasks.filter(t => {
      if (filterTab === 'today') {
        if (t.dueDate !== todayStr && !t.isDailyPriority) return false;
      } else if (filterTab === 'upcoming') {
        if (!t.dueDate || t.dueDate <= todayStr || t.status === 'completed') return false;
      } else if (filterTab === 'completed') {
        if (t.status !== 'completed') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      return true;
    });
  }, [state.tasks, filterTab, searchQuery, categoryFilter, priorityFilter, todayStr]);

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
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* View Header & Controls */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
              Task Management
            </h1>
            <p className="text-xs text-ink-muted">
              Track execution, configure subtasks, and organize work into Kanban or list view.
            </p>
          </div>

          <div className="flex bg-surface-warm p-1 rounded-xl border border-line relative self-start sm:self-auto">
            {(['board', 'list'] as const).map(mode => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`relative z-10 px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    isActive ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tasks-view-mode-pill"
                      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                      className="absolute inset-0 bg-accent rounded-lg -z-10"
                    />
                  )}
                  {mode === 'board' ? (
                    <LayoutGrid className="w-3.5 h-3.5" />
                  ) : (
                    <List className="w-3.5 h-3.5" />
                  )}
                  <span className="capitalize">{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-line">
          <div className="flex bg-surface-warm p-1 rounded-xl border border-line text-xs relative overflow-x-auto max-w-full">
            {(['all', 'today', 'upcoming', 'completed'] as const).map(tab => {
              const isActive = filterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`relative z-10 px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors whitespace-nowrap shrink-0 ${
                    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tasks-filter-tab-pill"
                      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                      className="absolute inset-0 bg-surface-inset border border-line rounded-lg -z-10"
                    />
                  )}
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="w-full sm:w-48 pl-8 pr-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs placeholder:text-ink-muted focus:outline-hidden focus:ring-2 focus:ring-accent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              aria-label="Filter by life area"
              className="px-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
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
              aria-label="Filter by priority"
              className="px-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
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
        className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-line flex flex-wrap items-center gap-2.5"
      >
        <Plus className="w-4 h-4 text-accent shrink-0" />
        <input
          type="text"
          required
          value={inlineTitle}
          onChange={e => setInlineTitle(e.target.value)}
          placeholder="Create task quickly... (press Enter to add)"
          className="flex-1 min-w-[200px] bg-transparent border-0 text-ink text-xs focus:outline-hidden placeholder:text-ink-muted py-1.5"
        />
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={inlineCategory}
            onChange={e => setInlineCategory(e.target.value as LifeArea)}
            aria-label="Task life area"
            className="px-2.5 py-1.5 rounded-lg bg-canvas border border-line text-xs text-ink focus:outline-hidden"
          >
            <option value="career">Career</option>
            <option value="education">Education</option>
            <option value="fitness">Fitness</option>
            <option value="personal_development">Personal</option>
          </select>
          <select
            value={inlinePriority}
            onChange={e => setInlinePriority(e.target.value as Priority)}
            aria-label="Task priority"
            className="px-2.5 py-1.5 rounded-lg bg-canvas border border-line text-xs text-ink focus:outline-hidden"
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
            aria-label="Task due date"
            className="px-2.5 py-1.5 rounded-lg bg-canvas border border-line text-xs text-ink font-mono focus:outline-hidden"
          />
          <button
            type="submit"
            className="btn-press px-4 py-1.5 min-h-[36px] rounded-lg bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors shrink-0"
          >
            Add
          </button>
        </div>
      </form>

      {/* Main View Display */}
      <AnimatePresence mode="wait" initial={false}>
        {viewMode === 'board' ? (
          <motion.div
            key="board"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.status);
              return (
                <div
                  key={col.status}
                  className="p-4 rounded-2xl bg-surface border border-line flex flex-col min-h-[320px] lg:min-h-[480px]"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
                    <span className="text-xs font-semibold text-ink">{col.label}</span>
                    <span className="font-mono text-xs text-ink-muted tabular-nums">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                    {colTasks.length === 0 ? (
                      <div className="py-10 text-center text-xs text-ink-muted">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {colTasks.map(task => {
                          const isDone = task.status === 'completed';
                          const pColor = getPriorityColor(task.priority);

                          return (
                            <motion.div
                              key={task.id}
                              layout={!prefersReduced}
                              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                              transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                              className="p-3.5 rounded-xl bg-surface-warm/60 border border-line hover:border-accent/60 transition-colors space-y-2 card-hover"
                            >
                              <button
                                type="button"
                                onClick={() => setEditingTask(task)}
                                className="w-full text-left space-y-1.5"
                              >
                                <span
                                  className={`block text-xs font-semibold transition-colors ${
                                    isDone ? 'line-through text-ink-muted' : 'text-ink'
                                  }`}
                                >
                                  {task.title}
                                </span>

                                {task.description && (
                                  <p className="text-[11px] text-ink-muted line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                              </button>

                              {task.learningModuleTitle && (
                                <div className="text-[11px] text-accent font-medium truncate">
                                  {task.learningModuleTitle}
                                  {task.learningLessonTitle ? ` · ${task.learningLessonTitle}` : ''}
                                </div>
                              )}

                              {task.subtasks.length > 0 && (
                                <div className="text-[11px] text-ink-muted flex items-center gap-1 font-mono tabular-nums">
                                  <CheckSquare className="w-3 h-3 text-accent" />
                                  <span>
                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-line text-[11px]">
                                <span className={`font-medium capitalize ${pColor.text}`}>
                                  {task.priority}
                                </span>
                                {task.dueDate && (
                                  <span className="font-mono text-ink-muted tabular-nums">
                                    {task.dueDate}
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="p-4 sm:p-6 rounded-2xl bg-surface border border-line"
          >
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-ink-muted space-y-2">
                <CheckSquare className="w-8 h-8 mx-auto opacity-40 text-accent" />
                <p className="text-sm font-medium text-ink">No matching tasks</p>
                <p className="text-xs text-ink-muted">
                  Create your first task or change filter options above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {filteredTasks.map(task => {
                    const isDone = task.status === 'completed';
                    const pColor = getPriorityColor(task.priority);

                    return (
                      <motion.div
                        key={task.id}
                        layout={!prefersReduced}
                        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                        transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                        className={`py-3 flex items-center justify-between gap-3 min-h-[48px] ${
                          isDone ? 'opacity-65' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <AnimatedCheckButton
                            checked={isDone}
                            size="sm"
                            onClick={() => toggleTaskCompleted(task.id)}
                            ariaLabel={isDone ? `Mark "${task.title}" incomplete` : `Complete "${task.title}"`}
                          />
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-medium truncate transition-colors ${
                                isDone ? 'line-through text-ink-muted' : 'text-ink'
                              }`}
                            >
                              {task.title}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted mt-0.5">
                              <span className="capitalize">{task.category.replace('_', ' ')}</span>
                              {task.learningModuleTitle && (
                                <span className="text-accent font-medium truncate max-w-[220px]">
                                  · {task.learningModuleTitle}
                                  {task.learningLessonTitle ? ` · ${task.learningLessonTitle}` : ''}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="font-mono tabular-nums">· Due {task.dueDate}</span>
                              )}
                              {task.subtasks.length > 0 && (
                                <span className="font-mono tabular-nums">
                                  · {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-medium capitalize ${pColor.text}`}>
                            {task.priority}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingTask(task)}
                            className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm transition-colors"
                            aria-label={`Edit "${task.title}"`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-surface-warm transition-colors"
                            aria-label={`Delete "${task.title}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Edit / Detail Modal */}
      <ModalShell
        isOpen={Boolean(activeEditingTask)}
        onClose={() => setEditingTask(null)}
        maxWidthClass="max-w-xl"
      >
        {activeEditingTask && (
          <>
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line bg-surface-warm">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-blue" />
                <h3 className="text-sm font-semibold text-ink">Task Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink transition-colors"
                aria-label="Close task details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Title</label>
                <input
                  type="text"
                  value={activeEditingTask.title}
                  onChange={e => {
                    const updated = { ...activeEditingTask, title: e.target.value };
                    setEditingTask(updated);
                    updateTask(activeEditingTask.id, { title: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-ink text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Status</label>
                  <select
                    value={activeEditingTask.status}
                    onChange={e => {
                      const newStatus = e.target.value as TaskStatus;
                      setEditingTask({ ...activeEditingTask, status: newStatus });
                      updateTask(activeEditingTask.id, { status: newStatus });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:outline-hidden"
                  >
                    <option value="inbox">Inbox</option>
                    <option value="not_started">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Priority</label>
                  <select
                    value={activeEditingTask.priority}
                    onChange={e => {
                      const newPriority = e.target.value as Priority;
                      setEditingTask({ ...activeEditingTask, priority: newPriority });
                      updateTask(activeEditingTask.id, { priority: newPriority });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:outline-hidden"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={activeEditingTask.dueDate || ''}
                    onChange={e => {
                      setEditingTask({ ...activeEditingTask, dueDate: e.target.value });
                      updateTask(activeEditingTask.id, { dueDate: e.target.value || undefined });
                    }}
                    className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={activeEditingTask.description || ''}
                  onChange={e => {
                    setEditingTask({ ...activeEditingTask, description: e.target.value });
                    updateTask(activeEditingTask.id, { description: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:outline-hidden"
                />
              </div>

              <div className="space-y-2.5 pt-3 border-t border-line">
                <span className="text-xs font-semibold text-ink block">Subtasks</span>
                <div className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {activeEditingTask.subtasks.map(st => (
                      <motion.div
                        key={st.id}
                        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                        transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-warm/60 border border-line"
                      >
                        <AnimatedCheckButton
                          checked={st.completed}
                          size="sm"
                          onClick={() => toggleSubtaskCompleted(activeEditingTask.id, st.id)}
                          ariaLabel={st.completed ? `Uncheck ${st.title}` : `Complete ${st.title}`}
                        />
                        <span
                          className={`text-xs flex-1 transition-colors ${
                            st.completed ? 'line-through text-ink-muted' : 'text-ink'
                          }`}
                        >
                          {st.title}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-line bg-surface-warm flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  deleteTask(activeEditingTask.id);
                  setEditingTask(null);
                }}
                className="btn-press text-xs text-danger hover:underline flex items-center gap-1.5 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </ModalShell>
    </div>
  );
};
