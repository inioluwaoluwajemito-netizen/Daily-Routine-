import { Platform } from 'react-native';
import { getDatabase, seedTemplateNative } from './database';
import { WebStorage } from './webStorage';
import { TimeBlock, Habit, UserProfile, Category, CompletionLog, MonthlyGoal, GoalMilestone, UserAccount, ArchetypeType } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  migrateLocalStorageToSupabase,
  pullFromSupabase,
  pushRoutineUpsert,
  pushRoutineDelete,
  pushProfileUpsert,
  pushHabitUpsert,
  pushCompletionUpsert,
  pushAllRoutines,
  pushAllHabits,
  pushGoalAndMilestones,
  pushMilestoneToggle,
  pushGoalDelete,
} from './supabaseSync';

export {
  migrateLocalStorageToSupabase,
  pullFromSupabase,
};

// ==================== AUTH & ACCOUNTS ====================

export function getUsers(): UserAccount[] {
  return WebStorage.getUsers();
}

export function getCurrentUser(): UserAccount | null {
  return WebStorage.getCurrentUser();
}

export function getCurrentUserId(): string | null {
  return WebStorage.getCurrentUserId();
}

export async function loginWithSupabase(email: string, password: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();

  // If Supabase is configured, use Supabase Auth
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed: user data missing.');
    }

    const account: UserAccount = {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
      email: data.user.email || cleanEmail,
      avatarColor: '#6366F1',
      createdAt: data.user.created_at,
    };

    WebStorage.setCurrentUserId(account.id);
    // Keep local account registry updated
    const users = WebStorage.getUsers();
    if (!users.some((u) => u.id === account.id)) {
      users.push(account);
      WebStorage.setItemRaw('dayguide_users', JSON.stringify(users));
    }

    // Trigger one-time migration and pull latest data
    try {
      await migrateLocalStorageToSupabase(account.id);
      await pullFromSupabase(account.id);
    } catch (e) {
      console.warn('Post-login sync error:', e);
    }

    return account;
  }

  // Offline / Demo fallback
  return WebStorage.loginUser(cleanEmail, password);
}

export async function registerWithSupabase(name: string, email: string, password: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || 'New User';

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    const userId = data.user?.id || `user_${Date.now()}`;
    const account: UserAccount = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      avatarColor: '#10B981',
      createdAt: data.user?.created_at || new Date().toISOString(),
    };

    WebStorage.setCurrentUserId(account.id);
    const users = WebStorage.getUsers();
    if (!users.some((u) => u.id === account.id)) {
      users.push(account);
      WebStorage.setItemRaw('dayguide_users', JSON.stringify(users));
    }

    // Create profile row in Supabase
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        name: cleanName,
        email: cleanEmail,
        wake_time: '05:30',
        sleep_time: '22:30',
        archetype: 'prayer',
        is_onboarded: false,
      });
      await migrateLocalStorageToSupabase(userId);
    } catch (e) {
      console.warn('Post-registration setup error:', e);
    }

    return account;
  }

  // Fallback to local storage
  return WebStorage.registerUser(cleanName, cleanEmail, password);
}

export async function logoutUser(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
  WebStorage.logoutUser();
}

export function registerUser(name: string, email: string, password: string): UserAccount {
  return WebStorage.registerUser(name, email, password);
}

export function loginUser(email: string, password: string): UserAccount {
  return WebStorage.loginUser(email, password);
}

// ==================== TEMPLATES ====================

export function seedTemplate(archetype: ArchetypeType): void {
  if (Platform.OS === 'web') {
    WebStorage.seedTemplate(archetype);
  } else {
    const db = getDatabase();
    if (!db) {
      WebStorage.seedTemplate(archetype);
    } else {
      seedTemplateNative(archetype as any);
    }
  }

  // Push to Supabase if logged in
  const uid = getCurrentUserId();
  if (uid) {
    const blocks = WebStorage.getAllTimeBlocks();
    const habits = WebStorage.getHabits();
    pushAllRoutines(blocks, uid);
    pushAllHabits(habits, uid);
  }
}

// ==================== PROFILE ====================

export function getProfile(): UserProfile | null {
  if (Platform.OS === 'web') return WebStorage.getProfile();

  const db = getDatabase();
  if (!db) return WebStorage.getProfile();

  try {
    const row = db.getFirstSync<any>('SELECT * FROM profile WHERE id = ?', ['owner_profile']);
    if (!row) return WebStorage.getProfile();
    return {
      name: row.name,
      wakeTime: row.wake_time,
      sleepTime: row.sleep_time,
      archetype: row.archetype,
      notificationsEnabled: Boolean(row.notifications_enabled),
      reminderLeadMinutes: row.reminder_lead_minutes,
      isOnboarded: Boolean(row.is_onboarded),
    };
  } catch (e) {
    return WebStorage.getProfile();
  }
}

export function saveProfile(profile: UserProfile): void {
  // 1. Always update local cache
  WebStorage.saveProfile(profile);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      db.runSync(
        `INSERT OR REPLACE INTO profile 
         (id, name, wake_time, sleep_time, archetype, notifications_enabled, reminder_lead_minutes, is_onboarded)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'owner_profile',
          profile.name,
          profile.wakeTime,
          profile.sleepTime,
          profile.archetype,
          profile.notificationsEnabled ? 1 : 0,
          profile.reminderLeadMinutes,
          profile.isOnboarded ? 1 : 0,
        ]
      );
    } catch (e) {
      // fallback handled by WebStorage
    }
  }

  // 2. Sync to Supabase
  const uid = profile.userId || getCurrentUserId();
  if (uid) {
    pushProfileUpsert(profile, uid);
  }
}

// ==================== CATEGORIES ====================

export function getCategories(): Category[] {
  if (Platform.OS === 'web') return WebStorage.getCategories();

  const db = getDatabase();
  if (!db) return WebStorage.getCategories();

  try {
    const rows = db.getAllSync<any>('SELECT * FROM categories');
    if (rows.length === 0) return WebStorage.getCategories();
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      iconName: r.icon_name,
    }));
  } catch (e) {
    return WebStorage.getCategories();
  }
}

// ==================== TIME BLOCKS ====================

export function getAllTimeBlocks(): TimeBlock[] {
  if (Platform.OS === 'web') return WebStorage.getAllTimeBlocks();

  const db = getDatabase();
  if (!db) return WebStorage.getAllTimeBlocks();

  try {
    const rows = db.getAllSync<any>('SELECT * FROM time_blocks ORDER BY start_time ASC');
    return rows.map(mapRowToTimeBlock);
  } catch (e) {
    return WebStorage.getAllTimeBlocks();
  }
}

export function getTimeBlocksForDay(dayOfWeek: number, dateStr: string): TimeBlock[] {
  if (Platform.OS === 'web') return WebStorage.getTimeBlocksForDay(dayOfWeek, dateStr);

  const db = getDatabase();
  if (!db) return WebStorage.getTimeBlocksForDay(dayOfWeek, dateStr);

  try {
    const rows = db.getAllSync<any>('SELECT * FROM time_blocks ORDER BY start_time ASC');
    const logs = getCompletionLogsForDate(dateStr);

    const logMap = new Map<string, CompletionLog>();
    for (const log of logs) {
      logMap.set(log.blockId, log);
    }

    const blocks: TimeBlock[] = [];
    for (const r of rows) {
      const days: number[] = JSON.parse(r.days_of_week || '[0,1,2,3,4,5,6]');
      if (days.includes(dayOfWeek)) {
        const block = mapRowToTimeBlock(r);
        const log = logMap.get(block.id);
        if (log) {
          block.status = log.status;
          block.completedAt = log.loggedAt;
        } else {
          block.status = 'pending';
        }
        blocks.push(block);
      }
    }
    return blocks;
  } catch (e) {
    return WebStorage.getTimeBlocksForDay(dayOfWeek, dateStr);
  }
}

export function insertTimeBlock(block: Omit<TimeBlock, 'id'>): TimeBlock {
  const customBlock = {
    ...block,
    source: block.source || 'custom',
    reminders: block.reminders && block.reminders.length > 0 ? block.reminders : [30, 20, 10, 5],
  };

  const created = WebStorage.insertTimeBlock(customBlock);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      db.runSync(
        `INSERT INTO time_blocks 
         (id, title, category_id, start_time, end_time, duration_minutes, is_recurring, days_of_week, is_fixed, priority, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          created.id,
          created.title,
          created.categoryId,
          created.startTime,
          created.endTime,
          created.durationMinutes,
          created.isRecurring ? 1 : 0,
          JSON.stringify(created.daysOfWeek),
          created.isFixed ? 1 : 0,
          created.priority,
          created.notes || '',
        ]
      );
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    pushRoutineUpsert(created, uid);
  }

  return created;
}

export function updateTimeBlock(block: TimeBlock): void {
  WebStorage.updateTimeBlock(block);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      db.runSync(
        `UPDATE time_blocks SET 
         title = ?, category_id = ?, start_time = ?, end_time = ?, duration_minutes = ?,
         is_recurring = ?, days_of_week = ?, is_fixed = ?, priority = ?, notes = ?
         WHERE id = ?`,
        [
          block.title,
          block.categoryId,
          block.startTime,
          block.endTime,
          block.durationMinutes,
          block.isRecurring ? 1 : 0,
          JSON.stringify(block.daysOfWeek),
          block.isFixed ? 1 : 0,
          block.priority,
          block.notes || '',
          block.id,
        ]
      );
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    pushRoutineUpsert(block, uid);
  }
}

export function deleteTimeBlock(id: string): void {
  WebStorage.deleteTimeBlock(id);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      db.runSync('DELETE FROM time_blocks WHERE id = ?', [id]);
      db.runSync('DELETE FROM completion_logs WHERE block_id = ?', [id]);
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    pushRoutineDelete(id, uid);
  }
}

// ==================== COMPLETION LOGS ====================

export function logBlockStatus(blockId: string, dateStr: string, scheduledTime: string, status: 'done' | 'skipped' | 'snoozed'): void {
  WebStorage.logBlockStatus(blockId, dateStr, scheduledTime, status);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      const id = `log_${dateStr}_${blockId}`;
      const now = new Date().toISOString();
      db.runSync(
        `INSERT OR REPLACE INTO completion_logs 
         (id, block_id, log_date, scheduled_time, status, logged_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, blockId, dateStr, scheduledTime, status, now]
      );
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    const log: CompletionLog = {
      id: `log_${dateStr}_${blockId}`,
      userId: uid,
      blockId,
      logDate: dateStr,
      scheduledTime,
      status,
      loggedAt: new Date().toISOString(),
    };
    pushCompletionUpsert(log, uid);
  }
}

export function getCompletionLogsForDate(dateStr: string): CompletionLog[] {
  if (Platform.OS === 'web') return WebStorage.getCompletionLogsForDate(dateStr);

  const db = getDatabase();
  if (!db) return WebStorage.getCompletionLogsForDate(dateStr);

  try {
    const rows = db.getAllSync<any>('SELECT * FROM completion_logs WHERE log_date = ?', [dateStr]);
    return rows.map((r) => ({
      id: r.id,
      blockId: r.block_id,
      logDate: r.log_date,
      scheduledTime: r.scheduled_time,
      status: r.status,
      loggedAt: r.logged_at,
    }));
  } catch (e) {
    return WebStorage.getCompletionLogsForDate(dateStr);
  }
}

// ==================== HABITS ====================

export function getHabits(): Habit[] {
  if (Platform.OS === 'web') return WebStorage.getHabits();

  const db = getDatabase();
  if (!db) return WebStorage.getHabits();

  try {
    const rows = db.getAllSync<any>('SELECT * FROM habits ORDER BY current_streak DESC');
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      categoryId: r.category_id,
      targetFrequency: r.target_frequency,
      currentStreak: r.current_streak,
      bestStreak: r.best_streak,
      lastCompletedDate: r.last_completed_date || undefined,
    }));
  } catch (e) {
    return WebStorage.getHabits();
  }
}

export function insertHabit(title: string, categoryId: string): void {
  WebStorage.insertHabit(title, categoryId);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      db.runSync(
        `INSERT INTO habits (id, title, category_id, target_frequency, current_streak, best_streak)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`habit_${Date.now()}`, title, categoryId, 7, 0, 0]
      );
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    const habits = WebStorage.getHabits();
    const newest = habits[habits.length - 1];
    if (newest) pushHabitUpsert(newest, uid);
  }
}

export function toggleHabitCompletion(habitId: string, todayStr: string): void {
  WebStorage.toggleHabitCompletion(habitId, todayStr);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      const habit = db.getFirstSync<any>('SELECT * FROM habits WHERE id = ?', [habitId]);
      if (habit) {
        const isCompletedToday = habit.last_completed_date === todayStr;
        if (isCompletedToday) {
          const newStreak = Math.max(0, habit.current_streak - 1);
          db.runSync(
            'UPDATE habits SET current_streak = ?, last_completed_date = NULL WHERE id = ?',
            [newStreak, habitId]
          );
        } else {
          const newStreak = habit.current_streak + 1;
          const newBest = Math.max(habit.best_streak, newStreak);
          db.runSync(
            'UPDATE habits SET current_streak = ?, best_streak = ?, last_completed_date = ? WHERE id = ?',
            [newStreak, newBest, todayStr, habitId]
          );
        }
      }
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    const habits = WebStorage.getHabits();
    const updated = habits.find((h) => h.id === habitId);
    if (updated) pushHabitUpsert(updated, uid);
  }
}

// ==================== GOALS & MILESTONES ====================

export function getMonthlyGoals(monthStr: string): MonthlyGoal[] {
  if (Platform.OS === 'web') return WebStorage.getMonthlyGoals(monthStr);

  const db = getDatabase();
  if (!db) return WebStorage.getMonthlyGoals(monthStr);

  try {
    const goalRows = db.getAllSync<any>(
      'SELECT * FROM goals WHERE month = ? ORDER BY title ASC',
      [monthStr]
    );

    if (goalRows.length === 0) return WebStorage.getMonthlyGoals(monthStr);

    const goals: MonthlyGoal[] = [];
    for (const g of goalRows) {
      const milestoneRows = db.getAllSync<any>(
        'SELECT * FROM goal_milestones WHERE goal_id = ? ORDER BY week_number ASC',
        [g.id]
      );

      goals.push({
        id: g.id,
        title: g.title,
        categoryId: g.category_id,
        month: g.month,
        targetMetricValue: g.target_metric_value,
        currentMetricValue: g.current_metric_value,
        unit: g.unit,
        status: g.status,
        notes: g.notes || '',
        milestones: milestoneRows.map((m) => ({
          id: m.id,
          goalId: m.goal_id,
          title: m.title,
          weekNumber: m.week_number,
          isCompleted: Boolean(m.is_completed),
          dueDate: m.due_date || undefined,
        })),
      });
    }
    return goals;
  } catch (e) {
    return WebStorage.getMonthlyGoals(monthStr);
  }
}

export function insertMonthlyGoal(
  goalData: Omit<MonthlyGoal, 'id' | 'milestones'>,
  milestonesData: Omit<GoalMilestone, 'id' | 'goalId'>[]
): MonthlyGoal {
  const createdGoal = WebStorage.insertMonthlyGoal(goalData, milestonesData);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      db.runSync(
        `INSERT INTO goals 
         (id, title, category_id, month, target_metric_value, current_metric_value, unit, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createdGoal.id,
          goalData.title,
          goalData.categoryId,
          goalData.month,
          goalData.targetMetricValue,
          goalData.currentMetricValue,
          goalData.unit,
          goalData.status,
          goalData.notes || '',
        ]
      );

      for (const m of createdGoal.milestones) {
        db.runSync(
          `INSERT INTO goal_milestones (id, goal_id, title, week_number, is_completed, due_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [m.id, createdGoal.id, m.title, m.weekNumber, m.isCompleted ? 1 : 0, m.dueDate || '']
        );
      }
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    pushGoalAndMilestones(createdGoal, createdGoal.milestones, uid);
  }

  return createdGoal;
}

export function toggleMilestone(milestoneId: string): void {
  WebStorage.toggleMilestone(milestoneId);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      const milestone = db.getFirstSync<any>(
        'SELECT * FROM goal_milestones WHERE id = ?',
        [milestoneId]
      );
      if (milestone) {
        const nextState = milestone.is_completed ? 0 : 1;
        db.runSync('UPDATE goal_milestones SET is_completed = ? WHERE id = ?', [nextState, milestoneId]);

        const completedCount = db.getFirstSync<{ count: number }>(
          'SELECT COUNT(*) as count FROM goal_milestones WHERE goal_id = ? AND is_completed = 1',
          [milestone.goal_id]
        );
        if (completedCount) {
          db.runSync('UPDATE goals SET current_metric_value = ? WHERE id = ?', [completedCount.count, milestone.goal_id]);
        }
      }
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    const milestones = WebStorage.getAllMilestones();
    const updated = milestones.find((m) => m.id === milestoneId);
    if (updated) {
      pushMilestoneToggle(updated, uid);
    }
  }
}

export function deleteMonthlyGoal(goalId: string): void {
  WebStorage.deleteMonthlyGoal(goalId);

  const db = getDatabase();
  if (db && Platform.OS !== 'web') {
    try {
      db.runSync('DELETE FROM goals WHERE id = ?', [goalId]);
      db.runSync('DELETE FROM goal_milestones WHERE goal_id = ?', [goalId]);
    } catch (e) {
      // fallback handled
    }
  }

  const uid = getCurrentUserId();
  if (uid) {
    pushGoalDelete(goalId, uid);
  }
}

// ==================== BACKUP & RESTORE ====================

export function exportBackupJson(): string {
  const profile = getProfile();
  const timeBlocks = getAllTimeBlocks();
  const habits = getHabits();
  const goals = getMonthlyGoals(new Date().toISOString().substring(0, 7));

  return JSON.stringify({
    version: '1.2',
    exportedAt: new Date().toISOString(),
    profile,
    timeBlocks,
    habits,
    goals,
  }, null, 2);
}

export function importBackupJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.timeBlocks || !Array.isArray(data.timeBlocks)) return false;

    if (data.profile) saveProfile(data.profile);
    for (const b of data.timeBlocks) {
      insertTimeBlock(b);
    }
    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}

function mapRowToTimeBlock(r: any): TimeBlock {
  return {
    id: r.id,
    title: r.title,
    categoryId: r.category_id,
    startTime: r.start_time,
    endTime: r.end_time,
    durationMinutes: r.duration_minutes,
    isRecurring: Boolean(r.is_recurring),
    daysOfWeek: JSON.parse(r.days_of_week || '[0,1,2,3,4,5,6]'),
    isFixed: Boolean(r.is_fixed),
    priority: r.priority as any,
    notes: r.notes || '',
    source: r.source || 'custom',
    reminders: r.reminders ? JSON.parse(r.reminders) : [30, 20, 10, 5],
  };
}
