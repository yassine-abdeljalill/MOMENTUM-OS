import { Goal, Habit, HabitCompletion, Priority, LifeArea, Project, Task } from '../types';

/**
 * Calculates a goal's progress percentage (0 - 100) based on its configuration
 */
export function calculateGoalProgress(goal: Goal, tasks: Task[] = []): number {
  if (goal.status === 'completed') return 100;

  if (goal.progressCalculation === 'milestones') {
    if (!goal.milestones || goal.milestones.length === 0) {
      return Math.min(100, Math.max(0, goal.manualProgress || 0));
    }
    const completedCount = goal.milestones.filter(m => m.completed).length;
    return Math.round((completedCount / goal.milestones.length) * 100);
  }

  if (goal.progressCalculation === 'tasks') {
    const linkedTasks = tasks.filter(t => t.relatedGoalId === goal.id);
    if (linkedTasks.length === 0) return 0;
    const completedTasks = linkedTasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / linkedTasks.length) * 100);
  }

  // Manual calculation
  return Math.min(100, Math.max(0, goal.manualProgress || 0));
}

/**
 * Calculates a project's completion percentage based on tasks and milestones
 */
export function calculateProjectProgress(project: Project, tasks: Task[] = []): number {
  if (project.status === 'completed') return 100;
  
  const linkedTasks = tasks.filter(t => t.relatedProjectId === project.id);
  const milestones = project.milestones || [];

  if (linkedTasks.length === 0 && milestones.length === 0) {
    return project.status === 'active' ? 25 : 0;
  }

  let totalItems = 0;
  let completedItems = 0;

  if (linkedTasks.length > 0) {
    totalItems += linkedTasks.length;
    completedItems += linkedTasks.filter(t => t.status === 'completed').length;
  }

  if (milestones.length > 0) {
    totalItems += milestones.length;
    completedItems += milestones.filter(m => m.completed).length;
  }

  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
}

/**
 * Calculates daily progress with transparent, balanced weighting:
 * Tasks (50%), Habits (30%), Focus time (20%)
 */
export function calculateDailyScore(params: {
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  focusMinutes: number;
  targetFocusMinutes: number;
}): {
  overallPercentage: number;
  taskPercentage: number;
  habitPercentage: number;
  focusPercentage: number;
} {
  const {
    tasksCompleted,
    tasksTotal,
    habitsCompleted,
    habitsTotal,
    focusMinutes,
    targetFocusMinutes,
  } = params;

  const taskPct = tasksTotal > 0 ? Math.min(100, Math.round((tasksCompleted / tasksTotal) * 100)) : 100;
  const habitPct = habitsTotal > 0 ? Math.min(100, Math.round((habitsCompleted / habitsTotal) * 100)) : 100;
  const targetFocus = targetFocusMinutes > 0 ? targetFocusMinutes : 60;
  const focusPct = Math.min(100, Math.round((focusMinutes / targetFocus) * 100));

  let totalWeight = 0;
  let weightedSum = 0;

  if (tasksTotal > 0) {
    totalWeight += 0.5;
    weightedSum += taskPct * 0.5;
  }
  if (habitsTotal > 0) {
    totalWeight += 0.3;
    weightedSum += habitPct * 0.3;
  }
  if (targetFocusMinutes > 0 || focusMinutes > 0) {
    totalWeight += 0.2;
    weightedSum += focusPct * 0.2;
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    overallPercentage: Math.min(100, Math.max(0, overall)),
    taskPercentage: taskPct,
    habitPercentage: habitPct,
    focusPercentage: focusPct,
  };
}

/**
 * Checks if a habit was scheduled on a particular day of the week
 * dayOfWeek: 0 (Sun) to 6 (Sat)
 */
export function isHabitScheduledOnDay(habit: Habit, date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekdays') return day >= 1 && day <= 5;
  if (habit.frequency === 'custom' && habit.customDays) {
    return habit.customDays.includes(day);
  }
  return true;
}

/**
 * Computes streaks for habits (current streak, longest streak, 30-day consistency rate)
 * Supportively handles skipped days with reasons so users aren't unfairly penalized.
 */
export function calculateHabitStreak(
  habit: Habit,
  completions: HabitCompletion[],
  referenceDateStr: string = new Date().toISOString().split('T')[0]
): {
  currentStreak: number;
  longestStreak: number;
  last30DaysRate: number;
  completedToday: boolean;
} {
  const completionMap = new Map<string, HabitCompletion>();
  for (const c of completions) {
    if (c.habitId === habit.id) {
      completionMap.set(c.date, c);
    }
  }

  const refDate = new Date(referenceDateStr + 'T00:00:00');
  const todayEntry = completionMap.get(referenceDateStr);
  const completedToday = Boolean(todayEntry && todayEntry.completed);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Evaluate backwards from reference date for current streak
  let checkDate = new Date(refDate);
  // If today is completed or skipped, start count from today; else if not completed yet today, start from yesterday
  if (todayEntry && (todayEntry.completed || todayEntry.skipped)) {
    // start from today
  } else {
    // test yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count backwards up to 365 days
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (habit.startDate && dateStr < habit.startDate) {
      break;
    }

    const scheduled = isHabitScheduledOnDay(habit, checkDate);
    if (scheduled) {
      const entry = completionMap.get(dateStr);
      if (entry && entry.completed) {
        currentStreak++;
      } else if (entry && entry.skipped) {
        // Skipped with reason preserves current streak without incrementing
      } else {
        // Broken streak
        break;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longest streak and 30-day rate over past 30 calendar days
  let scheduledLast30 = 0;
  let completedLast30 = 0;
  const loopDate = new Date(refDate);

  for (let i = 0; i < 30; i++) {
    const dateStr = loopDate.toISOString().split('T')[0];
    const isSched = isHabitScheduledOnDay(habit, loopDate);
    if (isSched) {
      scheduledLast30++;
      const entry = completionMap.get(dateStr);
      if (entry && entry.completed) {
        completedLast30++;
      }
    }
    loopDate.setDate(loopDate.getDate() - 1);
  }

  // Longest streak calculation over all recorded history
  const sortedDates = Array.from(completionMap.keys()).sort();
  for (const dateKey of sortedDates) {
    const entry = completionMap.get(dateKey);
    if (entry && entry.completed) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else if (entry && entry.skipped) {
      // keep
    } else {
      tempStreak = 0;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const last30DaysRate = scheduledLast30 > 0
    ? Math.round((completedLast30 / scheduledLast30) * 100)
    : 0;

  return {
    currentStreak,
    longestStreak,
    last30DaysRate,
    completedToday,
  };
}

/**
 * Elapsed timer calculation from timestamps to avoid interval drift
 */
export function calculateFocusElapsedTime(
  startTimestampMs: number,
  pausedDurationMs: number,
  nowMs: number
): number {
  if (startTimestampMs <= 0) return 0;
  const elapsed = nowMs - startTimestampMs - pausedDurationMs;
  return Math.max(0, Math.floor(elapsed / 1000));
}

/**
 * Format minutes into readable hour / minute string
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Get human label for life area
 */
export function getLifeAreaLabel(area: LifeArea): string {
  switch (area) {
    case 'education': return 'Education';
    case 'career': return 'Career';
    case 'health': return 'Health';
    case 'fitness': return 'Fitness';
    case 'financial': return 'Financial Development';
    case 'personal_development': return 'Personal Development';
    case 'relationships': return 'Relationships';
    default: return 'Other';
  }
}

/**
 * Priority badge helper
 */
export function getPriorityColor(priority: Priority): { bg: string; text: string; border: string } {
  switch (priority) {
    case 'urgent':
      return { bg: 'bg-[#B9534F]/20', text: 'text-[#E57373]', border: 'border-[#B9534F]/40' };
    case 'high':
      return { bg: 'bg-[#D2925B]/20', text: 'text-[#D2925B]', border: 'border-[#D2925B]/40' };
    case 'medium':
      return { bg: 'bg-[#868A7A]/20', text: 'text-[#A4A89A]', border: 'border-[#868A7A]/40' };
    case 'low':
    default:
      return { bg: 'bg-[#434D56]/20', text: 'text-[#B8B5AE]', border: 'border-[#434D56]/40' };
  }
}
