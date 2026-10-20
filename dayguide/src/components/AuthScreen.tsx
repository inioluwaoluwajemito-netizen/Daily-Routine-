import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Theme } from '../theme/theme';
import { UserAccount } from '../types';
import { getUsers, loginUser, registerUser } from '../db/queries';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, Shield, Heart } from 'lucide-react-native';

interface AuthScreenProps {
  onAuthSuccess: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [existingUsers, setExistingUsers] = useState<UserAccount[]>([]);

  useEffect(() => {
    try {
      const users = getUsers();
      setExistingUsers(users);
      if (users.length > 0 && !loginEmail) {
        setLoginEmail(users[0].email);
        setLoginPassword(users[0].password || 'password123');
      }
    } catch {}
  }, []);

  const handleLogin = () => {
    setErrorMsg(null);
    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email or username.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    try {
      const user = loginUser(loginEmail.trim(), loginPassword);
      onAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    }
  };

  const handleRegister = () => {
    setErrorMsg(null);
    if (!regName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Please enter your email or username.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const newUser = registerUser(regName.trim(), regEmail.trim(), regPassword);
      onAuthSuccess(newUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. User may already exist.');
    }
  };

  const handleQuickDemo = () => {
    try {
      const users = getUsers();
      if (users.length > 0) {
        const user = loginUser(users[0].email, users[0].password || 'password123');
        onAuthSuccess(user);
      } else {
        const demo = registerUser('Demo User', 'demo@dayguide.com', 'password123');
        onAuthSuccess(demo);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSelectExistingUser = (u: UserAccount) => {
    setLoginEmail(u.email);
    setLoginPassword(u.password || '');
    setErrorMsg(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo and App Title */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Sparkles size={28} color={Theme.colors.primaryLight} />
          </View>
          <Text style={styles.appTitle}>DayGuide</Text>
          <Text style={styles.appSubtitle}>
            Intelligent Daily Routine, Prayer Life & Time Coach
          </Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          {/* Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
              onPress={() => {
                setTab('login');
                setErrorMsg(null);
              }}
              activeOpacity={0.8}
            >
              <LogIn size={16} color={tab === 'login' ? Theme.colors.primaryLight : Theme.colors.textMuted} />
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}
              onPress={() => {
                setTab('register');
                setErrorMsg(null);
              }}
              activeOpacity={0.8}
            >
              <UserPlus size={16} color={tab === 'register' ? Theme.colors.primaryLight : Theme.colors.textMuted} />
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Banner */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Form Content */}
          {tab === 'login' ? (
            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Email or Username</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color={Theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. user@dayguide.com"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color={Theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Theme.colors.textMuted} />
                  ) : (
                    <Eye size={18} color={Theme.colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Sign In to DayGuide</Text>
              </TouchableOpacity>

              {/* Quick Demo Button */}
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={handleQuickDemo}
                activeOpacity={0.85}
              >
                <Text style={styles.demoBtnText}>⚡ Quick 1-Tap Sign In (Demo)</Text>
              </TouchableOpacity>

              {/* Existing Users list on this device */}
              {existingUsers.length > 0 && (
                <View style={styles.existingAccountsBox}>
                  <Text style={styles.existingAccountsLabel}>Saved Profiles on this Device:</Text>
                  <View style={styles.accountChipsRow}>
                    {existingUsers.map((u) => (
                      <TouchableOpacity
                        key={u.id}
                        style={[
                          styles.accountChip,
                          loginEmail === u.email && styles.accountChipActive,
                        ]}
                        onPress={() => handleSelectExistingUser(u)}
                      >
                        <View style={[styles.chipAvatar, { backgroundColor: u.avatarColor || '#6366F1' }]}>
                          <Text style={styles.chipAvatarText}>
                            {u.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.chipName}>{u.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Your Full Name</Text>
              <View style={styles.inputRow}>
                <User size={18} color={Theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Inioluwa"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={regName}
                  onChangeText={setRegName}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email or Username</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color={Theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. inio@routine.com"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={regEmail}
                  onChangeText={setRegEmail}
                  autoCapitalize="none"
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Create Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color={Theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="At least 4 characters"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Theme.colors.textMuted} />
                  ) : (
                    <Eye size={18} color={Theme.colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color={Theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter password"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={regConfirmPassword}
                  onChangeText={setRegConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleRegister}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Create Account & Start</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Heart size={16} color="#EC4899" />
            <Text style={styles.featureText}>Dedicated Prayer Life</Text>
          </View>
          <View style={styles.featureItem}>
            <Shield size={16} color={Theme.colors.success} />
            <Text style={styles.featureText}>100% Private & Offline</Text>
          </View>
          <View style={styles.featureItem}>
            <User size={16} color={Theme.colors.accent} />
            <Text style={styles.featureText}>Multi-User Profiles</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: Theme.radii.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.md,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Theme.radii.sm,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  tabText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Theme.colors.textPrimary,
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Theme.colors.danger,
    borderRadius: Theme.radii.md,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  fieldLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: 14,
    outlineStyle: 'none' as any,
  },
  eyeBtn: {
    padding: 4,
  },
  submitBtn: {
    height: 48,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  demoBtn: {
    height: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: Theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    color: Theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  existingAccountsBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  existingAccountsLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  accountChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 6,
  },
  accountChipActive: {
    borderColor: Theme.colors.primaryLight,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  chipName: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 28,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
