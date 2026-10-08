import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Habit } from '../types';
import { Theme } from '../theme/theme';
import { HabitCard } from '../components/HabitCard';
import { Flame, Plus, X, Check, Target } from 'lucide-react-native';
import { format } from 'date-fns';

interface HabitsScreenProps {
  habits: Habit[];
  onToggleHabit: (habit: Habit) => void;
  onAddHabit: (title: string, categoryId: string) => void;
}

export const HabitsScreen: React.FC<HabitsScreenProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Compute stats
  const totalStreaks = habits.reduce((acc, h) => acc + h.currentStreak, 0);
  const completedTodayCount = habits.filter((h) => h.lastCompletedDate === todayStr).length;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onAddHabit(newTitle.trim(), 'health');
    setNewTitle('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Top Summary Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.statBox}>
            <Flame size={20} color={Theme.colors.warning} />
            <Text style={styles.statNum}>{totalStreaks}</Text>
            <Text style={styles.statLabel}>Total Streak Days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Target size={20} color={Theme.colors.success} />
            <Text style={styles.statNum}>
              {completedTodayCount}/{habits.length}
            </Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Daily Habits</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>New Habit</Text>
          </TouchableOpacity>
        </View>

        {/* Habit List */}
        {habits.map((habit) => {
          const isDoneToday = habit.lastCompletedDate === todayStr;
          return (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompletedToday={isDoneToday}
              onToggle={onToggleHabit}
            />
          );
        })}
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track New Habit</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="e.g. Read 20 pages, 15m Meditation..."
              placeholderTextColor={Theme.colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.saveBtn, !newTitle.trim() && styles.saveBtnDisabled]}
              onPress={handleCreate}
              disabled={!newTitle.trim()}
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Start Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  statLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radii.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    padding: 12,
    color: Theme.colors.textPrimary,
    fontSize: 15,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    height: 44,
    borderRadius: Theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
