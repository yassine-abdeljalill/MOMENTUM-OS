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
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 1000) / 10) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#3B2418] text-[#F2E8DA] border border-[#5A3927]">
          <span className="text-[10px] font-mono uppercase text-[#D8C7B4]">Total Saved</span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-[#8EC5FF]">
            <AnimatedNumber value={totalSaved} formatter={v => formatCurrency(v, currency)} />
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2]">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Combined Target</span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-[#3B2418]">
            <AnimatedNumber value={totalTarget} formatter={v => formatCurrency(v, currency)} />
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2]">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Overall Progress</span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-[#3E7B52]">
            <AnimatedNumber value={overallPct} formatter={v => `${v.toFixed(1)}%`} />
          </div>
        </StaggerItem>

        <StaggerItem className="p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] flex items-center justify-center">
          <button
            onClick={onAddGoal}
            className="btn-press w-full h-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Savings Goal</span>
          </button>
        </StaggerItem>
      </StaggerContainer>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] flex items-center justify-center mx-auto text-[#1E5A99]">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#3B2418]">No Savings Goals Created Yet</h3>
          <p className="text-xs text-[#6E5648] max-w-md mx-auto">
            Create dedicated savings targets for your Emergency Fund, a new Laptop, Travel, or Education and track every contribution.
          </p>
          <button
            onClick={onAddGoal}
            className="btn-press px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15"
          >
            + Create First Savings Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence initial={false}>
            {goals.map(goal => {
              const remaining = Math.max(0, Math.round((goal.targetAmount - goal.currentAmount) * 100) / 100);
              const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
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
                  className="card-hover p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#3B2418] text-[#8EC5FF]">
                          {goal.category}
                        </span>
                        <h4 className="text-base font-bold text-[#3B2418]">{goal.name}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditGoal(goal)}
                          className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#1E5A99] hover:bg-[#F2E8DA] btn-press"
                          title="Edit savings goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteGoal(goal)}
                          className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#B84A44] hover:bg-[#B84A44]/10 btn-press"
                          title="Delete savings goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="text-xs text-[#6E5648] leading-relaxed">{goal.notes}</p>
                    )}

                    {/* Progress Visual */}
                    <div className="p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-2">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-mono font-bold text-[#3B2418]">
                          {formatCurrency(goal.currentAmount, currency)}
                        </span>
                        <span className="font-mono text-[#6E5648]">
                          Target: {formatCurrency(goal.targetAmount, currency)}
                        </span>
                      </div>

                      <AnimatedProgressBar
                        percentage={pct}
                        trackClassName="w-full h-2.5 bg-[#EAE0D0] rounded-full overflow-hidden"
                        fillClassName={`h-full rounded-full ${
                          isFunded ? 'bg-[#3E7B52]' : 'bg-[#8EC5FF]'
                        }`}
                      />

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#1E5A99]">
                          {isFunded
                            ? 'Target Reached!'
                            : `Remaining: ${formatCurrency(remaining, currency)}`}
                        </span>
                        <span className="font-mono font-bold text-[#3B2418]">{pct.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Recent Contributions */}
                    {goal.contributions && goal.contributions.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-[#6E5648]">
                          Recent Contributions ({goal.contributions.length})
                        </span>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {goal.contributions.slice(0, 3).map(c => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded bg-[#F2E8DA]/70 text-[#6E5648]"
                            >
                              <span className="truncate">
                                {c.date} {c.note ? `• ${c.note}` : ''}
                              </span>
                              <span className="font-mono font-bold text-[#3E7B52] shrink-0">
                                +{formatCurrency(c.amount, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-[#D6C6B2] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#6E5648]">
                      <Calendar className="w-3.5 h-3.5 text-[#1E5A99]" />
                      <span className="font-mono text-[11px]">{goal.deadline}</span>
                      <span className="text-[10px] font-medium">
                        ({daysLeft >= 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d past`})
                      </span>
                    </div>

                    <button
                      onClick={() => onContributeGoal(goal)}
                      className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#3B2418] hover:bg-[#4D3021] text-[#F2E8DA] text-xs font-semibold"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-[#8EC5FF]" />
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
