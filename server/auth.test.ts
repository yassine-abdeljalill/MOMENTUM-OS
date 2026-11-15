import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  extractSessionToken,
  hashPassword,
  requireAuth,
  runConstantTimeDummyVerify,
  verifyPassword,
} from './auth.ts';
import { getDb } from './db.ts';
import authRoutes from './routes/auth.ts';
import { loginSchema, signupSchema } from './validation.ts';

describe('MOMENTUM Authentication System', () => {
  const createdEmails: string[] = [];

  after(() => {
    const db = getDb();
    for (const email of createdEmails) {
      db.prepare('DELETE FROM users WHERE LOWER(email) = LOWER(?)').run(email);
    }
  });

  it('hashes passwords with scrypt and verifies safely without storing plaintext', () => {
    const { hash, salt } = hashPassword('MySecurePass!2026');
    assert.notEqual(hash, 'MySecurePass!2026');
    assert.equal(hash.length, 128);
    assert.equal(salt.length, 32);
    assert.equal(verifyPassword('MySecurePass!2026', hash, salt), true);
    assert.equal(verifyPassword('WrongPassword', hash, salt), false);
    assert.equal(verifyPassword('', hash, salt), false);
    assert.equal(verifyPassword('MySecurePass!2026', 'not-hex', salt), false);
    assert.equal(verifyPassword('MySecurePass!2026', hash, ''), false);
    assert.doesNotThrow(() => runConstantTimeDummyVerify('anything'));
  });

  it('validates and normalizes signup and login payloads', () => {
    const signup = signupSchema.safeParse({
      email: '  Alex.Test@Example.COM ',
      password: 'Password123!',
      fullName: '  Alex Test  ',
    });
    assert.equal(signup.success, true);
    if (signup.success) {
      assert.equal(signup.data.email, 'alex.test@example.com');
      assert.equal(signup.data.fullName, 'Alex Test');
    }

    const badSignup = signupSchema.safeParse({
      email: 'not-an-email',
      password: 'short',
      fullName: 'A',
    });
    assert.equal(badSignup.success, false);

    const login = loginSchema.safeParse({
      email: '  Alex.Test@Example.COM ',
      password: 'Password123!',
    });
    assert.equal(login.success, true);
    if (login.success) {
      assert.equal(login.data.email, 'alex.test@example.com');
    }
  });

  it('extracts session tokens from Bearer header or momentum_session cookie', () => {
    assert.equal(
      extractSessionToken({ headers: { authorization: 'Bearer abc123' } } as any),
      'abc123'
    );
    assert.equal(
      extractSessionToken({ headers: { cookie: 'foo=bar; momentum_session=xyz789' } } as any),
      'xyz789'
    );
    assert.equal(extractSessionToken({ headers: {} } as any), null);
  });

  it('completes signup, duplicate check, logout, login, protected check, and Express 4 SPA fallback without 404', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.get('/api/protected-check', requireAuth, (req: any, res) => {
      res.json({ userId: req.user.id });
    });
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'API endpoint not found.' });
    });
    app.get('*', (_req, res) => {
      res.status(200).send('<html>SPA_OK</html>');
    });

    const server = app.listen(0);
    const port = (server.address() as any).port;
    const base = `http://127.0.0.1:${port}`;
    const testEmail = `auth_e2e_${Date.now()}@example.com`;
    createdEmails.push(testEmail);

    try {
      // 1. Signup
      const signupRes = await fetch(`${base}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'StrongPassword123!',
          fullName: 'Auth Tester',
        }),
      });
      assert.equal(signupRes.status, 201);
      const signupData = (await signupRes.json()) as any;
      assert.ok(signupData.sessionToken);
      assert.equal(signupData.user.email, testEmail.toLowerCase());

      // Verify password in DB is hashed, never plaintext
      const dbRow = getDb()
        .prepare('SELECT password_hash, password_salt FROM users WHERE LOWER(email) = LOWER(?)')
        .get(testEmail) as { password_hash: string; password_salt: string };
      assert.ok(dbRow);
      assert.notEqual(dbRow.password_hash, 'StrongPassword123!');
      assert.equal(verifyPassword('StrongPassword123!', dbRow.password_hash, dbRow.password_salt), true);

      // 2. Duplicate registration returns 409
      const dupRes = await fetch(`${base}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail.toUpperCase(),
          password: 'StrongPassword123!',
          fullName: 'Duplicate User',
        }),
      });
      assert.equal(dupRes.status, 409);

      // 3. Logout revokes session
      const logoutRes = await fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${signupData.sessionToken}` },
      });
      assert.equal(logoutRes.status, 200);

      // Revoked token cannot access protected route
      const revokedProtected = await fetch(`${base}/api/protected-check`, {
        headers: { Authorization: `Bearer ${signupData.sessionToken}` },
      });
      assert.equal(revokedProtected.status, 401);

      // 4. Wrong password & unregistered email return generic 401
      const wrongPassRes = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
      });
      assert.equal(wrongPassRes.status, 401);
      const wrongPassJson = (await wrongPassRes.json()) as any;

      const missingEmailRes = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'does_not_exist@example.com', password: 'WrongPassword!' }),
      });
      assert.equal(missingEmailRes.status, 401);
      const missingEmailJson = (await missingEmailRes.json()) as any;
      assert.equal(wrongPassJson.error, missingEmailJson.error);

      // 5. Login with newly registered account (mixed case) succeeds with 200 (never 404)
      const loginRes = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ` ${testEmail.toUpperCase()} `,
          password: 'StrongPassword123!',
        }),
      });
      assert.equal(loginRes.status, 200);
      const loginData = (await loginRes.json()) as any;
      assert.ok(loginData.sessionToken);
      assert.equal(loginData.user.id, signupData.user.id);

      // 6. Session persists for /me and protected endpoint
      const meRes = await fetch(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${loginData.sessionToken}` },
      });
      assert.equal(meRes.status, 200);
      const meData = (await meRes.json()) as any;
      assert.equal(meData.user.email, testEmail.toLowerCase());

      const protectedOk = await fetch(`${base}/api/protected-check`, {
        headers: { Authorization: `Bearer ${loginData.sessionToken}` },
      });
      assert.equal(protectedOk.status, 200);

      // 7. Unknown /api route returns 404 JSON, SPA routes return 200 HTML
      const unknownApi = await fetch(`${base}/api/nonexistent`);
      assert.equal(unknownApi.status, 404);
      const spaLogin = await fetch(`${base}/login`);
      assert.equal(spaLogin.status, 200);
      const spaDashboard = await fetch(`${base}/dashboard`);
      assert.equal(spaDashboard.status, 200);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
