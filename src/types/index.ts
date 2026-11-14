export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'inbox' | 'not_started' | 'in_progress' | 'completed' | 'cancelled';

export type LifeArea =
  | 'education'
  | 'career'
  | 'health'
  | 'fitness'
  | 'financial'
  | 'personal_development'
  | 'relationships'
  | 'other';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  timezone: string;
  preferredLanguage: string;
  lifeAreas: LifeArea[];
  visionStatement: string;
  dailyAvailabilityHours: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  accentColor: string; // '#9ECCFD'
  startOfWeek: 'monday' | 'sunday';
  timeFormat: '12h' | '24h';
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  defaultDashboard: string;
  defaultTaskView: 'list' | 'board' | 'calendar';
  enableBrowserNotifications: boolean;
  dailyReminderTime: string;
  soundEnabled: boolean;
}

export interface TaskSubtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  category: LifeArea;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  startDate?: string;
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  relatedGoalId?: string;
  relatedProjectId?: string;
  tags: string[];
  subtasks: TaskSubtask[];
  notes?: string;
  isDailyPriority?: boolean;
  priorityRank?: number; // 1, 2, 3 for top priorities
  learningModuleId?: string;
  learningModuleTitle?: string;
  learningLessonId?: string;
  learningLessonTitle?: string;
  learningTaskKind?: 'task' | 'assignment' | 'lab' | 'exercise';
  createdAt: string;
  completedAt?: string;
}

export interface DailyPriority {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  taskId: string;
  rank: number; // 1, 2, 3
  notes?: string;
  completed: boolean;
}

export interface DailyScheduleActivity {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: LifeArea;
  taskId?: string;
  completed: boolean;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
  order: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: LifeArea;
  startDate: string;
  targetDate: string;
  status: 'active' | 'in_progress' | 'paused' | 'completed' | 'archived';
  priority: Priority;
  progressCalculation: 'milestones' | 'manual' | 'tasks';
  manualProgress: number; // 0 - 100
  successCriteria: string;
  motivation: string;
  milestones: GoalMilestone[];
  relatedProjectIds: string[];
  createdAt: string;
  completedAt?: string;
}

export interface NinetyDayPlan {
  id: string;
  userId: string;
  goalId: string;
  quarter: string; // e.g. "Q1 2026" or "Spring 90-Day Sprint"
  mainObjective: string;
  whyItMatters: string;
  expectedOutcome: string;
  startDate: string;
  endDate: string;
  weeklyCheckpoints: { weekNumber: number; focus: string; completed: boolean }[];
  reviewNotes?: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  targetDate?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  priority: Priority;
  category: LifeArea;
  startDate: string;
  deadline?: string;
  relatedGoalId?: string;
  milestones: ProjectMilestone[];
  notes?: string;
  resources?: { title: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  learningObjectives: string[];
  content: string;
  completed: boolean;
  studyDurationMinutes: number;
  notes?: string;
  order: number;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  description: string;
  instructor?: string;
  category: string; // "Cybersecurity", "Programming", "University", etc.
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'archived';
  lessons: Lesson[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  courseId?: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  whatWasLearned: string;
  notes?: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: LifeArea;
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  targetCountPerDay: number; // usually 1
  startDate: string;
  endDate?: string;
  color: string;
  icon?: string;
  active: boolean;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  skipped?: boolean;
  skipReason?: string;
  count: number;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core' | 'Full Body';
  equipment: 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight' | 'Other';
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string; // "Push", "Pull", "Legs", "Upper", "Lower", "Full Body"
  description?: string;
  exercises: { exerciseName: string; defaultSets: number; defaultReps: number }[];
}

export interface WorkoutSession {
  id: string;
  userId: string;
  routineName: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  sets: WorkoutSet[];
  notes?: string;
  createdAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  projectId?: string;
  subject?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  completed: boolean;
  sessionType: 'focus' | 'break';
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  eventType: 'task' | 'deadline' | 'activity' | 'study' | 'workout' | 'milestone';
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endDate?: string;
  endTime?: string;
  allDay: boolean;
  color: string;
  relatedEntityId?: string;
}

export type JournalCategory =
  | 'daily_reflection'
  | 'weekly_review'
  | 'monthly_review'
  | 'gratitude'
  | 'lessons_learned'
  | 'free_writing';

export type JournalMood = 'great' | 'good' | 'neutral' | 'challenging';

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  category: JournalCategory;
  mood?: JournalMood;
  tags: string[];
  reflectionQuestions?: {
    wentWell?: string;
    couldBeBetter?: string;
    learned?: string;
    tomorrowPriority?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ResourceItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  resourceType: 'website' | 'article' | 'book' | 'pdf' | 'video' | 'document' | 'other';
  url?: string;
  category: LifeArea;
  tags: string[];
  relatedProjectId?: string;
  relatedGoalId?: string;
  relatedCourseId?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'deadline' | 'habit' | 'milestone' | 'review' | 'system';
  read: boolean;
  createdAt: string;
  linkTo?: string;
}

export * from './finance';
export * from './learning';
