import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Loader2,
  PiggyBank,
  Plus,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { ModalShell } from '../common/MotionPrimitives';
import { PAYMENT_METHODS, formatCurrency } from '../../lib/finance';
import type {
  CurrencyCode,
  FinanceBudget,
  FinanceCategory,
  FinanceRecurringPayment,
  FinanceSavingsGoal,
  FinanceTransaction,
  PaymentMethod,
  RecurringFrequency,
  RecurringKind,
} from '../../types/finance';

// 1. Delete Confirmation Modal
export const ConfirmDeleteModal: React.FC<{
  isOpen: boolean;
  title: string;
  description: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}> = ({ isOpen, title, description, loading, onConfirm, onClose }) => (
  <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-sm">
    <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
      <div className="flex items-center gap-2 text-[#F2E8DA]">
        <AlertTriangle className="w-4 h-4 text-[#8EC5FF]" />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <button onClick={onClose} className="text-[#D8C7B4] hover:text-[#F2E8DA] btn-press">
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="p-5 space-y-4">
      <p className="text-xs text-[#6E5648] leading-relaxed">{description}</p>
      <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="btn-press px-3 py-1.5 rounded-lg text-xs text-[#6E5648] hover:text-[#3B2418]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="btn-press px-4 py-1.5 rounded-lg bg-[#B84A44] hover:bg-[#9E3530] text-[#FAF5ED] font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Confirm Delete</span>
        </button>
      </div>
    </div>
  </ModalShell>
);

// 2. Add / Edit Transaction Modal
export const TransactionModal: React.FC<{
  isOpen: boolean;
  editing: FinanceTransaction | null;
  categories: FinanceCategory[];
  currency: CurrencyCode;
  onCreateCategory: (name: string, type: 'income' | 'expense') => Promise<FinanceCategory>;
  onSave: (payload: {
    type: 'income' | 'expense';
    amount: number;
    date: string;
    category: string;
    description: string;
    paymentMethod: PaymentMethod;
  }) => Promise<void>;
  onClose: () => void;
}> = ({ isOpen, editing, categories, currency, onCreateCategory, onSave, onClose }) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Debit Card');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableCategories = categories.filter(c => c.type === type || c.type === 'both');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setNewCategoryName('');
    setAddingCat(false);
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setDate(editing.date);
      setCategory(editing.category);
      setDescription(editing.description);
      setPaymentMethod(editing.paymentMethod);
    } else {
      setType('expense');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory('Food');
      setDescription('');
      setPaymentMethod('Debit Card');
    }
  }, [isOpen, editing]);

  useEffect(() => {
    if (!isOpen || editing) return;
    const match = availableCategories.some(c => c.name === category);
    if (!match && availableCategories.length > 0) {
      setCategory(availableCategories[0].name);
    }
  }, [type, isOpen, editing, availableCategories, category]);

  const handleQuickAddCat = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await onCreateCategory(newCategoryName.trim(), type);
      setCategory(created.name);
      setNewCategoryName('');
      setAddingCat(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to add category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        type,
        amount: Math.round(num * 100) / 100,
        date,
        category: category.trim(),
        description: description.trim(),
        paymentMethod,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#F2E8DA]">
          {editing ? 'Edit Transaction' : 'Record Transaction'}
        </span>
        <button onClick={onClose} className="text-[#D8C7B4] hover:text-[#F2E8DA] btn-press">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 text-xs text-[#9E3530]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#EAE0D0] border border-[#D6C6B2] text-xs">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors btn-press ${
              type === 'expense'
                ? 'bg-[#B84A44] text-[#FAF5ED] shadow-xs'
                : 'text-[#6E5648] hover:text-[#3B2418]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors btn-press ${
              type === 'income'
                ? 'bg-[#3E7B52] text-[#FAF5ED] shadow-xs'
                : 'text-[#6E5648] hover:text-[#3B2418]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              Amount ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-sm font-bold text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#6E5648]">Category *</label>
            <button
              type="button"
              onClick={() => setAddingCat(v => !v)}
              className="text-[11px] font-semibold text-[#1E5A99] hover:underline"
            >
              {addingCat ? 'Cancel' : '+ Custom Category'}
            </button>
          </div>
          {addingCat ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="e.g. Coffee, Books, Freelance..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleQuickAddCat}
                className="px-3 py-1.5 rounded-lg bg-[#8EC5FF] text-[#3B2418] font-bold text-xs btn-press"
              >
                Add
              </button>
            </div>
          ) : (
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              {availableCategories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {!availableCategories.some(c => c.name === category) && category && (
                <option value={category}>{category}</option>
              )}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6E5648] mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
          >
            {PAYMENT_METHODS.map(pm => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6E5648] mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Weekly groceries, Client invoice #12..."
            className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{editing ? 'Update Transaction' : 'Save Transaction'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 3. Custom Categories Manager Modal
const CATEGORY_COLORS = ['#8EC5FF', '#1E5A99', '#3E7B52', '#A36116', '#B84A44', '#3B2418', '#6E5648'];

export const CategoryManagerModal: React.FC<{
  isOpen: boolean;
  categories: FinanceCategory[];
  onCreate: (name: string, type: 'income' | 'expense' | 'both', color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}> = ({ isOpen, categories, onCreate, onDelete, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#8EC5FF');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreate(name.trim(), type, color);
      setName('');
    } catch (err: any) {
      setError(err?.message || 'Unable to create category.');
    } finally {
      setSaving(false);
    }
  };

  const customCats = categories.filter(c => !c.isDefault);

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#8EC5FF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#F2E8DA]">
            Manage Categories
          </span>
        </div>
        <button onClick={onClose} className="text-[#D8C7B4] hover:text-[#F2E8DA] btn-press">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {error && (
          <div className="p-2.5 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 text-xs text-[#9E3530]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 p-3.5 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2]">
          <span className="text-xs font-bold text-[#3B2418] block">Create Custom Category</span>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Category name"
              className="col-span-2 px-3 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
            <select
              value={type}
              onChange={e => setType(e.target.value as 'expense' | 'income')}
              className="px-2 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c ? 'border-[#3B2418] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-press px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          <span className="text-[11px] font-mono uppercase text-[#6E5648]">
            Custom Categories ({customCats.length})
          </span>
          {customCats.length === 0 ? (
            <p className="text-xs text-[#6E5648] italic">
              No custom categories yet. All standard defaults (Food, Transport, Education, etc.) are active.
            </p>
          ) : (
            customCats.map(cat => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-[#3B2418]">{cat.name}</span>
                  <span className="text-[10px] font-mono uppercase text-[#6E5648]">({cat.type})</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(cat.id)}
                  className="text-[#9E3530] hover:text-[#B84A44] p-1 btn-press"
                  title="Delete custom category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
};

// 4. Budget Modal
export const BudgetModal: React.FC<{
  isOpen: boolean;
  editing: FinanceBudget | null;
  defaultMonth: string;
  categories: FinanceCategory[];
  currency: CurrencyCode;
  onSave: (payload: {
    category: string;
    month: string;
    limitAmount: number;
    warningThresholdPercent: number;
  }) => Promise<void>;
  onClose: () => void;
}> = ({ isOpen, editing, defaultMonth, categories, currency, onSave, onClose }) => {
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');
  const [category, setCategory] = useState('Food');
  const [month, setMonth] = useState(defaultMonth);
  const [limitAmount, setLimitAmount] = useState('');
  const [warningThresholdPercent, setWarningThresholdPercent] = useState('80');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editing) {
      setCategory(editing.category);
      setMonth(editing.month);
      setLimitAmount(String(editing.limitAmount));
      setWarningThresholdPercent(String(editing.warningThresholdPercent));
    } else {
      setCategory(expenseCategories[0]?.name || 'Food');
      setMonth(defaultMonth);
      setLimitAmount('');
      setWarningThresholdPercent('80');
    }
  }, [isOpen, editing, defaultMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = Number(limitAmount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Spending limit must be greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        category,
        month,
        limitAmount: Math.round(num * 100) / 100,
        warningThresholdPercent: Number(warningThresholdPercent) || 80,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to save budget.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#F2E8DA]">
          {editing ? 'Edit Monthly Budget' : 'Create Monthly Budget'}
        </span>
        <button onClick={onClose} className="text-[#D8C7B4] hover:text-[#F2E8DA] btn-press">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 text-xs text-[#9E3530]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              {expenseCategories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Month</label>
            <input
              type="month"
              required
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              Spending Limit ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={limitAmount}
              onChange={e => setLimitAmount(e.target.value)}
              placeholder="1500.00"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-sm font-bold text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              Warning Alert (%)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={warningThresholdPercent}
              onChange={e => setWarningThresholdPercent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{editing ? 'Update Budget' : 'Save Budget'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 5. Savings Goal Modal
export const SavingsGoalModal: React.FC<{
  isOpen: boolean;
  editing: FinanceSavingsGoal | null;
  currency: CurrencyCode;
  onSave: (payload: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    category: string;
    notes: string;
  }) => Promise<void>;
  onClose: () => void;
}> = ({ isOpen, editing, currency, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState('Emergency Fund');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editing) {
      setName(editing.name);
      setTargetAmount(String(editing.targetAmount));
      setCurrentAmount(String(editing.currentAmount));
      setDeadline(editing.deadline);
      setCategory(editing.category);
      setNotes(editing.notes);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setDeadline(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
      setCategory('Emergency Fund');
      setNotes('');
    }
  }, [isOpen, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const target = Number(targetAmount);
    const current = Number(currentAmount || 0);
    if (!Number.isFinite(target) || target <= 0) {
      setError('Target amount must be greater than zero.');
      return;
    }
    if (!Number.isFinite(current) || current < 0) {
      setError('Saved amount cannot be negative.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        targetAmount: Math.round(target * 100) / 100,
        currentAmount: Math.round(current * 100) / 100,
        deadline,
        category,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to save goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-[#8EC5FF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#F2E8DA]">
            {editing ? 'Edit Savings Goal' : 'Create Savings Goal'}
          </span>
        </div>
        <button onClick={onClose} className="text-[#D8C7B4] hover:text-[#F2E8DA] btn-press">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 text-xs text-[#9E3530]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#6E5648] mb-1">Goal Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Emergency Fund, MacBook Pro, Tuition..."
            className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              Target ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              placeholder="15000.00"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-xs font-bold text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              Already Saved ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={currentAmount}
              onChange={e => setCurrentAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              <option value="Emergency Fund">Emergency Fund</option>
              <option value="Tech / Laptop">Tech / Laptop</option>
              <option value="Education">Education</option>
              <option value="Travel">Travel</option>
              <option value="Housing">Housing</option>
              <option value="Investment">Investment</option>
              <option value="General">General</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Target Deadline *</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6E5648] mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional savings strategy or target milestone..."
            className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{editing ? 'Update Goal' : 'Create Goal'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// 6. Add Contribution Modal
export const ContributionModal: React.FC<{
  goal: FinanceSavingsGoal | null;
  currency: CurrencyCode;
  onContribute: (payload: {
    amount: number;
    date: string;
    note: string;
    alsoRecordExpense: boolean;
  }) => Promise<void>;
  onClose: () => void;
}> = ({ goal, currency, onContribute, onClose }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [alsoRecordExpense, setAlsoRecordExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!goal) return;
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setAlsoRecordExpense(false);
    setError('');
  }, [goal]);

  const remaining = goal ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Contribution must be greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await onContribute({
        amount: Math.round(num * 100) / 100,
        date,
        note: note.trim(),
        alsoRecordExpense,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to add contribution.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={Boolean(goal)} onClose={onClose} maxWidthClass="max-w-sm">
      <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#8EC5FF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#F2E8DA]">
            Add Contribution
          </span>
        </div>
        <button onClick={onClose} className="text-[#D8C7B4] hover:text-[#F2E8DA] btn-press">
          <X className="w-4 h-4" />
        </button>
      </div>

      {goal && (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-1 text-xs">
            <span className="font-bold text-[#3B2418] block">{goal.name}</span>
            <span className="text-[#6E5648]">
              Remaining to target: <strong className="font-mono text-[#1E5A99]">{formatCurrency(remaining, currency)}</strong>
            </span>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 text-xs text-[#9E3530]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">
                Amount ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="500.00"
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-sm font-bold text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6E5648] mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Monthly transfer"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#3B2418] cursor-pointer">
            <input
              type="checkbox"
              checked={alsoRecordExpense}
              onChange={e => setAlsoRecordExpense(e.target.checked)}
              className="rounded accent-[#3B2418]"
            />
            <span>Also log as an outflow transaction from balance</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
            <button
              type="button"
              onClick={onClose}
              className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Add Funds</span>
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
};

// 7. Recurring Payment Modal
export const RecurringModal: React.FC<{
  isOpen: boolean;
  editing: FinanceRecurringPayment | null;
  categories: FinanceCategory[];
  currency: CurrencyCode;
  onSave: (payload: {
    title: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    paymentMethod: PaymentMethod;
    frequency: RecurringFrequency;
    kind: RecurringKind;
    nextDueDate: string;
    active: boolean;
  }) => Promise<void>;
  onClose: () => void;
}> = ({ isOpen, editing, categories, currency, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<RecurringKind>('subscription');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Debit Card');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const availableCategories = categories.filter(c => c.type === type || c.type === 'both');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editing) {
      setTitle(editing.title);
      setKind(editing.kind);
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setPaymentMethod(editing.paymentMethod);
      setFrequency(editing.frequency);
      setNextDueDate(editing.nextDueDate);
      setActive(editing.active);
    } else {
      setTitle('');
      setKind('subscription');
      setType('expense');
      setAmount('');
      setCategory('Bills');
      setPaymentMethod('Debit Card');
      setFrequency('monthly');
      setNextDueDate(new Date().toISOString().slice(0, 10));
      setActive(true);
    }
  }, [isOpen, editing]);

  const handleKindChange = (nextKind: RecurringKind) => {
    setKind(nextKind);
    if (nextKind === 'recurring_income') {
      setType('income');
      setCategory('Salary');
    } else {
      setType('expense');
      if (nextKind === 'rent') setCategory('Housing');
      else if (nextKind === 'internet_phone') setCategory('Bills');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        amount: Math.round(num * 100) / 100,
        category,
        paymentMethod,
        frequency,
        kind,
        nextDueDate,
        active,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to save recurring item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-[#8EC5FF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#F2E8DA]">
            {editing ? 'Edit Recurring Item' : 'New Recurring Payment / Income'}
          </span>
        </div>
        <button onClick={onClose} className="text-[#D8C7B4] hover:text-[#F2E8DA] btn-press">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
        {error && (
          <div className="p-2.5 rounded-lg bg-[#B84A44]/15 border border-[#B84A44]/40 text-xs text-[#9E3530]">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[#6E5648] mb-1">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Apartment Rent, Fiber Internet, Cloud Hosting..."
            className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Recurring Type</label>
            <select
              value={kind}
              onChange={e => handleKindChange(e.target.value as RecurringKind)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              <option value="subscription">Monthly Subscription</option>
              <option value="rent">Rent</option>
              <option value="internet_phone">Internet & Phone</option>
              <option value="recurring_income">Recurring Income</option>
              <option value="custom">Custom Recurring</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Flow Direction</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as 'income' | 'expense')}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              <option value="expense">Expense (Outflow)</option>
              <option value="income">Income (Inflow)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              Amount ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] font-mono text-sm font-bold text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Frequency</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              {availableCategories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {!availableCategories.some(c => c.name === category) && (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              {PAYMENT_METHODS.map(pm => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Next Due Date *</label>
            <input
              type="date"
              required
              value={nextDueDate}
              onChange={e => setNextDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-[#3B2418] pb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="rounded accent-[#3B2418]"
            />
            <span>Schedule active</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{editing ? 'Update Schedule' : 'Save Schedule'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
