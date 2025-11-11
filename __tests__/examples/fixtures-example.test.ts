/**
 * Example test demonstrating the use of fixtures and MSW
 * This test shows how to:
 * 1. Use fixture factories to create test data
 * 2. Seed the mock database
 * 3. Test data operations
 */

import { createProfile, createTask, createMessage } from '@/__tests__/fixtures';
import { db, seedDb, resetDb } from '@/mocks/db';

describe('Fixtures Example', () => {
  afterEach(() => {
    // Reset the database after each test
    resetDb();
  });

  it('should create a profile with fixtures', () => {
    // Create a profile using the fixture factory
    const profile = createProfile({
      first_name: 'John',
      last_initial: 'D',
      role: 'sponsor',
    });

    // Verify the profile has the expected properties
    expect(profile.first_name).toBe('John');
    expect(profile.last_initial).toBe('D');
    expect(profile.role).toBe('sponsor');
    expect(profile.id).toBeDefined();
    expect(profile.email).toContain('@example.com');
  });

  it('should create a task with relationships', () => {
    const sponsorProfile = createProfile({ role: 'sponsor' });
    const sponseeProfile = createProfile({ role: 'sponsee' });

    const task = createTask({
      sponsor_id: sponsorProfile.id,
      sponsee_id: sponseeProfile.id,
      title: 'Complete Step 1 reading',
      status: 'assigned',
    });

    expect(task.sponsor_id).toBe(sponsorProfile.id);
    expect(task.sponsee_id).toBe(sponseeProfile.id);
    expect(task.title).toBe('Complete Step 1 reading');
    expect(task.status).toBe('assigned');
  });

  it('should seed the database with fixtures', () => {
    const profiles = [createProfile({ first_name: 'Alice' }), createProfile({ first_name: 'Bob' })];

    // Seed the database
    seedDb({
      profiles: new Map(profiles.map(p => [p.id, p])),
    });

    // Verify profiles are in the database
    expect(db.profiles.size).toBe(2);
    expect(Array.from(db.profiles.values())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ first_name: 'Alice' }),
        expect.objectContaining({ first_name: 'Bob' }),
      ])
    );
  });

  it('should create messages between users', () => {
    const sender = createProfile({ first_name: 'Sender' });
    const recipient = createProfile({ first_name: 'Recipient' });

    const message = createMessage({
      sender_id: sender.id,
      recipient_id: recipient.id,
      content: 'How are you doing with your step work?',
    });

    expect(message.sender_id).toBe(sender.id);
    expect(message.recipient_id).toBe(recipient.id);
    expect(message.content).toBe('How are you doing with your step work?');
    expect(message.read_at).toBeUndefined(); // Unread by default
  });
});
