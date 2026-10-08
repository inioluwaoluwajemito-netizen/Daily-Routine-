import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TimeBlock } from '../types';
import { Theme } from '../theme/theme';
import { formatTimeDisplay } from '../services/scheduleService';
import { Check, CheckCircle2, Clock, MoreVertical, XCircle } from 'lucide-react-native';

interface TimelineItemProps {
  block: TimeBlock;
  categoryColor?: string;
  onPress?: () => void;
  onToggleStatus?: () => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  block,
  categoryColor = Theme.colors.primary,
  onPress,
  onToggleStatus,
}) => {
  const isDone = block.status === 'done';
  const isSkipped = block.status === 'skipped';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDone && styles.doneContainer,
        isSkipped && styles.skippedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Category Indicator Accent Strip */}
      <View style={[styles.indicatorStrip, { backgroundColor: categoryColor }]} />

      {/* Time Column */}
      <View style={styles.timeCol}>
        <Text style={[styles.timeText, isDone && styles.mutedText]}>
          {formatTimeDisplay(block.startTime)}
        </Text>
        <Text style={styles.durationText}>{block.durationMinutes}m</Text>
      </View>

      {/* Main Info */}
      <View style={styles.infoCol}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              isDone && styles.doneTitle,
              isSkipped && styles.mutedText,
            ]}
            numberOfLines={1}
          >
            {block.title}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.priorityPill}>{block.priority}</Text>
          {block.isFixed && <Text style={styles.fixedPill}>Fixed</Text>}
          {block.notes ? (
            <Text style={styles.notesText} numberOfLines={1}>
              • {block.notes}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Status Toggle Action */}
      <TouchableOpacity
        style={[styles.statusBtn, isDone && styles.statusBtnDone]}
        onPress={onToggleStatus}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isDone ? (
          <Check size={16} color="#FFFFFF" />
        ) : (
          <View style={styles.emptyCircle} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  doneContainer: {
    opacity: 0.65,
    backgroundColor: 'rgba(19, 27, 46, 0.6)',
  },
  skippedContainer: {
    opacity: 0.5,
  },
  indicatorStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  timeCol: {
    width: 72,
    paddingLeft: 6,
  },
  timeText: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  durationText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  infoCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  doneTitle: {
    textDecorationLine: 'line-through',
    color: Theme.colors.textMuted,
  },
  mutedText: {
    color: Theme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  priorityPill: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fixedPill: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  notesText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  statusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.borderLight,
  },
  statusBtnDone: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  emptyCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
