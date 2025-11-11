import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Share, Switch, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { LogOut, Heart, Share2, QrCode, Bell, Moon, Sun, Monitor, UserMinus } from 'lucide-react-native';
import packageJson from '../../package.json';

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sponsorRelationships, setSponsorRelationships] = useState<any[]>([]);
  const [sponseeRelationships, setSponseeRelationships] = useState<any[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({
    tasks: profile?.notification_preferences?.tasks ?? true,
    messages: profile?.notification_preferences?.messages ?? true,
    milestones: profile?.notification_preferences?.milestones ?? true,
    daily: profile?.notification_preferences?.daily ?? true,
  });

  const fetchRelationships = async () => {
    if (!profile) return;

    setLoadingRelationships(true);
    try {
      const { data: asSponsee } = await supabase
        .from('sponsor_sponsee_relationships')
        .select('*, sponsor:sponsor_id(*)')
        .eq('sponsee_id', profile.id)
        .eq('status', 'active');

      const { data: asSponsor } = await supabase
        .from('sponsor_sponsee_relationships')
        .select('*, sponsee:sponsee_id(*)')
        .eq('sponsor_id', profile.id)
        .eq('status', 'active');

      setSponsorRelationships(asSponsee || []);
      setSponseeRelationships(asSponsor || []);
    } catch (error) {
      console.error('Error fetching relationships:', error);
    } finally {
      setLoadingRelationships(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, [profile]);

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

    const trimmedCode = inviteCode.trim().toUpperCase();

    if (trimmedCode.length !== 8) {
      if (Platform.OS === 'web') {
        window.alert('Invite code must be 8 characters');
      } else {
        Alert.alert('Error', 'Invite code must be 8 characters');
      }
      return;
    }

    setIsConnecting(true);

    try {
      const { data: invite, error: fetchError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', trimmedCode)
        .maybeSingle();

      if (fetchError || !invite) {
        if (Platform.OS === 'web') {
          window.alert('Invalid or expired invite code');
        } else {
          Alert.alert('Error', 'Invalid or expired invite code');
        }
        setIsConnecting(false);
        return;
      }

      // Fetch sponsor profile separately (we can't access it via join due to RLS)
      const { data: sponsorProfile, error: sponsorError } = await supabase
        .from('profiles')
        .select('id, first_name, last_initial')
        .eq('id', invite.sponsor_id)
        .single();

      if (sponsorError || !sponsorProfile) {
        console.error('Error fetching sponsor profile:', sponsorError);
        if (Platform.OS === 'web') {
          window.alert('Unable to fetch sponsor information');
        } else {
          Alert.alert('Error', 'Unable to fetch sponsor information');
        }
        setIsConnecting(false);
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        if (Platform.OS === 'web') {
          window.alert('This invite code has expired');
        } else {
          Alert.alert('Error', 'This invite code has expired');
        }
        setIsConnecting(false);
        return;
      }

      if (invite.used_by) {
        if (Platform.OS === 'web') {
          window.alert('This invite code has already been used');
        } else {
          Alert.alert('Error', 'This invite code has already been used');
        }
        setIsConnecting(false);
        return;
      }

      if (invite.sponsor_id === profile.id) {
        if (Platform.OS === 'web') {
          window.alert('You cannot connect to yourself as a sponsor');
        } else {
          Alert.alert('Error', 'You cannot connect to yourself as a sponsor');
        }
        setIsConnecting(false);
        return;
      }

      const { data: existingRelationship } = await supabase
        .from('sponsor_sponsee_relationships')
        .select('id')
        .eq('sponsor_id', invite.sponsor_id)
        .eq('sponsee_id', profile.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existingRelationship) {
        if (Platform.OS === 'web') {
          window.alert('You are already connected to this sponsor');
        } else {
          Alert.alert('Error', 'You are already connected to this sponsor');
        }
        setIsConnecting(false);
        return;
      }

      const { error: relationshipError } = await supabase.from('sponsor_sponsee_relationships').insert({
        sponsor_id: invite.sponsor_id,
        sponsee_id: profile.id,
        status: 'active',
      });

      if (relationshipError) {
        console.error('Relationship creation error:', relationshipError);
        const errorMessage = relationshipError.message || 'Failed to connect with sponsor. Please try again.';
        if (Platform.OS === 'web') {
          window.alert(`Failed to connect: ${errorMessage}`);
        } else {
          Alert.alert('Error', `Failed to connect: ${errorMessage}`);
        }
        setIsConnecting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('invite_codes')
        .update({ used_by: profile.id, used_at: new Date().toISOString() })
        .eq('id', invite.id);

      if (updateError) {
        console.error('Error updating invite code:', updateError);
      }

      await supabase.from('notifications').insert([
        {
          user_id: invite.sponsor_id,
          type: 'connection_request',
          title: 'New Sponsee Connected',
          content: `${profile.first_name} ${profile.last_initial}. has connected with you as their sponsor.`,
          data: { sponsee_id: profile.id },
        },
        {
          user_id: profile.id,
          type: 'connection_request',
          title: 'Connected to Sponsor',
          content: `You are now connected with ${sponsorProfile.first_name} ${sponsorProfile.last_initial}. as your sponsor.`,
          data: { sponsor_id: invite.sponsor_id },
        },
      ]);

      await fetchRelationships();

      if (Platform.OS === 'web') {
        window.alert(`Connected with ${sponsorProfile.first_name} ${sponsorProfile.last_initial}.`);
      } else {
        Alert.alert('Success', `Connected with ${sponsorProfile.first_name} ${sponsorProfile.last_initial}.`);
      }

      setShowInviteInput(false);
      setInviteCode('');
    } catch (error: any) {
      console.error('Error joining with invite code:', error);
      if (Platform.OS === 'web') {
        window.alert('Network error. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Network error. Please check your connection and try again.');
      }
    } finally {
      setIsConnecting(false);
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

  const disconnectRelationship = async (relationshipId: string, isSponsor: boolean, otherUserName: string) => {
    const confirmMessage = isSponsor
      ? `Are you sure you want to disconnect from ${otherUserName}? This will end your sponsee relationship.`
      : `Are you sure you want to disconnect from ${otherUserName}? This will end your sponsor relationship.`;

    const confirmed = Platform.OS === 'web'
      ? window.confirm(confirmMessage)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Confirm Disconnection',
            confirmMessage,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Disconnect', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('sponsor_sponsee_relationships')
        .update({
          status: 'inactive',
          disconnected_at: new Date().toISOString(),
        })
        .eq('id', relationshipId);

      if (error) throw error;

      const relationship = isSponsor
        ? sponseeRelationships.find(r => r.id === relationshipId)
        : sponsorRelationships.find(r => r.id === relationshipId);

      if (relationship) {
        const notificationRecipientId = isSponsor ? relationship.sponsee_id : relationship.sponsor_id;
        const notificationSenderName = `${profile?.first_name} ${profile?.last_initial}.`;

        await supabase.from('notifications').insert([
          {
            user_id: notificationRecipientId,
            type: 'connection_request',
            title: 'Relationship Ended',
            content: `${notificationSenderName} has ended the ${isSponsor ? 'sponsorship' : 'sponsee'} relationship.`,
            data: { relationship_id: relationshipId },
          },
        ]);
      }

      await fetchRelationships();

      if (Platform.OS === 'web') {
        window.alert('Successfully disconnected');
      } else {
        Alert.alert('Success', 'Successfully disconnected');
      }
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to disconnect. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to disconnect. Please try again.');
      }
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
          <Text style={styles.sectionTitle}>Your Sponsees</Text>
          {loadingRelationships ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : sponseeRelationships.length > 0 ? (
            <>
              {sponseeRelationships.map((rel) => (
                <View key={rel.id} style={styles.relationshipCard}>
                  <View style={styles.relationshipHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(rel.sponsee?.first_name || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.relationshipInfo}>
                      <Text style={styles.relationshipName}>{rel.sponsee?.first_name} {rel.sponsee?.last_initial}.</Text>
                      <Text style={styles.relationshipMeta}>
                        Connected {new Date(rel.connected_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={() => disconnectRelationship(rel.id, true, `${rel.sponsee?.first_name} ${rel.sponsee?.last_initial}.`)}
                  >
                    <UserMinus size={18} color="#ef4444" />
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.actionButton} onPress={generateInviteCode}>
                <Share2 size={20} color={theme.primary} />
                <Text style={styles.actionButtonText}>Generate New Invite Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View>
              <Text style={styles.emptyStateText}>No sponsees yet. Generate an invite code to get started.</Text>
              <TouchableOpacity style={styles.actionButton} onPress={generateInviteCode}>
                <Share2 size={20} color={theme.primary} />
                <Text style={styles.actionButtonText}>Generate Invite Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {(profile?.role === 'sponsee' || profile?.role === 'both') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Sponsor</Text>
          {loadingRelationships ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : sponsorRelationships.length > 0 ? (
            sponsorRelationships.map((rel) => (
              <View key={rel.id} style={styles.relationshipCard}>
                <View style={styles.relationshipHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(rel.sponsor?.first_name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.relationshipInfo}>
                    <Text style={styles.relationshipName}>{rel.sponsor?.first_name} {rel.sponsor?.last_initial}.</Text>
                    <Text style={styles.relationshipMeta}>
                      Connected {new Date(rel.connected_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => disconnectRelationship(rel.id, false, `${rel.sponsor?.first_name} ${rel.sponsor?.last_initial}.`)}
                >
                  <UserMinus size={18} color="#ef4444" />
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View>
              <Text style={styles.emptyStateText}>No sponsor connected yet</Text>
              {!showInviteInput ? (
                <TouchableOpacity style={styles.actionButton} onPress={() => setShowInviteInput(true)}>
                  <QrCode size={20} color={theme.primary} />
                  <Text style={styles.actionButtonText}>Enter Invite Code</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.inviteInputContainer}>
                  <TextInput
                    style={styles.inviteInput}
                    placeholder="Enter 8-character code"
                    placeholderTextColor={theme.textTertiary}
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                    maxLength={8}
                    editable={!isConnecting}
                  />
                  <TouchableOpacity
                    style={[styles.inviteSubmitButton, isConnecting && styles.buttonDisabled]}
                    onPress={joinWithInviteCode}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.inviteSubmitText}>Connect</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inviteCancelButton}
                    onPress={() => {
                      setShowInviteInput(false);
                      setInviteCode('');
                    }}
                    disabled={isConnecting}
                  >
                    <Text style={styles.inviteCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {(profile?.role === 'sponsor' || profile?.role === 'both') && sponsorRelationships.length > 0 && !showInviteInput && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowInviteInput(true)}>
            <QrCode size={20} color={theme.primary} />
            <Text style={styles.actionButtonText}>Connect to Another Sponsor</Text>
          </TouchableOpacity>
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
        <Text style={styles.footerText}>12-Step Tracker v{packageJson.version}</Text>
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
    fontFamily: theme.fontRegular,
    fontWeight: '700',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontFamily: theme.fontRegular,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  daysSober: {
    fontSize: 48,
    fontFamily: theme.fontRegular,
    fontWeight: '700',
    color: theme.primary,
  },
  sobrietyDate: {
    fontSize: 14,
    fontFamily: theme.fontRegular,
    color: theme.textSecondary,
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
    fontWeight: '600',
    color: '#ffffff',
  },
  inviteCancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  inviteCancelText: {
    fontSize: 16,
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
    color: theme.textTertiary,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
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
    fontFamily: theme.fontRegular,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 6,
  },
  themeOptionTextSelected: {
    color: theme.primary,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  relationshipCard: {
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  relationshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  relationshipInfo: {
    marginLeft: 12,
    flex: 1,
  },
  relationshipName: {
    fontSize: 16,
    fontFamily: theme.fontRegular,
    fontWeight: '600',
    color: theme.text,
  },
  relationshipMeta: {
    fontSize: 14,
    fontFamily: theme.fontRegular,
    color: theme.textSecondary,
    marginTop: 2,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  disconnectText: {
    fontSize: 14,
    fontFamily: theme.fontRegular,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 6,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: theme.fontRegular,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
