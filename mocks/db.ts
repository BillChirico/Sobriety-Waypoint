/**
 * In-memory database for testing
 * Provides a simple store for mock data that persists across test operations
 */

import type {
  Profile,
  Task,
  Message,
  SponsorSponseeRelationship,
  Notification,
  StepContent,
  InviteCode,
  SlipUp,
  UserStepProgress,
  TaskTemplate,
} from '@/types/database';

interface MockDatabase {
  profiles: Map<string, Profile>;
  tasks: Map<string, Task>;
  messages: Map<string, Message>;
  relationships: Map<string, SponsorSponseeRelationship>;
  notifications: Map<string, Notification>;
  stepsContent: Map<string, StepContent>;
  inviteCodes: Map<string, InviteCode>;
  slipUps: Map<string, SlipUp>;
  userStepProgress: Map<string, UserStepProgress>;
  taskTemplates: Map<string, TaskTemplate>;
}

// In-memory database store
const db: MockDatabase = {
  profiles: new Map(),
  tasks: new Map(),
  messages: new Map(),
  relationships: new Map(),
  notifications: new Map(),
  stepsContent: new Map(),
  inviteCodes: new Map(),
  slipUps: new Map(),
  userStepProgress: new Map(),
  taskTemplates: new Map(),
};

/**
 * Reset the database (call this in beforeEach or afterEach)
 */
export function resetDb() {
  db.profiles.clear();
  db.tasks.clear();
  db.messages.clear();
  db.relationships.clear();
  db.notifications.clear();
  db.stepsContent.clear();
  db.inviteCodes.clear();
  db.slipUps.clear();
  db.userStepProgress.clear();
  db.taskTemplates.clear();
}

/**
 * Seed the database with initial data
 */
export function seedDb(data: Partial<MockDatabase>) {
  if (data.profiles) {
    data.profiles.forEach((profile, id) => db.profiles.set(id, profile));
  }
  if (data.tasks) {
    data.tasks.forEach((task, id) => db.tasks.set(id, task));
  }
  if (data.messages) {
    data.messages.forEach((message, id) => db.messages.set(id, message));
  }
  if (data.relationships) {
    data.relationships.forEach((rel, id) => db.relationships.set(id, rel));
  }
  if (data.notifications) {
    data.notifications.forEach((notif, id) => db.notifications.set(id, notif));
  }
  if (data.stepsContent) {
    data.stepsContent.forEach((step, id) => db.stepsContent.set(id, step));
  }
  if (data.inviteCodes) {
    data.inviteCodes.forEach((code, id) => db.inviteCodes.set(id, code));
  }
  if (data.slipUps) {
    data.slipUps.forEach((slipUp, id) => db.slipUps.set(id, slipUp));
  }
  if (data.userStepProgress) {
    data.userStepProgress.forEach((progress, id) => db.userStepProgress.set(id, progress));
  }
  if (data.taskTemplates) {
    data.taskTemplates.forEach((template, id) => db.taskTemplates.set(id, template));
  }
}

export { db };
