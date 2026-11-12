import React, { useState } from 'react';
import {
  ArrowDownLeft,
  CalendarClock,
  Check,
  Edit2,
  Home,
  PauseCircle,
  PlayCircle,
  Plus,
  Repeat,
  Trash2,
  Wifi,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AnimatedNumber,
  MOMENTUM_EASE,
  StaggerContainer,
  StaggerItem,
} from '../common/MotionPrimitives';
import { formatCurrency, getDaysUntilDate } from '../../lib/finance';
import type {
  CurrencyCode,
  FinanceRecurringPayment,
  RecurringKind,
} from '../../types/finance';

interface Props {
  recurringPayments: FinanceRecurringPayment[];
  currency: CurrencyCode;
  onAdd: () => void;
  onEdit: (rec: FinanceRecurringPayment) => void;
  onDelete: (rec: FinanceRecurringPayment) => void;
  onPayNow: (id: string) => Promise<void>;
  onToggleActive: (rec: FinanceRecurringPayment) => Promise<void>;
}

const KIND_LABELS: Record<RecurringKind, string> = {
  subscription: 'Subscription',
  rent: 'Rent',
  internet_phone: 'Internet & Phone',
  recurring_income: 'Recurring Income',
  custom: 'Custom',
};

function getKindIcon(kind: RecurringKind) {
  switch (kind) {
    case 'rent':
      return <Home className="w-4 h-4" />;
    case 'internet_phone':
      return <Wifi className="w-4 h-4" />;
    case 'recurring_income':
      return <ArrowDownLeft className="w-4 h-4" />;
    default:
      return <Repeat className="w-4 h-4" />;
  }
}

export const FinanceRecurringTab: React.FC<Props> = ({
  recurringPayments,
  currency,
  onAdd,
  onEdit,
  onDelete,
  onPayNow,
  onToggleActive,
}) => {
  const [payingId, setPayingId] = useState<string | null>(null);

  const monthlyEquivalent = (rec: FinanceRecurringPayment) => {
    if (!rec.active) return 0;
    if (rec.frequency === 'weekly') return rec.amount * 4.33;
    if (rec.frequency === 'quarterly') return rec.amount / 3;
    if (rec.frequency === 'yearly') return rec.amount / 12;
    return rec.amount;
  };

  const monthlyExpenses = recurringPayments
    .filter(r => r.type === 'expense')
    .reduce((acc, r) => acc + monthlyEquivalent(r), 0);

  const monthlyIncome = recurringPayments
    .filter(r => r.type === 'income')
    .reduce((acc, r) => acc + monthlyEquivalent(r), 0);

  const dueSoonCount = recurringPayments.filter(
    r => r.active && getDaysUntilDate(r.nextDueDate) <= 7
  ).length;

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      await onPayNow(id);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPIs & Add Action */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2]">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Est. Monthly Outflow</span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-[#B84A44]">
            <AnimatedNumber value={monthlyExpenses} formatter={v => formatCurrency(v, currency)} />
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2]">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Est. Monthly Inflow</span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-[#3E7B52]">
            <AnimatedNumber value={monthlyIncome} formatter={v => formatCurrency(v, currency)} />
          </div>
        </StaggerItem>

        <StaggerItem className="card-hover p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2]">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Due Within 7 Days</span>
          <div className="mt-1.5 font-mono text-xl font-extrabold text-[#1E5A99]">
            <AnimatedNumber value={dueSoonCount} formatter={v => `${Math.round(v)} items`} />
          </div>
        </StaggerItem>

        <StaggerItem className="p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] flex items-center justify-center">
          <button
            onClick={onAdd}
            className="btn-press w-full h-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring Item</span>
          </button>
        </StaggerItem>
      </StaggerContainer>

      {/* Recurring Schedules Grid */}
      {recurringPayments.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] flex items-center justify-center mx-auto text-[#1E5A99]">
            <CalendarClock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#3B2418]">No Recurring Bills or Income Scheduled</h3>
          <p className="text-xs text-[#6E5648] max-w-md mx-auto">
            Add monthly subscriptions, rent, internet & phone bills, or recurring income so you never miss an upcoming payment date.
          </p>
          <button
            onClick={onAdd}
            className="btn-press px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15"
          >
            + Schedule First Recurring Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {recurringPayments.map(rec => {
              const days = getDaysUntilDate(rec.nextDueDate);
              const dueLabel =
                days < 0
                  ? `Overdue by ${Math.abs(days)}d`
                  : days === 0
                  ? 'Due today'
                  : `Due in ${days}d`;

              return (
                <motion.div
                  layout
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
                  className={`card-hover p-5 rounded-2xl bg-[#FAF5ED] border shadow-xs flex flex-col justify-between space-y-4 ${
                    rec.active ? 'border-[#D6C6B2]' : 'border-[#D6C6B2] opacity-70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            rec.type === 'income'
                              ? 'bg-[#3E7B52]/15 text-[#3E7B52]'
                              : 'bg-[#3B2418] text-[#8EC5FF]'
                          }`}
                        >
                          {getKindIcon(rec.kind)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#3B2418] truncate">{rec.title}</h4>
                          <span className="text-[10px] font-mono uppercase text-[#6E5648]">
                            {KIND_LABELS[rec.kind]} • {rec.frequency}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onToggleActive(rec)}
                          className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#3B2418] hover:bg-[#F2E8DA] btn-press"
                          title={rec.active ? 'Pause schedule' : 'Resume schedule'}
                        >
                          {rec.active ? (
                            <PauseCircle className="w-3.5 h-3.5" />
                          ) : (
                            <PlayCircle className="w-3.5 h-3.5 text-[#3E7B52]" />
                          )}
                        </button>
                        <button
                          onClick={() => onEdit(rec)}
                          className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#1E5A99] hover:bg-[#F2E8DA] btn-press"
                          title="Edit schedule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(rec)}
                          className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#B84A44] hover:bg-[#B84A44]/10 btn-press"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
                      <span
                        className={`font-mono text-lg font-extrabold ${
                          rec.type === 'income' ? 'text-[#3E7B52]' : 'text-[#3B2418]'
                        }`}
                      >
                        {rec.type === 'income' ? '+' : '-'}
                        {formatCurrency(rec.amount, currency)}
                      </span>
                      <span className="text-[11px] text-[#6E5648]">{rec.category}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#6E5648]">Next: {rec.nextDueDate}</span>
                      {rec.active ? (
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                            days <= 0
                              ? 'bg-[#B84A44]/15 text-[#9E3530]'
                              : days <= 5
                              ? 'bg-[#A36116]/15 text-[#A36116]'
                              : 'bg-[#8EC5FF]/40 text-[#1E5A99]'
                          }`}
                        >
                          {dueLabel}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#EAE0D0] text-[#6E5648] text-[10px] font-semibold">
                          Paused
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#D6C6B2]/70 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6E5648]">{rec.paymentMethod}</span>
                    <button
                      onClick={() => handlePay(rec.id)}
                      disabled={payingId === rec.id}
                      className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] text-xs font-bold border border-[#3B2418]/15 disabled:opacity-60"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{rec.type === 'income' ? 'Log Received' : 'Record Paid'}</span>
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
