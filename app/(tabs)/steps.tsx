import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { StepContent } from '@/types/database';
import { BookOpen, X } from 'lucide-react-native';

export default function StepsScreen() {
  const { theme } = useTheme();
  const [steps, setSteps] = useState<StepContent[]>([]);
  const [selectedStep, setSelectedStep] = useState<StepContent | null>(null);

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    const { data } = await supabase
      .from('steps_content')
      .select('*')
      .order('step_number');
    setSteps(data || []);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>The 12 Steps</Text>
        <Text style={styles.headerSubtitle}>Your path to recovery</Text>
      </View>

      <ScrollView style={styles.content}>
        {steps.map((step) => (
          <TouchableOpacity
            key={step.id}
            style={styles.stepCard}
            onPress={() => setSelectedStep(step)}
          >
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.step_number}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription} numberOfLines={2}>
                {step.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedStep !== null}
        animationType="slide"
        onRequestClose={() => setSelectedStep(null)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalStepNumber}>Step {selectedStep?.step_number}</Text>
              <TouchableOpacity onPress={() => setSelectedStep(null)}>
                <X size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedStep?.title}</Text>
            <Text style={styles.modalDescription}>{selectedStep?.description}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Understanding This Step</Text>
              <Text style={styles.sectionContent}>{selectedStep?.detailed_content}</Text>
            </View>

            {selectedStep?.reflection_prompts && selectedStep.reflection_prompts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reflection Questions</Text>
                {selectedStep.reflection_prompts.map((prompt, index) => (
                  <View key={index} style={styles.promptItem}>
                    <Text style={styles.promptBullet}>•</Text>
                    <Text style={styles.promptText}>{prompt}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  stepCard: {
    flexDirection: 'row',
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
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  modal: {
    flex: 1,
    backgroundColor: theme.card,
  },
  modalHeader: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalStepNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  modalDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 26,
  },
  promptItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  promptBullet: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 12,
    fontWeight: '700',
  },
  promptText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});
