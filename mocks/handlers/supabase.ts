/**
 * MSW handlers for Supabase REST API
 * Mocks Supabase database operations for testing
 */

import { http, HttpResponse } from 'msw';
import { db } from '../db';

// Get Supabase URL from environment or use a test URL
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
const REST_API_URL = `${SUPABASE_URL}/rest/v1`;

/**
 * Helper to parse Supabase query parameters
 */
function parseSupabaseQuery(url: URL) {
  const select = url.searchParams.get('select') || '*';
  const filters: Record<string, any> = {};

  // Parse common Supabase filters (eq, neq, gt, gte, lt, lte, like, ilike, in)
  url.searchParams.forEach((value, key) => {
    if (key !== 'select') {
      // Handle operators like eq.value, gt.value, etc.
      const [operator, ...rest] = value.split('.');
      const filterValue = rest.join('.');
      filters[key] = { operator, value: filterValue };
    }
  });

  return { select, filters };
}

/**
 * Helper to filter records based on Supabase query filters
 */
function filterRecords<T extends Record<string, any>>(
  records: T[],
  filters: Record<string, any>
): T[] {
  return records.filter(record => {
    return Object.entries(filters).every(([key, filter]) => {
      const { operator, value } = filter;
      const recordValue = record[key];

      switch (operator) {
        case 'eq':
          return recordValue === value;
        case 'neq':
          return recordValue !== value;
        case 'gt':
          return recordValue > value;
        case 'gte':
          return recordValue >= value;
        case 'lt':
          return recordValue < value;
        case 'lte':
          return recordValue <= value;
        case 'like':
          return recordValue?.includes(value);
        case 'ilike':
          return recordValue?.toLowerCase().includes(value.toLowerCase());
        case 'in':
          return value.split(',').includes(recordValue);
        default:
          return true;
      }
    });
  });
}

export const supabaseHandlers = [
  // ============================================
  // PROFILES
  // ============================================

  // GET /profiles
  http.get(`${REST_API_URL}/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let profiles = Array.from(db.profiles.values());
    if (Object.keys(filters).length > 0) {
      profiles = filterRecords(profiles, filters);
    }

    return HttpResponse.json(profiles);
  }),

  // POST /profiles
  http.post(`${REST_API_URL}/profiles`, async ({ request }) => {
    const body = (await request.json()) as any;
    const profile = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.profiles.set(profile.id, profile);
    return HttpResponse.json(profile, { status: 201 });
  }),

  // PATCH /profiles
  http.patch(`${REST_API_URL}/profiles`, async ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);
    const updates = (await request.json()) as any;

    const profiles = Array.from(db.profiles.values());
    const matchedProfiles = filterRecords(profiles, filters);

    matchedProfiles.forEach(profile => {
      const updated = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      db.profiles.set(profile.id, updated);
    });

    return HttpResponse.json(matchedProfiles);
  }),

  // DELETE /profiles
  http.delete(`${REST_API_URL}/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    const profiles = Array.from(db.profiles.values());
    const matchedProfiles = filterRecords(profiles, filters);

    matchedProfiles.forEach(profile => {
      db.profiles.delete(profile.id);
    });

    return HttpResponse.json(null, { status: 204 });
  }),

  // ============================================
  // TASKS
  // ============================================

  // GET /tasks
  http.get(`${REST_API_URL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let tasks = Array.from(db.tasks.values());
    if (Object.keys(filters).length > 0) {
      tasks = filterRecords(tasks, filters);
    }

    return HttpResponse.json(tasks);
  }),

  // POST /tasks
  http.post(`${REST_API_URL}/tasks`, async ({ request }) => {
    const body = (await request.json()) as any;
    const task = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.tasks.set(task.id, task);
    return HttpResponse.json(task, { status: 201 });
  }),

  // PATCH /tasks
  http.patch(`${REST_API_URL}/tasks`, async ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);
    const updates = (await request.json()) as any;

    const tasks = Array.from(db.tasks.values());
    const matchedTasks = filterRecords(tasks, filters);

    matchedTasks.forEach(task => {
      const updated = {
        ...task,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      db.tasks.set(task.id, updated);
    });

    return HttpResponse.json(matchedTasks);
  }),

  // DELETE /tasks
  http.delete(`${REST_API_URL}/tasks`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    const tasks = Array.from(db.tasks.values());
    const matchedTasks = filterRecords(tasks, filters);

    matchedTasks.forEach(task => {
      db.tasks.delete(task.id);
    });

    return HttpResponse.json(null, { status: 204 });
  }),

  // ============================================
  // MESSAGES
  // ============================================

  // GET /messages
  http.get(`${REST_API_URL}/messages`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let messages = Array.from(db.messages.values());
    if (Object.keys(filters).length > 0) {
      messages = filterRecords(messages, filters);
    }

    return HttpResponse.json(messages);
  }),

  // POST /messages
  http.post(`${REST_API_URL}/messages`, async ({ request }) => {
    const body = (await request.json()) as any;
    const message = {
      ...body,
      created_at: new Date().toISOString(),
    };
    db.messages.set(message.id, message);
    return HttpResponse.json(message, { status: 201 });
  }),

  // PATCH /messages
  http.patch(`${REST_API_URL}/messages`, async ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);
    const updates = (await request.json()) as any;

    const messages = Array.from(db.messages.values());
    const matchedMessages = filterRecords(messages, filters);

    matchedMessages.forEach(message => {
      const updated = { ...message, ...updates };
      db.messages.set(message.id, updated);
    });

    return HttpResponse.json(matchedMessages);
  }),

  // ============================================
  // RELATIONSHIPS
  // ============================================

  // GET /sponsor_sponsee_relationships
  http.get(`${REST_API_URL}/sponsor_sponsee_relationships`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let relationships = Array.from(db.relationships.values());
    if (Object.keys(filters).length > 0) {
      relationships = filterRecords(relationships, filters);
    }

    return HttpResponse.json(relationships);
  }),

  // POST /sponsor_sponsee_relationships
  http.post(`${REST_API_URL}/sponsor_sponsee_relationships`, async ({ request }) => {
    const body = (await request.json()) as any;
    const relationship = {
      ...body,
      created_at: new Date().toISOString(),
    };
    db.relationships.set(relationship.id, relationship);
    return HttpResponse.json(relationship, { status: 201 });
  }),

  // PATCH /sponsor_sponsee_relationships
  http.patch(`${REST_API_URL}/sponsor_sponsee_relationships`, async ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);
    const updates = (await request.json()) as any;

    const relationships = Array.from(db.relationships.values());
    const matchedRelationships = filterRecords(relationships, filters);

    matchedRelationships.forEach(rel => {
      const updated = { ...rel, ...updates };
      db.relationships.set(rel.id, updated);
    });

    return HttpResponse.json(matchedRelationships);
  }),

  // ============================================
  // NOTIFICATIONS
  // ============================================

  // GET /notifications
  http.get(`${REST_API_URL}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let notifications = Array.from(db.notifications.values());
    if (Object.keys(filters).length > 0) {
      notifications = filterRecords(notifications, filters);
    }

    return HttpResponse.json(notifications);
  }),

  // POST /notifications
  http.post(`${REST_API_URL}/notifications`, async ({ request }) => {
    const body = (await request.json()) as any;
    const notification = {
      ...body,
      created_at: new Date().toISOString(),
    };
    db.notifications.set(notification.id, notification);
    return HttpResponse.json(notification, { status: 201 });
  }),

  // PATCH /notifications
  http.patch(`${REST_API_URL}/notifications`, async ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);
    const updates = (await request.json()) as any;

    const notifications = Array.from(db.notifications.values());
    const matchedNotifications = filterRecords(notifications, filters);

    matchedNotifications.forEach(notification => {
      const updated = { ...notification, ...updates };
      db.notifications.set(notification.id, updated);
    });

    return HttpResponse.json(matchedNotifications);
  }),

  // ============================================
  // STEPS CONTENT
  // ============================================

  // GET /steps_content
  http.get(`${REST_API_URL}/steps_content`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let stepsContent = Array.from(db.stepsContent.values());
    if (Object.keys(filters).length > 0) {
      stepsContent = filterRecords(stepsContent, filters);
    }

    return HttpResponse.json(stepsContent);
  }),

  // ============================================
  // INVITE CODES
  // ============================================

  // GET /invite_codes
  http.get(`${REST_API_URL}/invite_codes`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let inviteCodes = Array.from(db.inviteCodes.values());
    if (Object.keys(filters).length > 0) {
      inviteCodes = filterRecords(inviteCodes, filters);
    }

    return HttpResponse.json(inviteCodes);
  }),

  // POST /invite_codes
  http.post(`${REST_API_URL}/invite_codes`, async ({ request }) => {
    const body = (await request.json()) as any;
    const inviteCode = {
      ...body,
      created_at: new Date().toISOString(),
    };
    db.inviteCodes.set(inviteCode.id, inviteCode);
    return HttpResponse.json(inviteCode, { status: 201 });
  }),

  // ============================================
  // USER STEP PROGRESS
  // ============================================

  // GET /user_step_progress
  http.get(`${REST_API_URL}/user_step_progress`, ({ request }) => {
    const url = new URL(request.url);
    const { filters } = parseSupabaseQuery(url);

    let progress = Array.from(db.userStepProgress.values());
    if (Object.keys(filters).length > 0) {
      progress = filterRecords(progress, filters);
    }

    return HttpResponse.json(progress);
  }),

  // POST /user_step_progress
  http.post(`${REST_API_URL}/user_step_progress`, async ({ request }) => {
    const body = (await request.json()) as any;
    const progress = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.userStepProgress.set(progress.id, progress);
    return HttpResponse.json(progress, { status: 201 });
  }),
];
