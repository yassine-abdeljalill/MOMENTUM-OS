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

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
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

export function setSessionCookie(res: Response, rawToken: string, expiresAt: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const expiresDate = new Date(expiresAt);
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd && process.env.ALLOW_INSECURE_COOKIES !== 'true',
    path: '/',
    expires: expiresDate,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

export function revokeSessionToken(rawToken: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(rawToken));
}

export function getUserFromSessionToken(rawToken: string): AuthenticatedUser | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(rawToken)) as
    | { id: string; email: string; full_name: string; created_at: string; expires_at: string }
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
  { name: 'Food', color: '#A36116' },
  { name: 'Transport', color: '#1E5A99' },
  { name: 'Education', color: '#8EC5FF' },
  { name: 'Shopping', color: '#6E5648' },
  { name: 'Health', color: '#3E7B52' },
  { name: 'Entertainment', color: '#73B6FC' },
  { name: 'Bills', color: '#B84A44' },
  { name: 'Housing', color: '#3B2418' },
  { name: 'Technology', color: '#4D3021' },
  { name: 'Other', color: '#8A7364' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', color: '#3E7B52' },
  { name: 'Freelance', color: '#1E5A99' },
  { name: 'Scholarship / Stipend', color: '#8EC5FF' },
  { name: 'Investments', color: '#2D6240' },
  { name: 'Gift', color: '#A36116' },
  { name: 'Other Income', color: '#6E5648' },
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
