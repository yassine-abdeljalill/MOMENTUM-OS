import type {
  LearningLesson,
  LearningModule,
  LearningResource,
  LearningStatus,
  LearningTask,
  LearningTaskKind,
  LearningTaskStatus,
} from '../types/learning';
import type { Task, TaskStatus } from '../types';

export const MODULE_COLOR_PALETTE = [
  { hex: '#8EC5FF', label: 'Sky Blue' },
  { hex: '#3B2418', label: 'Espresso' },
  { hex: '#1E5A99', label: 'Cobalt' },
  { hex: '#3E7B52', label: 'Forest' },
  { hex: '#A36116', label: 'Amber' },
  { hex: '#6E5648', label: 'Cocoa' },
  { hex: '#B84A44', label: 'Terracotta' },
  { hex: '#4D3021', label: 'Roast' },
] as const;

export const LEARNING_STATUS_META: Record<
  LearningStatus,
  { label: string; badgeClass: string }
> = {
  not_started: {
    label: 'Not Started',
    badgeClass: 'text-[#6E5648] bg-[#EAE0D0] border-[#D6C6B2]',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'text-[#1E5A99] bg-[#8EC5FF]/25 border-[#8EC5FF]',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'text-[#3E7B52] bg-[#3E7B52]/12 border-[#3E7B52]/40',
  },
};

export const LEARNING_TASK_STATUS_META: Record<
  LearningTaskStatus,
  { label: string; badgeClass: string }
> = {
  todo: {
    label: 'To Do',
    badgeClass: 'text-[#6E5648] bg-[#EAE0D0] border-[#D6C6B2]',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'text-[#1E5A99] bg-[#8EC5FF]/25 border-[#8EC5FF]',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'text-[#3E7B52] bg-[#3E7B52]/12 border-[#3E7B52]/40',
  },
};

export const LEARNING_TASK_KIND_LABELS: Record<LearningTaskKind, string> = {
  task: 'Task',
  assignment: 'Assignment',
  lab: 'Practical Lab',
  exercise: 'Exercise',
};

export function mapLearningStatusToAppTaskStatus(status: LearningTaskStatus): TaskStatus {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  return 'not_started';
}

export function mapAppTaskStatusToLearningStatus(status: TaskStatus): LearningTaskStatus {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  return 'todo';
}

export function mapLearningTaskToAppTask(
  lt: LearningTask,
  modulesById: Map<string, LearningModule>,
  lessonsById: Map<string, LearningLesson>,
  existingTask?: Task
): Task {
  const mod = modulesById.get(lt.moduleId);
  const les = lt.lessonId ? lessonsById.get(lt.lessonId) : undefined;

  return {
    id: lt.id,
    userId: lt.userId,
    title: lt.title,
    description: lt.description || undefined,
    status: mapLearningStatusToAppTaskStatus(lt.status),
    priority: lt.priority,
    category: 'education',
    dueDate: lt.dueDate || undefined,
    subtasks: lt.subtasks || [],
    tags: [
      'learning',
      lt.taskKind,
      ...(mod ? [mod.title] : []),
    ],
    isDailyPriority: existingTask?.isDailyPriority ?? false,
    priorityRank: existingTask?.priorityRank,
    estimatedDurationMinutes: existingTask?.estimatedDurationMinutes,
    actualDurationMinutes: existingTask?.actualDurationMinutes,
    learningModuleId: lt.moduleId,
    learningModuleTitle: mod?.title,
    learningLessonId: lt.lessonId || undefined,
    learningLessonTitle: les?.title,
    learningTaskKind: lt.taskKind,
    createdAt: lt.createdAt,
    completedAt: lt.completedAt,
  };
}

export function computeModuleStats(moduleLessons: LearningLesson[]) {
  const total = moduleLessons.length;
  const completed = moduleLessons.filter(l => l.status === 'completed').length;
  const inProgress = moduleLessons.filter(l => l.status === 'in_progress').length;
  const remaining = total - completed;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, inProgress, remaining, progressPct };
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getResourceCategoryLabel(res: LearningResource): string {
  if (res.kind === 'link') return 'External Link';
  const ext = (res.fileExtension || '').toLowerCase();
  if (ext === '.pdf') return 'PDF Document';
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'Image';
  if (['.ppt', '.pptx', '.odp'].includes(ext)) return 'Presentation';
  if (['.doc', '.docx', '.odt'].includes(ext)) return 'Word Document';
  if (['.txt', '.md', '.csv', '.json', '.log', '.py', '.js', '.ts', '.tsx', '.sh', '.sql', '.yaml', '.yml', '.conf', '.xml'].includes(ext)) {
    return 'Text / Code';
  }
  if (['.xls', '.xlsx'].includes(ext)) return 'Spreadsheet';
  if (ext === '.zip') return 'Archive';
  return ext ? ext.replace('.', '').toUpperCase() : 'File';
}

export function isResourcePreviewable(res: LearningResource): 'pdf' | 'image' | 'text' | null {
  if (res.kind !== 'file') return null;
  const ext = (res.fileExtension || '').toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'image';
  if (
    ['.txt', '.md', '.csv', '.json', '.log', '.py', '.js', '.ts', '.tsx', '.sh', '.sql', '.yaml', '.yml', '.conf', '.xml'].includes(
      ext
    )
  ) {
    return 'text';
  }
  return null;
}

export function reorderListByIds<T extends { id: string }>(
  items: T[],
  draggedId: string,
  targetId: string
): T[] {
  const fromIdx = items.findIndex(item => item.id === draggedId);
  const toIdx = items.findIndex(item => item.id === targetId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return items;
  const copy = [...items];
  const [moved] = copy.splice(fromIdx, 1);
  copy.splice(toIdx, 0, moved);
  return copy;
}
