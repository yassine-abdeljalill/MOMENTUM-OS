import { Router } from 'express';
import { type AuthedRequest, requireAuth } from '../auth.ts';
import {
  applyWorkspaceMigration,
  applyWorkspaceSyncBatch,
  clearWorkspaceData,
  getWorkspaceBootstrap,
} from '../workspaceSync.ts';
import {
  workspaceBootstrapQuerySchema,
  workspaceMigrateSchema,
  workspaceSyncBatchSchema,
} from '../workspaceValidation.ts';

const router = Router();

// Strictly enforce authenticated user ownership on every workspace sync endpoint
router.use(requireAuth);

// GET /api/workspace/bootstrap(?sinceVersion=N)
router.get('/bootstrap', (req: AuthedRequest, res) => {
  const parsedQuery = workspaceBootstrapQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.issues[0]?.message || 'Invalid query parameter.' });
    return;
  }

  const bootstrap = getWorkspaceBootstrap(req.user!.id, parsedQuery.data.sinceVersion);
  res.json(bootstrap);
});

// POST /api/workspace/sync
router.post('/sync', (req: AuthedRequest, res) => {
  const parsed = workspaceSyncBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid sync payload.' });
    return;
  }

  const result = applyWorkspaceSyncBatch(req.user!.id, parsed.data as any);
  res.json(result);
});

// POST /api/workspace/migrate (idempotent localStorage or backup import)
router.post('/migrate', (req: AuthedRequest, res) => {
  const parsed = workspaceMigrateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid migration payload.' });
    return;
  }

  const { importKey, source, ...batch } = parsed.data;
  const result = applyWorkspaceMigration(req.user!.id, {
    importKey,
    source,
    batch: batch as any,
  });
  res.json(result);
});

// POST /api/workspace/clear
router.post('/clear', (req: AuthedRequest, res) => {
  const result = clearWorkspaceData(req.user!.id);
  res.json(result);
});

export default router;
