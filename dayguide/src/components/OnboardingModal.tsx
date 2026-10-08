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
import { Sparkles, Briefcase, GraduationCap, Compass, Bell, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (archetype: 'freelancer' | 'student' | 'balanced', wakeTime: string, sleepTime: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onComplete,
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState<'freelancer' | 'student' | 'balanced'>('freelancer');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          <Text style={styles.heroTitle}>Welcome to DayGuide</Text>
          <Text style={styles.heroSubtitle}>
            Your personal routine coach. Let's build your ideal daily structure in 10 seconds.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Section 1: Archetypes */}
          <Text style={styles.sectionTitle}>Choose Your Daily Archetype</Text>

          <TouchableOpacity
            style={[
              styles.archetypeCard,
              selectedArchetype === 'freelancer' && styles.archetypeCardActive,
            ]}
            onPress={() => setSelectedArchetype('freelancer')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <Briefcase size={22} color={Theme.colors.primaryLight} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Freelancer & Creator</Text>
              <Text style={styles.cardDesc}>
                Structured deep-work sprints, client communication blocks, gym, and evening wind-down.
              </Text>
            </View>
            {selectedArchetype === 'freelancer' && (
              <View style={styles.activeCheck}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.archetypeCard,
              selectedArchetype === 'student' && styles.archetypeCardActive,
            ]}
            onPress={() => setSelectedArchetype('student')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <GraduationCap size={22} color={Theme.colors.accent} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Student & Academic</Text>
              <Text style={styles.cardDesc}>
                Lecture periods, dedicated study & revision blocks, fitness breaks, and balanced rest.
              </Text>
            </View>
            {selectedArchetype === 'student' && (
              <View style={styles.activeCheck}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.archetypeCard,
              selectedArchetype === 'balanced' && styles.archetypeCardActive,
            ]}
            onPress={() => setSelectedArchetype('balanced')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Compass size={22} color={Theme.colors.success} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Balanced Rhythm</Text>
              <Text style={styles.cardDesc}>
                Balanced workday, meal anchors, evening learning/devotion, and disciplined sleep.
              </Text>
            </View>
            {selectedArchetype === 'balanced' && (
              <View style={styles.activeCheck}>
                <Check size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Core Anchors */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Daily Anchors</Text>
          <View style={styles.anchorsRow}>
            <View style={styles.anchorBox}>
              <Text style={styles.anchorLabel}>Target Wake Up</Text>
              <Text style={styles.anchorTime}>07:00 AM</Text>
            </View>
            <View style={styles.anchorBox}>
              <Text style={styles.anchorLabel}>Target Sleep</Text>
              <Text style={styles.anchorTime}>11:00 PM</Text>
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
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  heroTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  scroll: {
    paddingBottom: 24,
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
    marginBottom: 12,
  },
  archetypeCardActive: {
    borderColor: Theme.colors.primaryLight,
    backgroundColor: Theme.colors.surfaceElevated,
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
  cardTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
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
  anchorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  anchorBox: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceCard,
    padding: 14,
    borderRadius: Theme.radii.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  anchorLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  anchorTime: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    paddingVertical: Theme.spacing.lg,
  },
  ctaBtn: {
    height: 52,
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
    fontSize: 16,
    fontWeight: '800',
  },
});
