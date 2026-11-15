import React from 'react';
import {
  Calendar,
  Edit2,
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AnimatedNumber,
  AnimatedProgressBar,
  MOMENTUM_EASE,
  StaggerContainer,
  StaggerItem,
} from '../common/MotionPrimitives';
import { formatCurrency, getDaysUntilDate } from '../../lib/finance';
import type { CurrencyCode, FinanceSavingsGoal } from '../../types/finance';

interface Props {
  goals: FinanceSavingsGoal[];
  currency: CurrencyCode;
  onAddGoal: () => void;
  onEditGoal: (g: FinanceSavingsGoal) => void;
  onDeleteGoal: (g: FinanceSavingsGoal) => void;
  onContributeGoal: (g: FinanceSavingsGoal) => void;
}

export const FinanceSavingsTab: React.FC<Props> = ({
  goals,
  currency,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onContributeGoal,
}) => {
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallPct =
    totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 1000) / 10) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StaggerItem className="card-hover p-4 rounded-2xl bg-surface-warm text-ink border border-line">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Total Saved
          </span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-accent tabular-nums">
            <AnimatedNumber value={totalSaved} formatter={v => formatCurrency(v, currency)} />
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Combined Target
          </span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-ink tabular-nums">
            <AnimatedNumber value={totalTarget} formatter={v => formatCurrency(v, currency)} />
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
            Overall Progress
          </span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-success tabular-nums">
            <AnimatedNumber value={overallPct} formatter={v => `${v.toFixed(1)}%`} />
          </div>
        </StaggerItem>

        <StaggerItem className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-center">
          <button
            type="button"
            onClick={onAddGoal}
            className="btn-press glass-accent-pill w-full h-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl font-semibold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Savings Goal</span>
          </button>
        </StaggerItem>
      </StaggerContainer>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-canvas border border-line flex items-center justify-center mx-auto text-accent">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-ink">No Savings Goals Created Yet</h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Create dedicated savings targets for your Emergency Fund, a new Laptop, Travel, or Education and track every contribution.
          </p>
          <button
            type="button"
            onClick={onAddGoal}
            className="btn-press glass-accent-pill min-h-[44px] px-4 py-2 rounded-xl font-semibold text-xs"
          >
            + Create First Savings Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence initial={false}>
            {goals.map(goal => {
              const remaining = Math.max(
                0,
                Math.round((goal.targetAmount - goal.currentAmount) * 100) / 100
              );
              const pct =
                goal.targetAmount > 0
                  ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
                  : 0;
              const daysLeft = getDaysUntilDate(goal.deadline);
              const isFunded = remaining <= 0;

              return (
                <motion.div
                  layout
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
                  className="card-hover p-5 rounded-2xl bg-surface border border-line space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block">
                          {goal.category}
                        </span>
                        <h4 className="text-base font-bold text-ink truncate">{goal.name}</h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditGoal(goal)}
                          className="p-2 rounded-lg text-ink-muted hover:text-accent hover:bg-surface-warm btn-press"
                          title="Edit savings goal"
                          aria-label={`Edit savings goal ${goal.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteGoal(goal)}
                          className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 btn-press"
                          title="Delete savings goal"
                          aria-label={`Delete savings goal ${goal.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="text-xs text-ink-muted leading-relaxed">{goal.notes}</p>
                    )}

                    {/* Progress Visual */}
                    <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-2">
                      <div className="flex items-baseline justify-between text-xs gap-2">
                        <span className="font-mono font-bold text-ink tabular-nums">
                          {formatCurrency(goal.currentAmount, currency)}
                        </span>
                        <span className="font-mono text-ink-muted tabular-nums">
                          Target: {formatCurrency(goal.targetAmount, currency)}
                        </span>
                      </div>

                      <AnimatedProgressBar
                        percentage={pct}
                        trackClassName="w-full h-2.5 bg-surface-inset rounded-full overflow-hidden"
                        fillClassName={`h-full rounded-full ${
                          isFunded ? 'bg-success' : 'bg-accent'
                        }`}
                      />

                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold tabular-nums ${
                            isFunded ? 'text-success' : 'text-accent'
                          }`}
                        >
                          {isFunded
                            ? 'Target Reached'
                            : `Remaining: ${formatCurrency(remaining, currency)}`}
                        </span>
                        <span className="font-mono font-bold text-ink tabular-nums">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Recent Contributions */}
                    {goal.contributions && goal.contributions.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                          Recent Contributions ({goal.contributions.length})
                        </span>
                        <div className="divide-y divide-line rounded-xl bg-canvas border border-line max-h-28 overflow-y-auto">
                          {goal.contributions.slice(0, 3).map(c => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between text-[11px] px-3 py-1.5 text-ink-muted gap-2"
                            >
                              <span className="truncate tabular-nums">
                                {c.date}
                                {c.note ? ` · ${c.note}` : ''}
                              </span>
                              <span className="font-mono font-bold text-success shrink-0 tabular-nums">
                                +{formatCurrency(c.amount, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="font-mono text-[11px]">{goal.deadline}</span>
                      <span className="text-[11px] font-medium">
                        · {daysLeft >= 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d past`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onContributeGoal(goal)}
                      className="btn-press glass-accent-pill min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-accent-ink" />
                      <span>Add Contribution</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
