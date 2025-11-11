# Database Schema

## Overview

The database is hosted on Supabase (PostgreSQL) with Row Level Security (RLS) policies for multi-tenant data isolation.

## Tables

### profiles

User profile information

- `id` (uuid, PK) - References auth.users
- `role` (enum) - 'sponsor' | 'sponsee' | 'both'
- `sobriety_date` (date) - Original sobriety start date
- `current_step` (integer) - Current step in recovery (1-12)
- `bio` (text) - User biography
- `notification_preferences` (jsonb) - Notification settings
- `created_at`, `updated_at` (timestamp)

**RLS**: Users can view/edit their own profile

### sponsor_sponsee_relationships

Tracks sponsor-sponsee connections

- `id` (uuid, PK)
- `sponsor_id` (uuid, FK → profiles)
- `sponsee_id` (uuid, FK → profiles)
- `status` (enum) - 'pending' | 'active' | 'inactive'
- `created_at` (timestamp)

**RLS**:

- Sponsors can view their sponsees
- Sponsees can view their sponsors

### tasks

Step-based task assignments

- `id` (uuid, PK)
- `sponsor_id` (uuid, FK → profiles)
- `sponsee_id` (uuid, FK → profiles)
- `title` (text)
- `description` (text)
- `step_number` (integer, nullable) - Associated step (1-12), NULL for general tasks not tied to a specific step
- `status` (enum) - 'pending' | 'in_progress' | 'completed'
- `due_date` (date)
- `completed_at` (timestamp)
- `created_at`, `updated_at` (timestamp)

**RLS**:

- Sponsors can create/view tasks for their sponsees
- Sponsees can view/update tasks assigned to them

### messages

Direct messaging between users

- `id` (uuid, PK)
- `sender_id` (uuid, FK → profiles)
- `recipient_id` (uuid, FK → profiles)
- `content` (text)
- `read` (boolean)
- `created_at` (timestamp)

**RLS**: Only sender and recipient can view messages

### steps_content

Content for the 12 steps

- `id` (uuid, PK)
- `step_number` (integer) - Step number (1-12)
- `title` (text)
- `description` (text)
- `reflection_prompts` (text[]) - Array of reflection questions
- `created_at` (timestamp)

**RLS**: Public read access for all authenticated users

### notifications

In-app notifications

- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `type` (enum) - 'task_assigned' | 'message_received' | 'step_completed' | 'relationship_request'
- `content` (text)
- `read` (boolean)
- `related_id` (uuid) - ID of related entity
- `created_at` (timestamp)

**RLS**: Users can only view their own notifications

### relapses

Private relapse tracking

- `id` (uuid, PK)
- `user_id` (uuid, FK → profiles)
- `relapse_date` (date)
- `recovery_restart_date` (date)
- `notes` (text)
- `created_at` (timestamp)

**RLS**: Strictly private - users can only view their own relapses

### invite_codes

Sponsor invitation system

- `id` (uuid, PK)
- `sponsor_id` (uuid, FK → profiles)
- `code` (text, unique)
- `used` (boolean)
- `used_by` (uuid, FK → profiles)
- `expires_at` (timestamp)
- `created_at` (timestamp)

**RLS**:

- Sponsors can view their own invite codes
- Anyone can use a valid code

## Enums

### UserRole

- `sponsor` - Can guide others
- `sponsee` - Being guided
- `both` - Can both guide and be guided

### RelationshipStatus

- `pending` - Awaiting acceptance
- `active` - Active relationship
- `inactive` - Ended relationship

### TaskStatus

- `pending` - Not started
- `in_progress` - Currently working on
- `completed` - Finished

### NotificationType

- `task_assigned` - New task from sponsor
- `message_received` - New direct message
- `step_completed` - Sponsee completed a step
- `relationship_request` - New sponsor/sponsee request

## Security Model

All tables implement Row Level Security (RLS) policies that enforce:

1. **User Isolation**: Users can only access their own data
2. **Relationship-Based Access**: Sponsors and sponsees can view each other's relevant data
3. **Message Privacy**: Only sender and recipient can view messages
4. **Relapse Privacy**: Strictly personal, no sharing even with sponsors

## Migrations

Database schema is defined in `supabase/migrations/` directory.

## Type Definitions

Full TypeScript types are available in `types/database.ts` and should be used for all database operations.
