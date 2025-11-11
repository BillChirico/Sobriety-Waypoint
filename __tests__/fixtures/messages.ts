/**
 * Message fixtures for testing
 */

import type { Message } from '@/types/database';
import { createSponsor, createSponsee } from './profiles';

let messageCounter = 0;

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `message-${Date.now()}-${messageCounter++}`;
}

/**
 * Create a message fixture with optional overrides
 */
export function createMessage(overrides: Partial<Message> = {}): Message {
  const id = overrides.id || generateMessageId();
  const senderId = overrides.sender_id || 'user-123';
  const recipientId = overrides.recipient_id || 'user-456';

  return {
    id,
    sender_id: senderId,
    recipient_id: recipientId,
    content: overrides.content || 'Hey! How are you doing with your step work?',
    read_at: overrides.read_at,
    created_at: overrides.created_at || new Date().toISOString(),
    sender: overrides.sender,
    recipient: overrides.recipient,
  };
}

/**
 * Create an unread message
 */
export function createUnreadMessage(overrides: Partial<Message> = {}): Message {
  return createMessage({
    read_at: undefined,
    ...overrides,
  });
}

/**
 * Create a read message
 */
export function createReadMessage(overrides: Partial<Message> = {}): Message {
  return createMessage({
    read_at: new Date().toISOString(),
    ...overrides,
  });
}

/**
 * Create a message with sender and recipient profiles
 */
export function createMessageWithProfiles(overrides: Partial<Message> = {}): Message {
  const sender = createSponsor();
  const recipient = createSponsee();

  return createMessage({
    sender_id: sender.id,
    recipient_id: recipient.id,
    sender,
    recipient,
    ...overrides,
  });
}

/**
 * Create a conversation (array of messages back and forth)
 */
export function createConversation(
  user1Id: string,
  user2Id: string,
  messageCount: number = 5
): Message[] {
  const messages: Message[] = [];

  for (let i = 0; i < messageCount; i++) {
    const isUser1Sender = i % 2 === 0;

    messages.push(
      createMessage({
        sender_id: isUser1Sender ? user1Id : user2Id,
        recipient_id: isUser1Sender ? user2Id : user1Id,
        content: `Message ${i + 1} in conversation`,
        created_at: new Date(Date.now() - (messageCount - i) * 60000).toISOString(),
        read_at: i < messageCount - 2 ? new Date().toISOString() : undefined,
      })
    );
  }

  return messages;
}

/**
 * Create multiple messages at once
 */
export function createMessages(count: number): Message[] {
  return Array.from({ length: count }, () => createMessage());
}
