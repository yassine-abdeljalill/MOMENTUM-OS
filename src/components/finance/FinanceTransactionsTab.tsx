import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Edit2,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { PAYMENT_METHODS, formatCurrency } from '../../lib/finance';
import type { CurrencyCode, FinanceCategory, FinanceTransaction } from '../../types/finance';

interface Props {
  transactions: FinanceTransaction[];
  categories: FinanceCategory[];
  currency: CurrencyCode;
  onAdd: () => void;
  onEdit: (tx: FinanceTransaction) => void;
  onDelete: (tx: FinanceTransaction) => void;
  onManageCategories: () => void;
  onExportCsv: () => Promise<void>;
}

export const FinanceTransactionsTab: React.FC<Props> = ({
  transactions,
  categories,
  currency,
  onAdd,
  onEdit,
  onDelete,
  onManageCategories,
  onExportCsv,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, paymentFilter, search]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [filtered]);

  const uniqueCategories = useMemo(() => {
    const names = new Set<string>(categories.map(c => c.name));
    transactions.forEach(t => names.add(t.category));
    return Array.from(names).sort();
  }, [categories, transactions]);

  return (
    <div className="space-y-5">
      {/* Filters & Controls */}
      <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description, category, or method..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onManageCategories}
              className="btn-press glass-control flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink whitespace-nowrap"
            >
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span>Categories</span>
            </button>
            <button
              type="button"
              onClick={onExportCsv}
              className="btn-press glass-control flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-ink whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={onAdd}
              className="btn-press glass-accent-pill flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
              className="px-2.5 py-1.5 rounded-xl bg-canvas border border-line text-xs text-ink"
              aria-label="Filter by transaction type"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-canvas border border-line text-xs text-ink"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-canvas border border-line text-xs text-ink"
              aria-label="Filter by payment method"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map(pm => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
            <span className="text-ink-muted">{filtered.length} entries</span>
            <span className="text-success font-semibold">
              +{formatCurrency(totals.income, currency)}
            </span>
            <span className="text-danger font-semibold">
              -{formatCurrency(totals.expense, currency)}
            </span>
            <span className="text-ink font-bold">
              Net: {formatCurrency(totals.net, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-surface border border-line text-center space-y-3">
          <p className="text-sm font-bold text-ink">
            {transactions.length === 0
              ? 'No financial transactions recorded yet'
              : 'No transactions match your current filters'}
          </p>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            {transactions.length === 0
              ? 'Start tracking your cash flow by recording your income and daily expenses.'
              : 'Try clearing the search query or switching category/type filters.'}
          </p>
          {transactions.length === 0 && (
            <button
              type="button"
              onClick={onAdd}
              className="btn-press glass-accent-pill px-4 py-2 rounded-xl font-semibold text-xs"
            >
              + Add Your First Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface border border-line overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-canvas text-[10px] font-mono uppercase text-ink-muted">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                <AnimatePresence initial={false}>
                  {filtered.map(tx => (
                    <motion.tr
                      key={tx.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: MOMENTUM_EASE }}
                      className="hover:bg-canvas/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-ink-muted whitespace-nowrap tabular-nums">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              tx.type === 'income'
                                ? 'bg-success/15 text-success'
                                : 'bg-danger/15 text-danger'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-semibold text-ink">
                            {tx.description || tx.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-ink-muted font-medium">{tx.category}</td>
                      <td className="py-3 px-4 text-ink-muted">{tx.paymentMethod}</td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap tabular-nums ${
                          tx.type === 'income' ? 'text-success' : 'text-ink'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-accent hover:bg-surface-warm btn-press"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(tx)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 btn-press"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-line">
            {filtered.map(tx => (
              <div key={tx.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-success/15 text-success'
                          : 'bg-danger/15 text-danger'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">
                        {tx.description || tx.category}
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        {tx.category} · {tx.paymentMethod}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold tabular-nums ${
                        tx.type === 'income' ? 'text-success' : 'text-ink'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </div>
                    <div className="font-mono text-[10px] text-ink-muted tabular-nums">{tx.date}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onEdit(tx)}
                    className="glass-control px-2.5 py-1 rounded-lg text-[11px] font-medium text-ink btn-press"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(tx)}
                    className="px-2.5 py-1 rounded-lg bg-danger/10 border border-danger/30 text-[11px] font-medium text-danger btn-press"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
