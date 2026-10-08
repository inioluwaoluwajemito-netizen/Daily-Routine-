import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TimeBlock } from '../types';
import { Theme } from '../theme/theme';
import { formatTimeDisplay } from '../services/scheduleService';
import { ArrowRight, Calendar } from 'lucide-react-native';

interface NextPreviewCardProps {
  block: TimeBlock | null;
}

export const NextPreviewCard: React.FC<NextPreviewCardProps> = ({ block }) => {
  if (!block) return null;

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>UP NEXT</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {block.title}
        </Text>
        <Text style={styles.timeText}>
          {formatTimeDisplay(block.startTime)} – {formatTimeDisplay(block.endTime)}
        </Text>
      </View>
      <View style={styles.arrowIcon}>
        <ArrowRight size={20} color={Theme.colors.accent} />
      </View>
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
    marginBottom: Theme.spacing.md,
  },
  leftCol: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.radii.pill,
    marginBottom: 4,
  },
  badgeText: {
    color: Theme.colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  timeText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  arrowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
