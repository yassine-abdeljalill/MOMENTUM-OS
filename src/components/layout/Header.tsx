import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Timer,
  Play,
  Pause,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { MOMENTUM_EASE, MOMENTUM_SPRING } from '../common/MotionPrimitives';
import { BrandMark } from '../common/BrandMark';
import { VIEW_TITLES } from './navConfig';

export const Header: React.FC = () => {
  const {
    currentView,
    state,
    authUser,
    authChecked,
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

  const isSignedOut = authChecked && !authUser;
  const displayName = isSignedOut
    ? '?'
    : authUser && !authUser.isWorkspace
    ? authUser.fullName
    : state.profile.fullName;

  return (
    <header className="shrink-0 bg-[#FBFBFD]/85 backdrop-blur-xl border-b border-line pt-[env(safe-area-inset-top)] select-none">
      <div className="h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2 min-w-0">
        {/* Left: Mobile Brand Mark + Single-Line View Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <BrandMark
            size="sm"
            interactive
            active={focusTimer.isActive && !focusTimer.isPaused}
            className="md:hidden"
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={currentView}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 1 } : { opacity: 0, y: -2 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.14, ease: MOMENTUM_EASE }}
              className="text-sm sm:text-[15px] font-semibold text-ink tracking-tight truncate font-heading"
            >
              {currentMeta.title}
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Global Focus Timer */}
          <AnimatePresence mode="wait" initial={false}>
            {focusTimer.isActive ? (
              <motion.div
                key="active-timer"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="h-[30px] min-[360px]:h-8 flex items-center gap-1 px-2 rounded-[10px] sm:rounded-full glass-control border-accent/60 text-ink text-[11px] font-mono shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setIsFocusTimerOpen(true)}
                  className="flex items-center gap-1 hover:text-accent transition-colors btn-press tabular-nums"
                  title="Open Focus Timer"
                >
                  <span className="relative flex items-center justify-center">
                    {!focusTimer.isPaused && !prefersReduced && (
                      <motion.span
                        aria-hidden="true"
                        animate={{ scale: [1, 1.75], opacity: [0.45, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: MOMENTUM_EASE }}
                        className="absolute inset-0 rounded-full border border-accent"
                      />
                    )}
                    <Timer
                      className={`w-3.5 h-3.5 text-accent ${
                        !focusTimer.isPaused && !prefersReduced ? 'animate-pulse' : ''
                      }`}
                    />
                  </span>
                  <span className="font-semibold">{timerDisplay}</span>
                </button>
                <button
                  type="button"
                  onClick={focusTimer.isPaused ? resumeFocusTimer : pauseFocusTimer}
                  className="p-0.5 rounded text-ink-muted hover:text-accent transition-colors btn-press"
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
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2.5 rounded-xl glass-control text-ink text-xs font-medium btn-press flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            title="Focus Timer"
            aria-label="Open Focus Timer"
          >
            <Timer className="w-4 h-4 text-ink-muted" />
            <span className="hidden sm:inline">Focus</span>
          </motion.button>
        )}
      </AnimatePresence>

          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="h-8 w-8 sm:h-9 sm:w-9 md:w-auto md:px-3 rounded-xl glass-control text-ink-muted hover:text-ink text-xs font-medium btn-press flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            title="Search anything (Cmd+K)"
            aria-label="Search workspace"
          >
            <Search className="w-4 h-4 text-ink" />
            <span className="hidden md:inline">Search</span>
            <span className="hidden lg:inline text-[11px] font-mono text-ink-muted/75">
              ⌘K
            </span>
          </button>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink text-xs font-semibold btn-press group flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            title="Quick Add (Cmd+N)"
            aria-label="Quick add item"
          >
            <Plus className="w-4 h-4 stroke-[2.25] transition-transform duration-200 group-hover:rotate-90" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl glass-control text-ink relative btn-press group flex items-center justify-center shrink-0"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-4 h-4 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-105" />
            <AnimatePresence>
              {unreadNotificationsCount > 0 && (
                <motion.span
                  initial={prefersReduced ? { scale: 1 } : { scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={prefersReduced ? { duration: 0.01 } : MOMENTUM_SPRING}
                  className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-accent text-accent-ink border border-canvas font-mono text-[8px] font-bold flex items-center justify-center tabular-nums leading-none"
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
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full glass-control border border-line-strong flex items-center justify-center text-xs font-semibold text-ink hover:border-accent btn-press shrink-0"
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
