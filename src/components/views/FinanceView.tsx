import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  Download,
  LayoutGrid,
  Loader2,
  PiggyBank,
  Plus,
  ReceiptText,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../lib/context';
import {
  CURRENCY_OPTIONS,
  computeBudgetProgress,
  computeFinancialSummary,
  computeMonthlySeries,
  filterTransactionsByDateRange,
  getDateRangeBounds,
  getMonthKey,
  type DateRangePreset,
} from '../../lib/finance';
import { financeApi } from '../../lib/financeApi';
import type {
  CurrencyCode,
  FinanceBootstrapData,
  FinanceBudget,
  FinanceRecurringPayment,
  FinanceSavingsGoal,
  FinanceTransaction,
} from '../../types/finance';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { FinanceAuthGate } from '../finance/FinanceAuthGate';
import { FinanceOverviewTab } from '../finance/FinanceOverviewTab';
import { FinanceTransactionsTab } from '../finance/FinanceTransactionsTab';
import { FinanceBudgetsTab } from '../finance/FinanceBudgetsTab';
import { FinanceSavingsTab } from '../finance/FinanceSavingsTab';
import { FinanceRecurringTab } from '../finance/FinanceRecurringTab';
import { FinanceAnalyticsTab } from '../finance/FinanceAnalyticsTab';
import {
  BudgetModal,
  CategoryManagerModal,
  ConfirmDeleteModal,
  ContributionModal,
  RecurringModal,
  SavingsGoalModal,
  TransactionModal,
} from '../finance/FinanceModals';

type FinanceSubTab = 'overview' | 'transactions' | 'budgets' | 'savings' | 'recurring' | 'analytics';

type DeleteTarget =
  | { kind: 'transaction'; item: FinanceTransaction }
  | { kind: 'budget'; item: FinanceBudget }
  | { kind: 'savings_goal'; item: FinanceSavingsGoal }
  | { kind: 'recurring'; item: FinanceRecurringPayment }
  | null;

export const FinanceView: React.FC = () => {
  const { authUser, authChecked, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<FinanceSubTab>('overview');
  const [data, setData] = useState<FinanceBootstrapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Filters
  const [rangePreset, setRangePreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(getMonthKey());

  // Modals State
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<FinanceBudget | null>(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinanceSavingsGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<FinanceSavingsGoal | null>(null);

  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<FinanceRecurringPayment | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFinanceData = useCallback(async () => {
    if (!authUser) {
      setData(null);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const boot = await financeApi.bootstrap();
      setData(boot);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load financial data.');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authChecked && authUser) {
      loadFinanceData();
    } else if (authChecked && !authUser) {
      setData(null);
    }
  }, [authChecked, authUser, loadFinanceData]);

  const currency: CurrencyCode = data?.settings.currency || 'MAD';
  const rangeBounds = useMemo(
    () => getDateRangeBounds(rangePreset, customStart, customEnd),
    [rangePreset, customStart, customEnd]
  );

  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    return filterTransactionsByDateRange(data.transactions, rangeBounds.startDate, rangeBounds.endDate);
  }, [data, rangeBounds]);

  const summary = useMemo(() => {
    if (!data) {
      return { totalBalance: 0, periodIncome: 0, periodExpenses: 0, periodSavings: 0, savingsRate: 0 };
    }
    return computeFinancialSummary(data.transactions, rangeBounds.startDate, rangeBounds.endDate);
  }, [data, rangeBounds]);

  const monthlySeries = useMemo(() => {
    if (!data) return [];
    return computeMonthlySeries(data.transactions, 6);
  }, [data]);

  const budgetProgress = useMemo(() => {
    if (!data) return [];
    return computeBudgetProgress(data.budgets, data.transactions, budgetMonth);
  }, [data, budgetMonth]);

  const activeUpcomingPayments = useMemo(() => {
    if (!data) return [];
    return data.recurringPayments
      .filter(r => r.active)
      .slice()
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
  }, [data]);

  // Handlers
  const handleCurrencyChange = async (nextCurrency: CurrencyCode) => {
    if (!data) return;
    try {
      const { settings } = await financeApi.updateCurrency(nextCurrency);
      setData(prev => (prev ? { ...prev, settings } : prev));
      showToast(`Display currency updated to ${nextCurrency}.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update currency.', 'error');
    }
  };

  const handleSaveTransaction = async (payload: any) => {
    if (editingTx) {
      const { transaction } = await financeApi.updateTransaction(editingTx.id, payload);
      setData(prev =>
        prev
          ? {
              ...prev,
              transactions: prev.transactions
                .map(t => (t.id === transaction.id ? transaction : t))
                .sort((a, b) => b.date.localeCompare(a.date)),
            }
          : prev
      );
      showToast('Transaction updated.', 'success');
    } else {
      const { transaction } = await financeApi.createTransaction(payload);
      setData(prev =>
        prev
          ? {
              ...prev,
              transactions: [transaction, ...prev.transactions].sort((a, b) =>
                b.date.localeCompare(a.date)
              ),
            }
          : prev
      );
      showToast('Transaction recorded.', 'success');
    }
    setEditingTx(null);
  };

  const handleCreateCategory = async (
    name: string,
    type: 'income' | 'expense' | 'both',
    color?: string
  ) => {
    const { category } = await financeApi.createCategory({ name, type, color });
    setData(prev => (prev ? { ...prev, categories: [...prev.categories, category] } : prev));
    showToast(`Category "${category.name}" added.`, 'success');
    return category;
  };

  const handleDeleteCategory = async (id: string) => {
    await financeApi.deleteCategory(id);
    setData(prev =>
      prev ? { ...prev, categories: prev.categories.filter(c => c.id !== id) } : prev
    );
    showToast('Custom category removed.', 'info');
  };

  const handleSaveBudget = async (payload: any) => {
    if (editingBudget) {
      const { budget } = await financeApi.updateBudget(editingBudget.id, payload);
      setData(prev =>
        prev
          ? { ...prev, budgets: prev.budgets.map(b => (b.id === budget.id ? budget : b)) }
          : prev
      );
      showToast('Budget updated.', 'success');
    } else {
      const { budget } = await financeApi.createBudget(payload);
      setData(prev => (prev ? { ...prev, budgets: [...prev.budgets, budget] } : prev));
      setBudgetMonth(budget.month);
      showToast('Monthly budget created.', 'success');
    }
    setEditingBudget(null);
  };

  const handleSaveGoal = async (payload: any) => {
    if (editingGoal) {
      const { savingsGoal } = await financeApi.updateSavingsGoal(editingGoal.id, payload);
      setData(prev =>
        prev
          ? {
              ...prev,
              savingsGoals: prev.savingsGoals.map(g => (g.id === savingsGoal.id ? savingsGoal : g)),
            }
          : prev
      );
      showToast('Savings goal updated.', 'success');
    } else {
      const { savingsGoal } = await financeApi.createSavingsGoal(payload);
      setData(prev =>
        prev ? { ...prev, savingsGoals: [...prev.savingsGoals, savingsGoal] } : prev
      );
      showToast('Savings goal created.', 'success');
    }
    setEditingGoal(null);
  };

  const handleContributeGoal = async (payload: {
    amount: number;
    date: string;
    note: string;
    alsoRecordExpense: boolean;
  }) => {
    if (!contributingGoal) return;
    const { savingsGoal, createdTransaction } = await financeApi.addContribution(
      contributingGoal.id,
      payload
    );
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        savingsGoals: prev.savingsGoals.map(g => (g.id === savingsGoal.id ? savingsGoal : g)),
        transactions: createdTransaction
          ? [createdTransaction, ...prev.transactions].sort((a, b) => b.date.localeCompare(a.date))
          : prev.transactions,
      };
    });
    showToast('Contribution added to savings goal.', 'success');
    setContributingGoal(null);
  };

  const handleSaveRecurring = async (payload: any) => {
    if (editingRecurring) {
      const { recurringPayment } = await financeApi.updateRecurring(editingRecurring.id, payload);
      setData(prev =>
        prev
          ? {
              ...prev,
              recurringPayments: prev.recurringPayments
                .map(r => (r.id === recurringPayment.id ? recurringPayment : r))
                .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
            }
          : prev
      );
      showToast('Recurring schedule updated.', 'success');
    } else {
      const { recurringPayment } = await financeApi.createRecurring(payload);
      setData(prev =>
        prev
          ? {
              ...prev,
              recurringPayments: [...prev.recurringPayments, recurringPayment].sort((a, b) =>
                a.nextDueDate.localeCompare(b.nextDueDate)
              ),
            }
          : prev
      );
      showToast('Recurring schedule added.', 'success');
    }
    setEditingRecurring(null);
  };

  const handlePayRecurring = async (id: string) => {
    try {
      const { transaction, recurringPayment } = await financeApi.payRecurring(id);
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: [transaction, ...prev.transactions].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
          recurringPayments: prev.recurringPayments
            .map(r => (r.id === recurringPayment.id ? recurringPayment : r))
            .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate)),
        };
      });
      showToast(`Recorded "${recurringPayment.title}" & advanced next due date.`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to record recurring payment.', 'error');
    }
  };

  const handleToggleRecurringActive = async (rec: FinanceRecurringPayment) => {
    try {
      const { recurringPayment } = await financeApi.updateRecurring(rec.id, {
        active: !rec.active,
      });
      setData(prev =>
        prev
          ? {
              ...prev,
              recurringPayments: prev.recurringPayments.map(r =>
                r.id === recurringPayment.id ? recurringPayment : r
              ),
            }
          : prev
      );
      showToast(
        recurringPayment.active ? 'Recurring schedule resumed.' : 'Recurring schedule paused.',
        'info'
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to update schedule.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'transaction') {
        await financeApi.deleteTransaction(deleteTarget.item.id);
        setData(prev =>
          prev
            ? { ...prev, transactions: prev.transactions.filter(t => t.id !== deleteTarget.item.id) }
            : prev
        );
        showToast('Transaction deleted.', 'info');
      } else if (deleteTarget.kind === 'budget') {
        await financeApi.deleteBudget(deleteTarget.item.id);
        setData(prev =>
          prev ? { ...prev, budgets: prev.budgets.filter(b => b.id !== deleteTarget.item.id) } : prev
        );
        showToast('Budget deleted.', 'info');
      } else if (deleteTarget.kind === 'savings_goal') {
        await financeApi.deleteSavingsGoal(deleteTarget.item.id);
        setData(prev =>
          prev
            ? { ...prev, savingsGoals: prev.savingsGoals.filter(g => g.id !== deleteTarget.item.id) }
            : prev
        );
        showToast('Savings goal deleted.', 'info');
      } else if (deleteTarget.kind === 'recurring') {
        await financeApi.deleteRecurring(deleteTarget.item.id);
        setData(prev =>
          prev
            ? {
                ...prev,
                recurringPayments: prev.recurringPayments.filter(
                  r => r.id !== deleteTarget.item.id
                ),
              }
            : prev
        );
        showToast('Recurring item deleted.', 'info');
      }
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(err?.message || 'Delete failed.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      await financeApi.downloadCsv();
      showToast('Finance transactions exported to CSV.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export CSV.', 'error');
    }
  };

  if (!authChecked) {
    return (
      <div className="max-w-7xl mx-auto py-20 flex flex-col items-center justify-center text-[#6E5648] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E5A99]" />
        <span className="text-xs font-mono">Verifying secure session...</span>
      </div>
    );
  }

  if (!authUser) {
    return <FinanceAuthGate />;
  }

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto py-20 flex flex-col items-center justify-center text-[#6E5648] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1E5A99]" />
        <span className="text-xs font-mono">Loading private financial center...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-[#FAF5ED] border border-[#B84A44]/40 text-center space-y-3">
        <p className="text-sm font-bold text-[#9E3530]">Unable to load financial data</p>
        <p className="text-xs text-[#6E5648]">{loadError}</p>
        <button
          onClick={loadFinanceData}
          className="btn-press px-4 py-2 rounded-lg bg-[#8EC5FF] text-[#3B2418] text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const deleteDescription =
    deleteTarget?.kind === 'transaction'
      ? `Delete "${deleteTarget.item.description || deleteTarget.item.category}" (${deleteTarget.item.date})? This will permanently adjust your balance.`
      : deleteTarget?.kind === 'budget'
      ? `Delete the ${deleteTarget.item.category} budget for ${deleteTarget.item.month}?`
      : deleteTarget?.kind === 'savings_goal'
      ? `Delete savings goal "${deleteTarget.item.name}" and its contribution history?`
      : deleteTarget?.kind === 'recurring'
      ? `Delete recurring schedule "${deleteTarget.item.title}"? Previously recorded transactions will remain.`
      : '';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Finance Command Header */}
      <div className="p-5 md:p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#1E5A99]" />
              <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
                Finance Management Center
              </h1>
            </div>
            <p className="text-xs text-[#6E5648]">
              Track cash flow, enforce category budgets, grow savings goals, and manage recurring obligations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Currency Selector */}
            <div className="flex items-center gap-1.5 bg-[#F2E8DA] px-2.5 py-1.5 rounded-xl border border-[#D6C6B2] text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#1E5A99]" />
              <select
                value={currency}
                onChange={e => handleCurrencyChange(e.target.value as CurrencyCode)}
                aria-label="Preferred currency"
                className="bg-transparent font-mono font-bold text-[#3B2418] focus:outline-hidden cursor-pointer"
              >
                {CURRENCY_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <select
              value={rangePreset}
              onChange={e => setRangePreset(e.target.value as DateRangePreset)}
              aria-label="Date range filter"
              className="px-3 py-1.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>

            <button
              onClick={handleExportCsv}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2E8DA] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418]"
            >
              <Download className="w-3.5 h-3.5 text-[#1E5A99]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              className="btn-press flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Pickers */}
        <AnimatePresence>
          {rangePreset === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#D6C6B2] text-xs">
                <span className="font-semibold text-[#6E5648]">From:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418]"
                />
                <span className="font-semibold text-[#6E5648]">To:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap gap-1 bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2] text-xs">
          {(
            [
              { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
              { id: 'transactions', label: 'Transactions', icon: ReceiptText },
              { id: 'budgets', label: 'Budgets', icon: Wallet },
              { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
              { id: 'recurring', label: 'Recurring', icon: CalendarClock },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ] as const
          ).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-colors btn-press ${
                  isActive ? 'text-[#3B2418]' : 'text-[#6E5648] hover:text-[#3B2418]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="finance-subtab-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[#8EC5FF] shadow-xs"
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: MOMENTUM_EASE }}
        >
          {activeTab === 'overview' && (
            <FinanceOverviewTab
              currency={currency}
              rangeLabel={rangeBounds.label}
              summary={summary}
              monthlySeries={monthlySeries}
              recentTransactions={filteredTransactions}
              budgetProgress={budgetProgress}
              upcomingPayments={activeUpcomingPayments}
              onAddTransaction={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              onNavigateTab={t => setActiveTab(t)}
              onPayRecurring={handlePayRecurring}
            />
          )}

          {activeTab === 'transactions' && (
            <FinanceTransactionsTab
              transactions={filteredTransactions}
              categories={data.categories}
              currency={currency}
              onAdd={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              onEdit={tx => {
                setEditingTx(tx);
                setTxModalOpen(true);
              }}
              onDelete={tx => setDeleteTarget({ kind: 'transaction', item: tx })}
              onManageCategories={() => setCategoryModalOpen(true)}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'budgets' && (
            <FinanceBudgetsTab
              selectedMonth={budgetMonth}
              onChangeMonth={setBudgetMonth}
              budgets={budgetProgress}
              currency={currency}
              onAdd={() => {
                setEditingBudget(null);
                setBudgetModalOpen(true);
              }}
              onEdit={b => {
                setEditingBudget(b);
                setBudgetModalOpen(true);
              }}
              onDelete={b => setDeleteTarget({ kind: 'budget', item: b })}
            />
          )}

          {activeTab === 'savings' && (
            <FinanceSavingsTab
              goals={data.savingsGoals}
              currency={currency}
              onAddGoal={() => {
                setEditingGoal(null);
                setGoalModalOpen(true);
              }}
              onEditGoal={g => {
                setEditingGoal(g);
                setGoalModalOpen(true);
              }}
              onDeleteGoal={g => setDeleteTarget({ kind: 'savings_goal', item: g })}
              onContributeGoal={g => setContributingGoal(g)}
            />
          )}

          {activeTab === 'recurring' && (
            <FinanceRecurringTab
              recurringPayments={data.recurringPayments}
              currency={currency}
              onAdd={() => {
                setEditingRecurring(null);
                setRecurringModalOpen(true);
              }}
              onEdit={r => {
                setEditingRecurring(r);
                setRecurringModalOpen(true);
              }}
              onDelete={r => setDeleteTarget({ kind: 'recurring', item: r })}
              onPayNow={handlePayRecurring}
              onToggleActive={handleToggleRecurringActive}
            />
          )}

          {activeTab === 'analytics' && (
            <FinanceAnalyticsTab
              transactions={data.transactions}
              budgets={data.budgets}
              categories={data.categories}
              currency={currency}
              rangeStart={rangeBounds.startDate}
              rangeEnd={rangeBounds.endDate}
              rangeLabel={rangeBounds.label}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        editing={editingTx}
        categories={data.categories}
        currency={currency}
        onCreateCategory={(name, type) => handleCreateCategory(name, type)}
        onSave={handleSaveTransaction}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
      />

      <CategoryManagerModal
        isOpen={categoryModalOpen}
        categories={data.categories}
        onCreate={async (name, type, color) => {
          await handleCreateCategory(name, type, color);
        }}
        onDelete={handleDeleteCategory}
        onClose={() => setCategoryModalOpen(false)}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        editing={editingBudget}
        defaultMonth={budgetMonth}
        categories={data.categories}
        currency={currency}
        onSave={handleSaveBudget}
        onClose={() => {
          setBudgetModalOpen(false);
          setEditingBudget(null);
        }}
      />

      <SavingsGoalModal
        isOpen={goalModalOpen}
        editing={editingGoal}
        currency={currency}
        onSave={handleSaveGoal}
        onClose={() => {
          setGoalModalOpen(false);
          setEditingGoal(null);
        }}
      />

      <ContributionModal
        goal={contributingGoal}
        currency={currency}
        onContribute={handleContributeGoal}
        onClose={() => setContributingGoal(null)}
      />

      <RecurringModal
        isOpen={recurringModalOpen}
        editing={editingRecurring}
        categories={data.categories}
        currency={currency}
        onSave={handleSaveRecurring}
        onClose={() => {
          setRecurringModalOpen(false);
          setEditingRecurring(null);
        }}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Confirm Deletion"
        description={deleteDescription}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
