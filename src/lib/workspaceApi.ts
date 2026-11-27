import { ApiError, getStoredSessionToken, isMissingApiEndpointError } from './financeApi';
import {
  createEmptyOutbox,
  type WorkspaceBootstrapResponse,
  type WorkspaceMigrateRequest,
  type WorkspaceSyncBatchRequest,
  type WorkspaceSyncOutbox,
  type WorkspaceSyncResponse,
} from './syncEngine';

const OUTBOX_KEY_PREFIX = 'momentum_sync_outbox_v1_';
const MIGRATED_USERS_KEY = 'momentum_migrated_users_v1';
const DEVICE_ID_KEY = 'momentum_device_install_id_v1';
const LOCAL_CUSTOMIZED_KEY = 'momentum_local_customized_v1';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function buildWorkspaceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function workspaceRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      ...buildWorkspaceHeaders(),
      ...(options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)
        ? (options.headers as Record<string, string>)
        : {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const serverMessage =
      data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : '';
    throw new ApiError(
      serverMessage || `Request failed (${res.status})`,
      res.status,
      Boolean(serverMessage)
    );
  }
  return (data ?? {}) as T;
}

export const workspaceApi = {
  bootstrap: (sinceVersion = 0) =>
    workspaceRequest<WorkspaceBootstrapResponse>(
      `/api/workspace/bootstrap${sinceVersion > 0 ? `?sinceVersion=${sinceVersion}` : ''}`
    ),

  sync: (payload: WorkspaceSyncBatchRequest, options: { keepalive?: boolean } = {}) =>
    workspaceRequest<WorkspaceSyncResponse>('/api/workspace/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...(options.keepalive ? { keepalive: true } : {}),
    }),

  migrate: (payload: WorkspaceMigrateRequest) =>
    workspaceRequest<WorkspaceSyncResponse>('/api/workspace/migrate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  clear: () =>
    workspaceRequest<WorkspaceSyncResponse>('/api/workspace/clear', {
      method: 'POST',
    }),
};

export function shouldUseLocalOnlyMode(): boolean {
  const token = getStoredSessionToken();
  return Boolean(token && token.startsWith('local_'));
}

export function isWorkspaceApiUnavailableError(err: unknown): boolean {
  return isMissingApiEndpointError(err);
}

export function getDeviceInstallId(): string {
  const storage = getStorage();
  if (!storage) return 'ssr-device';
  try {
    let existing = storage.getItem(DEVICE_ID_KEY);
    if (!existing) {
      existing =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `dev_${crypto.randomUUID()}`
          : `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      storage.setItem(DEVICE_ID_KEY, existing);
    }
    return existing;
  } catch {
    return 'ephemeral-device';
  }
}

export function loadSyncOutbox(userId: string): WorkspaceSyncOutbox {
  const storage = getStorage();
  if (!storage || !userId) return createEmptyOutbox();
  try {
    const raw = storage.getItem(`${OUTBOX_KEY_PREFIX}${userId}`);
    if (!raw) return createEmptyOutbox();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.collections) {
      return {
        lastSyncVersion: Number(parsed.lastSyncVersion || 0),
        profile: parsed.profile || null,
        preferences: parsed.preferences || null,
        collections: parsed.collections || {},
      };
    }
  } catch {
    // Ignore corrupt outbox
  }
  return createEmptyOutbox();
}

export function saveSyncOutbox(userId: string, outbox: WorkspaceSyncOutbox): void {
  const storage = getStorage();
  if (!storage || !userId) return;
  try {
    storage.setItem(`${OUTBOX_KEY_PREFIX}${userId}`, JSON.stringify(outbox));
  } catch {
    // Storage quota exceeded or restricted
  }
}

export function clearSyncOutbox(userId: string): void {
  const storage = getStorage();
  if (!storage || !userId) return;
  try {
    storage.removeItem(`${OUTBOX_KEY_PREFIX}${userId}`);
  } catch {
    // Ignore
  }
}

export function hasUserMigratedLocal(userId: string): boolean {
  const storage = getStorage();
  if (!storage || !userId) return false;
  try {
    const raw = storage.getItem(MIGRATED_USERS_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, string>;
    return Boolean(map && map[userId]);
  } catch {
    return false;
  }
}

export function markUserMigratedLocal(userId: string, importKey: string): void {
  const storage = getStorage();
  if (!storage || !userId) return;
  try {
    const raw = storage.getItem(MIGRATED_USERS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[userId] = importKey;
    storage.setItem(MIGRATED_USERS_KEY, JSON.stringify(map));
  } catch {
    // Ignore
  }
}

export function getLocalCustomizationFlag(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    return storage.getItem(LOCAL_CUSTOMIZED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markLocalCustomized(value = true): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    if (value) {
      storage.setItem(LOCAL_CUSTOMIZED_KEY, '1');
    } else {
      storage.removeItem(LOCAL_CUSTOMIZED_KEY);
    }
  } catch {
    // Ignore
  }
}

export function computeContentHashKey(raw: string): string {
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
