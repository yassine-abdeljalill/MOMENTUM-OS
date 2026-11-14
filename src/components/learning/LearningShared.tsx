import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  Cpu,
  Code2,
  Database,
  FlaskConical,
  Globe,
  Layers,
  Network,
  Plus,
  Shield,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import type { LearningLesson, LearningModule, LearningModuleIcon, LearningStatus } from '../../types/learning';
import { LEARNING_STATUS_META, MODULE_COLOR_PALETTE } from '../../lib/learning';
import { ModalShell } from '../common/MotionPrimitives';

export const DARK_SWATCH_HEXES = new Set([
  '#64432B',
  '#333C44',
  '#3E7B52',
  '#B84A44',
  '#4F6652',
  '#7D5A44',
  '#3B2418',
  '#4D3021',
  '#1E5A99',
]);

export const MODULE_ICON_OPTIONS: { id: LearningModuleIcon; label: string; Icon: React.ElementType }[] = [
  { id: 'book', label: 'Course', Icon: BookOpen },
  { id: 'shield', label: 'Security', Icon: Shield },
  { id: 'code', label: 'Code', Icon: Code2 },
  { id: 'terminal', label: 'Systems', Icon: Terminal },
  { id: 'network', label: 'Network', Icon: Network },
  { id: 'database', label: 'Data', Icon: Database },
  { id: 'cpu', label: 'Hardware', Icon: Cpu },
  { id: 'globe', label: 'Web', Icon: Globe },
  { id: 'layers', label: 'Architecture', Icon: Layers },
  { id: 'flask', label: 'Lab', Icon: FlaskConical },
  { id: 'compass', label: 'Foundations', Icon: Compass },
  { id: 'award', label: 'Cert', Icon: Award },
];

export const ModuleIconView: React.FC<{
  icon: LearningModuleIcon;
  className?: string;
  style?: React.CSSProperties;
}> = ({ icon, className = 'w-4 h-4', style }) => {
  const found = MODULE_ICON_OPTIONS.find(o => o.id === icon);
  const Icon = found ? found.Icon : BookOpen;
  return <Icon className={className} style={style} />;
};

export const StatusLabel: React.FC<{
  status: LearningStatus;
  compact?: boolean;
}> = ({ status, compact = false }) => {
  const meta = LEARNING_STATUS_META[status];
  const Icon =
    status === 'completed' ? CheckCircle2 : status === 'in_progress' ? Clock : Circle;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium whitespace-nowrap shrink-0 ${
        compact ? 'text-[11px]' : 'text-xs'
      } ${meta.badgeClass}`}
    >
      <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{meta.label}</span>
    </span>
  );
};

export const ModuleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  editingModule?: LearningModule | null;
  onSubmit: (payload: {
    title: string;
    description: string;
    color: string;
    icon: LearningModuleIcon;
    status: LearningStatus;
  }) => Promise<void>;
}> = ({ isOpen, onClose, editingModule, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>('#D2925B');
  const [icon, setIcon] = useState<LearningModuleIcon>('book');
  const [status, setStatus] = useState<LearningStatus>('not_started');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(editingModule?.title || '');
      setDescription(editingModule?.description || '');
      setColor(editingModule?.color || '#D2925B');
      setIcon(editingModule?.icon || 'book');
      setStatus(editingModule?.status || 'not_started');
      setError('');
    }
  }, [isOpen, editingModule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Module title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        color,
        icon,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save module.');
    } finally {
      setSaving(false);
    }
  };

  const isDarkSwatch = DARK_SWATCH_HEXES.has(color.toUpperCase());

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-lg">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line bg-brand dark:bg-surface-warm">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/20"
            style={{ backgroundColor: color }}
          >
            <ModuleIconView
              icon={icon}
              className={`w-4 h-4 ${isDarkSwatch ? 'text-[#F7F1E8]' : 'text-[#2B1F18]'}`}
            />
          </div>
          <h3 className="text-sm font-semibold text-brand-ink dark:text-ink">
            {editingModule ? 'Edit Module' : 'Create Learning Module'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-brand-ink/80 dark:text-ink-muted hover:text-brand-ink dark:hover:text-ink transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            Module Title <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Network Security & Cryptography"
            className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Course syllabus overview, focus areas, and key competencies..."
            className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Module Color</label>
            <div className="flex flex-wrap gap-2">
              {MODULE_COLOR_PALETTE.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  className={`w-7 h-7 rounded-lg border transition-transform btn-press ${
                    color === c.hex ? 'ring-2 ring-accent ring-offset-1 scale-105' : 'border-line'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={`Color ${c.label}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Module Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as LearningStatus)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Module Icon</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {MODULE_ICON_OPTIONS.map(opt => {
              const Icon = opt.Icon;
              const selected = icon === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIcon(opt.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-[10px] transition-colors btn-press ${
                    selected
                      ? 'bg-accent text-accent-ink border-accent font-semibold'
                      : 'bg-canvas text-ink-muted border-line hover:border-accent hover:text-ink'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate w-full text-center">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs disabled:opacity-60"
          >
            {saving ? 'Saving...' : editingModule ? 'Save Module' : 'Create Module'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const LessonModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  editingLesson?: LearningLesson | null;
  onSubmit: (payload: {
    title: string;
    description: string;
    teacherName: string;
    lessonDate: string;
    status: LearningStatus;
    studyDurationMinutes: number;
    learningObjectives: string[];
  }) => Promise<void>;
}> = ({ isOpen, onClose, editingLesson, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [status, setStatus] = useState<LearningStatus>('not_started');
  const [studyDurationMinutes, setStudyDurationMinutes] = useState(60);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(editingLesson?.title || '');
      setDescription(editingLesson?.description || '');
      setTeacherName(editingLesson?.teacherName || '');
      setLessonDate(editingLesson?.lessonDate || new Date().toISOString().slice(0, 10));
      setStatus(editingLesson?.status || 'not_started');
      setStudyDurationMinutes(editingLesson?.studyDurationMinutes || 60);
      setObjectives(editingLesson?.learningObjectives || []);
      setNewObjective('');
      setError('');
    }
  }, [isOpen, editingLesson]);

  const handleAddObjective = () => {
    const trimmed = newObjective.trim();
    if (!trimmed) return;
    setObjectives(prev => [...prev, trimmed]);
    setNewObjective('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Lesson title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        teacherName: teacherName.trim(),
        lessonDate,
        status,
        studyDurationMinutes: Math.max(5, Number(studyDurationMinutes) || 60),
        learningObjectives: objectives,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-xl">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-line bg-brand dark:bg-surface-warm shrink-0">
        <h3 className="text-sm font-semibold text-brand-ink dark:text-ink">
          {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-brand-ink/80 dark:text-ink-muted hover:text-brand-ink dark:hover:text-ink"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        {error && (
          <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">
            Lesson Title <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Lecture 02: TLS 1.3 Handshake & Forward Secrecy"
            className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Teacher / Instructor
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              placeholder="e.g. Prof. Meyer"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Lesson Date</label>
            <input
              type="date"
              value={lessonDate}
              onChange={e => setLessonDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink font-mono focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as LearningStatus)}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Key topics covered, chapters, or lecture summary..."
            className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">
              Estimated Duration (min)
            </label>
            <input
              type="number"
              min={5}
              max={600}
              value={studyDurationMinutes}
              onChange={e => setStudyDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs font-mono text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs font-semibold text-ink-muted">Learning Objectives</label>
          {objectives.length > 0 && (
            <ul className="space-y-1.5">
              {objectives.map((obj, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-canvas border border-line text-xs text-ink"
                >
                  <span className="truncate">{obj}</span>
                  <button
                    type="button"
                    onClick={() => setObjectives(prev => prev.filter((_, i) => i !== idx))}
                    className="text-ink-muted hover:text-danger shrink-0"
                    aria-label="Remove objective"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddObjective();
                }
              }}
              placeholder="Add an objective and press Enter..."
              className="flex-1 px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddObjective}
              aria-label="Add learning objective"
              className="btn-press px-3 py-2 rounded-xl bg-surface-warm hover:bg-surface-hover text-ink text-xs font-semibold border border-line"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs disabled:opacity-60"
          >
            {saving ? 'Saving...' : editingLesson ? 'Save Lesson' : 'Create Lesson'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export const ConfirmDeleteDialog: React.FC<{
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  busy = false,
  onCancel,
  onConfirm,
}) => {
  return (
    <ModalShell isOpen={isOpen} onClose={onCancel} maxWidthClass="max-w-md">
      <div className="px-5 py-4 border-b border-line bg-brand dark:bg-surface-warm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-brand-ink dark:text-ink">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-brand-ink/80 dark:text-ink-muted hover:text-brand-ink dark:hover:text-ink"
          aria-label="Close confirmation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-press px-4 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger hover:opacity-90 text-white font-semibold text-xs disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{busy ? 'Deleting...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
