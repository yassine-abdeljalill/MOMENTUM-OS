import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  Edit3,
  FolderOpen,
  GripVertical,
  Plus,
  StickyNote,
  Trash2,
  User,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type {
  LearningLesson,
  LearningModule,
  LearningNote,
  LearningResource,
  LearningStatus,
  LearningTask,
} from '../../types/learning';
import { learningApi } from '../../lib/learningApi';
import {
  computeModuleStats,
  LEARNING_TASK_KIND_LABELS,
  reorderListByIds,
} from '../../lib/learning';
import { useApp } from '../../lib/context';
import {
  AnimatedCheckButton,
  AnimatedNumber,
  AnimatedProgressBar,
  MOMENTUM_EASE,
  StaggerContainer,
  StaggerItem,
} from '../common/MotionPrimitives';
import {
  ConfirmDeleteDialog,
  DARK_SWATCH_HEXES,
  LessonModal,
  ModuleIconView,
  StatusLabel,
} from './LearningShared';
import { LessonTasksTab } from './LessonTasksTab';
import { LessonResourcesTab } from './LessonResourcesTab';

type ModuleSubTab = 'lessons' | 'tasks' | 'resources';

export const ModuleDetailPage: React.FC<{
  module: LearningModule;
  lessons: LearningLesson[];
  notes: LearningNote[];
  resources: LearningResource[];
  tasks: LearningTask[];
  onBackToDashboard: () => void;
  onOpenLesson: (lessonId: string) => void;
  onEditModule: (module: LearningModule) => void;
  onDeleteModule: (module: LearningModule) => void;
}> = ({
  module,
  lessons,
  notes,
  resources,
  tasks,
  onBackToDashboard,
  onOpenLesson,
  onEditModule,
  onDeleteModule,
}) => {
  const prefersReduced = useReducedMotion();
  const { updateLearningData, showToast } = useApp();

  const [subTab, setSubTab] = useState<ModuleSubTab>('lessons');
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LearningLesson | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<LearningLesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null);

  const orderedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
    [lessons]
  );

  const stats = useMemo(() => computeModuleStats(orderedLessons), [orderedLessons]);
  const moduleLevelTasks = useMemo(() => tasks.filter(t => !t.lessonId), [tasks]);
  const lessonLevelTasks = useMemo(() => tasks.filter(t => Boolean(t.lessonId)), [tasks]);
  const moduleLevelResources = useMemo(() => resources.filter(r => !r.lessonId), [resources]);

  const isDarkBg = DARK_SWATCH_HEXES.has(module.color.toUpperCase());

  const handleModuleStatusChange = async (nextStatus: LearningStatus) => {
    if (nextStatus === module.status) return;
    try {
      const { module: updated } = await learningApi.updateModule(module.id, { status: nextStatus });
      updateLearningData(prev => ({
        ...prev,
        modules: prev.modules.map(m => (m.id === updated.id ? updated : m)),
      }));
      showToast('Module status updated');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update module status.', 'error');
    }
  };

  const handleSaveLesson = async (payload: {
    title: string;
    description: string;
    teacherName: string;
    lessonDate: string;
    status: LearningStatus;
    studyDurationMinutes: number;
    learningObjectives: string[];
  }) => {
    if (editingLesson) {
      const { lesson: updated } = await learningApi.updateLesson(editingLesson.id, payload);
      updateLearningData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => (l.id === updated.id ? updated : l)),
      }));
      showToast('Lesson updated');
    } else {
      const { lesson: created } = await learningApi.createLesson({
        moduleId: module.id,
        ...payload,
      });
      updateLearningData(prev => ({
        ...prev,
        lessons: [...prev.lessons, created],
      }));
      showToast('Lesson created');
    }
  };

  const handleToggleLessonCompleted = async (lesson: LearningLesson) => {
    const nextStatus: LearningStatus =
      lesson.status === 'completed' ? 'in_progress' : 'completed';
    try {
      const { lesson: updated } = await learningApi.updateLesson(lesson.id, { status: nextStatus });
      updateLearningData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => (l.id === updated.id ? updated : l)),
      }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lesson status.', 'error');
    }
  };

  const persistLessonOrder = async (reordered: LearningLesson[]) => {
    const orderedIds = reordered.map(l => l.id);
    const reindexedMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => reindexedMap.set(id, idx));

    updateLearningData(prev => ({
      ...prev,
      lessons: prev.lessons.map(l =>
        reindexedMap.has(l.id) ? { ...l, sortOrder: reindexedMap.get(l.id)! } : l
      ),
    }));

    try {
      const { lessons: savedModuleLessons } = await learningApi.reorderLessons(
        module.id,
        orderedIds
      );
      const savedMap = new Map(savedModuleLessons.map(l => [l.id, l]));
      updateLearningData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => savedMap.get(l.id) || l),
      }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to reorder lessons.', 'error');
    }
  };

  const handleMoveLesson = (lessonId: string, direction: -1 | 1) => {
    const idx = orderedLessons.findIndex(l => l.id === lessonId);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= orderedLessons.length) return;
    const copy = [...orderedLessons];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    void persistLessonOrder(copy);
  };

  const handleConfirmDeleteLesson = async () => {
    if (!deleteLessonTarget) return;
    setDeletingLesson(true);
    try {
      await learningApi.deleteLesson(deleteLessonTarget.id);
      const deletedId = deleteLessonTarget.id;
      updateLearningData(prev => ({
        ...prev,
        lessons: prev.lessons.filter(l => l.id !== deletedId),
        notes: prev.notes.filter(n => n.lessonId !== deletedId),
        resources: prev.resources.filter(r => r.lessonId !== deletedId),
        tasks: prev.tasks.filter(t => t.lessonId !== deletedId),
      }));
      setDeleteLessonTarget(null);
      showToast('Lesson deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete lesson.', 'error');
    } finally {
      setDeletingLesson(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Breadcrumb & Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-ink-muted" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="hover:text-ink font-medium transition-colors"
          >
            Learning
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-ink truncate max-w-[260px]">{module.title}</span>
        </nav>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-warm border border-line text-xs font-medium text-ink"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Modules</span>
        </button>
      </div>

      {/* Module Hero Summary Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-black/10"
              style={{ backgroundColor: module.color }}
            >
              <ModuleIconView
                icon={module.icon}
                className={`w-6 h-6 ${isDarkBg ? 'text-[#F5F1E9]' : 'text-[#1A1A1D]'}`}
              />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusLabel status={module.status} compact />
                <span aria-hidden="true" className="text-ink-muted">·</span>
                <span className="text-xs font-mono text-ink-muted tabular-nums">
                  {stats.completed}/{stats.total} lessons completed
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
                {module.title}
              </h1>
              <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
                {module.description ||
                  'Organize lectures, notes, study files, and practical labs for this module.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={module.status}
              onChange={e => void handleModuleStatusChange(e.target.value as LearningStatus)}
              className="px-3 py-2 rounded-xl bg-canvas border border-line text-xs font-medium text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              aria-label="Module status"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="button"
              onClick={() => onEditModule(module)}
              className="btn-press p-2 rounded-xl bg-canvas hover:bg-surface-warm border border-line text-ink"
              title="Edit module"
              aria-label="Edit module"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteModule(module)}
              className="btn-press p-2 rounded-xl bg-canvas hover:bg-danger/10 border border-line text-ink-muted hover:text-danger"
              title="Delete module"
              aria-label="Delete module"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingLesson(null);
                setLessonModalOpen(true);
              }}
              className="btn-press group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.25] transition-transform duration-200 group-hover:rotate-90" />
              <span>Add Lesson</span>
            </button>
          </div>
        </div>

        {/* 4 Module KPI Metrics */}
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-line">
          <div className="p-3.5 rounded-xl bg-surface-warm/50 border border-line">
            <span className="text-[11px] font-mono uppercase text-ink-muted">Total Lessons</span>
            <div className="font-mono text-2xl font-bold text-ink tabular-nums mt-0.5">
              <AnimatedNumber value={stats.total} />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-warm/50 border border-line">
            <span className="text-[11px] font-mono uppercase text-ink-muted">Completed</span>
            <div className="font-mono text-2xl font-bold text-success tabular-nums mt-0.5">
              <AnimatedNumber value={stats.completed} />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-warm/50 border border-line">
            <span className="text-[11px] font-mono uppercase text-ink-muted">Remaining</span>
            <div className="font-mono text-2xl font-bold text-accent tabular-nums mt-0.5">
              <AnimatedNumber value={stats.remaining} />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-warm/50 border border-line flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono uppercase text-ink-muted">Progress</span>
              <span className="font-mono text-sm font-bold text-accent tabular-nums">
                {stats.progressPct}%
              </span>
            </div>
            <div className="mt-2">
              <AnimatedProgressBar
                percentage={stats.progressPct}
                trackClassName="w-full h-1.5 rounded-full bg-surface-inset overflow-hidden"
                fillClassName="h-full bg-success rounded-full"
              />
            </div>
          </div>
        </StaggerContainer>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-line">
          {([
            { id: 'lessons', label: 'Lessons', count: orderedLessons.length, Icon: BookOpen },
            { id: 'tasks', label: 'Tasks & Assignments', count: tasks.length, Icon: CheckSquare },
            { id: 'resources', label: 'Module Resources', count: moduleLevelResources.length, Icon: FolderOpen },
          ] as const).map(tab => {
            const isActive = subTab === tab.id;
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`relative z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-accent-ink font-semibold'
                    : 'text-ink-muted hover:text-ink font-medium hover:bg-surface-warm'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="module-detail-tab-pill"
                    transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                    className="absolute inset-0 bg-accent rounded-xl -z-10"
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="font-mono text-[11px] opacity-80 tabular-nums">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab Views */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${module.id}-${subTab}`}
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
        >
          {subTab === 'lessons' && (
            <div className="space-y-3">
              {orderedLessons.length === 0 ? (
                <div className="p-10 rounded-2xl bg-surface border border-line text-center space-y-3">
                  <BookOpen className="w-9 h-9 text-accent mx-auto opacity-75" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-ink">No lessons in this module yet</h3>
                    <p className="text-xs text-ink-muted max-w-md mx-auto">
                      Add structured lessons with instructor details, lecture dates, rich-text notes, resources, and practical exercises.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLesson(null);
                      setLessonModalOpen(true);
                    }}
                    className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.25]" />
                    <span>Add First Lesson</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 text-xs text-ink-muted">
                    <span>Drag lessons or use arrows to reorder the module syllabus.</span>
                    <span className="font-mono tabular-nums">{orderedLessons.length} lessons</span>
                  </div>

                  <StaggerContainer className="space-y-2.5">
                    {orderedLessons.map((lesson, idx) => {
                      const lessonNotesCount = notes.filter(n => n.lessonId === lesson.id).length;
                      const lessonResCount = resources.filter(r => r.lessonId === lesson.id).length;
                      const lessonTasksCount = tasks.filter(t => t.lessonId === lesson.id).length;
                      const isDone = lesson.status === 'completed';
                      const isDragTarget = dragOverLessonId === lesson.id && draggedLessonId !== lesson.id;

                      return (
                        <StaggerItem key={lesson.id}>
                          <div
                            draggable
                            onDragStart={e => {
                              setDraggedLessonId(lesson.id);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', lesson.id);
                            }}
                            onDragOver={e => {
                              e.preventDefault();
                              if (dragOverLessonId !== lesson.id) {
                                setDragOverLessonId(lesson.id);
                              }
                            }}
                            onDrop={e => {
                              e.preventDefault();
                              const sourceId = draggedLessonId || e.dataTransfer.getData('text/plain');
                              setDraggedLessonId(null);
                              setDragOverLessonId(null);
                              if (sourceId && sourceId !== lesson.id) {
                                const nextOrder = reorderListByIds(orderedLessons, sourceId, lesson.id);
                                void persistLessonOrder(nextOrder);
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedLessonId(null);
                              setDragOverLessonId(null);
                            }}
                            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 card-hover ${
                              isDragTarget
                                ? 'bg-accent/15 border-accent'
                                : isDone
                                ? 'bg-surface/70 border-line opacity-80'
                                : 'bg-surface border-line hover:border-accent/60'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                              <span
                                className="text-ink-muted hover:text-ink cursor-grab active:cursor-grabbing shrink-0 hidden sm:inline-flex"
                                title="Drag to reorder"
                              >
                                <GripVertical className="w-4 h-4" />
                              </span>

                              <AnimatedCheckButton
                                checked={isDone}
                                size="md"
                                onClick={() => void handleToggleLessonCompleted(lesson)}
                                ariaLabel={isDone ? `Mark "${lesson.title}" incomplete` : `Complete "${lesson.title}"`}
                              />

                              <span className="font-mono text-xs font-bold text-accent tabular-nums shrink-0 w-6">
                                {String(idx + 1).padStart(2, '0')}
                              </span>

                              <button
                                type="button"
                                onClick={() => onOpenLesson(lesson.id)}
                                className="min-w-0 flex-1 text-left space-y-1"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold truncate ${
                                      isDone ? 'line-through text-ink-muted' : 'text-ink'
                                    }`}
                                  >
                                    {lesson.title}
                                  </span>
                                  <StatusLabel status={lesson.status} compact />
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-ink-muted">
                                  {lesson.teacherName && (
                                    <span className="inline-flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {lesson.teacherName}
                                    </span>
                                  )}
                                  {lesson.lessonDate && (
                                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                      <Calendar className="w-3 h-3" />
                                      {lesson.lessonDate}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                    <Clock className="w-3 h-3" />
                                    {lesson.studyDurationMinutes}m
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                    <StickyNote className="w-3 h-3 text-accent" />
                                    {lessonNotesCount} note{lessonNotesCount === 1 ? '' : 's'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                    <FolderOpen className="w-3 h-3 text-accent" />
                                    {lessonResCount} file{lessonResCount === 1 ? '' : 's'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                    <CheckSquare className="w-3 h-3 text-accent" />
                                    {lessonTasksCount} task{lessonTasksCount === 1 ? '' : 's'}
                                  </span>
                                </div>
                              </button>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveLesson(lesson.id, -1)}
                                className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm disabled:opacity-30"
                                title="Move up"
                                aria-label={`Move "${lesson.title}" up`}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === orderedLessons.length - 1}
                                onClick={() => handleMoveLesson(lesson.id, 1)}
                                className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm disabled:opacity-30"
                                title="Move down"
                                aria-label={`Move "${lesson.title}" down`}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLesson(lesson);
                                  setLessonModalOpen(true);
                                }}
                                className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm"
                                title="Edit lesson"
                                aria-label={`Edit "${lesson.title}"`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteLessonTarget(lesson)}
                                className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-surface-warm"
                                title="Delete lesson"
                                aria-label={`Delete "${lesson.title}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenLesson(lesson.id)}
                                className="btn-press ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-warm hover:bg-accent hover:text-accent-ink border border-line text-xs font-semibold text-ink transition-colors"
                              >
                                <span>Open</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                </>
              )}
            </div>
          )}

          {subTab === 'tasks' && (
            <div className="space-y-6">
              <LessonTasksTab
                moduleId={module.id}
                lessonId={null}
                tasks={moduleLevelTasks}
                scopeLabel="module"
              />

              {lessonLevelTasks.length > 0 && (
                <div className="p-5 rounded-2xl bg-surface border border-line space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                      Lesson-Specific Tasks & Exercises ({lessonLevelTasks.length})
                    </h3>
                    <span className="text-[11px] text-ink-muted">
                      Select a task to open its lesson
                    </span>
                  </div>
                  <div className="divide-y divide-line border-t border-line">
                    {lessonLevelTasks.map(t => {
                      const parentLesson = orderedLessons.find(l => l.id === t.lessonId);
                      const isDone = t.status === 'completed';
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (t.lessonId) onOpenLesson(t.lessonId);
                          }}
                          className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-surface-warm/40 px-2 rounded-lg transition-colors"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div
                              className={`text-xs font-semibold truncate ${
                                isDone ? 'line-through text-ink-muted' : 'text-ink'
                              }`}
                            >
                              {t.title}
                            </div>
                            <div className="text-[11px] text-ink-muted flex flex-wrap items-center gap-1.5">
                              <span className="text-accent font-medium">
                                {LEARNING_TASK_KIND_LABELS[t.taskKind]}
                              </span>
                              {parentLesson && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="truncate">{parentLesson.title}</span>
                                </>
                              )}
                              {t.dueDate && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">Due {t.dueDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {subTab === 'resources' && (
            <LessonResourcesTab
              moduleId={module.id}
              lessonId={null}
              resources={moduleLevelResources}
              scopeLabel="module"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <LessonModal
        isOpen={lessonModalOpen}
        onClose={() => {
          setLessonModalOpen(false);
          setEditingLesson(null);
        }}
        editingLesson={editingLesson}
        onSubmit={handleSaveLesson}
      />

      <ConfirmDeleteDialog
        isOpen={Boolean(deleteLessonTarget)}
        title="Delete Lesson"
        description={`Delete "${deleteLessonTarget?.title || ''}"? All notes, uploaded resources, and tasks inside this lesson will also be permanently removed.`}
        busy={deletingLesson}
        onCancel={() => setDeleteLessonTarget(null)}
        onConfirm={handleConfirmDeleteLesson}
      />
    </div>
  );
};
