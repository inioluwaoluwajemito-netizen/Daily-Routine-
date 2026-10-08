import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/theme';
import { Award, Zap } from 'lucide-react-native';

interface ProgressMeterProps {
  progressPercentage: number;
  completedCount: number;
  totalCount: number;
}

export const ProgressMeter: React.FC<ProgressMeterProps> = ({
  progressPercentage,
  completedCount,
  totalCount,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.iconTag}>
          <Zap size={14} color={Theme.colors.primaryLight} />
          <Text style={styles.label}>Today's Rhythm</Text>
        </View>
        <Text style={styles.counterText}>
          {completedCount} of {totalCount} completed ({progressPercentage}%)
        </Text>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, Math.max(0, progressPercentage))}%` },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surfaceCard,
    padding: Theme.spacing.md,
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  counterText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  fill: {
    height: '100%',
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.radii.pill,
  },
});
