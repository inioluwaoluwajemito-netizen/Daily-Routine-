import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Habit } from '../types';
import { Theme } from '../theme/theme';
import { Flame, Check, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onToggle: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompletedToday,
  onToggle,
}) => {
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(habit);
  };

  return (
    <View style={[styles.container, isCompletedToday && styles.completedContainer]}>
      <View style={styles.leftCol}>
        <Text style={[styles.title, isCompletedToday && styles.completedTitle]}>
          {habit.title}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.streakBadge}>
            <Flame size={14} color={Theme.colors.warning} />
            <Text style={styles.streakText}>{habit.currentStreak} day streak</Text>
          </View>
          {habit.bestStreak > 0 && (
            <View style={styles.bestBadge}>
              <Trophy size={12} color={Theme.colors.accent} />
              <Text style={styles.bestText}>Best: {habit.bestStreak}</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.checkBtn, isCompletedToday && styles.checkBtnActive]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <Check size={18} color={isCompletedToday ? '#FFFFFF' : Theme.colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  completedContainer: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(19, 27, 46, 0.9)',
  },
  leftCol: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  completedTitle: {
    color: Theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    color: Theme.colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.borderLight,
    backgroundColor: Theme.colors.surface,
  },
  checkBtnActive: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
});
