import type { AuthUser, FinanceBootstrapData, LearningBootstrapData } from '../types';

const LOCAL_ACCOUNTS_KEY = 'momentum_local_accounts_v1';
const LOCAL_SESSION_KEY = 'momentum_local_session_v1';

interface LocalAccountRecord {
  id: string;
  email: string;
  fullName: string;
  saltHex: string;
  passwordHashHex: string;
  isWorkspace: boolean;
  createdAt: string;
}

interface LocalSessionRecord {
  userId: string;
  token: string;
  expiresAt: string;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSaltHex(): string {
  const buf = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(buf);
}

async function hashSecret(secret: string, saltHex: string): Promise<string> {
  const input = `${saltHex}:${secret}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return bytesToHex(new Uint8Array(digest));
  }
  // Deterministic fallback if WebCrypto subtle is unavailable in a non-HTTPS context
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function loadAccounts(): LocalAccountRecord[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: LocalAccountRecord[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Storage full or restricted
  }
}

function saveLocalSession(userId: string): string {
  const token = `local_${generateSaltHex()}${generateSaltHex()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const storage = getStorage();
  if (storage) {
    try {
      const session: LocalSessionRecord = { userId, token, expiresAt };
      storage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage restriction
    }
  }
  return token;
}

function clearLocalSession(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // Ignore
  }
}

function toAuthUser(acc: LocalAccountRecord): AuthUser {
  return {
    id: acc.id,
    email: acc.email,
    fullName: acc.fullName,
    isWorkspace: acc.isWorkspace,
    createdAt: acc.createdAt,
  };
}

export const localAuthFallback = {
  async signup(payload: { email: string; password: string; fullName: string }): Promise<{
    user: AuthUser;
    sessionToken: string;
  }> {
    const email = payload.email.trim().toLowerCase();
    const fullName = payload.fullName.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!fullName || fullName.length < 2) {
      throw new Error('Full name must be at least 2 characters.');
    }
    if (!payload.password || payload.password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const accounts = loadAccounts();
    if (accounts.some(a => a.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists.');
    }

    const saltHex = generateSaltHex();
    const passwordHashHex = await hashSecret(payload.password, saltHex);
    const record: LocalAccountRecord = {
      id: `usr_local_${Date.now().toString(36)}`,
      email,
      fullName,
      saltHex,
      passwordHashHex,
      isWorkspace: false,
      createdAt: new Date().toISOString(),
    };
    saveAccounts([...accounts, record]);
    const sessionToken = saveLocalSession(record.id);
    return { user: toAuthUser(record), sessionToken };
  },

  async login(payload: { email: string; password: string }): Promise<{
    user: AuthUser;
    sessionToken: string;
  }> {
    const email = payload.email.trim().toLowerCase();
    if (!email || !payload.password) {
      throw new Error('Please provide your email and password.');
    }
    const accounts = loadAccounts();
    const record = accounts.find(a => !a.isWorkspace && a.email.toLowerCase() === email);
    if (!record) {
      throw new Error('Invalid email or password.');
    }
    const candidateHash = await hashSecret(payload.password, record.saltHex);
    if (candidateHash !== record.passwordHashHex) {
      throw new Error('Invalid email or password.');
    }
    const sessionToken = saveLocalSession(record.id);
    return { user: toAuthUser(record), sessionToken };
  },

  ensureWorkspaceSession(fullName?: string): { user: AuthUser; sessionToken: string } {
    const accounts = loadAccounts();
    let workspace = accounts.find(a => a.isWorkspace);
    if (!workspace) {
      workspace = {
        id: `usr_ws_${Date.now().toString(36)}`,
        email: `workspace_${Date.now().toString(36)}@workspace.momentum`,
        fullName: (fullName || '').trim() || 'MOMENTUM User',
        saltHex: '',
        passwordHashHex: '',
        isWorkspace: true,
        createdAt: new Date().toISOString(),
      };
      saveAccounts([...accounts, workspace]);
    }
    const sessionToken = saveLocalSession(workspace.id);
    return { user: toAuthUser(workspace), sessionToken };
  },

  me(): { user: AuthUser | null } {
    const storage = getStorage();
    if (!storage) return { user: null };
    try {
      const raw = storage.getItem(LOCAL_SESSION_KEY);
      if (!raw) return { user: null };
      const session = JSON.parse(raw) as LocalSessionRecord;
      if (!session?.userId || new Date(session.expiresAt).getTime() <= Date.now()) {
        clearLocalSession();
        return { user: null };
      }
      const accounts = loadAccounts();
      const record = accounts.find(a => a.id === session.userId);
      if (!record) {
        clearLocalSession();
        return { user: null };
      }
      return { user: toAuthUser(record) };
    } catch {
      return { user: null };
    }
  },

  logout(): { success: boolean } {
    clearLocalSession();
    return { success: true };
  },
};

export function createEmptyLearningBootstrap(): LearningBootstrapData {
  return {
    modules: [],
    lessons: [],
    notes: [],
    resources: [],
    tasks: [],
    studySessions: [],
  };
}

export function createEmptyFinanceBootstrap(user: AuthUser): FinanceBootstrapData {
  const now = new Date().toISOString();
  return {
    settings: {
      userId: user.id,
      currency: 'MAD',
      locale: 'en-MA',
      updatedAt: now,
    },
    categories: [
      { id: 'cat-food', userId: user.id, name: 'Food', type: 'expense', color: '#1D1D1F', isDefault: true, createdAt: now },
      { id: 'cat-transport', userId: user.id, name: 'Transport', type: 'expense', color: '#3A3A3C', isDefault: true, createdAt: now },
      { id: 'cat-edu', userId: user.id, name: 'Education', type: 'expense', color: '#48484A', isDefault: true, createdAt: now },
      { id: 'cat-other', userId: user.id, name: 'Other', type: 'expense', color: '#8E8E93', isDefault: true, createdAt: now },
      { id: 'cat-salary', userId: user.id, name: 'Salary', type: 'income', color: '#1D1D1F', isDefault: true, createdAt: now },
      { id: 'cat-freelance', userId: user.id, name: 'Freelance', type: 'income', color: '#6E6E73', isDefault: true, createdAt: now },
    ],
    transactions: [],
    budgets: [],
    savingsGoals: [],
    recurringPayments: [],
  };
}
