import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TimeBlock, Category } from '../types';
import { Theme } from '../theme/theme';
import { TimelineItem } from '../components/TimelineItem';
import { detectConflicts } from '../services/scheduleService';
import { Plus, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react-native';

interface TimetableScreenProps {
  blocks: TimeBlock[];
  categories: Category[];
  selectedDay: number; // 0=Sun, 1=Mon, ..., 6=Sat
  onSelectDay: (day: number) => void;
  onAddBlockPress: () => void;
  onBlockPress: (block: TimeBlock) => void;
  onToggleStatus: (block: TimeBlock) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TimetableScreen: React.FC<TimetableScreenProps> = ({
  blocks,
  categories,
  selectedDay,
  onSelectDay,
  onAddBlockPress,
  onBlockPress,
  onToggleStatus,
}) => {
  const categoryColorMap = new Map(categories.map((c) => [c.id, c.color]));
  const conflicts = detectConflicts(blocks);

  // Calculate total scheduled hours for this day
  const totalMinutes = blocks.reduce((acc, b) => acc + b.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <View style={styles.container}>
      {/* Top Days Bar */}
      <View style={styles.daysBar}>
        {DAYS.map((d, index) => {
          const isSelected = selectedDay === index;
          return (
            <TouchableOpacity
              key={d}
              style={[styles.dayTab, isSelected && styles.dayTabActive]}
              onPress={() => onSelectDay(index)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                {d}
              </Text>
              {isSelected && <View style={styles.dayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Day Stats Row */}
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsTitle}>{DAYS[selectedDay]} Routine</Text>
            <Text style={styles.statsSub}>
              {blocks.length} blocks • {totalHours} hrs planned
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newBlockBtn}
            onPress={onAddBlockPress}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.newBlockBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Conflict Warning Alert Banner */}
        {conflicts.size > 0 && (
          <View style={styles.conflictBanner}>
            <AlertTriangle size={18} color={Theme.colors.warning} />
            <View style={styles.conflictInfo}>
              <Text style={styles.conflictTitle}>Overlap Detected</Text>
              <Text style={styles.conflictSub}>
                {conflicts.size} blocks have overlapping time ranges.
              </Text>
            </View>
          </View>
        )}

        {/* Blocks List */}
        {blocks.length === 0 ? (
          <View style={styles.emptyCard}>
            <CalendarIcon size={32} color={Theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No blocks for {DAYS[selectedDay]}</Text>
            <Text style={styles.emptySub}>
              Create a custom block or duplicate recurring routines.
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddBlockPress}>
              <Text style={styles.emptyAddBtnText}>Add Block</Text>
            </TouchableOpacity>
          </View>
        ) : (
          blocks.map((block) => {
            const hasConflict = conflicts.has(block.id);
            return (
              <View
                key={block.id}
                style={[
                  styles.blockWrapper,
                  hasConflict && styles.blockConflictWrapper,
                ]}
              >
                <TimelineItem
                  block={block}
                  categoryColor={categoryColorMap.get(block.categoryId)}
                  onPress={() => onBlockPress(block)}
                  onToggleStatus={() => onToggleStatus(block)}
                />
              </View>
            );
          })
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
  daysBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  dayTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Theme.radii.md,
  },
  dayTabActive: {
    backgroundColor: Theme.colors.surfaceElevated,
  },
  dayText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  dayTextActive: {
    color: Theme.colors.primaryLight,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.primaryLight,
    marginTop: 4,
  },
  scroll: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 16,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statsTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  statsSub: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  newBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radii.md,
  },
  newBlockBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: Theme.radii.md,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  conflictInfo: {
    flex: 1,
  },
  conflictTitle: {
    color: Theme.colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  conflictSub: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  blockWrapper: {
    marginBottom: 2,
  },
  blockConflictWrapper: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.warning,
    borderRadius: Theme.radii.md,
  },
  emptyCard: {
    backgroundColor: Theme.colors.surfaceCard,
    padding: Theme.spacing.xl,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: 20,
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
