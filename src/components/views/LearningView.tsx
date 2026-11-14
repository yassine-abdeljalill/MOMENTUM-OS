import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronRight,
  Clock,
  Edit3,
  FolderOpen,
  GraduationCap,
  GripVertical,
  History,
  Layers,
  Loader2,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type {
  LearningLesson,
  LearningModule,
  LearningModuleIcon,
  LearningStatus,
  LearningStudySession,
  LearningTask,
} from '../../types/learning';
import { useApp } from '../../lib/context';
import { learningApi } from '../../lib/learningApi';
import {
  computeModuleStats,
  LEARNING_STATUS_META,
  LEARNING_TASK_KIND_LABELS,
  reorderListByIds,
} from '../../lib/learning';
import { formatMinutes } from '../../lib/logic';
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
  ModuleModal,
  StatusLabel,
} from '../learning/LearningShared';
import { ModuleDetailPage } from '../learning/ModuleDetailPage';
import { LessonWorkspace } from '../learning/LessonWorkspace';

type DashboardTab = 'overview' | 'sessions';

export const LearningView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    authUser,
    authChecked,
    setIsAuthModalOpen,
    learningData,
    learningLoading,
    learningError,
    refreshLearningData,
    updateLearningData,
    selectedLearningModuleId,
    setSelectedLearningModuleId,
    selectedLearningLessonId,
    setSelectedLearningLessonId,
    showToast,
  } = useApp();

  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LearningStatus>('all');

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<LearningModule | null>(null);
  const [deletingModule, setDeletingModule] = useState(false);

  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LearningLesson | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<LearningLesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState(false);

  const [draggedModuleId, setDraggedModuleId] = useState<string | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);

  const [showLogForm, setShowLogForm] = useState(false);
  const [logModuleId, setLogModuleId] = useState<string>('');
  const [logSubject, setLogSubject] = useState('');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logDuration, setLogDuration] = useState(50);
  const [logLearned, setLogLearned] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<LearningStudySession | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);

  const modules = learningData?.modules || [];
  const lessons = learningData?.lessons || [];
  const notes = learningData?.notes || [];
  const resources = learningData?.resources || [];
  const tasks = learningData?.tasks || [];
  const studySessions = learningData?.studySessions || [];

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)),
    [modules]
  );

  const activeModule = useMemo(
    () => (selectedLearningModuleId ? modules.find(m => m.id === selectedLearningModuleId) || null : null),
    [modules, selectedLearningModuleId]
  );
  const activeLesson = useMemo(
    () =>
      activeModule && selectedLearningLessonId
        ? lessons.find(l => l.id === selectedLearningLessonId && l.moduleId === activeModule.id) || null
        : null,
    [activeModule, lessons, selectedLearningLessonId]
  );

  const globalStats = useMemo(() => {
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.status === 'completed').length;
    const overallProgressPct =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const pendingAssignments = tasks.filter(t => t.status !== 'completed').length;
    const completedModules = modules.filter(m => m.status === 'completed').length;
    const totalStudyMinutes = studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    return {
      totalLessons,
      completedLessons,
      overallProgressPct,
      pendingAssignments,
      completedModules,
      totalStudyMinutes,
    };
  }, [lessons, tasks, modules, studySessions]);

  const recentlyOpenedLessons = useMemo(() => {
    return [...lessons]
      .filter(l => Boolean(l.lastOpenedAt) || Boolean(l.updatedAt))
      .sort((a, b) => {
        const aTime = a.lastOpenedAt || a.updatedAt;
        const bTime = b.lastOpenedAt || b.updatedAt;
        return bTime.localeCompare(aTime);
      })
      .slice(0, 5);
  }, [lessons]);

  const upcomingDeadlines = useMemo(() => {
    return [...tasks]
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      })
      .slice(0, 6);
  }, [tasks]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedModules.filter(mod => {
      if (statusFilter !== 'all' && mod.status !== statusFilter) return false;
      if (q) {
        const matchesMod =
          mod.title.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q);
        const matchesLesson = lessons.some(
          l =>
            l.moduleId === mod.id &&
            (l.title.toLowerCase().includes(q) || l.teacherName.toLowerCase().includes(q))
        );
        return matchesMod || matchesLesson;
      }
      return true;
    });
  }, [sortedModules, statusFilter, searchQuery, lessons]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSaveModule = async (payload: {
    title: string;
    description: string;
    color: string;
    icon: LearningModuleIcon;
    status: LearningStatus;
  }) => {
    if (editingModule) {
      const { module: updated } = await learningApi.updateModule(editingModule.id, payload);
      updateLearningData(prev => ({
        ...prev,
        modules: prev.modules.map(m => (m.id === updated.id ? updated : m)),
      }));
      showToast('Module updated');
    } else {
      const { module: created } = await learningApi.createModule(payload);
      updateLearningData(prev => ({
        ...prev,
        modules: [...prev.modules, created],
      }));
      showToast('Module created');
    }
  };

  const handleConfirmDeleteModule = async () => {
    if (!deleteModuleTarget) return;
    setDeletingModule(true);
    try {
      const deletedId = deleteModuleTarget.id;
      await learningApi.deleteModule(deletedId);
      updateLearningData(prev => {
        const deletedLessonIds = new Set(
          prev.lessons.filter(l => l.moduleId === deletedId).map(l => l.id)
        );
        return {
          ...prev,
          modules: prev.modules.filter(m => m.id !== deletedId),
          lessons: prev.lessons.filter(l => l.moduleId !== deletedId),
          notes: prev.notes.filter(n => !deletedLessonIds.has(n.lessonId)),
          resources: prev.resources.filter(r => r.moduleId !== deletedId),
          tasks: prev.tasks.filter(t => t.moduleId !== deletedId),
        };
      });
      if (selectedLearningModuleId === deletedId) {
        setSelectedLearningModuleId(null);
        setSelectedLearningLessonId(null);
      }
      setDeleteModuleTarget(null);
      showToast('Module deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete module.', 'error');
    } finally {
      setDeletingModule(false);
    }
  };

  const persistModuleOrder = async (reordered: LearningModule[]) => {
    const orderedIds = reordered.map(m => m.id);
    const indexMap = new Map<string, number>();
    orderedIds.forEach((id, idx) => indexMap.set(id, idx));

    updateLearningData(prev => ({
      ...prev,
      modules: prev.modules.map(m =>
        indexMap.has(m.id) ? { ...m, sortOrder: indexMap.get(m.id)! } : m
      ),
    }));

    try {
      const { modules: savedModules } = await learningApi.reorderModules(orderedIds);
      updateLearningData(prev => ({ ...prev, modules: savedModules }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to reorder modules.', 'error');
    }
  };

  const handleMoveModule = (moduleId: string, direction: -1 | 1) => {
    const idx = sortedModules.findIndex(m => m.id === moduleId);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= sortedModules.length) return;
    const copy = [...sortedModules];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    void persistModuleOrder(copy);
  };

  const handleSaveWorkspaceLesson = async (payload: {
    title: string;
    description: string;
    teacherName: string;
    lessonDate: string;
    status: LearningStatus;
    studyDurationMinutes: number;
    learningObjectives: string[];
  }) => {
    if (!editingLesson) return;
    const { lesson: updated } = await learningApi.updateLesson(editingLesson.id, payload);
    updateLearningData(prev => ({
      ...prev,
      lessons: prev.lessons.map(l => (l.id === updated.id ? updated : l)),
    }));
    showToast('Lesson updated');
  };

  const handleConfirmDeleteWorkspaceLesson = async () => {
    if (!deleteLessonTarget) return;
    setDeletingLesson(true);
    try {
      const deletedId = deleteLessonTarget.id;
      await learningApi.deleteLesson(deletedId);
      updateLearningData(prev => ({
        ...prev,
        lessons: prev.lessons.filter(l => l.id !== deletedId),
        notes: prev.notes.filter(n => n.lessonId !== deletedId),
        resources: prev.resources.filter(r => r.lessonId !== deletedId),
        tasks: prev.tasks.filter(t => t.lessonId !== deletedId),
      }));
      if (selectedLearningLessonId === deletedId) {
        setSelectedLearningLessonId(null);
      }
      setDeleteLessonTarget(null);
      showToast('Lesson deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete lesson.', 'error');
    } finally {
      setDeletingLesson(false);
    }
  };

  const handleToggleUpcomingTask = async (task: LearningTask) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      const { task: updated } = await learningApi.updateTask(task.id, { status: nextStatus });
      updateLearningData(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => (t.id === updated.id ? updated : t)),
      }));
    } catch (err: any) {
      showToast(err?.message || 'Failed to update task.', 'error');
    }
  };

  const handleCreateStudySession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSubject.trim() || !logLearned.trim()) return;
    setSavingLog(true);
    try {
      const { studySession } = await learningApi.createStudySession({
        moduleId: logModuleId || null,
        subject: logSubject.trim(),
        date: logDate,
        durationMinutes: Math.max(1, Number(logDuration) || 45),
        whatWasLearned: logLearned.trim(),
      });
      updateLearningData(prev => ({
        ...prev,
        studySessions: [studySession, ...prev.studySessions],
      }));
      setLogSubject('');
      setLogLearned('');
      setShowLogForm(false);
      showToast('Study session logged');
    } catch (err: any) {
      showToast(err?.message || 'Failed to log study session.', 'error');
    } finally {
      setSavingLog(false);
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!deleteSessionTarget) return;
    setDeletingSession(true);
    try {
      await learningApi.deleteStudySession(deleteSessionTarget.id);
      updateLearningData(prev => ({
        ...prev,
        studySessions: prev.studySessions.filter(s => s.id !== deleteSessionTarget.id),
      }));
      setDeleteSessionTarget(null);
      showToast('Study log removed', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove study log.', 'error');
    } finally {
      setDeletingSession(false);
    }
  };

  if (authChecked && !authUser) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="p-8 rounded-2xl bg-surface border border-line text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand text-accent flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink">Sign in to access your Learning Center</h2>
            <p className="text-xs text-ink-muted max-w-md mx-auto">
              Your modules, lesson notes, uploaded PDFs and slides, and coursework tasks are saved securely to your MOMENTUM account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In or Restore Workspace</span>
          </button>
        </div>
      </div>
    );
  }

  if ((!authChecked || learningLoading) && !learningData) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-ink-muted">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span className="text-xs font-medium">Loading Learning Management Center...</span>
      </div>
    );
  }

  if (learningError && !learningData) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <div className="p-6 rounded-2xl bg-surface border border-danger/40 text-center space-y-3">
          <p className="text-sm font-bold text-ink">Unable to load Learning Center</p>
          <p className="text-xs text-danger">{learningError}</p>
          <button
            type="button"
            onClick={() => void refreshLearningData()}
            className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-ink text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (activeModule && activeLesson) {
    const moduleLessons = lessons
      .filter(l => l.moduleId === activeModule.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

    return (
      <>
        <LessonWorkspace
          module={activeModule}
          lesson={activeLesson}
          moduleLessons={moduleLessons}
          notes={notes.filter(n => n.lessonId === activeLesson.id)}
          resources={resources.filter(r => r.lessonId === activeLesson.id)}
          tasks={tasks.filter(t => t.lessonId === activeLesson.id)}
          onBackToDashboard={() => {
            setSelectedLearningLessonId(null);
            setSelectedLearningModuleId(null);
          }}
          onBackToModule={() => setSelectedLearningLessonId(null)}
          onSelectLesson={lessonId => setSelectedLearningLessonId(lessonId)}
          onEditLesson={les => {
            setEditingLesson(les);
            setLessonModalOpen(true);
          }}
          onDeleteLesson={les => setDeleteLessonTarget(les)}
        />

        <LessonModal
          isOpen={lessonModalOpen}
          onClose={() => {
            setLessonModalOpen(false);
            setEditingLesson(null);
          }}
          editingLesson={editingLesson}
          onSubmit={handleSaveWorkspaceLesson}
        />

        <ConfirmDeleteDialog
          isOpen={Boolean(deleteLessonTarget)}
          title="Delete Lesson"
          description={`Delete "${deleteLessonTarget?.title || ''}"? All notes, files, and tasks inside this lesson will be permanently removed.`}
          busy={deletingLesson}
          onCancel={() => setDeleteLessonTarget(null)}
          onConfirm={handleConfirmDeleteWorkspaceLesson}
        />
      </>
    );
  }

  if (activeModule) {
    const activeModuleLessons = lessons.filter(l => l.moduleId === activeModule.id);
    const activeLessonIds = new Set(activeModuleLessons.map(l => l.id));
    return (
      <>
        <ModuleDetailPage
          module={activeModule}
          lessons={activeModuleLessons}
          notes={notes.filter(n => activeLessonIds.has(n.lessonId))}
          resources={resources.filter(r => r.moduleId === activeModule.id)}
          tasks={tasks.filter(t => t.moduleId === activeModule.id)}
          onBackToDashboard={() => {
            setSelectedLearningLessonId(null);
            setSelectedLearningModuleId(null);
          }}
          onOpenLesson={lessonId => setSelectedLearningLessonId(lessonId)}
          onEditModule={mod => {
            setEditingModule(mod);
            setModuleModalOpen(true);
          }}
          onDeleteModule={mod => setDeleteModuleTarget(mod)}
        />

        <ModuleModal
          isOpen={moduleModalOpen}
          onClose={() => {
            setModuleModalOpen(false);
            setEditingModule(null);
          }}
          editingModule={editingModule}
          onSubmit={handleSaveModule}
        />

        <ConfirmDeleteDialog
          isOpen={Boolean(deleteModuleTarget)}
          title="Delete Learning Module"
          description={`Delete "${deleteModuleTarget?.title || ''}" and all lessons, notes, uploaded resources, and tasks inside it? This cannot be undone.`}
          busy={deletingModule}
          onCancel={() => setDeleteModuleTarget(null)}
          onConfirm={handleConfirmDeleteModule}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
              Learning Management Center
            </h1>
            <p className="text-xs text-ink-muted">
              Structured academic modules, interactive lessons, rich-text study notes, uploaded materials, and synced assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex bg-surface-warm p-1 rounded-xl border border-line text-xs relative">
              {([
                { id: 'overview', label: `Modules (${modules.length})` },
                { id: 'sessions', label: `Study Logs (${studySessions.length})` },
              ] as const).map(tab => {
                const isActive = dashboardTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDashboardTab(tab.id)}
                    className={`relative z-10 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-accent-ink font-semibold'
                        : 'text-ink-muted hover:text-ink font-medium'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="learning-dashboard-tab-pill"
                        transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                        className="absolute inset-0 bg-accent rounded-lg -z-10"
                      />
                    )}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingModule(null);
                setModuleModalOpen(true);
              }}
              className="btn-press group inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-brand hover:bg-brand-hover text-brand-ink font-semibold text-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.25] transition-transform duration-200 group-hover:rotate-90" />
              <span>New Module</span>
            </button>
          </div>
        </div>

        {dashboardTab === 'overview' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'not_started', 'in_progress', 'completed'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-brand text-brand-ink border-brand'
                      : 'bg-canvas text-ink-muted border-line hover:text-ink'
                  }`}
                >
                  {st === 'all' ? 'All Statuses' : LEARNING_STATUS_META[st].label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search modules, lessons, or teachers..."
                aria-label="Search modules, lessons, or teachers"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Global Learning KPIs */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase text-ink-muted">Overall Progress</span>
            <span className="font-mono text-xs font-semibold text-accent tabular-nums">
              {globalStats.overallProgressPct}%
            </span>
          </div>
          <AnimatedProgressBar
            percentage={globalStats.overallProgressPct}
            trackClassName="w-full h-1.5 rounded-full bg-surface-inset overflow-hidden"
            fillClassName="h-full bg-success rounded-full"
          />
          <span className="text-xs text-ink-muted block tabular-nums">
            {globalStats.completedLessons} of {globalStats.totalLessons} lessons done
          </span>
        </StaggerItem>

        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover">
          <span className="text-[11px] font-mono uppercase text-ink-muted">Completed Lessons</span>
          <div className="font-mono text-2xl font-bold text-accent tabular-nums mt-1">
            <AnimatedNumber value={globalStats.completedLessons} /> / {globalStats.totalLessons}
          </div>
          <span className="text-xs text-ink-muted">
            Across {modules.length} module{modules.length === 1 ? '' : 's'}
          </span>
        </StaggerItem>

        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover">
          <span className="text-[11px] font-mono uppercase text-ink-muted">Pending Assignments</span>
          <div className="font-mono text-2xl font-bold text-ink tabular-nums mt-1">
            <AnimatedNumber value={globalStats.pendingAssignments} />
          </div>
          <span className="text-xs text-ink-muted">Synced with Tasks & Calendar</span>
        </StaggerItem>

        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line card-hover">
          <span className="text-[11px] font-mono uppercase text-ink-muted">Logged Study Time</span>
          <div className="font-mono text-2xl font-bold text-success tabular-nums mt-1">
            <AnimatedNumber value={globalStats.totalStudyMinutes} formatter={formatMinutes} />
          </div>
          <span className="text-xs text-ink-muted tabular-nums">
            {globalStats.completedModules}/{modules.length} modules completed
          </span>
        </StaggerItem>
      </StaggerContainer>

      <AnimatePresence mode="wait" initial={false}>
        {dashboardTab === 'overview' ? (
          <motion.div
            key="learning-dashboard-overview"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="space-y-6"
          >
            {/* Modules Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-ink">
                    Learning Modules ({filteredModules.length})
                  </h2>
                </div>
                {sortedModules.length > 1 && (
                  <span className="text-xs text-ink-muted hidden sm:inline">
                    Drag cards or use arrows to reorder modules
                  </span>
                )}
              </div>

              {modules.length === 0 ? (
                <div className="p-10 rounded-2xl bg-surface border border-line text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand text-accent flex items-center justify-center mx-auto">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-ink">
                      Build Your Personal Learning Workspace
                    </h3>
                    <p className="text-xs text-ink-muted max-w-lg mx-auto leading-relaxed">
                      Organize university courses, technical certifications, and self-study tracks into modules. Each lesson gives you rich-text notes, uploaded slides & PDFs, and practical exercises synced to your Tasks and Calendar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModule(null);
                      setModuleModalOpen(true);
                    }}
                    className="btn-press inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs"
                  >
                    <Plus className="w-4 h-4 stroke-[2.25]" />
                    <span>Create First Module</span>
                  </button>
                </div>
              ) : filteredModules.length === 0 ? (
                <div className="p-10 rounded-2xl bg-surface border border-line text-center space-y-2">
                  <Search className="w-7 h-7 text-accent mx-auto opacity-60" />
                  <p className="text-sm font-semibold text-ink">No modules match your search</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModules.map((mod, idx) => {
                    const modLessons = lessons.filter(l => l.moduleId === mod.id);
                    const modTasks = tasks.filter(t => t.moduleId === mod.id && t.status !== 'completed');
                    const modResources = resources.filter(r => r.moduleId === mod.id);
                    const stats = computeModuleStats(modLessons);
                    const isDarkBg = DARK_SWATCH_HEXES.has(mod.color.toUpperCase());
                    const isDragTarget = dragOverModuleId === mod.id && draggedModuleId !== mod.id;

                    return (
                      <div
                        key={mod.id}
                        draggable
                        onDragStart={e => {
                          setDraggedModuleId(mod.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', mod.id);
                        }}
                        onDragOver={e => {
                          e.preventDefault();
                          if (dragOverModuleId !== mod.id) setDragOverModuleId(mod.id);
                        }}
                        onDrop={e => {
                          e.preventDefault();
                          const sourceId = draggedModuleId || e.dataTransfer.getData('text/plain');
                          setDraggedModuleId(null);
                          setDragOverModuleId(null);
                          if (sourceId && sourceId !== mod.id) {
                            const reordered = reorderListByIds(sortedModules, sourceId, mod.id);
                            void persistModuleOrder(reordered);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedModuleId(null);
                          setDragOverModuleId(null);
                        }}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 card-hover ${
                          isDragTarget
                            ? 'bg-accent/15 border-accent'
                            : 'bg-surface border-line hover:border-accent/60'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLearningLessonId(null);
                                setSelectedLearningModuleId(mod.id);
                              }}
                              className="flex items-center gap-3 min-w-0 flex-1 text-left"
                            >
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/10"
                                style={{ backgroundColor: mod.color }}
                              >
                                <ModuleIconView
                                  icon={mod.icon}
                                  className={`w-5 h-5 ${isDarkBg ? 'text-[#F7F1E8]' : 'text-[#2B1F18]'}`}
                                />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-ink truncate" title={mod.title}>
                                  {mod.title}
                                </h3>
                                <div className="pt-0.5">
                                  <StatusLabel status={mod.status} compact />
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-0.5 shrink-0">
                              <span
                                className="p-1 text-ink-muted cursor-grab active:cursor-grabbing hidden sm:inline-flex"
                                title="Drag to reorder module"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingModule(mod);
                                  setModuleModalOpen(true);
                                }}
                                className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm"
                                title="Edit module"
                                aria-label={`Edit "${mod.title}"`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModuleTarget(mod)}
                                className="btn-press p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-surface-warm"
                                title="Delete module"
                                aria-label={`Delete "${mod.title}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed min-h-[2.25rem]">
                            {mod.description || 'No description provided yet.'}
                          </p>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-line">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-ink-muted tabular-nums">
                                {stats.completed}/{stats.total} lessons
                              </span>
                              <span className="font-mono font-semibold text-accent tabular-nums">
                                {stats.progressPct}%
                              </span>
                            </div>
                            <AnimatedProgressBar
                              percentage={stats.progressPct}
                              trackClassName="w-full h-1.5 rounded-full bg-surface-inset overflow-hidden"
                              fillClassName="h-full bg-success rounded-full"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-ink-muted">
                            <div className="flex items-center gap-2 font-mono tabular-nums">
                              <span className="inline-flex items-center gap-1">
                                <CheckSquare className="w-3 h-3 text-accent" />
                                {modTasks.length} open
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1">
                                <FolderOpen className="w-3 h-3 text-accent" />
                                {modResources.length} files
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {statusFilter === 'all' && !searchQuery.trim() && sortedModules.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveModule(mod.id, -1)}
                                    className="btn-press p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30"
                                    title="Move module up"
                                    aria-label={`Move "${mod.title}" up`}
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === sortedModules.length - 1}
                                    onClick={() => handleMoveModule(mod.id, 1)}
                                    className="btn-press p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30"
                                    title="Move module down"
                                    aria-label={`Move "${mod.title}" down`}
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLearningLessonId(null);
                                  setSelectedLearningModuleId(mod.id);
                                }}
                                className="inline-flex items-center gap-0.5 font-semibold text-accent hover:underline ml-1"
                              >
                                <span>Open</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recently Opened Lessons & Upcoming Learning Deadlines */}
            {(recentlyOpenedLessons.length > 0 || upcomingDeadlines.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="p-5 rounded-2xl bg-surface border border-line space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-accent" />
                      <h3 className="text-sm font-semibold text-ink">Recently Opened Lessons</h3>
                    </div>
                    <span className="text-xs font-mono text-ink-muted tabular-nums">
                      {recentlyOpenedLessons.length} shown
                    </span>
                  </div>

                  {recentlyOpenedLessons.length === 0 ? (
                    <p className="text-xs text-ink-muted py-6 text-center">
                      Open a lesson to pick up where you left off.
                    </p>
                  ) : (
                    <div className="divide-y divide-line">
                      {recentlyOpenedLessons.map(les => {
                        const mod = modules.find(m => m.id === les.moduleId);
                        return (
                          <button
                            key={les.id}
                            type="button"
                            onClick={() => {
                              setSelectedLearningModuleId(les.moduleId);
                              setSelectedLearningLessonId(les.id);
                            }}
                            className="w-full py-3 text-left hover:bg-surface-warm/40 px-2 rounded-lg flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <span className="text-xs font-semibold text-ink truncate block">
                                {les.title}
                              </span>
                              <div className="text-[11px] text-ink-muted flex items-center gap-1.5 truncate">
                                <span>{mod?.title || 'Module'}</span>
                                {les.teacherName && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>{les.teacherName}</span>
                                  </>
                                )}
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {new Date(les.lastOpenedAt || les.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusLabel status={les.status} compact />
                              <ChevronRight className="w-4 h-4 text-ink-muted" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="p-5 rounded-2xl bg-surface border border-line space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <h3 className="text-sm font-semibold text-ink">Upcoming Learning Deadlines</h3>
                    </div>
                    <span className="text-xs font-mono text-ink-muted tabular-nums">
                      {globalStats.pendingAssignments} pending
                    </span>
                  </div>

                  {upcomingDeadlines.length === 0 ? (
                    <p className="text-xs text-ink-muted py-6 text-center">
                      No pending assignments, labs, or exercises.
                    </p>
                  ) : (
                    <div className="divide-y divide-line">
                      {upcomingDeadlines.map(t => {
                        const mod = modules.find(m => m.id === t.moduleId);
                        const les = t.lessonId ? lessons.find(l => l.id === t.lessonId) : null;
                        const isOverdue = Boolean(t.dueDate && t.dueDate < todayStr);
                        return (
                          <div
                            key={t.id}
                            className="py-3 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="pt-0.5">
                                <AnimatedCheckButton
                                  checked={t.status === 'completed'}
                                  size="sm"
                                  onClick={() => void handleToggleUpcomingTask(t)}
                                  ariaLabel={`Toggle "${t.title}"`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLearningModuleId(t.moduleId);
                                  setSelectedLearningLessonId(t.lessonId || null);
                                }}
                                className="min-w-0 text-left space-y-0.5"
                              >
                                <div className="text-xs font-semibold text-ink truncate hover:text-accent">
                                  {t.title}
                                </div>
                                <div className="text-[11px] text-ink-muted flex flex-wrap items-center gap-1.5">
                                  <span className="font-medium text-accent">
                                    {LEARNING_TASK_KIND_LABELS[t.taskKind]}
                                  </span>
                                  {mod && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="truncate max-w-[140px]">{mod.title}</span>
                                    </>
                                  )}
                                  {les && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="truncate max-w-[140px]">{les.title}</span>
                                    </>
                                  )}
                                </div>
                              </button>
                            </div>

                            {t.dueDate && (
                              <span
                                className={`text-[11px] font-mono tabular-nums shrink-0 ${
                                  isOverdue ? 'text-danger font-semibold' : 'text-ink-muted'
                                }`}
                              >
                                {isOverdue ? `Overdue · ${t.dueDate}` : t.dueDate}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="learning-dashboard-sessions"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Deliberate Study Session Logs</h2>
                <p className="text-xs text-ink-muted">
                  Record focused study blocks and key takeaways linked to your modules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogForm(!showLogForm)}
                className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs"
              >
                {showLogForm ? 'Close Form' : '+ Log Study Session'}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showLogForm && (
                <motion.form
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                  onSubmit={handleCreateStudySession}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-surface-warm/60 border border-line space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-ink-muted mb-1">
                          Subject / Topic *
                        </label>
                        <input
                          type="text"
                          required
                          value={logSubject}
                          onChange={e => setLogSubject(e.target.value)}
                          placeholder="e.g. TLS 1.3 Key Schedule & HKDF"
                          className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-ink-muted mb-1">
                          Module (opt)
                        </label>
                        <select
                          value={logModuleId}
                          onChange={e => setLogModuleId(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink"
                        >
                          <option value="">General Study</option>
                          {sortedModules.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-ink-muted mb-1">Date</label>
                          <input
                            type="date"
                            value={logDate}
                            onChange={e => setLogDate(e.target.value)}
                            className="w-full px-2 py-2 rounded-xl bg-canvas border border-line text-xs text-ink font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink-muted mb-1">Minutes</label>
                          <input
                            type="number"
                            min={1}
                            max={600}
                            value={logDuration}
                            onChange={e => setLogDuration(Number(e.target.value))}
                            className="w-full px-2 py-2 rounded-xl bg-canvas border border-line text-xs font-mono text-ink"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">
                        What Was Learned / Key Takeaways *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={logLearned}
                        onChange={e => setLogLearned(e.target.value)}
                        placeholder="Summarize core concepts, solved problems, or lab findings..."
                        className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLogForm(false)}
                        className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingLog}
                        className="btn-press px-4 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs"
                      >
                        {savingLog ? 'Saving...' : 'Save Session'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {studySessions.length === 0 ? (
              <div className="p-10 rounded-xl bg-surface-warm/40 border border-line text-center space-y-2">
                <Clock className="w-7 h-7 text-accent mx-auto opacity-60" />
                <p className="text-sm font-semibold text-ink">No study sessions logged yet</p>
                <p className="text-xs text-ink-muted">
                  Log deliberate study sessions to track total hours across modules and Calendar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line border-t border-line">
                {studySessions.map(s => {
                  const mod = s.moduleId ? modules.find(m => m.id === s.moduleId) : null;
                  return (
                    <div key={s.id} className="py-3.5 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-sm font-semibold text-ink truncate">{s.subject}</span>
                          {mod && (
                            <span className="text-xs font-medium text-accent truncate">
                              · {mod.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-mono text-ink-muted tabular-nums">
                            {s.date} · {s.durationMinutes}m
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteSessionTarget(s)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-danger"
                            aria-label={`Delete study log "${s.subject}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed pl-6">
                        {s.whatWasLearned}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ModuleModal
        isOpen={moduleModalOpen}
        onClose={() => {
          setModuleModalOpen(false);
          setEditingModule(null);
        }}
        editingModule={editingModule}
        onSubmit={handleSaveModule}
      />

      <ConfirmDeleteDialog
        isOpen={Boolean(deleteModuleTarget)}
        title="Delete Learning Module"
        description={`Delete "${deleteModuleTarget?.title || ''}" and all lessons, notes, uploaded resources, and tasks inside it? This cannot be undone.`}
        busy={deletingModule}
        onCancel={() => setDeleteModuleTarget(null)}
        onConfirm={handleConfirmDeleteModule}
      />

      <ConfirmDeleteDialog
        isOpen={Boolean(deleteSessionTarget)}
        title="Delete Study Log"
        description={`Remove the study log "${deleteSessionTarget?.subject || ''}"?`}
        busy={deletingSession}
        onCancel={() => setDeleteSessionTarget(null)}
        onConfirm={handleConfirmDeleteSession}
      />
    </div>
  );
};
