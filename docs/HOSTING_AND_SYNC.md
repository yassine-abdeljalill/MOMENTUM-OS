# MOMENTUM — Persistent Database, Cross-Device Sync & Hosting Guide

## 1. Why a Shared Server Is Required

If the Node.js server and SQLite database run only on `localhost` on your MacBook:
- Your iPhone (on cellular or a separate network) cannot reach `127.0.0.1:3000`.
- Browser `localStorage` lives inside a single browser profile and does not sync across devices.

For MacBook ↔ iPhone / PWA synchronization, deploy MOMENTUM to a **shared HTTPS host** connected to a **persistent disk volume**, and sign into the same MOMENTUM account on both devices.

---

## 2. Database & Migration Architecture

- **Engine**: Node.js built-in SQLite (`node:sqlite` `DatabaseSync`) with `WAL` journal mode, `foreign_keys = ON`, `busy_timeout = 5000`, and `synchronous = NORMAL`.
- **Database Location**: Controlled by `MOMENTUM_DATA_DIR` (defaults to `./data`, creating `<MOMENTUM_DATA_DIR>/momentum.db`).
- **Idempotent Versioned Migrations**: Executed automatically on server startup via `runWorkspaceMigrations(db)` in `server/migrations.ts`, tracked in `schema_migrations`:
  - `workspace_sync_meta` & `workspace_sync_imports` (per-user monotonic sync versions & idempotent local migration tracking)
  - `workspace_profiles` & `workspace_preferences`
  - `workspace_tasks`, `workspace_daily_priorities`, `workspace_goals`, `workspace_ninety_day_plans`, `workspace_projects`
  - `workspace_habits`, `workspace_habit_completions`, `workspace_schedule_activities`
  - `workspace_journal_entries`, `workspace_focus_sessions`, `workspace_workout_routines`, `workspace_workout_sessions`
  - `workspace_courses`, `workspace_study_sessions`, `workspace_resources`, `workspace_notifications`
  - Plus existing user-scoped tables for Learning (`learning_*`) and Finance (`finance_*`, `assets`, `transactions`, `budgets`, `financial_goals`).
- **Ownership Isolation**: Every table enforces `PRIMARY KEY (user_id, id)` and every query filters by authenticated `req.user.id` derived strictly from the server-verified session token (client-supplied user IDs are never trusted).

---

## 3. Sync Flow, First-Connect Migration & Conflict Handling

1. **First-Connect Local Migration**:
   - When a signed-in user connects from a device with local edits, `POST /api/workspace/migrate` imports records under an `importKey` (`mig_<deviceId>_<userId>`), skipping duplicate imports (`workspace_sync_imports`) and deduplicating matching content fingerprints.
   - Untouched demo boilerplate is automatically skipped so signing into a real account never pollutes existing cloud data.
2. **Offline Outbox & Delta Sync**:
   - Local changes write immediately to UI + `localStorage` outbox (`momentum_sync_outbox_<userId>`) and flush to `POST /api/workspace/sync` within ~450ms (and on `pagehide` / `visibilitychange` with `keepalive: true`).
   - Reopening the app or PWA, regaining connectivity (`online`), focusing the window (`focus`), or clicking **Sync Now** in Settings fetches `GET /api/workspace/bootstrap?sinceVersion=N` (returning changed rows + deletion tombstones).
3. **Two-Device Conflict Resolution**:
   - Mutations include client ISO `updatedAt` and optional `baseUpdatedAt`.
   - `resolveRecordConflict` keeps the newer timestamp (`client_wins_merged` vs `server_wins`), prevents identical retries, and propagates explicit deletions via `deleted_at` tombstones.

---

## 4. Shared Hosting Requirements & Recommended Platforms

Deploy MOMENTUM as a single Node.js service (`npm run build && npm start`) using `node:sqlite` (requires **Node.js 22.5+**):

### Essential Hosting Checklist
1. **Persistent Disk Volume (Critical)**:
   - Ephemeral container filesystems wipe `/app/data` on redeploy/restart!
   - Attach a persistent block/disk volume and set `MOMENTUM_DATA_DIR=/var/data/momentum` (or your platform's mount path).
2. **Environment Variables**:
   - `PORT=3000` (or platform-assigned `PORT`)
   - `APP_URL=https://momentum.yourdomain.com`
   - `MOMENTUM_DATA_DIR=/var/data/momentum`
   - `SESSION_SECRET=<at-least-32-random-bytes>` (generate with `openssl rand -hex 32`)
3. **HTTPS Termination**:
   - Required by Safari / iOS for PWA Home Screen installation, Service Workers, and `HttpOnly; SameSite=Lax; Secure` session cookies.
4. **Single-Writer Process**:
   - Run 1 Node.js instance attached to the SQLite volume (`WAL` handles concurrent reads across HTTP requests smoothly).

### Compatible Hosting Options
- **Fly.io**: Create a Fly Volume (`fly volumes create momentum_data`) mounted at `/data` and set `MOMENTUM_DATA_DIR=/data`.
- **Render / Railway**: Attach a Persistent Disk / Volume mounted at `/var/data` and set `MOMENTUM_DATA_DIR=/var/data`.
- **Ubuntu/Debian VPS + Caddy/Nginx**: Reverse-proxy HTTPS to `127.0.0.1:3000` with systemd managing `npm start` and store `momentum.db` on `/var/lib/momentum`.

### Automated Backups
Back up SQLite safely online using SQLite's `.backup` API or `sqlite3 "$MOMENTUM_DATA_DIR/momentum.db" ".backup /backups/momentum-$(date +%F).db"` (or volume snapshots). Do **not** copy `.db` without its `-wal` file while active unless using `.backup`.

### When to Migrate Beyond SQLite
SQLite on a single shared persistent server easily supports thousands of daily synced records per user for personal or small-team deployments. Consider PostgreSQL only if you later need horizontal multi-region app replicas writing concurrently to the database.
