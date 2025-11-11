/**
 * Task fixtures for testing
 */

import type { Task, TaskStatus } from '@/types/database';
import { createSponsor, createSponsee } from './profiles';

let taskCounter = 0;

/**
 * Generate a unique task ID
 */
function generateTaskId(): string {
  return `task-${Date.now()}-${taskCounter++}`;
}

/**
 * Create a task fixture with optional overrides
 */
export function createTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id || generateTaskId();
  const sponsorId = overrides.sponsor_id || 'sponsor-123';
  const sponseeId = overrides.sponsee_id || 'sponsee-456';

  return {
    id,
    sponsor_id: sponsorId,
    sponsee_id: sponseeId,
    step_number: overrides.step_number || 1,
    title: overrides.title || 'Complete Step 1 reading',
    description: overrides.description || 'Read the chapter on Step 1 and write reflections',
    due_date: overrides.due_date,
    status: overrides.status || 'assigned',
    completion_notes: overrides.completion_notes,
    completed_at: overrides.completed_at,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
    sponsor: overrides.sponsor,
    sponsee: overrides.sponsee,
  };
}

/**
 * Create an assigned task
 */
export function createAssignedTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    status: 'assigned',
    ...overrides,
  });
}

/**
 * Create an in-progress task
 */
export function createInProgressTask(overrides: Partial<Task> = {}): Task {
  return createTask({
    status: 'in_progress',
    ...overrides,
  });
}

/**
 * Create a completed task
 */
export function createCompletedTask(overrides: Partial<Task> = {}): Task {
  const completedAt = new Date().toISOString();

  return createTask({
    status: 'completed',
    completed_at: completedAt,
    completion_notes: 'Task completed successfully',
    ...overrides,
  });
}

/**
 * Create a task with sponsor and sponsee profiles
 */
export function createTaskWithProfiles(overrides: Partial<Task> = {}): Task {
  const sponsor = createSponsor();
  const sponsee = createSponsee();

  return createTask({
    sponsor_id: sponsor.id,
    sponsee_id: sponsee.id,
    sponsor,
    sponsee,
    ...overrides,
  });
}

/**
 * Create multiple tasks at once
 */
export function createTasks(count: number, status?: TaskStatus, stepNumber?: number): Task[] {
  return Array.from({ length: count }, (_, index) =>
    createTask({
      status,
      step_number: stepNumber || (index % 12) + 1,
    })
  );
}

/**
 * Create tasks for all 12 steps
 */
export function createTasksForAllSteps(sponsorId: string, sponseeId: string): Task[] {
  return Array.from({ length: 12 }, (_, index) =>
    createTask({
      sponsor_id: sponsorId,
      sponsee_id: sponseeId,
      step_number: index + 1,
      title: `Complete Step ${index + 1}`,
      description: `Work on Step ${index + 1} with your sponsor`,
    })
  );
}
