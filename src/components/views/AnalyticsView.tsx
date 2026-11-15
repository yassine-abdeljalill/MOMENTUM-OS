import React, { useState } from 'react';
import {
  Clock,
  Download,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../lib/context';
import { formatMinutes } from '../../lib/logic';
import { exportGoalsToCsv, exportTasksToCsv } from '../../lib/storage';
import {
  AnimatedNumber,
  AnimatedProgressBar,
  MOMENTUM_EASE,
  StaggerContainer,
  StaggerItem,
} from '../common/MotionPrimitives';

export const AnalyticsView: React.FC = () => {
  const { state, learningData, showToast } = useApp();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const rangeDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.status === 'completed').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = state.focusSessions
    .filter(s => s.sessionType === 'focus')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const learningStudySessions = learningData?.studySessions || [];
  const totalStudyMinutes =
    learningData
      ? learningStudySessions.reduce((acc, s) => acc + s.durationMinutes, 0)
      : state.studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const learningModulesCount = learningData ? learningData.modules.length : state.courses.length;
  const learningLessonsCount = learningData
    ? learningData.lessons.length
    : state.courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const learningCompletedLessons = learningData
    ? learningData.lessons.filter(l => l.status === 'completed').length
    : state.courses.reduce((acc, c) => acc + c.lessons.filter(l => l.completed).length, 0);
  const studySessionCount = learningData ? learningStudySessions.length : state.studySessions.length;

  const totalWorkouts = state.workoutSessions.length;
  const totalVolumeKg = state.workoutSessions.reduce((acc, sess) => {
    return acc + sess.sets.reduce((sAcc, s) => sAcc + (s.completed ? s.reps * s.weightKg : 0), 0);
  }, 0);

  const totalMilestones = state.goals.reduce((acc, g) => acc + g.milestones.length, 0);
  const completedMilestones = state.goals.reduce(
    (acc, g) => acc + g.milestones.filter(m => m.completed).length,
    0
  );

  const unscheduledRatio =
    totalTasks > 0
      ? Math.round((state.tasks.filter(t => !t.dueDate).length / totalTasks) * 100)
      : 0;

  const domainDistribution = [
    {
      label: 'Deep Work & Focus',
      minutes: totalFocusMinutes,
      color: 'bg-accent',
    },
    {
      label: 'Academic & Study',
      minutes: totalStudyMinutes,
      color: 'bg-brand-blue',
    },
    {
      label: 'Physical Training',
      minutes: state.workoutSessions.reduce((acc, s) => acc + s.durationMinutes, 0),
      color: 'bg-success',
    },
  ];
  const maxDomainMinutes = Math.max(1, ...domainDistribution.map(d => d.minutes));

  const handleExportTasks = () => {
    const csv = exportTasksToCsv(state.tasks);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum_tasks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Tasks CSV exported.', 'success');
  };

  const handleExportGoals = () => {
    const csv = exportGoalsToCsv(state.goals);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum_goals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Goals CSV exported.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
            Personal Analytics & Trajectory
          </h1>
          <p className="text-xs text-ink-muted">
            Evidence-based metrics distinguishing planned effort, deliberate time spent, and actual outcome progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-canvas p-1 rounded-xl border border-line text-xs">
            {(['7d', '30d', '90d'] as const).map(range => {
              const isActive = dateRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setDateRange(range)}
                  className={`relative px-3 py-1.5 rounded-lg font-medium uppercase transition-colors ${
                    isActive ? 'text-accent-ink font-semibold' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="analytics-range-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-accent"
                    />
                  )}
                  <span className="relative z-10">{range}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportTasks}
              className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-canvas hover:bg-surface-warm text-xs font-medium text-ink border border-line transition-colors whitespace-nowrap"
              title="Export tasks to CSV"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Tasks CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportGoals}
              className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-canvas hover:bg-surface-warm text-xs font-medium text-ink border border-line transition-colors whitespace-nowrap"
              title="Export goals to CSV"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">Goals CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Overview */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StaggerItem className="card-hover p-5 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Task Execution Rate</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-ink tabular-nums">
              <AnimatedNumber value={taskCompletionRate} formatter={v => `${Math.round(v)}%`} />
            </span>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              ({completedTasks}/{totalTasks})
            </span>
          </div>
          <AnimatedProgressBar
            percentage={taskCompletionRate}
            trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
            fillClassName="bg-success h-full rounded-full"
          />
        </StaggerItem>

        <StaggerItem className="card-hover p-5 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Recorded Deep Work</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-accent tabular-nums">
              <AnimatedNumber value={totalFocusMinutes} formatter={v => formatMinutes(Math.round(v))} />
            </span>
          </div>
          <span className="text-xs text-ink-muted tabular-nums">
            {state.focusSessions.length} total sessions
          </span>
        </StaggerItem>

        <StaggerItem className="card-hover p-5 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Milestone Completion</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-ink tabular-nums">
              <AnimatedNumber
                value={totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}
                formatter={v => `${Math.round(v)}%`}
              />
            </span>
            <span className="text-xs font-mono text-ink-muted tabular-nums">
              ({completedMilestones}/{totalMilestones})
            </span>
          </div>
          <AnimatedProgressBar
            percentage={totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}
            trackClassName="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden"
            fillClassName="bg-accent h-full rounded-full"
          />
        </StaggerItem>

        <StaggerItem className="card-hover p-5 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">Training Volume</span>
          <div className="my-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-ink tabular-nums">
              <AnimatedNumber value={totalVolumeKg} formatter={v => Math.round(v).toLocaleString()} />
            </span>
            <span className="text-xs text-ink-muted">kg</span>
          </div>
          <span className="text-xs text-ink-muted tabular-nums">{totalWorkouts} sessions logged</span>
        </StaggerItem>
      </StaggerContainer>

      {/* Time Allocation Distribution */}
      <div className="p-6 rounded-2xl bg-surface border border-line space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Invested Effort Across Domains ({dateRange} window)
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-muted tabular-nums">
            {formatMinutes(domainDistribution.reduce((s, d) => s + d.minutes, 0))} tracked
          </span>
        </div>

        <div className="space-y-3">
          {domainDistribution.map(item => {
            const pct = Math.round((item.minutes / maxDomainMinutes) * 100);
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="font-mono text-ink-muted tabular-nums">
                    {formatMinutes(item.minutes)}
                  </span>
                </div>
                <AnimatedProgressBar
                  percentage={pct}
                  trackClassName="w-full h-2 rounded-full bg-surface-inset overflow-hidden"
                  fillClassName={`${item.color} h-full rounded-full`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Domain Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1, ease: MOMENTUM_EASE }}
          className="card-hover p-6 rounded-2xl bg-surface border border-line space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <Clock className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Productivity & Focus Trends
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Daily Focus Average ({dateRange}):</span>
              <span className="font-mono font-bold text-ink tabular-nums">
                {formatMinutes(Math.round(totalFocusMinutes / rangeDays))} / day
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Active Habits Tracked:</span>
              <span className="font-mono font-bold text-success tabular-nums">
                {state.habits.length} active
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Unscheduled Task Ratio:</span>
              <span className="font-mono font-bold text-accent tabular-nums">{unscheduledRatio}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.16, ease: MOMENTUM_EASE }}
          className="card-hover p-6 rounded-2xl bg-surface border border-line space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <BookOpen className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
              Knowledge & Course Progress
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Total Dedicated Study Time:</span>
              <span className="font-mono font-bold text-ink tabular-nums">
                {formatMinutes(totalStudyMinutes)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Modules & Lessons Completed:</span>
              <span className="font-mono font-bold text-accent tabular-nums">
                {learningModulesCount} modules · {learningCompletedLessons}/{learningLessonsCount} lessons
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Study Log Entries:</span>
              <span className="font-mono font-bold text-success tabular-nums">
                {studySessionCount} sessions
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
