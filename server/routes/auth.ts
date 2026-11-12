import crypto from 'node:crypto';
import { Router } from 'express';
import {
  clearSessionCookie,
  createSessionForUser,
  extractSessionToken,
  getUserFromSessionToken,
  hashPassword,
  initializeUserFinanceDefaults,
  revokeSessionToken,
  setSessionCookie,
  verifyPassword,
} from '../auth.ts';
import { getDb } from '../db.ts';
import { loginSchema, signupSchema } from '../validation.ts';

const router = Router();

function shouldUseSecureCookie(req: { secure?: boolean; headers: Record<string, string | string[] | undefined> }): boolean {
  if (req.secure) return true;
  const proto = req.headers['x-forwarded-proto'];
  if (typeof proto === 'string' && proto.split(',')[0].trim() === 'https') {
    return true;
  }
  return false;
}

router.post('/signup', (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid registration data.',
    });
    return;
  }

  const { email, password, fullName } = parsed.data;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = `usr_${crypto.randomUUID()}`;
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, email, full_name, password_hash, password_salt, is_workspace, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  ).run(userId, email, fullName, hash, salt, now);

  initializeUserFinanceDefaults(userId);

  const { rawToken, expiresAt } = createSessionForUser(userId);
  setSessionCookie(res, rawToken, expiresAt, shouldUseSecureCookie(req));

  res.status(201).json({
    sessionToken: rawToken,
    user: {
      id: userId,
      email,
      fullName,
      isWorkspace: false,
      createdAt: now,
    },
  });
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid credentials format.',
    });
    return;
  }

  const { email, password } = parsed.data;
  const db = getDb();

  const row = db
    .prepare(
      `SELECT id, email, full_name, password_hash, password_salt, is_workspace, created_at
       FROM users
       WHERE email = ? AND is_workspace = 0`
    )
    .get(email) as
    | {
        id: string;
        email: string;
        full_name: string;
        password_hash: string;
        password_salt: string;
        is_workspace: number;
        created_at: string;
      }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  initializeUserFinanceDefaults(row.id);

  const { rawToken, expiresAt } = createSessionForUser(row.id);
  setSessionCookie(res, rawToken, expiresAt, shouldUseSecureCookie(req));

  res.json({
    sessionToken: rawToken,
    user: {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      isWorkspace: Boolean(row.is_workspace),
      createdAt: row.created_at,
    },
  });
});

router.post('/workspace-session', (req, res) => {
  const existingToken = extractSessionToken(req);
  if (existingToken) {
    const existingUser = getUserFromSessionToken(existingToken);
    if (existingUser) {
      initializeUserFinanceDefaults(existingUser.id);
      res.json({ sessionToken: existingToken, user: existingUser });
      return;
    }
  }

  const rawName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim().slice(0, 80) : '';
  const fullName = rawName.length >= 1 ? rawName : 'MOMENTUM User';
  const userId = `usr_${crypto.randomUUID()}`;
  const workspaceEmail = `workspace_${crypto.randomUUID()}@workspace.momentum`;
  const { hash, salt } = hashPassword(crypto.randomBytes(32).toString('hex'));
  const now = new Date().toISOString();

  const db = getDb();
  db.prepare(
    `INSERT INTO users (id, email, full_name, password_hash, password_salt, is_workspace, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  ).run(userId, workspaceEmail, fullName, hash, salt, now);

  initializeUserFinanceDefaults(userId);

  const { rawToken, expiresAt } = createSessionForUser(userId);
  setSessionCookie(res, rawToken, expiresAt, shouldUseSecureCookie(req));

  res.status(201).json({
    sessionToken: rawToken,
    user: {
      id: userId,
      email: workspaceEmail,
      fullName,
      isWorkspace: true,
      createdAt: now,
    },
  });
});

router.post('/logout', (req, res) => {
  const token = extractSessionToken(req);
  if (token) {
    revokeSessionToken(token);
  }
  clearSessionCookie(res, shouldUseSecureCookie(req));
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  const token = extractSessionToken(req);
  if (!token) {
    res.json({ user: null });
    return;
  }
  const user = getUserFromSessionToken(token);
  if (!user) {
    clearSessionCookie(res, shouldUseSecureCookie(req));
    res.json({ user: null });
    return;
  }
  res.json({ user });
});

export default router;
