export type CurrencyCode = 'MAD' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'CHF' | 'AED' | 'SAR';

export type PaymentMethod =
  | 'Cash'
  | 'Debit Card'
  | 'Credit Card'
  | 'Bank Transfer'
  | 'Mobile Wallet'
  | 'Other';

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type RecurringKind =
  | 'subscription'
  | 'rent'
  | 'internet_phone'
  | 'recurring_income'
  | 'custom';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isWorkspace?: boolean;
  createdAt: string;
}

export interface FinanceSettings {
  userId: string;
  currency: CurrencyCode;
  locale: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  recurringPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBudget {
  id: string;
  userId: string;
  category: string;
  month: string; // YYYY-MM
  limitAmount: number;
  warningThresholdPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSavingsContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface FinanceSavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  notes: string;
  contributions: FinanceSavingsContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceRecurringPayment {
  id: string;
  userId: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  kind: RecurringKind;
  nextDueDate: string; // YYYY-MM-DD
  active: boolean;
  lastPaidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBootstrapData {
  settings: FinanceSettings;
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  budgets: FinanceBudget[];
  savingsGoals: FinanceSavingsGoal[];
  recurringPayments: FinanceRecurringPayment[];
}
