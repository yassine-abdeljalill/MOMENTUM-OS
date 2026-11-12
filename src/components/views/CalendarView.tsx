import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Dumbbell,
  BookOpen,
  Target,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../lib/context';

type CalendarViewMode = 'month' | 'agenda';

export const CalendarView: React.FC = () => {
  const { state, addScheduleActivity } = useApp();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  // Compute days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Combine items for the selected month/date
  const getItemsForDate = (dateStr: string) => {
    const tasks = state.tasks.filter(t => t.dueDate === dateStr);
    const schedule = (state.dailySchedule || []).filter(s => s.date === dateStr);
    const workouts = state.workoutSessions.filter(w => w.date === dateStr);
    const study = state.studySessions.filter(s => s.date === dateStr);
    const goalsDue = state.goals.filter(g => g.targetDate === dateStr);

    return { tasks, schedule, workouts, study, goalsDue };
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
  };

  const selectedItems = getItemsForDate(selectedDateStr);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
            Integrated Master Calendar
          </h1>
          <p className="text-xs text-[#6E5648]">
            Synchronized view of tasks, deadlines, workouts, study blocks, and scheduled activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2] text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'month' ? 'bg-[#8EC5FF] text-[#3B2418] font-bold shadow-xs' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewMode === 'agenda' ? 'bg-[#8EC5FF] text-[#3B2418] font-bold shadow-xs' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule Activity</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D6C6B2]">
            <h2 className="text-base font-bold text-[#3B2418]">{monthName}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#3B2418] hover:bg-[#F2E8DA]"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold text-[#1E5A99] hover:underline"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-[#6E5648] hover:text-[#3B2418] hover:bg-[#F2E8DA]"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-[#6E5648] pb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 rounded-xl bg-[#EAE0D0]/40 p-1 opacity-40" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const items = getItemsForDate(dateStr);
              const totalItems =
                items.tasks.length +
                items.schedule.length +
                items.workouts.length +
                items.study.length;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 rounded-xl p-1.5 flex flex-col justify-between border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#3B2418] border-[#5A3927] shadow-sm'
                      : isToday
                      ? 'bg-[#8EC5FF]/20 border-[#8EC5FF]'
                      : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isSelected
                          ? 'text-[#F2E8DA]'
                          : isToday
                          ? 'text-[#1E5A99]'
                          : 'text-[#3B2418]'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {totalItems > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#8EC5FF]' : 'bg-[#1E5A99]'}`} />
                    )}
                  </div>

                  {/* Micro event indicators */}
                  <div className="space-y-0.5 overflow-hidden">
                    {items.tasks.slice(0, 1).map(t => (
                      <div
                        key={t.id}
                        className={`text-[9px] truncate px-1 rounded ${
                          isSelected ? 'bg-[#8EC5FF]/25 text-[#8EC5FF]' : 'bg-[#8EC5FF]/35 text-[#3B2418]'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {items.workouts.slice(0, 1).map(w => (
                      <div
                        key={w.id}
                        className={`text-[9px] truncate px-1 rounded ${
                          isSelected ? 'bg-[#4D3021] text-[#D8C7B4]' : 'bg-[#EAE0D0] text-[#6E5648]'
                        }`}
                      >
                        🏋️ {w.routineName.split(' ')[0]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D6C6B2]">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#1E5A99] font-semibold block">
                Selected Day
              </span>
              <h3 className="text-sm font-bold text-[#3B2418]">{selectedDateStr}</h3>
            </div>
            <button
              onClick={() => setShowAddEventModal(true)}
              className="text-xs font-semibold text-[#1E5A99] hover:underline"
            >
              + Add
            </button>
          </div>

          <div className="space-y-3">
            {/* Scheduled Activities */}
            {selectedItems.schedule.map(s => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#3B2418]">{s.title}</span>
                  <span className="font-mono text-[10px] font-semibold text-[#1E5A99]">
                    {s.startTime} - {s.endTime}
                  </span>
                </div>
                <span className="text-[10px] text-[#6E5648] uppercase font-mono">
                  Scheduled Activity
                </span>
              </div>
            ))}

            {/* Tasks Due */}
            {selectedItems.tasks.map(t => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#3B2418]">{t.title}</span>
                  <span className="text-[10px] font-mono uppercase font-semibold text-[#1E5A99]">{t.priority}</span>
                </div>
                <span className="text-[10px] text-[#6E5648] uppercase font-mono">
                  Task Deadline
                </span>
              </div>
            ))}

            {/* Workouts */}
            {selectedItems.workouts.map(w => (
              <div
                key={w.id}
                className="p-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#3B2418]">{w.routineName}</span>
                  <span className="text-[10px] font-mono text-[#6E5648]">{w.durationMinutes}m</span>
                </div>
                <span className="text-[10px] text-[#6E5648] uppercase font-mono">
                  Workout Session
                </span>
              </div>
            ))}

            {selectedItems.tasks.length === 0 &&
              selectedItems.schedule.length === 0 &&
              selectedItems.workouts.length === 0 && (
                <div className="py-8 text-center text-[#6E5648] text-xs">
                  No scheduled activities on this date.
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Schedule Activity Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2418]/65 backdrop-blur-xs">
          <div
            className="w-full max-w-sm bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#5A3927] bg-[#3B2418] flex items-center justify-between">
              <span className="text-xs font-bold text-[#F2E8DA]">Schedule Block</span>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-[#D8C7B4] hover:text-[#F2E8DA]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6E5648] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Deep Work: Architecture Spec"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E5648] mb-1">Start</label>
                  <input
                    type="time"
                    value={newEventStartTime}
                    onChange={e => setNewEventStartTime(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6E5648] mb-1">End</label>
                  <input
                    type="time"
                    value={newEventEndTime}
                    onChange={e => setNewEventEndTime(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-3 py-1 text-xs text-[#6E5648] hover:text-[#3B2418]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
