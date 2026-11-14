import { z } from 'zod';

const isoDateOptionalRegex = /^(\d{4}-\d{2}-\d{2})?$/;
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const LEARNING_MODULE_ICONS = [
  'book',
  'shield',
  'code',
  'cpu',
  'network',
  'database',
  'terminal',
  'globe',
  'layers',
  'flask',
  'compass',
  'award',
] as const;

export const LEARNING_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export const LEARNING_TASK_STATUSES = ['todo', 'in_progress', 'completed'] as const;
export const LEARNING_TASK_KINDS = ['task', 'assignment', 'lab', 'exercise'] as const;
export const LEARNING_TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const moduleCreateSchema = z.object({
  title: z.string().trim().min(1, 'Module title is required.').max(140),
  description: z.string().trim().max(2000).optional().default(''),
  color: z.string().trim().regex(hexColorRegex, 'Invalid hex color.').optional().default('#9ECCFD'),
  icon: z.enum(LEARNING_MODULE_ICONS).optional().default('book'),
  status: z.enum(LEARNING_STATUSES).optional().default('not_started'),
});

export const moduleUpdateSchema = moduleCreateSchema.partial();

export const moduleReorderSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).min(1),
});

export const lessonCreateSchema = z.object({
  moduleId: z.string().trim().min(1, 'Module ID is required.'),
  title: z.string().trim().min(1, 'Lesson title is required.').max(160),
  description: z.string().trim().max(4000).optional().default(''),
  teacherName: z.string().trim().max(120).optional().default(''),
  lessonDate: z.string().trim().regex(isoDateOptionalRegex, 'Date must be YYYY-MM-DD.').optional().default(''),
  status: z.enum(LEARNING_STATUSES).optional().default('not_started'),
  learningObjectives: z.array(z.string().trim().min(1).max(300)).max(50).optional().default([]),
  studyDurationMinutes: z.number().int().min(5).max(1440).optional().default(60),
});

export const lessonUpdateSchema = lessonCreateSchema.omit({ moduleId: true }).partial();

export const lessonReorderSchema = z.object({
  moduleId: z.string().trim().min(1),
  orderedIds: z.array(z.string().trim().min(1)).min(1),
});

export const noteCreateSchema = z.object({
  lessonId: z.string().trim().min(1, 'Lesson ID is required.'),
  title: z.string().trim().min(1, 'Note title is required.').max(160),
  contentHtml: z.string().max(500_000).optional().default(''),
  isPinned: z.boolean().optional().default(false),
});

export const noteUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Note title cannot be empty.').max(160).optional(),
  contentHtml: z.string().max(500_000).optional(),
  isPinned: z.boolean().optional(),
});

export const resourceLinkCreateSchema = z.object({
  moduleId: z.string().trim().min(1, 'Module ID is required.'),
  lessonId: z.string().trim().min(1).nullable().optional(),
  title: z.string().trim().min(1, 'Resource title is required.').max(180),
  description: z.string().trim().max(1000).optional().default(''),
  folderName: z.string().trim().min(1).max(80).optional().default('General'),
  externalUrl: z
    .string()
    .trim()
    .url('Please enter a valid http(s) URL.')
    .refine(val => /^https?:\/\//i.test(val), 'URL must start with http:// or https://'),
});

export const resourceUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Resource title cannot be empty.').max(180).optional(),
  description: z.string().trim().max(1000).optional(),
  folderName: z.string().trim().min(1).max(80).optional(),
  externalUrl: z
    .string()
    .trim()
    .url('Please enter a valid http(s) URL.')
    .refine(val => /^https?:\/\//i.test(val), 'URL must start with http:// or https://')
    .optional(),
});

const subtaskSchema = z.object({
  id: z.string().trim().min(1),
  taskId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  completed: z.boolean(),
  order: z.number().int().min(0),
});

export const learningTaskCreateSchema = z.object({
  moduleId: z.string().trim().min(1, 'Module ID is required.'),
  lessonId: z.string().trim().min(1).nullable().optional(),
  title: z.string().trim().min(1, 'Task title is required.').max(200),
  description: z.string().trim().max(2000).optional().default(''),
  taskKind: z.enum(LEARNING_TASK_KINDS).optional().default('task'),
  status: z.enum(LEARNING_TASK_STATUSES).optional().default('todo'),
  priority: z.enum(LEARNING_TASK_PRIORITIES).optional().default('medium'),
  dueDate: z.string().trim().regex(isoDateOptionalRegex, 'Deadline must be YYYY-MM-DD.').optional().default(''),
  subtasks: z.array(subtaskSchema).max(50).optional().default([]),
});

export const learningTaskUpdateSchema = learningTaskCreateSchema.omit({ moduleId: true }).partial();

export const studySessionCreateSchema = z.object({
  moduleId: z.string().trim().min(1).nullable().optional(),
  lessonId: z.string().trim().min(1).nullable().optional(),
  subject: z.string().trim().min(1, 'Subject is required.').max(160),
  date: z.string().trim().regex(isoDateRegex, 'Date must be YYYY-MM-DD.'),
  startTime: z.string().trim().max(10).optional().default('09:00'),
  endTime: z.string().trim().max(10).optional().default('10:00'),
  durationMinutes: z.number().int().min(1).max(720),
  whatWasLearned: z.string().trim().min(1, 'Summary is required.').max(2000),
});
