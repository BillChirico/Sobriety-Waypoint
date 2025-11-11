/*
  # Create Task Templates for 12 Steps

  ## Overview
  This migration creates pre-populated task templates for each of the 12 steps,
  making it easier for sponsors to assign standardized tasks to their sponsees.

  ## New Tables

  1. **task_templates**
    - `id` (uuid, primary key)
    - `step_number` (integer, 1-12)
    - `title` (text)
    - `description` (text)
    - `is_default` (boolean, marks system-provided templates)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on task_templates table
  - All authenticated users can view templates
  - Only system can create default templates (is_default = true)

  ## Template Content
  Pre-populated with suggested tasks for each of the 12 steps to guide sponsors
  in assigning meaningful work to their sponsees.
*/

-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number integer NOT NULL CHECK (step_number >= 1 AND step_number <= 12),
  title text NOT NULL,
  description text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view task templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default task templates for each step
INSERT INTO task_templates (step_number, title, description, is_default) VALUES
  -- Step 1: We admitted we were powerless over alcohol
  (1, 'Write Your Story', 'Write about the first time you realized you had a problem with alcohol. Describe specific situations where you felt powerless.', true),
  (1, 'List Examples of Powerlessness', 'Make a list of at least 5 specific examples where alcohol made your life unmanageable.', true),
  (1, 'Reflect on Consequences', 'Journal about the consequences you''ve faced due to drinking. Include relationships, work, health, and finances.', true),
  
  -- Step 2: Came to believe that a Power greater than ourselves could restore us to sanity
  (2, 'Define Your Higher Power', 'Write about what a Higher Power means to you. This can be God, nature, the group, or any power greater than yourself.', true),
  (2, 'Reflect on Past Attempts', 'List all the times you tried to control your drinking on your own. What was the result?', true),
  (2, 'Write About Hope', 'Describe moments where you''ve seen others recover. What gives you hope that you can recover too?', true),
  
  -- Step 3: Made a decision to turn our will and our lives over to the care of God
  (3, 'Write a Decision Statement', 'Write a personal statement declaring your decision to turn your will and life over to your Higher Power.', true),
  (3, 'Identify What You''re Surrendering', 'List specific areas of your life where you''ve been trying to control outcomes. What are you willing to surrender?', true),
  (3, 'Daily Prayer Practice', 'Establish a daily prayer or meditation practice. Record your thoughts each day for one week.', true),
  
  -- Step 4: Made a searching and fearless moral inventory of ourselves
  (4, 'Resentment Inventory', 'List all your resentments. For each one, identify who/what, what happened, what part of you was affected, and your role in it.', true),
  (4, 'Fear Inventory', 'Write about your fears. What are you afraid of? How have these fears controlled your behavior?', true),
  (4, 'Sexual Conduct Inventory', 'Reflect on your sexual conduct. Where have you been selfish, dishonest, or hurtful to others?', true),
  (4, 'Character Defects List', 'Identify patterns in your behavior. What character defects keep showing up in your life?', true),
  
  -- Step 5: Admitted to God, to ourselves, and to another human being the exact nature of our wrongs
  (5, 'Prepare for Fifth Step', 'Review your Fourth Step inventory thoroughly. Organize your thoughts and prepare to share with your sponsor.', true),
  (5, 'Schedule Fifth Step Meeting', 'Set a time and place to meet with your sponsor to complete your Fifth Step. Allow several uninterrupted hours.', true),
  (5, 'Post-Fifth Step Reflection', 'After completing your Fifth Step, write about how you feel. What insights did you gain? What relief do you feel?', true),
  
  -- Step 6: Were entirely ready to have God remove all these defects of character
  (6, 'Review Character Defects', 'List all the character defects you identified in Step 4. Are you willing to have them removed?', true),
  (6, 'Identify Reluctance', 'Write about any defects you''re reluctant to let go of. Why? What would life be like without them?', true),
  (6, 'Prayer for Willingness', 'Write a prayer asking your Higher Power to make you willing to have your defects removed.', true),
  
  -- Step 7: Humbly asked Him to remove our shortcomings
  (7, 'Write Step Seven Prayer', 'Write your own version of the Step Seven prayer, asking your Higher Power to remove your shortcomings.', true),
  (7, 'Practice Humility', 'Identify three ways you can practice humility this week. Report back on your experience.', true),
  (7, 'Daily Shortcoming Check', 'Each day for one week, review your behavior. Note when shortcomings appear and pray for their removal.', true),
  
  -- Step 8: Made a list of all persons we had harmed, and became willing to make amends to them all
  (8, 'Create Amends List', 'Make a comprehensive list of everyone you''ve harmed. Include what you did and how it affected them.', true),
  (8, 'Explore Your Willingness', 'For each person on your list, write about your willingness to make amends. What hesitations do you have?', true),
  (8, 'Consider Delayed Amends', 'Identify any amends that should wait. Discuss with your sponsor which amends might cause more harm.', true),
  
  -- Step 9: Made direct amends to such people wherever possible, except when to do so would injure them or others
  (9, 'Prioritize Your Amends', 'With your sponsor, prioritize your amends list. Which ones should be made first?', true),
  (9, 'Plan Specific Amends', 'For your first three amends, write out what you plan to say. Practice with your sponsor.', true),
  (9, 'Financial Amends Plan', 'If you owe money or have stolen, create a realistic plan to make financial amends.', true),
  (9, 'Record Your Progress', 'After each amend, write about the experience. How did it go? What did you learn?', true),
  
  -- Step 10: Continued to take personal inventory and when we were wrong promptly admitted it
  (10, 'Establish Daily Inventory', 'Begin a daily practice of reviewing your day. Note where you were right and where you were wrong.', true),
  (10, 'Spot-Check Inventory', 'When you feel disturbed, immediately take a spot-check inventory. What''s really bothering you? What''s your part?', true),
  (10, 'Prompt Amends Practice', 'This week, make at least three prompt amends when you realize you''ve been wrong.', true),
  
  -- Step 11: Sought through prayer and meditation to improve our conscious contact with God
  (11, 'Morning Meditation Practice', 'Establish a morning meditation practice. Spend at least 10 minutes in quiet reflection daily.', true),
  (11, 'Evening Review', 'Each evening, review your day and give thanks for the good. Ask for guidance for tomorrow.', true),
  (11, 'Study Spiritual Texts', 'Read spiritual literature daily for 15 minutes. Journal about insights you gain.', true),
  (11, 'Develop Personal Prayers', 'Write personal prayers that express your needs, gratitude, and desire for guidance.', true),
  
  -- Step 12: Having had a spiritual awakening, we tried to carry this message to alcoholics
  (12, 'Share Your Story', 'Write your complete story including what it was like, what happened, and what it''s like now.', true),
  (12, 'Practice These Principles', 'Identify the 12 Step principles. Write about how you can practice them in all your affairs.', true),
  (12, 'Service Commitment', 'Take on a service commitment in your recovery community. Report weekly on your experience.', true),
  (12, 'Be Available', 'Make yourself available to help other alcoholics. Answer calls, attend meetings, offer support.', true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_task_templates_step ON task_templates(step_number);
