import type { Priority, TaskSubtask } from './index';

export type LearningStatus = 'not_started' | 'in_progress' | 'completed';
export type LearningTaskStatus = 'todo' | 'in_progress' | 'completed';
export type LearningTaskKind = 'task' | 'assignment' | 'lab' | 'exercise';

export type LearningModuleIcon =
  | 'book'
  | 'shield'
  | 'code'
  | 'cpu'
  | 'network'
  | 'database'
  | 'terminal'
  | 'globe'
  | 'layers'
  | 'flask'
  | 'compass'
  | 'award';

export interface LearningModule {
  id: string;
  userId: string;
  title: string;
  description: string;
  color: string;
  icon: LearningModuleIcon;
  status: LearningStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningLesson {
  id: string;
  userId: string;
  moduleId: string;
  title: string;
  description: string;
  teacherName: string;
  lessonDate: string;
  status: LearningStatus;
  learningObjectives: string[];
  studyDurationMinutes: number;
  sortOrder: number;
  lastOpenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningNote {
  id: string;
  userId: string;
  lessonId: string;
  title: string;
  contentHtml: string;
  plainText: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningResource {
  id: string;
  userId: string;
  moduleId: string;
  lessonId: string | null;
  kind: 'file' | 'link';
  title: string;
  description: string;
  folderName: string;
  externalUrl?: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize: number;
  fileExtension?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningTask {
  id: string;
  userId: string;
  moduleId: string;
  lessonId: string | null;
  title: string;
  description: string;
  taskKind: LearningTaskKind;
  status: LearningTaskStatus;
  priority: Priority;
  dueDate: string;
  subtasks: TaskSubtask[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningStudySession {
  id: string;
  userId: string;
  moduleId: string | null;
  lessonId: string | null;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  whatWasLearned: string;
  createdAt: string;
}

export interface LearningBootstrapData {
  modules: LearningModule[];
  lessons: LearningLesson[];
  notes: LearningNote[];
  resources: LearningResource[];
  tasks: LearningTask[];
  studySessions: LearningStudySession[];
}
