import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Timer,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import confetti from 'canvas-confetti';
import { useApp } from '../../lib/context';
import { ModalShell, MOMENTUM_EASE } from './MotionPrimitives';

export const FocusTimerModal: React.FC = () => {
  const {
    isFocusTimerOpen,
    setIsFocusTimerOpen,
    focusTimer,
    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    resetFocusTimer,
    completeFocusSession,
    state,
  } = useApp();

  const prefersReduced = useReducedMotion();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(focusTimer.linkedTaskId || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (!focusTimer.isActive || focusTimer.isPaused) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [focusTimer.isActive, focusTimer.isPaused]);

  useEffect(() => {
    if (focusTimer.linkedTaskId) {
      setSelectedTaskId(focusTimer.linkedTaskId);
    }
  }, [focusTimer.linkedTaskId]);

  useEffect(() => {
    if (!isFocusTimerOpen) {
      setJustCompleted(false);
    }
  }, [isFocusTimerOpen]);

  let elapsedSeconds = 0;
  if (focusTimer.isActive) {
    const refNow = focusTimer.isPaused && focusTimer.pausedAtMs ? focusTimer.pausedAtMs : now;
    const deltaMs = refNow - focusTimer.startTimestampMs - focusTimer.pausedAccumulatedMs;
    elapsedSeconds = Math.max(0, Math.floor(deltaMs / 1000));
  }
  const remainingSeconds = Math.max(0, focusTimer.totalDurationSeconds - elapsedSeconds);
  const progressPercent =
    focusTimer.totalDurationSeconds > 0
      ? Math.min(100, (elapsedSeconds / focusTimer.totalDurationSeconds) * 100)
      : 0;

  const displayMinutes = Math.floor(remainingSeconds / 60);
  const displaySeconds = remainingSeconds % 60;
  const timeFormatted = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = justCompleted
    ? 0
    : circumference - (circumference * progressPercent) / 100;

  const handleStartPreset = (minutes: number, type: 'focus' | 'break') => {
    setJustCompleted(false);
    const linked = state.tasks.find(t => t.id === selectedTaskId);
    startFocusTimer(
      minutes,
      linked ? { id: linked.id, title: linked.title } : undefined,
      type
    );
  };

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (focusTimer.isActive) {
      const linked = state.tasks.find(t => t.id === taskId);
      if (linked) {
        startFocusTimer(
          Math.round(focusTimer.totalDurationSeconds / 60),
          { id: linked.id, title: linked.title },
          focusTimer.sessionType
        );
      }
    }
  };

  const playBeep = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Ignore audio restrictions
    }
  };

  const handleFinish = () => {
    playBeep();
    setJustCompleted(true);
    if (!prefersReduced) {
      try {
        confetti({
          particleCount: 36,
          spread: 55,
          origin: { y: 0.55 },
          colors: ['#D2925B', '#9ECCFD', '#F5F1E9'],
        });
      } catch {
        // Ignore confetti errors
      }
    }
    completeFocusSession();
    setTimeout(() => setJustCompleted(false), 1800);
  };

  const statusLabel = justCompleted
    ? 'Session Logged'
    : focusTimer.isActive
    ? focusTimer.isPaused
      ? 'Paused'
      : 'In Focus Session'
    : 'Ready';

  return (
    <ModalShell
      isOpen={isFocusTimerOpen}
      onClose={() => setIsFocusTimerOpen(false)}
      fullscreen={isFullscreen}
      maxWidthClass="max-w-xl"
      panelClassName={`bg-canvas text-ink border border-line shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'rounded-none border-0' : 'rounded-t-2xl sm:rounded-2xl'
      }`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface">
        <div className="flex items-center gap-2 min-w-0">
          <Timer className="w-5 h-5 text-brand-blue shrink-0" />
          <h2 className="font-semibold text-sm text-ink tracking-wide truncate font-heading">
            {focusTimer.sessionType === 'focus' ? 'Deep Work Focus Timer' : 'Restorative Break'}
          </h2>
          {focusTimer.linkedTaskTitle && (
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-md bg-brand-blue/15 text-brand-blue border border-brand-blue/35 truncate max-w-[200px]">
              {focusTimer.linkedTaskTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm btn-press"
            title={soundEnabled ? 'Mute chime' : 'Enable chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm btn-press"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Focus Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsFocusTimerOpen(false)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm btn-press"
            aria-label="Close timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timer Core Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 select-none">
        <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center">
          <AnimatePresence>
            {((focusTimer.isActive && !focusTimer.isPaused) || justCompleted) && !prefersReduced && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: justCompleted ? 0.35 : 0.2, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: MOMENTUM_EASE }}
                className={`absolute inset-4 rounded-full blur-xl pointer-events-none ${
                  justCompleted ? 'bg-success' : 'bg-accent'
                }`}
              />
            )}
          </AnimatePresence>

          <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-90 relative z-10">
            <circle
              cx="120"
              cy="120"
              r={radius}
              className="stroke-white/10"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              className={justCompleted ? 'stroke-success' : 'stroke-accent'}
              style={{
                transition: prefersReduced
                  ? 'none'
                  : 'stroke-dashoffset 0.35s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.25s ease',
              }}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <AnimatePresence mode="wait" initial={false}>
              {justCompleted ? (
                <motion.div
                  key="completed-badge"
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE }}
                  className="flex flex-col items-center text-center px-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-success mb-2" />
                  <span className="text-sm font-bold text-ink">Focus Recorded</span>
                </motion.div>
              ) : (
                <motion.span
                  key="timer-digits"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-5xl sm:text-6xl font-extrabold text-ink tracking-tight tabular-nums"
                >
                  {timeFormatted}
                </motion.span>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={statusLabel}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -3 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16 }}
                className={`text-xs font-medium uppercase tracking-widest mt-2 flex items-center gap-1.5 ${
                  justCompleted ? 'text-success' : 'text-accent'
                }`}
              >
                {justCompleted && <Sparkles className="w-3.5 h-3.5" />}
                <span>{statusLabel}</span>
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-3 mt-6 sm:mt-8">
          <AnimatePresence mode="wait" initial={false}>
            {focusTimer.isActive ? (
              <motion.div
                key="active-controls"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={focusTimer.isPaused ? resumeFocusTimer : pauseFocusTimer}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-bold text-sm shadow-md btn-press"
                >
                  {focusTimer.isPaused ? (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetFocusTimer}
                  className="p-2.5 rounded-xl bg-surface-warm hover:bg-surface-hover text-ink border border-line btn-press"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-success/20 hover:bg-success/30 text-ink border border-success/50 font-semibold text-xs btn-press"
                  title="Complete session and record focus time"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Complete</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="idle-controls"
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
              >
                <button
                  type="button"
                  onClick={() => handleStartPreset(25, 'focus')}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-bold text-sm shadow-lg btn-press"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start 25m Focus</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Presets & Link to Task */}
      {!isFullscreen && (
        <div className="p-5 sm:p-6 border-t border-line bg-surface text-ink space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-ink-muted font-medium">Presets:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStartPreset(25, 'focus')}
                className="px-3 py-1.5 text-xs rounded-lg bg-surface-warm hover:bg-accent hover:text-accent-ink text-ink font-medium border border-line btn-press"
              >
                25m Focus
              </button>
              <button
                type="button"
                onClick={() => handleStartPreset(50, 'focus')}
                className="px-3 py-1.5 text-xs rounded-lg bg-surface-warm hover:bg-accent hover:text-accent-ink text-ink font-medium border border-line btn-press"
              >
                50m Deep
              </button>
              <button
                type="button"
                onClick={() => handleStartPreset(5, 'break')}
                className="px-3 py-1.5 text-xs rounded-lg bg-surface-warm hover:bg-surface-inset text-ink-muted hover:text-ink border border-line btn-press"
              >
                5m Break
              </button>
              <button
                type="button"
                onClick={() => handleStartPreset(10, 'break')}
                className="px-3 py-1.5 text-xs rounded-lg bg-surface-warm hover:bg-surface-inset text-ink-muted hover:text-ink border border-line btn-press"
              >
                10m Break
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted shrink-0 font-medium">
              <CheckSquare className="w-3.5 h-3.5 text-accent" />
              <span>Link Task:</span>
            </div>
            <select
              value={selectedTaskId}
              onChange={e => handleTaskChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-warm/70 border border-line text-ink text-xs focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden"
            >
              <option value="">No task linked (general focus)</option>
              {state.tasks
                .filter(t => t.status !== 'completed')
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.priority})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </ModalShell>
  );
};
