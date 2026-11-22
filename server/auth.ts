import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import { getDataDir, getDb } from './db.ts';

const SESSION_COOKIE_NAME = 'momentum_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  isWorkspace: boolean;
  createdAt: string;
}

export interface AuthedRequest extends Request {
  user?: AuthenticatedUser;
  sessionToken?: string;
}

let cachedSecret: string | null = null;

function getSessionSecret(): string {
  if (cachedSecret) return cachedSecret;
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    cachedSecret = process.env.SESSION_SECRET;
    return cachedSecret;
  }
  const secretPath = path.join(getDataDir(), '.session_secret');
  if (fs.existsSync(secretPath)) {
    cachedSecret = fs.readFileSync(secretPath, 'utf8').trim();
    if (cachedSecret.length >= 32) return cachedSecret;
  }
  cachedSecret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretPath, cachedSecret, { mode: 0o600 });
  return cachedSecret;
}

const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;
const DUMMY_SALT = '00112233445566778899aabbccddeeff';
const DUMMY_HASH = '00'.repeat(64);

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64, SCRYPT_OPTIONS).toString('hex');
  return { hash: derived, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64, SCRYPT_OPTIONS);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

export function runConstantTimeDummyVerify(password: string): void {
  verifyPassword(password || 'dummy', DUMMY_HASH, DUMMY_SALT);
}

function hashToken(rawToken: string): string {
  return crypto.createHmac('sha256', getSessionSecret()).update(rawToken).digest('hex');
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

export function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

export function createSessionForUser(userId: string): { rawToken: string; expiresAt: string } {
  const db = getDb();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(`sess_${crypto.randomUUID()}`, userId, tokenHash, expiresAt, now.toISOString());

  return { rawToken, expiresAt };
}

export function setSessionCookie(res: Response, rawToken: string, expiresAt: string, isHttps: boolean = false): void {
  const expiresDate = new Date(expiresAt);
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    expires: expiresDate,
  });
}

export function clearSessionCookie(res: Response, isHttps: boolean = false): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
  });
}

export function revokeSessionToken(rawToken: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(rawToken));
}

export function getUserFromSessionToken(rawToken: string): AuthenticatedUser | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.is_workspace, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(rawToken)) as
    | {
        id: string;
        email: string;
        full_name: string;
        is_workspace: number;
        created_at: string;
        expires_at: string;
      }
    | undefined;

  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(rawToken));
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    isWorkspace: Boolean(row.is_workspace),
    createdAt: row.created_at,
  };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required to access financial data.' });
    return;
  }
  const user = getUserFromSessionToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  req.user = user;
  req.sessionToken = token;
  next();
}

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', color: '#1D1D1F' },
  { name: 'Transport', color: '#3A3A3C' },
  { name: 'Education', color: '#48484A' },
  { name: 'Shopping', color: '#6E6E73' },
  { name: 'Health', color: '#8E8E93' },
  { name: 'Entertainment', color: '#AEAEB2' },
  { name: 'Bills', color: '#C7C7CC' },
  { name: 'Housing', color: '#2C2C2E' },
  { name: 'Technology', color: '#636366' },
  { name: 'Other', color: '#D1D1D6' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', color: '#1D1D1F' },
  { name: 'Freelance', color: '#3A3A3C' },
  { name: 'Scholarship / Stipend', color: '#6E6E73' },
  { name: 'Investments', color: '#8E8E93' },
  { name: 'Gift', color: '#AEAEB2' },
  { name: 'Other Income', color: '#D1D1D6' },
];

export function initializeUserFinanceDefaults(userId: string): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT OR IGNORE INTO finance_settings (user_id, currency, locale, updated_at)
     VALUES (?, 'MAD', 'en-MA', ?)`
  ).run(userId, now);

  const insertCat = db.prepare(
    `INSERT OR IGNORE INTO finance_categories (id, user_id, name, type, color, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?)`
  );

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    insertCat.run(`cat_${crypto.randomUUID()}`, userId, cat.name, 'expense', cat.color, now);
  }
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    insertCat.run(`cat_${crypto.randomUUID()}`, userId, cat.name, 'income', cat.color, now);
  }
}
