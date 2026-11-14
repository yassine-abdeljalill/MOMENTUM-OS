import React from 'react';
import {
  LayoutDashboard,
  SunMedium,
  CheckSquare,
  CalendarDays,
  Target,
  FolderGit2,
  GraduationCap,
  Dumbbell,
  Sparkles,
  BarChart3,
  BookOpen,
  Library,
  Wallet,
} from 'lucide-react';
import type { NavigationTab } from '../../lib/context';
import type { AppState } from '../../lib/storage';

export interface NavItemConfig {
  id: NavigationTab;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  badge?: (state: AppState) => number | null;
}

export interface NavGroupConfig {
  id: string;
  label: string;
  items: NavItemConfig[];
}

export const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      { id: 'overview', label: 'Overview', shortLabel: 'Home', icon: LayoutDashboard },
      {
        id: 'today',
        label: 'Today',
        icon: SunMedium,
        badge: (state) => {
          const topCount = state.tasks.filter(t => t.isDailyPriority && t.status !== 'completed').length;
          return topCount > 0 ? topCount : null;
        },
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: CheckSquare,
        badge: (state) => {
          const pending = state.tasks.filter(t => t.status !== 'completed').length;
          return pending > 0 ? pending : null;
        },
      },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays },
      { id: 'goals', label: 'Goals', icon: Target },
      { id: 'projects', label: 'Projects', icon: FolderGit2 },
    ],
  },
  {
    id: 'personal',
    label: 'Personal Dev',
    items: [
      { id: 'learning', label: 'Learning', icon: GraduationCap },
      { id: 'fitness', label: 'Fitness', icon: Dumbbell },
      { id: 'habits', label: 'Habits', icon: Sparkles },
    ],
  },
  {
    id: 'life',
    label: 'Life Management',
    items: [
      { id: 'finance', label: 'Finance', icon: Wallet },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'journal', label: 'Journal', icon: BookOpen },
      { id: 'resources', label: 'Resources', icon: Library },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItemConfig[] = NAV_GROUPS.flatMap(g => g.items);

export const MOBILE_PRIMARY_TAB_IDS: NavigationTab[] = [
  'overview',
  'today',
  'tasks',
  'calendar',
];

export const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Central Command Center' },
  today: { title: 'Today', subtitle: 'Daily Execution & 3 Core Priorities' },
  tasks: { title: 'Tasks', subtitle: 'Actionable Responsibilities & Kanban' },
  calendar: { title: 'Calendar', subtitle: 'Month, Week & Day Time Blocking' },
  goals: { title: 'Goals', subtitle: 'Long-Term Vision & 90-Day Plans' },
  projects: { title: 'Projects', subtitle: 'Initiatives & Deliverables' },
  learning: { title: 'Learning', subtitle: 'Knowledge Center & Courses' },
  fitness: { title: 'Fitness', subtitle: 'Physical Training & Progression' },
  habits: { title: 'Habits', subtitle: 'Daily Consistency Engine' },
  finance: { title: 'Finance', subtitle: 'Personal Wealth, Budgets & Cash Flow' },
  analytics: { title: 'Analytics', subtitle: 'Performance & Growth Metrics' },
  journal: { title: 'Journal', subtitle: 'Private Daily Reflection' },
  resources: { title: 'Resources', subtitle: 'Vault of Reference Materials' },
  settings: { title: 'Settings', subtitle: 'Preferences & System Controls' },
};
