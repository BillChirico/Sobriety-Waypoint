/**
 * Relationship fixtures for testing
 */

import type { SponsorSponseeRelationship, RelationshipStatus } from '@/types/database';
import { createSponsor, createSponsee } from './profiles';

let relationshipCounter = 0;

/**
 * Generate a unique relationship ID
 */
function generateRelationshipId(): string {
  return `relationship-${Date.now()}-${relationshipCounter++}`;
}

/**
 * Create a relationship fixture with optional overrides
 */
export function createRelationship(
  overrides: Partial<SponsorSponseeRelationship> = {}
): SponsorSponseeRelationship {
  const id = overrides.id || generateRelationshipId();
  const sponsorId = overrides.sponsor_id || 'sponsor-123';
  const sponseeId = overrides.sponsee_id || 'sponsee-456';

  return {
    id,
    sponsor_id: sponsorId,
    sponsee_id: sponseeId,
    status: overrides.status || 'active',
    connected_at: overrides.connected_at || new Date().toISOString(),
    disconnected_at: overrides.disconnected_at,
    created_at: overrides.created_at || new Date().toISOString(),
    sponsor: overrides.sponsor,
    sponsee: overrides.sponsee,
  };
}

/**
 * Create an active relationship
 */
export function createActiveRelationship(
  overrides: Partial<SponsorSponseeRelationship> = {}
): SponsorSponseeRelationship {
  return createRelationship({
    status: 'active',
    ...overrides,
  });
}

/**
 * Create a pending relationship
 */
export function createPendingRelationship(
  overrides: Partial<SponsorSponseeRelationship> = {}
): SponsorSponseeRelationship {
  return createRelationship({
    status: 'pending',
    connected_at: undefined,
    ...overrides,
  });
}

/**
 * Create an inactive relationship
 */
export function createInactiveRelationship(
  overrides: Partial<SponsorSponseeRelationship> = {}
): SponsorSponseeRelationship {
  const disconnectedAt = new Date().toISOString();

  return createRelationship({
    status: 'inactive',
    disconnected_at: disconnectedAt,
    ...overrides,
  });
}

/**
 * Create a relationship with sponsor and sponsee profiles
 */
export function createRelationshipWithProfiles(
  overrides: Partial<SponsorSponseeRelationship> = {}
): SponsorSponseeRelationship {
  const sponsor = createSponsor();
  const sponsee = createSponsee();

  return createRelationship({
    sponsor_id: sponsor.id,
    sponsee_id: sponsee.id,
    sponsor,
    sponsee,
    ...overrides,
  });
}

/**
 * Create multiple relationships at once
 */
export function createRelationships(
  count: number,
  status?: RelationshipStatus
): SponsorSponseeRelationship[] {
  return Array.from({ length: count }, () => createRelationship({ status }));
}

/**
 * Create a complete sponsor-sponsee pair with relationship
 */
export function createSponsorSponeePair() {
  const sponsor = createSponsor();
  const sponsee = createSponsee();
  const relationship = createRelationship({
    sponsor_id: sponsor.id,
    sponsee_id: sponsee.id,
    sponsor,
    sponsee,
  });

  return { sponsor, sponsee, relationship };
}
