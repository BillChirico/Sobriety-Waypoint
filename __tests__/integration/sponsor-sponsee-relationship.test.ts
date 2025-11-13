/**
 * Integration Test: Sponsor-Sponsee Relationship Flow
 *
 * Tests the complete flow of establishing a sponsor-sponsee relationship:
 * 1. Sponsor creates invite code
 * 2. Sponsee uses invite code
 * 3. Relationship is established
 * 4. Both users can see the connection
 *
 * Note: These tests use the mock database directly rather than MSW server
 * due to ESM compatibility issues. They test the data flow logic and relationships.
 */

import { db, seedDb, resetDb } from '@/mocks/db';
import {
  createSponsor,
  createSponsee,
  createInviteCode,
  createActiveRelationship,
  createPendingRelationship,
} from '@/__tests__/fixtures';
import type { Profile, InviteCode, SponsorSponseeRelationship } from '@/types/database';

describe('Integration: Sponsor-Sponsee Relationship Flow', () => {
  afterEach(() => {
    resetDb();
  });

  describe('Complete Relationship Establishment', () => {
    it('should establish complete sponsor-sponsee relationship workflow', () => {
      // Arrange: Create sponsor and sponsee profiles
      const sponsor = createSponsor({
        id: 'sponsor-123',
        first_name: 'John',
        last_initial: 'S',
      });
      const sponsee = createSponsee({
        id: 'sponsee-456',
        first_name: 'Jane',
        last_initial: 'S',
      });

      // Act: Step 1 - Sponsor creates invite code
      const inviteCode = createInviteCode({
        id: 'invite-1',
        sponsor_id: sponsor.id,
        code: 'TEST-INVITE-123',
        // Code is active by default (not used, not expired)
      });

      // Seed database with initial data
      seedDb({
        profiles: new Map([
          [sponsor.id, sponsor],
          [sponsee.id, sponsee],
        ]),
        inviteCodes: new Map([[inviteCode.id, inviteCode]]),
      });

      // Assert: Invite code exists in database
      expect(db.inviteCodes.has(inviteCode.id)).toBe(true);
      const storedInviteCode = db.inviteCodes.get(inviteCode.id);
      expect(storedInviteCode?.code).toBe('TEST-INVITE-123');
      expect(storedInviteCode?.sponsor_id).toBe(sponsor.id);
      expect(storedInviteCode?.used_by).toBeUndefined(); // Not used yet = active

      // Act: Step 2 - Sponsee looks up invite code (active = not used)
      const foundInviteCode = Array.from(db.inviteCodes.values()).find(
        code => code.code === 'TEST-INVITE-123' && !code.used_by
      );

      // Assert: Invite code found
      expect(foundInviteCode).toBeDefined();
      expect(foundInviteCode?.sponsor_id).toBe(sponsor.id);

      // Act: Step 3 - Create relationship using the invite code
      const relationship = createActiveRelationship({
        id: 'rel-1',
        sponsor_id: sponsor.id,
        sponsee_id: sponsee.id,
      });

      db.relationships.set(relationship.id, relationship);

      // Assert: Relationship created successfully
      expect(db.relationships.has(relationship.id)).toBe(true);
      const storedRelationship = db.relationships.get(relationship.id);
      expect(storedRelationship?.sponsor_id).toBe(sponsor.id);
      expect(storedRelationship?.sponsee_id).toBe(sponsee.id);
      expect(storedRelationship?.status).toBe('active');

      // Act: Step 4 - Mark the invite code as used
      if (foundInviteCode) {
        foundInviteCode.used_by = sponsee.id;
        foundInviteCode.used_at = new Date().toISOString();
        db.inviteCodes.set(inviteCode.id, foundInviteCode);
      }

      // Assert: Invite code is now used (inactive)
      const updatedInviteCode = db.inviteCodes.get(inviteCode.id);
      expect(updatedInviteCode?.used_by).toBe(sponsee.id);
      expect(updatedInviteCode?.used_at).toBeDefined();

      // Act: Step 5 - Sponsor queries their sponsees
      const sponsorSponsees = Array.from(db.relationships.values()).filter(
        rel => rel.sponsor_id === sponsor.id && rel.status === 'active'
      );

      // Assert: Sponsor can see the sponsee
      expect(sponsorSponsees).toHaveLength(1);
      expect(sponsorSponsees[0].sponsee_id).toBe(sponsee.id);

      // Act: Step 6 - Sponsee queries their sponsor
      const sponseeSponsors = Array.from(db.relationships.values()).filter(
        rel => rel.sponsee_id === sponsee.id && rel.status === 'active'
      );

      // Assert: Sponsee can see the sponsor
      expect(sponseeSponsors).toHaveLength(1);
      expect(sponseeSponsors[0].sponsor_id).toBe(sponsor.id);
    });

    it('should prevent using an already-used invite code', () => {
      // Arrange: Create sponsor and already-used invite code
      const sponsor = createSponsor({ id: 'sponsor-789' });
      const otherSponsee = createSponsee({ id: 'other-sponsee' });
      const usedCode = createInviteCode({
        id: 'invite-2',
        sponsor_id: sponsor.id,
        code: 'USED-CODE',
        used_by: otherSponsee.id,
        used_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Used 1 hour ago
      });

      seedDb({
        profiles: new Map([
          [sponsor.id, sponsor],
          [otherSponsee.id, otherSponsee],
        ]),
        inviteCodes: new Map([[usedCode.id, usedCode]]),
      });

      // Act: Try to look up unused invite code (filtering by used_by being null)
      const foundCode = Array.from(db.inviteCodes.values()).find(
        code => code.code === 'USED-CODE' && !code.used_by
      );

      // Assert: Used code not found when filtering for unused codes
      expect(foundCode).toBeUndefined();

      // Act: Look up without filtering (should find the used code)
      const foundCodeUnfiltered = Array.from(db.inviteCodes.values()).find(
        code => code.code === 'USED-CODE'
      );

      // Assert: Code exists but has been used
      expect(foundCodeUnfiltered).toBeDefined();
      expect(foundCodeUnfiltered?.used_by).toBe(otherSponsee.id);
      expect(foundCodeUnfiltered?.used_at).toBeDefined();
    });

    it('should handle multiple sponsees for one sponsor', () => {
      // Arrange: Create one sponsor and two sponsees
      const sponsor = createSponsor({ id: 'sponsor-multi' });
      const sponsee1 = createSponsee({ id: 'sponsee-1', first_name: 'Alice' });
      const sponsee2 = createSponsee({ id: 'sponsee-2', first_name: 'Bob' });

      const relationship1 = createActiveRelationship({
        id: 'rel-multi-1',
        sponsor_id: sponsor.id,
        sponsee_id: sponsee1.id,
      });
      const relationship2 = createActiveRelationship({
        id: 'rel-multi-2',
        sponsor_id: sponsor.id,
        sponsee_id: sponsee2.id,
      });

      seedDb({
        profiles: new Map([
          [sponsor.id, sponsor],
          [sponsee1.id, sponsee1],
          [sponsee2.id, sponsee2],
        ]),
        relationships: new Map([
          [relationship1.id, relationship1],
          [relationship2.id, relationship2],
        ]),
      });

      // Act: Query sponsor's sponsees
      const sponsees = Array.from(db.relationships.values()).filter(
        rel => rel.sponsor_id === sponsor.id && rel.status === 'active'
      );

      // Assert: Both sponsees are returned
      expect(sponsees).toHaveLength(2);
      const sponseeIds = sponsees.map(r => r.sponsee_id).sort();
      expect(sponseeIds).toEqual([sponsee1.id, sponsee2.id].sort());

      // Verify each relationship
      expect(sponsees.find(r => r.sponsee_id === sponsee1.id)).toBeDefined();
      expect(sponsees.find(r => r.sponsee_id === sponsee2.id)).toBeDefined();
    });

    it('should allow relationship status changes', () => {
      // Arrange: Create active relationship
      const sponsor = createSponsor({ id: 'sponsor-status' });
      const sponsee = createSponsee({ id: 'sponsee-status' });
      const relationship = createActiveRelationship({
        id: 'rel-status',
        sponsor_id: sponsor.id,
        sponsee_id: sponsee.id,
      });

      seedDb({
        profiles: new Map([
          [sponsor.id, sponsor],
          [sponsee.id, sponsee],
        ]),
        relationships: new Map([[relationship.id, relationship]]),
      });

      // Verify initial state
      let storedRelationship = db.relationships.get(relationship.id);
      expect(storedRelationship?.status).toBe('active');

      // Act: Change relationship status to inactive
      if (storedRelationship) {
        storedRelationship.status = 'inactive';
        db.relationships.set(relationship.id, storedRelationship);
      }

      // Act: Query for active relationships
      const activeRelationships = Array.from(db.relationships.values()).filter(
        rel => rel.sponsor_id === sponsor.id && rel.status === 'active'
      );

      // Assert: No active relationships found
      expect(activeRelationships).toHaveLength(0);

      // Act: Query for inactive relationships
      const inactiveRelationships = Array.from(db.relationships.values()).filter(
        rel => rel.sponsor_id === sponsor.id && rel.status === 'inactive'
      );

      // Assert: Inactive relationship found
      expect(inactiveRelationships).toHaveLength(1);
      expect(inactiveRelationships[0].id).toBe(relationship.id);
      expect(inactiveRelationships[0].status).toBe('inactive');
    });

    it('should handle pending relationship approval flow', () => {
      // Arrange: Create sponsor, sponsee, and pending relationship
      const sponsor = createSponsor({ id: 'sponsor-pending' });
      const sponsee = createSponsee({ id: 'sponsee-pending' });
      const pendingRelationship = createPendingRelationship({
        id: 'rel-pending',
        sponsor_id: sponsor.id,
        sponsee_id: sponsee.id,
      });

      seedDb({
        profiles: new Map([
          [sponsor.id, sponsor],
          [sponsee.id, sponsee],
        ]),
        relationships: new Map([[pendingRelationship.id, pendingRelationship]]),
      });

      // Assert: Relationship starts as pending
      expect(pendingRelationship.status).toBe('pending');

      // Act: Sponsor approves the relationship
      const storedRelationship = db.relationships.get(pendingRelationship.id);
      if (storedRelationship) {
        storedRelationship.status = 'active';
        db.relationships.set(pendingRelationship.id, storedRelationship);
      }

      // Assert: Relationship is now active
      const activeRelationship = db.relationships.get(pendingRelationship.id);
      expect(activeRelationship?.status).toBe('active');

      // Act: Query for active relationships
      const activeRelationships = Array.from(db.relationships.values()).filter(
        rel => rel.status === 'active'
      );

      expect(activeRelationships).toHaveLength(1);
      expect(activeRelationships[0].id).toBe(pendingRelationship.id);
    });
  });
});
