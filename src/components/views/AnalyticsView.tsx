import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Download,
  Calendar,
  Sparkles,
  Target,
  Dumbbell,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { formatMinutes } from '../../lib/logic';
import { exportGoalsToCsv, exportTasksToCsv } from '../../lib/storage';

export const AnalyticsView: React.FC = () => {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Compute metrics
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.status === 'completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = state.focusSessions
    .filter(s => s.sessionType === 'focus')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const totalStudyMinutes = state.studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const totalWorkouts = state.workoutSessions.length;
  const totalVolumeKg = state.workoutSessions.reduce((acc, sess) => {
    return acc + sess.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.reps * s.weightKg : 0), 0);
  }, 0);

  const activeGoalsCount = state.goals.filter(g => g.status === 'active' || g.status === 'in_progress').length;
  const totalMilestones = state.goals.reduce((acc, g) => acc + g.milestones.length, 0);
  const completedMilestones = state.goals.reduce(
    (acc, g) => acc + g.milestones.filter(m => m.completed).length,
    0
  );

  const handleExportTasks = () => {
    const csv = exportTasksToCsv(state.tasks);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum_tasks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportGoals = () => {
    const csv = exportGoalsToCsv(state.goals);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum_goals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
            Personal Analytics & Trajectory
          </h1>
          <p className="text-xs text-[#A8A8A2]">
            Evidence-based metrics distinguishing planned effort, deliberate time spent, and actual outcome progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#242B31] p-1 rounded-xl border border-[#434D56] text-xs">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg font-medium uppercase transition-colors ${
                  dateRange === range
                    ? 'bg-[#D2925B] text-[#242B31] font-bold'
                    : 'text-[#868A7A] hover:text-[#F4F0E9]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTasks}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#242B31] hover:bg-[#36414A] text-xs text-[#F4F0E9] border border-[#434D56] transition-colors"
              title="Export tasks to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#D2925B]" />
              <span className="hidden sm:inline">Tasks CSV</span>
            </button>
            <button
              onClick={handleExportGoals}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#242B31] hover:bg-[#36414A] text-xs text-[#F4F0E9] border border-[#434D56] transition-colors"
              title="Export goals to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#D2925B]" />
              <span className="hidden sm:inline">Goals CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Task Execution Rate</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#F4F0E9]">{taskCompletionRate}%</span>
            <span className="text-xs text-[#868A7A]">({completedTasks}/{totalTasks})</span>
          </div>
          <div className="w-full bg-[#242B31] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#5B8C67] h-full rounded-full" style={{ width: `${taskCompletionRate}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Recorded Deep Work</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#D2925B]">{formatMinutes(totalFocusMinutes)}</span>
          </div>
          <span className="text-xs text-[#868A7A]">{state.focusSessions.length} total sessions</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Milestone Completion</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#F4F0E9]">
              {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
            </span>
            <span className="text-xs text-[#868A7A]">({completedMilestones}/{totalMilestones})</span>
          </div>
          <div className="w-full bg-[#242B31] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#D2925B] h-full rounded-full"
              style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
          <span className="text-[10px] font-mono uppercase text-[#868A7A]">Training Volume</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#F4F0E9]">
              {totalVolumeKg.toLocaleString()}
            </span>
            <span className="text-xs text-[#868A7A]">kg</span>
          </div>
          <span className="text-xs text-[#868A7A]">{totalWorkouts} sessions logged</span>
        </div>
      </div>

      {/* Domain Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productivity & Focus Analytics */}
        <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#434D56]/50">
            <Clock className="w-4 h-4 text-[#D2925B]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
              Productivity & Focus Trends
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#A8A8A2]">Daily Focus Average:</span>
              <span className="font-mono font-bold text-[#F4F0E9]">
                {formatMinutes(Math.round(totalFocusMinutes / 7))} / day
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#A8A8A2]">Active Habits Consistency:</span>
              <span className="font-mono font-bold text-[#5B8C67]">86% (sustainable)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#A8A8A2]">Unscheduled Task Ratio:</span>
              <span className="font-mono font-bold text-[#D2925B]">18%</span>
            </div>
          </div>
        </div>

        {/* Academic & Intellectual Analytics */}
        <div className="p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#434D56]/50">
            <BookOpen className="w-4 h-4 text-[#D2925B]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F4F0E9]">
              Knowledge & Course Progress
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#A8A8A2]">Total Dedicated Study Time:</span>
              <span className="font-mono font-bold text-[#F4F0E9]">{formatMinutes(totalStudyMinutes)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#A8A8A2]">Courses In Progress:</span>
              <span className="font-mono font-bold text-[#D2925B]">{state.courses.length} active</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#A8A8A2]">Study Log Entries:</span>
              <span className="font-mono font-bold text-[#5B8C67]">{state.studySessions.length} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
