export type Priority = 'P0' | 'P1' | 'P2';

export type BlockStatus = 'pending' | 'in_progress' | 'done' | 'skipped' | 'snoozed';

export interface Category {
  id: string;
  name: string;
  color: string;
  iconName: string;
}

export interface TimeBlock {
  id: string;
  title: string;
  categoryId: string;
  startTime: string; // "HH:mm" (24-hour format)
  endTime: string;   // "HH:mm"
  durationMinutes: number;
  isRecurring: boolean;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  isFixed: boolean;
  priority: Priority;
  notes?: string;
  status?: BlockStatus; // Runtime or logged status for today
  completedAt?: string;
}

export interface Habit {
  id: string;
  title: string;
  categoryId: string;
  targetFrequency: number; // times per week
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
}

export interface UserProfile {
  name: string;
  wakeTime: string;  // "07:00"
  sleepTime: string; // "23:00"
  archetype: 'freelancer' | 'student' | 'balanced' | 'custom';
  notificationsEnabled: boolean;
  reminderLeadMinutes: number; // e.g. 10
  quietHoursStart?: string;
  quietHoursEnd?: string;
  isOnboarded: boolean;
}

export interface CompletionLog {
  id: string;
  blockId: string;
  logDate: string; // YYYY-MM-DD
  scheduledTime: string;
  status: 'done' | 'skipped' | 'snoozed';
  loggedAt: string;
}
