-- MOMENTUM — Personal Finance Management Schema
-- PostgreSQL & Supabase Migration with Row Level Security (RLS)

CREATE TABLE IF NOT EXISTS finance_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'MAD' CHECK (currency IN ('MAD', 'USD', 'EUR', 'GBP', 'CAD', 'CHF', 'AED', 'SAR')),
  locale TEXT NOT NULL DEFAULT 'en-MA',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  color TEXT DEFAULT '#8EC5FF',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  payment_method TEXT NOT NULL,
  recurring_payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  limit_amount NUMERIC(14,2) NOT NULL CHECK (limit_amount > 0),
  warning_threshold_percent INTEGER DEFAULT 80 CHECK (warning_threshold_percent BETWEEN 10 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

CREATE TABLE IF NOT EXISTS finance_savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE NOT NULL,
  category TEXT DEFAULT 'General',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_savings_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES finance_savings_goals(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_recurring_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  kind TEXT NOT NULL CHECK (kind IN ('subscription', 'rent', 'internet_phone', 'recurring_income', 'custom')),
  next_due_date DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  last_paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_recurring_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own finance settings" ON finance_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own finance categories" ON finance_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own finance transactions" ON finance_transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own finance budgets" ON finance_budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own finance savings goals" ON finance_savings_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own finance savings contributions" ON finance_savings_contributions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own finance recurring payments" ON finance_recurring_payments
  FOR ALL USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_finance_tx_user_date ON finance_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_user_month ON finance_budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_finance_goals_user ON finance_savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_recurring_user_due ON finance_recurring_payments(user_id, next_due_date);
