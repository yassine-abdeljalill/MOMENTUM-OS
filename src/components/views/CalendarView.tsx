import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  BookOpen,
  Check,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import {
  formatIsoDate,
  parseIsoDate,
  addDaysToIso,
  getWeekDays,
  getFullMonthMatrix,
  formatHourSlot,
  formatTimeCompact,
  getCurrentTimeLinePercentage,
  layoutOverlappingBlocks,
} from '../../lib/calendar';
import { ModalShell, MOMENTUM_EASE, MOMENTUM_SPRING } from '../common/MotionPrimitives';
import { getStaggerDelay } from '../../lib/motion';
import type { LifeArea } from '../../types';

type CalendarViewMode = 'day' | 'week' | 'month';

const DAY_START_HOUR = 6;
const DAY_END_HOUR_EXCLUSIVE = 23; // 06:00 through 22:00 slots (17 hours)
const DAY_HOURS = Array.from(
  { length: DAY_END_HOUR_EXCLUSIVE - DAY_START_HOUR },
  (_, i) => i + DAY_START_HOUR
);
const HOUR_ROW_PX = 52;
const TIMELINE_TOTAL_PX = DAY_HOURS.length * HOUR_ROW_PX;

const SCHEDULE_CATEGORIES: { value: LifeArea; label: string }[] = [
  { value: 'career', label: 'Deep Work' },
  { value: 'education', label: 'Learning' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'personal_development', label: 'Personal' },
];

export const CalendarView: React.FC = () => {
  const prefersReduced = useReducedMotion();
  const {
    state,
    learningData,
    addScheduleActivity,
    toggleScheduleActivityCompleted,
    deleteScheduleActivity,
    toggleTaskCompleted,
    setCurrentView,
    setSelectedLearningModuleId,
    setSelectedLearningLessonId,
    showToast,
  } = useApp();

  const now = new Date();
  const todayStr = formatIsoDate(now);
  const startOfWeek = state.preferences.startOfWeek || 'monday';
  const timeFormat = state.preferences.timeFormat || '24h';

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventDateStr, setEventDateStr] = useState(todayStr);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');
  const [newEventCategory, setNewEventCategory] = useState<LifeArea>('career');

  const anchorDate = useMemo(() => parseIsoDate(selectedDateStr), [selectedDateStr]);
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  const weekDays = useMemo(
    () => getWeekDays(selectedDateStr, startOfWeek),
    [selectedDateStr, startOfWeek]
  );

  const monthMatrix = useMemo(
    () => getFullMonthMatrix(year, month, startOfWeek),
    [year, month, startOfWeek]
  );

  const weekdayHeaders =
    startOfWeek === 'monday'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentTimePct = useMemo(
    () => getCurrentTimeLinePercentage(now, DAY_START_HOUR, DAY_END_HOUR_EXCLUSIVE),
    // Re-evaluate when selected date changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDateStr]
  );

  const openScheduleModal = (dateStr: string = selectedDateStr, startHour?: number) => {
    setEventDateStr(dateStr);
    if (typeof startHour === 'number') {
      const clampedStart = Math.max(0, Math.min(22, startHour));
      const endHour = Math.min(23, clampedStart + 1);
      setNewEventStartTime(`${String(clampedStart).padStart(2, '0')}:00`);
      setNewEventEndTime(`${String(endHour).padStart(2, '0')}:00`);
    } else {
      setNewEventStartTime('09:00');
      setNewEventEndTime('10:00');
    }
    setNewEventTitle('');
    setShowAddEventModal(true);
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setSelectedDateStr(formatIsoDate(new Date(year, month - 1, 1)));
    } else if (viewMode === 'week') {
      setSelectedDateStr(addDaysToIso(selectedDateStr, -7));
    } else {
      setSelectedDateStr(addDaysToIso(selectedDateStr, -1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setSelectedDateStr(formatIsoDate(new Date(year, month + 1, 1)));
    } else if (viewMode === 'week') {
      setSelectedDateStr(addDaysToIso(selectedDateStr, 7));
    } else {
      setSelectedDateStr(addDaysToIso(selectedDateStr, 1));
    }
  };

  const handleToday = () => {
    setSelectedDateStr(todayStr);
  };

  const periodMonthLabel = useMemo(() => {
    if (viewMode === 'month') {
      return anchorDate.toLocaleDateString([], { month: 'long' });
    }
    if (viewMode === 'week') {
      const start = parseIsoDate(weekDays[0]);
      const end = parseIsoDate(weekDays[6]);
      if (start.getMonth() === end.getMonth()) {
        return start.toLocaleDateString([], { month: 'long' });
      }
      return `${start.toLocaleDateString([], { month: 'short' })} – ${end.toLocaleDateString([], { month: 'short' })}`;
    }
    return anchorDate.toLocaleDateString([], { month: 'long', day: 'numeric' });
  }, [viewMode, anchorDate, weekDays]);

  const periodYearLabel = useMemo(() => String(year), [year]);

  const itemsByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        tasks: typeof state.tasks;
        schedule: typeof state.dailySchedule;
        workouts: typeof state.workoutSessions;
        study: typeof state.studySessions;
        learningLessons: NonNullable<typeof learningData>['lessons'];
        learningStudy: NonNullable<typeof learningData>['studySessions'];
        goalsDue: typeof state.goals;
      }
    >();

    const ensure = (d: string) => {
      let bucket = map.get(d);
      if (!bucket) {
        bucket = {
          tasks: [],
          schedule: [],
          workouts: [],
          study: [],
          learningLessons: [],
          learningStudy: [],
          goalsDue: [],
        };
        map.set(d, bucket);
      }
      return bucket;
    };

    for (const t of state.tasks) {
      if (t.dueDate) ensure(t.dueDate).tasks.push(t);
    }
    for (const s of state.dailySchedule || []) {
      ensure(s.date).schedule.push(s);
    }
    for (const bucket of map.values()) {
      bucket.schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    for (const w of state.workoutSessions) {
      ensure(w.date).workouts.push(w);
    }
    for (const st of state.studySessions) {
      ensure(st.date).study.push(st);
    }
    for (const l of learningData?.lessons || []) {
      if (l.lessonDate) ensure(l.lessonDate).learningLessons.push(l);
    }
    for (const ls of learningData?.studySessions || []) {
      ensure(ls.date).learningStudy.push(ls);
    }
    for (const g of state.goals) {
      if (g.targetDate) ensure(g.targetDate).goalsDue.push(g);
    }

    return map;
  }, [
    state.tasks,
    state.dailySchedule,
    state.workoutSessions,
    state.studySessions,
    state.goals,
    learningData,
  ]);

  const getItemsForDate = (dateStr: string) =>
    itemsByDate.get(dateStr) || {
      tasks: [],
      schedule: [],
      workouts: [],
      study: [],
      learningLessons: [],
      learningStudy: [],
      goalsDue: [],
    };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    addScheduleActivity({
      date: eventDateStr,
      title: newEventTitle.trim(),
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      category: newEventCategory,
      completed: false,
    });

    setSelectedDateStr(eventDateStr);
    setNewEventTitle('');
    setShowAddEventModal(false);
    showToast('Event scheduled.');
  };

  const selectedItems = getItemsForDate(selectedDateStr);
  const selectedTotalCount =
    selectedItems.schedule.length +
    selectedItems.tasks.length +
    selectedItems.learningLessons.length +
    selectedItems.learningStudy.length +
    selectedItems.study.length +
    selectedItems.workouts.length +
    selectedItems.goalsDue.length;

  const weekHasAllDayItems = useMemo(
    () =>
      weekDays.some(d => {
        const it = getItemsForDate(d);
        return it.tasks.length > 0 || it.learningLessons.length > 0 || it.goalsDue.length > 0;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekDays, itemsByDate]
  );

  const selectedDateFormatted = anchorDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const relativeDayLabel = useMemo(() => {
    if (selectedDateStr === todayStr) return 'Today';
    if (selectedDateStr === addDaysToIso(todayStr, 1)) return 'Tomorrow';
    if (selectedDateStr === addDaysToIso(todayStr, -1)) return 'Yesterday';
    return anchorDate.toLocaleDateString([], { year: 'numeric' });
  }, [selectedDateStr, todayStr, anchorDate]);

  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* Unified Apple Calendar Workspace Surface */}
      <div className="rounded-2xl bg-surface border border-line overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]">
        {/* Top Apple Calendar Toolbar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-line bg-sidebar flex flex-wrap items-center justify-between gap-3">
          {/* Left: Period Heading + Joined Apple Navigation Stepper */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight font-heading whitespace-nowrap">
              {periodMonthLabel}{' '}
              <span className="font-normal text-ink-muted tabular-nums">{periodYearLabel}</span>
            </h1>

            <div className="inline-flex items-center rounded-lg border border-line bg-surface divide-x divide-line shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handlePrev}
                className="px-2 py-1.5 text-ink-muted hover:text-ink hover:bg-surface-warm transition-colors rounded-l-lg"
                aria-label={`Previous ${viewMode}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedDateStr === todayStr
                    ? 'text-ink font-semibold bg-surface-warm/60'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-warm'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-2 py-1.5 text-ink-muted hover:text-ink hover:bg-surface-warm transition-colors rounded-r-lg"
                aria-label={`Next ${viewMode}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Apple Segmented View Control + New Event CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            <div
              role="tablist"
              aria-label="Calendar view mode"
              className="inline-flex p-0.5 rounded-lg bg-surface-inset/75 border border-line relative"
            >
              {(['day', 'week', 'month'] as const).map(mode => {
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setViewMode(mode)}
                    className={`relative z-10 px-3 py-1.5 min-h-[30px] rounded-[7px] capitalize text-xs transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-ink font-semibold'
                        : 'text-ink-muted hover:text-ink font-medium'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="apple-calendar-mode-pill"
                        transition={prefersReduced ? { duration: 0.01 } : MOMENTUM_SPRING}
                        className="absolute inset-0 bg-surface rounded-[7px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] -z-10"
                      />
                    )}
                    {mode}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => openScheduleModal(selectedDateStr)}
              className="btn-press flex items-center gap-1.5 px-3.5 py-2 min-h-[34px] rounded-lg bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.25]" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Main Split Calendar Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
          {/* Calendar Canvas (8-9 cols) */}
          <div className="lg:col-span-8 xl:col-span-9 bg-surface border-b lg:border-b-0 lg:border-r border-line min-w-0 flex flex-col">
            <AnimatePresence mode="wait" initial={false}>
              {/* ==================== MONTH VIEW ==================== */}
              {viewMode === 'month' && (
                <motion.div
                  key={`month-${year}-${month}`}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.992 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.24, ease: MOMENTUM_EASE }}
                  className="flex-1 flex flex-col"
                >
                  {/* Desktop / Tablet Edge-to-Edge Apple Hairline Month Grid */}
                  <div className="hidden sm:flex sm:flex-col flex-1">
                    <div className="grid grid-cols-7 border-b border-line bg-sidebar shrink-0">
                      {weekdayHeaders.map(d => (
                        <div
                          key={d}
                          className="px-2.5 py-2 text-right text-[11px] font-medium text-ink-muted tracking-tight"
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    <div
                      className="grid grid-cols-7 flex-1"
                      style={{
                        gridTemplateRows: `repeat(${Math.max(5, Math.ceil(monthMatrix.length / 7))}, minmax(108px, 1fr))`,
                      }}
                    >
                      {monthMatrix.map((cell, idx) => {
                        const isSelected = selectedDateStr === cell.dateStr;
                        const isToday = todayStr === cell.dateStr;
                        const isLastRow = idx >= monthMatrix.length - 7;
                        const isLastCol = (idx + 1) % 7 === 0;
                        const items = getItemsForDate(cell.dateStr);

                        const visibleBars: {
                          key: string;
                          label: string;
                          time?: string;
                          tone: 'solid' | 'tinted' | 'outline';
                          done?: boolean;
                        }[] = [];

                        for (const s of items.schedule) {
                          visibleBars.push({
                            key: s.id,
                            label: s.title,
                            time: formatTimeCompact(s.startTime, timeFormat),
                            tone: 'solid',
                            done: s.completed,
                          });
                        }
                        for (const t of items.tasks) {
                          visibleBars.push({
                            key: t.id,
                            label: t.title,
                            tone: 'tinted',
                            done: t.status === 'completed',
                          });
                        }
                        for (const l of items.learningLessons) {
                          visibleBars.push({
                            key: l.id,
                            label: l.title,
                            tone: 'outline',
                          });
                        }
                        for (const w of items.workouts) {
                          visibleBars.push({
                            key: w.id,
                            label: w.routineName,
                            tone: 'tinted',
                          });
                        }
                        for (const g of items.goalsDue) {
                          visibleBars.push({
                            key: g.id,
                            label: g.title,
                            tone: 'outline',
                          });
                        }

                        const overflowCount = Math.max(0, visibleBars.length - 3);

                        return (
                          <div
                            key={cell.dateStr}
                            onClick={() => setSelectedDateStr(cell.dateStr)}
                            onDoubleClick={() => openScheduleModal(cell.dateStr)}
                            className={`group relative min-h-[104px] p-1.5 flex flex-col justify-between transition-colors cursor-pointer select-none ${
                              !isLastCol ? 'border-r border-line' : ''
                            } ${!isLastRow ? 'border-b border-line' : ''} ${
                              isSelected
                                ? 'bg-surface-warm/85'
                                : cell.inCurrentMonth
                                ? 'bg-surface hover:bg-surface-warm/45'
                                : 'bg-sidebar hover:bg-surface-warm/35'
                            }`}
                          >
                            {/* Top Row: Subtle hover + button & Apple Date Number */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDateStr(cell.dateStr);
                                  openScheduleModal(cell.dateStr);
                                }}
                                aria-label={`Add event on ${cell.dateStr}`}
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-inset transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDateStr(cell.dateStr);
                                }}
                                aria-label={`Select ${cell.dateStr} (${visibleBars.length} items)`}
                                aria-pressed={isSelected}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs tabular-nums transition-colors ${
                                  isToday
                                    ? 'bg-accent text-accent-ink font-semibold'
                                    : isSelected
                                    ? 'bg-surface-inset text-ink font-semibold'
                                    : cell.inCurrentMonth
                                    ? 'text-ink font-medium'
                                    : 'text-ink-muted/45 font-normal'
                                }`}
                              >
                                {cell.dayNumber}
                              </button>
                            </div>

                            {/* Compact Apple Event Rows */}
                            <div className="space-y-0.5 overflow-hidden flex-1">
                              {visibleBars.slice(0, 3).map(bar => (
                                <div
                                  key={bar.key}
                                  className={`px-1.5 py-[2px] rounded-[5px] text-[10.5px] leading-tight flex items-center gap-1 truncate ${
                                    bar.done
                                      ? 'bg-surface-inset/70 text-ink-muted line-through'
                                      : bar.tone === 'solid'
                                      ? 'bg-accent text-accent-ink font-medium'
                                      : bar.tone === 'tinted'
                                      ? 'bg-surface-warm text-ink border border-line font-medium'
                                      : 'bg-surface text-ink border border-line-strong font-medium'
                                  }`}
                                >
                                  {bar.time && (
                                    <span
                                      className={`font-mono text-[9.5px] tabular-nums shrink-0 ${
                                        bar.tone === 'solid' && !bar.done
                                          ? 'text-accent-ink/75'
                                          : 'text-ink-muted'
                                      }`}
                                    >
                                      {bar.time}
                                    </span>
                                  )}
                                  <span className="truncate">{bar.label}</span>
                                </div>
                              ))}
                              {overflowCount > 0 && (
                                <div className="px-1 text-[10px] font-medium text-ink-muted tabular-nums">
                                  +{overflowCount} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile iOS Calendar Style Month Grid */}
                  <div className="sm:hidden p-3 space-y-2">
                    <div className="grid grid-cols-7 text-center text-[11px] font-medium text-ink-muted pb-1">
                      {weekdayHeaders.map(d => (
                        <span key={d}>{d.slice(0, 1)}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1.5 text-center">
                      {monthMatrix.map(cell => {
                        const isSelected = selectedDateStr === cell.dateStr;
                        const isToday = todayStr === cell.dateStr;
                        const items = getItemsForDate(cell.dateStr);
                        const itemCount =
                          items.schedule.length +
                          items.tasks.length +
                          items.learningLessons.length +
                          items.workouts.length +
                          items.goalsDue.length;
                        const dotCount = Math.min(3, itemCount);

                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => setSelectedDateStr(cell.dateStr)}
                            aria-label={`Select ${cell.dateStr} (${itemCount} items)`}
                            aria-pressed={isSelected}
                            className="flex flex-col items-center justify-center py-1 gap-1"
                          >
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs tabular-nums transition-colors ${
                                isSelected
                                  ? 'bg-accent text-accent-ink font-semibold'
                                  : isToday
                                  ? 'border border-accent text-ink font-semibold'
                                  : cell.inCurrentMonth
                                  ? 'text-ink font-medium'
                                  : 'text-ink-muted/40'
                              }`}
                            >
                              {cell.dayNumber}
                            </span>
                            <span className="flex items-center justify-center gap-0.5 h-1.5">
                              {Array.from({ length: dotCount }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`w-1 h-1 rounded-full ${
                                    isSelected ? 'bg-accent' : 'bg-ink-muted/70'
                                  }`}
                                />
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ==================== WEEK VIEW ==================== */}
              {viewMode === 'week' && (
                <motion.div
                  key={`week-${weekDays[0]}`}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.14 }}
                >
                  {/* Desktop / Tablet True Apple Hourly Week Grid */}
                  <div className="hidden sm:flex flex-col">
                    {/* Sticky 7-Day Header */}
                    <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line bg-sidebar">
                      <div className="px-2 py-2.5 text-[10px] font-mono text-ink-muted flex items-end justify-end">
                        Time
                      </div>
                      {weekDays.map(dateStr => {
                        const dt = parseIsoDate(dateStr);
                        const isSelected = selectedDateStr === dateStr;
                        const isToday = todayStr === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedDateStr(dateStr)}
                            className={`py-2 px-1.5 border-l border-line flex flex-col items-center gap-1 transition-colors ${
                              isSelected ? 'bg-surface-warm/85' : 'hover:bg-surface-warm/50'
                            }`}
                          >
                            <span className="text-[10.5px] font-medium text-ink-muted uppercase">
                              {dt.toLocaleDateString([], { weekday: 'short' })}
                            </span>
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs tabular-nums ${
                                isToday
                                  ? 'bg-accent text-accent-ink font-semibold'
                                  : isSelected
                                  ? 'bg-surface-inset text-ink font-semibold'
                                  : 'text-ink font-medium'
                              }`}
                            >
                              {dt.getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* All-Day / Deadlines Strip */}
                    {weekHasAllDayItems && (
                      <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-line bg-sidebar/70">
                        <div className="px-2 py-2 text-[10px] font-medium text-ink-muted text-right">
                          All Day
                        </div>
                        {weekDays.map(dateStr => {
                          const items = getItemsForDate(dateStr);
                          return (
                            <div
                              key={dateStr}
                              className="p-1 border-l border-line space-y-1 min-h-[34px]"
                            >
                              {items.tasks.slice(0, 2).map(t => (
                                <div
                                  key={t.id}
                                  className={`px-1.5 py-0.5 rounded text-[10px] truncate border ${
                                    t.status === 'completed'
                                      ? 'bg-surface-inset text-ink-muted border-line line-through'
                                      : 'bg-surface text-ink border-line-strong font-medium'
                                  }`}
                                >
                                  {t.title}
                                </div>
                              ))}
                              {items.learningLessons.slice(0, 1).map(l => (
                                <div
                                  key={l.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] truncate bg-surface-warm text-ink border border-line"
                                >
                                  {l.title}
                                </div>
                              ))}
                              {items.goalsDue.slice(0, 1).map(g => (
                                <div
                                  key={g.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] truncate bg-accent text-accent-ink"
                                >
                                  {g.title}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Scrollable Hourly Grid */}
                    <div className="max-h-[620px] overflow-y-auto">
                      <div
                        className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]"
                        style={{ height: `${TIMELINE_TOTAL_PX}px` }}
                      >
                        {/* Left Hour Gutter */}
                        <div className="bg-sidebar">
                          {DAY_HOURS.map((hour, hourIdx) => (
                            <div
                              key={hour}
                              style={{ height: `${HOUR_ROW_PX}px` }}
                              className="relative pr-2 text-right text-[10.5px] font-mono text-ink-muted tabular-nums border-b border-line/60"
                            >
                              <span
                                className={`block leading-none ${
                                  hourIdx === 0 ? 'pt-1' : '-translate-y-1.5 bg-sidebar pl-1'
                                }`}
                              >
                                {formatHourSlot(hour, timeFormat)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* 7 Day Columns */}
                        {weekDays.map(dateStr => {
                          const items = getItemsForDate(dateStr);
                          const positionedBlocks = layoutOverlappingBlocks(
                            items.schedule,
                            DAY_START_HOUR,
                            DAY_END_HOUR_EXCLUSIVE
                          );
                          const isSelected = selectedDateStr === dateStr;
                          const isToday = todayStr === dateStr;

                          return (
                            <div
                              key={dateStr}
                              className={`relative border-l border-line ${
                                isSelected ? 'bg-canvas/45' : 'bg-surface'
                              }`}
                            >
                              {/* Clickable Empty Hourly Rows */}
                              {DAY_HOURS.map(hour => (
                                <button
                                  key={hour}
                                  type="button"
                                  onClick={() => {
                                    setSelectedDateStr(dateStr);
                                    openScheduleModal(dateStr, hour);
                                  }}
                                  aria-label={`Schedule on ${dateStr} at ${formatHourSlot(hour, timeFormat)}`}
                                  style={{ height: `${HOUR_ROW_PX}px` }}
                                  className="block w-full border-b border-line/60 hover:bg-surface-warm/55 transition-colors text-left"
                                />
                              ))}

                              {/* Live Current Time Line */}
                              {isToday && currentTimePct !== null && (
                                <div
                                  aria-hidden="true"
                                  style={{ top: `${currentTimePct}%` }}
                                  className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                                >
                                  <span className="w-2 h-2 -ml-1 rounded-full bg-accent shrink-0" />
                                  <span className="flex-1 h-[1.5px] bg-accent" />
                                </div>
                              )}

                              {/* Side-by-Side Non-Colliding Timed Schedule Blocks */}
                              {positionedBlocks.map(({ item: block, topPct, heightPct, lane, totalLanes }, bIdx) => {
                                const laneWidth = 100 / totalLanes;
                                const laneLeft = lane * laneWidth;
                                return (
                                  <motion.button
                                    key={block.id}
                                    type="button"
                                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                      duration: prefersReduced ? 0.01 : 0.24,
                                      delay: prefersReduced ? 0 : getStaggerDelay(bIdx, 0.02, 0.03),
                                      ease: MOMENTUM_EASE,
                                    }}
                                    whileHover={prefersReduced ? undefined : { scale: 1.015 }}
                                    whileTap={prefersReduced ? undefined : { scale: 0.985 }}
                                    onClick={e => {
                                      e.stopPropagation();
                                      setSelectedDateStr(dateStr);
                                    }}
                                    style={{
                                      top: `${topPct}%`,
                                      height: `${heightPct}%`,
                                      left: `calc(${laneLeft}% + 2px)`,
                                      width: `calc(${laneWidth}% - 4px)`,
                                    }}
                                    title={`${block.title} (${formatTimeCompact(block.startTime, timeFormat)} – ${formatTimeCompact(block.endTime, timeFormat)})`}
                                    className={`absolute z-10 rounded-lg px-1.5 py-1 text-left overflow-hidden border transition-opacity ${
                                      block.completed
                                        ? 'bg-surface-inset text-ink-muted border-line-strong opacity-85'
                                        : 'bg-accent text-accent-ink border-line shadow-xs'
                                    }`}
                                  >
                                    <div className="text-[10.5px] font-semibold truncate leading-tight">
                                      {block.title}
                                    </div>
                                    <div
                                      className={`text-[9.5px] font-mono tabular-nums truncate ${
                                        block.completed ? 'text-ink-muted' : 'text-accent-ink/75'
                                      }`}
                                    >
                                      {formatTimeCompact(block.startTime, timeFormat)}
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Week Strip + Day Timeline */}
                  <div className="sm:hidden">
                    <div className="grid grid-cols-7 gap-1 px-3 py-2.5 border-b border-line bg-sidebar">
                      {weekDays.map(dateStr => {
                        const dt = parseIsoDate(dateStr);
                        const isSelected = selectedDateStr === dateStr;
                        const isToday = todayStr === dateStr;
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedDateStr(dateStr)}
                            className="flex flex-col items-center gap-1 py-1"
                          >
                            <span className="text-[10px] font-medium text-ink-muted uppercase">
                              {dt.toLocaleDateString([], { weekday: 'narrow' })}
                            </span>
                            <span
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs tabular-nums ${
                                isSelected
                                  ? 'bg-accent text-accent-ink font-semibold'
                                  : isToday
                                  ? 'border border-accent text-ink font-semibold'
                                  : 'text-ink font-medium'
                              }`}
                            >
                              {dt.getDate()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <DayTimelineCanvas
                      dateStr={selectedDateStr}
                      isToday={selectedDateStr === todayStr}
                      items={selectedItems}
                      timeFormat={timeFormat}
                      currentTimePct={currentTimePct}
                      onClickSlot={hour => openScheduleModal(selectedDateStr, hour)}
                      onToggleSchedule={toggleScheduleActivityCompleted}
                      onToggleTask={toggleTaskCompleted}
                      onOpenLesson={(moduleId, lessonId) => {
                        setSelectedLearningModuleId(moduleId);
                        setSelectedLearningLessonId(lessonId);
                        setCurrentView('learning');
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* ==================== DAY VIEW ==================== */}
              {viewMode === 'day' && (
                <motion.div
                  key={`day-${selectedDateStr}`}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.14 }}
                >
                  <DayTimelineCanvas
                    dateStr={selectedDateStr}
                    isToday={selectedDateStr === todayStr}
                    items={selectedItems}
                    timeFormat={timeFormat}
                    currentTimePct={currentTimePct}
                    onClickSlot={hour => openScheduleModal(selectedDateStr, hour)}
                    onToggleSchedule={toggleScheduleActivityCompleted}
                    onToggleTask={toggleTaskCompleted}
                    onOpenLesson={(moduleId, lessonId) => {
                      setSelectedLearningModuleId(moduleId);
                      setSelectedLearningLessonId(lessonId);
                      setCurrentView('learning');
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Apple Day Inspector (3-4 cols) */}
          <aside
            aria-label="Selected day inspector"
            className="lg:col-span-4 xl:col-span-3 bg-sidebar p-5 flex flex-col gap-5"
          >
            {/* Date Header */}
            <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-line">
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-ink-muted block">
                  {relativeDayLabel}
                </span>
                <h2 className="text-base font-bold text-ink font-heading tracking-tight truncate">
                  {selectedDateFormatted}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => openScheduleModal(selectedDateStr)}
                className="btn-press px-2.5 py-1 rounded-lg border border-line bg-surface hover:bg-surface-warm text-xs font-medium text-ink shrink-0"
              >
                + Add
              </button>
            </div>

            {/* Compact Monochrome Summary Metrics */}
            <div className="grid grid-cols-3 divide-x divide-line rounded-xl bg-surface border border-line py-2.5 text-center">
              <div>
                <div className="text-sm font-bold text-ink tabular-nums">
                  {selectedItems.schedule.length}
                </div>
                <div className="text-[10.5px] text-ink-muted">Events</div>
              </div>
              <div>
                <div className="text-sm font-bold text-ink tabular-nums">
                  {selectedItems.tasks.length}
                </div>
                <div className="text-[10.5px] text-ink-muted">Tasks</div>
              </div>
              <div>
                <div className="text-sm font-bold text-ink tabular-nums">
                  {selectedItems.learningLessons.length + selectedItems.workouts.length}
                </div>
                <div className="text-[10.5px] text-ink-muted">Sessions</div>
              </div>
            </div>

            {/* Grouped Agenda List */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedDateStr}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                className="space-y-4 flex-1"
              >
                {/* Scheduled Time Blocks */}
                {selectedItems.schedule.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      Schedule
                    </h3>
                    <div className="space-y-1.5">
                      {selectedItems.schedule.map(s => (
                        <div
                          key={s.id}
                          className="group p-2.5 rounded-xl bg-surface border border-line flex items-start gap-2.5 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => toggleScheduleActivityCompleted(s.id)}
                            aria-label={`Toggle ${s.title} completion`}
                            className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              s.completed
                                ? 'bg-accent border-accent text-accent-ink'
                                : 'border-line-strong hover:border-ink'
                            }`}
                          >
                            {s.completed && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-medium truncate ${
                                s.completed ? 'line-through text-ink-muted' : 'text-ink'
                              }`}
                            >
                              {s.title}
                            </div>
                            <div className="text-[11px] font-mono text-ink-muted tabular-nums mt-0.5">
                              {formatTimeCompact(s.startTime, timeFormat)} –{' '}
                              {formatTimeCompact(s.endTime, timeFormat)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              deleteScheduleActivity(s.id);
                              showToast('Event removed.', 'info');
                            }}
                            aria-label={`Delete ${s.title}`}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-ink-muted hover:text-ink transition-opacity shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Due Tasks */}
                {selectedItems.tasks.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      Due Tasks
                    </h3>
                    <div className="space-y-1.5">
                      {selectedItems.tasks.map(t => {
                        const done = t.status === 'completed';
                        return (
                          <div
                            key={t.id}
                            className="p-2.5 rounded-xl bg-surface border border-line flex items-start gap-2.5 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => toggleTaskCompleted(t.id)}
                              aria-label={`Mark ${t.title} as ${done ? 'incomplete' : 'complete'}`}
                              className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                done
                                  ? 'bg-accent border-accent text-accent-ink'
                                  : 'border-line-strong hover:border-ink'
                              }`}
                            >
                              {done && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              {t.learningModuleId ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLearningModuleId(t.learningModuleId!);
                                    setSelectedLearningLessonId(t.learningLessonId || null);
                                    setCurrentView('learning');
                                  }}
                                  className={`font-medium text-left hover:underline truncate block w-full ${
                                    done ? 'line-through text-ink-muted' : 'text-ink'
                                  }`}
                                >
                                  {t.title}
                                </button>
                              ) : (
                                <span
                                  className={`font-medium block truncate ${
                                    done ? 'line-through text-ink-muted' : 'text-ink'
                                  }`}
                                >
                                  {t.title}
                                </span>
                              )}
                              <span className="text-[11px] text-ink-muted capitalize">
                                {t.priority} priority
                                {t.learningModuleTitle ? ` · ${t.learningModuleTitle}` : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Lessons & Study */}
                {(selectedItems.learningLessons.length > 0 ||
                  selectedItems.learningStudy.length > 0 ||
                  selectedItems.study.length > 0) && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      Learning
                    </h3>
                    <div className="space-y-1.5">
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
                            className="w-full text-left p-2.5 rounded-xl bg-surface border border-line hover:border-line-strong text-xs flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-ink shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium text-ink truncate">{l.title}</div>
                                {mod && (
                                  <div className="text-[11px] text-ink-muted truncate">
                                    {mod.title}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] font-mono text-ink-muted tabular-nums shrink-0">
                              {l.studyDurationMinutes}m
                            </span>
                          </button>
                        );
                      })}
                      {[...selectedItems.learningStudy, ...selectedItems.study].map(s => (
                        <div
                          key={s.id}
                          className="p-2.5 rounded-xl bg-surface border border-line text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-medium text-ink truncate">{s.subject}</span>
                          <span className="text-[11px] font-mono text-ink-muted tabular-nums shrink-0">
                            {s.durationMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Workouts & Goal Deadlines */}
                {(selectedItems.workouts.length > 0 || selectedItems.goalsDue.length > 0) && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                      Training &amp; Milestones
                    </h3>
                    <div className="space-y-1.5">
                      {selectedItems.workouts.map(w => (
                        <div
                          key={w.id}
                          className="p-2.5 rounded-xl bg-surface border border-line text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-medium text-ink flex items-center gap-1.5 truncate">
                            <Dumbbell className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                            <span className="truncate">{w.routineName}</span>
                          </span>
                          <span className="text-[11px] font-mono text-ink-muted tabular-nums shrink-0">
                            {w.durationMinutes}m
                          </span>
                        </div>
                      ))}
                      {selectedItems.goalsDue.map(g => (
                        <div
                          key={g.id}
                          className="p-2.5 rounded-xl bg-surface border border-line text-xs flex items-center gap-2"
                        >
                          <Target className="w-3.5 h-3.5 text-ink shrink-0" />
                          <span className="font-medium text-ink truncate">{g.title}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty Inspector State */}
                {selectedTotalCount === 0 && (
                  <div className="py-10 px-4 text-center space-y-3 rounded-xl border border-dashed border-line bg-surface/60">
                    <CalendarIcon className="w-5 h-5 text-ink-muted mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-ink">No events scheduled</p>
                      <p className="text-[11px] text-ink-muted">
                        Double-click any calendar date or add a dedicated time block.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openScheduleModal(selectedDateStr)}
                      className="btn-press inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-ink text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule Event</span>
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>
      </div>

      {/* Apple-Styled Schedule Event Modal */}
      <ModalShell
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        maxWidthClass="max-w-sm"
      >
        <div className="px-5 py-3.5 border-b border-line bg-sidebar flex items-center justify-between">
          <span className="text-sm font-semibold text-ink font-heading tracking-tight">
            New Calendar Event
          </span>
          <button
            type="button"
            onClick={() => setShowAddEventModal(false)}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-warm transition-colors"
            aria-label="Close schedule modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateEvent} className="p-5 space-y-3.5">
          <div>
            <label
              htmlFor="calendar-event-title"
              className="block text-xs font-medium text-ink-muted mb-1"
            >
              Title
            </label>
            <input
              id="calendar-event-title"
              type="text"
              required
              value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              placeholder="e.g. Deep Work: Product Review"
              className="w-full px-3 py-2 rounded-xl bg-surface-warm border border-line text-xs text-ink placeholder:text-ink-muted/60 focus:bg-surface focus:border-ink focus:ring-2 focus:ring-ink/15 focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="calendar-event-date"
                className="block text-xs font-medium text-ink-muted mb-1"
              >
                Date
              </label>
              <input
                id="calendar-event-date"
                type="date"
                required
                value={eventDateStr}
                onChange={e => setEventDateStr(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-surface-warm border border-line text-xs text-ink font-mono focus:bg-surface focus:border-ink focus:outline-hidden"
              />
            </div>
            <div>
              <label
                htmlFor="calendar-event-category"
                className="block text-xs font-medium text-ink-muted mb-1"
              >
                Focus Area
              </label>
              <select
                id="calendar-event-category"
                value={newEventCategory}
                onChange={e => setNewEventCategory(e.target.value as LifeArea)}
                className="w-full px-2.5 py-2 rounded-xl bg-surface-warm border border-line text-xs text-ink focus:bg-surface focus:border-ink focus:outline-hidden"
              >
                {SCHEDULE_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="calendar-event-start"
                className="block text-xs font-medium text-ink-muted mb-1"
              >
                Starts
              </label>
              <input
                id="calendar-event-start"
                type="time"
                value={newEventStartTime}
                onChange={e => setNewEventStartTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-surface-warm border border-line text-xs text-ink font-mono focus:bg-surface focus:border-ink focus:outline-hidden"
              />
            </div>
            <div>
              <label
                htmlFor="calendar-event-end"
                className="block text-xs font-medium text-ink-muted mb-1"
              >
                Ends
              </label>
              <input
                id="calendar-event-end"
                type="time"
                value={newEventEndTime}
                onChange={e => setNewEventEndTime(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-surface-warm border border-line text-xs text-ink font-mono focus:bg-surface focus:border-ink focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddEventModal(false)}
              className="btn-press px-3.5 py-2 rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-warm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-colors"
            >
              Save Event
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};

interface DayTimelineCanvasProps {
  dateStr: string;
  isToday: boolean;
  items: {
    tasks: {
      id: string;
      title: string;
      status: string;
      learningModuleId?: string;
      learningLessonId?: string;
    }[];
    schedule: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      completed: boolean;
    }[];
    learningLessons: {
      id: string;
      moduleId: string;
      title: string;
    }[];
    goalsDue: {
      id: string;
      title: string;
    }[];
  };
  timeFormat: '12h' | '24h';
  currentTimePct: number | null;
  onClickSlot: (hour: number) => void;
  onToggleSchedule: (id: string) => void;
  onToggleTask: (id: string) => void;
  onOpenLesson: (moduleId: string, lessonId: string) => void;
}

const DayTimelineCanvas: React.FC<DayTimelineCanvasProps> = ({
  dateStr,
  isToday,
  items,
  timeFormat,
  currentTimePct,
  onClickSlot,
  onToggleSchedule,
  onToggleTask,
  onOpenLesson,
}) => {
  const prefersReduced = useReducedMotion();
  const hasAllDay =
    items.tasks.length > 0 || items.learningLessons.length > 0 || items.goalsDue.length > 0;

  const positionedDayBlocks = useMemo(
    () => layoutOverlappingBlocks(items.schedule, DAY_START_HOUR, DAY_END_HOUR_EXCLUSIVE),
    [items.schedule]
  );

  return (
    <div>
      {hasAllDay && (
        <div className="px-4 py-3 border-b border-line bg-sidebar flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-ink-muted mr-1">All-Day:</span>
          {items.tasks.map(t => {
            const done = t.status === 'completed';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggleTask(t.id)}
                className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                  done
                    ? 'bg-surface-inset text-ink-muted border-line line-through'
                    : 'bg-surface text-ink border-line-strong hover:bg-surface-warm'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    done ? 'bg-accent border-accent text-accent-ink' : 'border-line-strong'
                  }`}
                >
                  {done && <Check className="w-2 h-2 stroke-[2.5]" />}
                </span>
                <span>{t.title}</span>
              </button>
            );
          })}
          {items.learningLessons.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => onOpenLesson(l.moduleId, l.id)}
              className="px-2.5 py-1 rounded-lg bg-surface-warm border border-line hover:border-line-strong text-xs text-ink flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-ink" />
              <span>{l.title}</span>
            </button>
          ))}
          {items.goalsDue.map(g => (
            <span
              key={g.id}
              className="px-2.5 py-1 rounded-lg bg-accent text-accent-ink text-xs flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{g.title}</span>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-[620px] overflow-y-auto">
        <div
          className="grid grid-cols-[64px_1fr]"
          style={{ height: `${TIMELINE_TOTAL_PX}px` }}
        >
          {/* Left Hour Labels */}
          <div className="bg-sidebar border-r border-line">
            {DAY_HOURS.map((hour, hourIdx) => (
              <div
                key={hour}
                style={{ height: `${HOUR_ROW_PX}px` }}
                className="relative pr-3 text-right text-[11px] font-mono text-ink-muted tabular-nums border-b border-line/60"
              >
                <span
                  className={`block leading-none ${
                    hourIdx === 0 ? 'pt-1' : '-translate-y-1.5 bg-sidebar pl-1'
                  }`}
                >
                  {formatHourSlot(hour, timeFormat)}
                </span>
              </div>
            ))}
          </div>

          {/* Right Day Column */}
          <div className="relative bg-surface">
            {DAY_HOURS.map(hour => (
              <button
                key={hour}
                type="button"
                onClick={() => onClickSlot(hour)}
                aria-label={`Schedule on ${dateStr} at ${formatHourSlot(hour, timeFormat)}`}
                style={{ height: `${HOUR_ROW_PX}px` }}
                className="block w-full border-b border-line/60 hover:bg-surface-warm/50 transition-colors text-left"
              />
            ))}

            {isToday && currentTimePct !== null && (
              <div
                aria-hidden="true"
                style={{ top: `${currentTimePct}%` }}
                className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
              >
                <span className="w-2.5 h-2.5 -ml-1.5 rounded-full bg-accent shrink-0" />
                <span className="flex-1 h-[1.5px] bg-accent" />
              </div>
            )}

            {positionedDayBlocks.map(({ item: block, topPct, heightPct, lane, totalLanes }, bIdx) => {
              const laneWidth = 100 / totalLanes;
              const laneLeft = lane * laneWidth;
              return (
                <motion.button
                  key={block.id}
                  type="button"
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: prefersReduced ? 0.01 : 0.24,
                    delay: prefersReduced ? 0 : getStaggerDelay(bIdx, 0.02, 0.03),
                    ease: MOMENTUM_EASE,
                  }}
                  whileHover={prefersReduced ? undefined : { scale: 1.01 }}
                  whileTap={prefersReduced ? undefined : { scale: 0.99 }}
                  onClick={() => onToggleSchedule(block.id)}
                  style={{
                    top: `${topPct}%`,
                    height: `${heightPct}%`,
                    left: `calc(${laneLeft}% + 6px)`,
                    width: `calc(${laneWidth}% - 12px)`,
                  }}
                  className={`absolute z-10 rounded-xl px-3 py-1.5 text-left flex items-center justify-between gap-2 border transition-opacity ${
                    block.completed
                      ? 'bg-surface-inset text-ink-muted border-line-strong'
                      : 'bg-accent text-accent-ink border-line shadow-xs'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold truncate ${
                      block.completed ? 'line-through' : ''
                    }`}
                  >
                    {block.title}
                  </span>
                  <span
                    className={`text-[11px] font-mono tabular-nums shrink-0 ${
                      block.completed ? 'text-ink-muted' : 'text-accent-ink/75'
                    }`}
                  >
                    {formatTimeCompact(block.startTime, timeFormat)} –{' '}
                    {formatTimeCompact(block.endTime, timeFormat)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
