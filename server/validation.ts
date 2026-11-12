import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const yearMonthRegex = /^\d{4}-\d{2}$/;

const roundMoney = (val: number) => Math.round(val * 100) / 100;

export const ALLOWED_CURRENCIES = ['MAD', 'USD', 'EUR', 'GBP', 'CAD', 'CHF', 'AED', 'SAR'] as const;
export const PAYMENT_METHODS = [
  'Cash',
  'Debit Card',
  'Credit Card',
  'Bank Transfer',
  'Mobile Wallet',
  'Other',
] as const;

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(160),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(160),
  password: z.string().min(1, 'Password is required.').max(128),
});

export const settingsUpdateSchema = z.object({
  currency: z.enum(ALLOWED_CURRENCIES),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required.').max(40),
  type: z.enum(['income', 'expense', 'both']),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code.')
    .optional(),
});

export const transactionCreateSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .number()
    .finite('Amount must be a valid number.')
    .positive('Amount must be greater than zero.')
    .max(1_000_000_000, 'Amount exceeds maximum allowed limit.')
    .transform(roundMoney),
  date: z.string().regex(isoDateRegex, 'Date must be in YYYY-MM-DD format.'),
  category: z.string().trim().min(1, 'Category is required.').max(60),
  description: z.string().trim().max(240).optional().default(''),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const budgetCreateSchema = z.object({
  category: z.string().trim().min(1, 'Category is required.').max(60),
  month: z.string().regex(yearMonthRegex, 'Month must be in YYYY-MM format.'),
  limitAmount: z
    .number()
    .finite('Limit must be a valid number.')
    .positive('Budget limit must be greater than zero.')
    .max(1_000_000_000, 'Budget limit exceeds maximum allowed limit.')
    .transform(roundMoney),
  warningThresholdPercent: z.number().int().min(10).max(100).optional().default(80),
});

export const budgetUpdateSchema = z.object({
  category: z.string().trim().min(1).max(60).optional(),
  month: z.string().regex(yearMonthRegex).optional(),
  limitAmount: z
    .number()
    .finite()
    .positive()
    .max(1_000_000_000)
    .transform(roundMoney)
    .optional(),
  warningThresholdPercent: z.number().int().min(10).max(100).optional(),
});

export const savingsGoalCreateSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required.').max(100),
  targetAmount: z
    .number()
    .finite()
    .positive('Target amount must be greater than zero.')
    .max(1_000_000_000)
    .transform(roundMoney),
  currentAmount: z
    .number()
    .finite()
    .min(0, 'Saved amount cannot be negative.')
    .max(1_000_000_000)
    .transform(roundMoney)
    .optional()
    .default(0),
  deadline: z.string().regex(isoDateRegex, 'Deadline must be in YYYY-MM-DD format.'),
  category: z.string().trim().min(1).max(50).optional().default('General'),
  notes: z.string().trim().max(300).optional().default(''),
});

export const savingsGoalUpdateSchema = savingsGoalCreateSchema.partial();

export const contributionCreateSchema = z.object({
  amount: z
    .number()
    .finite()
    .positive('Contribution must be greater than zero.')
    .max(1_000_000_000)
    .transform(roundMoney),
  date: z.string().regex(isoDateRegex, 'Date must be in YYYY-MM-DD format.'),
  note: z.string().trim().max(200).optional().default(''),
  alsoRecordExpense: z.boolean().optional().default(false),
});

export const recurringCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(100),
  type: z.enum(['income', 'expense']),
  amount: z
    .number()
    .finite()
    .positive('Amount must be greater than zero.')
    .max(1_000_000_000)
    .transform(roundMoney),
  category: z.string().trim().min(1, 'Category is required.').max(60),
  paymentMethod: z.enum(PAYMENT_METHODS),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  kind: z.enum(['subscription', 'rent', 'internet_phone', 'recurring_income', 'custom']),
  nextDueDate: z.string().regex(isoDateRegex, 'Due date must be in YYYY-MM-DD format.'),
  active: z.boolean().optional().default(true),
});

export const recurringUpdateSchema = recurringCreateSchema.partial();
