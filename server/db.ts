import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'momentum.db');

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      is_workspace INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_settings (
      user_id TEXT PRIMARY KEY,
      currency TEXT NOT NULL DEFAULT 'MAD',
      locale TEXT NOT NULL DEFAULT 'en-MA',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
      color TEXT NOT NULL DEFAULT '#9ECCFD',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, name, type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL,
      recurring_payment_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      month TEXT NOT NULL,
      limit_amount REAL NOT NULL CHECK (limit_amount > 0),
      warning_threshold_percent INTEGER NOT NULL DEFAULT 80 CHECK (warning_threshold_percent BETWEEN 10 AND 100),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, category, month),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_savings_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL CHECK (target_amount > 0),
      current_amount REAL NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
      deadline TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_savings_contributions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal_id TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES finance_savings_goals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS finance_recurring_payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      category TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
      kind TEXT NOT NULL CHECK (kind IN ('subscription', 'rent', 'internet_phone', 'recurring_income', 'custom')),
      next_due_date TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      last_paid_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_modules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#9ECCFD',
      icon TEXT NOT NULL DEFAULT 'book',
      status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_lessons (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      teacher_name TEXT NOT NULL DEFAULT '',
      lesson_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
      learning_objectives TEXT NOT NULL DEFAULT '[]',
      study_duration_minutes INTEGER NOT NULL DEFAULT 45,
      sort_order INTEGER NOT NULL DEFAULT 0,
      last_opened_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_html TEXT NOT NULL DEFAULT '',
      plain_text TEXT NOT NULL DEFAULT '',
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES learning_lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_resources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      lesson_id TEXT,
      kind TEXT NOT NULL CHECK (kind IN ('file', 'link')),
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      folder_name TEXT NOT NULL DEFAULT 'General',
      external_url TEXT,
      original_filename TEXT,
      storage_filename TEXT,
      mime_type TEXT,
      file_size INTEGER NOT NULL DEFAULT 0,
      file_extension TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES learning_lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      lesson_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      task_kind TEXT NOT NULL DEFAULT 'task' CHECK (task_kind IN ('task', 'assignment', 'lab', 'exercise')),
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      due_date TEXT NOT NULL DEFAULT '',
      subtasks TEXT NOT NULL DEFAULT '[]',
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES learning_lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      module_id TEXT,
      lesson_id TEXT,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL DEFAULT '09:00',
      end_time TEXT NOT NULL DEFAULT '10:00',
      duration_minutes INTEGER NOT NULL DEFAULT 45,
      what_was_learned TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE SET NULL,
      FOREIGN KEY (lesson_id) REFERENCES learning_lessons(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_fin_tx_user_date ON finance_transactions(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_fin_budgets_user_month ON finance_budgets(user_id, month);
    CREATE INDEX IF NOT EXISTS idx_fin_goals_user ON finance_savings_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_fin_recurring_user_due ON finance_recurring_payments(user_id, next_due_date);
    CREATE INDEX IF NOT EXISTS idx_learn_modules_user_order ON learning_modules(user_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_learn_lessons_user_mod ON learning_lessons(user_id, module_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_learn_notes_user_lesson ON learning_notes(user_id, lesson_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_learn_resources_user_mod_les ON learning_resources(user_id, module_id, lesson_id);
    CREATE INDEX IF NOT EXISTS idx_learn_tasks_user_mod_les ON learning_tasks(user_id, module_id, lesson_id);
    CREATE INDEX IF NOT EXISTS idx_learn_study_user_date ON learning_study_sessions(user_id, date DESC);
  `);

  const userCols = db.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
  if (!userCols.some(c => c.name === 'is_workspace')) {
    db.exec(`ALTER TABLE users ADD COLUMN is_workspace INTEGER NOT NULL DEFAULT 0;`);
  }

  dbInstance = db;
  return db;
}

export function getDataDir(): string {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return DATA_DIR;
}

export function getLearningUploadsDir(userId?: string): string {
  const base = path.join(getDataDir(), 'learning_uploads');
  if (!fs.existsSync(base)) {
    fs.mkdirSync(base, { recursive: true });
  }
  if (!userId) return base;
  const safeUserDir = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const userDir = path.join(base, safeUserDir);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}
