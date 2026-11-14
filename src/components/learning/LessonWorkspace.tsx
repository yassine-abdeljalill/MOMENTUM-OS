import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  FolderOpen,
  Info,
  Play,
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
import { useApp } from '../../lib/context';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { DARK_SWATCH_HEXES, ModuleIconView, StatusLabel } from './LearningShared';
import { LessonNotesTab } from './LessonNotesTab';
import { LessonResourcesTab } from './LessonResourcesTab';
import { LessonTasksTab } from './LessonTasksTab';
import { LessonInfoTab } from './LessonInfoTab';
import { GlassSegmentedControl } from '../common/LiquidGlass';

export type LessonWorkspaceTab = 'notes' | 'resources' | 'tasks' | 'info';

export const LessonWorkspace: React.FC<{
  module: LearningModule;
  lesson: LearningLesson;
  moduleLessons: LearningLesson[];
  notes: LearningNote[];
  resources: LearningResource[];
  tasks: LearningTask[];
  onBackToDashboard: () => void;
  onBackToModule: () => void;
  onSelectLesson: (lessonId: string) => void;
  onEditLesson: (lesson: LearningLesson) => void;
  onDeleteLesson: (lesson: LearningLesson) => void;
}> = ({
  module,
  lesson,
  moduleLessons,
  notes,
  resources,
  tasks,
  onBackToDashboard,
  onBackToModule,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
}) => {
  const prefersReduced = useReducedMotion();
  const { updateLearningData, startFocusTimer, setIsFocusTimerOpen, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<LessonWorkspaceTab>('notes');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const markedOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    if (markedOpenedRef.current === lesson.id) return;
    markedOpenedRef.current = lesson.id;

    learningApi
      .markLessonOpened(lesson.id)
      .then(({ lesson: updated }) => {
        updateLearningData(prev => ({
          ...prev,
          lessons: prev.lessons.map(l => (l.id === updated.id ? updated : l)),
        }));
      })
      .catch(() => {
        // Non-blocking timestamp update
      });
  }, [lesson.id, updateLearningData]);

  const currentIdx = useMemo(
    () => moduleLessons.findIndex(l => l.id === lesson.id),
    [moduleLessons, lesson.id]
  );
  const prevLesson = currentIdx > 0 ? moduleLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx < moduleLessons.length - 1 ? moduleLessons[currentIdx + 1] : null;

  const handleStatusChange = async (nextStatus: LearningStatus) => {
    if (nextStatus === lesson.status) return;
    setUpdatingStatus(true);
    try {
      const { lesson: updated } = await learningApi.updateLesson(lesson.id, { status: nextStatus });
      updateLearningData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => (l.id === updated.id ? updated : l)),
      }));
      showToast(
        nextStatus === 'completed'
          ? 'Lesson marked as completed'
          : `Lesson status updated to ${nextStatus === 'in_progress' ? 'In Progress' : 'Not Started'}`
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lesson status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const tabs: Array<{
    id: LessonWorkspaceTab;
    label: string;
    count?: number;
    Icon: React.ElementType;
  }> = [
    { id: 'notes', label: 'Notes', count: notes.length, Icon: StickyNote },
    { id: 'resources', label: 'Resources', count: resources.length, Icon: FolderOpen },
    { id: 'tasks', label: 'Tasks & Exercises', count: tasks.length, Icon: CheckSquare },
    { id: 'info', label: 'Lesson Info', Icon: Info },
  ];

  const isDarkBg = DARK_SWATCH_HEXES.has(module.color.toUpperCase());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb & Quick Lesson Stepping */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="hover:text-ink font-medium transition-colors"
          >
            Learning
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={onBackToModule}
            className="inline-flex items-center gap-1.5 hover:text-ink font-medium transition-colors max-w-[200px] truncate"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: module.color }}
            />
            <span className="truncate">{module.title}</span>
          </button>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-ink truncate max-w-[260px]">{lesson.title}</span>
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onBackToModule}
            className="btn-press glass-control inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] sm:min-h-0 rounded-xl text-xs font-semibold text-ink whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Module</span>
          </button>
          {prevLesson && (
            <button
              type="button"
              onClick={() => onSelectLesson(prevLesson.id)}
              title={`Previous: ${prevLesson.title}`}
              className="btn-press glass-control p-2 rounded-xl text-ink"
              aria-label="Previous lesson"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {nextLesson && (
            <button
              type="button"
              onClick={() => onSelectLesson(nextLesson.id)}
              title={`Next: ${nextLesson.title}`}
              className="btn-press glass-control p-2 rounded-xl text-ink"
              aria-label="Next lesson"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lesson Workspace Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-line"
              style={{ backgroundColor: module.color }}
            >
              <ModuleIconView
                icon={module.icon}
                className={`w-5 h-5 ${isDarkBg ? 'text-[#F5F1E9]' : 'text-[#1A1A1D]'}`}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-accent">{module.title}</span>
                <span className="text-line-strong" aria-hidden="true">·</span>
                <StatusLabel status={lesson.status} compact />
              </div>

              <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight leading-snug">
                {lesson.title}
              </h1>

              {lesson.description && (
                <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
                  {lesson.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-ink-muted">
                {lesson.teacherName && (
                  <span className="inline-flex items-center gap-1 font-medium text-ink">
                    <User className="w-3 h-3 text-accent" />
                    {lesson.teacherName}
                  </span>
                )}
                {lesson.lessonDate && (
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="w-3 h-3 text-ink-muted" />
                    {lesson.lessonDate}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="w-3 h-3 text-ink-muted" />
                  {lesson.studyDurationMinutes}m estimated
                </span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <FileText className="w-3 h-3 text-ink-muted" />
                  Updated {new Date(lesson.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={lesson.status}
              disabled={updatingStatus}
              onChange={e => void handleStatusChange(e.target.value as LearningStatus)}
              className="glass-control px-3 py-2 min-h-[40px] sm:min-h-0 rounded-xl text-xs font-semibold text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              aria-label="Lesson completion status"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="button"
              onClick={() => {
                startFocusTimer(lesson.studyDurationMinutes || 50, {
                  id: lesson.id,
                  title: `${module.title}: ${lesson.title}`,
                });
                setIsFocusTimerOpen(true);
              }}
              className="btn-press inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] sm:min-h-0 rounded-xl glass-accent-pill text-xs whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Study Timer</span>
            </button>

            <button
              type="button"
              onClick={() => onEditLesson(lesson)}
              className="btn-press glass-control p-2 rounded-xl text-ink"
              title="Edit lesson details"
              aria-label="Edit lesson details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteLesson(lesson)}
              className="btn-press glass-control p-2 rounded-xl text-ink-muted hover:text-danger"
              title="Delete lesson"
              aria-label="Delete lesson"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace 4-Tab Bar */}
        <div className="pt-4 border-t border-line">
          <GlassSegmentedControl
            layoutId="lesson-workspace-tab-pill"
            size="sm"
            value={activeTab}
            onChange={setActiveTab}
            options={tabs.map(t => ({
              id: t.id,
              label: t.label,
              icon: t.Icon,
              count: t.count,
            }))}
          />
        </div>
      </div>

      {/* Active Tab Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${lesson.id}-${activeTab}`}
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
        >
          {activeTab === 'notes' && <LessonNotesTab lessonId={lesson.id} notes={notes} />}
          {activeTab === 'resources' && (
            <LessonResourcesTab
              moduleId={module.id}
              lessonId={lesson.id}
              resources={resources}
              scopeLabel="lesson"
            />
          )}
          {activeTab === 'tasks' && (
            <LessonTasksTab
              moduleId={module.id}
              lessonId={lesson.id}
              tasks={tasks}
              scopeLabel="lesson"
            />
          )}
          {activeTab === 'info' && <LessonInfoTab lesson={lesson} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
