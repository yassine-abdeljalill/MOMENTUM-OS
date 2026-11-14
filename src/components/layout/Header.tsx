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
    <header className="sticky top-0 z-20 shrink-0 bg-[#1A1A1D]/95 backdrop-blur-md border-b border-[#393940] pt-[env(safe-area-inset-top)] select-none">
      <div className="h-[52px] md:h-[60px] px-3 sm:px-4 md:px-7 flex items-center justify-between gap-2 min-w-0">
        {/* Left: Mobile Brand Mark + Title / Desktop Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
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
                <span className="font-semibold text-brand-blue capitalize">
                  {currentMeta.title}
                </span>
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <h1 className="text-[15px] sm:text-base md:text-lg font-bold text-ink tracking-tight truncate font-heading">
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
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0 overflow-x-auto no-scrollbar py-1 -my-1 shrink-0 max-w-[66vw] sm:max-w-none">
          {/* Global Focus Timer */}
          <AnimatePresence mode="wait" initial={false}>
            {focusTimer.isActive ? (
              <motion.div
                key="active-timer"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="h-[30px] min-[360px]:h-8 flex items-center gap-1 px-2 rounded-[10px] sm:rounded-full bg-[#242428] border border-brand-blue/60 text-ink text-[11px] font-mono shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setIsFocusTimerOpen(true)}
                  className="flex items-center gap-1 hover:text-brand-blue transition-colors btn-press tabular-nums"
                  title="Open Focus Timer"
                >
                  <Timer
                    className={`w-3.5 h-3.5 text-brand-blue ${
                      !focusTimer.isPaused && !prefersReduced ? 'animate-pulse' : ''
                    }`}
                  />
                  <span className="font-semibold">{timerDisplay}</span>
                </button>
                <button
                  type="button"
                  onClick={focusTimer.isPaused ? resumeFocusTimer : pauseFocusTimer}
                  className="p-0.5 rounded text-ink-muted hover:text-brand-blue transition-colors btn-press"
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
                className="h-[30px] w-[30px] min-[360px]:h-8 min-[360px]:w-8 sm:w-auto sm:px-2.5 rounded-[10px] sm:rounded-xl bg-[#242428] hover:bg-[#2A2A2F] text-ink border border-[#393940] text-xs font-medium btn-press flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                title="Focus Timer"
                aria-label="Open Focus Timer"
              >
                <Timer className="w-3.5 h-3.5 text-brand-blue" />
                <span className="hidden sm:inline">Focus</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="h-[30px] w-[30px] min-[360px]:h-8 min-[360px]:w-8 md:w-auto md:px-3 rounded-[10px] md:rounded-xl bg-[#242428] hover:bg-[#2A2A2F] text-ink-muted hover:text-ink border border-[#393940] text-xs font-medium btn-press flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            title="Search anything (Cmd+K)"
            aria-label="Search workspace"
          >
            <Search className="w-3.5 h-3.5 text-ink" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] font-mono rounded bg-[#1A1A1D] text-ink-muted border border-[#393940]">
              ⌘K
            </kbd>
          </button>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="h-[30px] w-[30px] min-[360px]:h-8 min-[360px]:w-8 sm:w-auto sm:px-2.5 rounded-[10px] sm:rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-bold btn-press group flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            title="Quick Add (Cmd+N)"
            aria-label="Quick add item"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
            <span className="hidden sm:inline">Add</span>
            <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-mono rounded bg-black/15 text-accent-ink">
              ⌘N
            </kbd>
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="h-[30px] w-[30px] min-[360px]:h-8 min-[360px]:w-8 rounded-[10px] sm:rounded-xl bg-[#242428] hover:bg-[#2A2A2F] text-ink border border-[#393940] relative btn-press group flex items-center justify-center shrink-0"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-150 group-hover:scale-105" />
            <AnimatePresence>
              {unreadNotificationsCount > 0 && (
                <motion.span
                  initial={prefersReduced ? { scale: 1 } : { scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                  className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent text-accent-ink border border-[#1A1A1D] font-mono text-[8px] font-bold flex items-center justify-center tabular-nums leading-none"
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
            className="h-[30px] w-[30px] min-[360px]:h-8 min-[360px]:w-8 rounded-full bg-[#2A2A2F] border-[1.5px] border-brand-blue/70 flex items-center justify-center text-[11px] sm:text-xs font-bold text-ink hover:border-brand-blue btn-press shrink-0"
            title="Account profile"
            aria-label="Open account profile"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
};
