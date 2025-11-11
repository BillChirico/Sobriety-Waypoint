import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Share, Switch, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Heart, Calendar, Share2, QrCode, Bell, Moon, Sun, Monitor } from 'lucide-react-native';

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    tasks: profile?.notification_preferences?.tasks ?? true,
    messages: profile?.notification_preferences?.messages ?? true,
    milestones: profile?.notification_preferences?.milestones ?? true,
    daily: profile?.notification_preferences?.daily ?? true,
  });

  const getDaysSober = () => {
    if (!profile?.sobriety_date) return 0;
    const sobrietyDate = new Date(profile.sobriety_date);
    const today = new Date();
    const diff = today.getTime() - sobrietyDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const generateInviteCode = async () => {
    if (!profile) return;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase.from('invite_codes').insert({
      code,
      sponsor_id: profile.id,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      if (Platform.OS === 'web') {
        window.alert('Error: Failed to generate invite code');
      } else {
        Alert.alert('Error', 'Failed to generate invite code');
      }
    } else {
      if (Platform.OS === 'web') {
        const shouldShare = window.confirm(`Your invite code is: ${code}\n\nShare this with your sponsee to connect.\n\nClick OK to copy to clipboard.`);
        if (shouldShare) {
          navigator.clipboard.writeText(code);
          window.alert('Invite code copied to clipboard!');
        }
      } else {
        Alert.alert(
          'Invite Code Generated',
          `Your invite code is: ${code}\n\nShare this with your sponsee to connect.`,
          [
            {
              text: 'Share',
              onPress: () => Share.share({ message: `Join me on 12-Step Tracker! Use invite code: ${code}` }),
            },
            { text: 'OK' },
          ]
        );
      }
    }
  };

  const joinWithInviteCode = async () => {
    if (!inviteCode.trim() || !profile) return;

    const { data: invite, error: fetchError } = await supabase
      .from('invite_codes')
      .select('*, sponsor:sponsor_id(*)')
      .eq('code', inviteCode.trim().toUpperCase())
      .maybeSingle();

    if (fetchError || !invite) {
      Alert.alert('Error', 'Invalid or expired invite code');
      return;
    }

    if (new Date(invite.expires_at) < new Date()) {
      Alert.alert('Error', 'This invite code has expired');
      return;
    }

    if (invite.used_by) {
      Alert.alert('Error', 'This invite code has already been used');
      return;
    }

    const { error: relationshipError } = await supabase.from('sponsor_sponsee_relationships').insert({
      sponsor_id: invite.sponsor_id,
      sponsee_id: profile.id,
      status: 'active',
    });

    if (relationshipError) {
      Alert.alert('Error', 'Failed to connect with sponsor');
      return;
    }

    const { error: updateError } = await supabase
      .from('invite_codes')
      .update({ used_by: profile.id, used_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (!updateError) {
      Alert.alert('Success', `Connected with ${invite.sponsor?.first_name} ${invite.sponsor?.last_initial}.!`);
      setShowInviteInput(false);
      setInviteCode('');
    }
  };

  const updateNotificationSetting = async (key: string, value: boolean) => {
    if (!profile) return;

    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: newSettings })
      .eq('id', profile.id);

    if (error) {
      Alert.alert('Error', 'Failed to update notification settings');
      setNotificationSettings(notificationSettings);
    } else {
      await refreshProfile();
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        try {
          await signOut();
        } catch (error: any) {
          window.alert('Error signing out: ' + error.message);
        }
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out: ' + error.message);
            }
          },
        },
      ]);
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.first_name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{profile?.first_name} {profile?.last_initial}.</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {profile?.role === 'both' ? 'SPONSOR & SPONSEE' : profile?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.sobrietyCard}>
        <View style={styles.sobrietyHeader}>
          <Heart size={24} color={theme.primary} fill={theme.primary} />
          <Text style={styles.sobrietyTitle}>Sobriety Journey</Text>
        </View>
        <Text style={styles.daysSober}>{getDaysSober()} Days</Text>
        <Text style={styles.sobrietyDate}>
          Since {new Date(profile?.sobriety_date || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>

      {(profile?.role === 'sponsor' || profile?.role === 'both') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sponsor Tools</Text>
          <TouchableOpacity style={styles.actionButton} onPress={generateInviteCode}>
            <Share2 size={20} color={theme.primary} />
            <Text style={styles.actionButtonText}>Generate Invite Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {(profile?.role === 'sponsee' || profile?.role === 'both') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect with Sponsor</Text>
          {!showInviteInput ? (
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowInviteInput(true)}>
              <QrCode size={20} color={theme.primary} />
              <Text style={styles.actionButtonText}>Enter Invite Code</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inviteInputContainer}>
              <TextInput
                style={styles.inviteInput}
                placeholder="Enter invite code"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.inviteSubmitButton} onPress={joinWithInviteCode}>
                <Text style={styles.inviteSubmitText}>Connect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inviteCancelButton} onPress={() => setShowInviteInput(false)}>
                <Text style={styles.inviteCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Monitor size={20} color={theme.textSecondary} />
            <Text style={styles.settingLabel}>Appearance</Text>
          </View>

          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'light' && styles.themeOptionSelected]}
              onPress={() => setThemeMode('light')}
            >
              <Sun size={20} color={themeMode === 'light' ? theme.primary : theme.textSecondary} />
              <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextSelected]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionSelected]}
              onPress={() => setThemeMode('dark')}
            >
              <Moon size={20} color={themeMode === 'dark' ? theme.primary : theme.textSecondary} />
              <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextSelected]}>
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'system' && styles.themeOptionSelected]}
              onPress={() => setThemeMode('system')}
            >
              <Monitor size={20} color={themeMode === 'system' ? theme.primary : theme.textSecondary} />
              <Text style={[styles.themeOptionText, themeMode === 'system' && styles.themeOptionTextSelected]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.settingsCard, { marginTop: 16 }]}>
          <View style={styles.settingRow}>
            <Bell size={20} color={theme.textSecondary} />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>

          <View style={styles.settingSubRow}>
            <Text style={styles.settingSubLabel}>Task assignments</Text>
            <Switch
              value={notificationSettings.tasks}
              onValueChange={(value) => updateNotificationSetting('tasks', value)}
              trackColor={{ false: '#d1d5db', true: '#80c0ff' }}
              thumbColor={notificationSettings.tasks ? theme.primary : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingSubRow}>
            <Text style={styles.settingSubLabel}>Messages</Text>
            <Switch
              value={notificationSettings.messages}
              onValueChange={(value) => updateNotificationSetting('messages', value)}
              trackColor={{ false: '#d1d5db', true: '#80c0ff' }}
              thumbColor={notificationSettings.messages ? theme.primary : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingSubRow}>
            <Text style={styles.settingSubLabel}>Milestones</Text>
            <Switch
              value={notificationSettings.milestones}
              onValueChange={(value) => updateNotificationSetting('milestones', value)}
              trackColor={{ false: '#d1d5db', true: '#80c0ff' }}
              thumbColor={notificationSettings.milestones ? theme.primary : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingSubRow}>
            <Text style={styles.settingSubLabel}>Daily reminders</Text>
            <Switch
              value={notificationSettings.daily}
              onValueChange={(value) => updateNotificationSetting('daily', value)}
              trackColor={{ false: '#d1d5db', true: '#80c0ff' }}
              thumbColor={notificationSettings.daily ? theme.primary : '#f3f4f6'}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>12-Step Tracker v1.0</Text>
        <Text style={styles.footerSubtext}>Supporting recovery, one day at a time</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.surface,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  sobrietyCard: {
    backgroundColor: theme.card,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sobrietyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sobrietyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  daysSober: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.primary,
  },
  sobrietyDate: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 12,
  },
  inviteInputContainer: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inviteInput: {
    backgroundColor: theme.borderLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: theme.text,
  },
  inviteSubmitButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  inviteCancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  inviteCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 14,
    color: theme.textTertiary,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 12,
  },
  settingSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingSubLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  themeOptionSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 6,
  },
  themeOptionTextSelected: {
    color: theme.primary,
  },
});
