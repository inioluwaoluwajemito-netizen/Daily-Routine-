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
} from 'react-native';
import { TimeBlock, Category, Priority } from '../types';
import { Theme } from '../theme/theme';
import { X, Trash2, Check, Clock, AlertTriangle } from 'lucide-react-native';

interface BlockModalProps {
  visible: boolean;
  block: TimeBlock | null;
  categories: Category[];
  onClose: () => void;
  onSave: (blockData: Omit<TimeBlock, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
}

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
  const [endTime, setEndTime] = useState('10:00');
  const [isFixed, setIsFixed] = useState(false);
  const [priority, setPriority] = useState<Priority>('P1');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setCategoryId(block.categoryId);
      setStartTime(block.startTime);
      setEndTime(block.endTime);
      setIsFixed(block.isFixed);
      setPriority(block.priority);
      setNotes(block.notes || '');
      setIsRecurring(block.isRecurring);
    } else {
      setTitle('');
      setCategoryId(categories[0]?.id || 'work');
      setStartTime('09:00');
      setEndTime('10:00');
      setIsFixed(false);
      setPriority('P1');
      setNotes('');
      setIsRecurring(true);
    }
  }, [block, visible]);

  const handleSave = () => {
    if (!title.trim()) return;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = Math.max(15, (endH * 60 + endM) - (startH * 60 + startM));

    const data: Omit<TimeBlock, 'id'> = {
      title: title.trim(),
      categoryId,
      startTime,
      endTime,
      durationMinutes,
      isRecurring,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      isFixed,
      priority,
      notes: notes.trim(),
    };

    onSave(data, block?.id);
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
            <Text style={styles.headerTitle}>
              {block ? 'Edit Routine Block' : 'New Routine Block'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={22} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Title Input */}
            <Text style={styles.label}>Activity / Block Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Deep Work, Gym, Reading..."
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

            {/* Time Pickers (HH:mm) */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Start Time (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                  placeholderTextColor={Theme.colors.textMuted}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>End Time (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="09:00"
                  placeholderTextColor={Theme.colors.textMuted}
                />
              </View>
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
                onPress={() => {
                  onDelete(block.id);
                  onClose();
                }}
              >
                <Trash2 size={20} color={Theme.colors.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Block</Text>
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
