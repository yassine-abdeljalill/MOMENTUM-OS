import React from 'react';
import {
  Search,
  Plus,
  Bell,
  Timer,
  ChevronRight,
  Play,
  Pause,
  User,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../lib/context';

const viewTitles: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Central Command Center' },
  today: { title: 'Today', subtitle: 'Daily Execution & 3 Core Priorities' },
  tasks: { title: 'Tasks', subtitle: 'Actionable Responsibilities & Kanban' },
  calendar: { title: 'Calendar', subtitle: 'Time Blocking & Milestones' },
  goals: { title: 'Goals', subtitle: 'Long-Term Vision & 90-Day Plans' },
  projects: { title: 'Projects', subtitle: 'Initiatives & Deliverables' },
  learning: { title: 'Learning', subtitle: 'Knowledge Center & Courses' },
  fitness: { title: 'Fitness', subtitle: 'Physical Training & Progression' },
  habits: { title: 'Habits', subtitle: 'Daily Consistency Engine' },
  analytics: { title: 'Analytics', subtitle: 'Performance & Growth Metrics' },
  journal: { title: 'Journal', subtitle: 'Private Daily Reflection' },
  resources: { title: 'Resources', subtitle: 'Vault of Reference Materials' },
  settings: { title: 'Settings', subtitle: 'Preferences & System Controls' },
};

export const Header: React.FC = () => {
  const {
    currentView,
    state,
    setIsSearchOpen,
    setIsQuickAddOpen,
    setIsFocusTimerOpen,
    setIsNotificationsOpen,
    setIsAuthModalOpen,
    focusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
  } = useApp();

  const unreadNotificationsCount = state.notifications.filter(n => !n.read).length;
  const currentMeta = viewTitles[currentView] || { title: currentView, subtitle: '' };

  // Calculate timer display
  let timerDisplay = '25:00';
  if (focusTimer.isActive) {
    const elapsedSec = Math.floor(
      (Date.now() - focusTimer.startTimestampMs - focusTimer.pausedAccumulatedMs) / 1000
    );
    const remaining = Math.max(0, focusTimer.totalDurationSeconds - elapsedSec);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return (
    <header className="h-16 shrink-0 bg-[#242B31] border-b border-[#434D56]/60 px-4 md:px-8 flex items-center justify-between gap-4 select-none sticky top-0 z-20">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#A8A8A2]">
            <span className="font-mono text-[#868A7A]">MOMENTUM</span>
            <ChevronRight className="w-3 h-3 text-[#434D56]" />
            <span className="font-medium text-[#D2925B] capitalize">{currentMeta.title}</span>
          </div>
          <h1 className="text-base md:text-lg font-bold text-[#F4F0E9] tracking-tight truncate">
            {currentMeta.title}
            <span className="hidden sm:inline-block ml-2 text-xs font-normal text-[#A8A8A2]">
              — {currentMeta.subtitle}
            </span>
          </h1>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Focus Timer Pill */}
        <div className="flex items-center">
          {focusTimer.isActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#64432B]/80 border border-[#D2925B]/40 text-[#F4F0E9] text-xs font-mono shadow-xs animate-pulse">
              <button
                onClick={() => setIsFocusTimerOpen(true)}
                className="flex items-center gap-1 hover:text-[#D2925B] transition-colors"
                title="Open Focus Timer"
              >
                <Timer className="w-3.5 h-3.5 text-[#D2925B]" />
                <span className="font-semibold">{timerDisplay}</span>
              </button>
              <button
                onClick={focusTimer.isPaused ? resumeFocusTimer : pauseFocusTimer}
                className="p-0.5 rounded text-[#A8A8A2] hover:text-[#F4F0E9]"
                aria-label={focusTimer.isPaused ? 'Resume focus timer' : 'Pause focus timer'}
              >
                {focusTimer.isPaused ? (
                  <Play className="w-3 h-3 fill-current" />
                ) : (
                  <Pause className="w-3 h-3 fill-current" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsFocusTimerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2E373F] hover:bg-[#36414A] text-[#A8A8A2] hover:text-[#F4F0E9] border border-[#434D56]/60 text-xs font-medium transition-colors"
              title="Focus Timer"
            >
              <Timer className="w-3.5 h-3.5 text-[#D2925B]" />
              <span className="hidden sm:inline">Focus</span>
            </button>
          )}
        </div>

        {/* Global Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2E373F] hover:bg-[#36414A] text-[#A8A8A2] hover:text-[#F4F0E9] border border-[#434D56]/60 text-xs font-medium transition-colors"
          title="Search anything (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#242B31] text-[#868A7A] border border-[#434D56]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] text-xs font-semibold shadow-sm transition-all transform active:scale-95"
          title="Quick Add (Cmd+N)"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add</span>
          <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-[#242B31]/20 text-[#242B31]">
            ⌘N
          </kbd>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2 rounded-lg bg-[#2E373F] hover:bg-[#36414A] text-[#A8A8A2] hover:text-[#F4F0E9] border border-[#434D56]/60 relative transition-colors"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D2925B] text-[#242B31] font-mono text-[9px] font-bold flex items-center justify-center">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-8 h-8 rounded-full bg-[#868A7A]/30 border border-[#868A7A]/80 flex items-center justify-center text-xs font-semibold text-[#F4F0E9] hover:border-[#D2925B] transition-colors"
          title="Account profile"
        >
          {state.profile.fullName.charAt(0)}
        </button>
      </div>
    </header>
  );
};
