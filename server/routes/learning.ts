import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type Response } from 'express';
import multer from 'multer';
import { type AuthedRequest, requireAuth } from '../auth.ts';
import { getDb, getLearningUploadsDir } from '../db.ts';
import {
  learningTaskCreateSchema,
  learningTaskUpdateSchema,
  lessonCreateSchema,
  lessonReorderSchema,
  lessonUpdateSchema,
  moduleCreateSchema,
  moduleReorderSchema,
  moduleUpdateSchema,
  noteCreateSchema,
  noteUpdateSchema,
  resourceLinkCreateSchema,
  resourceUpdateSchema,
  studySessionCreateSchema,
} from '../learningValidation.ts';

const router = Router();
router.use(requireAuth);

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.log',
  '.py',
  '.js',
  '.ts',
  '.tsx',
  '.sh',
  '.sql',
  '.yaml',
  '.yml',
  '.conf',
  '.xml',
  '.zip',
  '.xls',
  '.xlsx',
  '.odt',
  '.odp',
]);

const EXT_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.py': 'text/plain; charset=utf-8',
  '.js': 'text/plain; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8',
  '.sh': 'text/plain; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
  '.yaml': 'text/plain; charset=utf-8',
  '.yml': 'text/plain; charset=utf-8',
  '.conf': 'text/plain; charset=utf-8',
  '.xml': 'text/plain; charset=utf-8',
  '.zip': 'application/zip',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
};

const SAFE_INLINE_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.log',
  '.py',
  '.js',
  '.ts',
  '.tsx',
  '.sh',
  '.sql',
  '.yaml',
  '.yml',
  '.conf',
  '.xml',
]);

const uploadStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = (req as AuthedRequest).user?.id;
    cb(null, getLearningUploadsDir(userId));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '';
    cb(null, `${crypto.randomUUID()}${safeExt}`);
  },
});

const uploadMiddleware = multer({
  storage: uploadStorage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      cb(
        new Error(
          `Unsupported file format (${ext || 'unknown'}). Allowed: PDF, PNG/JPG/WEBP, PPT/PPTX, DOC/DOCX, TXT/MD/Code, XLS/XLSX, ODT/ODP, ZIP.`
        )
      );
      return;
    }
    cb(null, true);
  },
});

function sanitizeNoteHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  let cleaned = rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<(iframe|object|embed|form|meta|link|base)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|meta|link|base)[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi, '');
  return cleaned;
}

function extractPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|pre|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function removeUploadedFileIfPresent(userId: string, storageFilename?: string | null): void {
  if (!storageFilename) return;
  try {
    const safeName = path.basename(storageFilename);
    const fullPath = path.join(getLearningUploadsDir(userId), safeName);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    // Best-effort cleanup
  }
}

function mapModuleRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || '',
    color: row.color || '#9ECCFD',
    icon: row.icon || 'book',
    status: row.status,
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLessonRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    moduleId: row.module_id,
    title: row.title,
    description: row.description || '',
    teacherName: row.teacher_name || '',
    lessonDate: row.lesson_date || '',
    status: row.status,
    learningObjectives: safeJsonParse<string[]>(row.learning_objectives, []),
    studyDurationMinutes: Number(row.study_duration_minutes || 60),
    sortOrder: Number(row.sort_order),
    lastOpenedAt: row.last_opened_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNoteRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    lessonId: row.lesson_id,
    title: row.title,
    contentHtml: row.content_html || '',
    plainText: row.plain_text || '',
    isPinned: Boolean(row.is_pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapResourceRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id || null,
    kind: row.kind,
    title: row.title,
    description: row.description || '',
    folderName: row.folder_name || 'General',
    externalUrl: row.external_url || undefined,
    originalFilename: row.original_filename || undefined,
    mimeType: row.mime_type || undefined,
    fileSize: Number(row.file_size || 0),
    fileExtension: row.file_extension || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTaskRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id || null,
    title: row.title,
    description: row.description || '',
    taskKind: row.task_kind || 'task',
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date || '',
    subtasks: safeJsonParse<any[]>(row.subtasks, []),
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStudySessionRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    moduleId: row.module_id || null,
    lessonId: row.lesson_id || null,
    subject: row.subject,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: Number(row.duration_minutes),
    whatWasLearned: row.what_was_learned || '',
    createdAt: row.created_at,
  };
}

// GET /api/learning/bootstrap
router.get('/bootstrap', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();

  const modules = db
    .prepare('SELECT * FROM learning_modules WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(userId)
    .map(mapModuleRow);

  const lessons = db
    .prepare('SELECT * FROM learning_lessons WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(userId)
    .map(mapLessonRow);

  const notes = db
    .prepare('SELECT * FROM learning_notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC')
    .all(userId)
    .map(mapNoteRow);

  const resources = db
    .prepare('SELECT * FROM learning_resources WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId)
    .map(mapResourceRow);

  const tasks = db
    .prepare('SELECT * FROM learning_tasks WHERE user_id = ? ORDER BY due_date ASC, created_at DESC')
    .all(userId)
    .map(mapTaskRow);

  const studySessions = db
    .prepare('SELECT * FROM learning_study_sessions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId)
    .map(mapStudySessionRow);

  res.json({
    modules,
    lessons,
    notes,
    resources,
    tasks,
    studySessions,
  });
});

// ======================== MODULES ========================

router.post('/modules', (req: AuthedRequest, res) => {
  const parsed = moduleCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid module data.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const maxRow = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM learning_modules WHERE user_id = ?')
    .get(userId) as { max_order: number };

  const now = new Date().toISOString();
  const id = `mod_${crypto.randomUUID()}`;
  const sortOrder = Number(maxRow?.max_order ?? -1) + 1;

  db.prepare(
    `INSERT INTO learning_modules (id, user_id, title, description, color, icon, status, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    parsed.data.title,
    parsed.data.description,
    parsed.data.color,
    parsed.data.icon,
    parsed.data.status,
    sortOrder,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM learning_modules WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ module: mapModuleRow(row) });
});

router.patch('/modules/reorder', (req: AuthedRequest, res) => {
  const parsed = moduleReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reorder payload.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const { orderedIds } = parsed.data;
  const existingRows = db.prepare('SELECT id FROM learning_modules WHERE user_id = ?').all(userId) as { id: string }[];
  const existingSet = new Set(existingRows.map(r => r.id));

  for (const id of orderedIds) {
    if (!existingSet.has(id)) {
      res.status(404).json({ error: 'Module not found.' });
      return;
    }
  }

  const updateStmt = db.prepare('UPDATE learning_modules SET sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?');
  const now = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE');
  try {
    orderedIds.forEach((id, idx) => {
      updateStmt.run(idx, now, id, userId);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const rows = db
    .prepare('SELECT * FROM learning_modules WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(userId);
  res.json({ modules: rows.map(mapModuleRow) });
});

router.patch('/modules/:id', (req: AuthedRequest, res) => {
  const parsed = moduleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid module updates.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM learning_modules WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Module not found.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE learning_modules
     SET title = ?, description = ?, color = ?, icon = ?, status = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    parsed.data.title ?? existing.title,
    parsed.data.description ?? existing.description,
    parsed.data.color ?? existing.color,
    parsed.data.icon ?? existing.icon,
    parsed.data.status ?? existing.status,
    now,
    req.params.id,
    userId
  );

  const updated = db.prepare('SELECT * FROM learning_modules WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  res.json({ module: mapModuleRow(updated) });
});

router.delete('/modules/:id', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM learning_modules WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Module not found.' });
    return;
  }

  const fileRows = db
    .prepare('SELECT storage_filename FROM learning_resources WHERE module_id = ? AND user_id = ? AND storage_filename IS NOT NULL')
    .all(req.params.id, userId) as { storage_filename: string }[];

  db.prepare('DELETE FROM learning_modules WHERE id = ? AND user_id = ?').run(req.params.id, userId);

  for (const f of fileRows) {
    removeUploadedFileIfPresent(userId, f.storage_filename);
  }

  res.json({ success: true });
});

// ======================== LESSONS ========================

router.post('/lessons', (req: AuthedRequest, res) => {
  const parsed = lessonCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lesson data.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const parentModule = db
    .prepare('SELECT id FROM learning_modules WHERE id = ? AND user_id = ?')
    .get(parsed.data.moduleId, userId);
  if (!parentModule) {
    res.status(404).json({ error: 'Parent module not found.' });
    return;
  }

  const maxRow = db
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM learning_lessons WHERE module_id = ? AND user_id = ?')
    .get(parsed.data.moduleId, userId) as { max_order: number };

  const id = `les_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const sortOrder = Number(maxRow?.max_order ?? -1) + 1;

  db.prepare(
    `INSERT INTO learning_lessons
     (id, user_id, module_id, title, description, teacher_name, lesson_date, status, learning_objectives, study_duration_minutes, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    parsed.data.moduleId,
    parsed.data.title,
    parsed.data.description,
    parsed.data.teacherName,
    parsed.data.lessonDate,
    parsed.data.status,
    JSON.stringify(parsed.data.learningObjectives),
    parsed.data.studyDurationMinutes,
    sortOrder,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM learning_lessons WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ lesson: mapLessonRow(row) });
});

router.patch('/lessons/reorder', (req: AuthedRequest, res) => {
  const parsed = lessonReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lesson reorder payload.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const { moduleId, orderedIds } = parsed.data;

  const existingRows = db
    .prepare('SELECT id FROM learning_lessons WHERE module_id = ? AND user_id = ?')
    .all(moduleId, userId) as { id: string }[];
  const existingSet = new Set(existingRows.map(r => r.id));

  for (const id of orderedIds) {
    if (!existingSet.has(id)) {
      res.status(404).json({ error: 'Lesson not found in module.' });
      return;
    }
  }

  const updateStmt = db.prepare(
    'UPDATE learning_lessons SET sort_order = ?, updated_at = ? WHERE id = ? AND module_id = ? AND user_id = ?'
  );
  const now = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE');
  try {
    orderedIds.forEach((id, idx) => {
      updateStmt.run(idx, now, id, moduleId, userId);
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const rows = db
    .prepare('SELECT * FROM learning_lessons WHERE module_id = ? AND user_id = ? ORDER BY sort_order ASC, created_at ASC')
    .all(moduleId, userId);
  res.json({ lessons: rows.map(mapLessonRow) });
});

router.patch('/lessons/:id', (req: AuthedRequest, res) => {
  const parsed = lessonUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid lesson updates.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM learning_lessons WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }

  const now = new Date().toISOString();
  const objectivesJson =
    parsed.data.learningObjectives !== undefined
      ? JSON.stringify(parsed.data.learningObjectives)
      : existing.learning_objectives;

  db.prepare(
    `UPDATE learning_lessons
     SET title = ?, description = ?, teacher_name = ?, lesson_date = ?, status = ?,
         learning_objectives = ?, study_duration_minutes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    parsed.data.title ?? existing.title,
    parsed.data.description ?? existing.description,
    parsed.data.teacherName ?? existing.teacher_name,
    parsed.data.lessonDate ?? existing.lesson_date,
    parsed.data.status ?? existing.status,
    objectivesJson,
    parsed.data.studyDurationMinutes ?? existing.study_duration_minutes,
    now,
    req.params.id,
    userId
  );

  const updated = db.prepare('SELECT * FROM learning_lessons WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  res.json({ lesson: mapLessonRow(updated) });
});

router.post('/lessons/:id/open', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM learning_lessons WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE learning_lessons SET last_opened_at = ? WHERE id = ? AND user_id = ?').run(now, req.params.id, userId);
  const updated = db.prepare('SELECT * FROM learning_lessons WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  res.json({ lesson: mapLessonRow(updated) });
});

router.delete('/lessons/:id', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM learning_lessons WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Lesson not found.' });
    return;
  }

  const fileRows = db
    .prepare('SELECT storage_filename FROM learning_resources WHERE lesson_id = ? AND user_id = ? AND storage_filename IS NOT NULL')
    .all(req.params.id, userId) as { storage_filename: string }[];

  db.prepare('DELETE FROM learning_lessons WHERE id = ? AND user_id = ?').run(req.params.id, userId);

  for (const f of fileRows) {
    removeUploadedFileIfPresent(userId, f.storage_filename);
  }

  res.json({ success: true });
});

// ======================== NOTES ========================

router.post('/notes', (req: AuthedRequest, res) => {
  const parsed = noteCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid note data.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const lesson = db.prepare('SELECT id FROM learning_lessons WHERE id = ? AND user_id = ?').get(parsed.data.lessonId, userId);
  if (!lesson) {
    res.status(404).json({ error: 'Parent lesson not found.' });
    return;
  }

  const id = `note_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const cleanHtml = sanitizeNoteHtml(parsed.data.contentHtml);
  const plainText = extractPlainText(cleanHtml);

  db.prepare(
    `INSERT INTO learning_notes (id, user_id, lesson_id, title, content_html, plain_text, is_pinned, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    parsed.data.lessonId,
    parsed.data.title,
    cleanHtml,
    plainText,
    parsed.data.isPinned ? 1 : 0,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM learning_notes WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ note: mapNoteRow(row) });
});

router.patch('/notes/:id', (req: AuthedRequest, res) => {
  const parsed = noteUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid note updates.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM learning_notes WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }

  const nextHtml = parsed.data.contentHtml !== undefined ? sanitizeNoteHtml(parsed.data.contentHtml) : existing.content_html;
  const nextPlain = parsed.data.contentHtml !== undefined ? extractPlainText(nextHtml) : existing.plain_text;
  const nextPinned = parsed.data.isPinned !== undefined ? (parsed.data.isPinned ? 1 : 0) : existing.is_pinned;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE learning_notes
     SET title = ?, content_html = ?, plain_text = ?, is_pinned = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(parsed.data.title ?? existing.title, nextHtml, nextPlain, nextPinned, now, req.params.id, userId);

  const updated = db.prepare('SELECT * FROM learning_notes WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  res.json({ note: mapNoteRow(updated) });
});

router.delete('/notes/:id', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM learning_notes WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Note not found.' });
    return;
  }
  db.prepare('DELETE FROM learning_notes WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ======================== RESOURCES ========================

router.post('/resources/upload', (req: AuthedRequest, res) => {
  uploadMiddleware.single('file')(req, res as unknown as Response, (uploadErr: any) => {
    if (uploadErr) {
      if (uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'File exceeds the 25 MB upload limit.' });
        return;
      }
      res.status(400).json({ error: uploadErr.message || 'File upload failed.' });
      return;
    }

    const file = req.file;
    const userId = req.user!.id;
    if (!file) {
      res.status(400).json({ error: 'Please select a file to upload.' });
      return;
    }

    const moduleId = typeof req.body?.moduleId === 'string' ? req.body.moduleId.trim() : '';
    const lessonId =
      typeof req.body?.lessonId === 'string' && req.body.lessonId.trim() ? req.body.lessonId.trim() : null;
    const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim().slice(0, 1000) : '';
    const rawFolder = typeof req.body?.folderName === 'string' ? req.body.folderName.trim().slice(0, 80) : '';
    const folderName = rawFolder || 'General';

    const db = getDb();
    const mod = db.prepare('SELECT id FROM learning_modules WHERE id = ? AND user_id = ?').get(moduleId, userId);
    if (!mod) {
      removeUploadedFileIfPresent(userId, file.filename);
      res.status(404).json({ error: 'Module not found.' });
      return;
    }

    if (lessonId) {
      const les = db
        .prepare('SELECT id FROM learning_lessons WHERE id = ? AND module_id = ? AND user_id = ?')
        .get(lessonId, moduleId, userId);
      if (!les) {
        removeUploadedFileIfPresent(userId, file.filename);
        res.status(404).json({ error: 'Lesson not found in this module.' });
        return;
      }
    }

    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = EXT_TO_MIME[ext] || file.mimetype || 'application/octet-stream';
    const title = (rawTitle || file.originalname || 'Uploaded File').slice(0, 180);
    const id = `lres_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    try {
      db.prepare(
        `INSERT INTO learning_resources
         (id, user_id, module_id, lesson_id, kind, title, description, folder_name, original_filename, storage_filename, mime_type, file_size, file_extension, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'file', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        userId,
        moduleId,
        lessonId,
        title,
        description,
        folderName,
        file.originalname,
        file.filename,
        mime,
        file.size,
        ext,
        now,
        now
      );

      const row = db.prepare('SELECT * FROM learning_resources WHERE id = ? AND user_id = ?').get(id, userId);
      res.status(201).json({ resource: mapResourceRow(row) });
    } catch (err) {
      removeUploadedFileIfPresent(userId, file.filename);
      throw err;
    }
  });
});

router.post('/resources/link', (req: AuthedRequest, res) => {
  const parsed = resourceLinkCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid external link data.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const mod = db.prepare('SELECT id FROM learning_modules WHERE id = ? AND user_id = ?').get(parsed.data.moduleId, userId);
  if (!mod) {
    res.status(404).json({ error: 'Module not found.' });
    return;
  }

  const lessonId = parsed.data.lessonId || null;
  if (lessonId) {
    const les = db
      .prepare('SELECT id FROM learning_lessons WHERE id = ? AND module_id = ? AND user_id = ?')
      .get(lessonId, parsed.data.moduleId, userId);
    if (!les) {
      res.status(404).json({ error: 'Lesson not found in this module.' });
      return;
    }
  }

  const id = `lres_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO learning_resources
     (id, user_id, module_id, lesson_id, kind, title, description, folder_name, external_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'link', ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    parsed.data.moduleId,
    lessonId,
    parsed.data.title,
    parsed.data.description,
    parsed.data.folderName,
    parsed.data.externalUrl,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM learning_resources WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ resource: mapResourceRow(row) });
});

router.patch('/resources/:id', (req: AuthedRequest, res) => {
  const parsed = resourceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid resource update.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM learning_resources WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Resource not found.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE learning_resources
     SET title = ?, description = ?, folder_name = ?, external_url = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    parsed.data.title ?? existing.title,
    parsed.data.description ?? existing.description,
    parsed.data.folderName ?? existing.folder_name,
    existing.kind === 'link' ? parsed.data.externalUrl ?? existing.external_url : existing.external_url,
    now,
    req.params.id,
    userId
  );

  const updated = db.prepare('SELECT * FROM learning_resources WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  res.json({ resource: mapResourceRow(updated) });
});

router.get('/resources/:id/file', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM learning_resources WHERE id = ? AND user_id = ? AND kind = \'file\'')
    .get(req.params.id, userId) as any;

  if (!row || !row.storage_filename) {
    res.status(404).json({ error: 'Resource file not found.' });
    return;
  }

  const safeStorageName = path.basename(row.storage_filename);
  const fullPath = path.join(getLearningUploadsDir(userId), safeStorageName);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Stored file is missing from disk.' });
    return;
  }

  const ext = (row.file_extension || path.extname(safeStorageName)).toLowerCase();
  const requestedInline = req.query.disposition === 'inline';
  const disposition = requestedInline && SAFE_INLINE_EXTENSIONS.has(ext) ? 'inline' : 'attachment';
  const safeDownloadName = (row.original_filename || row.title || 'resource').replace(/["\r\n\\]/g, '_');

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', EXT_TO_MIME[ext] || row.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${disposition}; filename="${safeDownloadName}"`);
  res.sendFile(fullPath);
});

router.delete('/resources/:id', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM learning_resources WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Resource not found.' });
    return;
  }

  db.prepare('DELETE FROM learning_resources WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  removeUploadedFileIfPresent(userId, existing.storage_filename);
  res.json({ success: true });
});

// ======================== LEARNING TASKS & EXERCISES ========================

router.post('/tasks', (req: AuthedRequest, res) => {
  const parsed = learningTaskCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid task data.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const mod = db.prepare('SELECT id FROM learning_modules WHERE id = ? AND user_id = ?').get(parsed.data.moduleId, userId);
  if (!mod) {
    res.status(404).json({ error: 'Module not found.' });
    return;
  }

  const lessonId = parsed.data.lessonId || null;
  if (lessonId) {
    const les = db
      .prepare('SELECT id FROM learning_lessons WHERE id = ? AND module_id = ? AND user_id = ?')
      .get(lessonId, parsed.data.moduleId, userId);
    if (!les) {
      res.status(404).json({ error: 'Lesson not found in this module.' });
      return;
    }
  }

  const id = `ltask_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const completedAt = parsed.data.status === 'completed' ? now : null;

  db.prepare(
    `INSERT INTO learning_tasks
     (id, user_id, module_id, lesson_id, title, description, task_kind, status, priority, due_date, subtasks, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    parsed.data.moduleId,
    lessonId,
    parsed.data.title,
    parsed.data.description,
    parsed.data.taskKind,
    parsed.data.status,
    parsed.data.priority,
    parsed.data.dueDate,
    JSON.stringify(parsed.data.subtasks),
    completedAt,
    now,
    now
  );

  const row = db.prepare('SELECT * FROM learning_tasks WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ task: mapTaskRow(row) });
});

router.patch('/tasks/:id', (req: AuthedRequest, res) => {
  const parsed = learningTaskUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid task updates.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM learning_tasks WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
  if (!existing) {
    res.status(404).json({ error: 'Learning task not found.' });
    return;
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const now = new Date().toISOString();
  let completedAt = existing.completed_at;
  if (nextStatus === 'completed' && !completedAt) {
    completedAt = now;
  } else if (nextStatus !== 'completed') {
    completedAt = null;
  }

  const subtasksJson =
    parsed.data.subtasks !== undefined ? JSON.stringify(parsed.data.subtasks) : existing.subtasks;

  db.prepare(
    `UPDATE learning_tasks
     SET title = ?, description = ?, task_kind = ?, status = ?, priority = ?, due_date = ?, subtasks = ?, completed_at = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    parsed.data.title ?? existing.title,
    parsed.data.description ?? existing.description,
    parsed.data.taskKind ?? existing.task_kind,
    nextStatus,
    parsed.data.priority ?? existing.priority,
    parsed.data.dueDate ?? existing.due_date,
    subtasksJson,
    completedAt,
    now,
    req.params.id,
    userId
  );

  const updated = db.prepare('SELECT * FROM learning_tasks WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  res.json({ task: mapTaskRow(updated) });
});

router.delete('/tasks/:id', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM learning_tasks WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Learning task not found.' });
    return;
  }
  db.prepare('DELETE FROM learning_tasks WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// ======================== STUDY SESSIONS ========================

router.post('/study-sessions', (req: AuthedRequest, res) => {
  const parsed = studySessionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid study session data.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();

  if (parsed.data.moduleId) {
    const mod = db.prepare('SELECT id FROM learning_modules WHERE id = ? AND user_id = ?').get(parsed.data.moduleId, userId);
    if (!mod) {
      res.status(404).json({ error: 'Module not found.' });
      return;
    }
  }
  if (parsed.data.lessonId) {
    const les = db.prepare('SELECT id FROM learning_lessons WHERE id = ? AND user_id = ?').get(parsed.data.lessonId, userId);
    if (!les) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }
  }

  const id = `lss_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO learning_study_sessions
     (id, user_id, module_id, lesson_id, subject, date, start_time, end_time, duration_minutes, what_was_learned, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    parsed.data.moduleId || null,
    parsed.data.lessonId || null,
    parsed.data.subject,
    parsed.data.date,
    parsed.data.startTime,
    parsed.data.endTime,
    parsed.data.durationMinutes,
    parsed.data.whatWasLearned,
    now
  );

  const row = db.prepare('SELECT * FROM learning_study_sessions WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ studySession: mapStudySessionRow(row) });
});

router.delete('/study-sessions/:id', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM learning_study_sessions WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  if (!existing) {
    res.status(404).json({ error: 'Study session not found.' });
    return;
  }
  db.prepare('DELETE FROM learning_study_sessions WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

export default router;
