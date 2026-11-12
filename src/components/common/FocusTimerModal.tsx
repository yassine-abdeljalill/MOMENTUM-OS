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
} from 'lucide-react';
import { useApp } from '../../lib/context';

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

  const [customMinutes, setCustomMinutes] = useState(45);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(focusTimer.linkedTaskId || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());

  // High-frequency tick for UI refresh only (math uses actual Date.now() timestamp!)
  useEffect(() => {
    if (!focusTimer.isActive || focusTimer.isPaused) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [focusTimer.isActive, focusTimer.isPaused]);

  // Sync selected task when modal opens
  useEffect(() => {
    if (focusTimer.linkedTaskId) {
      setSelectedTaskId(focusTimer.linkedTaskId);
    }
  }, [focusTimer.linkedTaskId]);

  if (!isFocusTimerOpen) return null;

  // Calculate elapsed & remaining based on actual timestamp delta
  let elapsedSeconds = 0;
  if (focusTimer.isActive) {
    const deltaMs = (focusTimer.isPaused ? 0 : now) - focusTimer.startTimestampMs - focusTimer.pausedAccumulatedMs;
    elapsedSeconds = Math.max(0, Math.floor(deltaMs / 1000));
  }
  const remainingSeconds = Math.max(0, focusTimer.totalDurationSeconds - elapsedSeconds);
  const progressPercent = focusTimer.totalDurationSeconds > 0
    ? Math.min(100, Math.round((elapsedSeconds / focusTimer.totalDurationSeconds) * 100))
    : 0;

  const displayMinutes = Math.floor(remainingSeconds / 60);
  const displaySeconds = remainingSeconds % 60;
  const timeFormatted = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`;

  const handleStartPreset = (minutes: number, type: 'focus' | 'break') => {
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  const handleFinish = () => {
    playBeep();
    completeFocusSession();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2418]/70 backdrop-blur-sm transition-all ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      <div
        className={`w-full bg-[#3B2418] border border-[#5A3927] shadow-2xl flex flex-col transition-all overflow-hidden ${
          isFullscreen
            ? 'h-screen w-screen rounded-none border-0'
            : 'max-w-xl rounded-2xl'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#4D3021]">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-[#8EC5FF]" />
            <h2 className="font-semibold text-sm text-[#F2E8DA] tracking-wide">
              {focusTimer.sessionType === 'focus' ? 'Deep Work Focus Timer' : 'Restorative Break'}
            </h2>
            {focusTimer.linkedTaskTitle && (
              <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-[#8EC5FF]/20 text-[#8EC5FF] border border-[#8EC5FF]/30 truncate max-w-[200px]">
                {focusTimer.linkedTaskTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-[#D8C7B4] hover:text-[#F2E8DA] hover:bg-[#3B2418]"
              title={soundEnabled ? 'Mute chime' : 'Enable chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-[#D8C7B4] hover:text-[#F2E8DA] hover:bg-[#3B2418]"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Focus Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsFocusTimerOpen(false)}
              className="p-1.5 rounded-lg text-[#D8C7B4] hover:text-[#F2E8DA] hover:bg-[#3B2418]"
              aria-label="Close timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer Core Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 select-none">
          {/* Circular / Ring Progress Container */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-[#4D3021]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-[#8EC5FF] transition-all duration-300"
                strokeWidth="8"
                strokeDasharray="276%"
                strokeDashoffset={`${276 - (276 * progressPercent) / 100}%`}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Digits */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl sm:text-6xl font-extrabold text-[#F2E8DA] tracking-tight">
                {timeFormatted}
              </span>
              <span className="text-xs text-[#8EC5FF] font-medium uppercase tracking-widest mt-2">
                {focusTimer.isActive
                  ? focusTimer.isPaused
                    ? 'Paused'
                    : 'In Focus Session'
                  : 'Ready'}
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-4 mt-8">
            {focusTimer.isActive ? (
              <>
                <button
                  onClick={focusTimer.isPaused ? resumeFocusTimer : pauseFocusTimer}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-sm shadow-md transition-all active:scale-95"
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
                  onClick={resetFocusTimer}
                  className="p-2.5 rounded-xl bg-[#4D3021] hover:bg-[#5A3927] text-[#F2E8DA] border border-[#5A3927] transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#3E7B52]/30 hover:bg-[#3E7B52]/40 text-[#9FE2B5] border border-[#3E7B52]/60 font-semibold text-xs transition-colors"
                  title="Complete session and record focus time"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleStartPreset(25, 'focus')}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] font-bold text-sm shadow-lg transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start 25m Focus</span>
              </button>
            )}
          </div>
        </div>

        {/* Presets & Link to Task */}
        {!isFullscreen && (
          <div className="p-6 border-t border-[#D6C6B2] bg-[#FAF5ED] space-y-4">
            {/* Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#6E5648] font-medium">Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStartPreset(25, 'focus')}
                  className="px-3 py-1 text-xs rounded-lg bg-[#F2E8DA] hover:bg-[#8EC5FF] text-[#3B2418] font-medium border border-[#D6C6B2] transition-colors"
                >
                  25m Focus
                </button>
                <button
                  onClick={() => handleStartPreset(50, 'focus')}
                  className="px-3 py-1 text-xs rounded-lg bg-[#F2E8DA] hover:bg-[#8EC5FF] text-[#3B2418] font-medium border border-[#D6C6B2] transition-colors"
                >
                  50m Deep
                </button>
                <button
                  onClick={() => handleStartPreset(5, 'break')}
                  className="px-3 py-1 text-xs rounded-lg bg-[#F2E8DA] hover:bg-[#E3D5C1] text-[#6E5648] hover:text-[#3B2418] border border-[#D6C6B2] transition-colors"
                >
                  5m Break
                </button>
                <button
                  onClick={() => handleStartPreset(10, 'break')}
                  className="px-3 py-1 text-xs rounded-lg bg-[#F2E8DA] hover:bg-[#E3D5C1] text-[#6E5648] hover:text-[#3B2418] border border-[#D6C6B2] transition-colors"
                >
                  10m Break
                </button>
              </div>
            </div>

            {/* Task Linking */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#6E5648] shrink-0 font-medium">
                <CheckSquare className="w-3.5 h-3.5 text-[#3B2418]" />
                <span>Link Task:</span>
              </div>
              <select
                value={selectedTaskId}
                onChange={e => handleTaskChange(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
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
      </div>
    </div>
  );
};
