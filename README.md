# MOMENTUM — Personal Life Operating System

> **“Don’t just track what you do. Track who you’re becoming.”**

MOMENTUM is a cohesive, production-grade personal productivity and life-management platform built to bridge long-term ambition with daily execution.

---

## 1. Official Brand Identity & Visual System

MOMENTUM strictly incorporates four foundational brand colors:

| Color Role | Name | Hex Code |
| :--- | :--- | :--- |
| **Primary Brown** | Brand Foundation & Sidebar | `#64432B` |
| **Warm Amber** | Primary Actions & Active Indicators | `#D2925B` |
| **Charcoal Blue** | Main Canvas Background & Cards | `#333C44` (and `#242B31` dark ground) |
| **Muted Sage** | Secondary & Tertiary Accents | `#868A7A` |

---

## 2. Core Functional Modules

1. **Overview (Command Center)**: Time-based greeting, daily execution score, Top 3 priorities, upcoming deadlines, active goals with progress rings, habit checkoff, and weekly productivity rhythm.
2. **Today (Daily Command Center)**: 3-Priority anchor system (selection, completion, reordering), timeline schedule blocking, unscheduled task queue, and end-of-day reflection saving directly to the Journal.
3. **Tasks**: Inbox, To Do, In Progress, and Completed states; Kanban board and list view; filter by area and priority; subtask checklist editor; duration estimates vs actuals.
4. **Calendar**: Month view, Day detail inspector, color-coded task deadlines, workouts, study sessions, and custom schedule blocks.
5. **Goals & Long-Term Vision**: 6-level hierarchy (Vision → Annual Goals → 90-Day Plans → Milestones → Projects → Tasks); weekly checkpoints; transparent progress calculations.
6. **Projects**: Multi-stage initiatives with milestone tracking, direct task linkage, and progress calculations.
7. **Learning (Knowledge Center)**: Curated courses across Cybersecurity, Systems Architecture, and Computer Networks; lessons with rich objectives; dedicated study session timer and logs.
8. **Fitness (Physical Vitality)**: Workout routines (Upper, Lower, Push, Pull, Custom); workout logger with sets, reps, weight (kg), and volume metrics; personal record benchmarks.
9. **Habits (Consistency Engine)**: Daily and weekday cadences; 14-day visual streak heatmap; skip-with-reason feature to prevent guilt while preserving psychological momentum.
10. **Analytics**: Real progress tracking distinguishing planned effort, deliberate time spent, and actual outcome completions; CSV exports for tasks and goals.
11. **Journal**: Private reflections (Daily, Weekly, Gratitude, Lessons Learned); mood logging; tag search; 100% private.
12. **Resources**: Reference vault for technical books, research papers, and documentation links.
13. **Focus Timer**: Accurate timestamp-based Pomodoro timer (25/5, 50/10, Custom) with task linking, chime notifications, and full-screen focus mode.

---

## 3. Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons.
- **State & Persistence**: Decoupled repository architecture with local storage persistence and full Supabase client compatibility.
- **Unit Testing**: Node built-in test runner (`node:test`, `node:assert/strict`) executed via `npx --yes tsx --test`.
- **Database**: PostgreSQL schema with Row Level Security (`supabase/migrations/20261109000000_momentum_core.sql`).

---

## 4. Setup & Running Locally

### Development
```bash
# Install dependencies
npm install

# Run unit tests
npx --yes tsx --test src/lib/logic.test.ts

# Start dev server
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 5. Database Deployment (Supabase)

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Navigate to the SQL Editor and execute `supabase/migrations/20261109000000_momentum_core.sql`.
3. Set your environment variables in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 6. Notion Life OS Integration

MOMENTUM provides a modular integration boundary for Notion:
1. Obtain an internal integration secret from `notion.so/my-integrations`.
2. Connect your target Notion database ID via environment variables (`NOTION_API_KEY`, `NOTION_DATABASE_ID`).
3. MOMENTUM will synchronize task updates and project milestones without hard dependencies.

---

## 7. Security & Privacy Guarantees

- **No Third-Party Telemetry**: Private journal entries and personal availability goals remain exclusively on your authenticated device or your private database.
- **Row Level Security**: Every table enforces `auth.uid() = user_id`.
- **Drift-Free Timers**: The focus timer calculates remaining time from system clock timestamps (`Date.now()`), avoiding JavaScript interval throttling when tabs are in the background.
