import { getDatabase } from './database';
import { TimeBlock, Habit, UserProfile, Category, CompletionLog } from '../types';

// ==================== PROFILE ====================

export function getProfile(): UserProfile | null {
  const db = getDatabase();
  const row = db.getFirstSync<any>('SELECT * FROM profile WHERE id = ?', ['owner_profile']);
  if (!row) return null;
  return {
    name: row.name,
    wakeTime: row.wake_time,
    sleepTime: row.sleep_time,
    archetype: row.archetype,
    notificationsEnabled: Boolean(row.notifications_enabled),
    reminderLeadMinutes: row.reminder_lead_minutes,
    isOnboarded: Boolean(row.is_onboarded),
  };
}

export function saveProfile(profile: UserProfile): void {
  const db = getDatabase();
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
}

// ==================== CATEGORIES ====================

export function getCategories(): Category[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>('SELECT * FROM categories');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    iconName: r.icon_name,
  }));
}

// ==================== TIME BLOCKS ====================

export function getAllTimeBlocks(): TimeBlock[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>('SELECT * FROM time_blocks ORDER BY start_time ASC');
  return rows.map(mapRowToTimeBlock);
}

export function getTimeBlocksForDay(dayOfWeek: number, dateStr: string): TimeBlock[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>('SELECT * FROM time_blocks ORDER BY start_time ASC');
  const logs = getCompletionLogsForDate(dateStr);

  const logMap = new Map<string, CompletionLog>();
  for (const log of logs) {
    logMap.set(log.blockId, log);
  }

  const blocks: TimeBlock[] = [];
  for (const r of rows) {
    const days: number[] = JSON.parse(r.days_of_week);
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
}

export function insertTimeBlock(block: Omit<TimeBlock, 'id'>): TimeBlock {
  const db = getDatabase();
  const id = `block_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  db.runSync(
    `INSERT INTO time_blocks 
     (id, title, category_id, start_time, end_time, duration_minutes, is_recurring, days_of_week, is_fixed, priority, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
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
    ]
  );
  return { ...block, id };
}

export function updateTimeBlock(block: TimeBlock): void {
  const db = getDatabase();
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
}

export function deleteTimeBlock(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM time_blocks WHERE id = ?', [id]);
  db.runSync('DELETE FROM completion_logs WHERE block_id = ?', [id]);
}

// ==================== COMPLETION LOGS ====================

export function logBlockStatus(blockId: string, dateStr: string, scheduledTime: string, status: 'done' | 'skipped' | 'snoozed'): void {
  const db = getDatabase();
  const id = `log_${dateStr}_${blockId}`;
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO completion_logs 
     (id, block_id, log_date, scheduled_time, status, logged_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, blockId, dateStr, scheduledTime, status, now]
  );
}

export function getCompletionLogsForDate(dateStr: string): CompletionLog[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>('SELECT * FROM completion_logs WHERE log_date = ?', [dateStr]);
  return rows.map((r) => ({
    id: r.id,
    blockId: r.block_id,
    logDate: r.log_date,
    scheduledTime: r.scheduled_time,
    status: r.status,
    loggedAt: r.logged_at,
  }));
}

// ==================== HABITS ====================

export function getHabits(): Habit[] {
  const db = getDatabase();
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
}

export function toggleHabitCompletion(habitId: string, todayStr: string): void {
  const db = getDatabase();
  const habit = db.getFirstSync<any>('SELECT * FROM habits WHERE id = ?', [habitId]);
  if (!habit) return;

  const isCompletedToday = habit.last_completed_date === todayStr;

  if (isCompletedToday) {
    // Unmark
    const newStreak = Math.max(0, habit.current_streak - 1);
    db.runSync(
      'UPDATE habits SET current_streak = ?, last_completed_date = NULL WHERE id = ?',
      [newStreak, habitId]
    );
  } else {
    // Mark completed
    const newStreak = habit.current_streak + 1;
    const newBest = Math.max(habit.best_streak, newStreak);
    db.runSync(
      'UPDATE habits SET current_streak = ?, best_streak = ?, last_completed_date = ? WHERE id = ?',
      [newStreak, newBest, todayStr, habitId]
    );
  }
}

// ==================== GOALS & MILESTONES ====================

export function getMonthlyGoals(monthStr: string): import('../types').MonthlyGoal[] {
  const db = getDatabase();
  const goalRows = db.getAllSync<any>(
    'SELECT * FROM goals WHERE month = ? ORDER BY title ASC',
    [monthStr]
  );

  const goals: import('../types').MonthlyGoal[] = [];

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

  // If no goals for this month, seed a default starter goal to demonstrate breakdown
  if (goals.length === 0) {
    const starterGoal = insertMonthlyGoal(
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
    goals.push(starterGoal);
  }

  return goals;
}

export function insertMonthlyGoal(
  goalData: Omit<import('../types').MonthlyGoal, 'id' | 'milestones'>,
  milestonesData: Omit<import('../types').GoalMilestone, 'id' | 'goalId'>[]
): import('../types').MonthlyGoal {
  const db = getDatabase();
  const goalId = `goal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  db.runSync(
    `INSERT INTO goals 
     (id, title, category_id, month, target_metric_value, current_metric_value, unit, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      goalId,
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

  const createdMilestones: import('../types').GoalMilestone[] = [];

  for (let i = 0; i < milestonesData.length; i++) {
    const m = milestonesData[i];
    const mId = `mile_${goalId}_${i + 1}`;
    db.runSync(
      `INSERT INTO goal_milestones (id, goal_id, title, week_number, is_completed, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mId, goalId, m.title, m.weekNumber, m.isCompleted ? 1 : 0, m.dueDate || '']
    );
    createdMilestones.push({
      id: mId,
      goalId,
      title: m.title,
      weekNumber: m.weekNumber,
      isCompleted: m.isCompleted,
      dueDate: m.dueDate,
    });
  }

  return {
    ...goalData,
    id: goalId,
    milestones: createdMilestones,
  };
}

export function toggleMilestone(milestoneId: string): void {
  const db = getDatabase();
  const milestone = db.getFirstSync<any>(
    'SELECT * FROM goal_milestones WHERE id = ?',
    [milestoneId]
  );
  if (!milestone) return;

  const nextState = milestone.is_completed ? 0 : 1;
  db.runSync(
    'UPDATE goal_milestones SET is_completed = ? WHERE id = ?',
    [nextState, milestoneId]
  );

  // Update parent goal current metric
  const completedCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM goal_milestones WHERE goal_id = ? AND is_completed = 1',
    [milestone.goal_id]
  );
  if (completedCount) {
    db.runSync(
      'UPDATE goals SET current_metric_value = ? WHERE id = ?',
      [completedCount.count, milestone.goal_id]
    );
  }
}

export function deleteMonthlyGoal(goalId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM goals WHERE id = ?', [goalId]);
  db.runSync('DELETE FROM goal_milestones WHERE goal_id = ?', [goalId]);
}

// ==================== BACKUP & RESTORE ====================

export function exportBackupJson(): string {
  const db = getDatabase();
  const profile = getProfile();
  const timeBlocks = getAllTimeBlocks();
  const habits = getHabits();
  const logs = db.getAllSync<any>('SELECT * FROM completion_logs');
  const goals = db.getAllSync<any>('SELECT * FROM goals');
  const milestones = db.getAllSync<any>('SELECT * FROM goal_milestones');

  return JSON.stringify({
    version: '1.1',
    exportedAt: new Date().toISOString(),
    profile,
    timeBlocks,
    habits,
    completionLogs: logs,
    goals,
    goalMilestones: milestones,
  }, null, 2);
}

export function importBackupJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.timeBlocks || !Array.isArray(data.timeBlocks)) return false;

    const db = getDatabase();
    if (data.profile) saveProfile(data.profile);

    db.runSync('DELETE FROM time_blocks');
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
  };
}

