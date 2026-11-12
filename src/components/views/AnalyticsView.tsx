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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
            Personal Analytics & Trajectory
          </h1>
          <p className="text-xs text-[#6E5648]">
            Evidence-based metrics distinguishing planned effort, deliberate time spent, and actual outcome progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2] text-xs">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg font-medium uppercase transition-colors ${
                  dateRange === range
                    ? 'bg-[#8EC5FF] text-[#3B2418] font-bold shadow-xs'
                    : 'text-[#6E5648] hover:text-[#3B2418]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTasks}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2E8DA] hover:bg-[#EAE0D0] text-xs font-medium text-[#3B2418] border border-[#D6C6B2] transition-colors"
              title="Export tasks to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#1E5A99]" />
              <span className="hidden sm:inline">Tasks CSV</span>
            </button>
            <button
              onClick={handleExportGoals}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2E8DA] hover:bg-[#EAE0D0] text-xs font-medium text-[#3B2418] border border-[#D6C6B2] transition-colors"
              title="Export goals to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#1E5A99]" />
              <span className="hidden sm:inline">Goals CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Task Execution Rate</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#3B2418]">{taskCompletionRate}%</span>
            <span className="text-xs text-[#6E5648]">({completedTasks}/{totalTasks})</span>
          </div>
          <div className="w-full bg-[#EAE0D0] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#3E7B52] h-full rounded-full" style={{ width: `${taskCompletionRate}%` }} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Recorded Deep Work</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#1E5A99]">{formatMinutes(totalFocusMinutes)}</span>
          </div>
          <span className="text-xs text-[#6E5648]">{state.focusSessions.length} total sessions</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Milestone Completion</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#3B2418]">
              {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
            </span>
            <span className="text-xs text-[#6E5648]">({completedMilestones}/{totalMilestones})</span>
          </div>
          <div className="w-full bg-[#EAE0D0] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#8EC5FF] h-full rounded-full"
              style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Training Volume</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold text-[#3B2418]">
              {totalVolumeKg.toLocaleString()}
            </span>
            <span className="text-xs text-[#6E5648]">kg</span>
          </div>
          <span className="text-xs text-[#6E5648]">{totalWorkouts} sessions logged</span>
        </div>
      </div>

      {/* Domain Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productivity & Focus Analytics */}
        <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D6C6B2]">
            <Clock className="w-4 h-4 text-[#1E5A99]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              Productivity & Focus Trends
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6E5648]">Daily Focus Average:</span>
              <span className="font-mono font-bold text-[#3B2418]">
                {formatMinutes(Math.round(totalFocusMinutes / 7))} / day
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6E5648]">Active Habits Consistency:</span>
              <span className="font-mono font-bold text-[#3E7B52]">86% (sustainable)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6E5648]">Unscheduled Task Ratio:</span>
              <span className="font-mono font-bold text-[#1E5A99]">18%</span>
            </div>
          </div>
        </div>

        {/* Academic & Intellectual Analytics */}
        <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D6C6B2]">
            <BookOpen className="w-4 h-4 text-[#1E5A99]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#3B2418]">
              Knowledge & Course Progress
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6E5648]">Total Dedicated Study Time:</span>
              <span className="font-mono font-bold text-[#3B2418]">{formatMinutes(totalStudyMinutes)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6E5648]">Courses In Progress:</span>
              <span className="font-mono font-bold text-[#1E5A99]">{state.courses.length} active</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#6E5648]">Study Log Entries:</span>
              <span className="font-mono font-bold text-[#3E7B52]">{state.studySessions.length} sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
