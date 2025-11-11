# Supabase API Documentation

## Overview

This document provides comprehensive API documentation for the Supabase backend integration in the 12-Step Tracker application. The app uses Supabase for authentication, real-time database operations, and row-level security (RLS) policies.

## Table of Contents

1. [Client Setup](#client-setup)
2. [Type Definitions](#type-definitions)
3. [Database Tables](#database-tables)
4. [Authentication](#authentication)
5. [Database Operations](#database-operations)
6. [Row Level Security](#row-level-security)
7. [Common Queries](#common-queries)
8. [Error Handling](#error-handling)

---

## Client Setup

### Initialization

Location: `lib/supabase.ts`

The Supabase client is initialized with platform-aware storage for session persistence.

```typescript
import { supabase } from '@/lib/supabase';
```

### Configuration

The client is configured with:

- **URL**: `EXPO_PUBLIC_SUPABASE_URL` environment variable
- **Anonymous Key**: `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variable
- **Storage Adapter**: Platform-specific (SecureStore for native, localStorage for web)
- **Auto Refresh**: Enabled for automatic session renewal
- **Persist Session**: Enabled for session persistence across app restarts

### Platform-Aware Storage

The client uses a custom storage adapter that automatically selects:

| Platform    | Storage Method                |
| ----------- | ----------------------------- |
| iOS/Android | expo-secure-store (encrypted) |
| Web         | localStorage                  |

```typescript
// Storage adapter automatically handles platform differences
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    /* Platform-specific implementation */
  },
  setItem: (key: string, value: string) => {
    /* Platform-specific implementation */
  },
  removeItem: (key: string) => {
    /* Platform-specific implementation */
  },
};
```

---

## Type Definitions

Location: `types/database.ts`

### Enums

#### UserRole

```typescript
type UserRole = 'sponsor' | 'sponsee' | 'both';
```

User's role in the recovery program:

- `sponsor`: Can guide others through the 12 steps
- `sponsee`: Working through the 12 steps with a sponsor
- `both`: Can be both a sponsor and sponsee

#### RelationshipStatus

```typescript
type RelationshipStatus = 'pending' | 'active' | 'inactive';
```

Status of sponsor-sponsee relationship:

- `pending`: Invitation sent, awaiting acceptance
- `active`: Active sponsorship relationship
- `inactive`: Ended relationship

#### TaskStatus

```typescript
type TaskStatus = 'assigned' | 'in_progress' | 'completed';
```

Status of assigned tasks:

- `assigned`: Task created, not yet started
- `in_progress`: Sponsee actively working on task
- `completed`: Task finished

#### NotificationType

```typescript
type NotificationType =
  | 'task_assigned'
  | 'milestone'
  | 'message'
  | 'connection_request'
  | 'task_completed';
```

Types of in-app notifications.

---

## Database Tables

### profiles

User profile information.

```typescript
interface Profile {
  id: string; // UUID, references auth.users
  email: string; // User's email
  first_name: string; // First name
  last_initial: string; // Last initial
  phone?: string; // Phone number (optional)
  avatar_url?: string; // Avatar image URL (optional)
  role?: UserRole; // User role
  sobriety_date?: string; // Original sobriety start date
  bio?: string; // User biography
  timezone: string; // User's timezone
  notification_preferences: {
    // Notification settings
    tasks: boolean;
    messages: boolean;
    milestones: boolean;
    daily: boolean;
  };
  created_at: string; // Profile creation timestamp
  updated_at: string; // Last update timestamp
}
```

**RLS Policies**:

- Users can view and update their own profile
- Sponsors can view their sponsees' profiles
- Sponsees can view their sponsor's profile

---

### sponsor_sponsee_relationships

Tracks sponsor-sponsee connections.

```typescript
interface SponsorSponseeRelationship {
  id: string; // UUID primary key
  sponsor_id: string; // Sponsor's profile ID
  sponsee_id: string; // Sponsee's profile ID
  status: RelationshipStatus; // Relationship status
  connected_at: string; // When relationship became active
  disconnected_at?: string; // When relationship ended (optional)
  created_at: string; // Record creation timestamp
  sponsor?: Profile; // Populated sponsor profile (join)
  sponsee?: Profile; // Populated sponsee profile (join)
}
```

**RLS Policies**:

- Sponsors can view relationships where they are the sponsor
- Sponsees can view relationships where they are the sponsee
- Only sponsor can create relationships (via invite codes)
- Both parties can update status to 'inactive'

---

### invite_codes

Sponsor invitation system.

```typescript
interface InviteCode {
  id: string; // UUID primary key
  code: string; // Unique invite code
  sponsor_id: string; // Sponsor who created the code
  expires_at: string; // Expiration timestamp
  used_by?: string; // Profile ID of user who used code
  used_at?: string; // When code was used
  created_at: string; // Code creation timestamp
  sponsor?: Profile; // Populated sponsor profile (join)
}
```

**RLS Policies**:

- Sponsors can create and view their own codes
- Anyone can read unexpired, unused codes
- System updates code when used

---

### steps_content

Content for the 12 steps of recovery.

```typescript
interface StepContent {
  id: string; // UUID primary key
  step_number: number; // Step number (1-12)
  title: string; // Step title
  description: string; // Brief description
  detailed_content: string; // Full step content
  reflection_prompts: string[]; // Array of reflection questions
  created_at: string; // Record creation timestamp
  updated_at: string; // Last update timestamp
}
```

**RLS Policies**:

- Public read access for all authenticated users
- Only admins can modify (via database admin)

---

### tasks

Task assignments from sponsors to sponsees.

```typescript
interface Task {
  id: string; // UUID primary key
  sponsor_id: string; // Sponsor who assigned task
  sponsee_id: string; // Sponsee assigned to task
  step_number: number; // Related step (1-12)
  title: string; // Task title
  description: string; // Detailed instructions
  due_date?: string; // Optional due date
  status: TaskStatus; // Current task status
  completion_notes?: string; // Notes added on completion
  completed_at?: string; // Completion timestamp
  created_at: string; // Task creation timestamp
  updated_at: string; // Last update timestamp
  sponsor?: Profile; // Populated sponsor profile (join)
  sponsee?: Profile; // Populated sponsee profile (join)
}
```

**RLS Policies**:

- Sponsors can create tasks for their sponsees
- Sponsors can view tasks they created
- Sponsees can view tasks assigned to them
- Sponsees can update status and completion_notes
- Sponsors can update all fields

---

### slip_ups

Private relapse tracking (formerly called relapses).

```typescript
interface SlipUp {
  id: string; // UUID primary key
  user_id: string; // User's profile ID
  slip_up_date: string; // Date of slip-up
  recovery_restart_date: string; // New recovery start date
  notes?: string; // Optional private notes
  created_at: string; // Record creation timestamp
}
```

**RLS Policies**:

- Strictly private - users can only view/modify their own slip-ups
- No access for sponsors or other users

---

### messages

Direct messaging between sponsors and sponsees.

```typescript
interface Message {
  id: string; // UUID primary key
  sender_id: string; // Message sender's profile ID
  recipient_id: string; // Message recipient's profile ID
  content: string; // Message text
  read_at?: string; // When message was read (optional)
  created_at: string; // Message sent timestamp
  sender?: Profile; // Populated sender profile (join)
  recipient?: Profile; // Populated recipient profile (join)
}
```

**RLS Policies**:

- Sender can view messages they sent
- Recipient can view messages sent to them
- Recipient can update read_at timestamp

---

### notifications

In-app notification system.

```typescript
interface Notification {
  id: string; // UUID primary key
  user_id: string; // Notification recipient
  type: NotificationType; // Notification type
  title: string; // Notification title
  content: string; // Notification message
  read_at?: string; // When notification was read
  related_id?: string; // Related entity ID (task, message, etc.)
  created_at: string; // Notification creation timestamp
}
```

**RLS Policies**:

- Users can only view their own notifications
- System creates notifications via database triggers

---

## Authentication

### Sign Up

Create a new user account.

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
});

if (error) {
  console.error('Sign up error:', error.message);
} else {
  console.log('User created:', data.user);
  // Profile auto-created via database trigger
}
```

**Response**:

- `data.user`: User object
- `data.session`: Authentication session
- Profile is automatically created via database trigger

---

### Sign In

Authenticate existing user.

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123',
});

if (error) {
  console.error('Sign in error:', error.message);
} else {
  console.log('Session:', data.session);
}
```

---

### Sign In with Google OAuth

Authenticate using Google account.

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo:
      Platform.OS === 'web'
        ? window.location.origin
        : '12stepstracker://auth/callback',
  },
});

if (error) {
  console.error('OAuth error:', error.message);
}
```

**Platform Considerations**:

- **Web**: Redirects to current origin
- **Mobile**: Uses deep link scheme `12stepstracker://`

See `GOOGLE_OAUTH_SETUP.md` for configuration details.

---

### Sign Out

End user session.

```typescript
const { error } = await supabase.auth.signOut();

if (error) {
  console.error('Sign out error:', error.message);
} else {
  console.log('User signed out');
}
```

---

### Get Current Session

Retrieve active session.

```typescript
const {
  data: { session },
  error,
} = await supabase.auth.getSession();

if (session) {
  console.log('User ID:', session.user.id);
  console.log('Email:', session.user.email);
}
```

---

### Listen to Auth Changes

Subscribe to authentication state changes.

```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event); // SIGNED_IN, SIGNED_OUT, etc.
  console.log('Session:', session);
});

// Cleanup
subscription.unsubscribe();
```

---

## Database Operations

### Select (Read)

#### Get Single Record

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### Get Multiple Records

```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('sponsee_id', userId)
  .order('due_date', { ascending: true });
```

#### With Joins

```typescript
const { data, error } = await supabase
  .from('tasks')
  .select(
    `
    *,
    sponsor:sponsor_id (
      id,
      first_name,
      last_initial,
      email
    ),
    sponsee:sponsee_id (
      id,
      first_name,
      last_initial
    )
  `,
  )
  .eq('sponsee_id', userId);
```

#### With Filters

```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('sponsee_id', userId)
  .eq('status', 'assigned')
  .gte('due_date', new Date().toISOString());
```

---

### Insert (Create)

#### Single Record

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    sponsor_id: sponsorId,
    sponsee_id: sponseeId,
    title: 'Read Step 1 in Big Book',
    description: 'Read pages 21-24 and journal about powerlessness',
    step_number: 1,
    status: 'assigned',
    due_date: '2025-01-20',
  })
  .select()
  .single();
```

#### Multiple Records

```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert([
    {
      /* task 1 */
    },
    {
      /* task 2 */
    },
    {
      /* task 3 */
    },
  ])
  .select();
```

---

### Update

#### Update Single Record

```typescript
const { data, error } = await supabase
  .from('tasks')
  .update({
    status: 'in_progress',
    updated_at: new Date().toISOString(),
  })
  .eq('id', taskId)
  .select()
  .single();
```

#### Update with Conditions

```typescript
const { data, error } = await supabase
  .from('tasks')
  .update({ status: 'completed', completed_at: new Date().toISOString() })
  .eq('id', taskId)
  .eq('sponsee_id', userId) // Ensure user owns the task
  .select()
  .single();
```

---

### Delete

```typescript
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId)
  .eq('sponsor_id', userId); // Ensure user owns the task
```

---

### Upsert

Insert or update based on unique constraint.

```typescript
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    id: userId,
    first_name: 'John',
    last_initial: 'D',
    updated_at: new Date().toISOString(),
  })
  .select()
  .single();
```

---

## Row Level Security

All tables use Row Level Security (RLS) policies to enforce data access rules at the database level.

### Key Principles

1. **User Isolation**: Users can only access their own data by default
2. **Relationship-Based Access**: Sponsors and sponsees can access each other's relevant data
3. **Privacy Protection**: Slip-ups are strictly private
4. **Message Privacy**: Only sender and recipient can view messages

### Example Policies

#### Profile Access

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Sponsors can view their sponsees' profiles
CREATE POLICY "Sponsors can view sponsee profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT sponsee_id FROM sponsor_sponsee_relationships
      WHERE sponsor_id = auth.uid() AND status = 'active'
    )
  );
```

#### Task Access

```sql
-- Sponsors can insert tasks for their sponsees
CREATE POLICY "Sponsors can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    sponsor_id = auth.uid() AND
    sponsee_id IN (
      SELECT sponsee_id FROM sponsor_sponsee_relationships
      WHERE sponsor_id = auth.uid() AND status = 'active'
    )
  );

-- Sponsees can update their own tasks
CREATE POLICY "Sponsees can update tasks" ON tasks
  FOR UPDATE USING (sponsee_id = auth.uid());
```

---

## Common Queries

### Get User's Profile

```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

---

### Get Active Sponsor-Sponsee Relationships

#### As Sponsor (Get My Sponsees)

```typescript
const { data: relationships, error } = await supabase
  .from('sponsor_sponsee_relationships')
  .select(
    `
    *,
    sponsee:sponsee_id (
      id,
      first_name,
      last_initial,
      email,
      sobriety_date,
      role
    )
  `,
  )
  .eq('sponsor_id', userId)
  .eq('status', 'active');
```

#### As Sponsee (Get My Sponsor)

```typescript
const { data: relationship, error } = await supabase
  .from('sponsor_sponsee_relationships')
  .select(
    `
    *,
    sponsor:sponsor_id (
      id,
      first_name,
      last_initial,
      email,
      phone,
      bio
    )
  `,
  )
  .eq('sponsee_id', userId)
  .eq('status', 'active')
  .single();
```

---

### Get Tasks for Sponsee

```typescript
const { data: tasks, error } = await supabase
  .from('tasks')
  .select(
    `
    *,
    sponsor:sponsor_id (
      id,
      first_name,
      last_initial
    )
  `,
  )
  .eq('sponsee_id', userId)
  .order('due_date', { ascending: true, nullsFirst: false })
  .order('created_at', { ascending: false });
```

---

### Get Tasks Created by Sponsor

```typescript
const { data: tasks, error } = await supabase
  .from('tasks')
  .select(
    `
    *,
    sponsee:sponsee_id (
      id,
      first_name,
      last_initial,
      sobriety_date
    )
  `,
  )
  .eq('sponsor_id', userId)
  .order('created_at', { ascending: false });
```

---

### Get Step Content

#### All Steps

```typescript
const { data: steps, error } = await supabase
  .from('steps_content')
  .select('*')
  .order('step_number', { ascending: true });
```

#### Specific Step

```typescript
const { data: step, error } = await supabase
  .from('steps_content')
  .select('*')
  .eq('step_number', stepNumber)
  .single();
```

---

### Get Messages Between Users

```typescript
const { data: messages, error } = await supabase
  .from('messages')
  .select(
    `
    *,
    sender:sender_id (id, first_name, last_initial),
    recipient:recipient_id (id, first_name, last_initial)
  `,
  )
  .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
  .or(`sender_id.eq.${otherUserId},recipient_id.eq.${otherUserId}`)
  .order('created_at', { ascending: true });
```

---

### Create Invite Code

```typescript
const { data: inviteCode, error } = await supabase
  .from('invite_codes')
  .insert({
    sponsor_id: userId,
    code: generateUniqueCode(), // Your code generation function
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  })
  .select()
  .single();
```

---

### Use Invite Code

```typescript
// 1. Verify code is valid
const { data: inviteCode, error: codeError } = await supabase
  .from('invite_codes')
  .select('*, sponsor:sponsor_id(*)')
  .eq('code', code)
  .is('used_by', null)
  .gt('expires_at', new Date().toISOString())
  .single();

if (codeError || !inviteCode) {
  throw new Error('Invalid or expired code');
}

// 2. Create relationship
const { data: relationship, error: relError } = await supabase
  .from('sponsor_sponsee_relationships')
  .insert({
    sponsor_id: inviteCode.sponsor_id,
    sponsee_id: userId,
    status: 'active',
    connected_at: new Date().toISOString(),
  })
  .select()
  .single();

// 3. Mark code as used
await supabase
  .from('invite_codes')
  .update({
    used_by: userId,
    used_at: new Date().toISOString(),
  })
  .eq('id', inviteCode.id);
```

---

### Get Unread Notifications

```typescript
const { data: notifications, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .is('read_at', null)
  .order('created_at', { ascending: false });
```

---

### Mark Notification as Read

```typescript
const { error } = await supabase
  .from('notifications')
  .update({ read_at: new Date().toISOString() })
  .eq('id', notificationId)
  .eq('user_id', userId);
```

---

## Error Handling

### Standard Error Format

All Supabase operations return an error object with:

```typescript
interface SupabaseError {
  message: string; // Human-readable error message
  details: string; // Additional error details
  hint: string; // Suggestion for fixing the error
  code: string; // Error code
}
```

### Common Error Patterns

#### Check for Errors

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

if (error) {
  console.error('Database error:', error.message);
  // Handle error appropriately
  return;
}

// Use data safely
console.log(data);
```

#### Try-Catch Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('tasks')
    .insert(newTask)
    .select()
    .single();

  if (error) throw error;

  return data;
} catch (error) {
  console.error('Error creating task:', error);
  throw error;
}
```

### Common Errors

| Error Code | Description                 | Solution                                                               |
| ---------- | --------------------------- | ---------------------------------------------------------------------- |
| `PGRST116` | No rows returned            | Check if record exists, or use `.maybeSingle()` instead of `.single()` |
| `23505`    | Unique constraint violation | Record already exists, use different value or upsert                   |
| `23503`    | Foreign key violation       | Referenced record doesn't exist                                        |
| `42501`    | Insufficient privileges     | RLS policy preventing access                                           |
| `401`      | Unauthorized                | User not authenticated                                                 |

### RLS Policy Violations

If you get a permission error, check:

1. **User is authenticated**: Verify session exists
2. **Correct user ID**: Ensure querying with proper user ID
3. **Relationship exists**: For sponsor-sponsee queries, verify active relationship
4. **Policy conditions**: Review RLS policies in Supabase dashboard

---

## Best Practices

### 1. Always Handle Errors

```typescript
const { data, error } = await supabase.from('table').select();
if (error) {
  // Always handle errors
  console.error(error);
  // Show user-friendly message
  // Log for debugging
  return;
}
```

### 2. Use TypeScript Types

```typescript
import { Task, Profile } from '@/types/database';

const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .returns<Task[]>();
```

### 3. Optimize Queries with Specific Selects

```typescript
// Good - only select needed fields
const { data } = await supabase
  .from('profiles')
  .select('id, first_name, last_initial')
  .eq('id', userId)
  .single();

// Avoid - selecting all fields when not needed
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### 4. Use Joins for Related Data

```typescript
// Good - single query with join
const { data } = await supabase
  .from('tasks')
  .select('*, sponsor:sponsor_id(first_name)')
  .eq('sponsee_id', userId);

// Avoid - multiple queries
const { data: tasks } = await supabase.from('tasks').select('*');
for (const task of tasks) {
  const { data: sponsor } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', task.sponsor_id);
}
```

### 5. Use Transactions for Related Operations

When multiple operations must succeed or fail together, consider using Supabase RPC functions with database transactions.

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

_Last Updated: January 2025_
_Version: 1.0_
