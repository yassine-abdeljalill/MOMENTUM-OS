import { Router } from 'express';
import { z } from 'zod';
import { type AuthedRequest, requireAuth } from '../auth.ts';
import {
  exportCompleteBackupForUser,
  previewBackupPayload,
  restoreCompleteBackupForUser,
} from '../backup.ts';
import { BackupValidationError } from '../../src/lib/backupEngine.ts';

const router = Router();
router.use(requireAuth);

const previewRequestSchema = z.object({
  rawText: z.string().optional(),
  backup: z.unknown().optional(),
});

const restoreRequestSchema = z.object({
  rawText: z.string().optional(),
  backup: z.unknown().optional(),
  strategy: z.enum(['merge', 'replace']),
  confirmReplace: z.boolean().optional(),
});

// GET /api/backup/export
router.get('/export', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const backup = await exportCompleteBackupForUser(userId);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.query.download === '1' || req.query.download === 'true') {
      const dateStamp = new Date().toISOString().slice(0, 10);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="momentum-complete-backup-${dateStamp}.json"`
      );
    }
    res.json(backup);
  } catch (err) {
    next(err);
  }
});

// POST /api/backup/preview
router.post('/preview', async (req: AuthedRequest, res, next) => {
  try {
    const parsed = previewRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid preview request payload.', code: 'INVALID_FORMAT' });
      return;
    }

    if (parsed.data.rawText === undefined && parsed.data.backup === undefined) {
      res.status(400).json({
        error: 'Provide either rawText or backup payload to preview.',
        code: 'INVALID_FORMAT',
      });
      return;
    }

    const result = await previewBackupPayload({
      rawText: parsed.data.rawText,
      backup: parsed.data.backup,
    });
    res.json(result);
  } catch (err) {
    if (err instanceof BackupValidationError) {
      res.status(400).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

// POST /api/backup/restore
router.post('/restore', async (req: AuthedRequest, res, next) => {
  try {
    const parsed = restoreRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid restore request.',
        code: 'INVALID_FORMAT',
      });
      return;
    }

    const { rawText, backup, strategy, confirmReplace } = parsed.data;
    if (rawText === undefined && backup === undefined) {
      res.status(400).json({ error: 'Backup payload is required.', code: 'INVALID_FORMAT' });
      return;
    }

    if (strategy === 'replace' && confirmReplace !== true) {
      res.status(400).json({
        error: 'Full replace restore requires explicit confirmation to protect existing data.',
        code: 'CONFIRMATION_REQUIRED',
      });
      return;
    }

    const result = await restoreCompleteBackupForUser(req.user!.id, {
      rawText,
      backup,
      strategy,
    });
    res.json(result);
  } catch (err) {
    if (err instanceof BackupValidationError) {
      res.status(400).json({ error: err.message, code: err.code });
      return;
    }
    next(err);
  }
});

export default router;
