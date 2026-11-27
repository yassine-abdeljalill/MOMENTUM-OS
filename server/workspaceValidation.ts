import { z } from 'zod';
import { SYNC_COLLECTION_KEYS } from '../src/lib/syncEngine.ts';

const safeIdSchema = z
  .string()
  .trim()
  .min(1, 'Record ID is required.')
  .max(120, 'Record ID exceeds maximum length.')
  .regex(/^[a-zA-Z0-9_.:-]+$/, 'Record ID contains invalid characters.');

const isoTimestampSchema = z
  .string()
  .trim()
  .min(10)
  .max(64)
  .refine(val => Number.isFinite(Date.parse(val)), 'Invalid ISO timestamp.');

const lifeAreaSchema = z.enum([
  'education',
  'career',
  'health',
  'fitness',
  'financial',
  'personal_development',
  'relationships',
  'other',
]);

const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

const profilePayloadSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().max(180).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
  preferredLanguage: z.string().trim().min(1).max(60).optional(),
  lifeAreas: z.array(lifeAreaSchema).max(16).optional(),
  visionStatement: z.string().max(4000).optional(),
  dailyAvailabilityHours: z.number().finite().min(0.5).max(24).optional(),
  onboardingCompleted: z.boolean().optional(),
  createdAt: z.string().max(64).optional(),
});

const preferencesPayloadSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  accentColor: z.string().trim().max(24).optional(),
  startOfWeek: z.enum(['monday', 'sunday']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  dateFormat: z.enum(['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']).optional(),
  defaultDashboard: z.string().trim().max(40).optional(),
  defaultTaskView: z.enum(['list', 'board', 'calendar']).optional(),
  enableBrowserNotifications: z.boolean().optional(),
  dailyReminderTime: z.string().trim().max(10).optional(),
  soundEnabled: z.boolean().optional(),
});

const taskDataSchema = z
  .object({
    id: safeIdSchema,
    title: z.string().trim().min(1).max(300),
    description: z.string().max(4000).optional(),
    status: z.enum(['inbox', 'not_started', 'in_progress', 'completed', 'cancelled']),
    priority: prioritySchema,
    category: lifeAreaSchema,
    dueDate: z.string().max(32).optional(),
    dueTime: z.string().max(16).optional(),
    startDate: z.string().max(32).optional(),
    estimatedDurationMinutes: z.number().finite().min(0).max(10000).optional(),
    actualDurationMinutes: z.number().finite().min(0).max(10000).optional(),
    relatedGoalId: z.string().max(120).optional(),
    relatedProjectId: z.string().max(120).optional(),
    tags: z.array(z.string().max(60)).max(50).default([]),
    subtasks: z
      .array(
        z.object({
          id: safeIdSchema,
          taskId: z.string().max(120),
          title: z.string().max(300),
          completed: z.boolean(),
          order: z.number().int().min(0).max(1000),
        })
      )
      .max(100)
      .default([]),
    notes: z.string().max(8000).optional(),
    isDailyPriority: z.boolean().optional(),
    priorityRank: z.number().int().min(1).max(10).optional(),
    createdAt: z.string().max(64),
    completedAt: z.string().max(64).optional(),
    updatedAt: z.string().max(64).optional(),
  })
  .passthrough();

const genericEntityDataSchema = z
  .object({
    id: safeIdSchema,
  })
  .passthrough();

const mutationRecordSchema = z
  .object({
    id: safeIdSchema,
    data: z.record(z.string(), z.unknown()).optional(),
    updatedAt: isoTimestampSchema,
    baseUpdatedAt: isoTimestampSchema.optional(),
    deletedAt: isoTimestampSchema.nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.deletedAt && !val.data) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mutation without deletedAt must include entity data.',
      });
    }
    if (val.data && val.data.id !== undefined && val.data.id !== val.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mutation data.id must match mutation id.',
      });
    }
  });

const taskMutationRecordSchema = mutationRecordSchema.superRefine((val, ctx) => {
  if (!val.deletedAt && val.data) {
    const parsed = taskDataSchema.safeParse(val.data);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: parsed.error.issues[0]?.message || 'Invalid task payload.',
      });
    }
    if ((val.data as any).learningModuleId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Learning tasks must sync through /api/learning endpoints.',
      });
    }
  }
});

const genericEntityMutationSchema = mutationRecordSchema.superRefine((val, ctx) => {
  if (!val.deletedAt && val.data) {
    const parsed = genericEntityDataSchema.safeParse(val.data);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: parsed.error.issues[0]?.message || 'Invalid workspace record payload.',
      });
    }
  }
});

const collectionsBatchSchema = z
  .object({
    tasks: z.array(taskMutationRecordSchema).max(2000).optional(),
    dailyPriorities: z.array(genericEntityMutationSchema).max(1000).optional(),
    goals: z.array(genericEntityMutationSchema).max(1000).optional(),
    ninetyDayPlans: z.array(genericEntityMutationSchema).max(1000).optional(),
    projects: z.array(genericEntityMutationSchema).max(1000).optional(),
    habits: z.array(genericEntityMutationSchema).max(1000).optional(),
    habitCompletions: z.array(genericEntityMutationSchema).max(5000).optional(),
    dailySchedule: z.array(genericEntityMutationSchema).max(5000).optional(),
    journalEntries: z.array(genericEntityMutationSchema).max(3000).optional(),
    focusSessions: z.array(genericEntityMutationSchema).max(5000).optional(),
    workoutRoutines: z.array(genericEntityMutationSchema).max(500).optional(),
    workoutSessions: z.array(genericEntityMutationSchema).max(3000).optional(),
    courses: z.array(genericEntityMutationSchema).max(500).optional(),
    studySessions: z.array(genericEntityMutationSchema).max(3000).optional(),
    resources: z.array(genericEntityMutationSchema).max(2000).optional(),
    notifications: z.array(genericEntityMutationSchema).max(1000).optional(),
  })
  .strict();

export const workspaceSyncBatchSchema = z.object({
  profile: z
    .object({
      data: profilePayloadSchema,
      updatedAt: isoTimestampSchema,
      baseUpdatedAt: isoTimestampSchema.optional(),
    })
    .optional(),
  preferences: z
    .object({
      data: preferencesPayloadSchema,
      updatedAt: isoTimestampSchema,
      baseUpdatedAt: isoTimestampSchema.optional(),
    })
    .optional(),
  collections: collectionsBatchSchema.optional(),
});

export const workspaceMigrateSchema = workspaceSyncBatchSchema.extend({
  importKey: z
    .string()
    .trim()
    .min(4, 'importKey is required.')
    .max(160)
    .regex(/^[a-zA-Z0-9_.:-]+$/, 'Invalid importKey format.'),
  source: z.enum(['local_migration', 'json_import', 'demo_seed']).optional().default('local_migration'),
});

export const workspaceBootstrapQuerySchema = z.object({
  sinceVersion: z
    .string()
    .optional()
    .transform(val => {
      if (val === undefined || val === '') return 0;
      const n = Number(val);
      return Number.isInteger(n) && n >= 0 ? n : -1;
    })
    .refine(val => val >= 0, 'sinceVersion must be a non-negative integer.'),
});

export { SYNC_COLLECTION_KEYS };
