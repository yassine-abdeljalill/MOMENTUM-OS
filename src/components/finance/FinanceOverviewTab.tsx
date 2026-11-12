import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Check,
  PieChart,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AnimatedNumber,
  AnimatedProgressBar,
  MOMENTUM_EASE,
  StaggerContainer,
  StaggerItem,
} from '../common/MotionPrimitives';
import {
  formatCurrency,
  getDaysUntilDate,
  type BudgetWithProgress,
  type FinancialSummary,
  type MonthlySeriesPoint,
} from '../../lib/finance';
import type {
  CurrencyCode,
  FinanceRecurringPayment,
  FinanceTransaction,
} from '../../types/finance';

interface Props {
  currency: CurrencyCode;
  rangeLabel: string;
  summary: FinancialSummary;
  monthlySeries: MonthlySeriesPoint[];
  recentTransactions: FinanceTransaction[];
  budgetProgress: BudgetWithProgress[];
  upcomingPayments: FinanceRecurringPayment[];
  onAddTransaction: () => void;
  onNavigateTab: (tab: 'transactions' | 'budgets' | 'savings' | 'recurring' | 'analytics') => void;
  onPayRecurring: (id: string) => Promise<void>;
}

export const FinanceOverviewTab: React.FC<Props> = ({
  currency,
  rangeLabel,
  summary,
  monthlySeries,
  recentTransactions,
  budgetProgress,
  upcomingPayments,
  onAddTransaction,
  onNavigateTab,
  onPayRecurring,
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const maxChartVal = Math.max(
    1,
    ...monthlySeries.flatMap(m => [m.income, m.expenses])
  );

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      await onPayRecurring(id);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 5 KPI Cards */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#3B2418] text-[#F2E8DA] border border-[#5A3927] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8C7B4]">
              Available Balance
            </span>
            <Wallet className="w-4 h-4 text-[#8EC5FF]" />
          </div>
          <div className="my-2 font-mono text-xl xl:text-2xl font-extrabold text-[#F2E8DA] truncate">
            <AnimatedNumber value={summary.totalBalance} formatter={v => formatCurrency(v, currency)} />
          </div>
          <span className="text-[11px] text-[#8EC5FF]">Net all-time position</span>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E5648]">
              Income ({rangeLabel})
            </span>
            <ArrowDownLeft className="w-4 h-4 text-[#3E7B52]" />
          </div>
          <div className="my-2 font-mono text-xl xl:text-2xl font-extrabold text-[#3E7B52] truncate">
            <AnimatedNumber value={summary.periodIncome} formatter={v => formatCurrency(v, currency)} />
          </div>
          <span className="text-[11px] text-[#6E5648]">Recorded inflows</span>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E5648]">
              Expenses ({rangeLabel})
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#B84A44]" />
          </div>
          <div className="my-2 font-mono text-xl xl:text-2xl font-extrabold text-[#B84A44] truncate">
            <AnimatedNumber value={summary.periodExpenses} formatter={v => formatCurrency(v, currency)} />
          </div>
          <span className="text-[11px] text-[#6E5648]">Recorded outflows</span>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E5648]">
              Net Savings
            </span>
            <TrendingUp className="w-4 h-4 text-[#1E5A99]" />
          </div>
          <div
            className={`my-2 font-mono text-xl xl:text-2xl font-extrabold truncate ${
              summary.periodSavings >= 0 ? 'text-[#3B2418]' : 'text-[#9E3530]'
            }`}
          >
            <AnimatedNumber value={summary.periodSavings} formatter={v => formatCurrency(v, currency)} />
          </div>
          <span className="text-[11px] text-[#6E5648]">Income minus expenses</span>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E5648]">
              Savings Rate
            </span>
            <PieChart className="w-4 h-4 text-[#1E5A99]" />
          </div>
          <div className="my-2 font-mono text-xl xl:text-2xl font-extrabold text-[#1E5A99]">
            <AnimatedNumber value={summary.savingsRate} formatter={v => `${v.toFixed(1)}%`} />
          </div>
          <AnimatedProgressBar
            percentage={Math.max(0, Math.min(100, summary.savingsRate))}
            trackClassName="w-full bg-[#EAE0D0] h-1.5 rounded-full overflow-hidden"
            fillClassName="bg-[#8EC5FF] h-full rounded-full"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Main Row: Income vs Expenses Chart + Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Income vs Expenses 6-Month Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: MOMENTUM_EASE }}
          className="lg:col-span-7 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D6C6B2]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
                Income vs. Expenses (6 Months)
              </h3>
              <p className="text-xs text-[#6E5648]">
                Hover any month to inspect exact cash flow figures.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="flex items-center gap-1.5 text-[#3B2418]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#3E7B52]" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-[#3B2418]">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#B84A44]" /> Expenses
              </span>
            </div>
          </div>

          {monthlySeries.every(m => m.income === 0 && m.expenses === 0) ? (
            <div className="h-52 flex flex-col items-center justify-center text-center space-y-2 bg-[#F2E8DA]/60 rounded-xl border border-dashed border-[#D6C6B2] p-6">
              <p className="text-xs font-semibold text-[#3B2418]">No cash flow history recorded yet</p>
              <p className="text-xs text-[#6E5648] max-w-xs">
                Log your first income or expense transaction to visualize monthly cash flow trends.
              </p>
              <button
                onClick={onAddTransaction}
                className="btn-press mt-1 px-3.5 py-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418] text-xs font-bold border border-[#3B2418]/15"
              >
                + Record Transaction
              </button>
            </div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
              {monthlySeries.map(pt => {
                const incPct = Math.round((pt.income / maxChartVal) * 100);
                const expPct = Math.round((pt.expenses / maxChartVal) * 100);
                const isHovered = hoveredMonth === pt.month;

                return (
                  <div
                    key={pt.month}
                    onMouseEnter={() => setHoveredMonth(pt.month)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  >
                    {isHovered && (
                      <div className="absolute -top-2 z-20 px-2.5 py-1.5 rounded-lg bg-[#3B2418] text-[#F2E8DA] text-[10px] font-mono shadow-lg whitespace-nowrap pointer-events-none border border-[#5A3927]">
                        <div className="text-[#8EC5FF] font-bold">{pt.label}</div>
                        <div>In: {formatCurrency(pt.income, currency)}</div>
                        <div>Out: {formatCurrency(pt.expenses, currency)}</div>
                      </div>
                    )}
                    <div className="w-full flex items-end justify-center gap-1.5 h-40 px-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(pt.income > 0 ? 6 : 2, incPct)}%` }}
                        transition={{ duration: 0.45, ease: MOMENTUM_EASE }}
                        className="w-3 sm:w-5 rounded-t-md bg-[#3E7B52] group-hover:brightness-110 transition-all"
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(pt.expenses > 0 ? 6 : 2, expPct)}%` }}
                        transition={{ duration: 0.45, ease: MOMENTUM_EASE }}
                        className="w-3 sm:w-5 rounded-t-md bg-[#B84A44] group-hover:brightness-110 transition-all"
                      />
                    </div>
                    <span className="mt-2 text-[10px] font-mono text-[#6E5648] font-medium">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Monthly Budget Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.06, ease: MOMENTUM_EASE }}
          className="lg:col-span-5 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D6C6B2]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              Monthly Budget Overview
            </h3>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs font-semibold text-[#1E5A99] hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {budgetProgress.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-2">
              <p className="text-xs font-semibold text-[#3B2418]">No budgets configured for this month</p>
              <p className="text-xs text-[#6E5648]">
                Set spending limits by category to get automatic alerts before overspending.
              </p>
              <button
                onClick={() => onNavigateTab('budgets')}
                className="btn-press mt-1 px-3 py-1.5 rounded-lg bg-[#F2E8DA] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418]"
              >
                Set Monthly Budgets
              </button>
            </div>
          ) : (
            <div className="space-y-3.5 flex-1">
              {budgetProgress.slice(0, 4).map(b => (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#3B2418]">{b.category}</span>
                      {b.status === 'exceeded' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#B84A44]/15 text-[#9E3530] text-[10px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Over
                        </span>
                      )}
                      {b.status === 'warning' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#A36116]/15 text-[#A36116] text-[10px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5" /> {Math.round(b.rawPercentage)}%
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-[#6E5648]">
                      <strong className="text-[#3B2418]">{formatCurrency(b.spent, currency)}</strong> /{' '}
                      {formatCurrency(b.limitAmount, currency)}
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percentage={b.clampedPercentage}
                    trackClassName="w-full h-2 bg-[#EAE0D0] rounded-full overflow-hidden"
                    fillClassName={`h-full rounded-full ${
                      b.status === 'exceeded'
                        ? 'bg-[#B84A44]'
                        : b.status === 'warning'
                        ? 'bg-[#A36116]'
                        : 'bg-[#3E7B52]'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row: Recent Transactions + Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.1, ease: MOMENTUM_EASE }}
          className="lg:col-span-7 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D6C6B2]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              Recent Transactions
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={onAddTransaction}
                className="btn-press flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8EC5FF] text-[#3B2418] text-[11px] font-bold border border-[#3B2418]/15"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs font-semibold text-[#1E5A99] hover:underline flex items-center gap-1"
              >
                <span>History</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6E5648]">
              No transactions in this date range yet.
            </div>
          ) : (
            <div className="divide-y divide-[#D6C6B2]/60">
              {recentTransactions.slice(0, 6).map(tx => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-[#3E7B52]/15 text-[#3E7B52]'
                          : 'bg-[#B84A44]/15 text-[#B84A44]'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#3B2418] truncate">
                        {tx.description || tx.category}
                      </div>
                      <div className="text-[11px] text-[#6E5648] flex items-center gap-2">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                        <span>•</span>
                        <span className="font-mono">{tx.date}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono font-bold shrink-0 ${
                      tx.type === 'income' ? 'text-[#3E7B52]' : 'text-[#3B2418]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Payments */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.14, ease: MOMENTUM_EASE }}
          className="lg:col-span-5 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D6C6B2]">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#1E5A99]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
                Upcoming Payments
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('recurring')}
              className="text-xs font-semibold text-[#1E5A99] hover:underline flex items-center gap-1"
            >
              <span>All Schedules</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingPayments.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-semibold text-[#3B2418]">No upcoming recurring bills or income</p>
              <p className="text-xs text-[#6E5648]">
                Track rent, internet bills, subscriptions, or recurring salary.
              </p>
              <button
                onClick={() => onNavigateTab('recurring')}
                className="btn-press px-3 py-1.5 rounded-lg bg-[#F2E8DA] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418]"
              >
                Add Recurring Item
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingPayments.slice(0, 5).map(rec => {
                const days = getDaysUntilDate(rec.nextDueDate);
                const badgeText =
                  days < 0
                    ? `Overdue ${Math.abs(days)}d`
                    : days === 0
                    ? 'Due today'
                    : `In ${days}d`;

                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#3B2418] truncate">{rec.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className="font-mono text-[#6E5648]">{rec.nextDueDate}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold ${
                            days <= 0
                              ? 'bg-[#B84A44]/15 text-[#9E3530]'
                              : days <= 5
                              ? 'bg-[#A36116]/15 text-[#A36116]'
                              : 'bg-[#8EC5FF]/40 text-[#1E5A99]'
                          }`}
                        >
                          {badgeText}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-mono text-xs font-bold ${
                          rec.type === 'income' ? 'text-[#3E7B52]' : 'text-[#3B2418]'
                        }`}
                      >
                        {rec.type === 'income' ? '+' : '-'}
                        {formatCurrency(rec.amount, currency)}
                      </span>
                      <button
                        onClick={() => handlePay(rec.id)}
                        disabled={payingId === rec.id}
                        title="Record payment now & advance schedule"
                        className="btn-press p-1.5 rounded-lg bg-[#FAF5ED] hover:bg-[#8EC5FF] border border-[#D6C6B2] text-[#3B2418] transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
