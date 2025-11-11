/**
 * Other entity fixtures for testing
 * Includes: Notifications, StepContent, InviteCodes, SlipUps, UserStepProgress
 */

import type {
  Notification,
  NotificationType,
  StepContent,
  InviteCode,
  SlipUp,
  UserStepProgress,
} from '@/types/database';

let notificationCounter = 0;
let inviteCodeCounter = 0;
let slipUpCounter = 0;
let progressCounter = 0;

/**
 * Create a notification fixture
 */
export function createNotification(overrides: Partial<Notification> = {}): Notification {
  const id = `notification-${Date.now()}-${notificationCounter++}`;

  return {
    id: overrides.id || id,
    user_id: overrides.user_id || 'user-123',
    type: overrides.type || 'task_assigned',
    title: overrides.title || 'New Task Assigned',
    content: overrides.content || 'Your sponsor has assigned you a new task',
    data: overrides.data || {},
    read_at: overrides.read_at,
    created_at: overrides.created_at || new Date().toISOString(),
  };
}

/**
 * Create an unread notification
 */
export function createUnreadNotification(overrides: Partial<Notification> = {}): Notification {
  return createNotification({
    read_at: undefined,
    ...overrides,
  });
}

/**
 * Create a step content fixture
 */
export function createStepContent(overrides: Partial<StepContent> = {}): StepContent {
  const stepNumber = overrides.step_number || 1;
  const id = `step-content-${stepNumber}`;

  return {
    id: overrides.id || id,
    step_number: stepNumber,
    title: overrides.title || `Step ${stepNumber}`,
    description: overrides.description || `Description for step ${stepNumber}`,
    detailed_content:
      overrides.detailed_content ||
      `Detailed content for step ${stepNumber}. This includes all the information needed to work through this step.`,
    reflection_prompts: overrides.reflection_prompts || [
      `Reflection question 1 for step ${stepNumber}`,
      `Reflection question 2 for step ${stepNumber}`,
      `Reflection question 3 for step ${stepNumber}`,
    ],
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

/**
 * Create all 12 steps content
 */
export function createAllStepsContent(): StepContent[] {
  return Array.from({ length: 12 }, (_, index) => createStepContent({ step_number: index + 1 }));
}

/**
 * Create an invite code fixture
 */
export function createInviteCode(overrides: Partial<InviteCode> = {}): InviteCode {
  const id = `invite-code-${Date.now()}-${inviteCodeCounter++}`;
  const code = overrides.code || `CODE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    id: overrides.id || id,
    code,
    sponsor_id: overrides.sponsor_id || 'sponsor-123',
    expires_at:
      overrides.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    used_by: overrides.used_by,
    used_at: overrides.used_at,
    created_at: overrides.created_at || new Date().toISOString(),
    sponsor: overrides.sponsor,
  };
}

/**
 * Create an unused invite code
 */
export function createUnusedInviteCode(overrides: Partial<InviteCode> = {}): InviteCode {
  return createInviteCode({
    used_by: undefined,
    used_at: undefined,
    ...overrides,
  });
}

/**
 * Create a used invite code
 */
export function createUsedInviteCode(overrides: Partial<InviteCode> = {}): InviteCode {
  return createInviteCode({
    used_by: 'sponsee-456',
    used_at: new Date().toISOString(),
    ...overrides,
  });
}

/**
 * Create an expired invite code
 */
export function createExpiredInviteCode(overrides: Partial<InviteCode> = {}): InviteCode {
  return createInviteCode({
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    ...overrides,
  });
}

/**
 * Create a slip-up fixture
 */
export function createSlipUp(overrides: Partial<SlipUp> = {}): SlipUp {
  const id = `slip-up-${Date.now()}-${slipUpCounter++}`;
  const slipUpDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

  return {
    id: overrides.id || id,
    user_id: overrides.user_id || 'user-123',
    slip_up_date: overrides.slip_up_date || slipUpDate,
    recovery_restart_date: overrides.recovery_restart_date || slipUpDate,
    notes: overrides.notes,
    created_at: overrides.created_at || new Date().toISOString(),
  };
}

/**
 * Create user step progress fixture
 */
export function createUserStepProgress(
  overrides: Partial<UserStepProgress> = {}
): UserStepProgress {
  const id = `progress-${Date.now()}-${progressCounter++}`;
  const stepNumber = overrides.step_number || 1;

  return {
    id: overrides.id || id,
    user_id: overrides.user_id || 'user-123',
    step_number: stepNumber,
    completed: overrides.completed ?? false,
    completed_at: overrides.completed_at,
    notes: overrides.notes,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

/**
 * Create completed step progress
 */
export function createCompletedStepProgress(
  overrides: Partial<UserStepProgress> = {}
): UserStepProgress {
  const completedAt = new Date().toISOString();

  return createUserStepProgress({
    completed: true,
    completed_at: completedAt,
    notes: 'Step completed successfully',
    ...overrides,
  });
}

/**
 * Create progress for all 12 steps
 */
export function createAllStepsProgress(
  userId: string,
  completedUpToStep: number = 0
): UserStepProgress[] {
  return Array.from({ length: 12 }, (_, index) => {
    const stepNumber = index + 1;
    const completed = stepNumber <= completedUpToStep;

    return createUserStepProgress({
      user_id: userId,
      step_number: stepNumber,
      completed,
      completed_at: completed ? new Date().toISOString() : undefined,
    });
  });
}
