import { supabase, isSupabaseConfigured } from './supabase';
import { TimeBlock, Habit, UserProfile, MonthlyGoal, GoalMilestone, CompletionLog } from '../types';
import { WebStorage } from './webStorage';
import { Platform } from 'react-native';

// Helper to determine if we can reach Supabase
export function isOnline(): boolean {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
}

// ==================== ONE-TIME MIGRATION ====================

export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  const migrationKey = `dayguide_migrated_${userId}`;
  const alreadyMigrated = WebStorage.getItemRaw(migrationKey);
  if (alreadyMigrated === 'true') {
    return false;
  }

  if (!isSupabaseConfigured() || !isOnline()) {
    return false;
  }

  try {
    // 1. Gather all existing local data
    // Check both user_owner scoped keys and global un-scoped legacy keys
    const profile = WebStorage.getProfile();
    const blocks = WebStorage.getAllTimeBlocks();
    const habits = WebStorage.getHabits();
    const goals = WebStorage.getAllGoals();
    const milestones = WebStorage.getAllMilestones();
    const completions = WebStorage.getAllCompletionLogs();

    // 2. Migrate Profile
    if (profile) {
      await supabase.from('profiles').upsert({
        id: userId,
        name: profile.name,
        email: profile.email,
        wake_time: profile.wakeTime,
        sleep_time: profile.sleepTime,
        archetype: profile.archetype,
        notifications_enabled: profile.notificationsEnabled,
        reminder_lead_minutes: profile.reminderLeadMinutes,
        is_onboarded: profile.isOnboarded,
        updated_at: new Date().toISOString(),
      });
    }

    // 3. Migrate Routines (Time Blocks)
    if (blocks && blocks.length > 0) {
      const routineRows = blocks.map((b) => ({
        id: b.id,
        user_id: userId,
        title: b.title,
        category_id: b.categoryId,
        start_time: b.startTime,
        end_time: b.endTime,
        duration_minutes: b.durationMinutes,
        is_recurring: b.isRecurring,
        days_of_week: b.daysOfWeek,
        is_fixed: b.isFixed,
        priority: b.priority,
        notes: b.notes || null,
        source: b.source || (b.notes === 'Template routine' ? 'template' : 'custom'),
        reminders: b.reminders && b.reminders.length > 0 ? b.reminders : [30, 20, 10, 5],
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('routines').upsert(routineRows);
    }

    // 4. Migrate Habits
    if (habits && habits.length > 0) {
      const habitRows = habits.map((h) => ({
        id: h.id,
        user_id: userId,
        title: h.title,
        category_id: h.categoryId,
        target_frequency: h.targetFrequency,
        current_streak: h.currentStreak,
        best_streak: h.bestStreak,
        last_completed_date: h.lastCompletedDate || null,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('habits').upsert(habitRows);
    }

    // 5. Migrate Completions
    if (completions && completions.length > 0) {
      const completionRows = completions.map((c) => ({
        id: c.id,
        user_id: userId,
        block_id: c.blockId,
        log_date: c.logDate,
        scheduled_time: c.scheduledTime,
        status: c.status,
        logged_at: c.loggedAt || new Date().toISOString(),
      }));

      await supabase.from('completions').upsert(completionRows);
    }

    // 6. Migrate Goals
    if (goals && goals.length > 0) {
      const goalRows = goals.map((g) => ({
        id: g.id,
        user_id: userId,
        title: g.title,
        category_id: g.categoryId,
        month: g.month,
        target_metric_value: g.targetMetricValue,
        current_metric_value: g.currentMetricValue,
        unit: g.unit,
        status: g.status,
        notes: g.notes || null,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('goals').upsert(goalRows);
    }

    // 7. Migrate Milestones
    if (milestones && milestones.length > 0) {
      const milestoneRows = milestones.map((m) => ({
        id: m.id,
        user_id: userId,
        goal_id: m.goalId,
        title: m.title,
        week_number: m.weekNumber,
        is_completed: m.isCompleted,
        due_date: m.dueDate || null,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('milestones').upsert(milestoneRows);
    }

    // Mark as migrated
    WebStorage.setItemRaw(migrationKey, 'true');
    console.log(`[SupabaseSync] Successfully migrated local data to Supabase for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('[SupabaseSync] One-time migration error:', error);
    return false;
  }
}

// ==================== BIDIRECTIONAL SYNC ====================

// Pull latest data from Supabase down into local cache
export async function pullFromSupabase(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !isOnline()) {
    return false;
  }

  try {
    // 1. Pull Profile
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileErr && profileData) {
      const profile: UserProfile = {
        userId: profileData.id,
        name: profileData.name || 'Owner',
        email: profileData.email || '',
        wakeTime: profileData.wake_time || '05:30',
        sleepTime: profileData.sleep_time || '22:30',
        archetype: profileData.archetype || 'prayer',
        notificationsEnabled: profileData.notifications_enabled,
        reminderLeadMinutes: profileData.reminder_lead_minutes,
        isOnboarded: profileData.is_onboarded,
      };
      WebStorage.saveProfile(profile);
    }

    // 2. Pull Routines
    const { data: routinesData, error: routinesErr } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (!routinesErr && routinesData) {
      const blocks: TimeBlock[] = routinesData.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        categoryId: r.category_id,
        startTime: r.start_time,
        endTime: r.end_time,
        durationMinutes: r.duration_minutes,
        isRecurring: r.is_recurring,
        daysOfWeek: Array.isArray(r.days_of_week) ? r.days_of_week : JSON.parse(r.days_of_week || '[0,1,2,3,4,5,6]'),
        isFixed: r.is_fixed,
        priority: r.priority,
        notes: r.notes || undefined,
        source: r.source || 'custom',
        reminders: Array.isArray(r.reminders) ? r.reminders : (r.reminders ? JSON.parse(r.reminders) : [30, 20, 10, 5]),
      }));
      WebStorage.setAllTimeBlocks(blocks);
    }

    // 3. Pull Habits
    const { data: habitsData, error: habitsErr } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (!habitsErr && habitsData) {
      const habits: Habit[] = habitsData.map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        title: h.title,
        categoryId: h.category_id,
        targetFrequency: h.target_frequency,
        currentStreak: h.current_streak,
        bestStreak: h.best_streak,
        lastCompletedDate: h.last_completed_date || undefined,
      }));
      WebStorage.setAllHabits(habits);
    }

    // 4. Pull Completions
    const { data: completionsData, error: completionsErr } = await supabase
      .from('completions')
      .select('*')
      .eq('user_id', userId);

    if (!completionsErr && completionsData) {
      const completions: CompletionLog[] = completionsData.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        blockId: c.block_id,
        logDate: c.log_date,
        scheduledTime: c.scheduled_time,
        status: c.status,
        loggedAt: c.logged_at,
      }));
      WebStorage.setAllCompletionLogs(completions);
    }

    // 5. Pull Goals
    const { data: goalsData, error: goalsErr } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (!goalsErr && goalsData) {
      const goals: any[] = goalsData.map((g: any) => ({
        id: g.id,
        userId: g.user_id,
        title: g.title,
        categoryId: g.category_id,
        month: g.month,
        targetMetricValue: g.target_metric_value,
        currentMetricValue: g.current_metric_value,
        unit: g.unit,
        status: g.status,
        notes: g.notes || undefined,
      }));
      WebStorage.setAllGoals(goals);
    }

    // 6. Pull Milestones
    const { data: milesData, error: milesErr } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', userId);

    if (!milesErr && milesData) {
      const milestones: GoalMilestone[] = milesData.map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        goalId: m.goal_id,
        title: m.title,
        weekNumber: m.week_number,
        isCompleted: m.is_completed,
        dueDate: m.due_date || undefined,
      }));
      WebStorage.setAllMilestones(milestones);
    }

    return true;
  } catch (error) {
    console.error('[SupabaseSync] Pull error:', error);
    return false;
  }
}

// Push a single routine block change to Supabase
export async function pushRoutineUpsert(block: TimeBlock, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('routines').upsert({
      id: block.id,
      user_id: userId,
      title: block.title,
      category_id: block.categoryId,
      start_time: block.startTime,
      end_time: block.endTime,
      duration_minutes: block.durationMinutes,
      is_recurring: block.isRecurring,
      days_of_week: block.daysOfWeek,
      is_fixed: block.isFixed,
      priority: block.priority,
      notes: block.notes || null,
      source: block.source || 'custom',
      reminders: block.reminders || [30, 20, 10, 5],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SupabaseSync] Push routine upsert failed (will sync later):', err);
  }
}

// Delete routine block from Supabase
export async function pushRoutineDelete(blockId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('routines').delete().eq('id', blockId).eq('user_id', userId);
  } catch (err) {
    console.warn('[SupabaseSync] Push routine delete failed:', err);
  }
}

// Push profile update to Supabase
export async function pushProfileUpsert(profile: UserProfile, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('profiles').upsert({
      id: userId,
      name: profile.name,
      email: profile.email || '',
      wake_time: profile.wakeTime,
      sleep_time: profile.sleepTime,
      archetype: profile.archetype,
      notifications_enabled: profile.notificationsEnabled,
      reminder_lead_minutes: profile.reminderLeadMinutes,
      is_onboarded: profile.isOnboarded,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SupabaseSync] Push profile upsert failed:', err);
  }
}

// Push habit update
export async function pushHabitUpsert(habit: Habit, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('habits').upsert({
      id: habit.id,
      user_id: userId,
      title: habit.title,
      category_id: habit.categoryId,
      target_frequency: habit.targetFrequency,
      current_streak: habit.currentStreak,
      best_streak: habit.bestStreak,
      last_completed_date: habit.lastCompletedDate || null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SupabaseSync] Push habit upsert failed:', err);
  }
}

// Push completion status
export async function pushCompletionUpsert(log: CompletionLog, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('completions').upsert({
      id: log.id,
      user_id: userId,
      block_id: log.blockId,
      log_date: log.logDate,
      scheduled_time: log.scheduledTime,
      status: log.status,
      logged_at: log.loggedAt,
    });
  } catch (err) {
    console.warn('[SupabaseSync] Push completion failed:', err);
  }
}

// Push all routines when template is seeded
export async function pushAllRoutines(blocks: TimeBlock[], userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    // Delete existing routines for this user first
    await supabase.from('routines').delete().eq('user_id', userId);

    if (blocks.length > 0) {
      const rows = blocks.map((b) => ({
        id: b.id,
        user_id: userId,
        title: b.title,
        category_id: b.categoryId,
        start_time: b.startTime,
        end_time: b.endTime,
        duration_minutes: b.durationMinutes,
        is_recurring: b.isRecurring,
        days_of_week: b.daysOfWeek,
        is_fixed: b.isFixed,
        priority: b.priority,
        notes: b.notes || null,
        source: b.source || 'template',
        reminders: b.reminders || [30, 20, 10, 5],
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('routines').upsert(rows);
    }
  } catch (err) {
    console.warn('[SupabaseSync] Push all routines failed:', err);
  }
}

// Push all habits when seeded
export async function pushAllHabits(habits: Habit[], userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('habits').delete().eq('user_id', userId);
    if (habits.length > 0) {
      const rows = habits.map((h) => ({
        id: h.id,
        user_id: userId,
        title: h.title,
        category_id: h.categoryId,
        target_frequency: h.targetFrequency,
        current_streak: h.currentStreak,
        best_streak: h.bestStreak,
        last_completed_date: h.lastCompletedDate || null,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('habits').upsert(rows);
    }
  } catch (err) {
    console.warn('[SupabaseSync] Push all habits failed:', err);
  }
}

// Push goal and milestones
export async function pushGoalAndMilestones(
  goal: MonthlyGoal,
  milestones: GoalMilestone[],
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('goals').upsert({
      id: goal.id,
      user_id: userId,
      title: goal.title,
      category_id: goal.categoryId,
      month: goal.month,
      target_metric_value: goal.targetMetricValue,
      current_metric_value: goal.currentMetricValue,
      unit: goal.unit,
      status: goal.status,
      notes: goal.notes || null,
      updated_at: new Date().toISOString(),
    });

    if (milestones.length > 0) {
      const rows = milestones.map((m) => ({
        id: m.id,
        user_id: userId,
        goal_id: goal.id,
        title: m.title,
        week_number: m.weekNumber,
        is_completed: m.isCompleted,
        due_date: m.dueDate || null,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('milestones').upsert(rows);
    }
  } catch (err) {
    console.warn('[SupabaseSync] Push goal and milestones failed:', err);
  }
}

// Push milestone toggle
export async function pushMilestoneToggle(milestone: GoalMilestone, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('milestones').update({
      is_completed: milestone.isCompleted,
      updated_at: new Date().toISOString(),
    }).eq('id', milestone.id).eq('user_id', userId);
  } catch (err) {
    console.warn('[SupabaseSync] Push milestone toggle failed:', err);
  }
}

// Push goal deletion
export async function pushGoalDelete(goalId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) return;

  try {
    await supabase.from('milestones').delete().eq('goal_id', goalId).eq('user_id', userId);
    await supabase.from('goals').delete().eq('id', goalId).eq('user_id', userId);
  } catch (err) {
    console.warn('[SupabaseSync] Push goal delete failed:', err);
  }
}

