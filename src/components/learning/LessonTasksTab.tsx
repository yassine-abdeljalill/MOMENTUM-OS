import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Edit3,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { Priority } from '../../types';
import type { LearningTask, LearningTaskKind, LearningTaskStatus } from '../../types/learning';
import { learningApi } from '../../lib/learningApi';
import {
  LEARNING_TASK_KIND_LABELS,
  LEARNING_TASK_STATUS_META,
} from '../../lib/learning';
import { getPriorityColor } from '../../lib/logic';
import { useApp } from '../../lib/context';
import { AnimatedCheckButton, AnimatedProgressBar, ModalShell } from '../common/MotionPrimitives';
import { ConfirmDeleteDialog } from './LearningShared';

export const LessonTasksTab: React.FC<{
  moduleId: string;
  lessonId: string | null;
  tasks: LearningTask[];
  scopeLabel?: string;
}> = ({ moduleId, lessonId, tasks, scopeLabel = 'lesson' }) => {
  const { updateLearningData, showToast } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | LearningTaskStatus>('all');
  const [kindFilter, setKindFilter] = useState<'all' | LearningTaskKind>('all');

  // Quick create form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<LearningTask | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskKind, setTaskKind] = useState<LearningTaskKind>('task');
  const [status, setStatus] = useState<LearningTaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Quick inline input
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineKind, setInlineKind] = useState<LearningTaskKind>('exercise');
  const [inlineDueDate, setInlineDueDate] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<LearningTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (kindFilter !== 'all' && t.taskKind !== kindFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, kindFilter]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setTaskKind('assignment');
    setStatus('todo');
    setPriority('medium');
    setDueDate('');
    setShowCreateModal(true);
  };

  const openEditModal = (t: LearningTask) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setTaskKind(t.taskKind);
    setStatus(t.status);
    setPriority(t.priority);
    setDueDate(t.dueDate || '');
    setShowCreateModal(true);
  };

  const handleQuickInlineCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) return;
    try {
      const { task } = await learningApi.createTask({
        moduleId,
        lessonId,
        title: inlineTitle.trim(),
        taskKind: inlineKind,
        status: 'todo',
        priority: 'medium',
        dueDate: inlineDueDate,
      });
      updateLearningData(prev => ({
        ...prev,
        tasks: [task, ...prev.tasks],
      }));
      setInlineTitle('');
      setInlineDueDate('');
      showToast('Task added & synced to Tasks and Calendar');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add task.', 'error');
    }
  };

  const handleSaveTaskModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editingTask) {
        const { task: updated } = await learningApi.updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          taskKind,
          status,
          priority,
          dueDate,
        });
        updateLearningData(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => (t.id === updated.id ? updated : t)),
        }));
        showToast('Task updated');
      } else {
        const { task: created } = await learningApi.createTask({
          moduleId,
          lessonId,
          title: title.trim(),
          description: description.trim(),
          taskKind,
          status,
          priority,
          dueDate,
        });
        updateLearningData(prev => ({
          ...prev,
          tasks: [created, ...prev.tasks],
        }));
        showToast('Task created & synced with Tasks and Calendar');
      }
      setShowCreateModal(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save task.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCompleted = async (t: LearningTask) => {
    const nextStatus: LearningTaskStatus = t.status === 'completed' ? 'todo' : 'completed';
    try {
      const { task: updated } = await learningApi.updateTask(t.id, { status: nextStatus });
      updateLearningData(prev => ({
        ...prev,
        tasks: prev.tasks.map(item => (item.id === updated.id ? updated : item)),
      }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status.', 'error');
    }
  };

  const handleChangeStatus = async (t: LearningTask, nextStatus: LearningTaskStatus) => {
    try {
      const { task: updated } = await learningApi.updateTask(t.id, { status: nextStatus });
      updateLearningData(prev => ({
        ...prev,
        tasks: prev.tasks.map(item => (item.id === updated.id ? updated : item)),
      }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to update status.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await learningApi.deleteTask(deleteTarget.id);
      updateLearningData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
      showToast('Task deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete task.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Summary & Sync Info */}
      <div className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#3B2418]">
              {scopeLabel === 'module' ? 'Module Tasks & Assignments' : 'Tasks, Practical Labs & Exercises'}
            </span>
            <span className="font-mono text-xs font-bold text-[#1E5A99] tabular-nums">
              {completedCount}/{tasks.length} completed ({pct}%)
            </span>
          </div>
          <AnimatedProgressBar
            percentage={pct}
            trackClassName="w-full h-1.5 rounded-full bg-[#EAE0D0] overflow-hidden"
            fillClassName="h-full bg-[#3E7B52] rounded-full"
          />
          <p className="text-[11px] text-[#6E5648]">
            Tasks created here automatically appear on the main MOMENTUM Tasks board and Calendar without duplication.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-press flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Task / Lab</span>
        </button>
      </div>

      {/* Quick Inline Add */}
      <form
        onSubmit={handleQuickInlineCreate}
        className="p-3.5 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] flex flex-wrap items-center gap-2.5"
      >
        <Plus className="w-4 h-4 text-[#1E5A99] shrink-0" />
        <input
          type="text"
          value={inlineTitle}
          onChange={e => setInlineTitle(e.target.value)}
          placeholder="Quick add exercise, lab, or assignment..."
          className="flex-1 min-w-[200px] bg-transparent text-xs text-[#3B2418] focus:outline-hidden placeholder-[#6E5648]"
        />
        <select
          value={inlineKind}
          onChange={e => setInlineKind(e.target.value as LearningTaskKind)}
          className="px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
        >
          <option value="task">Task</option>
          <option value="assignment">Assignment</option>
          <option value="lab">Practical Lab</option>
          <option value="exercise">Exercise</option>
        </select>
        <input
          type="date"
          value={inlineDueDate}
          onChange={e => setInlineDueDate(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
          aria-label="Deadline"
        />
        <button
          type="submit"
          className="btn-press px-3 py-1.5 rounded-lg bg-[#3B2418] text-[#F2E8DA] text-xs font-semibold hover:bg-[#4D3021]"
        >
          Add
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'todo', 'in_progress', 'completed'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === st
                  ? 'bg-[#3B2418] text-[#8EC5FF] border-[#3B2418]'
                  : 'bg-[#FAF5ED] text-[#6E5648] border-[#D6C6B2] hover:text-[#3B2418]'
              }`}
            >
              {st === 'all' ? 'All' : LEARNING_TASK_STATUS_META[st].label}
            </button>
          ))}
        </div>

        <select
          value={kindFilter}
          onChange={e => setKindFilter(e.target.value as any)}
          className="px-2.5 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418]"
        >
          <option value="all">All Types</option>
          <option value="task">Tasks</option>
          <option value="assignment">Assignments</option>
          <option value="lab">Practical Labs</option>
          <option value="exercise">Exercises</option>
        </select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] text-center space-y-2">
          <CheckSquare className="w-8 h-8 text-[#1E5A99] mx-auto opacity-60" />
          <p className="text-sm font-semibold text-[#3B2418]">
            {tasks.length === 0 ? `No tasks or exercises for this ${scopeLabel} yet` : 'No tasks match current filters'}
          </p>
          <p className="text-xs text-[#6E5648]">
            Track assignments, hands-on labs, and practice exercises with deadlines and priorities.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map(t => {
            const isDone = t.status === 'completed';
            const pColor = getPriorityColor(t.priority);
            return (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-[#EAE0D0]/60 border-[#D6C6B2] opacity-80'
                    : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="pt-0.5">
                    <AnimatedCheckButton
                      checked={isDone}
                      size="sm"
                      onClick={() => void handleToggleCompleted(t)}
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-[#6E5648] line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6E5648]">
                      <span className="font-medium text-[#1E5A99]">
                        {LEARNING_TASK_KIND_LABELS[t.taskKind]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-mono text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded border ${pColor.bg} ${pColor.text} ${pColor.border}`}
                      >
                        {t.priority}
                      </span>
                      {t.dueDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                            <Calendar className="w-3 h-3" />
                            Due {t.dueDate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <select
                    value={t.status}
                    onChange={e => void handleChangeStatus(t, e.target.value as LearningTaskStatus)}
                    className="px-2 py-1 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-medium text-[#3B2418]"
                    aria-label="Task status"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => openEditModal(t)}
                    className="btn-press p-1.5 rounded-lg text-[#6E5648] hover:text-[#3B2418] hover:bg-[#EAE0D0]"
                    title="Edit task"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    className="btn-press p-1.5 rounded-lg text-[#6E5648] hover:text-[#B84A44] hover:bg-[#EAE0D0]"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      <ModalShell isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidthClass="max-w-lg">
        <div className="px-6 py-4 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F2E8DA]">
            {editingTask ? 'Edit Learning Task' : 'New Task / Exercise'}
          </h3>
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSaveTaskModal} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Complete Wireshark TLS Handshake Lab"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Type</label>
              <select
                value={taskKind}
                onChange={e => setTaskKind(e.target.value as LearningTaskKind)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
              >
                <option value="task">Task</option>
                <option value="assignment">Assignment</option>
                <option value="lab">Practical Lab</option>
                <option value="exercise">Exercise</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as LearningTaskStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Deadline</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Deliverables, steps, or grading rubric..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15"
            >
              {saving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </ModalShell>

      <ConfirmDeleteDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Task"
        description={`Delete "${deleteTarget?.title || ''}"? It will also be removed from your main Tasks board and Calendar.`}
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
