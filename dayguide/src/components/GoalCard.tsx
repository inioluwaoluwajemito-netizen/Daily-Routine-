import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MonthlyGoal, GoalMilestone } from '../types';
import { Theme } from '../theme/theme';
import {
  Target,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface GoalCardProps {
  goal: MonthlyGoal;
  categoryColor: string;
  onToggleMilestone: (milestoneId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onConvertToTimeBlock?: (milestone: GoalMilestone) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  categoryColor,
  onToggleMilestone,
  onDeleteGoal,
  onConvertToTimeBlock,
}) => {
  const [expanded, setExpanded] = useState(true);

  const totalMilestones = goal.milestones.length;
  const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
  const progressPercent = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const handleMilestonePress = (mId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleMilestone(mId);
  };

  return (
    <View style={styles.container}>
      {/* Category accent bar */}
      <View style={[styles.accentStrip, { backgroundColor: categoryColor }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <View style={styles.badgeRow}>
            <View style={[styles.targetBadge, { backgroundColor: `${categoryColor}25` }]}>
              <Target size={12} color={categoryColor} />
              <Text style={[styles.targetBadgeText, { color: categoryColor }]}>
                Monthly Target
              </Text>
            </View>
            <Text style={styles.progressText}>
              {completedMilestones}/{totalMilestones} done ({progressPercent}%)
            </Text>
          </View>
          <Text style={styles.title}>{goal.title}</Text>
          {goal.notes ? <Text style={styles.notesText}>{goal.notes}</Text> : null}
        </View>

        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setExpanded(!expanded)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {expanded ? (
            <ChevronUp size={20} color={Theme.colors.textMuted} />
          ) : (
            <ChevronDown size={20} color={Theme.colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%`, backgroundColor: categoryColor },
          ]}
        />
      </View>

      {/* 4-Week Breakdown Accordion */}
      {expanded && (
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownHeading}>Weekly Milestones Breakdown</Text>

          {goal.milestones.map((m) => {
            return (
              <View key={m.id} style={styles.milestoneRow}>
                <TouchableOpacity
                  style={styles.checkTouch}
                  onPress={() => handleMilestonePress(m.id)}
                  activeOpacity={0.7}
                >
                  {m.isCompleted ? (
                    <CheckCircle2 size={20} color={Theme.colors.success} />
                  ) : (
                    <Circle size={20} color={Theme.colors.borderLight} />
                  )}
                  <View style={styles.milestoneTextCol}>
                    <Text style={styles.weekTag}>Week {m.weekNumber}</Text>
                    <Text
                      style={[
                        styles.milestoneTitle,
                        m.isCompleted && styles.milestoneDone,
                      ]}
                    >
                      {m.title}
                    </Text>
                  </View>
                </TouchableOpacity>

                {onConvertToTimeBlock && !m.isCompleted && (
                  <TouchableOpacity
                    style={styles.schedulePill}
                    onPress={() => onConvertToTimeBlock(m)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={12} color={Theme.colors.primaryLight} />
                    <Text style={styles.schedulePillText}>Schedule</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* Footer Delete */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.deleteTouch}
              onPress={() => onDeleteGoal(goal.id)}
            >
              <Trash2 size={14} color={Theme.colors.danger} />
              <Text style={styles.deleteText}>Remove Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
    paddingBottom: 10,
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radii.pill,
  },
  targetBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  notesText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  expandBtn: {
    padding: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Theme.radii.pill,
  },
  breakdownSection: {
    padding: Theme.spacing.md,
    paddingTop: 12,
    backgroundColor: 'rgba(11, 15, 25, 0.4)',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    marginTop: 12,
  },
  breakdownHeading: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 44, 74, 0.5)',
  },
  checkTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  milestoneTextCol: {
    flex: 1,
  },
  weekTag: {
    color: Theme.colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  milestoneTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  milestoneDone: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textMuted,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.pill,
  },
  schedulePillText: {
    color: Theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  deleteTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  deleteText: {
    color: Theme.colors.danger,
    fontSize: 11,
    fontWeight: '600',
  },
});
