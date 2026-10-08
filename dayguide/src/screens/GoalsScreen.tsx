import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MonthlyGoal, Category, GoalMilestone } from '../types';
import { Theme } from '../theme/theme';
import { GoalCard } from '../components/GoalCard';
import { Target, Plus, CheckCircle2, Trophy, Compass } from 'lucide-react-native';
import { format } from 'date-fns';

interface GoalsScreenProps {
  goals: MonthlyGoal[];
  categories: Category[];
  currentMonth: string; // "YYYY-MM"
  onToggleMilestone: (milestoneId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onNewGoalPress: () => void;
  onConvertToTimeBlock: (milestone: GoalMilestone) => void;
  onRefresh: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  goals,
  categories,
  currentMonth,
  onToggleMilestone,
  onDeleteGoal,
  onNewGoalPress,
  onConvertToTimeBlock,
  onRefresh,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const categoryColorMap = new Map(categories.map((c) => [c.id, c.color]));

  // Calculate metrics
  let totalMilestones = 0;
  let completedMilestones = 0;
  for (const g of goals) {
    totalMilestones += g.milestones.length;
    completedMilestones += g.milestones.filter((m) => m.isCompleted).length;
  }
  const overallPercent = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const handlePullRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor={Theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSub}>TARGETS & MILESTONES</Text>
            <Text style={styles.headerTitle}>{format(new Date(), 'MMMM yyyy')} Goals</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onNewGoalPress}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Overview Stats Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.statBox}>
            <Target size={20} color={Theme.colors.primaryLight} />
            <Text style={styles.statNum}>{goals.length}</Text>
            <Text style={styles.statLabel}>Active Goals</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <CheckCircle2 size={20} color={Theme.colors.success} />
            <Text style={styles.statNum}>
              {completedMilestones}/{totalMilestones}
            </Text>
            <Text style={styles.statLabel}>Milestones Done</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Trophy size={20} color={Theme.colors.warning} />
            <Text style={styles.statNum}>{overallPercent}%</Text>
            <Text style={styles.statLabel}>Monthly Progress</Text>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Breakdown Roadmaps</Text>
          <Text style={styles.sectionCount}>{goals.length} Roadmaps</Text>
        </View>

        {/* Goals List */}
        {goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Compass size={36} color={Theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Goals Set For This Month</Text>
            <Text style={styles.emptySub}>
              Set a high-level outcome and let DayGuide help you break it into 4 weekly action steps.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={onNewGoalPress}>
              <Text style={styles.emptyAddBtnText}>Create Monthly Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              categoryColor={categoryColorMap.get(g.categoryId) || Theme.colors.primary}
              onToggleMilestone={onToggleMilestone}
              onDeleteGoal={onDeleteGoal}
              onConvertToTimeBlock={onConvertToTimeBlock}
            />
          ))
        )}
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.radii.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  statLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionCount: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Theme.colors.surfaceCard,
    padding: Theme.spacing.xl,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: 10,
  },
  emptyTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.radii.md,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
