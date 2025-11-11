import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SponsorSponseeRelationship, Task } from '@/types/database';
import { Heart, Calendar, TrendingUp, CheckCircle, Users, Award } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { profile } = useAuth();
  const [relationships, setRelationships] = useState<SponsorSponseeRelationship[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    if (!profile) return;

    if (profile.role === 'sponsor' || profile.role === 'both') {
      const { data } = await supabase
        .from('sponsor_sponsee_relationships')
        .select('*, sponsee:sponsee_id(*)').eq('sponsor_id', profile.id)
        .eq('status', 'active');
      setRelationships(data || []);
    } else {
      const { data } = await supabase
        .from('sponsor_sponsee_relationships')
        .select('*, sponsor:sponsor_id(*)')
        .eq('sponsee_id', profile.id)
        .eq('status', 'active');
      setRelationships(data || []);
    }

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('sponsee_id', profile.id)
      .eq('status', 'assigned')
      .order('created_at', { ascending: false })
      .limit(3);
    setTasks(tasksData || []);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getDaysSober = () => {
    if (!profile?.sobriety_date) return 0;
    const sobrietyDate = new Date(profile.sobriety_date);
    const today = new Date();
    const diff = today.getTime() - sobrietyDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getMilestone = (days: number) => {
    if (days >= 365) return { text: `${Math.floor(days / 365)} Year${Math.floor(days / 365) > 1 ? 's' : ''}`, color: '#10b981' };
    if (days >= 180) return { text: '6 Months', color: '#10b981' };
    if (days >= 90) return { text: '90 Days', color: '#10b981' };
    if (days >= 30) return { text: '30 Days', color: '#10b981' };
    if (days >= 7) return { text: '1 Week', color: '#10b981' };
    if (days >= 1) return { text: '24 Hours', color: '#10b981' };
    return { text: 'Just Starting', color: '#6b7280' };
  };

  const daysSober = getDaysSober();
  const milestone = getMilestone(daysSober);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {profile?.first_name || 'Friend'}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      <View style={styles.sobrietyCard}>
        <View style={styles.sobrietyHeader}>
          <Heart size={32} color="#10b981" fill="#10b981" />
          <View style={styles.sobrietyInfo}>
            <Text style={styles.sobrietyTitle}>Your Sobriety Journey</Text>
            <Text style={styles.sobrietyDate}>
              Since {new Date(profile?.sobriety_date || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View style={styles.daysSoberContainer}>
          <Text style={styles.daysSoberCount}>{daysSober}</Text>
          <Text style={styles.daysSoberLabel}>Days Sober</Text>
          <View style={[styles.milestoneBadge, { backgroundColor: milestone.color }]}>
            <Award size={16} color="#ffffff" />
            <Text style={styles.milestoneText}>{milestone.text}</Text>
          </View>
        </View>
      </View>

      {profile?.role === 'sponsee' && relationships.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Users size={24} color="#374151" />
            <Text style={styles.cardTitle}>Your Sponsor</Text>
          </View>
          {relationships.map((rel) => (
            <View key={rel.id} style={styles.relationshipItem}>
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
          ))}
        </View>
      )}

      {(profile?.role === 'sponsor' || profile?.role === 'both') && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Users size={24} color="#374151" />
            <Text style={styles.cardTitle}>Your Sponsees</Text>
          </View>
          {relationships.length === 0 ? (
            <Text style={styles.emptyText}>No sponsees yet. Share your invite code to connect.</Text>
          ) : (
            relationships.map((rel) => (
              <View key={rel.id} style={styles.relationshipItem}>
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
            ))
          )}
        </View>
      )}

      {tasks.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CheckCircle size={24} color="#374151" />
            <Text style={styles.cardTitle}>Recent Tasks</Text>
          </View>
          {tasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => router.push('/tasks')}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskMeta}>Step {task.step_number}</Text>
              </View>
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>New</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push('/tasks')}>
            <Text style={styles.viewAllText}>View All Tasks</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/steps')}>
          <BookOpen size={32} color="#10b981" />
          <Text style={styles.actionTitle}>12 Steps</Text>
          <Text style={styles.actionSubtitle}>Learn & Reflect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/messages')}>
          <MessageCircle size={32} color="#10b981" />
          <Text style={styles.actionTitle}>Messages</Text>
          <Text style={styles.actionSubtitle}>Stay Connected</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const { BookOpen, MessageCircle } = require('lucide-react-native');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  sobrietyCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sobrietyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sobrietyInfo: {
    marginLeft: 16,
    flex: 1,
  },
  sobrietyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sobrietyDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  daysSoberContainer: {
    alignItems: 'center',
  },
  daysSoberCount: {
    fontSize: 64,
    fontWeight: '700',
    color: '#10b981',
  },
  daysSoberLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  milestoneText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  relationshipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  relationshipInfo: {
    marginLeft: 12,
    flex: 1,
  },
  relationshipName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  relationshipMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  taskBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
});
