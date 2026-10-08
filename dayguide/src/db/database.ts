import * as SQLite from 'expo-sqlite';
import { TimeBlock, Habit, UserProfile, Category, CompletionLog } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('dayguide.db');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: SQLite.SQLiteDatabase) {
  // Execute table creations in a single transaction
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

// Archetype Templates
export const ARCHETYPE_TEMPLATES = {
  freelancer: [
    { title: 'Morning Routine & Devotion', categoryId: 'personal', start: '07:00', end: '08:00', fixed: true, priority: 'P0' },
    { title: 'Deep Work Block 1', categoryId: 'work', start: '08:30', end: '11:30', fixed: false, priority: 'P0' },
    { title: 'Healthy Lunch & Walk', categoryId: 'health', start: '12:00', end: '13:00', fixed: true, priority: 'P1' },
    { title: 'Deep Work Block 2 (Client Calls/Tasks)', categoryId: 'work', start: '13:30', end: '16:30', fixed: false, priority: 'P1' },
    { title: 'Workout / Fitness', categoryId: 'health', start: '17:00', end: '18:00', fixed: false, priority: 'P0' },
    { title: 'Dinner & Relaxation', categoryId: 'routine', start: '18:30', end: '19:30', fixed: true, priority: 'P2' },
    { title: 'Skill Reading / Learning', categoryId: 'learning', start: '20:00', end: '21:00', fixed: false, priority: 'P1' },
    { title: 'Evening Wrap-Up & Wind Down', categoryId: 'rest', start: '22:00', end: '22:45', fixed: true, priority: 'P0' },
  ],
  student: [
    { title: 'Wake Up & Quick Breakfast', categoryId: 'routine', start: '06:30', end: '07:30', fixed: true, priority: 'P0' },
    { title: 'Lecture / Class Session 1', categoryId: 'learning', start: '08:00', end: '11:00', fixed: true, priority: 'P0' },
    { title: 'Lunch Break', categoryId: 'routine', start: '11:30', end: '12:30', fixed: true, priority: 'P2' },
    { title: 'Lecture / Class Session 2', categoryId: 'learning', start: '13:00', end: '15:30', fixed: true, priority: 'P0' },
    { title: 'Exercise & Outdoor Break', categoryId: 'health', start: '16:00', end: '17:00', fixed: false, priority: 'P1' },
    { title: 'Self-Study & Assignments', categoryId: 'work', start: '18:00', end: '20:30', fixed: false, priority: 'P0' },
    { title: 'Dinner & Leisure', categoryId: 'routine', start: '20:30', end: '21:30', fixed: true, priority: 'P2' },
    { title: 'Reading & Wind-Down', categoryId: 'rest', start: '22:00', end: '22:30', fixed: false, priority: 'P1' },
  ],
  balanced: [
    { title: 'Morning Routine & Meditation', categoryId: 'personal', start: '07:00', end: '08:00', fixed: true, priority: 'P1' },
    { title: 'Morning Focus Work', categoryId: 'work', start: '09:00', end: '12:00', fixed: false, priority: 'P0' },
    { title: 'Lunch & Fresh Air', categoryId: 'health', start: '12:00', end: '13:00', fixed: true, priority: 'P1' },
    { title: 'Afternoon Collaborative Tasks', categoryId: 'work', start: '13:30', end: '17:00', fixed: false, priority: 'P1' },
    { title: 'Gym / Jogging Session', categoryId: 'health', start: '17:30', end: '18:30', fixed: false, priority: 'P0' },
    { title: 'Family & Dinner Time', categoryId: 'routine', start: '19:00', end: '20:30', fixed: true, priority: 'P1' },
    { title: 'Personal Project / Reading', categoryId: 'learning', start: '20:30', end: '21:30', fixed: false, priority: 'P2' },
    { title: 'Sleep Preparation', categoryId: 'rest', start: '22:00', end: '22:30', fixed: true, priority: 'P0' },
  ]
};

export function seedTemplate(archetype: 'freelancer' | 'student' | 'balanced') {
  const db = getDatabase();
  const template = ARCHETYPE_TEMPLATES[archetype];
  if (!template) return;

  // Clear existing blocks
  db.runSync('DELETE FROM time_blocks');

  // Insert template blocks (active all days: [0,1,2,3,4,5,6])
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
        'Auto-generated from template'
      ]
    );
  }

  // Seed default habits
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
