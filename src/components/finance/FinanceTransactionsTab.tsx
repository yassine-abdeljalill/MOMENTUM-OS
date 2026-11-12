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
      <div className="p-4 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#6E5648] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description, category, or method..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onManageCategories}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2E8DA] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418]"
            >
              <Tag className="w-3.5 h-3.5 text-[#1E5A99]" />
              <span>Categories</span>
            </button>
            <button
              onClick={onExportCsv}
              className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2E8DA] hover:bg-[#EAE0D0] border border-[#D6C6B2] text-xs font-semibold text-[#3B2418]"
            >
              <Download className="w-3.5 h-3.5 text-[#1E5A99]" />
              <span>CSV</span>
            </button>
            <button
              onClick={onAdd}
              className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D6C6B2]/70">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
              className="px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
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
              className="px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
            >
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map(pm => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="text-[#6E5648]">{filtered.length} entries</span>
            <span className="text-[#3E7B52] font-semibold">
              +{formatCurrency(totals.income, currency)}
            </span>
            <span className="text-[#B84A44] font-semibold">
              -{formatCurrency(totals.expense, currency)}
            </span>
            <span className="text-[#3B2418] font-bold">
              Net: {formatCurrency(totals.net, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] text-center space-y-3">
          <p className="text-sm font-bold text-[#3B2418]">
            {transactions.length === 0
              ? 'No financial transactions recorded yet'
              : 'No transactions match your current filters'}
          </p>
          <p className="text-xs text-[#6E5648] max-w-md mx-auto">
            {transactions.length === 0
              ? 'Start tracking your cash flow by recording your income and daily expenses.'
              : 'Try clearing the search query or switching category/type filters.'}
          </p>
          {transactions.length === 0 && (
            <button
              onClick={onAdd}
              className="btn-press px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs border border-[#3B2418]/15"
            >
              + Add Your First Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D6C6B2] bg-[#EAE0D0]/60 text-[10px] font-mono uppercase text-[#6E5648]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6C6B2]/60 text-xs">
                <AnimatePresence initial={false}>
                  {filtered.map(tx => (
                    <motion.tr
                      key={tx.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16, ease: MOMENTUM_EASE }}
                      className="hover:bg-[#F2E8DA]/60 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[#6E5648] whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              tx.type === 'income'
                                ? 'bg-[#3E7B52]/15 text-[#3E7B52]'
                                : 'bg-[#B84A44]/15 text-[#B84A44]'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <span className="font-semibold text-[#3B2418]">
                            {tx.description || tx.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#F2E8DA] border border-[#D6C6B2] text-[11px] font-medium text-[#3B2418]">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6E5648]">{tx.paymentMethod}</td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          tx.type === 'income' ? 'text-[#3E7B52]' : 'text-[#3B2418]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#1E5A99] hover:bg-[#EAE0D0] btn-press"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(tx)}
                            className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#B84A44] hover:bg-[#B84A44]/10 btn-press"
                            title="Delete transaction"
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
          <div className="md:hidden divide-y divide-[#D6C6B2]">
            {filtered.map(tx => (
              <div key={tx.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-[#3E7B52]/15 text-[#3E7B52]'
                          : 'bg-[#B84A44]/15 text-[#B84A44]'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-[#3B2418] truncate">
                        {tx.description || tx.category}
                      </div>
                      <div className="text-[11px] text-[#6E5648]">
                        {tx.category} • {tx.paymentMethod}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-bold ${
                        tx.type === 'income' ? 'text-[#3E7B52]' : 'text-[#3B2418]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </div>
                    <div className="font-mono text-[10px] text-[#6E5648]">{tx.date}</div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => onEdit(tx)}
                    className="px-2.5 py-1 rounded bg-[#F2E8DA] border border-[#D6C6B2] text-[11px] font-medium text-[#3B2418] btn-press"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(tx)}
                    className="px-2.5 py-1 rounded bg-[#B84A44]/10 border border-[#B84A44]/30 text-[11px] font-medium text-[#9E3530] btn-press"
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
