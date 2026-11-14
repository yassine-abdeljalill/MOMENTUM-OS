import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Timer,
  ChevronRight,
  Play,
  Pause,
  Sun,
  Moon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { VIEW_TITLES } from './navConfig';

export const Header: React.FC = () => {
  const {
    currentView,
    state,
    authUser,
    setIsSearchOpen,
    setIsQuickAddOpen,
    setIsFocusTimerOpen,
    setIsNotificationsOpen,
    setIsAuthModalOpen,
    focusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    resolvedTheme,
    toggleTheme,
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
  const currentMeta = VIEW_TITLES[currentView] || { title: currentView, subtitle: '' };

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

  const displayName =
    authUser && !authUser.isWorkspace ? authUser.fullName : state.profile.fullName;

  return (
    <header className="h-13 md:h-15 shrink-0 bg-surface/90 backdrop-blur-md border-b border-line px-3.5 md:px-7 flex items-center justify-between gap-2.5 select-none sticky top-0 z-20">
      {/* Left: Mobile Brand Mark + Title / Desktop Breadcrumb */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src="/brand-logo.png"
          alt="MOMENTUM"
          className="md:hidden w-7 h-7 rounded-lg object-contain shrink-0"
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -3 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.14, ease: MOMENTUM_EASE }}
            className="flex flex-col min-w-0"
          >
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-ink-muted">
              <span className="font-mono font-semibold text-ink-muted">MOMENTUM</span>
              <ChevronRight className="w-3 h-3 text-ink-muted/60" />
              <span className="font-semibold text-accent capitalize">
                {currentMeta.title}
              </span>
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-ink tracking-tight truncate font-heading">
                {currentMeta.title}
              </h1>
              <span className="hidden lg:inline-block text-xs font-normal text-ink-muted truncate">
                · {currentMeta.subtitle}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Global Focus Timer Pill */}
        <AnimatePresence mode="wait" initial={false}>
          {focusTimer.isActive ? (
            <motion.div
              key="active-timer"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-charcoal border border-accent/60 text-[#F7F1E8] text-xs font-mono shadow-xs"
            >
              <button
                type="button"
                onClick={() => setIsFocusTimerOpen(true)}
                className="flex items-center gap-1 hover:text-accent transition-colors btn-press tabular-nums"
                title="Open Focus Timer"
              >
                <Timer
                  className={`w-3.5 h-3.5 text-accent ${
                    !focusTimer.isPaused && !prefersReduced ? 'animate-pulse' : ''
                  }`}
                />
                <span className="font-semibold">{timerDisplay}</span>
              </button>
              <button
                type="button"
                onClick={focusTimer.isPaused ? resumeFocusTimer : pauseFocusTimer}
                className="p-0.5 rounded text-[#F7F1E8]/80 hover:text-accent transition-colors btn-press"
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
              type="button"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.14 }}
              onClick={() => setIsFocusTimerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-warm/70 hover:bg-surface-inset text-ink border border-line text-xs font-medium btn-press whitespace-nowrap"
              title="Focus Timer"
              aria-label="Open Focus Timer"
            >
              <Timer className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Focus</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-warm/70 hover:bg-surface-inset text-ink-muted hover:text-ink border border-line text-xs font-medium btn-press whitespace-nowrap"
          title="Search anything (Cmd+K)"
          aria-label="Search workspace"
        >
          <Search className="w-3.5 h-3.5 text-ink" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] font-mono rounded bg-surface text-ink-muted border border-line">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Button */}
        <button
          type="button"
          onClick={() => setIsQuickAddOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-bold shadow-xs btn-press group whitespace-nowrap shrink-0"
          title="Quick Add (Cmd+N)"
          aria-label="Quick add item"
        >
          <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
          <span className="hidden sm:inline">Add</span>
          <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-black/10 text-accent-ink">
            ⌘N
          </kbd>
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-surface-warm/70 hover:bg-surface-inset text-ink border border-line btn-press"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-accent" />
          ) : (
            <Moon className="w-4 h-4 text-brand" />
          )}
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2 rounded-xl bg-surface-warm/70 hover:bg-surface-inset text-ink border border-line relative btn-press group"
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
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-ink border border-surface font-mono text-[9px] font-bold flex items-center justify-center tabular-nums"
              >
                {unreadNotificationsCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Avatar */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="w-8 h-8 rounded-full bg-brand border-2 border-accent flex items-center justify-center text-xs font-bold text-brand-ink hover:bg-brand-hover btn-press shrink-0"
          title="Account profile"
          aria-label="Open account profile"
        >
          {displayName.charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  );
};
