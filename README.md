# MOMENTUM — Personal Life Operating System

> **“Don’t just track what you do. Track who you’re becoming.”**

MOMENTUM is a cross-device personal productivity and life-management platform built with an Apple-inspired monochrome light/dark design system, PWA installability, and authenticated SQLite cloud synchronization.

---

## 1. Visual Design System

MOMENTUM uses a calm, monochrome palette paired with system Light & Dark modes:

| Surface / Role | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| **Canvas Background** | `#F5F5F7` | `#000000` |
| **Elevated Card** | `#FFFFFF` | `#161618` |
| **Primary Ink** | `#1D1D1F` | `#F5F5F7` |
| **Secondary Ink** | `#6E6E73` | `#A1A1A6` |

---

## 2. Core Functional Modules

1. **Overview & Today Command Center**: Daily execution score, Top 3 priorities, schedule timeline, quick add, and evening reflection.
2. **Tasks & Kanban**: Inbox, To Do, In Progress, Completed states, subtask checklists, priority ranks, and Focus Timer linking.
3. **Calendar**: Month & week/day schedule inspector unifying task deadlines, workouts, study sessions, and custom time blocks.
4. **Goals & 90-Day Plans**: Hierarchy from Personal Vision → Goals → 90-Day Plans → Weekly Checkpoints → Milestones → Projects.
5. **Projects**: Multi-stage initiatives with milestones and linked tasks.
6. **Learning Management Center**: Structured modules, lessons, markdown notes, study sessions, and synced learning tasks (`/api/learning`).
7. **Finance Tracker**: Multi-account balances, cashflow transactions, budgets, and savings goals (`/api/finance`).
8. **Fitness & Habits**: Workout routines/sessions, daily/weekday habit cadences, streaks, and skip reasons.
9. **Journal & Resources**: Private daily/weekly reflections and structured reference vault.
10. **Focus Timer & Analytics**: Timestamp-accurate Pomodoro timer and completion metrics.

---

## 3. Cross-Device Synchronization Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Lucide icons.
- **Backend**: Express + TypeScript (`server.ts`) with Node built-in SQLite (`node:sqlite`), `WAL` mode, versioned schema migrations (`server/migrations.ts`), and strict Zod payload validation.
- **Sync Engine**: Client-side offline outbox (`src/lib/syncEngine.ts`), duplicate-safe first-connect `localStorage` migration (`/api/workspace/migrate`), incremental delta bootstrap with delete tombstones (`/api/workspace/bootstrap`), and two-device conflict resolution (`/api/workspace/sync`).
- **Demo Mode**: Preserved cleanly when using guest/demo mode without polluting authenticated accounts.

See [`docs/HOSTING_AND_SYNC.md`](./docs/HOSTING_AND_SYNC.md) for persistent database volume requirements, shared-server deployment steps (Fly.io, Render, Railway, VPS), backup instructions, and MacBook ↔ iPhone setup.

---

## 4. Setup & Running Locally

Requires **Node.js 22.5+** (for built-in `node:sqlite`).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Run unit & API integration tests
npx --yes tsx --test src/lib/*.test.ts server/*.test.ts

# 4. Start full-stack dev server (Express + Vite on http://localhost:3000)
npm run dev
```

### Production Build & Start
```bash
npm run build
npm start
```

---

## 5. Security & Ownership Guarantees

- **Strict Account Isolation**: Every workspace, learning, and finance table scopes rows by authenticated `user_id` derived solely from signed `HttpOnly` sessions / bearer tokens. Client-supplied `userId` values are ignored.
- **Private Data Protection**: Journal entries and financial ledgers are strictly bound to the authenticated account, and signing out clears cached workspace state cleanly.
- **Server-Side Validation**: All `/api/auth`, `/api/workspace`, `/api/learning`, and `/api/finance` inputs are validated with Zod before hitting SQLite.
