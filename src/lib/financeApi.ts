import { localAuthFallback } from './localAuthFallback';
import type {
  AuthUser,
  CurrencyCode,
  FinanceBootstrapData,
  FinanceBudget,
  FinanceCategory,
  FinanceRecurringPayment,
  FinanceSavingsGoal,
  FinanceSettings,
  FinanceTransaction,
  PaymentMethod,
  RecurringFrequency,
  RecurringKind,
} from '../types/finance';

const SESSION_TOKEN_KEY = 'momentum_session_token';

export class ApiError extends Error {
  status: number;
  hasJsonPayload: boolean;
  constructor(message: string, status: number, hasJsonPayload = true) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.hasJsonPayload = hasJsonPayload;
  }
}

export function isMissingApiEndpointError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404 && !err.hasJsonPayload;
}

export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionToken(token: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    // Storage restricted
  }
}

function buildAuthHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredSessionToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    Object.assign(headers, extra);
  }
  return headers;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: buildAuthHeaders(options.headers),
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

let inFlightWorkspacePromise: Promise<{ user: AuthUser }> | null = null;

export const authApi = {
  me: async () => {
    try {
      const res = await apiRequest<{ user: AuthUser | null }>('/api/auth/me');
      if (!res.user) {
        const local = localAuthFallback.me();
        if (local.user && getStoredSessionToken()?.startsWith('local_')) {
          return local;
        }
        setStoredSessionToken(null);
      }
      return res;
    } catch (err) {
      if (isMissingApiEndpointError(err)) {
        return localAuthFallback.me();
      }
      throw err;
    }
  },
  ensureWorkspaceSession: (fullName?: string) => {
    if (!inFlightWorkspacePromise) {
      inFlightWorkspacePromise = apiRequest<{ user: AuthUser; sessionToken?: string }>(
        '/api/auth/workspace-session',
        {
          method: 'POST',
          body: JSON.stringify({ fullName }),
        }
      )
        .then(res => {
          if (res.sessionToken) {
            setStoredSessionToken(res.sessionToken);
          }
          return { user: res.user };
        })
        .catch(err => {
          if (isMissingApiEndpointError(err)) {
            const local = localAuthFallback.ensureWorkspaceSession(fullName);
            setStoredSessionToken(local.sessionToken);
            return { user: local.user };
          }
          throw err;
        })
        .finally(() => {
          inFlightWorkspacePromise = null;
        });
    }
    return inFlightWorkspacePromise;
  },
  login: async (payload: { email: string; password: string }) => {
    try {
      const res = await apiRequest<{ user: AuthUser; sessionToken?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.sessionToken) {
        setStoredSessionToken(res.sessionToken);
      }
      return { user: res.user };
    } catch (err) {
      if (isMissingApiEndpointError(err)) {
        try {
          const local = await localAuthFallback.login(payload);
          setStoredSessionToken(local.sessionToken);
          return { user: local.user };
        } catch (localErr: any) {
          throw new ApiError(localErr?.message || 'Invalid email or password.', 401);
        }
      }
      throw err;
    }
  },
  signup: async (payload: { email: string; password: string; fullName: string }) => {
    try {
      const res = await apiRequest<{ user: AuthUser; sessionToken?: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.sessionToken) {
        setStoredSessionToken(res.sessionToken);
      }
      return { user: res.user };
    } catch (err) {
      if (isMissingApiEndpointError(err)) {
        try {
          const local = await localAuthFallback.signup(payload);
          setStoredSessionToken(local.sessionToken);
          return { user: local.user };
        } catch (localErr: any) {
          const msg = localErr?.message || 'Unable to create account.';
          throw new ApiError(msg, msg.includes('already exists') ? 409 : 400);
        }
      }
      throw err;
    }
  },
  logout: async () => {
    try {
      return await apiRequest<{ success: boolean }>('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      if (isMissingApiEndpointError(err)) {
        return localAuthFallback.logout();
      }
      throw err;
    } finally {
      localAuthFallback.logout();
      setStoredSessionToken(null);
    }
  },
  clearToken: () => setStoredSessionToken(null),
};

export const financeApi = {
  bootstrap: () => apiRequest<FinanceBootstrapData>('/api/finance/bootstrap'),

  updateCurrency: (currency: CurrencyCode) =>
    apiRequest<{ settings: FinanceSettings }>('/api/finance/settings', {
      method: 'PATCH',
      body: JSON.stringify({ currency }),
    }),

  createCategory: (payload: { name: string; type: 'income' | 'expense' | 'both'; color?: string }) =>
    apiRequest<{ category: FinanceCategory }>('/api/finance/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/finance/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createTransaction: (payload: {
    type: 'income' | 'expense';
    amount: number;
    date: string;
    category: string;
    description: string;
    paymentMethod: PaymentMethod;
  }) =>
    apiRequest<{ transaction: FinanceTransaction }>('/api/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTransaction: (
    id: string,
    payload: Partial<{
      type: 'income' | 'expense';
      amount: number;
      date: string;
      category: string;
      description: string;
      paymentMethod: PaymentMethod;
    }>
  ) =>
    apiRequest<{ transaction: FinanceTransaction }>(`/api/finance/transactions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteTransaction: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/finance/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createBudget: (payload: {
    category: string;
    month: string;
    limitAmount: number;
    warningThresholdPercent?: number;
  }) =>
    apiRequest<{ budget: FinanceBudget }>('/api/finance/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateBudget: (
    id: string,
    payload: Partial<{
      category: string;
      month: string;
      limitAmount: number;
      warningThresholdPercent: number;
    }>
  ) =>
    apiRequest<{ budget: FinanceBudget }>(`/api/finance/budgets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteBudget: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/finance/budgets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createSavingsGoal: (payload: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline: string;
    category?: string;
    notes?: string;
  }) =>
    apiRequest<{ savingsGoal: FinanceSavingsGoal }>('/api/finance/savings-goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSavingsGoal: (
    id: string,
    payload: Partial<{
      name: string;
      targetAmount: number;
      currentAmount: number;
      deadline: string;
      category: string;
      notes: string;
    }>
  ) =>
    apiRequest<{ savingsGoal: FinanceSavingsGoal }>(`/api/finance/savings-goals/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteSavingsGoal: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/finance/savings-goals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  addContribution: (
    goalId: string,
    payload: {
      amount: number;
      date: string;
      note?: string;
      alsoRecordExpense?: boolean;
    }
  ) =>
    apiRequest<{ savingsGoal: FinanceSavingsGoal; createdTransaction: FinanceTransaction | null }>(
      `/api/finance/savings-goals/${encodeURIComponent(goalId)}/contributions`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  createRecurring: (payload: {
    title: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    paymentMethod: PaymentMethod;
    frequency: RecurringFrequency;
    kind: RecurringKind;
    nextDueDate: string;
    active?: boolean;
  }) =>
    apiRequest<{ recurringPayment: FinanceRecurringPayment }>('/api/finance/recurring', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRecurring: (
    id: string,
    payload: Partial<{
      title: string;
      type: 'income' | 'expense';
      amount: number;
      category: string;
      paymentMethod: PaymentMethod;
      frequency: RecurringFrequency;
      kind: RecurringKind;
      nextDueDate: string;
      active: boolean;
    }>
  ) =>
    apiRequest<{ recurringPayment: FinanceRecurringPayment }>(
      `/api/finance/recurring/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  deleteRecurring: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/finance/recurring/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  payRecurring: (id: string) =>
    apiRequest<{ transaction: FinanceTransaction; recurringPayment: FinanceRecurringPayment }>(
      `/api/finance/recurring/${encodeURIComponent(id)}/pay`,
      {
        method: 'POST',
      }
    ),

  downloadCsv: async () => {
    const token = getStoredSessionToken();
    const res = await fetch('/api/finance/export.csv', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Failed to export CSV.', res.status);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum_finance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
