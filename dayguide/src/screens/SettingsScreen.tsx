import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { UserProfile, UserAccount, ArchetypeType } from '../types';
import { Theme } from '../theme/theme';
import {
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  Download,
  RotateCcw,
  Sparkles,
  Heart,
  LogOut,
  User,
  Sliders,
} from 'lucide-react-native';
import { sendInstantTestNotification } from '../services/notificationService';
import { exportBackupJson } from '../db/queries';

interface SettingsScreenProps {
  profile: UserProfile | null;
  currentUser?: UserAccount | null;
  onResetToArchetype: (archetype: 'prayer' | 'freelancer' | 'student' | 'balanced') => void;
  onOpenOnboarding: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  currentUser,
  onResetToArchetype,
  onOpenOnboarding,
  onLogout,
}) => {
  const handleTestNotification = async () => {
    await sendInstantTestNotification();
    if (Platform.OS === 'web') {
      window.alert('Notification Sent: A local routine reminder was triggered.');
    } else {
      Alert.alert('Notification Sent', 'A local routine reminder was triggered on your device.');
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = exportBackupJson();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dayguide_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
      await Share.share({
        title: 'DayGuide Backup',
        message: json,
      });
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert('Unable to share backup data.');
      } else {
        Alert.alert('Export Error', 'Unable to share backup data.');
      }
    }
  };

  const handleConfirmLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Are you sure you want to log out of your DayGuide profile?')
        : true;
      if (confirmed) {
        onLogout();
      }
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to log out of your DayGuide profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  const formatAnchorTime = (timeStr?: string, defaultFallback: string = '05:30'): string => {
    const val = (timeStr || defaultFallback).trim();
    if (val.includes('AM') || val.includes('PM') || val.includes('am') || val.includes('pm')) {
      return val;
    }
    const [hStr, mStr = '00'] = val.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h)) return val;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const padM = (isNaN(m) ? 0 : m).toString().padStart(2, '0');
    return `${displayH}:${padM} ${period}`;
  };

  const archetypeDisplay = profile?.archetype === 'prayer'
    ? 'SPIRITUAL RHYTHM & PRAYER LIFE'
    : profile?.archetype === 'freelancer'
    ? 'FREELANCER & CREATOR'
    : profile?.archetype === 'student'
    ? 'STUDENT & ACADEMIC'
    : profile?.archetype === 'balanced'
    ? 'BALANCED RHYTHM'
    : (profile?.archetype ? profile.archetype.toUpperCase() : 'SPIRITUAL RHYTHM & PRAYER LIFE');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile & Account Header Card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: currentUser?.avatarColor || Theme.colors.primary }]}>
            <Text style={styles.avatarInitial}>
              {(currentUser?.name || profile?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.name || profile?.name || 'DayGuide User'}</Text>
            {currentUser?.email && (
              <Text style={styles.profileEmail}>{currentUser.email}</Text>
            )}
            <View style={styles.archetypeBadge}>
              <Text style={styles.archetypeBadgeText}>{archetypeDisplay}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleConfirmLogout}
            activeOpacity={0.7}
          >
            <LogOut size={16} color={Theme.colors.danger} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Anchors */}
        <Text style={styles.sectionTitle}>Daily Anchors</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Sun size={18} color={Theme.colors.warning} />
              <Text style={styles.rowLabel}>Wake-up Target</Text>
            </View>
            <Text style={styles.rowValue}>{formatAnchorTime(profile?.wakeTime, '05:30')}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Moon size={18} color={Theme.colors.purple} />
              <Text style={styles.rowLabel}>Bedtime Target</Text>
            </View>
            <Text style={styles.rowValue}>{formatAnchorTime(profile?.sleepTime, '22:30')}</Text>
          </View>
        </View>

        {/* Section: Routines & Archetypes */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Routines & Archetypes</Text>
          <TouchableOpacity onPress={onOpenOnboarding}>
            <Text style={styles.linkTextSmall}>Re-run Setup</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.btnRow}
            onPress={() => onResetToArchetype('prayer')}
          >
            <View style={styles.rowLeft}>
              <Heart size={18} color="#EC4899" />
              <View>
                <Text style={styles.rowLabel}>Spiritual Rhythm & Prayer Life</Text>
                <Text style={styles.rowSub}>Morning prayer watch, scripture, midday & night devotion</Text>
              </View>
            </View>
            <RotateCcw size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.btnRow}
            onPress={() => onResetToArchetype('freelancer')}
          >
            <View style={styles.rowLeft}>
              <RotateCcw size={18} color={Theme.colors.primaryLight} />
              <View>
                <Text style={styles.rowLabel}>Freelancer / Creator Template</Text>
                <Text style={styles.rowSub}>Deep work sprints, client check-ins, prayer & wind-down</Text>
              </View>
            </View>
            <RotateCcw size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.btnRow}
            onPress={() => onResetToArchetype('student')}
          >
            <View style={styles.rowLeft}>
              <RotateCcw size={18} color={Theme.colors.accent} />
              <View>
                <Text style={styles.rowLabel}>Student / Academic Template</Text>
                <Text style={styles.rowSub}>Lecture blocks, study slots, morning & night prayer</Text>
              </View>
            </View>
            <RotateCcw size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.btnRow}
            onPress={() => onResetToArchetype('balanced')}
          >
            <View style={styles.rowLeft}>
              <RotateCcw size={18} color={Theme.colors.success} />
              <View>
                <Text style={styles.rowLabel}>Balanced Routine Template</Text>
                <Text style={styles.rowSub}>9-to-5 structure, fitness, prayer and family time</Text>
              </View>
            </View>
            <RotateCcw size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section: Reminders & Alarms */}
        <Text style={styles.sectionTitle}>Notifications & Exact Alarms</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.btnRow} onPress={handleTestNotification}>
            <View style={styles.rowLeft}>
              <Bell size={18} color={Theme.colors.primaryLight} />
              <View>
                <Text style={styles.rowLabel}>Trigger Test Notification</Text>
                <Text style={styles.rowSub}>Verify alarm permissions on browser / phone</Text>
              </View>
            </View>
            <Text style={styles.linkText}>Test Now</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Privacy & Multi-User Data */}
        <Text style={styles.sectionTitle}>Privacy & Offline Security</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <ShieldCheck size={18} color={Theme.colors.success} />
              <View>
                <Text style={styles.rowLabel}>Isolated Multi-User Local Storage</Text>
                <Text style={styles.rowSub}>
                  Each account's schedule, prayer life, and habits remain strictly private.
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.btnRow} onPress={handleExportBackup}>
            <View style={styles.rowLeft}>
              <Download size={18} color={Theme.colors.textSecondary} />
              <Text style={styles.rowLabel}>Export Schedule Backup (JSON)</Text>
            </View>
            <Text style={styles.linkText}>Export</Text>
          </TouchableOpacity>
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
    paddingTop: Theme.spacing.lg,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: Theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  profileEmail: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  archetypeBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  archetypeBadgeText: {
    color: Theme.colors.primaryLight,
    fontSize: 9,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Theme.radii.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutBtnText: {
    color: Theme.colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginRight: 4,
  },
  linkTextSmall: {
    color: Theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
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
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  linkText: {
    color: Theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
