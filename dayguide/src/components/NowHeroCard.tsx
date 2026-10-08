import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TimeBlock } from '../types';
import { Theme } from '../theme/theme';
import { formatTimeDisplay } from '../services/scheduleService';
import { Check, Clock, SkipForward, Play } from 'lucide-react-native';

interface NowHeroCardProps {
  block: TimeBlock | null;
  minutesRemaining: number;
  onComplete: (block: TimeBlock) => void;
  onSnooze: (block: TimeBlock) => void;
  onSkip: (block: TimeBlock) => void;
}

export const NowHeroCard: React.FC<NowHeroCardProps> = ({
  block,
  minutesRemaining,
  onComplete,
  onSnooze,
  onSkip,
}) => {
  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (block) onComplete(block);
  };

  const handleSnooze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (block) onSnooze(block);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (block) onSkip(block);
  };

  if (!block) {
    return (
      <View style={styles.idleCard}>
        <View style={styles.idleBadge}>
          <Clock size={16} color={Theme.colors.accent} />
          <Text style={styles.idleBadgeText}>Free Interval</Text>
        </View>
        <Text style={styles.idleTitle}>No Active Block Right Now</Text>
        <Text style={styles.idleSubtitle}>
          Take a deep breath or check upcoming blocks below to prepare for what is next.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Tag Row */}
      <View style={styles.topRow}>
        <View style={styles.nowBadge}>
          <View style={styles.pulsingDot} />
          <Text style={styles.nowBadgeText}>FOCUS NOW</Text>
        </View>
        <View style={styles.timeBadge}>
          <Clock size={14} color={Theme.colors.textSecondary} />
          <Text style={styles.timeBadgeText}>
            {formatTimeDisplay(block.startTime)} – {formatTimeDisplay(block.endTime)}
          </Text>
        </View>
      </View>

      {/* Main Title */}
      <Text style={styles.title} numberOfLines={2}>
        {block.title}
      </Text>

      {/* Live Timer Meter */}
      <View style={styles.timerRow}>
        <View style={styles.timerBox}>
          <Text style={styles.timerCount}>{minutesRemaining}</Text>
          <Text style={styles.timerLabel}>MINUTES LEFT</Text>
        </View>
        <View style={styles.priorityBox}>
          <Text style={styles.priorityTag}>{block.priority}</Text>
          <Text style={styles.fixedTag}>{block.isFixed ? 'Fixed Anchor' : 'Flexible'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.completeBtn]}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.completeBtnText}>Mark Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.snoozeBtn]}
          onPress={handleSnooze}
          activeOpacity={0.8}
        >
          <Clock size={16} color={Theme.colors.warning} />
          <Text style={styles.snoozeBtnText}>+10m</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.skipBtn]}
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <SkipForward size={16} color={Theme.colors.textMuted} />
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    marginVertical: Theme.spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radii.pill,
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primaryLight,
  },
  nowBadgeText: {
    color: Theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeBadgeText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: Theme.spacing.md,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radii.md,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  timerCount: {
    color: Theme.colors.accent,
    fontSize: 32,
    fontWeight: '900',
  },
  timerLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priorityBox: {
    alignItems: 'flex-end',
  },
  priorityTag: {
    color: Theme.colors.warning,
    fontSize: 12,
    fontWeight: '800',
  },
  fixedTag: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radii.md,
    gap: 6,
  },
  completeBtn: {
    flex: 2,
    backgroundColor: Theme.colors.primary,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  snoozeBtn: {
    flex: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  snoozeBtnText: {
    color: Theme.colors.warning,
    fontWeight: '700',
    fontSize: 13,
  },
  skipBtn: {
    paddingHorizontal: 14,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  skipBtnText: {
    color: Theme.colors.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  idleCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginVertical: Theme.spacing.sm,
  },
  idleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.sm,
  },
  idleBadgeText: {
    color: Theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  idleTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  idleSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
