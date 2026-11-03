import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { TimeBlock, Category, Priority } from '../types';
import { Theme } from '../theme/theme';
import { X, Trash2, Check, Bell, Calendar as CalendarIcon, Clock } from 'lucide-react-native';

interface BlockModalProps {
  visible: boolean;
  block: TimeBlock | null;
  categories: Category[];
  onClose: () => void;
  onSave: (blockData: Omit<TimeBlock, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
}

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const REMINDER_OPTIONS = [30, 20, 10, 5];
const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export const BlockModal: React.FC<BlockModalProps> = ({
  visible,
  block,
  categories,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('work');
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isFixed, setIsFixed] = useState(false);
  const [priority, setPriority] = useState<Priority>('P1');
  const [reminders, setReminders] = useState<number[]>([30, 20, 10, 5]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setCategoryId(block.categoryId);
      setStartTime(block.startTime || '09:00');
      setDurationMinutes(String(block.durationMinutes || 60));
      setDaysOfWeek(
        Array.isArray(block.daysOfWeek) && block.daysOfWeek.length > 0
          ? block.daysOfWeek
          : [0, 1, 2, 3, 4, 5, 6]
      );
      setIsFixed(Boolean(block.isFixed));
      setPriority(block.priority || 'P1');
      setReminders(
        Array.isArray(block.reminders) && block.reminders.length > 0
          ? block.reminders
          : [30, 20, 10, 5]
      );
      setNotes(block.notes || '');
    } else {
      setTitle('');
      setCategoryId(categories[0]?.id || 'work');
      setStartTime('09:00');
      setDurationMinutes('60');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      setIsFixed(false);
      setPriority('P1');
      setReminders([30, 20, 10, 5]); // All on by default for new routines
      setNotes('');
    }
  }, [block, visible, categories]);

  // Calculate calculated end time for display
  const calculateEndTime = (start: string, duration: number): string => {
    const [h = 9, m = 0] = start.split(':').map(Number);
    const safeH = Number.isNaN(h) ? 9 : h;
    const safeM = Number.isNaN(m) ? 0 : m;
    const totalMinutes = safeH * 60 + safeM + duration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const parsedDuration = parseInt(durationMinutes, 10) || 60;
  const calculatedEndTime = calculateEndTime(startTime, parsedDuration);

  // Toggle day of week
  const handleToggleDay = (dayValue: number) => {
    if (daysOfWeek.includes(dayValue)) {
      if (daysOfWeek.length === 1) return; // Keep at least one day
      setDaysOfWeek(daysOfWeek.filter((d) => d !== dayValue));
    } else {
      setDaysOfWeek([...daysOfWeek, dayValue].sort((a, b) => a - b));
    }
  };

  // Toggle reminder lead minutes
  const handleToggleReminder = (minutes: number) => {
    if (reminders.includes(minutes)) {
      setReminders(reminders.filter((m) => m !== minutes));
    } else {
      setReminders([...reminders, minutes].sort((a, b) => b - a));
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    try {
      const [startH = 9, startM = 0] = (startTime || '09:00').split(':').map(Number);
      const safeStartH = Math.min(23, Math.max(0, Number.isNaN(startH) ? 9 : startH));
      const safeStartM = Math.min(59, Math.max(0, Number.isNaN(startM) ? 0 : startM));
      const validDuration = Math.max(5, parsedDuration);

      const formattedStart = `${safeStartH.toString().padStart(2, '0')}:${safeStartM.toString().padStart(2, '0')}`;
      const formattedEnd = calculateEndTime(formattedStart, validDuration);

      const data: Omit<TimeBlock, 'id'> = {
        title: title.trim(),
        categoryId: categoryId || 'work',
        startTime: formattedStart,
        endTime: formattedEnd,
        durationMinutes: validDuration,
        isRecurring: true,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
        isFixed,
        priority: priority || 'P1',
        reminders,
        source: block ? (block.source || 'custom') : 'custom',
        notes: notes.trim(),
      };

      onSave(data, block?.id || undefined);
      onClose();
    } catch (err) {
      console.error('Error saving routine block:', err);
      onClose();
    }
  };

  const handleDelete = () => {
    if (!block || !onDelete) return;

    Alert.alert(
      'Delete Routine Block',
      `Are you sure you want to remove "${block.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(block.id);
            onClose();
          },
        },
      ]
    );
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
            <Text style={styles.headerTitle}>
              {block ? 'Edit Routine Block' : 'New Routine Block'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Title Input */}
            <Text style={styles.label}>Activity / Routine Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Morning Prayer, Deep Work, Gym..."
              placeholderTextColor={Theme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Category Selector */}
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

            {/* Start Time & Duration */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Start Time (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor={Theme.colors.textMuted}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor={Theme.colors.textMuted}
                />
              </View>
            </View>

            {/* Quick Duration Presets & Calculated End Time */}
            <View style={styles.timePreviewRow}>
              <View style={styles.presetsRow}>
                {DURATION_PRESETS.map((mins) => {
                  const isSelected = parsedDuration === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      onPress={() => setDurationMinutes(String(mins))}
                    >
                      <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
                        {mins}m
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.calculatedEndText}>Ends at {calculatedEndTime}</Text>
            </View>

            {/* Repeat Days (Sun-Sat) */}
            <Text style={styles.label}>Repeat Days (Sun - Sat)</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = daysOfWeek.includes(d.value);
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                    onPress={() => handleToggleDay(d.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayBtnText, isSelected && styles.dayBtnTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Priority Selector */}
            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {(['P0', 'P1', 'P2'] as Priority[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityBtn, isSelected && styles.priorityBtnActive]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[styles.priorityBtnText, isSelected && styles.priorityBtnTextActive]}
                    >
                      {p === 'P0' ? 'P0 (Critical)' : p === 'P1' ? 'P1 (Standard)' : 'P2 (Flexible)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Reminder Toggles (30, 20, 10, 5 minutes before) */}
            <Text style={styles.label}>Reminders Before Routine</Text>
            <View style={styles.remindersGrid}>
              {REMINDER_OPTIONS.map((mins) => {
                const isChecked = reminders.includes(mins);
                return (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.reminderPill, isChecked && styles.reminderPillActive]}
                    onPress={() => handleToggleReminder(mins)}
                    activeOpacity={0.7}
                  >
                    <Bell
                      size={14}
                      color={isChecked ? Theme.colors.primaryLight : Theme.colors.textMuted}
                    />
                    <Text
                      style={[styles.reminderPillText, isChecked && styles.reminderPillTextActive]}
                    >
                      {mins} mins before
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fixed Anchor Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setIsFixed(!isFixed)}
              activeOpacity={0.8}
            >
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Fixed Time Anchor</Text>
                <Text style={styles.toggleSub}>
                  Locked in place. Cannot be shifted during re-planning.
                </Text>
              </View>
              <View style={[styles.toggleSwitch, isFixed && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, isFixed && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            {/* Notes Input */}
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any details or preparation steps..."
              placeholderTextColor={Theme.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            {block && onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Trash2 size={20} color={Theme.colors.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
              activeOpacity={0.8}
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Routine</Text>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    paddingBottom: Theme.spacing.xl,
  },
  label: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
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
    height: 70,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 4,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  timePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radii.sm,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  presetChipActive: {
    borderColor: Theme.colors.primaryLight,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  presetText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  presetTextActive: {
    color: Theme.colors.primaryLight,
    fontWeight: '700',
  },
  calculatedEndText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: Theme.colors.primaryLight,
  },
  dayBtnText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  dayBtnTextActive: {
    color: Theme.colors.primaryLight,
    fontWeight: '800',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  priorityBtnActive: {
    borderColor: Theme.colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  priorityBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBtnTextActive: {
    color: Theme.colors.warning,
    fontWeight: '700',
  },
  remindersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  reminderPillActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: Theme.colors.primaryLight,
  },
  reminderPillText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  reminderPillTextActive: {
    color: Theme.colors.primaryLight,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.border,
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: Theme.colors.accent,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: Theme.spacing.md,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: Theme.radii.md,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
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
