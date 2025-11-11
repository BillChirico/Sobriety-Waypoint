import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Task } from '@/types/database';
import { CheckCircle, Circle, Clock } from 'lucide-react-native';

export default function TasksScreen() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('tasks')
      .select('*, sponsor:sponsor_id(*)')
      .eq('sponsee_id', profile.id)
      .order('created_at', { ascending: false });
    setTasks(data || []);
  };

  useEffect(() => {
    fetchTasks();
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) {
      Alert.alert('Error', 'Failed to complete task');
    } else {
      fetchTasks();
    }
  };

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSubtitle}>Track your step progress</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {getTasksByStatus('assigned').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>New Tasks</Text>
            {getTasksByStatus('assigned').map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step {task.step_number}</Text>
                  </View>
                  <Text style={styles.taskDate}>
                    {new Date(task.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <View style={styles.taskFooter}>
                  <Text style={styles.sponsorText}>From: {task.sponsor?.first_name} {task.sponsor?.last_initial}.</Text>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteTask(task.id)}
                  >
                    <CheckCircle size={20} color="#10b981" />
                    <Text style={styles.completeButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {getTasksByStatus('completed').length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            {getTasksByStatus('completed').map(task => (
              <View key={task.id} style={[styles.taskCard, styles.completedCard]}>
                <View style={styles.taskHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>Step {task.step_number}</Text>
                  </View>
                  <CheckCircle size={20} color="#10b981" />
                </View>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <Text style={styles.completedDate}>
                  Completed {new Date(task.completed_at!).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Circle size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>
              Your sponsor will assign tasks to help you progress through the 12 steps
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  taskDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sponsorText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 6,
  },
  completedDate: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});
