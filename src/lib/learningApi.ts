import type { Priority, TaskSubtask } from '../types';
import type {
  LearningBootstrapData,
  LearningLesson,
  LearningModule,
  LearningModuleIcon,
  LearningNote,
  LearningResource,
  LearningStatus,
  LearningStudySession,
  LearningTask,
  LearningTaskKind,
  LearningTaskStatus,
} from '../types/learning';
import { ApiError, getStoredSessionToken } from './financeApi';

function buildHeaders(extra?: HeadersInit, omitJsonContentType = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!omitJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getStoredSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    Object.assign(headers, extra);
  }
  return headers;
}

async function learningRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: buildHeaders(options.headers, isFormData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data as T;
}

export const learningApi = {
  bootstrap: () => learningRequest<LearningBootstrapData>('/api/learning/bootstrap'),

  // Modules
  createModule: (payload: {
    title: string;
    description?: string;
    color?: string;
    icon?: LearningModuleIcon;
    status?: LearningStatus;
  }) =>
    learningRequest<{ module: LearningModule }>('/api/learning/modules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateModule: (
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      color: string;
      icon: LearningModuleIcon;
      status: LearningStatus;
    }>
  ) =>
    learningRequest<{ module: LearningModule }>(`/api/learning/modules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  reorderModules: (orderedIds: string[]) =>
    learningRequest<{ modules: LearningModule[] }>('/api/learning/modules/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds }),
    }),

  deleteModule: (id: string) =>
    learningRequest<{ success: boolean }>(`/api/learning/modules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Lessons
  createLesson: (payload: {
    moduleId: string;
    title: string;
    description?: string;
    teacherName?: string;
    lessonDate?: string;
    status?: LearningStatus;
    learningObjectives?: string[];
    studyDurationMinutes?: number;
  }) =>
    learningRequest<{ lesson: LearningLesson }>('/api/learning/lessons', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateLesson: (
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      teacherName: string;
      lessonDate: string;
      status: LearningStatus;
      learningObjectives: string[];
      studyDurationMinutes: number;
    }>
  ) =>
    learningRequest<{ lesson: LearningLesson }>(`/api/learning/lessons/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  markLessonOpened: (id: string) =>
    learningRequest<{ lesson: LearningLesson }>(`/api/learning/lessons/${encodeURIComponent(id)}/open`, {
      method: 'POST',
    }),

  reorderLessons: (moduleId: string, orderedIds: string[]) =>
    learningRequest<{ lessons: LearningLesson[] }>('/api/learning/lessons/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ moduleId, orderedIds }),
    }),

  deleteLesson: (id: string) =>
    learningRequest<{ success: boolean }>(`/api/learning/lessons/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Notes
  createNote: (payload: {
    lessonId: string;
    title: string;
    contentHtml?: string;
    isPinned?: boolean;
  }) =>
    learningRequest<{ note: LearningNote }>('/api/learning/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateNote: (
    id: string,
    payload: Partial<{
      title: string;
      contentHtml: string;
      isPinned: boolean;
    }>
  ) =>
    learningRequest<{ note: LearningNote }>(`/api/learning/notes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteNote: (id: string) =>
    learningRequest<{ success: boolean }>(`/api/learning/notes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Resources
  uploadResourceFile: (
    payload: {
      file: File;
      moduleId: string;
      lessonId?: string | null;
      title?: string;
      description?: string;
      folderName?: string;
    },
    onProgress?: (percent: number) => void
  ): Promise<{ resource: LearningResource }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('moduleId', payload.moduleId);
      if (payload.lessonId) formData.append('lessonId', payload.lessonId);
      if (payload.title) formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      if (payload.folderName) formData.append('folderName', payload.folderName);
      formData.append('file', payload.file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/learning/resources/upload', true);
      xhr.withCredentials = true;
      const token = getStoredSessionToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = e => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data: any = {};
        try {
          data = JSON.parse(xhr.responseText || '{}');
        } catch {
          data = {};
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data as { resource: LearningResource });
        } else {
          reject(new ApiError(data.error || `Upload failed (${xhr.status})`, xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(new ApiError('Network error while uploading file.', 0));
      };

      xhr.send(formData);
    });
  },

  addResourceLink: (payload: {
    moduleId: string;
    lessonId?: string | null;
    title: string;
    description?: string;
    folderName?: string;
    externalUrl: string;
  }) =>
    learningRequest<{ resource: LearningResource }>('/api/learning/resources/link', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateResource: (
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      folderName: string;
      externalUrl: string;
    }>
  ) =>
    learningRequest<{ resource: LearningResource }>(`/api/learning/resources/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteResource: (id: string) =>
    learningRequest<{ success: boolean }>(`/api/learning/resources/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  fetchResourceBlob: async (id: string, disposition: 'inline' | 'attachment' = 'inline') => {
    const token = getStoredSessionToken();
    const res = await fetch(
      `/api/learning/resources/${encodeURIComponent(id)}/file?disposition=${disposition}`,
      {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || `Unable to load resource (${res.status})`, res.status);
    }
    const blob = await res.blob();
    return blob;
  },

  // Learning Tasks & Exercises
  createTask: (payload: {
    moduleId: string;
    lessonId?: string | null;
    title: string;
    description?: string;
    taskKind?: LearningTaskKind;
    status?: LearningTaskStatus;
    priority?: Priority;
    dueDate?: string;
    subtasks?: TaskSubtask[];
  }) =>
    learningRequest<{ task: LearningTask }>('/api/learning/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTask: (
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      taskKind: LearningTaskKind;
      status: LearningTaskStatus;
      priority: Priority;
      dueDate: string;
      subtasks: TaskSubtask[];
    }>
  ) =>
    learningRequest<{ task: LearningTask }>(`/api/learning/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteTask: (id: string) =>
    learningRequest<{ success: boolean }>(`/api/learning/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Study Sessions
  createStudySession: (payload: {
    moduleId?: string | null;
    lessonId?: string | null;
    subject: string;
    date: string;
    startTime?: string;
    endTime?: string;
    durationMinutes: number;
    whatWasLearned: string;
  }) =>
    learningRequest<{ studySession: LearningStudySession }>('/api/learning/study-sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteStudySession: (id: string) =>
    learningRequest<{ success: boolean }>(`/api/learning/study-sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
