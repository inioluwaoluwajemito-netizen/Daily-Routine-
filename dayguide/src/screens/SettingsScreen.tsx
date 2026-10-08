import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { UserProfile } from '../types';
import { Theme } from '../theme/theme';
import {
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  Download,
  RotateCcw,
  Sparkles,
  Smartphone,
} from 'lucide-react-native';
import { sendInstantTestNotification } from '../services/notificationService';
import { exportBackupJson } from '../db/queries';

interface SettingsScreenProps {
  profile: UserProfile | null;
  onResetToArchetype: (archetype: 'freelancer' | 'student' | 'balanced') => void;
  onOpenOnboarding: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  onResetToArchetype,
  onOpenOnboarding,
}) => {
  const handleTestNotification = async () => {
    await sendInstantTestNotification();
    Alert.alert('Notification Sent', 'A local routine reminder was triggered on your device.');
  };

  const handleExportBackup = async () => {
    try {
      const json = exportBackupJson();
      await Share.share({
        title: 'DayGuide Backup',
        message: json,
      });
    } catch (err) {
      Alert.alert('Export Error', 'Unable to share backup data.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Sparkles size={24} color={Theme.colors.primaryLight} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.name || 'Owner (You)'}</Text>
            <Text style={styles.profileSub}>
              Archetype: {profile?.archetype ? profile.archetype.toUpperCase() : 'FREELANCER'}
            </Text>
          </View>
        </View>

        {/* Section: Anchors */}
        <Text style={styles.sectionTitle}>Daily Anchors</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Sun size={18} color={Theme.colors.warning} />
              <Text style={styles.rowLabel}>Wake-up Target</Text>
            </View>
            <Text style={styles.rowValue}>{profile?.wakeTime || '07:00'} AM</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Moon size={18} color={Theme.colors.purple} />
              <Text style={styles.rowLabel}>Bedtime Target</Text>
            </View>
            <Text style={styles.rowValue}>{profile?.sleepTime || '23:00'} PM</Text>
          </View>
        </View>

        {/* Section: Smart Reminders */}
        <Text style={styles.sectionTitle}>Notifications & Exact Alarms</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.btnRow} onPress={handleTestNotification}>
            <View style={styles.rowLeft}>
              <Bell size={18} color={Theme.colors.primaryLight} />
              <View>
                <Text style={styles.rowLabel}>Trigger Test Notification</Text>
                <Text style={styles.rowSub}>Verify alarm permissions on phone</Text>
              </View>
            </View>
            <Text style={styles.linkText}>Test Now</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Templates & Reset */}
        <Text style={styles.sectionTitle}>Routines & Archetypes</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.btnRow}
            onPress={() => onResetToArchetype('freelancer')}
          >
            <Text style={styles.rowLabel}>Load Freelancer / Creator Template</Text>
            <RotateCcw size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.btnRow}
            onPress={() => onResetToArchetype('student')}
          >
            <Text style={styles.rowLabel}>Load Student / Academic Template</Text>
            <RotateCcw size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.btnRow}
            onPress={() => onResetToArchetype('balanced')}
          >
            <Text style={styles.rowLabel}>Load Balanced Routine Template</Text>
            <RotateCcw size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Privacy & Data */}
        <Text style={styles.sectionTitle}>Offline Storage & Backup</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <ShieldCheck size={18} color={Theme.colors.success} />
              <View>
                <Text style={styles.rowLabel}>100% Offline Local Database</Text>
                <Text style={styles.rowSub}>Stored on device (dayguide.db)</Text>
              </View>
            </View>
          </View>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.btnRow} onPress={handleExportBackup}>
            <View style={styles.rowLeft}>
              <Download size={18} color={Theme.colors.accent} />
              <Text style={styles.rowLabel}>Export Backup (JSON)</Text>
            </View>
            <Text style={styles.linkText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.infoFooter}>
          <Smartphone size={16} color={Theme.colors.textMuted} />
          <Text style={styles.footerText}>DayGuide v1.0 • Personal Android App</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: 16,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: Theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  profileSub: {
    color: Theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowLabel: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowSub: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rowValue: {
    color: Theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  linkText: {
    color: Theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
