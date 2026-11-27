import type { DatabaseSync } from 'node:sqlite';

interface MigrationDefinition {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

const WORKSPACE_COLLECTION_DDL = `
  CREATE TABLE IF NOT EXISTS workspace_sync_meta (
    user_id TEXT PRIMARY KEY,
    sync_version INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_sync_imports (
    user_id TEXT NOT NULL,
    import_key TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'local_migration',
    imported_count INTEGER NOT NULL DEFAULT 0,
    imported_at TEXT NOT NULL,
    PRIMARY KEY (user_id, import_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_profiles (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    preferred_language TEXT NOT NULL DEFAULT 'English',
    life_areas_json TEXT NOT NULL DEFAULT '[]',
    vision_statement TEXT NOT NULL DEFAULT '',
    daily_availability_hours REAL NOT NULL DEFAULT 3.5,
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'light',
    accent_color TEXT NOT NULL DEFAULT '#1D1D1F',
    start_of_week TEXT NOT NULL DEFAULT 'monday',
    time_format TEXT NOT NULL DEFAULT '24h',
    date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    default_dashboard TEXT NOT NULL DEFAULT 'overview',
    default_task_view TEXT NOT NULL DEFAULT 'board',
    enable_browser_notifications INTEGER NOT NULL DEFAULT 0,
    daily_reminder_time TEXT NOT NULL DEFAULT '08:00',
    sound_enabled INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    sync_version INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_tasks (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT NOT NULL DEFAULT 'other',
    due_date TEXT,
    is_daily_priority INTEGER NOT NULL DEFAULT 0,
    priority_rank INTEGER,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_daily_priorities (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    date TEXT NOT NULL,
    task_id TEXT NOT NULL,
    rank INTEGER NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_goals (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    category TEXT NOT NULL DEFAULT 'personal_development',
    target_date TEXT NOT NULL DEFAULT '',
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_ninety_day_plans (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    goal_id TEXT NOT NULL DEFAULT '',
    quarter TEXT NOT NULL DEFAULT '',
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_projects (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning',
    category TEXT NOT NULL DEFAULT 'other',
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_habits (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'health',
    frequency TEXT NOT NULL DEFAULT 'daily',
    active INTEGER NOT NULL DEFAULT 1,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_habit_completions (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    habit_id TEXT NOT NULL,
    date TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_schedule_activities (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    completed INTEGER NOT NULL DEFAULT 0,
    task_id TEXT,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_journal_entries (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'daily_reflection',
    mood TEXT,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_focus_sessions (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    task_id TEXT,
    session_type TEXT NOT NULL DEFAULT 'focus',
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    start_time TEXT NOT NULL,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_workout_routines (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_workout_sessions (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    routine_name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_courses (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'active',
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_study_sessions (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    course_id TEXT,
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_resources (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    resource_type TEXT NOT NULL DEFAULT 'website',
    category TEXT NOT NULL DEFAULT 'other',
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_notifications (
    user_id TEXT NOT NULL,
    id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    read INTEGER NOT NULL DEFAULT 0,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    sync_version INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_w_tasks_user_ver ON workspace_tasks(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_daily_prio_user_ver ON workspace_daily_priorities(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_goals_user_ver ON workspace_goals(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_ndp_user_ver ON workspace_ninety_day_plans(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_projects_user_ver ON workspace_projects(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_habits_user_ver ON workspace_habits(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_habit_comp_user_ver ON workspace_habit_completions(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_habit_comp_lookup ON workspace_habit_completions(user_id, habit_id, date);
  CREATE INDEX IF NOT EXISTS idx_w_sched_user_date ON workspace_schedule_activities(user_id, date, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_journal_user_date ON workspace_journal_entries(user_id, date DESC, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_focus_user_ver ON workspace_focus_sessions(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_wroutine_user_ver ON workspace_workout_routines(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_wsession_user_ver ON workspace_workout_sessions(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_courses_user_ver ON workspace_courses(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_study_user_ver ON workspace_study_sessions(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_resources_user_ver ON workspace_resources(user_id, sync_version);
  CREATE INDEX IF NOT EXISTS idx_w_notif_user_ver ON workspace_notifications(user_id, sync_version);
`;

const MIGRATIONS: MigrationDefinition[] = [
  {
    version: 1,
    name: '001_workspace_sync_architecture',
    up: db => {
      db.exec(WORKSPACE_COLLECTION_DDL);
    },
  },
];

export function runWorkspaceMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db
    .prepare('SELECT version FROM schema_migrations')
    .all() as { version: number }[];
  const applied = new Set(appliedRows.map(r => Number(r.version)));

  const insertMigration = db.prepare(
    'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;

    db.exec('BEGIN IMMEDIATE');
    try {
      migration.up(db);
      insertMigration.run(migration.version, migration.name, new Date().toISOString());
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}
