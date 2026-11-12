import crypto from 'node:crypto';
import { Router } from 'express';
import {
  type AuthedRequest,
  initializeUserFinanceDefaults,
  requireAuth,
} from '../auth.ts';
import { getDb } from '../db.ts';
import {
  budgetCreateSchema,
  budgetUpdateSchema,
  categoryCreateSchema,
  contributionCreateSchema,
  recurringCreateSchema,
  recurringUpdateSchema,
  savingsGoalCreateSchema,
  savingsGoalUpdateSchema,
  settingsUpdateSchema,
  transactionCreateSchema,
  transactionUpdateSchema,
} from '../validation.ts';

const router = Router();

// Protect every finance API endpoint with strict server-side authentication
router.use(requireAuth);

function advanceDueDate(dateStr: string, frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (frequency === 'weekly') {
    dt.setUTCDate(dt.getUTCDate() + 7);
  } else if (frequency === 'monthly') {
    const targetMonth = dt.getUTCMonth() + 1;
    dt.setUTCMonth(targetMonth);
    if (dt.getUTCDate() !== d) {
      dt.setUTCDate(0);
    }
  } else if (frequency === 'quarterly') {
    dt.setUTCMonth(dt.getUTCMonth() + 3);
    if (dt.getUTCDate() !== d) {
      dt.setUTCDate(0);
    }
  } else if (frequency === 'yearly') {
    dt.setUTCFullYear(dt.getUTCFullYear() + 1);
  }
  return dt.toISOString().slice(0, 10);
}

function escapeCsvCell(value: string | number): string {
  const raw = String(value ?? '').replace(/\r?\n/g, ' ');
  const neutralized = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

function mapTransactionRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    category: row.category,
    description: row.description || '',
    paymentMethod: row.payment_method,
    recurringPaymentId: row.recurring_payment_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBudgetRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    month: row.month,
    limitAmount: Number(row.limit_amount),
    warningThresholdPercent: Number(row.warning_threshold_percent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSavingsGoalRow(row: any, contributions: any[]) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline,
    category: row.category,
    notes: row.notes || '',
    contributions: contributions.map(c => ({
      id: c.id,
      userId: c.user_id,
      goalId: c.goal_id,
      amount: Number(c.amount),
      date: c.date,
      note: c.note || '',
      createdAt: c.created_at,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRecurringRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    paymentMethod: row.payment_method,
    frequency: row.frequency,
    kind: row.kind,
    nextDueDate: row.next_due_date,
    active: Boolean(row.active),
    lastPaidDate: row.last_paid_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCategoryRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    color: row.color,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
  };
}

// GET /api/finance/bootstrap
router.get('/bootstrap', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  initializeUserFinanceDefaults(userId);
  const db = getDb();

  const settingsRow = db
    .prepare('SELECT user_id, currency, locale, updated_at FROM finance_settings WHERE user_id = ?')
    .get(userId) as any;

  const categoriesRows = db
    .prepare('SELECT * FROM finance_categories WHERE user_id = ? ORDER BY is_default DESC, name ASC')
    .all(userId);

  const transactionRows = db
    .prepare('SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId);

  const budgetRows = db
    .prepare('SELECT * FROM finance_budgets WHERE user_id = ? ORDER BY month DESC, category ASC')
    .all(userId);

  const goalRows = db
    .prepare('SELECT * FROM finance_savings_goals WHERE user_id = ? ORDER BY deadline ASC')
    .all(userId) as any[];

  const contributionRows = db
    .prepare('SELECT * FROM finance_savings_contributions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId) as any[];

  const contribByGoal = new Map<string, any[]>();
  for (const c of contributionRows) {
    const arr = contribByGoal.get(c.goal_id) || [];
    arr.push(c);
    contribByGoal.set(c.goal_id, arr);
  }

  const recurringRows = db
    .prepare('SELECT * FROM finance_recurring_payments WHERE user_id = ? ORDER BY next_due_date ASC')
    .all(userId);

  res.json({
    settings: settingsRow
      ? {
          userId: settingsRow.user_id,
          currency: settingsRow.currency,
          locale: settingsRow.locale,
          updatedAt: settingsRow.updated_at,
        }
      : { userId, currency: 'MAD', locale: 'en-MA', updatedAt: new Date().toISOString() },
    categories: categoriesRows.map(mapCategoryRow),
    transactions: transactionRows.map(mapTransactionRow),
    budgets: budgetRows.map(mapBudgetRow),
    savingsGoals: goalRows.map(g => mapSavingsGoalRow(g, contribByGoal.get(g.id) || [])),
    recurringPayments: recurringRows.map(mapRecurringRow),
  });
});

// PATCH /api/finance/settings
router.patch('/settings', (req: AuthedRequest, res) => {
  const parsed = settingsUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid settings payload.' });
    return;
  }

  const userId = req.user!.id;
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `INSERT INTO finance_settings (user_id, currency, locale, updated_at)
     VALUES (?, ?, 'en-MA', ?)
     ON CONFLICT(user_id) DO UPDATE SET currency = excluded.currency, updated_at = excluded.updated_at`
  ).run(userId, parsed.data.currency, now);

  res.json({
    settings: {
      userId,
      currency: parsed.data.currency,
      locale: 'en-MA',
      updatedAt: now,
    },
  });
});

// CATEGORIES
router.get('/categories', (req: AuthedRequest, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM finance_categories WHERE user_id = ? ORDER BY is_default DESC, name ASC')
    .all(req.user!.id);
  res.json({ categories: rows.map(mapCategoryRow) });
});

router.post('/categories', (req: AuthedRequest, res) => {
  const parsed = categoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid category payload.' });
    return;
  }

  const userId = req.user!.id;
  const { name, type, color } = parsed.data;
  const db = getDb();

  const existing = db
    .prepare('SELECT id FROM finance_categories WHERE user_id = ? AND LOWER(name) = LOWER(?) AND type = ?')
    .get(userId, name, type);

  if (existing) {
    res.status(409).json({ error: 'This category already exists.' });
    return;
  }

  const id = `cat_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const finalColor = color || '#8EC5FF';

  db.prepare(
    `INSERT INTO finance_categories (id, user_id, name, type, color, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  ).run(id, userId, name, type, finalColor, now);

  const created = db.prepare('SELECT * FROM finance_categories WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ category: mapCategoryRow(created) });
});

router.delete('/categories/:id', (req: AuthedRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const row = db
    .prepare('SELECT * FROM finance_categories WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId) as any;

  if (!row) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  if (row.is_default) {
    res.status(400).json({ error: 'Default categories cannot be deleted.' });
    return;
  }

  db.prepare('DELETE FROM finance_categories WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  res.json({ success: true });
});

// TRANSACTIONS
router.get('/transactions', (req: AuthedRequest, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(req.user!.id);
  res.json({ transactions: rows.map(mapTransactionRow) });
});

router.post('/transactions', (req: AuthedRequest, res) => {
  const parsed = transactionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid transaction data.' });
    return;
  }

  const userId = req.user!.id;
  const { type, amount, date, category, description, paymentMethod } = parsed.data;
  const db = getDb();
  const id = `tx_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO finance_transactions (id, user_id, type, amount, date, category, description, payment_method, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, type, amount, date, category, description || '', paymentMethod, now, now);

  const created = db.prepare('SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ transaction: mapTransactionRow(created) });
});

router.patch('/transactions/:id', (req: AuthedRequest, res) => {
  const parsed = transactionUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid transaction update.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }

  const d = parsed.data;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE finance_transactions
     SET type = ?, amount = ?, date = ?, category = ?, description = ?, payment_method = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    d.type ?? existing.type,
    d.amount ?? existing.amount,
    d.date ?? existing.date,
    d.category ?? existing.category,
    d.description ?? existing.description,
    d.paymentMethod ?? existing.payment_method,
    now,
    req.params.id,
    userId
  );

  const updated = db
    .prepare('SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId);
  res.json({ transaction: mapTransactionRow(updated) });
});

router.delete('/transactions/:id', (req: AuthedRequest, res) => {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM finance_transactions WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }
  res.json({ success: true });
});

// BUDGETS
router.get('/budgets', (req: AuthedRequest, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM finance_budgets WHERE user_id = ? ORDER BY month DESC, category ASC')
    .all(req.user!.id);
  res.json({ budgets: rows.map(mapBudgetRow) });
});

router.post('/budgets', (req: AuthedRequest, res) => {
  const parsed = budgetCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid budget payload.' });
    return;
  }

  const userId = req.user!.id;
  const { category, month, limitAmount, warningThresholdPercent } = parsed.data;
  const db = getDb();

  const conflict = db
    .prepare('SELECT id FROM finance_budgets WHERE user_id = ? AND LOWER(category) = LOWER(?) AND month = ?')
    .get(userId, category, month);

  if (conflict) {
    res.status(409).json({ error: `A budget for ${category} in ${month} already exists.` });
    return;
  }

  const id = `bud_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO finance_budgets (id, user_id, category, month, limit_amount, warning_threshold_percent, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, category, month, limitAmount, warningThresholdPercent, now, now);

  const created = db.prepare('SELECT * FROM finance_budgets WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ budget: mapBudgetRow(created) });
});

router.patch('/budgets/:id', (req: AuthedRequest, res) => {
  const parsed = budgetUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid budget update.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM finance_budgets WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ error: 'Budget not found.' });
    return;
  }

  const d = parsed.data;
  const nextCategory = d.category ?? existing.category;
  const nextMonth = d.month ?? existing.month;

  const conflict = db
    .prepare('SELECT id FROM finance_budgets WHERE user_id = ? AND LOWER(category) = LOWER(?) AND month = ? AND id != ?')
    .get(userId, nextCategory, nextMonth, req.params.id);

  if (conflict) {
    res.status(409).json({ error: `Another budget for ${nextCategory} in ${nextMonth} already exists.` });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE finance_budgets
     SET category = ?, month = ?, limit_amount = ?, warning_threshold_percent = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    nextCategory,
    nextMonth,
    d.limitAmount ?? existing.limit_amount,
    d.warningThresholdPercent ?? existing.warning_threshold_percent,
    now,
    req.params.id,
    userId
  );

  const updated = db.prepare('SELECT * FROM finance_budgets WHERE id = ? AND user_id = ?').get(req.params.id, userId);
  res.json({ budget: mapBudgetRow(updated) });
});

router.delete('/budgets/:id', (req: AuthedRequest, res) => {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM finance_budgets WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Budget not found.' });
    return;
  }
  res.json({ success: true });
});

// SAVINGS GOALS
router.get('/savings-goals', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const goalRows = db
    .prepare('SELECT * FROM finance_savings_goals WHERE user_id = ? ORDER BY deadline ASC')
    .all(userId) as any[];
  const contribRows = db
    .prepare('SELECT * FROM finance_savings_contributions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId) as any[];

  const byGoal = new Map<string, any[]>();
  for (const c of contribRows) {
    const arr = byGoal.get(c.goal_id) || [];
    arr.push(c);
    byGoal.set(c.goal_id, arr);
  }

  res.json({
    savingsGoals: goalRows.map(g => mapSavingsGoalRow(g, byGoal.get(g.id) || [])),
  });
});

router.post('/savings-goals', (req: AuthedRequest, res) => {
  const parsed = savingsGoalCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid savings goal data.' });
    return;
  }

  const userId = req.user!.id;
  const { name, targetAmount, currentAmount, deadline, category, notes } = parsed.data;
  const db = getDb();
  const id = `sav_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO finance_savings_goals (id, user_id, name, target_amount, current_amount, deadline, category, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, name, targetAmount, currentAmount, deadline, category, notes || '', now, now);

  const created = db.prepare('SELECT * FROM finance_savings_goals WHERE id = ? AND user_id = ?').get(id, userId);
  res.status(201).json({ savingsGoal: mapSavingsGoalRow(created, []) });
});

router.patch('/savings-goals/:id', (req: AuthedRequest, res) => {
  const parsed = savingsGoalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid savings goal update.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM finance_savings_goals WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ error: 'Savings goal not found.' });
    return;
  }

  const d = parsed.data;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE finance_savings_goals
     SET name = ?, target_amount = ?, current_amount = ?, deadline = ?, category = ?, notes = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    d.name ?? existing.name,
    d.targetAmount ?? existing.target_amount,
    d.currentAmount ?? existing.current_amount,
    d.deadline ?? existing.deadline,
    d.category ?? existing.category,
    d.notes ?? existing.notes,
    now,
    req.params.id,
    userId
  );

  const updated = db
    .prepare('SELECT * FROM finance_savings_goals WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId);
  const contribs = db
    .prepare('SELECT * FROM finance_savings_contributions WHERE goal_id = ? AND user_id = ? ORDER BY date DESC')
    .all(req.params.id, userId) as any[];

  res.json({ savingsGoal: mapSavingsGoalRow(updated, contribs) });
});

router.delete('/savings-goals/:id', (req: AuthedRequest, res) => {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM finance_savings_goals WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Savings goal not found.' });
    return;
  }
  res.json({ success: true });
});

router.post('/savings-goals/:id/contributions', (req: AuthedRequest, res) => {
  const parsed = contributionCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid contribution data.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const goal = db
    .prepare('SELECT * FROM finance_savings_goals WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId) as any;

  if (!goal) {
    res.status(404).json({ error: 'Savings goal not found.' });
    return;
  }

  const { amount, date, note, alsoRecordExpense } = parsed.data;
  const now = new Date().toISOString();
  const contribId = `sc_${crypto.randomUUID()}`;
  const nextCurrent = Math.round((Number(goal.current_amount) + amount) * 100) / 100;

  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO finance_savings_contributions (id, user_id, goal_id, amount, date, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(contribId, userId, goal.id, amount, date, note || '', now);

    db.prepare(
      `UPDATE finance_savings_goals SET current_amount = ?, updated_at = ? WHERE id = ? AND user_id = ?`
    ).run(nextCurrent, now, goal.id, userId);

    let createdTransaction: any = null;
    if (alsoRecordExpense) {
      const txId = `tx_${crypto.randomUUID()}`;
      db.prepare(
        `INSERT INTO finance_transactions (id, user_id, type, amount, date, category, description, payment_method, created_at, updated_at)
         VALUES (?, ?, 'expense', ?, ?, 'Other', ?, 'Bank Transfer', ?, ?)`
      ).run(txId, userId, amount, date, `Savings contribution: ${goal.name}`, now, now);
      createdTransaction = mapTransactionRow(
        db.prepare('SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?').get(txId, userId)
      );
    }

    db.exec('COMMIT');

    const updatedGoal = db
      .prepare('SELECT * FROM finance_savings_goals WHERE id = ? AND user_id = ?')
      .get(goal.id, userId);
    const contribs = db
      .prepare('SELECT * FROM finance_savings_contributions WHERE goal_id = ? AND user_id = ? ORDER BY date DESC, created_at DESC')
      .all(goal.id, userId) as any[];

    res.status(201).json({
      savingsGoal: mapSavingsGoalRow(updatedGoal, contribs),
      createdTransaction,
    });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
});

// RECURRING PAYMENTS
router.get('/recurring', (req: AuthedRequest, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM finance_recurring_payments WHERE user_id = ? ORDER BY next_due_date ASC')
    .all(req.user!.id);
  res.json({ recurringPayments: rows.map(mapRecurringRow) });
});

router.post('/recurring', (req: AuthedRequest, res) => {
  const parsed = recurringCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid recurring payment data.' });
    return;
  }

  const userId = req.user!.id;
  const d = parsed.data;
  const id = `rec_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(
    `INSERT INTO finance_recurring_payments
     (id, user_id, title, type, amount, category, payment_method, frequency, kind, next_due_date, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    d.title,
    d.type,
    d.amount,
    d.category,
    d.paymentMethod,
    d.frequency,
    d.kind,
    d.nextDueDate,
    d.active ? 1 : 0,
    now,
    now
  );

  const created = db
    .prepare('SELECT * FROM finance_recurring_payments WHERE id = ? AND user_id = ?')
    .get(id, userId);
  res.status(201).json({ recurringPayment: mapRecurringRow(created) });
});

router.patch('/recurring/:id', (req: AuthedRequest, res) => {
  const parsed = recurringUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid recurring payment update.' });
    return;
  }

  const userId = req.user!.id;
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM finance_recurring_payments WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ error: 'Recurring payment not found.' });
    return;
  }

  const d = parsed.data;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE finance_recurring_payments
     SET title = ?, type = ?, amount = ?, category = ?, payment_method = ?, frequency = ?, kind = ?, next_due_date = ?, active = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    d.title ?? existing.title,
    d.type ?? existing.type,
    d.amount ?? existing.amount,
    d.category ?? existing.category,
    d.paymentMethod ?? existing.payment_method,
    d.frequency ?? existing.frequency,
    d.kind ?? existing.kind,
    d.nextDueDate ?? existing.next_due_date,
    d.active !== undefined ? (d.active ? 1 : 0) : existing.active,
    now,
    req.params.id,
    userId
  );

  const updated = db
    .prepare('SELECT * FROM finance_recurring_payments WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId);
  res.json({ recurringPayment: mapRecurringRow(updated) });
});

router.delete('/recurring/:id', (req: AuthedRequest, res) => {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM finance_recurring_payments WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user!.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Recurring payment not found.' });
    return;
  }
  res.json({ success: true });
});

// POST /api/finance/recurring/:id/pay — Log payment transaction & advance next_due_date
router.post('/recurring/:id/pay', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM finance_recurring_payments WHERE id = ? AND user_id = ?')
    .get(req.params.id, userId) as any;

  if (!existing) {
    res.status(404).json({ error: 'Recurring payment not found.' });
    return;
  }

  const paidDate = new Date().toISOString().slice(0, 10);
  const nextDue = advanceDueDate(existing.next_due_date, existing.frequency);
  const now = new Date().toISOString();
  const txId = `tx_${crypto.randomUUID()}`;

  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO finance_transactions
       (id, user_id, type, amount, date, category, description, payment_method, recurring_payment_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      txId,
      userId,
      existing.type,
      existing.amount,
      paidDate,
      existing.category,
      `Recurring: ${existing.title}`,
      existing.payment_method,
      existing.id,
      now,
      now
    );

    db.prepare(
      `UPDATE finance_recurring_payments
       SET next_due_date = ?, last_paid_date = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).run(nextDue, paidDate, now, existing.id, userId);

    db.exec('COMMIT');

    const createdTx = db
      .prepare('SELECT * FROM finance_transactions WHERE id = ? AND user_id = ?')
      .get(txId, userId);
    const updatedRec = db
      .prepare('SELECT * FROM finance_recurring_payments WHERE id = ? AND user_id = ?')
      .get(existing.id, userId);

    res.status(201).json({
      transaction: mapTransactionRow(createdTx),
      recurringPayment: mapRecurringRow(updatedRec),
    });
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
});

// GET /api/finance/export.csv
router.get('/export.csv', (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const settings = db
    .prepare('SELECT currency FROM finance_settings WHERE user_id = ?')
    .get(userId) as { currency: string } | undefined;
  const currency = settings?.currency || 'MAD';

  const rows = db
    .prepare('SELECT * FROM finance_transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC')
    .all(userId) as any[];

  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Currency', 'Payment Method', 'Description'];
  const csvRows = rows.map(r => [
    escapeCsvCell(r.id),
    escapeCsvCell(r.date),
    escapeCsvCell(r.type),
    escapeCsvCell(r.category),
    escapeCsvCell(Number(r.amount).toFixed(2)),
    escapeCsvCell(currency),
    escapeCsvCell(r.payment_method),
    escapeCsvCell(r.description || ''),
  ]);

  const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="momentum_finance_${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.send(csvContent);
});

export default router;
