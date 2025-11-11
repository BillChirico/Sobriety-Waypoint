import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types/database';
import { Users, User, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>('sponsee');
  const [sobrietyDate, setSobrietyDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role,
          sobriety_date: sobrietyDate.toISOString().split('T')[0],
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSobrietyDate(selectedDate);
    }
  };

  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to 12-Step Tracker</Text>
          <Text style={styles.subtitle}>Let's set up your recovery journey</Text>

          <View style={styles.roleContainer}>
            <Text style={styles.sectionTitle}>What is your role?</Text>

            <TouchableOpacity
              style={[styles.roleCard, role === 'sponsee' && styles.roleCardSelected]}
              onPress={() => setRole('sponsee')}
            >
              <View style={styles.roleIcon}>
                <User size={32} color={role === 'sponsee' ? '#10b981' : '#6b7280'} />
              </View>
              <View style={styles.roleContent}>
                <Text style={[styles.roleTitle, role === 'sponsee' && styles.roleTextSelected]}>
                  Sponsee
                </Text>
                <Text style={styles.roleDescription}>
                  I am seeking guidance and support in my recovery journey
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'sponsor' && styles.roleCardSelected]}
              onPress={() => setRole('sponsor')}
            >
              <View style={styles.roleIcon}>
                <Users size={32} color={role === 'sponsor' ? '#10b981' : '#6b7280'} />
              </View>
              <View style={styles.roleContent}>
                <Text style={[styles.roleTitle, role === 'sponsor' && styles.roleTextSelected]}>
                  Sponsor
                </Text>
                <Text style={styles.roleDescription}>
                  I am here to guide and support others in their recovery
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'both' && styles.roleCardSelected]}
              onPress={() => setRole('both')}
            >
              <View style={styles.roleIcon}>
                <Users size={32} color={role === 'both' ? '#10b981' : '#6b7280'} />
              </View>
              <View style={styles.roleContent}>
                <Text style={[styles.roleTitle, role === 'both' && styles.roleTextSelected]}>
                  Both
                </Text>
                <Text style={styles.roleDescription}>
                  I am both a sponsor to others and have my own sponsor
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setStep(2)}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Sobriety Date</Text>
        <Text style={styles.subtitle}>When did you begin your sobriety journey?</Text>

        <View style={styles.dateContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={24} color="#10b981" />
            <Text style={styles.dateText}>
              {sobrietyDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {(showDatePicker || Platform.OS === 'web') && Platform.OS !== 'web' && (
            <DateTimePicker
              value={sobrietyDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          {Platform.OS === 'web' && showDatePicker && (
            <View style={styles.webDatePicker}>
              <input
                type="date"
                value={sobrietyDate.toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setSobrietyDate(new Date(e.target.value));
                  setShowDatePicker(false);
                }}
                style={{
                  padding: '12px',
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  marginBottom: '16px',
                }}
              />
            </View>
          )}

          <View style={styles.daysContainer}>
            <Text style={styles.daysCount}>
              {Math.floor((new Date().getTime() - sobrietyDate.getTime()) / (1000 * 60 * 60 * 24))}
            </Text>
            <Text style={styles.daysLabel}>Days Sober</Text>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(1)}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.flexButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  roleContainer: {
    marginBottom: 32,
  },
  roleCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  roleCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  roleIcon: {
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  roleTextSelected: {
    color: '#10b981',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  webDatePicker: {
    marginBottom: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  daysContainer: {
    alignItems: 'center',
  },
  daysCount: {
    fontSize: 64,
    fontWeight: '700',
    color: '#10b981',
  },
  daysLabel: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  flexButton: {
    flex: 2,
  },
});
