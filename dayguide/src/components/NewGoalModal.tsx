import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Category, MonthlyGoal, GoalMilestone } from '../types';
import { Theme } from '../theme/theme';
import { X, Check, Sparkles, Layers } from 'lucide-react-native';

interface NewGoalModalProps {
  visible: boolean;
  categories: Category[];
  currentMonth: string; // "YYYY-MM"
  onClose: () => void;
  onSave: (
    goalData: Omit<MonthlyGoal, 'id' | 'milestones'>,
    milestones: Omit<GoalMilestone, 'id' | 'goalId'>[]
  ) => void;
}

export const NewGoalModal: React.FC<NewGoalModalProps> = ({
  visible,
  categories,
  currentMonth,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('work');
  const [notes, setNotes] = useState('');

  // 4-week structured milestones
  const [w1, setW1] = useState('');
  const [w2, setW2] = useState('');
  const [w3, setW3] = useState('');
  const [w4, setW4] = useState('');

  // Auto-generate suggested breakdown when user types title
  const handleAutoSuggest = () => {
    if (!title.trim()) return;
    setW1(`Week 1: Foundation, research & initial setup for ${title}`);
    setW2(`Week 2: Deep work & 50% progress on ${title}`);
    setW3(`Week 3: Advanced implementation & review for ${title}`);
    setW4(`Week 4: Final wrap-up, polish & retrospective`);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const milestones: Omit<GoalMilestone, 'id' | 'goalId'>[] = [
      {
        title: w1.trim() || 'Week 1: Planning and kickoff',
        weekNumber: 1,
        isCompleted: false,
      },
      {
        title: w2.trim() || 'Week 2: Core execution sprint',
        weekNumber: 2,
        isCompleted: false,
      },
      {
        title: w3.trim() || 'Week 3: Iteration and deep focus',
        weekNumber: 3,
        isCompleted: false,
      },
      {
        title: w4.trim() || 'Week 4: Completion and review',
        weekNumber: 4,
        isCompleted: false,
      },
    ];

    onSave(
      {
        title: title.trim(),
        categoryId,
        month: currentMonth,
        targetMetricValue: 4,
        currentMetricValue: 0,
        unit: 'milestones',
        status: 'in_progress',
        notes: notes.trim(),
      },
      milestones
    );

    // Reset
    setTitle('');
    setNotes('');
    setW1('');
    setW2('');
    setW3('');
    setW4('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>New Monthly Goal</Text>
              <Text style={styles.headerSubtitle}>
                Define your target and break it into 4 weekly action steps.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Goal Title */}
            <Text style={styles.label}>Goal Title / Target Outcome</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Launch Portfolio Website, Run 40km, Learn TypeScript..."
              placeholderTextColor={Theme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && { color: '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Auto Suggest Breakdown Helper */}
            <View style={styles.breakdownHeaderRow}>
              <View style={styles.breakdownTitleRow}>
                <Layers size={16} color={Theme.colors.accent} />
                <Text style={styles.breakdownTitle}>4-Week Monthly Breakdown</Text>
              </View>
              {title.trim().length > 0 && (
                <TouchableOpacity style={styles.suggestBtn} onPress={handleAutoSuggest}>
                  <Sparkles size={12} color={Theme.colors.primaryLight} />
                  <Text style={styles.suggestBtnText}>Auto Suggest</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Week 1 */}
            <Text style={styles.weekLabel}>Week 1 Milestone</Text>
            <TextInput
              style={styles.milestoneInput}
              placeholder="e.g. Outline chapters, buy books, setup repository..."
              placeholderTextColor={Theme.colors.textMuted}
              value={w1}
              onChangeText={setW1}
            />

            {/* Week 2 */}
            <Text style={styles.weekLabel}>Week 2 Milestone</Text>
            <TextInput
              style={styles.milestoneInput}
              placeholder="e.g. Build foundation, complete first 40%..."
              placeholderTextColor={Theme.colors.textMuted}
              value={w2}
              onChangeText={setW2}
            />

            {/* Week 3 */}
            <Text style={styles.weekLabel}>Week 3 Milestone</Text>
            <TextInput
              style={styles.milestoneInput}
              placeholder="e.g. Heavy execution sprint, reach 80% mark..."
              placeholderTextColor={Theme.colors.textMuted}
              value={w3}
              onChangeText={setW3}
            />

            {/* Week 4 */}
            <Text style={styles.weekLabel}>Week 4 Milestone</Text>
            <TextInput
              style={styles.milestoneInput}
              placeholder="e.g. Final review, polish, retro & ship..."
              placeholderTextColor={Theme.colors.textMuted}
              value={w4}
              onChangeText={setW4}
            />

            {/* Notes */}
            <Text style={styles.label}>Notes & Motivation (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Why this matters, key habits required..."
              placeholderTextColor={Theme.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Create Monthly Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.colors.surfaceElevated,
    borderTopLeftRadius: Theme.radii.xl,
    borderTopRightRadius: Theme.radii.xl,
    paddingTop: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    paddingBottom: Theme.spacing.xl,
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    color: Theme.colors.textPrimary,
    fontSize: 15,
  },
  notesInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radii.pill,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 8,
  },
  chipText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  breakdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownTitle: {
    color: Theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.pill,
  },
  suggestBtnText: {
    color: Theme.colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  weekLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  milestoneInput: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.colors.textPrimary,
    fontSize: 13,
  },
  footer: {
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  saveBtn: {
    height: 48,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
