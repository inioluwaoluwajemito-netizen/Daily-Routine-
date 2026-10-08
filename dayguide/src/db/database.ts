import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { TimeBlock, Habit, UserProfile, Category, CompletionLog } from '../types';
import { ARCHETYPE_TEMPLATES } from '../constants/templates';
export { ARCHETYPE_TEMPLATES };

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase | null {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    if (!dbInstance) {
      dbInstance = SQLite.openDatabaseSync('dayguide.db');
      initSchema(dbInstance);
    }
    return dbInstance;
  } catch (err) {
    console.warn('Failed to open native SQLite database:', err);
    return null;
  }
}

function initSchema(db: SQLite.SQLiteDatabase) {
  try {
    db.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        wake_time TEXT NOT NULL,
        sleep_time TEXT NOT NULL,
        archetype TEXT NOT NULL,
        notifications_enabled INTEGER NOT NULL,
        reminder_lead_minutes INTEGER NOT NULL,
        is_onboarded INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon_name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS time_blocks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        is_recurring INTEGER NOT NULL,
        days_of_week TEXT NOT NULL,
        is_fixed INTEGER NOT NULL,
        priority TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category_id TEXT NOT NULL,
        target_frequency INTEGER NOT NULL,
        current_streak INTEGER NOT NULL,
        best_streak INTEGER NOT NULL,
        last_completed_date TEXT
      );

      CREATE TABLE IF NOT EXISTS completion_logs (
        id TEXT PRIMARY KEY,
        block_id TEXT NOT NULL,
        log_date TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        status TEXT NOT NULL,
        logged_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category_id TEXT NOT NULL,
        month TEXT NOT NULL,
        target_metric_value REAL NOT NULL,
        current_metric_value REAL NOT NULL,
        unit TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS goal_milestones (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        title TEXT NOT NULL,
        week_number INTEGER NOT NULL,
        is_completed INTEGER NOT NULL,
        due_date TEXT
      );
    `);

    // Seed default categories if empty
    const catCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    if (!catCount || catCount.count === 0) {
      seedDefaultCategories(db);
    }
  } catch (e) {
    console.error('Error initializing schema:', e);
  }
}

function seedDefaultCategories(db: SQLite.SQLiteDatabase) {
  const categories: Category[] = [
    { id: 'work', name: 'Deep Work & Projects', color: '#6366F1', iconName: 'briefcase' },
    { id: 'health', name: 'Health & Exercise', color: '#10B981', iconName: 'activity' },
    { id: 'learning', name: 'Learning & Reading', color: '#06B6D4', iconName: 'book-open' },
    { id: 'routine', name: 'Daily Routine & Meals', color: '#F59E0B', iconName: 'coffee' },
    { id: 'rest', name: 'Rest & Wind-down', color: '#A855F7', iconName: 'moon' },
    { id: 'personal', name: 'Personal & Devotion', color: '#EC4899', iconName: 'heart' },
  ];

  for (const cat of categories) {
    db.runSync(
      'INSERT INTO categories (id, name, color, icon_name) VALUES (?, ?, ?, ?)',
      [cat.id, cat.name, cat.color, cat.iconName]
    );
  }
}

export function seedTemplateNative(archetype: 'freelancer' | 'student' | 'balanced') {
  const db = getDatabase();
  if (!db) return;

  const template = ARCHETYPE_TEMPLATES[archetype];
  if (!template) return;

  db.runSync('DELETE FROM time_blocks');
  const daysStr = JSON.stringify([0, 1, 2, 3, 4, 5, 6]);

  for (let i = 0; i < template.length; i++) {
    const item = template[i];
    const [startH, startM] = item.start.split(':').map(Number);
    const [endH, endM] = item.end.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);

    db.runSync(
      `INSERT INTO time_blocks 
       (id, title, category_id, start_time, end_time, duration_minutes, is_recurring, days_of_week, is_fixed, priority, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `block_${Date.now()}_${i}`,
        item.title,
        item.categoryId,
        item.start,
        item.end,
        duration,
        1,
        daysStr,
        item.fixed ? 1 : 0,
        item.priority,
        'Auto-generated from template',
      ]
    );
  }

  db.runSync('DELETE FROM habits');
  const defaultHabits = [
    { title: 'Daily Devotion / Mindfulness', categoryId: 'personal' },
    { title: '30-min Physical Workout', categoryId: 'health' },
    { title: 'Read 15 Pages', categoryId: 'learning' },
  ];

  for (let i = 0; i < defaultHabits.length; i++) {
    db.runSync(
      `INSERT INTO habits (id, title, category_id, target_frequency, current_streak, best_streak)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [`habit_${i + 1}`, defaultHabits[i].title, defaultHabits[i].categoryId, 7, 0, 0]
    );
  }
}
