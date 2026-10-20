import { TimeBlock, Habit, UserProfile, Category, CompletionLog, MonthlyGoal, GoalMilestone, UserAccount, ArchetypeType } from '../types';
import { ARCHETYPE_TEMPLATES } from '../constants/templates';

const BASE_KEYS = {
  USERS: 'dayguide_users',
  CURRENT_USER_ID: 'dayguide_current_user_id',
  CATEGORIES: 'dayguide_categories',
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

function removeItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    delete memoryStore[key];
  } catch (e) {
    delete memoryStore[key];
  }
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'personal', name: 'Prayer & Spiritual Life', color: '#EC4899', iconName: 'heart' },
  { id: 'work', name: 'Deep Work & Projects', color: '#6366F1', iconName: 'briefcase' },
  { id: 'health', name: 'Health & Exercise', color: '#10B981', iconName: 'activity' },
  { id: 'learning', name: 'Learning & Reading', color: '#06B6D4', iconName: 'book-open' },
  { id: 'routine', name: 'Daily Routine & Meals', color: '#F59E0B', iconName: 'coffee' },
  { id: 'rest', name: 'Rest & Wind-down', color: '#A855F7', iconName: 'moon' },
];

export const WebStorage = {
  // ==================== MULTI-USER AUTH ====================
  getUsers(): UserAccount[] {
    const raw = getItem(BASE_KEYS.USERS);
    if (!raw) {
      // Default demo account
      const defaultUsers: UserAccount[] = [
        {
          id: 'user_owner',
          name: 'Owner',
          email: 'user@dayguide.com',
          password: 'password123',
          avatarColor: '#6366F1',
          createdAt: new Date().toISOString(),
        },
      ];
      setItem(BASE_KEYS.USERS, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  getCurrentUserId(): string | null {
    return getItem(BASE_KEYS.CURRENT_USER_ID);
  },

  setCurrentUserId(userId: string | null): void {
    if (userId) {
      setItem(BASE_KEYS.CURRENT_USER_ID, userId);
    } else {
      removeItem(BASE_KEYS.CURRENT_USER_ID);
    }
  },

  getCurrentUser(): UserAccount | null {
    const currentId = this.getCurrentUserId();
    if (!currentId) return null;
    const users = this.getUsers();
    return users.find((u) => u.id === currentId) || null;
  },

  registerUser(name: string, email: string, password: string): UserAccount {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email or username already exists.');
    }

    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: UserAccount = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name.trim() || 'New User',
      email: cleanEmail,
      password: password,
      avatarColor,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setItem(BASE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUserId(newUser.id);
    return newUser;
  },

  loginUser(email: string, password: string): UserAccount {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanEmail
    );

    if (!user) {
      throw new Error('No account found with this email or username.');
    }

    if (user.password && user.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    this.setCurrentUserId(user.id);
    return user;
  },

  logoutUser(): void {
    this.setCurrentUserId(null);
  },

  // Helper to get user-scoped storage key
  getActiveUserId(): string {
    return this.getCurrentUserId() || 'guest_user';
  },

  getUserKey(subKey: string): string {
    const uid = this.getActiveUserId();
    return `dayguide_${uid}_${subKey}`;
  },

  // ==================== PROFILE ====================
  getProfile(): UserProfile | null {
    const key = this.getUserKey('profile');
    const raw = getItem(key);
    if (!raw) {
      // Check legacy non-scoped key as fallback
      const legacy = getItem('dayguide_profile');
      if (legacy && this.getActiveUserId() === 'user_owner') {
        setItem(key, legacy);
        return JSON.parse(legacy);
      }
      return null;
    }
    return JSON.parse(raw);
  },

  saveProfile(profile: UserProfile): void {
    const key = this.getUserKey('profile');
    setItem(key, JSON.stringify(profile));
  },

  // ==================== CATEGORIES ====================
  getCategories(): Category[] {
    const raw = getItem(BASE_KEYS.CATEGORIES);
    if (!raw) {
      setItem(BASE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  },

  // ==================== TIME BLOCKS ====================
  getAllTimeBlocks(): TimeBlock[] {
    const key = this.getUserKey('time_blocks');
    const raw = getItem(key);
    if (!raw) {
      const legacy = getItem('dayguide_time_blocks');
      if (legacy && this.getActiveUserId() === 'user_owner') {
        setItem(key, legacy);
        return JSON.parse(legacy);
      }
      return [];
    }
    return JSON.parse(raw);
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
    setItem(this.getUserKey('time_blocks'), JSON.stringify(all));
    return newBlock;
  },

  updateTimeBlock(block: TimeBlock): void {
    const all = this.getAllTimeBlocks();
    const index = all.findIndex((b) => b.id === block.id);
    if (index >= 0) {
      all[index] = block;
      setItem(this.getUserKey('time_blocks'), JSON.stringify(all));
    }
  },

  deleteTimeBlock(id: string): void {
    const all = this.getAllTimeBlocks();
    const filtered = all.filter((b) => b.id !== id);
    setItem(this.getUserKey('time_blocks'), JSON.stringify(filtered));
  },

  // ==================== COMPLETION LOGS ====================
  getCompletionLogsForDate(dateStr: string): CompletionLog[] {
    const raw = getItem(this.getUserKey('completion_logs'));
    const all: CompletionLog[] = raw ? JSON.parse(raw) : [];
    return all.filter((l) => l.logDate === dateStr);
  },

  logBlockStatus(blockId: string, dateStr: string, scheduledTime: string, status: 'done' | 'skipped' | 'snoozed'): void {
    const key = this.getUserKey('completion_logs');
    const raw = getItem(key);
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
    setItem(key, JSON.stringify(filtered));
  },

  // ==================== HABITS ====================
  getHabits(): Habit[] {
    const key = this.getUserKey('habits');
    const raw = getItem(key);
    if (!raw) {
      const legacy = getItem('dayguide_habits');
      if (legacy && this.getActiveUserId() === 'user_owner') {
        setItem(key, legacy);
        return JSON.parse(legacy);
      }
      return [];
    }
    return JSON.parse(raw);
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
    setItem(this.getUserKey('habits'), JSON.stringify(all));
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
    setItem(this.getUserKey('habits'), JSON.stringify(all));
  },

  // ==================== GOALS ====================
  getMonthlyGoals(monthStr: string): MonthlyGoal[] {
    const rawGoals = getItem(this.getUserKey('goals'));
    const rawMilestones = getItem(this.getUserKey('milestones'));
    const allGoals: any[] = rawGoals ? JSON.parse(rawGoals) : [];
    const allMilestones: GoalMilestone[] = rawMilestones ? JSON.parse(rawMilestones) : [];

    const monthGoals = allGoals.filter((g) => g.month === monthStr);

    if (monthGoals.length === 0) {
      const starter = this.insertMonthlyGoal(
        {
          title: 'Consistent Daily Prayer Life & Discipline',
          categoryId: 'personal',
          month: monthStr,
          targetMetricValue: 4,
          currentMetricValue: 1,
          unit: 'weeks',
          status: 'in_progress',
          notes: 'Build a solid spiritual prayer foundation and disciplined daily schedule.',
        },
        [
          { title: 'Week 1: Establish 30-min Morning Prayer & Devotion Routine', weekNumber: 1, isCompleted: true },
          { title: 'Week 2: Midday Scripture Reading & Meditation Habit', weekNumber: 2, isCompleted: false },
          { title: 'Week 3: Deep Work Sprints with Focused Prayer Watches', weekNumber: 3, isCompleted: false },
          { title: 'Week 4: Night Thanksgiving & Consistent Sleep Anchors', weekNumber: 4, isCompleted: false },
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
    const goalsKey = this.getUserKey('goals');
    const milesKey = this.getUserKey('milestones');
    const rawGoals = getItem(goalsKey);
    const rawMilestones = getItem(milesKey);
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

    setItem(goalsKey, JSON.stringify(allGoals));
    setItem(milesKey, JSON.stringify(allMilestones));

    return newGoal;
  },

  toggleMilestone(milestoneId: string): void {
    const milesKey = this.getUserKey('milestones');
    const rawMilestones = getItem(milesKey);
    const allMilestones: GoalMilestone[] = rawMilestones ? JSON.parse(rawMilestones) : [];
    const milestone = allMilestones.find((m) => m.id === milestoneId);
    if (!milestone) return;

    milestone.isCompleted = !milestone.isCompleted;
    setItem(milesKey, JSON.stringify(allMilestones));

    const goalsKey = this.getUserKey('goals');
    const rawGoals = getItem(goalsKey);
    const allGoals: any[] = rawGoals ? JSON.parse(rawGoals) : [];
    const goal = allGoals.find((g) => g.id === milestone.goalId);
    if (goal) {
      goal.currentMetricValue = allMilestones.filter((m) => m.goalId === goal.id && m.isCompleted).length;
      setItem(goalsKey, JSON.stringify(allGoals));
    }
  },

  deleteMonthlyGoal(goalId: string): void {
    const goalsKey = this.getUserKey('goals');
    const milesKey = this.getUserKey('milestones');
    const rawGoals = getItem(goalsKey);
    const rawMilestones = getItem(milesKey);
    const allGoals: any[] = rawGoals ? JSON.parse(rawGoals) : [];
    const allMilestones: GoalMilestone[] = rawMilestones ? JSON.parse(rawMilestones) : [];

    setItem(goalsKey, JSON.stringify(allGoals.filter((g) => g.id !== goalId)));
    setItem(milesKey, JSON.stringify(allMilestones.filter((m) => m.goalId !== goalId)));
  },

  // ==================== TEMPLATES SEEDING ====================
  seedTemplate(archetype: ArchetypeType): void {
    const template = ARCHETYPE_TEMPLATES[archetype as keyof typeof ARCHETYPE_TEMPLATES] || ARCHETYPE_TEMPLATES.prayer;
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

    setItem(this.getUserKey('time_blocks'), JSON.stringify(newBlocks));

    // Seed default habits tailored to the archetype
    const defaultHabits: Habit[] = archetype === 'prayer'
      ? [
          { id: 'habit_1', title: 'Morning Prayer Watch (30m)', categoryId: 'personal', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
          { id: 'habit_2', title: 'Scripture Reading & Meditation', categoryId: 'personal', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
          { id: 'habit_3', title: 'Midday Prayer Pause', categoryId: 'personal', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
          { id: 'habit_4', title: 'Night Thanksgiving & Prayer', categoryId: 'personal', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
          { id: 'habit_5', title: '30-min Physical Workout', categoryId: 'health', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
        ]
      : [
          { id: 'habit_1', title: 'Daily Prayer & Devotion', categoryId: 'personal', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
          { id: 'habit_2', title: '30-min Physical Workout', categoryId: 'health', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
          { id: 'habit_3', title: 'Read 15 Pages', categoryId: 'learning', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
          { id: 'habit_4', title: 'Night Thanksgiving', categoryId: 'personal', targetFrequency: 7, currentStreak: 0, bestStreak: 0 },
        ];

    setItem(this.getUserKey('habits'), JSON.stringify(defaultHabits));
  },
};
