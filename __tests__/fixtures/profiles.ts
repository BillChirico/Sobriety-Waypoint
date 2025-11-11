/**
 * Profile fixtures for testing
 */

import type { Profile, UserRole } from '@/types/database';

let profileCounter = 0;

/**
 * Generate a unique profile ID
 */
function generateProfileId(): string {
  return `profile-${Date.now()}-${profileCounter++}`;
}

/**
 * Create a profile fixture with optional overrides
 */
export function createProfile(overrides: Partial<Profile> = {}): Profile {
  const id = overrides.id || generateProfileId();
  const email = overrides.email || `user-${id}@example.com`;

  return {
    id,
    email,
    first_name: overrides.first_name || 'Test',
    last_initial: overrides.last_initial || 'U',
    phone: overrides.phone,
    avatar_url: overrides.avatar_url,
    role: overrides.role || 'both',
    sobriety_date: overrides.sobriety_date || '2024-01-01',
    bio: overrides.bio,
    timezone: overrides.timezone || 'America/New_York',
    notification_preferences: overrides.notification_preferences || {
      tasks: true,
      messages: true,
      milestones: true,
      daily: false,
    },
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString(),
  };
}

/**
 * Create a sponsor profile
 */
export function createSponsor(overrides: Partial<Profile> = {}): Profile {
  return createProfile({
    first_name: 'John',
    last_initial: 'S',
    role: 'sponsor',
    ...overrides,
  });
}

/**
 * Create a sponsee profile
 */
export function createSponsee(overrides: Partial<Profile> = {}): Profile {
  return createProfile({
    first_name: 'Jane',
    last_initial: 'D',
    role: 'sponsee',
    ...overrides,
  });
}

/**
 * Create a profile with both sponsor and sponsee roles
 */
export function createBothRoleProfile(overrides: Partial<Profile> = {}): Profile {
  return createProfile({
    first_name: 'Alex',
    last_initial: 'B',
    role: 'both',
    ...overrides,
  });
}

/**
 * Create a new user profile (no role set)
 */
export function createNewUserProfile(overrides: Partial<Profile> = {}): Profile {
  return createProfile({
    first_name: '',
    last_initial: '',
    role: undefined,
    sobriety_date: undefined,
    ...overrides,
  });
}

/**
 * Create multiple profiles at once
 */
export function createProfiles(count: number, role?: UserRole): Profile[] {
  return Array.from({ length: count }, () => createProfile({ role }));
}
