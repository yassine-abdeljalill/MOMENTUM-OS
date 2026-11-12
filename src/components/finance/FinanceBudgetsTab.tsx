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
      <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-[#6E5648]">Budget Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => onChangeMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <button
            onClick={onAdd}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>

        {budgets.length > 0 && (
          <div className="pt-3 border-t border-[#D6C6B2] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#3B2418]">Total Monthly Allocation:</span>
                <span className="font-mono font-bold text-[#3B2418]">
                  <AnimatedNumber value={totalSpent} formatter={v => formatCurrency(v, currency)} />
                </span>
                <span className="text-[#6E5648]">of</span>
                <span className="font-mono font-semibold text-[#6E5648]">
                  {formatCurrency(totalLimit, currency)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {exceededCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#B84A44]/15 text-[#9E3530] text-[11px] font-bold">
                    {exceededCount} Over Budget
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#A36116]/15 text-[#A36116] text-[11px] font-bold">
                    {warningCount} Approaching Limit
                  </span>
                )}
              </div>
            </div>
            <AnimatedProgressBar
              percentage={overallPct}
              trackClassName="w-full h-2.5 bg-[#EAE0D0] rounded-full overflow-hidden"
              fillClassName={`h-full rounded-full ${
                totalSpent > totalLimit ? 'bg-[#B84A44]' : 'bg-[#8EC5FF]'
              }`}
            />
          </div>
        )}
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] flex items-center justify-center mx-auto text-[#1E5A99]">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#3B2418]">No Budgets Set for {selectedMonth}</h3>
          <p className="text-xs text-[#6E5648] max-w-md mx-auto">
            Assign monthly spending limits to categories like Food, Transport, Housing, or Bills and receive automatic alerts as you approach your thresholds.
          </p>
          <button
            onClick={onAdd}
            className="btn-press px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15"
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
                className={`card-hover p-5 rounded-2xl bg-[#FAF5ED] border shadow-xs flex flex-col justify-between space-y-4 ${
                  b.status === 'exceeded'
                    ? 'border-[#B84A44]/60'
                    : b.status === 'warning'
                    ? 'border-[#A36116]/60'
                    : 'border-[#D6C6B2]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#3B2418]">{b.category}</h4>
                      <span className="text-[11px] font-mono text-[#6E5648]">{b.month}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(b)}
                        className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#1E5A99] hover:bg-[#F2E8DA] btn-press"
                        title="Edit budget"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(b)}
                        className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#B84A44] hover:bg-[#B84A44]/10 btn-press"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress & Numbers */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-mono font-bold text-[#3B2418]">
                        {formatCurrency(b.spent, currency)}
                      </span>
                      <span className="font-mono text-[11px] text-[#6E5648]">
                        Limit: {formatCurrency(b.limitAmount, currency)}
                      </span>
                    </div>

                    <AnimatedProgressBar
                      percentage={b.clampedPercentage}
                      trackClassName="w-full h-2.5 bg-[#EAE0D0] rounded-full overflow-hidden"
                      fillClassName={`h-full rounded-full ${
                        b.status === 'exceeded'
                          ? 'bg-[#B84A44]'
                          : b.status === 'warning'
                          ? 'bg-[#A36116]'
                          : 'bg-[#3E7B52]'
                      }`}
                    />
                  </div>
                </div>

                {/* Status Footer */}
                <div className="pt-3 border-t border-[#D6C6B2]/70 flex items-center justify-between text-xs">
                  {b.status === 'exceeded' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#9E3530]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Over by {formatCurrency(Math.abs(b.remaining), currency)}
                    </span>
                  ) : b.status === 'warning' ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#A36116]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Approaching ({b.rawPercentage.toFixed(0)}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#3E7B52]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {formatCurrency(b.remaining, currency)} left
                    </span>
                  )}

                  <span className="font-mono text-[11px] font-bold text-[#6E5648]">
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
