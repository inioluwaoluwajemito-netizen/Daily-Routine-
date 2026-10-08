import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { TimeBlock, Category } from '../types';
import { Theme } from '../theme/theme';
import { NowHeroCard } from '../components/NowHeroCard';
import { NextPreviewCard } from '../components/NextPreviewCard';
import { ProgressMeter } from '../components/ProgressMeter';
import { TimelineItem } from '../components/TimelineItem';
import { calculateDayProgress, quickSnoozeBlock } from '../services/scheduleService';
import { Plus, RotateCcw } from 'lucide-react-native';
import { format } from 'date-fns';

interface TodayScreenProps {
  blocks: TimeBlock[];
  categories: Category[];
  onCompleteBlock: (block: TimeBlock) => void;
  onSnoozeBlock: (block: TimeBlock) => void;
  onSkipBlock: (block: TimeBlock) => void;
  onToggleStatus: (block: TimeBlock) => void;
  onAddBlockPress: () => void;
  onBlockPress: (block: TimeBlock) => void;
  onRefresh: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  blocks,
  categories,
  onCompleteBlock,
  onSnoozeBlock,
  onSkipBlock,
  onToggleStatus,
  onAddBlockPress,
  onBlockPress,
  onRefresh,
}) => {
  const [nowDate, setNowDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh countdown every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const progress = calculateDayProgress(blocks, nowDate);
  const categoryColorMap = new Map(categories.map((c) => [c.id, c.color]));

  const getGreeting = () => {
    const hours = nowDate.getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handlePullRefresh = () => {
    setRefreshing(true);
    setNowDate(new Date());
    onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullRefresh}
            tintColor={Theme.colors.primary}
          />
        }
      >
        {/* Header Title & Date */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.dateText}>{format(nowDate, 'EEEE, MMMM d')}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={onAddBlockPress}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Progress Dial / Rhythm Meter */}
        <ProgressMeter
          progressPercentage={progress.progressPercentage}
          completedCount={progress.completedBlocksCount}
          totalCount={progress.totalBlocksToday}
        />

        {/* Hero "NOW" Card */}
        <NowHeroCard
          block={progress.nowBlock}
          minutesRemaining={progress.minutesRemainingInNow}
          onComplete={onCompleteBlock}
          onSnooze={onSnoozeBlock}
          onSkip={onSkipBlock}
        />

        {/* "NEXT" Upcoming Block Preview */}
        <NextPreviewCard block={progress.nextBlock} />

        {/* Remaining Day Chronological List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Text style={styles.sectionBadge}>{blocks.length} blocks</Text>
        </View>

        {blocks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No routine blocks scheduled for today.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onAddBlockPress}>
              <Text style={styles.emptyBtnText}>Add First Block</Text>
            </TouchableOpacity>
          </View>
        ) : (
          blocks.map((block) => (
            <TimelineItem
              key={block.id}
              block={block}
              categoryColor={categoryColorMap.get(block.categoryId)}
              onPress={() => onBlockPress(block)}
              onToggleStatus={() => onToggleStatus(block)}
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
  scrollContent: {
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
  greetingText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateText: {
    color: Theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: 10,
  },
  sectionTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionBadge: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Theme.colors.surfaceCard,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginVertical: Theme.spacing.md,
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  emptyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radii.md,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
