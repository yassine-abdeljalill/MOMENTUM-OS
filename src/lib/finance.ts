import type {
  CurrencyCode,
  FinanceBudget,
  FinanceCategory,
  FinanceTransaction,
  PaymentMethod,
  RecurringFrequency,
} from '../types/finance';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Mobile Wallet',
  'Other',
];

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: 'MAD', label: 'MAD — Moroccan Dirham' },
  { code: 'USD', label: 'USD — US Dollar ($)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'GBP', label: 'GBP — British Pound (£)' },
  { code: 'CAD', label: 'CAD — Canadian Dollar (CA$)' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
];

export type DateRangePreset =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_year'
  | 'all_time'
  | 'custom';

export function formatCurrency(amount: number, currency: CurrencyCode = 'MAD'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    return `${currency} ${safe.toFixed(2)}`;
  }
}

export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string,
  now: Date = new Date()
): { startDate?: string; endDate?: string; label: string } {
  const y = now.getFullYear();
  const m = now.getMonth();

  const fmt = (d: Date) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  if (preset === 'this_month') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return { startDate: fmt(start), endDate: fmt(end), label: 'This Month' };
  }
  if (preset === 'last_month') {
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return { startDate: fmt(start), endDate: fmt(end), label: 'Last Month' };
  }
  if (preset === 'last_3_months') {
    const start = new Date(y, m - 2, 1);
    const end = new Date(y, m + 1, 0);
    return { startDate: fmt(start), endDate: fmt(end), label: 'Last 3 Months' };
  }
  if (preset === 'this_year') {
    return { startDate: `${y}-01-01`, endDate: `${y}-12-31`, label: `${y}` };
  }
  if (preset === 'custom') {
    return {
      startDate: customStart || undefined,
      endDate: customEnd || undefined,
      label: 'Custom Range',
    };
  }
  return { startDate: undefined, endDate: undefined, label: 'All Time' };
}

export function filterTransactionsByDateRange(
  transactions: FinanceTransaction[],
  startDate?: string,
  endDate?: string
): FinanceTransaction[] {
  return transactions.filter(t => {
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    return true;
  });
}

export interface FinancialSummary {
  totalBalance: number;
  periodIncome: number;
  periodExpenses: number;
  periodSavings: number;
  savingsRate: number;
}

export function computeFinancialSummary(
  allTransactions: FinanceTransaction[],
  startDate?: string,
  endDate?: string
): FinancialSummary {
  let totalIncomeAll = 0;
  let totalExpenseAll = 0;
  for (const t of allTransactions) {
    if (t.type === 'income') totalIncomeAll += t.amount;
    else totalExpenseAll += t.amount;
  }

  const periodTxs = filterTransactionsByDateRange(allTransactions, startDate, endDate);
  let periodIncome = 0;
  let periodExpenses = 0;
  for (const t of periodTxs) {
    if (t.type === 'income') periodIncome += t.amount;
    else periodExpenses += t.amount;
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const totalBalance = round2(totalIncomeAll - totalExpenseAll);
  const inc = round2(periodIncome);
  const exp = round2(periodExpenses);
  const periodSavings = round2(inc - exp);
  const savingsRate = inc > 0 ? Math.round(((inc - exp) / inc) * 1000) / 10 : 0;

  return {
    totalBalance,
    periodIncome: inc,
    periodExpenses: exp,
    periodSavings,
    savingsRate,
  };
}

export interface BudgetWithProgress extends FinanceBudget {
  spent: number;
  remaining: number;
  rawPercentage: number;
  clampedPercentage: number;
  status: 'healthy' | 'warning' | 'exceeded';
}

export function computeBudgetProgress(
  budgets: FinanceBudget[],
  transactions: FinanceTransaction[],
  month: string
): BudgetWithProgress[] {
  const monthBudgets = budgets.filter(b => b.month === month);
  const monthExpenses = transactions.filter(
    t => t.type === 'expense' && t.date.startsWith(month)
  );

  const spentByCategory = new Map<string, number>();
  for (const t of monthExpenses) {
    const key = t.category.toLowerCase();
    spentByCategory.set(key, (spentByCategory.get(key) || 0) + t.amount);
  }

  return monthBudgets.map(b => {
    const spent = Math.round((spentByCategory.get(b.category.toLowerCase()) || 0) * 100) / 100;
    const remaining = Math.round((b.limitAmount - spent) * 100) / 100;
    const rawPercentage = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 1000) / 10 : 0;
    const clampedPercentage = Math.min(100, Math.max(0, rawPercentage));

    let status: 'healthy' | 'warning' | 'exceeded' = 'healthy';
    if (rawPercentage >= 100) {
      status = 'exceeded';
    } else if (rawPercentage >= b.warningThresholdPercent) {
      status = 'warning';
    }

    return {
      ...b,
      spent,
      remaining,
      rawPercentage,
      clampedPercentage,
      status,
    };
  });
}

export interface MonthlySeriesPoint {
  month: string; // YYYY-MM
  label: string;
  income: number;
  expenses: number;
  savings: number;
}

export function computeMonthlySeries(
  transactions: FinanceTransaction[],
  monthsCount: number = 6,
  referenceDate: Date = new Date()
): MonthlySeriesPoint[] {
  const points: MonthlySeriesPoint[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const key = getMonthKey(d);
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.date.startsWith(key)) {
        if (t.type === 'income') income += t.amount;
        else expenses += t.amount;
      }
    }
    income = Math.round(income * 100) / 100;
    expenses = Math.round(expenses * 100) / 100;
    points.push({
      month: key,
      label: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`,
      income,
      expenses,
      savings: Math.round((income - expenses) * 100) / 100,
    });
  }

  return points;
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

const FALLBACK_CHART_COLORS = [
  '#3B2418',
  '#1E5A99',
  '#3E7B52',
  '#A36116',
  '#B84A44',
  '#8EC5FF',
  '#6E5648',
  '#4D3021',
];

export function computeCategoryBreakdown(
  transactions: FinanceTransaction[],
  categories: FinanceCategory[],
  startDate?: string,
  endDate?: string
): CategoryBreakdownItem[] {
  const filtered = filterTransactionsByDateRange(transactions, startDate, endDate).filter(
    t => t.type === 'expense'
  );

  const colorMap = new Map<string, string>();
  for (const c of categories) {
    colorMap.set(c.name.toLowerCase(), c.color);
  }

  const agg = new Map<string, { amount: number; count: number; displayName: string }>();
  let total = 0;

  for (const t of filtered) {
    total += t.amount;
    const key = t.category.toLowerCase();
    const cur = agg.get(key) || { amount: 0, count: 0, displayName: t.category };
    cur.amount += t.amount;
    cur.count += 1;
    agg.set(key, cur);
  }

  const items = Array.from(agg.entries())
    .map(([key, val], idx) => ({
      category: val.displayName,
      amount: Math.round(val.amount * 100) / 100,
      percentage: total > 0 ? Math.round((val.amount / total) * 1000) / 10 : 0,
      color: colorMap.get(key) || FALLBACK_CHART_COLORS[idx % FALLBACK_CHART_COLORS.length],
      count: val.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  return items;
}

export function computeNextDueDate(dateStr: string, frequency: RecurringFrequency): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (frequency === 'weekly') {
    dt.setUTCDate(dt.getUTCDate() + 7);
  } else if (frequency === 'monthly') {
    dt.setUTCMonth(dt.getUTCMonth() + 1);
    if (dt.getUTCDate() !== d) dt.setUTCDate(0);
  } else if (frequency === 'quarterly') {
    dt.setUTCMonth(dt.getUTCMonth() + 3);
    if (dt.getUTCDate() !== d) dt.setUTCDate(0);
  } else if (frequency === 'yearly') {
    dt.setUTCFullYear(dt.getUTCFullYear() + 1);
  }
  return dt.toISOString().slice(0, 10);
}

export function getDaysUntilDate(dateStr: string, referenceDateStr?: string): number {
  const todayStr = referenceDateStr || new Date().toISOString().slice(0, 10);
  const [y1, m1, d1] = todayStr.split('-').map(Number);
  const [y2, m2, d2] = dateStr.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / 86400000);
}
