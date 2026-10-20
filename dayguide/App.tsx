import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Theme } from './src/theme/theme';
import { TimeBlock, Category, Habit, UserProfile, MonthlyGoal, GoalMilestone, UserAccount, ArchetypeType } from './src/types';
import {
  getProfile,
  saveProfile,
  getCategories,
  getTimeBlocksForDay,
  insertTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  logBlockStatus,
  getHabits,
  insertHabit,
  toggleHabitCompletion,
  getMonthlyGoals,
  insertMonthlyGoal,
  toggleMilestone,
  deleteMonthlyGoal,
  seedTemplate,
  getCurrentUser,
  logoutUser,
} from './src/db/queries';
import { getDatabase } from './src/db/database';
import { initNotifications, syncAllReminders } from './src/services/notificationService';
import { quickSnoozeBlock } from './src/services/scheduleService';
import { TodayScreen } from './src/screens/TodayScreen';
import { TimetableScreen } from './src/screens/TimetableScreen';
import { HabitsScreen } from './src/screens/HabitsScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AuthScreen } from './src/components/AuthScreen';
import { BlockModal } from './src/components/BlockModal';
import { NewGoalModal } from './src/components/NewGoalModal';
import { OnboardingModal } from './src/components/OnboardingModal';
import { Clock, Calendar, Target, Flame, Settings } from 'lucide-react-native';
import { format } from 'date-fns';

type TabType = 'today' | 'timetable' | 'goals' | 'habits' | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('today');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [todayBlocks, setTodayBlocks] = useState<TimeBlock[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<MonthlyGoal[]>([]);
  
  // Timetable view state
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(new Date().getDay());
  const [timetableBlocks, setTimetableBlocks] = useState<TimeBlock[]>([]);

  // Modals
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [newGoalModalVisible, setNewGoalModalVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const currentDayOfWeek = new Date().getDay();

  // Initialize DB and load data for active user
  const loadData = useCallback(() => {
    try {
      getDatabase(); // initialize schema on native if applicable
      const loadedProfile = getProfile();
      setProfile(loadedProfile);

      const loadedCats = getCategories();
      setCategories(loadedCats);

      if (!loadedProfile || !loadedProfile.isOnboarded) {
        setOnboardingVisible(true);
      } else {
        refreshBlocks();
        refreshHabits();
        refreshGoals();
      }
    } catch (err) {
      console.error('Initialization error:', err);
    }
  }, [selectedDayOfWeek]);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      loadData();
      initNotifications();
    }
  }, [loadData]);

  const refreshBlocks = () => {
    const todayList = getTimeBlocksForDay(currentDayOfWeek, todayStr);
    setTodayBlocks(todayList);

    const timetableList = getTimeBlocksForDay(selectedDayOfWeek, todayStr);
    setTimetableBlocks(timetableList);
  };

  const refreshHabits = () => {
    const habitList = getHabits();
    setHabits(habitList);
  };

  const refreshGoals = () => {
    const goalsList = getMonthlyGoals(currentMonthStr);
    setGoals(goalsList);
  };

  // Auth Handlers
  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    const loadedProfile = getProfile();
    setProfile(loadedProfile);
    const loadedCats = getCategories();
    setCategories(loadedCats);

    if (!loadedProfile || !loadedProfile.isOnboarded) {
      setOnboardingVisible(true);
    } else {
      refreshBlocks();
      refreshHabits();
      refreshGoals();
      initNotifications();
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setProfile(null);
    setTodayBlocks([]);
    setTimetableBlocks([]);
    setHabits([]);
    setGoals([]);
    setOnboardingVisible(false);
  };

  // Handle Onboarding Completion
  const handleOnboardingComplete = (
    archetype: 'prayer' | 'freelancer' | 'student' | 'balanced',
    wakeTime: string,
    sleepTime: string
  ) => {
    seedTemplate(archetype);
    const newProfile: UserProfile = {
      userId: currentUser?.id,
      name: currentUser?.name || 'Owner',
      email: currentUser?.email,
      wakeTime,
      sleepTime,
      archetype,
      notificationsEnabled: true,
      reminderLeadMinutes: 10,
      includePrayerLife: true,
      isOnboarded: true,
    };
    saveProfile(newProfile);
    setProfile(newProfile);
    setOnboardingVisible(false);

    // Refresh and schedule notifications
    const blocks = getTimeBlocksForDay(currentDayOfWeek, todayStr);
    setTodayBlocks(blocks);
    setTimetableBlocks(blocks);
    refreshHabits();
    refreshGoals();
    syncAllReminders(blocks, 10);
  };

  // Handle Block Actions
  const handleCompleteBlock = (block: TimeBlock) => {
    logBlockStatus(block.id, todayStr, block.startTime, 'done');
    refreshBlocks();
  };

  const handleSnoozeBlock = (block: TimeBlock) => {
    const snoozed = quickSnoozeBlock(block, 10);
    updateTimeBlock(snoozed);
    logBlockStatus(block.id, todayStr, block.startTime, 'snoozed');
    refreshBlocks();
  };

  const handleSkipBlock = (block: TimeBlock) => {
    logBlockStatus(block.id, todayStr, block.startTime, 'skipped');
    refreshBlocks();
  };

  const handleToggleStatus = (block: TimeBlock) => {
    const nextStatus = block.status === 'done' ? 'pending' : 'done';
    logBlockStatus(block.id, todayStr, block.startTime, nextStatus as any);
    refreshBlocks();
  };

  // Block Modal Save / Delete
  const handleSaveBlock = (blockData: Omit<TimeBlock, 'id'>, id?: string) => {
    if (id) {
      updateTimeBlock({ ...blockData, id });
    } else {
      insertTimeBlock(blockData);
    }
    refreshBlocks();
  };

  const handleDeleteBlock = (id: string) => {
    deleteTimeBlock(id);
    refreshBlocks();
  };

  // Habit toggle
  const handleToggleHabit = (habit: Habit) => {
    toggleHabitCompletion(habit.id, todayStr);
    refreshHabits();
  };

  const handleAddHabit = (title: string, categoryId: string) => {
    insertHabit(title, categoryId);
    refreshHabits();
  };

  // Goal actions
  const handleToggleMilestone = (milestoneId: string) => {
    toggleMilestone(milestoneId);
    refreshGoals();
  };

  const handleSaveNewGoal = (
    goalData: Omit<MonthlyGoal, 'id' | 'milestones'>,
    milestones: Omit<GoalMilestone, 'id' | 'goalId'>[]
  ) => {
    insertMonthlyGoal(goalData, milestones);
    refreshGoals();
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert('Delete Goal', 'Are you sure you want to remove this monthly goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMonthlyGoal(goalId);
          refreshGoals();
        },
      },
    ]);
  };

  const handleConvertToTimeBlock = (milestone: GoalMilestone) => {
    setEditingBlock({
      id: '',
      title: milestone.title,
      categoryId: 'personal',
      startTime: '09:00',
      endTime: '10:30',
      durationMinutes: 90,
      isRecurring: false,
      daysOfWeek: [currentDayOfWeek],
      isFixed: false,
      priority: 'P0',
      notes: `Goal Milestone: Week ${milestone.weekNumber}`,
    });
    setBlockModalVisible(true);
  };

  // Template switch from Settings
  const handleResetToArchetype = (archetype: 'prayer' | 'freelancer' | 'student' | 'balanced') => {
    Alert.alert(
      'Load Template Routine',
      `This will update your routine blocks with the default ${archetype.toUpperCase()} schedule. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Template',
          style: 'destructive',
          onPress: () => {
            seedTemplate(archetype);
            if (profile) {
              const updated = { ...profile, archetype };
              saveProfile(updated);
              setProfile(updated);
            }
            refreshBlocks();
            refreshHabits();
            refreshGoals();
          },
        },
      ]
    );
  };

  // If user is not logged in, render the AuthScreen directly
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      {/* Main Tab Screen Display */}
      <View style={styles.screenContainer}>
        {currentTab === 'today' && (
          <TodayScreen
            blocks={todayBlocks}
            categories={categories}
            onCompleteBlock={handleCompleteBlock}
            onSnoozeBlock={handleSnoozeBlock}
            onSkipBlock={handleSkipBlock}
            onToggleStatus={handleToggleStatus}
            onAddBlockPress={() => {
              setEditingBlock(null);
              setBlockModalVisible(true);
            }}
            onBlockPress={(block) => {
              setEditingBlock(block);
              setBlockModalVisible(true);
            }}
            onRefresh={refreshBlocks}
          />
        )}

        {currentTab === 'timetable' && (
          <TimetableScreen
            blocks={timetableBlocks}
            categories={categories}
            selectedDay={selectedDayOfWeek}
            onSelectDay={(day) => {
              setSelectedDayOfWeek(day);
              setTimetableBlocks(getTimeBlocksForDay(day, todayStr));
            }}
            onAddBlockPress={() => {
              setEditingBlock(null);
              setBlockModalVisible(true);
            }}
            onBlockPress={(block) => {
              setEditingBlock(block);
              setBlockModalVisible(true);
            }}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {currentTab === 'goals' && (
          <GoalsScreen
            goals={goals}
            categories={categories}
            currentMonth={currentMonthStr}
            onToggleMilestone={handleToggleMilestone}
            onDeleteGoal={handleDeleteGoal}
            onNewGoalPress={() => setNewGoalModalVisible(true)}
            onConvertToTimeBlock={handleConvertToTimeBlock}
            onRefresh={refreshGoals}
          />
        )}

        {currentTab === 'habits' && (
          <HabitsScreen
            habits={habits}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            profile={profile}
            currentUser={currentUser}
            onResetToArchetype={handleResetToArchetype}
            onOpenOnboarding={() => setOnboardingVisible(true)}
            onLogout={handleLogout}
          />
        )}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'today' && styles.tabItemActive]}
          onPress={() => setCurrentTab('today')}
          activeOpacity={0.8}
        >
          <Clock
            size={20}
            color={currentTab === 'today' ? Theme.colors.primaryLight : Theme.colors.textMuted}
          />
          <Text
            style={[styles.tabLabel, currentTab === 'today' && styles.tabLabelActive]}
          >
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'timetable' && styles.tabItemActive]}
          onPress={() => {
            setCurrentTab('timetable');
            setTimetableBlocks(getTimeBlocksForDay(selectedDayOfWeek, todayStr));
          }}
          activeOpacity={0.8}
        >
          <Calendar
            size={20}
            color={currentTab === 'timetable' ? Theme.colors.primaryLight : Theme.colors.textMuted}
          />
          <Text
            style={[styles.tabLabel, currentTab === 'timetable' && styles.tabLabelActive]}
          >
            Timetable
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'goals' && styles.tabItemActive]}
          onPress={() => {
            setCurrentTab('goals');
            refreshGoals();
          }}
          activeOpacity={0.8}
        >
          <Target
            size={20}
            color={currentTab === 'goals' ? Theme.colors.accent : Theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'goals' && { color: Theme.colors.accent, fontWeight: '800' },
            ]}
          >
            Goals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'habits' && styles.tabItemActive]}
          onPress={() => setCurrentTab('habits')}
          activeOpacity={0.8}
        >
          <Flame
            size={20}
            color={currentTab === 'habits' ? Theme.colors.warning : Theme.colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              currentTab === 'habits' && { color: Theme.colors.warning, fontWeight: '800' },
            ]}
          >
            Habits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentTab === 'settings' && styles.tabItemActive]}
          onPress={() => setCurrentTab('settings')}
          activeOpacity={0.8}
        >
          <Settings
            size={20}
            color={currentTab === 'settings' ? Theme.colors.primaryLight : Theme.colors.textMuted}
          />
          <Text
            style={[styles.tabLabel, currentTab === 'settings' && styles.tabLabelActive]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Block Modal */}
      <BlockModal
        visible={blockModalVisible}
        block={editingBlock}
        categories={categories}
        onClose={() => setBlockModalVisible(false)}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
      />

      {/* New Goal Modal */}
      <NewGoalModal
        visible={newGoalModalVisible}
        categories={categories}
        currentMonth={currentMonthStr}
        onClose={() => setNewGoalModalVisible(false)}
        onSave={handleSaveNewGoal}
      />

      {/* Onboarding Questionnaire Modal */}
      <OnboardingModal
        visible={onboardingVisible}
        userName={currentUser?.name}
        onComplete={handleOnboardingComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 16 : 4,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Theme.radii.md,
  },
  tabItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  tabLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: Theme.colors.primaryLight,
    fontWeight: '800',
  },
});
