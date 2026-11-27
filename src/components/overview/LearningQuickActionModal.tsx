import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileText, FlaskConical, StickyNote, X } from 'lucide-react';
import { useApp } from '../../lib/context';
import { learningApi } from '../../lib/learningApi';
import type { Priority } from '../../types';
import type { LearningLesson, LearningModule } from '../../types/learning';
import { ModalShell } from '../common/MotionPrimitives';

export type LearningQuickActionKind = 'assignment' | 'lab' | 'note';

function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .split(/\n{2,}/)
    .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

const MODAL_META: Record<
  LearningQuickActionKind,
  { title: string; subtitle: string; submitLabel: string; Icon: React.ElementType }
> = {
  assignment: {
    title: 'Add Assignment',
    subtitle: 'Attach an assignment with a due date to any learning module.',
    submitLabel: 'Save Assignment',
    Icon: FileText,
  },
  lab: {
    title: 'Create Practical Lab',
    subtitle: 'Add a hands-on lab exercise tracked in Weekly Progress and Deadlines.',
    submitLabel: 'Create Lab',
    Icon: FlaskConical,
  },
  note: {
    title: 'Add Learning Note',
    subtitle: 'Capture a study note directly inside a module lesson.',
    submitLabel: 'Save Note',
    Icon: StickyNote,
  },
};

export const LearningQuickActionModal: React.FC<{
  isOpen: boolean;
  kind: LearningQuickActionKind;
  onClose: () => void;
}> = ({ isOpen, kind, onClose }) => {
  const {
    learningData,
    updateLearningData,
    setSelectedLearningModuleId,
    setSelectedLearningLessonId,
    showToast,
  } = useApp();

  const modules = learningData?.modules || [];
  const lessons = learningData?.lessons || [];

  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [createNewModule, setCreateNewModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [createNewLesson, setCreateNewLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<Priority>('high');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const moduleLessons = useMemo(
    () =>
      lessons
        .filter(l => l.moduleId === selectedModuleId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
    [lessons, selectedModuleId]
  );

  useEffect(() => {
    if (!isOpen) return;
    const currentModules = learningData?.modules || [];
    const currentLessons = learningData?.lessons || [];
    const defaultModuleId = currentModules[0]?.id || '';
    const needNewModule = currentModules.length === 0;
    setSelectedModuleId(defaultModuleId);
    setCreateNewModule(needNewModule);
    setNewModuleTitle('');

    const matchingLessons = currentLessons.filter(l => l.moduleId === defaultModuleId);
    setSelectedLessonId(matchingLessons[0]?.id || '');
    setCreateNewLesson(kind === 'note' && (needNewModule || matchingLessons.length === 0));
    setNewLessonTitle('');

    setTitle('');
    setDescription('');
    setPriority(kind === 'lab' ? 'high' : 'medium');
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 3);
    setDueDate(defaultDue.toISOString().split('T')[0]);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, kind]);

  useEffect(() => {
    if (!isOpen || createNewModule) return;
    const firstLesson = moduleLessons[0]?.id || '';
    if (!moduleLessons.some(l => l.id === selectedLessonId)) {
      setSelectedLessonId(firstLesson);
    }
    if (kind === 'note' && moduleLessons.length === 0) {
      setCreateNewLesson(true);
    }
  }, [isOpen, createNewModule, moduleLessons, selectedLessonId, kind]);

  const meta = MODAL_META[kind];
  const HeaderIcon = meta.Icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(kind === 'note' ? 'Note title is required.' : 'Title is required.');
      return;
    }
    if (createNewModule && !newModuleTitle.trim()) {
      setError('Module title is required when creating a new module.');
      return;
    }
    if ((kind === 'note' && (createNewLesson || createNewModule || !selectedLessonId)) && !newLessonTitle.trim()) {
      setError('Lesson title is required for a learning note.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let targetModule: LearningModule | null = null;
      let targetLesson: LearningLesson | null = null;

      if (createNewModule || !selectedModuleId) {
        const res = await learningApi.createModule({
          title: newModuleTitle.trim(),
          icon: kind === 'lab' ? 'flask' : 'book',
          status: 'in_progress',
        });
        targetModule = res.module;
      } else {
        targetModule = modules.find(m => m.id === selectedModuleId) || null;
      }

      if (!targetModule) {
        throw new Error('Unable to resolve target learning module.');
      }

      const shouldCreateLesson =
        createNewLesson || (kind === 'note' && (!selectedLessonId || createNewModule));

      if (shouldCreateLesson && newLessonTitle.trim()) {
        const res = await learningApi.createLesson({
          moduleId: targetModule.id,
          title: newLessonTitle.trim(),
          status: 'in_progress',
          studyDurationMinutes: 45,
        });
        targetLesson = res.lesson;
      } else if (selectedLessonId && !createNewModule) {
        targetLesson = lessons.find(l => l.id === selectedLessonId) || null;
      }

      if (kind === 'note') {
        if (!targetLesson) {
          throw new Error('Select or create a lesson to attach this note.');
        }
        const { note } = await learningApi.createNote({
          lessonId: targetLesson.id,
          title: title.trim(),
          contentHtml: description.trim() ? plainTextToHtml(description.trim()) : '<p></p>',
        });

        updateLearningData(prev => ({
          ...prev,
          modules: prev.modules.some(m => m.id === targetModule!.id)
            ? prev.modules
            : [...prev.modules, targetModule!],
          lessons:
            targetLesson && !prev.lessons.some(l => l.id === targetLesson!.id)
              ? [...prev.lessons, targetLesson]
              : prev.lessons,
          notes: [note, ...prev.notes],
        }));

        setSelectedLearningModuleId(targetModule.id);
        setSelectedLearningLessonId(targetLesson.id);
        showToast('Learning note saved.');
      } else {
        const { task } = await learningApi.createTask({
          moduleId: targetModule.id,
          lessonId: targetLesson?.id || null,
          title: title.trim(),
          description: description.trim(),
          taskKind: kind === 'lab' ? 'lab' : 'assignment',
          status: 'todo',
          priority,
          dueDate: dueDate || '',
        });

        updateLearningData(prev => ({
          ...prev,
          modules: prev.modules.some(m => m.id === targetModule!.id)
            ? prev.modules
            : [...prev.modules, targetModule!],
          lessons:
            targetLesson && !prev.lessons.some(l => l.id === targetLesson!.id)
              ? [...prev.lessons, targetLesson]
              : prev.lessons,
          tasks: [task, ...prev.tasks],
        }));

        showToast(kind === 'lab' ? 'Practical lab created.' : 'Assignment added.');
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to save item right now.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl bg-surface-warm/70 border border-line text-ink text-xs focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden';

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface-warm/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center shrink-0">
            <HeaderIcon className="w-4 h-4 text-ink" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink truncate">{meta.title}</h2>
            <p className="text-[11px] text-ink-muted truncate">{meta.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors"
          aria-label={`Close ${meta.title}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div
            role="alert"
            className="px-3 py-2.5 rounded-xl bg-surface-inset border border-line-strong text-xs text-ink font-medium"
          >
            {error}
          </div>
        )}

        {/* Module Selection or Inline Creation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="lqa-module" className="text-xs font-medium text-ink-muted">
              Learning Module <span className="text-ink">*</span>
            </label>
            {modules.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const next = !createNewModule;
                  setCreateNewModule(next);
                  if (next && kind === 'note') {
                    setCreateNewLesson(true);
                  }
                }}
                className="text-[11px] font-medium text-ink hover:underline"
              >
                {createNewModule ? 'Choose existing module' : '+ New module'}
              </button>
            )}
          </div>

          {createNewModule ? (
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-ink-muted shrink-0" />
              <input
                id="lqa-module"
                type="text"
                required
                value={newModuleTitle}
                onChange={e => setNewModuleTitle(e.target.value)}
                placeholder="e.g. Network Security Protocols"
                className={inputCls}
              />
            </div>
          ) : (
            <select
              id="lqa-module"
              value={selectedModuleId}
              onChange={e => setSelectedModuleId(e.target.value)}
              className={inputCls}
            >
              {modules.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Lesson Selection or Inline Creation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="lqa-lesson" className="text-xs font-medium text-ink-muted">
              Lesson {kind === 'note' ? <span className="text-ink">*</span> : '(Optional)'}
            </label>
            {!createNewModule && moduleLessons.length > 0 && (
              <button
                type="button"
                onClick={() => setCreateNewLesson(prev => !prev)}
                className="text-[11px] font-medium text-ink hover:underline"
              >
                {createNewLesson ? 'Choose existing lesson' : '+ New lesson'}
              </button>
            )}
          </div>

          {createNewLesson || createNewModule || (kind === 'note' && moduleLessons.length === 0) ? (
            <input
              id="lqa-lesson"
              type="text"
              required={kind === 'note'}
              value={newLessonTitle}
              onChange={e => setNewLessonTitle(e.target.value)}
              placeholder={
                kind === 'note'
                  ? 'e.g. TLS 1.3 Key Schedule'
                  : 'Optional: create new lesson title...'
              }
              className={inputCls}
            />
          ) : (
            <select
              id="lqa-lesson"
              value={selectedLessonId}
              onChange={e => setSelectedLessonId(e.target.value)}
              className={inputCls}
            >
              {kind !== 'note' && <option value="">Module-level (no specific lesson)</option>}
              {moduleLessons.map(l => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="lqa-title" className="block text-xs font-medium text-ink-muted mb-1">
            {kind === 'note' ? 'Note Title' : kind === 'lab' ? 'Lab Title' : 'Assignment Title'}{' '}
            <span className="text-ink">*</span>
          </label>
          <input
            id="lqa-title"
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={
              kind === 'note'
                ? 'e.g. Forward secrecy & ephemeral Diffie-Hellman notes'
                : kind === 'lab'
                ? 'e.g. Configure RPKI Route Origin Validation Lab'
                : 'e.g. Threat Modeling Report for API Gateway'
            }
            className={`${inputCls} text-sm`}
            autoFocus
          />
        </div>

        {kind !== 'note' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lqa-due" className="block text-xs font-medium text-ink-muted mb-1">
                Due Date
              </label>
              <input
                id="lqa-due"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label htmlFor="lqa-priority" className="block text-xs font-medium text-ink-muted mb-1">
                Priority
              </label>
              <select
                id="lqa-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className={inputCls}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="lqa-body" className="block text-xs font-medium text-ink-muted mb-1">
            {kind === 'note' ? 'Note Content' : 'Details & Scope (Optional)'}
          </label>
          <textarea
            id="lqa-body"
            rows={kind === 'note' ? 4 : 2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              kind === 'note'
                ? 'Write key takeaways, commands, or summary points...'
                : 'Acceptance criteria, submission notes, or lab steps...'
            }
            className={inputCls}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press px-4 py-2 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-accent-ink disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? 'Saving...' : meta.submitLabel}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
