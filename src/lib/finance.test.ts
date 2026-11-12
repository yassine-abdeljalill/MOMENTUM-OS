import { test } from 'node:test';
import assert from 'node:assert';
import {
  computeBudgetProgress,
  computeCategoryBreakdown,
  computeFinancialSummary,
  computeMonthlySeries,
  computeNextDueDate,
  formatCurrency,
} from './finance.ts';
import type { FinanceBudget, FinanceCategory, FinanceTransaction } from '../types/finance';

const sampleTxs: FinanceTransaction[] = [
  {
    id: 'tx-1',
    userId: 'u1',
    type: 'income',
    amount: 12000.5,
    date: '2026-11-01',
    category: 'Salary',
    description: 'Monthly stipend',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'tx-2',
    userId: 'u1',
    type: 'expense',
    amount: 3200.25,
    date: '2026-11-03',
    category: 'Housing',
    description: 'Rent',
    paymentMethod: 'Bank Transfer',
    createdAt: '2026-11-03T10:00:00Z',
    updatedAt: '2026-11-03T10:00:00Z',
  },
  {
    id: 'tx-3',
    userId: 'u1',
    type: 'expense',
    amount: 900,
    date: '2026-11-05',
    category: 'Food',
    description: 'Groceries',
    paymentMethod: 'Debit Card',
    createdAt: '2026-11-05T10:00:00Z',
    updatedAt: '2026-11-05T10:00:00Z',
  },
  {
    id: 'tx-4',
    userId: 'u1',
    type: 'expense',
    amount: 500,
    date: '2026-10-20',
    category: 'Transport',
    description: 'Transit pass',
    paymentMethod: 'Cash',
    createdAt: '2026-10-20T10:00:00Z',
    updatedAt: '2026-10-20T10:00:00Z',
  },
];

test('formatCurrency formats MAD and decimal amounts properly', () => {
  const formatted = formatCurrency(1250.5, 'MAD');
  assert.ok(formatted.includes('MAD'));
  assert.ok(formatted.includes('1,250.50'));
});

test('computeFinancialSummary computes total balance and period metrics accurately', () => {
  const summary = computeFinancialSummary(sampleTxs, '2026-11-01', '2026-11-30');
  assert.strictEqual(summary.totalBalance, 7400.25);
  assert.strictEqual(summary.periodIncome, 12000.5);
  assert.strictEqual(summary.periodExpenses, 4100.25);
  assert.strictEqual(summary.periodSavings, 7900.25);
  assert.strictEqual(summary.savingsRate, 65.8);
});

test('computeBudgetProgress flags healthy, warning, and exceeded states', () => {
  const budgets: FinanceBudget[] = [
    {
      id: 'b1',
      userId: 'u1',
      category: 'Food',
      month: '2026-11',
      limitAmount: 1000,
      warningThresholdPercent: 80,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'b2',
      userId: 'u1',
      category: 'Housing',
      month: '2026-11',
      limitAmount: 3000,
      warningThresholdPercent: 80,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'b3',
      userId: 'u1',
      category: 'Education',
      month: '2026-11',
      limitAmount: 1000,
      warningThresholdPercent: 80,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const progress = computeBudgetProgress(budgets, sampleTxs, '2026-11');
  assert.strictEqual(progress.find(b => b.id === 'b1')?.status, 'warning');
  assert.strictEqual(progress.find(b => b.id === 'b2')?.status, 'exceeded');
  assert.strictEqual(progress.find(b => b.id === 'b3')?.status, 'healthy');
});

test('computeCategoryBreakdown ranks top spending categories', () => {
  const cats: FinanceCategory[] = [
    { id: 'c1', userId: 'u1', name: 'Housing', type: 'expense', color: '#3B2418', isDefault: true, createdAt: '' },
    { id: 'c2', userId: 'u1', name: 'Food', type: 'expense', color: '#A36116', isDefault: true, createdAt: '' },
  ];
  const breakdown = computeCategoryBreakdown(sampleTxs, cats, '2026-11-01', '2026-11-30');
  assert.strictEqual(breakdown.length, 2);
  assert.strictEqual(breakdown[0].category, 'Housing');
  assert.strictEqual(breakdown[0].amount, 3200.25);
});

test('computeMonthlySeries and computeNextDueDate handle dates cleanly', () => {
  const series = computeMonthlySeries(sampleTxs, 3, new Date(2026, 10, 12));
  assert.strictEqual(series.length, 3);
  assert.strictEqual(series[1].month, '2026-10');
  assert.strictEqual(series[1].expenses, 500);
  assert.strictEqual(series[2].month, '2026-11');
  assert.strictEqual(series[2].income, 12000.5);

  assert.strictEqual(computeNextDueDate('2026-01-31', 'monthly'), '2026-02-28');
  assert.strictEqual(computeNextDueDate('2026-11-01', 'weekly'), '2026-11-08');
});
