import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Theme } from '../theme/theme';
import { Sparkles, Heart, Briefcase, GraduationCap, Compass, Check, Sun, Moon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ArchetypeType } from '../types';

interface OnboardingModalProps {
  visible: boolean;
  userName?: string;
  onComplete: (archetype: 'prayer' | 'freelancer' | 'student' | 'balanced', wakeTime: string, sleepTime: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  userName,
  onComplete,
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState<'prayer' | 'freelancer' | 'student' | 'balanced'>('prayer');
  const [wakeTime, setWakeTime] = useState('05:30');
  const [sleepTime, setSleepTime] = useState('22:30');

  const handleSelectArchetype = (type: 'prayer' | 'freelancer' | 'student' | 'balanced') => {
    setSelectedArchetype(type);
    if (type === 'prayer') {
      setWakeTime('05:30');
      setSleepTime('22:30');
    } else if (type === 'freelancer') {
      setWakeTime('06:30');
      setSleepTime('23:00');
    } else if (type === 'student') {
      setWakeTime('06:00');
      setSleepTime('22:30');
    } else if (type === 'balanced') {
      setWakeTime('06:30');
      setSleepTime('22:30');
    }
  };

  const handleFinish = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    onComplete(selectedArchetype, wakeTime, sleepTime);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Sparkles size={24} color={Theme.colors.primaryLight} />
          </View>
          <Text style={styles.heroTitle}>Welcome{userName ? `, ${userName}` : ''} to DayGuide</Text>
          <Text style={styles.heroSubtitle}>
            Your personal routine & spiritual coach. Choose your core rhythm to build your proactive daily timetable.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Section 1: Archetypes */}
          <Text style={styles.sectionTitle}>Choose Your Daily Archetype</Text>

          {/* Option 1: Prayer Life & Spiritual Rhythm */}
          <TouchableOpacity
            style={[
              styles.archetypeCard,
              selectedArchetype === 'prayer' && styles.archetypeCardActivePrayer,
            ]}
            onPress={() => handleSelectArchetype('prayer')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.2)' }]}>
              <Heart size={22} color="#EC4899" />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.badgeRow}>
                <Text style={styles.cardTitle}>Spiritual Rhythm & Prayer Life</Text>
                <View style={styles.prayerBadge}>
                  <Text style={styles.prayerBadgeText}>Core Focus</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>
                Dedicated morning prayer watch, scripture meditation, midday prayer pause, evening fellowship, and night thanksgiving.
              </Text>
            </View>
            {selectedArchetype === 'prayer' && (
              <View style={[styles.activeCheck, { backgroundColor: '#EC4899' }]}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Option 2: Freelancer & Creator */}
          <TouchableOpacity
            style={[
              styles.archetypeCard,
              selectedArchetype === 'freelancer' && styles.archetypeCardActive,
            ]}
            onPress={() => handleSelectArchetype('freelancer')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Briefcase size={22} color={Theme.colors.primaryLight} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Freelancer & Creator</Text>
              <Text style={styles.cardDesc}>
                Morning devotion, structured deep-work sprints, client communication blocks, workout, and evening wind-down.
              </Text>
            </View>
            {selectedArchetype === 'freelancer' && (
              <View style={styles.activeCheck}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Option 3: Student & Academic */}
          <TouchableOpacity
            style={[
              styles.archetypeCard,
              selectedArchetype === 'student' && styles.archetypeCardActive,
            ]}
            onPress={() => handleSelectArchetype('student')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <GraduationCap size={22} color={Theme.colors.accent} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Student & Academic</Text>
              <Text style={styles.cardDesc}>
                Morning prayer, lecture sessions, revision/study blocks, physical recreation, and disciplined rest.
              </Text>
            </View>
            {selectedArchetype === 'student' && (
              <View style={styles.activeCheck}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Option 4: Balanced Rhythm */}
          <TouchableOpacity
            style={[
              styles.archetypeCard,
              selectedArchetype === 'balanced' && styles.archetypeCardActive,
            ]}
            onPress={() => handleSelectArchetype('balanced')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Compass size={22} color={Theme.colors.success} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Balanced Rhythm</Text>
              <Text style={styles.cardDesc}>
                Morning prayer & devotion, productive workday, meal pauses, evening family fellowship, and peaceful sleep.
              </Text>
            </View>
            {selectedArchetype === 'balanced' && (
              <View style={styles.activeCheck}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Spiritual Highlight Callout */}
          <View style={styles.spiritualNotice}>
            <Text style={styles.spiritualNoticeText}>
              🕊️ <Text style={{ fontWeight: '700', color: '#FDF2F8' }}>Prayer & Devotion Included:</Text> Every archetype is pre-configured with morning and evening prayer anchors so your spiritual walk stays consistent.
            </Text>
          </View>

          {/* Core Anchors */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Daily Anchors for Selected Rhythm</Text>
          <View style={styles.anchorsRow}>
            <View style={styles.anchorBox}>
              <View style={styles.anchorHeaderRow}>
                <Sun size={14} color={Theme.colors.warning} />
                <Text style={styles.anchorLabel}>Target Wake Up</Text>
              </View>
              <Text style={styles.anchorTime}>{wakeTime} AM</Text>
            </View>
            <View style={styles.anchorBox}>
              <View style={styles.anchorHeaderRow}>
                <Moon size={14} color={Theme.colors.purple} />
                <Text style={styles.anchorLabel}>Target Bedtime</Text>
              </View>
              <Text style={styles.anchorTime}>{sleepTime} PM</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.ctaBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.ctaBtnText}>Generate My Daily Routine</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  heroTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  scroll: {
    paddingBottom: 20,
  },
  sectionTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  archetypeCard: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  archetypeCardActive: {
    borderColor: Theme.colors.primaryLight,
    backgroundColor: Theme.colors.surfaceElevated,
  },
  archetypeCardActivePrayer: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  prayerBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  prayerBadgeText: {
    color: '#F472B6',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDesc: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  activeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  spiritualNotice: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    borderWidth: 1,
    borderRadius: Theme.radii.md,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  spiritualNoticeText: {
    color: '#FBCFE8',
    fontSize: 12,
    lineHeight: 17,
  },
  anchorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  anchorBox: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceCard,
    padding: 12,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  anchorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  anchorLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  anchorTime: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    paddingVertical: Theme.spacing.md,
  },
  ctaBtn: {
    height: 50,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
