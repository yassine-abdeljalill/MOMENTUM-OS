import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Timer,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';

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
  finance: { title: 'Finance', subtitle: 'Personal Wealth, Budgets & Cash Flow' },
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

  const prefersReduced = useReducedMotion();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!focusTimer.isActive || focusTimer.isPaused) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [focusTimer.isActive, focusTimer.isPaused]);

  const unreadNotificationsCount = state.notifications.filter(n => !n.read).length;
  const currentMeta = viewTitles[currentView] || { title: currentView, subtitle: '' };

  // Calculate timer display accurately even when paused
  let timerDisplay = '25:00';
  if (focusTimer.isActive) {
    const referenceNow = focusTimer.isPaused && focusTimer.pausedAtMs ? focusTimer.pausedAtMs : now;
    const elapsedSec = Math.max(
      0,
      Math.floor((referenceNow - focusTimer.startTimestampMs - focusTimer.pausedAccumulatedMs) / 1000)
    );
    const remaining = Math.max(0, focusTimer.totalDurationSeconds - elapsedSec);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    timerDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return (
    <header className="h-16 shrink-0 bg-[#FAF5ED]/95 backdrop-blur-xs border-b border-[#D6C6B2] px-4 md:px-8 flex items-center justify-between gap-4 select-none sticky top-0 z-20">
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -3 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.14, ease: MOMENTUM_EASE }}
            className="flex flex-col min-w-0"
          >
            <div className="flex items-center gap-2 text-xs text-[#6E5648]">
              <span className="font-mono font-semibold text-[#3B2418]/70">MOMENTUM</span>
              <ChevronRight className="w-3 h-3 text-[#3B2418]/40" />
              <span className="font-semibold px-1.5 py-0.5 rounded bg-[#8EC5FF]/50 text-[#3B2418] capitalize text-[11px]">
                {currentMeta.title}
              </span>
            </div>
            <h1 className="text-base md:text-lg font-bold text-[#3B2418] tracking-tight truncate">
              {currentMeta.title}
              <span className="hidden sm:inline-block ml-2 text-xs font-normal text-[#6E5648]">
                — {currentMeta.subtitle}
              </span>
            </h1>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Focus Timer Pill */}
        <div className="flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            {focusTimer.isActive ? (
              <motion.div
                key="active-timer"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3B2418] border border-[#8EC5FF]/60 text-[#F2E8DA] text-xs font-mono shadow-xs"
              >
                <button
                  onClick={() => setIsFocusTimerOpen(true)}
                  className="flex items-center gap-1 hover:text-[#8EC5FF] transition-colors btn-press"
                  title="Open Focus Timer"
                >
                  <Timer className={`w-3.5 h-3.5 text-[#8EC5FF] ${!focusTimer.isPaused && !prefersReduced ? 'animate-pulse' : ''}`} />
                  <span className="font-semibold">{timerDisplay}</span>
                </button>
                <button
                  onClick={focusTimer.isPaused ? resumeFocusTimer : pauseFocusTimer}
                  className="p-0.5 rounded text-[#F2E8DA]/80 hover:text-[#8EC5FF] transition-colors btn-press"
                  aria-label={focusTimer.isPaused ? 'Resume focus timer' : 'Pause focus timer'}
                >
                  {focusTimer.isPaused ? (
                    <Play className="w-3 h-3 fill-current" />
                  ) : (
                    <Pause className="w-3 h-3 fill-current" />
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="idle-timer"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.14 }}
                onClick={() => setIsFocusTimerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] hover:bg-[#E3D5C1] text-[#3B2418] border border-[#D6C6B2] text-xs font-medium btn-press"
                title="Focus Timer"
              >
                <Timer className="w-3.5 h-3.5 text-[#1E5A99]" />
                <span className="hidden sm:inline">Focus</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Global Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F2E8DA] hover:bg-[#E3D5C1] text-[#6E5648] hover:text-[#3B2418] border border-[#D6C6B2] text-xs font-medium btn-press"
          title="Search anything (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#3B2418]" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#FAF5ED] text-[#3B2418] border border-[#D6C6B2]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Button */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] text-xs font-semibold shadow-sm border border-[#3B2418]/15 btn-press group"
          title="Quick Add (Cmd+N)"
        >
          <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
          <span className="hidden sm:inline">Add</span>
          <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-[#3B2418]/15 text-[#3B2418]">
            ⌘N
          </kbd>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2 rounded-lg bg-[#F2E8DA] hover:bg-[#E3D5C1] text-[#3B2418] border border-[#D6C6B2] relative btn-press group"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4 transition-transform duration-150 group-hover:scale-105" />
          <AnimatePresence>
            {unreadNotificationsCount > 0 && (
              <motion.span
                initial={prefersReduced ? { scale: 1 } : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#8EC5FF] text-[#3B2418] border border-[#3B2418]/30 font-mono text-[9px] font-bold flex items-center justify-center"
              >
                {unreadNotificationsCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Avatar */}
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-8 h-8 rounded-full bg-[#3B2418] border-2 border-[#8EC5FF] flex items-center justify-center text-xs font-semibold text-[#F2E8DA] hover:bg-[#4D3021] btn-press"
          title="Account profile"
        >
          {state.profile.fullName.charAt(0)}
        </button>
      </div>
    </header>
  );
};
