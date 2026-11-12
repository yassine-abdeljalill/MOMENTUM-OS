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

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const authApi = {
  me: () => apiRequest<{ user: AuthUser | null }>('/api/auth/me'),
  login: (payload: { email: string; password: string }) =>
    apiRequest<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  signup: (payload: { email: string; password: string; fullName: string }) =>
    apiRequest<{ user: AuthUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    apiRequest<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),
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
    const res = await fetch('/api/finance/export.csv', { credentials: 'include' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to export CSV.');
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
