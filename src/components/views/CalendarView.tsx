import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  BookOpen,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import {
  formatIsoDate,
  parseIsoDate,
  addDaysToIso,
  getWeekDays,
  getMonthGridCells,
  parseTimeToMinutes,
  formatHourSlot,
} from '../../lib/calendar';
import { ModalShell, MOMENTUM_EASE } from '../common/MotionPrimitives';

type CalendarViewMode = 'month' | 'week' | 'day';

const DAY_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

export const CalendarView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    learningData,
    addScheduleActivity,
    setCurrentView,
    setSelectedLearningModuleId,
    setSelectedLearningLessonId,
    showToast,
  } = useApp();

  const todayStr = formatIsoDate(new Date());
  const startOfWeek = state.preferences.startOfWeek || 'monday';
  const timeFormat = state.preferences.timeFormat || '24h';

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');

  const anchorDate = useMemo(() => parseIsoDate(selectedDateStr), [selectedDateStr]);
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  const weekDays = useMemo(
    () => getWeekDays(selectedDateStr, startOfWeek),
    [selectedDateStr, startOfWeek]
  );

  const monthGrid = useMemo(
    () => getMonthGridCells(year, month, startOfWeek),
    [year, month, startOfWeek]
  );

  const weekdayHeaders =
    startOfWeek === 'monday'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigation stepper adapts to Month / Week / Day
  const handlePrev = () => {
    if (viewMode === 'month') {
      const prev = new Date(year, month - 1, 1);
      setSelectedDateStr(formatIsoDate(prev));
    } else if (viewMode === 'week') {
      setSelectedDateStr(addDaysToIso(selectedDateStr, -7));
    } else {
      setSelectedDateStr(addDaysToIso(selectedDateStr, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      const next = new Date(year, month + 1, 1);
      setSelectedDateStr(formatIsoDate(next));
    } else if (viewMode === 'week') {
      setSelectedDateStr(addDaysToIso(selectedDateStr, 7));
    } else {
      setSelectedDateStr(addDaysToIso(selectedDateStr, 1));
    }
  };

  const handleToday = () => {
    setSelectedDateStr(todayStr);
  };

  const periodTitle = useMemo(() => {
    if (viewMode === 'month') {
      return anchorDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const start = parseIsoDate(weekDays[0]);
      const end = parseIsoDate(weekDays[6]);
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return anchorDate.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [viewMode, anchorDate, weekDays]);

  const getItemsForDate = (dateStr: string) => {
    const tasks = state.tasks.filter(t => t.dueDate === dateStr);
    const schedule = (state.dailySchedule || [])
      .filter(s => s.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const workouts = state.workoutSessions.filter(w => w.date === dateStr);
    const study = state.studySessions.filter(s => s.date === dateStr);
    const learningLessons = (learningData?.lessons || []).filter(l => l.lessonDate === dateStr);
    const learningStudy = (learningData?.studySessions || []).filter(s => s.date === dateStr);
    const goalsDue = state.goals.filter(g => g.targetDate === dateStr);

    return { tasks, schedule, workouts, study, learningLessons, learningStudy, goalsDue };
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    addScheduleActivity({
      date: selectedDateStr,
      title: newEventTitle.trim(),
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      category: 'personal_development',
      completed: false,
    });

    setNewEventTitle('');
    setShowAddEventModal(false);
    showToast('Activity scheduled');
  };

  const selectedItems = getItemsForDate(selectedDateStr);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Integrated Master Calendar
          </h1>
          <p className="text-xs text-ink-muted">
            Synchronized Month, Week, and Day planning across tasks, workouts, lessons, and time blocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month | Week | Day Switcher */}
          <div
            role="tablist"
            aria-label="Calendar view mode"
            className="flex bg-surface-warm p-1 rounded-xl border border-line text-xs relative"
          >
            {(['month', 'week', 'day'] as const).map(mode => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setViewMode(mode)}
                  className={`relative z-10 px-3 py-1.5 min-h-[36px] rounded-lg capitalize transition-colors whitespace-nowrap ${
                    isActive ? 'text-accent-ink font-semibold' : 'text-ink-muted hover:text-ink font-medium'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="calendar-view-mode-pill"
                      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                      className="absolute inset-0 bg-accent rounded-lg -z-10"
                    />
                  )}
                  {mode}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAddEventModal(true)}
            className="btn-press group flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-brand hover:bg-brand-hover text-brand-ink font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.25] transition-transform duration-200 group-hover:rotate-90" />
            <span>Schedule Activity</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Calendar Surface */}
        <div
          className={`${
            viewMode === 'day' ? 'lg:col-span-8' : 'lg:col-span-8'
          } p-4 sm:p-6 rounded-2xl bg-surface border border-line space-y-4`}
        >
          {/* Period Stepper */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
            <h2 className="text-sm sm:text-base font-bold text-ink truncate">{periodTitle}</h2>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="btn-press p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm transition-colors"
                aria-label={`Previous ${viewMode}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="btn-press px-3 py-1.5 rounded-lg text-xs font-semibold text-accent hover:bg-surface-warm transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn-press p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm transition-colors"
                aria-label={`Next ${viewMode}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {viewMode === 'month' && (
              <motion.div
                key={`month-${year}-${month}`}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="space-y-2"
              >
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-ink-muted pb-1">
                  {weekdayHeaders.map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: monthGrid.leadingEmpty }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="h-14 sm:h-20 rounded-xl bg-surface-warm/30 opacity-40"
                    />
                  ))}

                  {monthGrid.dates.map(dateStr => {
                    const dayNum = Number(dateStr.split('-')[2]);
                    const isSelected = selectedDateStr === dateStr;
                    const isToday = todayStr === dateStr;
                    const items = getItemsForDate(dateStr);
                    const totalItems =
                      items.tasks.length +
                      items.schedule.length +
                      items.workouts.length +
                      items.study.length +
                      items.learningLessons.length +
                      items.learningStudy.length +
                      items.goalsDue.length;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDateStr(dateStr)}
                        aria-label={`Select ${dateStr} (${totalItems} items)`}
                        aria-pressed={isSelected}
                        className={`h-14 sm:h-20 rounded-xl p-1.5 flex flex-col justify-between border text-left transition-all duration-150 ${
                          isSelected
                            ? 'bg-brand text-brand-ink border-brand shadow-xs'
                            : isToday
                            ? 'bg-accent/15 border-accent text-ink'
                            : 'bg-surface-warm/50 border-line text-ink hover:border-accent/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-mono font-semibold tabular-nums ${
                              isSelected
                                ? 'text-brand-ink'
                                : isToday
                                ? 'text-accent'
                                : 'text-ink'
                            }`}
                          >
                            {dayNum}
                          </span>
                          {totalItems > 0 && (
                            <span
                              className={`text-[10px] font-mono tabular-nums ${
                                isSelected ? 'text-brand-ink/85' : 'text-ink-muted'
                              }`}
                            >
                              {totalItems}
                            </span>
                          )}
                        </div>

                        <div className="hidden sm:block space-y-0.5 overflow-hidden w-full">
                          {items.tasks.slice(0, 1).map(t => (
                            <div
                              key={t.id}
                              className={`text-[10px] truncate px-1 rounded ${
                                isSelected
                                  ? 'bg-white/15 text-brand-ink'
                                  : 'bg-accent/20 text-ink'
                              }`}
                            >
                              {t.title}
                            </div>
                          ))}
                          {items.learningLessons.slice(0, 1).map(l => (
                            <div
                              key={l.id}
                              className={`text-[10px] truncate px-1 rounded ${
                                isSelected
                                  ? 'bg-white/10 text-accent'
                                  : 'bg-surface-inset text-ink'
                              }`}
                            >
                              {l.title}
                            </div>
                          ))}
                          {items.workouts.slice(0, 1).map(w => (
                            <div
                              key={w.id}
                              className={`text-[10px] truncate px-1 rounded flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-white/10 text-brand-ink/90'
                                  : 'bg-surface-inset text-ink-muted'
                              }`}
                            >
                              <Dumbbell className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{w.routineName.split(' ')[0]}</span>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {viewMode === 'week' && (
              <motion.div
                key={`week-${weekDays[0]}`}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  {weekDays.map(dateStr => {
                    const dt = parseIsoDate(dateStr);
                    const isSelected = selectedDateStr === dateStr;
                    const isToday = todayStr === dateStr;
                    const items = getItemsForDate(dateStr);
                    const total =
                      items.schedule.length +
                      items.tasks.length +
                      items.learningLessons.length +
                      items.workouts.length +
                      items.learningStudy.length;

                    return (
                      <div
                        key={dateStr}
                        className={`rounded-xl border p-2.5 flex flex-col gap-2 min-h-[120px] sm:min-h-[260px] transition-colors ${
                          isSelected
                            ? 'bg-surface-warm border-accent'
                            : isToday
                            ? 'bg-accent/10 border-accent/40'
                            : 'bg-surface-warm/40 border-line'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedDateStr(dateStr)}
                          className="flex sm:flex-col items-center sm:items-start justify-between gap-1 pb-2 border-b border-line text-left w-full"
                        >
                          <span className="text-[11px] font-mono text-ink-muted uppercase">
                            {dt.toLocaleDateString([], { weekday: 'short' })}
                          </span>
                          <span
                            className={`text-sm font-mono font-bold tabular-nums ${
                              isSelected || isToday ? 'text-accent' : 'text-ink'
                            }`}
                          >
                            {dt.getDate()}
                          </span>
                        </button>

                        <div className="space-y-1.5 flex-1">
                          {items.schedule.map(s => (
                            <div
                              key={s.id}
                              className="p-1.5 rounded-lg bg-surface border border-line text-[11px]"
                            >
                              <span className="font-mono text-[10px] text-accent block tabular-nums">
                                {s.startTime}
                              </span>
                              <span className="text-ink font-medium line-clamp-2">{s.title}</span>
                            </div>
                          ))}

                          {items.tasks.map(t => (
                            <div
                              key={t.id}
                              className="p-1.5 rounded-lg bg-accent/15 border border-accent/25 text-[11px] text-ink"
                            >
                              <span className="font-medium line-clamp-2">{t.title}</span>
                            </div>
                          ))}

                          {items.learningLessons.map(l => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                setSelectedLearningModuleId(l.moduleId);
                                setSelectedLearningLessonId(l.id);
                                setCurrentView('learning');
                              }}
                              className="w-full text-left p-1.5 rounded-lg bg-surface border border-line hover:border-accent text-[11px] text-ink transition-colors"
                            >
                              <span className="text-[10px] text-accent block">Lesson</span>
                              <span className="font-medium line-clamp-1">{l.title}</span>
                            </button>
                          ))}

                          {items.workouts.map(w => (
                            <div
                              key={w.id}
                              className="p-1.5 rounded-lg bg-surface-inset text-[11px] text-ink-muted flex items-center gap-1"
                            >
                              <Dumbbell className="w-3 h-3 shrink-0 text-sage" />
                              <span className="truncate">{w.routineName}</span>
                            </div>
                          ))}

                          {total === 0 && (
                            <span className="text-[11px] text-ink-muted/60 block pt-1">
                              Clear
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {viewMode === 'day' && (
              <motion.div
                key={`day-${selectedDateStr}`}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="space-y-4"
              >
                {/* All-Day / Due Date Strip */}
                {(selectedItems.tasks.length > 0 ||
                  selectedItems.learningLessons.length > 0 ||
                  selectedItems.goalsDue.length > 0) && (
                  <div className="p-3 rounded-xl bg-surface-warm/60 border border-line space-y-2">
                    <span className="text-xs font-semibold text-ink block">
                      Due & Scheduled Milestones
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.tasks.map(t => (
                        <div
                          key={t.id}
                          className="px-2.5 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          <span>{t.title}</span>
                        </div>
                      ))}
                      {selectedItems.learningLessons.map(l => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            setSelectedLearningModuleId(l.moduleId);
                            setSelectedLearningLessonId(l.id);
                            setCurrentView('learning');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-surface border border-line hover:border-accent text-xs text-ink flex items-center gap-1.5 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-accent" />
                          <span>{l.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hourly Timeline */}
                <div className="divide-y divide-line border border-line rounded-xl overflow-hidden max-h-[520px] overflow-y-auto">
                  {DAY_HOURS.map(hour => {
                    const slotBlocks = selectedItems.schedule.filter(s => {
                      const mins = parseTimeToMinutes(s.startTime);
                      return mins !== null && Math.floor(mins / 60) === hour;
                    });

                    return (
                      <div
                        key={hour}
                        className="flex items-stretch min-h-[52px] bg-surface hover:bg-surface-warm/30 transition-colors"
                      >
                        <div className="w-16 sm:w-20 px-2.5 py-2 border-r border-line text-[11px] font-mono text-ink-muted tabular-nums shrink-0 flex items-start">
                          {formatHourSlot(hour, timeFormat)}
                        </div>
                        <div className="flex-1 p-1.5 flex flex-col gap-1">
                          {slotBlocks.map(block => (
                            <div
                              key={block.id}
                              className="px-3 py-2 rounded-lg bg-accent/20 border border-accent/35 text-xs flex items-center justify-between gap-2"
                            >
                              <span className="font-semibold text-ink truncate">{block.title}</span>
                              <span className="font-mono text-[11px] text-ink-muted tabular-nums shrink-0">
                                {block.startTime} — {block.endTime}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Date Inspector (4 cols) */}
        <aside className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-surface border border-line space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <span className="text-[11px] font-mono uppercase text-accent font-semibold block">
                Selected Day
              </span>
              <h3 className="text-sm font-bold text-ink font-mono tabular-nums">
                {selectedDateStr}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddEventModal(true)}
              className="btn-press text-xs font-semibold text-brand dark:text-accent hover:underline"
            >
              + Add Block
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedDateStr}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.15, ease: MOMENTUM_EASE }}
              className="space-y-3"
            >
              {selectedItems.schedule.map(s => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-surface-warm/60 border border-line text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{s.title}</span>
                    <span className="font-mono text-[11px] font-semibold text-accent tabular-nums shrink-0">
                      {s.startTime} - {s.endTime}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Scheduled Activity
                  </span>
                </div>
              ))}

              {selectedItems.tasks.map(t => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-surface-warm/60 border border-line text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    {t.learningModuleId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLearningModuleId(t.learningModuleId!);
                          setSelectedLearningLessonId(t.learningLessonId || null);
                          setCurrentView('learning');
                        }}
                        className="font-semibold text-ink hover:text-accent text-left"
                      >
                        {t.title}
                      </button>
                    ) : (
                      <span className="font-semibold text-ink">{t.title}</span>
                    )}
                    <span className="text-[11px] font-mono capitalize font-semibold text-accent shrink-0">
                      {t.priority}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted block">
                    {t.learningModuleTitle
                      ? `Learning Deadline · ${t.learningModuleTitle}`
                      : 'Task Deadline'}
                  </span>
                </div>
              ))}

              {selectedItems.learningLessons.map(l => {
                const mod = learningData?.modules.find(m => m.id === l.moduleId);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSelectedLearningModuleId(l.moduleId);
                      setSelectedLearningLessonId(l.id);
                      setCurrentView('learning');
                    }}
                    className="w-full text-left p-3 rounded-xl bg-surface-warm/60 border border-line hover:border-accent text-xs space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-ink truncate">{l.title}</span>
                      <span className="text-[11px] font-mono text-accent tabular-nums shrink-0">
                        {l.studyDurationMinutes}m
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-muted block truncate">
                      Lesson{mod ? ` · ${mod.title}` : ''}
                      {l.teacherName ? ` · ${l.teacherName}` : ''}
                    </span>
                  </button>
                );
              })}

              {selectedItems.learningStudy.map(s => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-surface-warm/60 border border-line text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{s.subject}</span>
                    <span className="text-[11px] font-mono text-success tabular-nums">
                      {s.durationMinutes}m
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted block">Study Session</span>
                </div>
              ))}

              {selectedItems.workouts.map(w => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-surface-warm/60 border border-line text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-sage" />
                      {w.routineName}
                    </span>
                    <span className="text-[11px] font-mono text-ink-muted tabular-nums">
                      {w.durationMinutes}m
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted block">Workout Session</span>
                </div>
              ))}

              {selectedItems.tasks.length === 0 &&
                selectedItems.schedule.length === 0 &&
                selectedItems.workouts.length === 0 &&
                selectedItems.learningLessons.length === 0 &&
                selectedItems.learningStudy.length === 0 && (
                  <div className="py-8 text-center text-ink-muted text-xs">
                    No scheduled activities on this date.
                  </div>
                )}
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>

      {/* Schedule Activity Modal */}
      <ModalShell
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        maxWidthClass="max-w-sm"
      >
        <div className="px-5 py-3.5 border-b border-line bg-brand dark:bg-surface-warm flex items-center justify-between">
          <span className="text-xs font-semibold text-brand-ink dark:text-ink">Schedule Block</span>
          <button
            type="button"
            onClick={() => setShowAddEventModal(false)}
            className="p-1 rounded-lg text-brand-ink/80 dark:text-ink-muted hover:text-brand-ink dark:hover:text-ink transition-colors"
            aria-label="Close schedule modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleCreateEvent} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Title</label>
            <input
              type="text"
              required
              value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              placeholder="e.g. Deep Work: Architecture Spec"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Start</label>
              <input
                type="time"
                value={newEventStartTime}
                onChange={e => setNewEventStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-canvas border border-line text-xs text-ink font-mono focus:ring-2 focus:ring-accent focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">End</label>
              <input
                type="time"
                value={newEventEndTime}
                onChange={e => setNewEventEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-canvas border border-line text-xs text-ink font-mono focus:ring-2 focus:ring-accent focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddEventModal(false)}
              className="btn-press px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors"
            >
              Save Event
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
