import { ApiError, getStoredSessionToken } from './financeApi';
import type {
  BackupPreviewSummary,
  MomentumCompleteBackupV2,
  RestoreStrategy,
} from './backupEngine';

export interface ServerRestoreResponse {
  restored: true;
  strategy: RestoreStrategy;
  preview: BackupPreviewSummary;
  summary: {
    workspaceApplied: number;
    workspaceSkipped: number;
    learningApplied: number;
    learningSkipped: number;
    filesRestored: number;
    financeApplied: number;
    financeSkipped: number;
    warnings: string[];
  };
  syncVersion: number;
}

export class BackupApiError extends ApiError {
  code?: string;

  constructor(message: string, status: number, code?: string, hasJsonPayload = true) {
    super(message, status, hasJsonPayload);
    this.name = 'BackupApiError';
    this.code = code;
  }
}

async function backupRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    let code: string | undefined;
    if (isJson) {
      try {
        const body = (await res.json()) as { error?: string; code?: string };
        if (body?.error) message = body.error;
        if (body?.code) code = body.code;
      } catch {
        // Use fallback message
      }
    }
    throw new BackupApiError(message, res.status, code, isJson);
  }

  if (!isJson) {
    throw new BackupApiError('Unexpected response from backup server.', res.status, undefined, false);
  }

  return res.json() as Promise<T>;
}

export const backupApi = {
  exportComplete(): Promise<MomentumCompleteBackupV2> {
    return backupRequest<MomentumCompleteBackupV2>('/api/backup/export', { method: 'GET' });
  },

  preview(payload: { rawText?: string; backup?: unknown }): Promise<{
    preview: BackupPreviewSummary;
    normalizedBackup: MomentumCompleteBackupV2;
  }> {
    return backupRequest('/api/backup/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  restore(payload: {
    backup: MomentumCompleteBackupV2;
    strategy: RestoreStrategy;
    confirmReplace?: boolean;
  }): Promise<ServerRestoreResponse> {
    return backupRequest<ServerRestoreResponse>('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
