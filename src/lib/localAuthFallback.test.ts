import test from 'node:test';
import assert from 'node:assert/strict';
import {
  localAuthFallback,
  createEmptyFinanceBootstrap,
  createEmptyLearningBootstrap,
} from './localAuthFallback.ts';

function installMockWindowStorage() {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => {
        store.set(key, String(val));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
  };
  return store;
}

test('localAuthFallback registers, authenticates, persists session, and rejects invalid attempts', async () => {
  installMockWindowStorage();

  const created = await localAuthFallback.signup({
    email: 'steve@apple.test',
    password: 'StrongPassword123',
    fullName: 'Steve Example',
  });
  assert.equal(created.user.email, 'steve@apple.test');
  assert.equal(created.user.fullName, 'Steve Example');
  assert.ok(created.sessionToken.startsWith('local_'));

  // Session persists across me()
  const meAfterSignup = localAuthFallback.me();
  assert.equal(meAfterSignup.user?.id, created.user.id);

  // Duplicate signup is rejected
  await assert.rejects(
    localAuthFallback.signup({
      email: 'STEVE@apple.test',
      password: 'AnotherPassword123',
      fullName: 'Duplicate User',
    }),
    /already exists/
  );

  // Logout clears session
  localAuthFallback.logout();
  assert.equal(localAuthFallback.me().user, null);

  // Wrong password rejected
  await assert.rejects(
    localAuthFallback.login({
      email: 'steve@apple.test',
      password: 'WrongPassword123',
    }),
    /Invalid email or password/
  );

  // Correct login restores session
  const loggedIn = await localAuthFallback.login({
    email: 'steve@apple.test',
    password: 'StrongPassword123',
  });
  assert.equal(loggedIn.user.id, created.user.id);
  assert.equal(localAuthFallback.me().user?.email, 'steve@apple.test');

  // Guest workspace session works
  localAuthFallback.logout();
  const ws = localAuthFallback.ensureWorkspaceSession('Guest Member');
  assert.equal(ws.user.isWorkspace, true);
  assert.equal(ws.user.fullName, 'Guest Member');
});

test('empty bootstrap helpers provide monochrome categories cleanly', () => {
  const learning = createEmptyLearningBootstrap();
  assert.deepEqual(learning.modules, []);
  assert.deepEqual(learning.lessons, []);

  const finance = createEmptyFinanceBootstrap({
    id: 'usr_1',
    email: 'a@b.com',
    fullName: 'Tester',
    createdAt: new Date().toISOString(),
  });
  assert.ok(finance.categories.length >= 6);
  for (const cat of finance.categories) {
    assert.match(cat.color, /^#[0-9A-F]{6}$/);
  }
});
