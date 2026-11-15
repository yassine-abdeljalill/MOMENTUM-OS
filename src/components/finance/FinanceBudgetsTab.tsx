import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AnimatedNumber,
  AnimatedProgressBar,
  MOMENTUM_EASE,
} from '../common/MotionPrimitives';
import { formatCurrency, type BudgetWithProgress } from '../../lib/finance';
import type { CurrencyCode } from '../../types/finance';

interface Props {
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  budgets: BudgetWithProgress[];
  currency: CurrencyCode;
  onAdd: () => void;
  onEdit: (b: BudgetWithProgress) => void;
  onDelete: (b: BudgetWithProgress) => void;
}

export const FinanceBudgetsTab: React.FC<Props> = ({
  selectedMonth,
  onChangeMonth,
  budgets,
  currency,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const totalLimit = budgets.reduce((acc, b) => acc + b.limitAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const overallPct = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 1000) / 10) : 0;
  const exceededCount = budgets.filter(b => b.status === 'exceeded').length;
  const warningCount = budgets.filter(b => b.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header Controls & Monthly Total Summary */}
      <div className="p-5 rounded-2xl bg-surface border border-line space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label htmlFor="budget-month-picker" className="text-xs font-semibold text-ink-muted">
              Budget Month:
            </label>
            <input
              id="budget-month-picker"
              type="month"
              value={selectedMonth}
              onChange={e => onChangeMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-canvas border border-line font-mono text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="btn-press flex items-center gap-1.5 px-4 py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>

        {budgets.length > 0 && (
          <div className="pt-3 border-t border-line space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">Total Monthly Allocation:</span>
                <span className="font-mono font-bold text-ink tabular-nums">
                  <AnimatedNumber value={totalSpent} formatter={v => formatCurrency(v, currency)} />
                </span>
                <span className="text-ink-muted">of</span>
                <span className="font-mono font-semibold text-ink-muted tabular-nums">
                  {formatCurrency(totalLimit, currency)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {exceededCount > 0 && (
                  <span className="text-danger text-[11px] font-bold tabular-nums">
                    {exceededCount} Over Budget
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="text-warning text-[11px] font-bold tabular-nums">
                    {warningCount} Approaching Limit
                  </span>
                )}
              </div>
            </div>
            <AnimatedProgressBar
              percentage={overallPct}
              trackClassName="w-full h-2.5 bg-surface-inset rounded-full overflow-hidden"
              fillClassName={`h-full rounded-full ${
                totalSpent > totalLimit ? 'bg-danger' : 'bg-accent'
              }`}
            />
          </div>
        )}
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-canvas border border-line flex items-center justify-center mx-auto text-accent">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-ink">No Budgets Set for {selectedMonth}</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Assign monthly spending limits to categories like Food, Transport, Housing, or Bills and receive automatic alerts as you approach your thresholds.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="btn-press px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs"
          >
            + Create Monthly Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {budgets.map(b => (
              <motion.div
                layout
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
                className={`card-hover p-5 rounded-2xl bg-surface border flex flex-col justify-between space-y-4 ${
                  b.status === 'exceeded'
                    ? 'border-danger/60'
                    : b.status === 'warning'
                    ? 'border-warning/60'
                    : 'border-line'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-ink">{b.category}</h4>
                      <span className="text-[11px] font-mono text-ink-muted tabular-nums">{b.month}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-surface-warm btn-press"
                        title="Edit budget"
                        aria-label={`Edit ${b.category} budget`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(b)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 btn-press"
                        title="Delete budget"
                        aria-label={`Delete ${b.category} budget`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress & Numbers */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-mono font-bold text-ink tabular-nums">
                        {formatCurrency(b.spent, currency)}
                      </span>
                      <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                        Limit: {formatCurrency(b.limitAmount, currency)}
                      </span>
                    </div>

                    <AnimatedProgressBar
                      percentage={b.clampedPercentage}
                      trackClassName="w-full h-2.5 bg-surface-inset rounded-full overflow-hidden"
                      fillClassName={`h-full rounded-full ${
                        b.status === 'exceeded'
                          ? 'bg-danger'
                          : b.status === 'warning'
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                    />
                  </div>
                </div>

                {/* Status Footer */}
                <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                  {b.status === 'exceeded' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-danger tabular-nums">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Over by {formatCurrency(Math.abs(b.remaining), currency)}
                    </span>
                  ) : b.status === 'warning' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-warning tabular-nums">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Approaching ({b.rawPercentage.toFixed(0)}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-success tabular-nums">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {formatCurrency(b.remaining, currency)} left
                    </span>
                  )}

                  <span className="font-mono text-[11px] font-bold text-ink-muted tabular-nums">
                    {b.rawPercentage.toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
