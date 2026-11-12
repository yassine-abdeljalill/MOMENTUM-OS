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
import { ConfirmDeleteDialog, LessonModal, ModuleIconView, StatusLabel } from './LearningShared';
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

  const moduleLevelTasks = useMemo(
    () => tasks.filter(t => !t.lessonId),
    [tasks]
  );
  const lessonLevelTasks = useMemo(
    () => tasks.filter(t => Boolean(t.lessonId)),
    [tasks]
  );
  const moduleLevelResources = useMemo(
    () => resources.filter(r => !r.lessonId),
    [resources]
  );

  const isDarkBg =
    module.color === '#3B2418' || module.color === '#4D3021' || module.color === '#1E5A99';

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
    // Optimistically update local order
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb & Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-xs text-[#6E5648]" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="hover:text-[#3B2418] font-medium transition-colors"
          >
            Learning
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-bold text-[#3B2418] truncate max-w-[300px]">{module.title}</span>
        </nav>

        <button
          type="button"
          onClick={onBackToDashboard}
          className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5ED] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Modules</span>
        </button>
      </div>

      {/* Module Hero Summary Card */}
      <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[#3B2418]/15 shadow-xs"
              style={{ backgroundColor: module.color }}
            >
              <ModuleIconView
                icon={module.icon}
                className={`w-6 h-6 ${isDarkBg ? 'text-[#F2E8DA]' : 'text-[#3B2418]'}`}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusLabel status={module.status} compact />
                <span className="text-[11px] font-mono text-[#6E5648] tabular-nums">
                  {stats.completed}/{stats.total} lessons completed
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
                {module.title}
              </h1>
              <p className="text-xs text-[#6E5648] leading-relaxed max-w-3xl">
                {module.description || 'Organize lectures, notes, study files, and practical labs for this module.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={module.status}
              onChange={e => void handleModuleStatusChange(e.target.value as LearningStatus)}
              className="px-3 py-2 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              aria-label="Module status"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="button"
              onClick={() => onEditModule(module)}
              className="btn-press p-2 rounded-xl bg-[#F2E8DA] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-[#3B2418]"
              title="Edit module"
              aria-label="Edit module"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteModule(module)}
              className="btn-press p-2 rounded-xl bg-[#F2E8DA] hover:bg-[#B84A44]/10 border border-[#D6C6B2] text-[#6E5648] hover:text-[#B84A44]"
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
              className="btn-press group inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
              <span>Add Lesson</span>
            </button>
          </div>
        </div>

        {/* 4 Module KPI Metrics */}
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#D6C6B2]">
          <div className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
            <span className="text-[10px] font-mono uppercase text-[#6E5648]">Total Lessons</span>
            <div className="font-mono text-2xl font-bold text-[#3B2418] tabular-nums mt-0.5">
              <AnimatedNumber value={stats.total} />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
            <span className="text-[10px] font-mono uppercase text-[#6E5648]">Completed</span>
            <div className="font-mono text-2xl font-bold text-[#3E7B52] tabular-nums mt-0.5">
              <AnimatedNumber value={stats.completed} />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
            <span className="text-[10px] font-mono uppercase text-[#6E5648]">Remaining</span>
            <div className="font-mono text-2xl font-bold text-[#1E5A99] tabular-nums mt-0.5">
              <AnimatedNumber value={stats.remaining} />
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase text-[#6E5648]">Module Progress</span>
              <span className="font-mono text-sm font-bold text-[#1E5A99] tabular-nums">
                {stats.progressPct}%
              </span>
            </div>
            <div className="mt-2">
              <AnimatedProgressBar
                percentage={stats.progressPct}
                trackClassName="w-full h-2 rounded-full bg-[#EAE0D0] overflow-hidden"
                fillClassName="h-full bg-[#3E7B52] rounded-full"
              />
            </div>
          </div>
        </StaggerContainer>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#D6C6B2]">
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
                className={`relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#3B2418] font-bold'
                    : 'text-[#6E5648] hover:text-[#3B2418] font-medium hover:bg-[#F2E8DA]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="module-detail-tab-pill"
                    transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                    className="absolute inset-0 bg-[#8EC5FF] rounded-xl shadow-xs -z-10 border border-[#3B2418]/10"
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                    isActive ? 'bg-[#3B2418] text-[#8EC5FF]' : 'bg-[#EAE0D0] text-[#3B2418]'
                  }`}
                >
                  {tab.count}
                </span>
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
                <div className="p-12 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] text-center space-y-3">
                  <BookOpen className="w-9 h-9 text-[#1E5A99] mx-auto opacity-75" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#3B2418]">No lessons in this module yet</h3>
                    <p className="text-xs text-[#6E5648] max-w-md mx-auto">
                      Add structured lessons with instructor details, lecture dates, rich-text notes, resources, and practical exercises.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLesson(null);
                      setLessonModalOpen(true);
                    }}
                    className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add First Lesson</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 text-[11px] text-[#6E5648]">
                    <span>Drag lessons or use the arrow buttons to reorder the module syllabus.</span>
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
                            onClick={() => onOpenLesson(lesson.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 card-hover ${
                              isDragTarget
                                ? 'bg-[#8EC5FF]/20 border-[#1E5A99]'
                                : isDone
                                ? 'bg-[#EAE0D0]/65 border-[#D6C6B2]'
                                : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <span
                                className="text-[#6E5648] hover:text-[#3B2418] cursor-grab active:cursor-grabbing shrink-0 hidden sm:inline-flex"
                                title="Drag to reorder"
                                onClick={e => e.stopPropagation()}
                              >
                                <GripVertical className="w-4 h-4" />
                              </span>

                              <div onClick={e => e.stopPropagation()} className="shrink-0">
                                <AnimatedCheckButton
                                  checked={isDone}
                                  size="md"
                                  onClick={() => void handleToggleLessonCompleted(lesson)}
                                />
                              </div>

                              <span className="font-mono text-xs font-bold text-[#1E5A99] tabular-nums shrink-0 w-6">
                                {String(idx + 1).padStart(2, '0')}
                              </span>

                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3
                                    className={`text-sm font-bold truncate ${
                                      isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'
                                    }`}
                                  >
                                    {lesson.title}
                                  </h3>
                                  <StatusLabel status={lesson.status} compact />
                                </div>

                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-[#6E5648]">
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
                                    <StickyNote className="w-3 h-3 text-[#1E5A99]" />
                                    {lessonNotesCount} note{lessonNotesCount === 1 ? '' : 's'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                    <FolderOpen className="w-3 h-3 text-[#1E5A99]" />
                                    {lessonResCount} file{lessonResCount === 1 ? '' : 's'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                    <CheckSquare className="w-3 h-3 text-[#1E5A99]" />
                                    {lessonTasksCount} task{lessonTasksCount === 1 ? '' : 's'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div
                              className="flex items-center gap-1 shrink-0 self-end sm:self-center"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveLesson(lesson.id, -1)}
                                className="btn-press p-1.5 rounded-lg text-[#6E5648] hover:text-[#3B2418] hover:bg-[#EAE0D0] disabled:opacity-30"
                                title="Move up"
                                aria-label="Move lesson up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === orderedLessons.length - 1}
                                onClick={() => handleMoveLesson(lesson.id, 1)}
                                className="btn-press p-1.5 rounded-lg text-[#6E5648] hover:text-[#3B2418] hover:bg-[#EAE0D0] disabled:opacity-30"
                                title="Move down"
                                aria-label="Move lesson down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLesson(lesson);
                                  setLessonModalOpen(true);
                                }}
                                className="btn-press p-1.5 rounded-lg text-[#6E5648] hover:text-[#3B2418] hover:bg-[#EAE0D0]"
                                title="Edit lesson"
                                aria-label="Edit lesson"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteLessonTarget(lesson)}
                                className="btn-press p-1.5 rounded-lg text-[#6E5648] hover:text-[#B84A44] hover:bg-[#EAE0D0]"
                                title="Delete lesson"
                                aria-label="Delete lesson"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenLesson(lesson.id)}
                                className="btn-press ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] hover:bg-[#8EC5FF]/35 border border-[#D6C6B2] text-xs font-semibold text-[#3B2418]"
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
                <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
                      Lesson-Specific Tasks & Exercises ({lessonLevelTasks.length})
                    </h3>
                    <span className="text-[11px] text-[#6E5648]">
                      Click a task row to jump into its lesson workspace
                    </span>
                  </div>
                  <div className="space-y-2">
                    {lessonLevelTasks.map(t => {
                      const parentLesson = orderedLessons.find(l => l.id === t.lessonId);
                      const isDone = t.status === 'completed';
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (t.lessonId) onOpenLesson(t.lessonId);
                          }}
                          className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] hover:border-[#8EC5FF] cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div
                              className={`text-xs font-semibold truncate ${
                                isDone ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'
                              }`}
                            >
                              {t.title}
                            </div>
                            <div className="text-[11px] text-[#6E5648] flex flex-wrap items-center gap-1.5">
                              <span className="text-[#1E5A99] font-medium">
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
                          <ChevronRight className="w-4 h-4 text-[#6E5648] shrink-0" />
                        </div>
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

      {/* Add / Edit Lesson Modal */}
      <LessonModal
        isOpen={lessonModalOpen}
        onClose={() => {
          setLessonModalOpen(false);
          setEditingLesson(null);
        }}
        editingLesson={editingLesson}
        onSubmit={handleSaveLesson}
      />

      {/* Confirm Delete Lesson */}
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
