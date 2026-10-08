import { TimeBlock, Habit, UserProfile, Category, CompletionLog, MonthlyGoal, GoalMilestone } from '../types';
import { ARCHETYPE_TEMPLATES } from '../constants/templates';

const KEYS = {
  PROFILE: 'dayguide_profile',
  CATEGORIES: 'dayguide_categories',
  TIME_BLOCKS: 'dayguide_time_blocks',
  HABITS: 'dayguide_habits',
  COMPLETION_LOGS: 'dayguide_completion_logs',
  GOALS: 'dayguide_goals',
  MILESTONES: 'dayguide_goal_milestones',
};

// Memory fallback if localStorage is unavailable
const memoryStore: Record<string, string> = {};

function getItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  } catch (e) {
    return memoryStore[key] || null;
  }
}

function setItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
  } catch (e) {
    memoryStore[key] = value;
  }
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Deep Work & Projects', color: '#6366F1', iconName: 'briefcase' },
  { id: 'health', name: 'Health & Exercise', color: '#10B981', iconName: 'activity' },
  { id: 'learning', name: 'Learning & Reading', color: '#06B6D4', iconName: 'book-open' },
  { id: 'routine', name: 'Daily Routine & Meals', color: '#F59E0B', iconName: 'coffee' },
  { id: 'rest', name: 'Rest & Wind-down', color: '#A855F7', iconName: 'moon' },
  { id: 'personal', name: 'Personal & Devotion', color: '#EC4899', iconName: 'heart' },
];

export const WebStorage = {
  getProfile(): UserProfile | null {
    const raw = getItem(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
  },

  saveProfile(profile: UserProfile): void {
    setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getCategories(): Category[] {
    const raw = getItem(KEYS.CATEGORIES);
    if (!raw) {
      setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  },

  getAllTimeBlocks(): TimeBlock[] {
    const raw = getItem(KEYS.TIME_BLOCKS);
    return raw ? JSON.parse(raw) : [];
  },

  getTimeBlocksForDay(dayOfWeek: number, dateStr: string): TimeBlock[] {
    const all = this.getAllTimeBlocks();
    const logs = this.getCompletionLogsForDate(dateStr);
    const logMap = new Map(logs.map((l) => [l.blockId, l]));

    return all
      .filter((b) => Array.isArray(b.daysOfWeek) && b.daysOfWeek.includes(dayOfWeek))
      .map((b) => {
        const log = logMap.get(b.id);
        return {
          ...b,
          status: (log ? log.status : 'pending') as import('../types').BlockStatus,
          completedAt: log ? log.loggedAt : undefined,
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  insertTimeBlock(block: Omit<TimeBlock, 'id'>): TimeBlock {
    const all = this.getAllTimeBlocks();
    const id = `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBlock: TimeBlock = { ...block, id };
    all.push(newBlock);
    setItem(KEYS.TIME_BLOCKS, JSON.stringify(all));
    return newBlock;
  },

  updateTimeBlock(block: TimeBlock): void {
    const all = this.getAllTimeBlocks();
    const index = all.findIndex((b) => b.id === block.id);
    if (index >= 0) {
      all[index] = block;
      setItem(KEYS.TIME_BLOCKS, JSON.stringify(all));
    }
  },

  deleteTimeBlock(id: string): void {
    const all = this.getAllTimeBlocks();
    const filtered = all.filter((b) => b.id !== id);
    setItem(KEYS.TIME_BLOCKS, JSON.stringify(filtered));
  },

  getCompletionLogsForDate(dateStr: string): CompletionLog[] {
    const raw = getItem(KEYS.COMPLETION_LOGS);
    const all: CompletionLog[] = raw ? JSON.parse(raw) : [];
    return all.filter((l) => l.logDate === dateStr);
  },

  logBlockStatus(blockId: string, dateStr: string, scheduledTime: string, status: 'done' | 'skipped' | 'snoozed'): void {
    const raw = getItem(KEYS.COMPLETION_LOGS);
    const all: CompletionLog[] = raw ? JSON.parse(raw) : [];
    const id = `log_${dateStr}_${blockId}`;
    const filtered = all.filter((l) => l.id !== id);
    filtered.push({
      id,
      blockId,
      logDate: dateStr,
      scheduledTime,
      status,
      loggedAt: new Date().toISOString(),
    });
    setItem(KEYS.COMPLETION_LOGS, JSON.stringify(filtered));
  },

  getHabits(): Habit[] {
    const raw = getItem(KEYS.HABITS);
    return raw ? JSON.parse(raw) : [];
  },

  insertHabit(title: string, categoryId: string): void {
    const all = this.getHabits();
    all.push({
      id: `habit_${Date.now()}`,
      title,
      categoryId,
      targetFrequency: 7,
      currentStreak: 0,
      bestStreak: 0,
    });
    setItem(KEYS.HABITS, JSON.stringify(all));
  },

  toggleHabitCompletion(habitId: string, todayStr: string): void {
    const all = this.getHabits();
    const habit = all.find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.lastCompletedDate === todayStr) {
      habit.currentStreak = Math.max(0, habit.currentStreak - 1);
      habit.lastCompletedDate = undefined;
    } else {
      habit.currentStreak += 1;
      habit.bestStreak = Math.max(habit.bestStreak, habit.currentStreak);
      habit.lastCompletedDate = todayStr;
    }
    setItem(KEYS.HABITS, JSON.stringify(all));
  },

  getMonthlyGoals(monthStr: string): MonthlyGoal[] {
    const rawGoals = getItem(KEYS.GOALS);
    const rawMilestones = getItem(KEYS.MILESTONES);
    const allGoals: any[] = rawGoals ? JSON.parse(rawGoals) : [];
    const allMilestones: GoalMilestone[] = rawMilestones ? JSON.parse(rawMilestones) : [];

    const monthGoals = allGoals.filter((g) => g.month === monthStr);

    if (monthGoals.length === 0) {
      // Seed default
      const starter = this.insertMonthlyGoal(
        {
          title: 'Master React Native & Ship DayGuide APK',
          categoryId: 'work',
          month: monthStr,
          targetMetricValue: 4,
          currentMetricValue: 2,
          unit: 'milestones',
          status: 'in_progress',
          notes: 'Personal milestone: Complete DayGuide, test notifications, and build production APK.',
        },
        [
          { title: 'Week 1: Core Architecture, SQLite schema & Today Cockpit', weekNumber: 1, isCompleted: true },
          { title: 'Week 2: Goal Tracker & Monthly Breakdown Engine', weekNumber: 2, isCompleted: true },
          { title: 'Week 3: Adaptive Re-planning & Push Alarms on Android', weekNumber: 3, isCompleted: false },
          { title: 'Week 4: Final APK build, testing & personal installation', weekNumber: 4, isCompleted: false },
        ]
      );
      return [starter];
    }

    return monthGoals.map((g) => ({
      ...g,
      milestones: allMilestones.filter((m) => m.goalId === g.id),
    }));
  },

  insertMonthlyGoal(
    goalData: Omit<MonthlyGoal, 'id' | 'milestones'>,
    milestonesData: Omit<GoalMilestone, 'id' | 'goalId'>[]
  ): MonthlyGoal {
    const rawGoals = getItem(KEYS.GOALS);
    const rawMilestones = getItem(KEYS.MILESTONES);
    const allGoals: any[] = rawGoals ? JSON.parse(rawGoals) : [];
    const allMilestones: GoalMilestone[] = rawMilestones ? JSON.parse(rawMilestones) : [];

    const goalId = `goal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newMilestones: GoalMilestone[] = milestonesData.map((m, i) => ({
      id: `mile_${goalId}_${i + 1}`,
      goalId,
      title: m.title,
      weekNumber: m.weekNumber,
      isCompleted: m.isCompleted,
      dueDate: m.dueDate,
    }));

    const newGoal: MonthlyGoal = {
      ...goalData,
      id: goalId,
      milestones: newMilestones,
    };

    allGoals.push({ ...goalData, id: goalId });
    allMilestones.push(...newMilestones);

    setItem(KEYS.GOALS, JSON.stringify(allGoals));
    setItem(KEYS.MILESTONES, JSON.stringify(allMilestones));

    return newGoal;
  },

  toggleMilestone(milestoneId: string): void {
    const rawMilestones = getItem(KEYS.MILESTONES);
    const allMilestones: GoalMilestone[] = rawMilestones ? JSON.parse(rawMilestones) : [];
    const milestone = allMilestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    milestone.isCompleted = !milestone.isCompleted;
    setItem(KEYS.MILESTONES, JSON.stringify(allMilestones));

    // Update parent goal count
    const rawGoals = getItem(KEYS.GOALS);
    const allGoals: any[] = rawGoals ? JSON.parse(rawGoals) : [];
    const goal = allGoals.find((g) => g.id === milestone.goalId);
    if (goal) {
      goal.currentMetricValue = allMilestones.filter((m) => m.goalId === goal.id && m.isCompleted).length;
      setItem(KEYS.GOALS, JSON.stringify(allGoals));
    }
  },

  deleteMonthlyGoal(goalId: string): void {
    const rawGoals = getItem(KEYS.GOALS);
    const rawMilestones = getItem(KEYS.MILESTONES);
    const allGoals: any[] = rawGoals ? JSON.parse(rawGoals) : [];
    const allMilestones: GoalMilestone[] = rawMilestones ? JSON.parse(rawMilestones) : [];

    setItem(KEYS.GOALS, JSON.stringify(allGoals.filter((g) => g.id !== goalId)));
    setItem(KEYS.MILESTONES, JSON.stringify(allMilestones.filter((m) => m.goalId !== goalId)));
  },

  seedTemplate(archetype: 'freelancer' | 'student' | 'balanced'): void {
    const template = ARCHETYPE_TEMPLATES[archetype];
    if (!template) return;

    const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
    const newBlocks: TimeBlock[] = template.map((item, i) => {
      const [startH, startM] = item.start.split(':').map(Number);
      const [endH, endM] = item.end.split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

      return {
        id: `block_${Date.now()}_${i}`,
        title: item.title,
        categoryId: item.categoryId,
        startTime: item.start,
        endTime: item.end,
        durationMinutes,
        isRecurring: true,
        daysOfWeek,
        isFixed: item.fixed,
        priority: item.priority as any,
        notes: 'Template routine',
      };
    });

    setItem(KEYS.TIME_BLOCKS, JSON.stringify(newBlocks));

    // Seed default habits
    const defaultHabits: Habit[] = [
      { id: 'habit_1', title: 'Daily Devotion / Mindfulness', categoryId: 'personal', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
      { id: 'habit_2', title: '30-min Physical Workout', categoryId: 'health', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
      { id: 'habit_3', title: 'Read 15 Pages', categoryId: 'learning', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
    ];
    setItem(KEYS.HABITS, JSON.stringify(defaultHabits));
  },
};
